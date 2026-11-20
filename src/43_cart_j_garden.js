/* ============================================================
   ART CART — THE GARDEN, Turbo Escargot's career track (level agent "snail", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example). A sunny back garden seen at snail
   size: grass blades taller than the karts, toadstools like houses, sunflowers like towers, a picket fence like a
   city wall. The road is a packed-earth garden path. One lap of about 1.15 km:
     PATIO STRAIGHT    the start, under a garden HOSE that loops over the road like an arch, terracotta pots
     GNOME ROCKERY     the east side: three GARDEN GNOMES stand on the rocks. One crouches and wobbles while a
                       target ring flashes on the road (1.1 s), then JUMPS into it (flips anyone it lands on) and
                       stands guard there for a couple of seconds (bump it and you bounce off). Steer off the ring
     THE LAWN          the north straight: a giant impact LAWN SPRINKLER beside the road. It ticks and the wedge
                       it will water flashes blue (1.25 s), then its jet sweeps right across the road: caught cars
                       are shoved aside and soaked. Time your pass, or HOP the jet as it reaches you
     SLUG CROSSING     the north-west bend through the cabbage patch: two giant SLUGS crawl across the road and
                       back, each rearing up first (its path flashes green). Their SLIME TRAILS glisten across the
                       road: drive through and you're slowed (HOP the slime line); bump a slug and you're knocked.
                       Slime is snail fuel: TURBO ESCARGOT gets a boost off every trail instead
     HOSE RIVER        the west straight beside the leaking hose's river: a HUNGRY ROBIN on the bird bath picks a
                       car, a target locks onto the road ahead of it (1.35 s), then the robin swoops and PECKS:
                       swerve off the target. It stays to peck the ground a moment (don't hit it), then flies home
   TURBO ESCARGOT's SHELL BOUNCE is in everyone's gift boxes here (CART_TRACKS.garden.car = 'snail').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'garden' }) (or mode 'quick').
   Globals are prefixed GDN_ / gdn, level state lives on E.gdn and s.gdn.
   ============================================================ */
const GDN_C = { white: [1, 1, 1], black: [0, 0, 0], blue: [0.3, 0.62, 1], deep: [0.12, 0.4, 0.85], water: [0.6, 0.86, 1], aqua: [0.4, 0.9, 1], slime: [0.62, 1, 0.3], slimeHi: [0.85, 1, 0.55], green: [0.35, 0.85, 0.3], red: [1, 0.25, 0.25], hot: [1, 0.35, 0.2], warn: [1, 0.7, 0.2], yellow: [1, 0.9, 0.3], soil: [0.45, 0.32, 0.2], feather: [0.55, 0.38, 0.25] };
const GDN_T = { at: {}, at2: {}, p: {} };
const GDN_SLIME_RIM = [0.12, 0.32, 0.06];

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the patio straight (south, heading east), the gnome rockery (east, a dogleg inward), the
// lawn (north, heading west), the slug crossing (the inward kink, north-west), the hose river (west, heading south)
const GDN_POLY = [[-200, -110, 40], [130, -120, 36], [200, -40, 30], [150, 40, 20], [210, 120, 30], [100, 178, 40], [-60, 152, 30], [-120, 62, 22], [-212, 40, 34]];
const gdnWidth = (x, z) => (x < -50 && x > -140 && z > 40 && z < 160 ? 1.12 : 1);   // the slug crossing is a little wider
// registries (this file sorts before 43_cart_j_kit.js: assign through the same guards, never redeclare)
var CART_TRACK_RULES = (typeof CART_TRACK_RULES !== 'undefined' && CART_TRACK_RULES) || {};
var CART_CAREER_TRACKS = (typeof CART_CAREER_TRACKS !== 'undefined' && CART_CAREER_TRACKS) || {};
CART_TRACKS.garden = {
  name: 'THE GARDEN', car: 'snail', tod: 'day', music: 'kart2', width: 20, shoulder: 6, theme: 'garden', blurb: 'Gnomes, slugs, a sprinkler and a hungry robin',
  get pts() { return this._pts || (this._pts = CartKit.course(GDN_POLY, { start: [-60, -114], width: gdnWidth, step: 18 })); },   // lazy: the kit loads after this file
  world: (id, D) => gdnWorld(id, D)
};
CART_CAREER_TRACKS.snail = 'garden';

/* ---------------- shapes shared by the static and the moving pieces ---------------- */
// a garden gnome facing +z, about 4.9 m tall at scale 1 (blue coat, red pointy hat, white beard)
function gdnGnome(m, lo, coat, hat) {
  const sg = lo ? 9 : 14, rg = lo ? 6 : 9;
  m.color('#4a2a1a').shine(2); for (const sd of [-1, 1]) m.ellipsoid(sd * 0.45, 0.25, 0.2, 0.42, 0.26, 0.62, { seg: sg - 4, rings: rg - 3 });
  m.color(coat || '#2a6ad8').shine(1); m.lathe([[0.01, 0.3], [1.1, 0.36], [1.04, 1.2], [0.86, 1.9], [0.58, 2.2], [0.01, 2.26]], { seg: sg + 2 });
  m.color('#1e1a1a').shine(3); m.torus(0, 1.22, 0, 1.0, 0.13, { seg: sg + 2, tseg: 5 });
  m.color('#ffd23a').shine(4); m.roundBox(0, 1.22, 1.02, 0.42, 0.34, 0.12, 0.05);
  m.color(coat || '#2a6ad8').shine(1); for (const sd of [-1, 1]) m.limb(sd * 0.78, 1.92, 0, sd * 1.05, 1.3, 0.55, 0.26, 0.22, { seg: sg - 4 });
  m.color('#ffc8a0').shine(1); for (const sd of [-1, 1]) m.ball(sd * 1.05, 1.22, 0.62, 0.26, { seg: sg - 4, rings: rg - 3 });
  m.ball(0, 2.66, 0.12, 0.56, { seg: sg, rings: rg });
  m.color('#ffffff').shine(1); m.ellipsoid(0, 2.08, 0.42, 0.62, 0.78, 0.46, { seg: sg, rings: rg }); m.ellipsoid(0, 2.5, 0.52, 0.5, 0.16, 0.2, { seg: sg - 4, rings: rg - 4 });
  m.color('#ff8a8a').shine(2); m.ball(0, 2.64, 0.66, 0.2, { seg: sg - 4, rings: rg - 3 });
  m.color('#1a1418').shine(4); for (const sd of [-1, 1]) m.ball(sd * 0.22, 2.84, 0.56, 0.075, { seg: 6, rings: 4 });
  m.color(hat || '#e8302a').shine(2); m.push(); m.tf(0, 2.9, -0.05, 0, -0.22, 0); m.lathe([[0.64, 0], [0.5, 0.6], [0.3, 1.3], [0.08, 1.9], [0.01, 2.05]], { seg: sg + 2 }); m.pop();
  m.shine(0);
}
// a slug facing +z, about 6.6 m long (glossy, leopard-spotted, eye stalks up)
function gdnSlug(m, lo) {
  const sg = lo ? 10 : 16, rg = lo ? 6 : 9;
  m.color('#e8c870').shine(4); m.ellipsoid(0, 0.22, 0, 1.4, 0.26, 3.3, { seg: sg, rings: rg - 2 });
  m.color('#c89a3a').shine(4); m.ellipsoid(0, 0.62, -0.1, 1.12, 0.66, 3.05, { seg: sg, rings: rg });
  m.color('#9a6a2a').shine(4); m.ellipsoid(0, 1.06, 0.9, 1.0, 0.5, 1.45, { seg: sg, rings: rg });
  m.color('#c89a3a').shine(4); m.ellipsoid(0, 0.78, 2.6, 0.82, 0.62, 0.8, { seg: sg - 2, rings: rg - 2 });
  m.color('#5a3a1a').shine(3); for (let i = 0; i < 12; i++) { const z = -2.3 + (i * 0.37 % 1) * 4.2, sd = i % 2 ? 1 : -1, x = sd * (0.35 + (i * 0.618 % 1) * 0.5), y = 0.62 + Math.sqrt(Math.max(0.05, 1 - (x / 1.12) ** 2 - (z / 3.05) ** 2)) * 0.62; m.ball(x, y, z, 0.13 + (i % 3) * 0.04, { seg: 6, rings: 4 }); }
  m.color('#b88a38').shine(3); for (const sd of [-1, 1]) { m.limb(sd * 0.28, 1.15, 2.85, sd * 0.6, 2.5, 3.35, 0.13, 0.09, { seg: 6 }); m.limb(sd * 0.32, 0.62, 3.25, sd * 0.62, 0.45, 3.85, 0.09, 0.06, { seg: 5 }); }
  m.color('#2a1a10').shine(4); for (const sd of [-1, 1]) m.ball(sd * 0.62, 2.58, 3.38, 0.22, { seg: 8, rings: 6 });
  m.color('#ffffff'); for (const sd of [-1, 1]) m.ball(sd * 0.66, 2.66, 3.52, 0.06, { seg: 4, rings: 3 });
  m.shine(0);
}

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// the start gate: a garden hose looped over the road (a brass tap on a post at one foot, a coil at the other).
// Local x runs across the road; the arch's lowest point over the road is 10 m up
function gdnHoseArch(m, W) {
  const h = 10, top = 4.5, pts = [];
  for (let i = 0; i <= 4; i++) pts.push([-W / 2, i / 4 * h]);
  for (let i = 1; i < 20; i++) { const u = i / 20; pts.push([-W / 2 + u * W, h + Math.sin(u * Math.PI) * top]); }
  for (let i = 4; i >= 0; i--) pts.push([W / 2, i / 4 * h]);
  m.color('#3aa84a').shine(3);
  for (let i = 0; i < pts.length - 1; i++) m.limb(pts[i][0], pts[i][1], 0, pts[i + 1][0], pts[i + 1][1], 0, 0.85, 0.85, { seg: 12, ends: i === 0 });
  m.color('#ffe24a').shine(2);
  for (let i = 0; i < pts.length - 1; i += 2) m.limb(pts[i][0], pts[i][1], 0.78, pts[i + 1][0], pts[i + 1][1], 0.78, 0.16, 0.16, { seg: 5, ends: false });
  // the tap: a brick post, a brass tap, a hose connector
  m.color('#b85a3a').shine(0); m.roundBox(-W / 2 - 2.2, 3.5, 0, 2.4, 7, 2.4, 0.3);
  m.color('#e8b048').shine(4); m.limb(-W / 2 - 1.1, 5.2, 0, -W / 2 - 0.2, 5.2, 0, 0.5, 0.45, { seg: 10 }); m.ball(-W / 2 - 1.2, 6.2, 0, 0.45, { seg: 10, rings: 8 }); m.limb(-W / 2 - 1.9, 6.4, 0, -W / 2 - 0.5, 6.4, 0, 0.16, 0.16, { seg: 6 });
  m.limb(-W / 2 - 0.3, 5.2, 0, -W / 2, 4.6, 0, 0.6, 0.6, { seg: 10 });
  // the coil at the other foot
  m.color('#3aa84a').shine(3); for (let i = 0; i < 3; i++) m.torus(W / 2 + 3.4, 0.8 + i * 1.5, 0, 3.0 - i * 0.2, 0.8, { seg: 22, tseg: 8 });
  m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1, y0: 0, y1: h, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1, y0: 0, y1: h, camPass: true }, { t: 'box', x: -W / 2 - 2.2, z: 0, hx: 1.2, hz: 1.2, y0: 0, y1: 7 }, { t: 'cyl', x: W / 2 + 3.4, z: 0, r: 3.8, y0: 0, y1: 4.5 }] };
}
// a sunflower as tall as a tower (the head faces +z)
function gdnSunflower(m, H) {
  m.color('#4a9a3a').shine(1); m.limb(0, 0, 0, 0.4, H * 0.5, 0.2, 0.9, 0.75, { seg: 12 }); m.limb(0.4, H * 0.5, 0.2, 0, H, 0.6, 0.75, 0.6, { seg: 12 });
  m.color('#5ab048').shine(1);
  for (let i = 0; i < 5; i++) { const y = H * (0.18 + i * 0.15), a = i * 2.4; m.push(); m.tf(Math.sin(a) * 2.4, y, Math.cos(a) * 2.4, a, 0.5, 0); m.ellipsoid(0, 0, 0, 1.7, 0.18, 3.0, { seg: 12, rings: 6 }); m.pop(); }
  m.push(); m.tf(0, H, 0.8, 0, -0.35, 0);
  m.color('#6a3a1a').shine(2); m.ellipsoid(0, 0, 0, 3.4, 3.4, 0.9, { seg: 22, rings: 10 });
  m.color('#3a2010'); for (let i = 0; i < 30; i++) { const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 30) * 2.9; m.ball(Math.cos(a) * r, Math.sin(a) * r, 0.7, 0.26, { seg: 5, rings: 3 }); }
  m.color('#ffc81e').shine(2); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; m.push(); m.tf(Math.cos(a) * 4.6, Math.sin(a) * 4.6, 0.1, 0, 0, a - Math.PI / 2); m.ellipsoid(0, 0, 0, 0.9, 2.0, 0.22, { seg: 8, rings: 5 }); m.pop(); }
  m.color('#ffb01a'); for (let i = 0; i < 18; i++) { const a = (i + 0.5) / 18 * TAU; m.push(); m.tf(Math.cos(a) * 4.2, Math.sin(a) * 4.2, -0.2, 0, 0, a - Math.PI / 2); m.ellipsoid(0, 0, 0, 0.8, 1.7, 0.2, { seg: 8, rings: 5 }); m.pop(); }
  m.pop(); m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.2, y0: 0, y1: H }] };
}
// a giant watering can (spout along +z)
function gdnWateringCan(m) {
  m.color('#3aa890').shine(4); m.lathe([[6, 0], [6.2, 0.5], [6.2, 11], [5.6, 12], [0, 12.2]], { seg: 32 });
  m.color('#2a8a74'); m.torus(0, 11.4, 0, 6.0, 0.35, { seg: 32, tseg: 5 }); m.torus(0, 0.6, 0, 6.1, 0.3, { seg: 32, tseg: 5 });
  m.color('#3aa890'); m.limb(0, 3, 5.6, 0, 14, 14, 1.3, 0.8, { seg: 14 });
  m.color('#e8b048').shine(4); m.push(); m.tf(0, 14.4, 14.6, 0, 0.9, 0); m.lathe([[0.8, -0.6], [2.0, 0.8], [2.0, 1.0], [0, 1.05]], { seg: 18 }); m.pop();
  m.color('#3aa890').shine(4); m.push(); m.tf(0, 12, -2.5, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 5.2, 0.7, { seg: 20, tseg: 7 }); m.pop();
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 6.3, y0: 0, y1: 12 }] };
}
// the robin's bird bath: a stone pedestal and bowl full of water
function gdnBirdBath(m) {
  m.color('#c8c0b0').shine(1); m.lathe([[3.2, 0], [3.0, 0.8], [1.4, 1.4], [1.1, 5.5], [1.6, 6.4], [5.4, 7.2], [5.8, 7.9], [5.2, 8.1], [0, 7.4]], { seg: 28 });
  m.color('#8ad4f4', 0.08).shine(4); m.disc(0, 7.85, 0, 5.1, 26); m.emissive(0);
  m.color('#9ab070').shine(0); for (let i = 0; i < 7; i++) { const a = i * 0.9; m.ball(Math.cos(a) * 5.2, 7.8, Math.sin(a) * 5.2, 0.5, { seg: 6, rings: 4 }); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 8 }] };
}
// a boulder for the rockery (grey, lumpy)
function gdnRock(m, r) {
  m.color('#a8a49a').shine(1); m.ellipsoid(0, r * 0.45, 0, r, r * 0.7, r * 0.85, { seg: 12, rings: 8 });
  m.color('#bcb8ae'); m.ellipsoid(r * 0.35, r * 0.7, -r * 0.2, r * 0.55, r * 0.45, r * 0.5, { seg: 10, rings: 6 });
  m.color('#7aa04a'); m.ellipsoid(-r * 0.3, r * 0.95, r * 0.1, r * 0.45, r * 0.12, r * 0.4, { seg: 8, rings: 4 });
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: r * 0.9, y0: 0, y1: r * 1.1 }] };
}
// a stretch of picket fence (the garden's far wall at snail size): pickets with pointed tops, two rails
function gdnFence(m, L, H) {
  const w = 3.2, gap = 1.2;
  m.color('#f4f0e6').shine(1);
  for (let x = -L / 2; x < L / 2; x += w + gap) {
    m.box(x + w / 2, H / 2, 0, w, H, 0.8);
    const c = [x + w / 2, H + 0.3, 0];   // an inside point: the faces point away from it
    m.poly([[x, H, 0.4], [x + w, H, 0.4], [x + w / 2, H + w * 0.6, 0.4]], null, c);
    m.poly([[x + w, H, -0.4], [x, H, -0.4], [x + w / 2, H + w * 0.6, -0.4]], null, c);
    m.poly([[x, H, -0.4], [x, H, 0.4], [x + w / 2, H + w * 0.6, 0.4], [x + w / 2, H + w * 0.6, -0.4]], null, c);
    m.poly([[x + w, H, 0.4], [x + w, H, -0.4], [x + w / 2, H + w * 0.6, -0.4], [x + w / 2, H + w * 0.6, 0.4]], null, c);
  }
  m.color('#dcd6c8'); m.box(0, H * 0.25, -0.9, L, 1.6, 1); m.box(0, H * 0.75, -0.9, L, 1.6, 1);
  m.shine(0);
  return { cols: [] };
}
// a cabbage (the slugs' patch)
function gdnCabbage(m, r) {
  m.color('#a8d870').shine(2); m.ball(0, r * 0.8, 0, r * 0.75, { seg: 14, rings: 10 });
  m.color('#7ab850').shine(1); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; m.push(); m.tf(Math.sin(a) * r * 0.75, r * 0.55, Math.cos(a) * r * 0.75, a, -0.9, 0); m.ellipsoid(0, 0, 0, r * 0.6, r * 0.08, r * 0.8, { seg: 10, rings: 5 }); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: r * 1.1, y0: 0, y1: r * 1.4 }] };
}
// a toppled terracotta pot spilling soil (patio set piece)
function gdnFallenPot(m) {
  m.color('#d8743a').shine(1); m.push(); m.tf(0, 4.2, 0, 0, Math.PI / 2 - 0.08, 0); m.lathe([[3.2, -4.6], [4.4, 4.2], [4.9, 4.4], [4.9, 5.4], [4.2, 5.4], [3.9, 4.6], [2.8, -3.8], [0, -3.8]], { seg: 24 }); m.pop();
  m.color('#5a3a22').shine(0); m.ellipsoid(0, 0.6, 7.5, 5, 1.4, 4, { seg: 14, rings: 6 });
  m.color('#4a9a3a').shine(1); for (let i = 0; i < 4; i++) m.limb(i - 1.5, 1, 7.5, i * 2 - 3, 4 + i, 10 + i * 0.5, 0.25, 0.1, { seg: 5 });
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 4.8, hz: 5.5, y0: 0, y1: 8.6 }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const GDN_KINDS = {
  // a toadstool (red cap, white spots; tint for orange / violet)
  gdn_shroom: { r: 2.6, near: 40, mid: 140, farD: 340,
    build(m) {
      const sg = m.lo ? 10 : 18;
      m.color('#f6eedc').shine(1); m.lathe([[1.1, 0], [0.9, 2.5], [0.8, 4.6], [0.01, 4.7]], { seg: sg });
      m.color('#fff4e4'); m.lathe([[1.0, 3.6], [1.6, 3.4], [1.5, 3.25], [0.9, 3.4]], { seg: sg });
      m.color('#e8302a').shine(3); m.ellipsoid(0, 4.4, 0, 3.2, 1.9, 3.2, { seg: sg, rings: m.lo ? 5 : 8, phi1: Math.PI / 2 });
      m.color('#f4e0c8').shine(1); m.disc(0, 4.4, 0, 3.15, sg, { both: true });
      m.color('#ffffff').shine(2); for (let i = 0; i < 9; i++) { const a = i * 2.39996, f = 0.25 + (i % 3) * 0.22, x = Math.cos(a) * 3.2 * f, z = Math.sin(a) * 3.2 * f, y = 4.4 + 1.9 * Math.sqrt(Math.max(0, 1 - f * f)); m.ellipsoid(x, y, z, 0.42, 0.14, 0.42, { seg: 7, rings: 3 }); }
      m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.2, y0: 0, y1: 6.3 }] };
    },
    far(m) { m.color('#f6eedc'); m.cyl(0, 0, 0, 1, 0.8, 4.4, 6); m.color('#e8302a'); m.ellipsoid(0, 4.4, 0, 3.2, 1.9, 3.2, { seg: 7, rings: 3, phi1: Math.PI / 2 }); } },
  // a flower: a tall stem, broad leaves, petals round a yellow middle (petals near-white: the tint colours them)
  gdn_flower: { r: 1.8, near: 36, mid: 120, farD: 300, soft: 0.25,
    build(m) {
      m.color('#5ab048').shine(1); m.limb(0, 0, 0, 0.3, 9, 0.2, 0.28, 0.22, { seg: m.lo ? 5 : 8 });
      for (const [y, a] of [[2.5, 0.4], [4.2, 2.6]]) { m.push(); m.tf(Math.sin(a) * 1.2, y, Math.cos(a) * 1.2, a, 0.6, 0); m.ellipsoid(0, 0, 0, 0.6, 0.08, 1.5, { seg: 8, rings: 4 }); m.pop(); }
      m.push(); m.tf(0.3, 9.2, 0.2, 0, -0.5, 0);
      m.color('#ffffff').shine(2); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU; m.push(); m.tf(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0, 0, 0, a - Math.PI / 2); m.ellipsoid(0, 0, 0, 0.6, 1.0, 0.16, { seg: m.lo ? 6 : 9, rings: 4 }); m.pop(); }
      m.color('#ffc81e').shine(2); m.ellipsoid(0, 0, 0.15, 0.6, 0.6, 0.35, { seg: 10, rings: 6 });
      m.pop(); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 9, camPass: true }] };
    },
    far(m) { m.color('#5ab048'); m.box(0, 4.5, 0, 0.4, 9, 0.4); m.color('#ffffff'); m.ball(0.3, 9.2, 0.2, 1.4, { seg: 6, rings: 4 }); } },
  // a clump of grass blades taller than a kart
  gdn_grass: { r: 1.4, near: 34, mid: 110, farD: 240,
    build(m) {
      const n = m.lo ? 5 : 8;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + i * 0.7, h = 3.2 + ((i * 0.618) % 1) * 3.4, lean = 0.25 + ((i * 0.37) % 1) * 0.35; m.color(i % 3 ? '#5aa83a' : '#7ac44a').shine(1); m.push(); m.tf(Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5, a, lean, 0); m.lathe([[0.32, 0], [0.22, h * 0.5], [0.01, h]], { seg: 4 }); m.pop(); }
      m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 3, camPass: true }] };
    },
    far(m) { m.color('#5aa83a'); m.lathe([[1.2, 0], [0.01, 4.5]], { seg: 4 }); } },
  // a big leafy plant (broad leaves fanning out of the ground)
  gdn_leaf: { r: 4.5, near: 40, mid: 130, farD: 300,
    build(m) {
      const n = m.lo ? 5 : 7;
      for (let i = 0; i < n; i++) { const a = i / n * TAU + 0.3, L = 3.4 + (i % 3) * 0.6; m.color(i % 2 ? '#3a8a3a' : '#4aa040').shine(2); m.push(); m.tf(Math.sin(a) * L * 0.8, 1.2 + (i % 2) * 0.6, Math.cos(a) * L * 0.8, a, -0.55, 0); m.ellipsoid(0, 0, 0, L * 0.55, 0.14, L, { seg: m.lo ? 8 : 12, rings: 5 }); m.color('#8ac860'); m.box(0, 0.13, 0, 0.14, 0.06, L * 1.8); m.pop(); }
      m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3, y0: 0, y1: 2.5, camPass: true }] };
    },
    far(m) { m.color('#3a8a3a'); m.ellipsoid(0, 1, 0, 4.5, 1.2, 4.5, { seg: 6, rings: 3 }); } },
  // a terracotta flowerpot with a little shrub
  gdn_pot: { r: 3.2, near: 40, mid: 130, farD: 320,
    build(m) {
      const sg = m.lo ? 12 : 20;
      m.color('#d8743a').shine(1); m.lathe([[2.2, 0], [3.0, 4.6], [3.4, 4.8], [3.4, 5.8], [2.9, 5.8], [2.7, 5.0], [0.01, 5.0]], { seg: sg });
      m.color('#5a3a22'); m.disc(0, 5.4, 0, 2.9, sg);
      m.color('#4aa040').shine(1); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.ball(Math.sin(a) * 1.5, 7 + (i % 2) * 0.8, Math.cos(a) * 1.5, 1.4, { seg: m.lo ? 7 : 10, rings: m.lo ? 5 : 7 }); }
      m.ball(0, 8.4, 0, 1.6, { seg: m.lo ? 7 : 10, rings: m.lo ? 5 : 7 });
      m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.2, y0: 0, y1: 6 }] };
    },
    far(m) { m.color('#d8743a'); m.cyl(0, 0, 0, 2.2, 3.3, 5.8, 8); m.color('#4aa040'); m.ball(0, 7.6, 0, 2.4, { seg: 6, rings: 4 }); } },
  // a pebble on the path edge (studs that keep the road edge readable)
  gdn_pebble: { r: 0.8, near: 30, mid: 90, farD: 160,
    build(m) { m.color('#ffffff').shine(2); m.ellipsoid(0, 0.25, 0, 0.75, 0.42, 0.6, { seg: m.lo ? 6 : 9, rings: m.lo ? 4 : 6 }); m.shine(0); return { cols: [] }; },
    far(m) { m.color('#ffffff'); m.box(0, 0.2, 0, 1.2, 0.4, 1); } }
};

/* ---------------- building the world ---------------- */
function gdnWorld(id, D) {
  const sky = Object.assign({}, CART_SKIES.day(), { zen: '#4aa4f0', hor: '#fff2d0', sky: '#a8d8ff', fog: '#d6ecd2', fogD: 0.0024, haze: 0.22, clouds: 0.7, key: '#fff2d8', keyK: 1.05, gnd: '#a8d080' });
  const W = CartKit.world(id, D, { worldId: 1219, night: false, sky, ground: '#6aa846', crack: 0,
    road: { shoulder: 'rgba(80,60,30,0.32)', band: 'rgba(176,128,78,0.88)', edge: 'rgba(255,246,214,0.9)', edgeW: 0.6, centerFn: gdnPaintCenter } });
  const { E, T, api, rng } = W;
  const sOf = (x, z) => CartKit.sOf(T, x, z);
  const S = { gnome: sOf(176, 0), lawn: sOf(30, 168), slug: sOf(-92, 108), robin: sOf(-207, -30), start: 0 };
  E.gdn = { S };
  const side = (s, sd, off) => { const g = T.at(((s % T.L) + T.L) % T.L, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  const free = (x, z, r) => taken.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + r) && CartWorlds.clear(T, x, z, r);
  // ---- the hose river: west of the west straight, from the leaking nozzle down to a pond ----
  const river = []; for (let i = 0; i <= 26; i++) { const u = i / 26; river.push([-262 + Math.sin(u * 7) * 9 + u * 10, 150 - u * 330]); }
  // ---- ground paint: mowed lawn stripes, flagstones on the patio, soil beds, the river ----
  api.paint((ctx, P, Sc) => {
    const b = T.bounds;
    // mower stripes (wide diagonal bands)
    for (let k = -40; k < 40; k++) { const q0 = P(b.x0 - 120 + k * 22, b.z0 - 120), q1 = P(b.x0 - 120 + k * 22 + 900, b.z1 + 900); ctx.strokeStyle = k % 2 ? 'rgba(150,210,100,0.18)' : 'rgba(40,100,30,0.14)'; ctx.lineWidth = 11 * Sc; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
    // clover and daisy specks
    for (let i = 0; i < 900; i++) { const x = b.x0 - 80 + rng() * (b.x1 - b.x0 + 160), z = b.z0 - 80 + rng() * (b.z1 - b.z0 + 160), q = P(x, z); ctx.fillStyle = i % 5 ? 'rgba(60,130,40,0.35)' : 'rgba(255,255,240,0.55)'; ctx.beginPath(); ctx.arc(q[0], q[1], (i % 5 ? 0.9 : 0.35) * Sc, 0, TAU); ctx.fill(); }
    // the patio: big sandstone flagstones round the start straight
    for (let s = T.L - 150; s < T.L + 60; s += 6) { const g = T.at(((s % T.L) + T.L) % T.L, {}); for (let d = -g.hw - 12; d <= g.hw + 12; d += 6) { const q = P(g.x + g.nx * (d + ((s / 6) % 2) * 3), g.z + g.nz * (d + ((s / 6) % 2) * 3)); ctx.fillStyle = `rgba(${210 + (Math.abs(Math.floor(d * 3 + s)) % 30)},${190 + (Math.abs(Math.floor(d + s * 2)) % 25)},160,0.55)`; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-2.8 * Sc, -2.8 * Sc, 5.5 * Sc, 5.5 * Sc); ctx.restore(); } }
    // the rockery's gravel and the cabbage patch's soil rows
    for (const [sv, rr, col] of [[S.gnome, 46, 'rgba(190,184,170,0.5)'], [S.slug, 52, 'rgba(110,76,44,0.55)']]) { const g = T.at(sv, {}); for (let i = 0; i < 260; i++) { const a = rng() * TAU, r = Math.sqrt(rng()) * rr, x = g.x + Math.cos(a) * r, z = g.z + Math.sin(a) * r; if (!CartWorlds.clear(T, x, z, 2)) continue; const q = P(x, z); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q[0], q[1], (1.5 + rng() * 2.5) * Sc, 0, TAU); ctx.fill(); } }
    { const g = T.at(S.slug, {}); for (let r = -5; r <= 5; r++) { ctx.strokeStyle = 'rgba(80,52,30,0.45)'; ctx.lineWidth = 2.2 * Sc; ctx.beginPath(); for (let u = -50; u <= 50; u += 5) { const q = P(g.x + g.tx * u + g.nx * r * 7, g.z + g.tz * u + g.nz * r * 7); if (u === -50) ctx.moveTo(q[0], q[1]); else ctx.lineTo(q[0], q[1]); } ctx.stroke(); } }
    // the river: a wide blue ribbon with a pale edge and ripples, the pond at its end
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const [w, col] of [[30, 'rgba(200,180,130,0.6)'], [24, 'rgba(70,150,210,0.9)'], [14, 'rgba(110,190,240,0.8)']]) { ctx.strokeStyle = col; ctx.lineWidth = w * Sc; ctx.beginPath(); river.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); ctx.stroke(); }
    { const q = P(-250, -190); ctx.fillStyle = 'rgba(70,150,210,0.9)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 40 * Sc, 26 * Sc, 0.4, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = 'rgba(230,248,255,0.55)'; ctx.lineWidth = 0.8 * Sc; for (let i = 0; i < 60; i++) { const p = river[i % river.length], q = P(p[0] + (rng() - 0.5) * 12, p[1] + (rng() - 0.5) * 10); ctx.beginPath(); ctx.arc(q[0], q[1], (1.5 + rng() * 2) * Sc, 0.3, 2.6); ctx.stroke(); }
    // the lawn round the sprinkler: a dark wet arc
    { const g = T.at(S.lawn, {}), q = P(g.x - g.nx * (g.wl + 7), g.z - g.nz * (g.wl + 7)); ctx.fillStyle = 'rgba(30,90,40,0.25)'; ctx.beginPath(); ctx.arc(q[0], q[1], 46 * Sc, 0, TAU); ctx.fill(); }
  });
  // ---- barriers: green and cream rails, terracotta and cream tyre walls on the tight bends ----
  CartKit.rails(E, T, (i, tight) => tight ? (i % 2 ? '#fff4e0' : '#d8743a') : (Math.floor(i / 2) % 2 ? '#fff4e0' : '#5ab048'));
  CartKit.kinds(E, GDN_KINDS);
  // pebble studs every 6 m on both edges (keeps the edge readable against the lawn)
  for (let s = 0; s < T.L; s += 6) { const g = T.at(s, {}); for (const sd of [1, -1]) { const o = sd > 0 ? g.wr - 0.9 : -g.wl + 0.9; CartKit.put(E, 'gdn_pebble', g.x + g.nx * o, g.z + g.nz * o, s * 0.7, ['#f4ecdc', '#d8d0c0', '#e8dcc8'][Math.floor(s / 6) % 3], { y: 0 }); } }
  // ---- the start: the hose arch, the name, terracotta pots and a fallen pot on the patio ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 5;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => gdnHoseArch(m, Wd), { hi: true });
    api.sign('THE GARDEN', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.0, y: 12.2, post: false, maxW: 10, style: { bg: '#fff4d8', fg: '#3a8a3a', border: '#e8302a' } });
    for (const sd of [1, -1]) { const p = side(18, sd, 7); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 22, 3, rng)); taken.push([p.x, p.z, 14]); } }
  for (let s = -130, k = 0; s < 90; s += 13, k++) for (const sd of [1, -1]) { if (Math.abs(s - 18) < 18 || Math.abs(s) < 6) continue; const p = side(s, sd, 4 + (k % 2) * 1.5); if (free(p.x, p.z, 3)) { CartKit.put(E, 'gdn_pot', p.x, p.z, p.yaw + k, ['#ffffff', '#ffe8d8', '#fff0e0'][k % 3], { scale: 0.8 + (k % 3) * 0.15 }); taken.push([p.x, p.z, 3.5]); } }
  { const p = side(-60, -1, 14); CartScene.mesh(api, p.x, p.z, p.yaw + 0.7, gdnFallenPot, { hi: true }); taken.push([p.x, p.z, 10]); }
  CartKit.crowd(E, T, T.L - 110, T.L - 30, -1, rng, { rows: 1, off: 7, gap: 2.6 });
  // ---- the gnome rockery: boulders either side, the gnomes' home spots, a sign ----
  E.gdn.gnomes = [];
  for (let i = 0; i < 3; i++) {
    const s = S.gnome + (i - 1) * 22, sd = i % 2 ? 1 : -1, g = T.at(s, {}), off = 2.6, p = side(s, sd, off);
    E.gdn.gnomes.push({ i, s, sd, hx: p.x, hz: p.z, yaw: p.yaw, x: g.x, z: g.z, nx: g.nx, nz: g.nz, hw: g.hw });
    taken.push([p.x, p.z, 4]);
  }
  for (let s = S.gnome - 60, k = 0; s < S.gnome + 60; s += 9, k++) for (const sd of [1, -1]) { const p = side(s, sd, 5 + (k % 3) * 3 + rng() * 2); if (free(p.x, p.z, 3)) { const r = 2.2 + rng() * 2.4; CartScene.mesh(api, p.x, p.z, rng() * TAU, m => gdnRock(m, r), { hi: true }); taken.push([p.x, p.z, r]); } }
  { const p = side(S.gnome - 48, 1, 1.5), g = T.at(S.gnome - 48, {}); api.sign('GNOME\nROCKERY', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#e8302a', fg: '#ffffff', border: '#ffffff' } }); }
  // ---- the lawn: the sprinkler's spot, sunflowers along the outside, a sign ----
  { const g = T.at(S.lawn, {}), off = g.wl + 7, x = g.x - g.nx * off, z = g.z - g.nz * off;
    E.gdn.spr = { s: S.lawn, x, z, off, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw, wl: g.wl, wr: g.wr };
    // the sprinkler's base: a mound, a spike, its hose snaking off across the lawn
    CartScene.mesh(api, x, z, 0, m => { m.color('#5a8a3a').shine(0); m.ellipsoid(0, 0, 0, 3, 0.8, 3, { seg: 14, rings: 6, phi1: Math.PI / 2 }); m.color('#2a2a2a').shine(3); m.roundCyl(0, 0.5, 0, 1.2, 0.6, 0.2); m.color('#3aa84a').shine(3); let px = 0, pz = 0; for (let i = 1; i < 12; i++) { const nx = -g.nx * i * 4 + Math.sin(i * 1.3) * 3, nz = -g.nz * i * 4 + Math.cos(i * 1.1) * 3; m.limb(px, 0.6, pz, nx, 0.6, nz, 0.6, 0.6, { seg: 8, ends: i === 1 }); px = nx; pz = nz; } m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.2, y0: 0, y1: 4 }] }; }, { hi: true });
    taken.push([x, z, 10]);
    for (let i = 0; i < 4; i++) { const p = side(S.lawn - 60 + i * 38, 1, 9 + (i % 2) * 5); if (free(p.x, p.z, 4)) { CartScene.mesh(api, p.x, p.z, p.yaw, m => gdnSunflower(m, 20 + (i % 3) * 4), { hi: true }); taken.push([p.x, p.z, 5]); } }
    const p = side(S.lawn - 52, -1, 1.5); api.sign('MIND THE\nSPRINKLER', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.4, style: { bg: '#2a8ad8', fg: '#ffffff', border: '#ffffff' } });
    CartKit.crowd(E, T, S.lawn + 20, S.lawn + 70, 1, rng, { rows: 1, off: 5, gap: 2.4 }); }
  // ---- the slug crossing: the slugs' spots, cabbages either side, a sign ----
  E.gdn.slugs = [];
  for (let i = 0; i < 2; i++) { const s = S.slug + (i ? 16 : -16), g = T.at(s, {}); E.gdn.slugs.push({ i, s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, wl: g.wl, wr: g.wr, hw: g.hw, yaw: g.yaw }); }
  for (let s = S.slug - 70, k = 0; s < S.slug + 70; s += 10, k++) for (const sd of [1, -1]) { const p = side(s, sd, 6 + (k % 2) * 5 + rng() * 2), r = 2.6 + rng() * 1.4; if (free(p.x, p.z, r + 1)) { CartScene.mesh(api, p.x, p.z, rng() * TAU, m => gdnCabbage(m, r), { hi: true }); taken.push([p.x, p.z, r + 1]); } }
  { const p = side(S.slug - 50, 1, 1.5), g = T.at(S.slug - 50, {}); api.sign('SLUG\nCROSSING', p.x, p.z, { yaw: g.yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#8ac83a', fg: '#ffffff', border: '#ffffff' } }); }
  // ---- the hose river: the bird bath (the robin's perch), the hose along the river, a gnome fishing ----
  { const p = side(S.robin, -1, 9), g = p.g; CartScene.mesh(api, p.x, p.z, 0, gdnBirdBath, { hi: true }); taken.push([p.x, p.z, 7]);
    E.gdn.robin = { s: S.robin, px: p.x, pz: p.z, py: 8.1, yaw: p.yaw, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw };
    const q = side(S.robin + 40, -1, 1.5); api.sign('HUNGRY\nROBIN', q.x, q.z, { yaw: T.at(S.robin + 40, {}).yaw + Math.PI, h: 1.0, y: 2.6, post: true, maxW: 3.2, style: { bg: '#e8582a', fg: '#ffffff', border: '#ffffff' } }); }
  CartScene.mesh(api, 0, 0, 0, m => { m.color('#3aa84a').shine(3); for (let i = 0; i < river.length - 1; i++) { const a = river[i], b = river[i + 1]; m.limb(a[0] + 13, 0.7, a[1], b[0] + 13, 0.7, b[1], 0.8, 0.8, { seg: 10, ends: false }); }
    m.color('#e8b048').shine(4); const a = river[0]; m.limb(a[0] + 13, 0.7, a[1], a[0] + 13, 0.9, a[1] + 4, 0.9, 1.1, { seg: 12 }); m.shine(0); return { cols: [] }; }, { hi: true });
  { const x = -240, z = -60; if (free(x, z, 3)) { CartScene.mesh(api, x, z, -Math.PI / 2, m => { gdnGnome(m, false, '#3a9a5a', '#e8302a'); m.color('#8a5a2a'); m.limb(0.9, 1.3, 0.5, -0.6, 6.5, 5.5, 0.1, 0.05, { seg: 5 }); m.color('#ffffff'); m.limb(-0.6, 6.5, 5.5, -1.2, 0.3, 7.5, 0.02, 0.02, { seg: 3 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.2, y0: 0, y1: 5 }] }; }, { hi: true }); taken.push([x, z, 3]); } }
  // ---- the infield and beyond: the watering can, toadstool rings, leafy plants, grass, flowers, the fence ----
  CartScene.mesh(api, 10, 40, 0.6, gdnWateringCan, { hi: true }); taken.push([10, 40, 16]);
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, x = -70 + Math.cos(a) * 26, z = -10 + Math.sin(a) * 22; if (free(x, z, 3)) { CartKit.put(E, 'gdn_shroom', x, z, a, ['#ffffff', '#ffc8a0', '#e8c8ff'][i % 3], { scale: 1.1 + (i % 3) * 0.3 }); taken.push([x, z, 3]); } }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = 100 + Math.cos(a) * 14, z = 70 + Math.sin(a) * 14; if (free(x, z, 3)) { CartKit.put(E, 'gdn_shroom', x, z, a, '#ffffff', { scale: 0.9 + (i % 2) * 0.5 }); taken.push([x, z, 3]); } }
  { const b = T.bounds;
    CartScene.mesh(api, (b.x0 + b.x1) / 2, b.z1 + 70, Math.PI, m => gdnFence(m, b.x1 - b.x0 + 220, 34), { noAO: true });
    CartScene.mesh(api, b.x1 + 70, (b.z0 + b.z1) / 2, -Math.PI / 2, m => gdnFence(m, b.z1 - b.z0 + 220, 34), { noAO: true });
    CartScene.mesh(api, b.x0 - 80, (b.z0 + b.z1) / 2, Math.PI / 2, m => gdnFence(m, b.z1 - b.z0 + 220, 34), { noAO: true }); }
  // roadside fill: toadstools, leafy plants, grass clumps and flowers wherever there's room
  const FCOL = ['#ff8ac0', '#ffffff', '#b48cff', '#ffd23a', '#ff6a5a', '#7ab8ff'];
  for (let s = 8, k = 0; s < T.L; s += 7, k++) {
    const sd = k % 2 ? 1 : -1, p = side(s, sd, 3.5 + ((k * 7) % 5) * 1.6 + rng() * 2);
    if (!free(p.x, p.z, 2)) continue;
    const r = rng(), kind = r < 0.42 ? 'gdn_grass' : r < 0.68 ? 'gdn_flower' : r < 0.86 ? 'gdn_leaf' : 'gdn_shroom';
    CartKit.put(E, kind, p.x, p.z, rng() * TAU, kind === 'gdn_flower' ? FCOL[k % FCOL.length] : kind === 'gdn_shroom' ? ['#ffffff', '#ffc8a0', '#e8c8ff'][k % 3] : ['#ffffff', '#e8ffd8', '#f0ffe0'][k % 3], { scale: 0.85 + rng() * 0.5 });
    taken.push([p.x, p.z, kind === 'gdn_leaf' ? 4 : 1.5]);
  }
  // a second, deeper row of tall grass and leaves (the jungle feel at snail size)
  for (let s = 4, k = 0; s < T.L; s += 11, k++) for (const sd of [1, -1]) { const p = side(s, sd, 14 + rng() * 10); if (free(p.x, p.z, 3)) CartKit.put(E, rng() < 0.6 ? 'gdn_grass' : 'gdn_leaf', p.x, p.z, rng() * TAU, '#ffffff', { scale: 1.3 + rng() * 0.8 }); }
  // gift rows, boost pads, the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(sOf(60, -118)), f(sOf(180, 88)), f(sOf(-20, 157)), f(sOf(-209, -70))]);
  CartKit.boosts(E, T, [[f(sOf(-100, -112)), 0.35], [f(S.gnome + 50), -0.4], [f(S.slug + 45), 0.4]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: a row of little pebbles every 5 m, a leaf every 20 m
function gdnPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 5) {
    const g = T.at(s, {}), q = P(g.x, g.z);
    if (s % 20 === 0) { ctx.fillStyle = 'rgba(110,190,70,0.85)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.beginPath(); ctx.ellipse(0, 0, 1.4 * S, 0.6 * S, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(60,120,40,0.9)'; ctx.lineWidth = 0.12 * S; ctx.beginPath(); ctx.moveTo(-1.3 * S, 0); ctx.lineTo(1.3 * S, 0); ctx.stroke(); ctx.restore(); }
    else { ctx.fillStyle = 'rgba(250,240,220,0.8)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], 0.45 * S, 0.32 * S, s, 0, TAU); ctx.fill(); }
  }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const GdnMesh = {
  gnome(m, i) { gdnGnome(m, false, ['#2a6ad8', '#8a4ad8', '#2a9a6a'][i % 3], ['#e8302a', '#ff7a2a', '#e8302a'][i % 3]); },
  slug(m) { gdnSlug(m, false); },
  // the impact sprinkler's head (the jet points along +z): a brass body on a swivel, an angled nozzle, the
  // spring-loaded deflector arm, a black base collar
  sprinkler(m) {
    m.color('#2a2a2a').shine(3); m.roundCyl(0, 0, 0, 0.9, 0.6, 0.15);
    m.color('#e0b040').shine(4); m.lathe([[0.7, 0.6], [0.6, 1.6], [0.45, 2.4], [0.5, 2.6], [0.01, 2.7]], { seg: 16 });
    m.limb(0, 2.2, 0, 0, 3.0, 1.7, 0.28, 0.22, { seg: 10 }); m.color('#c89030'); m.limb(0, 3.0, 1.7, 0, 3.1, 1.95, 0.16, 0.16, { seg: 8 });
    m.color('#b8b8c0').shine(4); m.limb(0, 2.7, 0, 0, 3.7, -0.6, 0.12, 0.12, { seg: 6 }); m.limb(0, 3.7, -0.6, 0, 3.9, 1.0, 0.12, 0.12, { seg: 6 }); m.limb(0, 3.9, 1.0, 0, 3.3, 2.1, 0.12, 0.12, { seg: 6 });
    m.color('#2a2a2a'); m.roundBox(0, 3.25, 2.15, 0.45, 0.35, 0.2, 0.06); m.roundBox(0, 3.8, -0.75, 0.5, 0.5, 0.5, 0.12);
    m.color('#d8d8e0'); m.push(); m.tf(0, 3.2, -0.2, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.3, 0.06, { seg: 10, tseg: 4 }); m.pop();
    m.shine(0);
  },
  // the robin's body (forward +z): plump brown back, orange breast, black eye, a yellow beak, legs
  robin(m) {
    m.color('#7a5638').shine(2); m.ellipsoid(0, 2.6, -0.1, 1.5, 1.55, 2.0, { seg: 16, rings: 10 });
    m.color('#e8582a').shine(1); m.ellipsoid(0, 2.45, 0.85, 1.28, 1.3, 1.2, { seg: 16, rings: 10 });
    m.color('#f4e8d8'); m.ellipsoid(0, 1.6, 0.4, 0.9, 0.6, 1.0, { seg: 12, rings: 6 });
    m.color('#7a5638').shine(2); m.ball(0, 4.05, 1.25, 1.05, { seg: 16, rings: 10 });
    m.color('#e8582a'); m.ellipsoid(0, 3.65, 1.75, 0.75, 0.6, 0.5, { seg: 12, rings: 6 });
    m.color('#ffc83a').shine(3); m.limb(0, 4.0, 2.15, 0, 3.92, 3.3, 0.32, 0.02, { seg: 8 });
    m.color('#1a1418').shine(4); for (const sd of [-1, 1]) m.ball(sd * 0.6, 4.3, 1.85, 0.18, { seg: 8, rings: 6 });
    m.color('#ffffff'); for (const sd of [-1, 1]) m.ball(sd * 0.66, 4.38, 1.95, 0.06, { seg: 4, rings: 3 });
    m.color('#5a3e28').shine(1); m.push(); m.tf(0, 2.9, -2.3, 0, -0.5, 0); m.ellipsoid(0, 0, 0, 0.75, 0.2, 1.4, { seg: 10, rings: 5 }); m.pop();
    m.color('#c87a4a').shine(1); for (const sd of [-1, 1]) { m.limb(sd * 0.5, 1.3, 0.2, sd * 0.6, 0, 0.45, 0.13, 0.1, { seg: 5 }); for (let t = -1; t <= 1; t++) m.limb(sd * 0.6, 0.05, 0.45, sd * 0.6 + t * 0.35, 0.03, 1.1, 0.07, 0.05, { seg: 4 }); }
    m.shine(0);
  },
  // a wing (pivot at the shoulder; it lies back along -z and droops down; i 0 = left (-x), 1 = right (+x))
  wing(m, i) { const sd = i ? 1 : -1; m.color('#6a4a30').shine(2); m.ellipsoid(sd * 0.25, -0.35, -0.7, 0.32, 1.0, 1.8, { seg: 12, rings: 6 }); m.color('#4a3220'); m.ellipsoid(sd * 0.32, -0.7, -1.5, 0.22, 0.6, 1.0, { seg: 8, rings: 5 }); m.shine(0); }
};

/* ---------------- the rules: hazards at run time ---------------- */
const GDN_GNOME = { period: 7.5, wind: 1.1, jump: 0.7, stand: 2.2, back: 0.6, land: 2.7, body: 2.1 };
const GDN_SLUG = { speed: 2.3, peek: 1.3, rest: 2.2, edge: 6, gap: 1.0, life: 8.0, r: 1.4, n: 30, len: 4.9, half: 2.9, scale: 1.5 };
const GDN_SPR = { period: 5.8, warn: 1.25, sweep: 2.6, arc: 1.05, push: 9 };
const GDN_ROBIN = { eye: 1.35, peck: 0.35, eat: 1.2, fly: 1.0, cool: 1.3, r: 3.4, zone: 46, scale: 1.25 };
CART_TRACK_RULES.garden = {
  onLoad(s) {
    const E = s.E, B = E.gdn;
    const G = CartKit.group(s, [['gnomes', GdnMesh.gnome, 3], ['slugs', GdnMesh.slug, 2], ['spr', GdnMesh.sprinkler, 1], ['robin', GdnMesh.robin, 1], ['wings', GdnMesh.wing, 2]]);
    const L = s.gdn = { G, rng: mulberry32(4343), gnomes: [], slugs: [], spr: null, robin: null, blind: 0, said: {}, hintT: -9, slimeCd: new Float32Array(16) };
    B.gnomes.forEach((q, i) => L.gnomes.push(Object.assign({}, q, { st: 'home', c: -1, u: 0, d: 0, tx: 0, tz: 0, x: q.hx, z: q.hz, y: 0, mask: 0, obj: G.gnomes[i] })));
    B.slugs.forEach((q, i) => {
      const sl = Object.assign({}, q, { st: 'rest', t: 1.5 + i * 4.5, sd: i ? 1 : -1, d: 0, mask: 0, obj: G.slugs[i], trail: [], head: 0, lastD: 0 });
      sl.d = sl.sd * (q.wr + GDN_SLUG.edge);   // starts off the road on its side
      for (let j = 0; j < GDN_SLUG.n; j++) sl.trail.push({ live: false, t: 0, x: 0, z: 0, s: 0, d: 0, rot: j * 1.7 });
      L.slugs.push(sl);
    });
    L.spr = Object.assign({}, B.spr, { st: 'rest', c: -1, u: 0, a: -GDN_SPR.arc, aPrev: -GDN_SPR.arc, dir: 1, mask: 0, obj: G.spr[0] });
    L.robin = Object.assign({}, B.robin, { st: 'perch', t: 2, x: B.robin.px, y: B.robin.py, z: B.robin.pz, ax: 0, az: 0, as: 0, tgt: null, last: null, mask: 0, flap: 0, yawR: B.robin.yaw, obj: G.robin[0], wl: G.wings[0], wr: G.wings[1], fx0: 0, fz0: 0 });
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.gdn; if (!L) return;
    gdnGnomes(s, L, dt, racing); gdnSlugs(s, L, dt, racing); gdnSprinkler(s, L, dt, racing); gdnRobin(s, L, dt, racing);
    if (L.blind > 0) L.blind = Math.max(0, L.blind - dt);
    for (let i = 0; i < L.slimeCd.length; i++) if (L.slimeCd[i] > 0) L.slimeCd[i] -= dt;
  },
  // the AI: hop the slime lines and the sprinkler's jet (by skill); gnomes, slugs and the robin's target are
  // cartIxObs obstacles the racing AI steers round
  onStep(s, k, dt, racing) {
    const L = s.gdn; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out || k.air) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, luck = ((k.slot * 7 + Math.floor(s.time * 0.5)) % 10) / 10;
    if (luck > 0.5 + (sk - 0.85) * 3) return;
    // slime: a live trail blob just ahead in the kart's lane -> hop
    if (k.car.id !== 'snail') for (const sl of L.slugs) {
      const dsl = CartKit.ahead(s, k, sl.s); if (dsl < -6 || dsl > 30) continue;
      for (const p of sl.trail) { if (!p.live) continue; const ds = CartKit.ahead(s, k, p.s); if (ds > 0.5 && ds < Math.max(3.5, k.speed * 0.2) && Math.abs(p.d - k.loc.d) < GDN_SLUG.r + 1) { I.driftPress = true; I.drift = false; return; } }
    }
    // the sprinkler's jet: hop just before it sweeps over
    const P = L.spr; if (P.st === 'sweep') {
      const along = CartKit.ds(s.T, P.s, k.loc.s); if (along > -60 && along < 60) {
        const p = P.off + k.loc.d, ta = Math.tan(P.a), aj = p * ta, vj = p * (1 + ta * ta) * P.dir * 2 * GDN_SPR.arc / GDN_SPR.sweep, rel = aj - along, close = k.speed - vj;
        if (Math.abs(close) > 0.5) { const tm = rel / close; if (tm > 0 && tm < 0.2) { I.driftPress = true; I.drift = false; } }
      }
    }
  },
  draw(s, R, S, t) { const L = s.gdn; if (L) gdnDraw(s, L, R, S, t); },
  hud(s, ctx, W, H, top, left) {
    const L = s.gdn, p = s.player; if (!L || !p) return;
    // sprinkled: water sheeting down the screen
    if (L.blind > 0) {
      const a = Math.min(1, L.blind * 1.3), tt = s.time; ctx.save();
      ctx.fillStyle = `rgba(140,200,240,${0.16 * a})`; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 40; i++) { const x = ((i * 97) % 100) / 100 * W, u = (i * 0.618 + tt * (0.4 + (i % 5) * 0.1)) % 1, y = u * (H + 60) - 30, r = 6 + (i % 4) * 5, cx = (x - W / 2) / W, cy = (y - H / 2) / H, far = Math.min(1, Math.hypot(cx, cy) * 2.4);
        ctx.globalAlpha = a * (0.2 + 0.8 * far); ctx.fillStyle = 'rgba(220,242,255,0.55)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.5, 3.4, 4.6); ctx.stroke(); }
      ctx.restore();
    }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 75) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#2a8a3a', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.gdn.S; hint('gnome', S.gnome - 22, 'GNOME ROCKERY!', 'steer off the landing rings'); hint('spr', S.lawn, 'LAWN SPRINKLER!', 'time your pass or hop the jet'); hint('slug', S.slug - 16, 'SLUG CROSSING!', p.car.id === 'snail' ? 'slime is snail fuel: ride it!' : 'hop the slime lines'); hint('robin', S.robin + 46, 'HUNGRY ROBIN!', 'swerve off the target'); }
  }
};
const gdnBanner = (s, L, k, text, sub, col) => { if (k.player && !(s.time - L.hintT < 2.3)) s.banner(text, col || '#e8582a', 1.0, sub, true); };

// ---- the gnomes: stand on the rocks; crouch and wobble (a ring flashes where they'll land), jump into the road,
// stand guard, hop home. Staggered so only one is ever out at a time on a lane ----
function gdnGnomes(s, L, dt, racing) {
  const C = GDN_GNOME, T = s.T;
  for (const g of L.gnomes) {
    const tt = s.time + g.i * 2.5, c = Math.floor(tt / C.period), ph = tt - c * C.period, act = C.period - C.wind - C.jump - C.stand - C.back;
    let st, u;
    if (ph < act) { st = 'home'; u = ph / act; }
    else if (ph < act + C.wind) { st = 'wind'; u = (ph - act) / C.wind; }
    else if (ph < act + C.wind + C.jump) { st = 'jump'; u = (ph - act - C.wind) / C.jump; }
    else if (ph < act + C.wind + C.jump + C.stand) { st = 'stand'; u = (ph - act - C.wind - C.jump) / C.stand; }
    else { st = 'back'; u = (ph - act - C.wind - C.jump - C.stand) / C.back; }
    if (st === 'wind' && g.c !== c) {
      // pick the landing spot: a lane on its own half or the middle, a little up the road
      g.c = c; g.mask = 0; const lanes = [0.15, 0.4, 0.62], d = g.sd * lanes[Math.floor(L.rng() * 3)] * g.hw * (L.rng() < 0.35 ? -1 : 1);
      const at = T.at(g.s + (L.rng() - 0.5) * 6, GDN_T.at); g.d = d; g.tx = at.x + at.nx * d; g.tz = at.z + at.nz * d;
      if (CartKit.near(s, g.hx, g.hz, 70)) cartIxSound(s, 'spring', g.hx, g.hz, 0.5, 0.8);
    }
    if (st === 'jump' && g.fc !== c) { g.fc = c; CartKit.fired(s, 'gnome'); if (CartKit.near(s, g.hx, g.hz, 70)) cartIxSound(s, 'boing', g.hx, g.hz, 0.7, 0.9); }
    g.st = st; g.u = u;
    // position
    if (st === 'home' || st === 'wind') { g.x = g.hx; g.z = g.hz; g.y = 0; }
    else if (st === 'jump') { const e = u * u * (3 - 2 * u); g.x = lerp(g.hx, g.tx, e); g.z = lerp(g.hz, g.tz, e); g.y = Math.sin(u * Math.PI) * 9; }
    else if (st === 'stand') { g.x = g.tx; g.z = g.tz; g.y = 0; }
    else { const e = u * u * (3 - 2 * u); g.x = lerp(g.tx, g.hx, e); g.z = lerp(g.tz, g.hz, e); g.y = Math.sin(u * Math.PI) * 6; }
    if (st === 'wind' || st === 'jump') cartIxObs(s, g.tx, g.tz, C.land + 0.6);
    if (st === 'stand') cartIxObs(s, g.x, g.z, C.body + 0.8);
    // the landing (the last moment of the jump) flips cars in the ring; a standing gnome bounces them off
    if (racing && ((st === 'jump' && u > 0.82) || st === 'stand')) for (const k of s.karts) {
      if (k.out || (g.mask & (1 << k.slot))) continue;
      const dx = k.x - g.x, dz = k.z - g.z, d2 = dx * dx + dz * dz;
      if (st === 'jump') { if (d2 > C.land * C.land || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.5)) continue; g.mask |= 1 << k.slot; if (CartKit.hit(s, k, 'flip', 'gnome', { dx: dx / (Math.sqrt(d2) || 1), dz: dz / (Math.sqrt(d2) || 1), banner: 'GNOMED!' })) { cartIxSound(s, 'stomp', k.x, k.z, 0.8, 1.2); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 10, '#ff6a5a'); } }
      else { if (d2 > C.body * C.body || k.y > 3) continue; g.mask |= 1 << k.slot; const D = Math.sqrt(d2) || 1; if (CartKit.hit(s, k, 'knock', 'gnome', { dx: dx / D, dz: dz / D, power: 12, dur: 0.8, banner: 'BONK! GNOME!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.7); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'ring', 8, '#ffffff'); } }
    }
    if (st === 'stand' && u < 0.04 && !g.landed) { g.landed = true; if (s.fx && CartKit.near(s, g.x, g.z, 90)) s.fx.dust(g.x, 0.4, g.z, 10, '#c8a878'); if (CartKit.near(s, g.x, g.z, 60)) { cartIxSound(s, 'land', g.x, g.z, 0.8, 0.7); if (CartKit.near(s, g.x, g.z, 25)) s.shakeIt(0.5); } }
    if (st !== 'stand') g.landed = false;
    const o = g.obj; if (o) {
      const crouch = st === 'wind' ? 1 - 0.18 * Math.min(1, u * 2) : 1, wob = st === 'wind' ? Math.sin(s.time * 30) * 0.12 * (0.4 + u) : 0;
      const face = st === 'stand' ? Math.atan2(-T.at(g.s, GDN_T.at2).tx, -T.at(g.s, GDN_T.at2).tz) : st === 'jump' || st === 'back' ? Math.atan2((st === 'jump' ? g.tx - g.hx : g.hx - g.tx), (st === 'jump' ? g.tz - g.hz : g.hz - g.tz)) : g.yaw;
      o.live = true; o.visible = true; o.x = g.x; o.z = g.z; o.y = s.terrain.height(g.x, g.z) + g.y; o.yaw = face + (st === 'stand' ? Math.sin(s.time * 5) * 0.25 : 0); o.pitch = st === 'jump' ? -0.3 + u * 0.5 : 0; o.roll = wob; o.scale = 1.3 * crouch;
    }
  }
}
// ---- the slugs: rest off the road, rear up (the path flashes green), crawl across leaving a slime trail, rest on
// the far side, come back. Slime slows (soft) unless you hop it; Turbo Escargot boosts off it; the slug body knocks ----
function gdnSlugs(s, L, dt, racing) {
  const C = GDN_SLUG, T = s.T;
  for (const sl of L.slugs) {
    sl.t += dt;
    const edgeFrom = sl.sd > 0 ? sl.wr + C.edge : sl.wl + C.edge, edgeTo = sl.sd > 0 ? sl.wl + C.edge : sl.wr + C.edge, dir = -sl.sd;
    if (sl.st === 'rest') { sl.d = sl.sd * edgeFrom; if (sl.t > C.rest) { sl.st = 'peek'; sl.t = 0; sl.mask = 0; if (CartKit.near(s, sl.x, sl.z, 60)) cartIxSound(s, 'splat', sl.x, sl.z, 0.4, 0.6); } }
    else if (sl.st === 'peek') { sl.d = sl.sd * edgeFrom; if (sl.t > C.peek) { sl.st = 'crawl'; sl.t = 0; sl.lastD = sl.d; CartKit.fired(s, 'slug'); CartKit.fired(s, 'slime'); } }
    else {
      sl.d += dir * C.speed * dt;
      if (Math.abs(sl.d - sl.lastD) > C.gap && Math.abs(sl.d) < Math.max(sl.wl, sl.wr) + 1) {
        // lay a blob of slime
        sl.lastD = sl.d; const p = sl.trail[sl.head]; sl.head = (sl.head + 1) % sl.trail.length;
        const g = T.at(sl.s, GDN_T.at2); p.live = true; p.t = 0; p.s = sl.s; p.d = sl.d; p.x = g.x + g.nx * sl.d; p.z = g.z + g.nz * sl.d;
      }
      if (dir * sl.d >= edgeTo) { sl.d = dir * edgeTo; sl.st = 'rest'; sl.t = 0; sl.sd = dir; }
    }
    const x = sl.x + sl.nx * sl.d, z = sl.z + sl.nz * sl.d, hx = sl.nx * dir, hz = sl.nz * dir;
    sl.wx = x; sl.wz = z; sl.hx = hx; sl.hz = hz;
    // the body: AI steers round it; contact knocks
    if (Math.abs(sl.d) < Math.max(sl.wl, sl.wr) + 3) { cartIxObs(s, x + hx * 2.4, z + hz * 2.4, 3.2); cartIxObs(s, x - hx * 2.4, z - hz * 2.4, 3.0); }
    if (racing && sl.st === 'crawl') for (const k of s.karts) {
      if (k.out || (sl.mask & (1 << k.slot)) || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.6)) continue;
      const dx = k.x - x, dz = k.z - z, along = dx * hx + dz * hz, across = dx * hz - dz * hx;
      if (Math.abs(along) > C.len + 1.0 || Math.abs(across) > C.half) continue;
      sl.mask |= 1 << k.slot;
      if (CartKit.hit(s, k, 'knock', 'slug', { dx: hx, dz: hz, power: 10, dur: 0.8, banner: 'SLUGGED!' })) { cartIxSound(s, 'splat', k.x, k.z, 0.9, 0.8); if (s.fx) s.fx.burst(k.x, k.y + 0.8, k.z, 'ring', 8, '#c8ff70'); }
    }
    // the trail: fades; driving through slows you (or boosts the snail)
    for (const p of sl.trail) {
      if (!p.live) continue; p.t += dt; if (p.t > C.life) { p.live = false; continue; }
      if (!racing) continue;
      for (const k of s.karts) {
        if (k.out || k.air || L.slimeCd[k.slot] > 0) continue;
        if ((k.x - p.x) ** 2 + (k.z - p.z) ** 2 > (C.r + 0.8) ** 2) continue;
        L.slimeCd[k.slot] = 2.2;
        if (k.car.id === 'snail') { s.boost(k, 0.55, 'slime'); k.slimeT = Math.max(k.slimeT, 1.2); CartKit.touch(s, k, 'slime', 'SLIME SURF!', '#a8ff5a'); }
        else if (k.shieldT <= 0) { k.slowT = Math.max(k.slowT, 0.9); k.vx *= 0.82; k.vz *= 0.82; CartKit.touch(s, k, 'slime', 'SLIMED!', '#a8ff5a'); if (k.player) Sound.play('splat', { vol: 0.6, pitch: 0.9 }); }
      }
    }
    const o = sl.obj; if (o) {
      const rear = sl.st === 'peek' ? Math.sin(Math.min(1, sl.t / C.peek) * Math.PI) * 0.25 : 0, inch = sl.st === 'crawl' ? 1 + Math.sin(s.time * 5 + sl.i) * 0.05 : 1;
      o.live = true; o.visible = true; o.x = x; o.z = z; o.y = s.terrain.height(x, z); o.yaw = Math.atan2(hx, hz); o.pitch = -rear; o.roll = 0; o.scale = inch * C.scale;
    }
  }
}
// ---- the lawn sprinkler: ticks (the wedge it will water flashes), its jet sweeps across the road one way, rests, then
// sweeps back. The jet is a line out from the head: anything it passes over is shoved away and soaked (hop it) ----
function gdnSprinkler(s, L, dt, racing) {
  const C = GDN_SPR, P = L.spr, T = s.T, tt = s.time + 2.2, c = Math.floor(tt / C.period), ph = tt - c * C.period;
  P.dir = c % 2 ? -1 : 1;
  const st = ph < C.warn ? 'warn' : ph < C.warn + C.sweep ? 'sweep' : 'rest';
  P.aPrev = P.a;
  if (st === 'warn') { P.u = ph / C.warn; P.a = -P.dir * C.arc + Math.sin(s.time * 40) * 0.03; if (P.c !== c) { P.c = c; P.mask = 0; } if (CartKit.near(s, P.x, P.z, 70) && Math.floor(ph * 8) !== Math.floor((ph - dt) * 8)) cartIxSound(s, 'tick', P.x, P.z, 0.6, 0.7); }
  else if (st === 'sweep') { P.u = (ph - C.warn) / C.sweep; P.a = P.dir * C.arc * (2 * P.u - 1); if (P.st !== 'sweep') { P.aPrev = P.a; CartKit.fired(s, 'sprinkler'); if (CartKit.near(s, P.x, P.z, 90)) cartIxSound(s, 'splash', P.x, P.z, 0.7, 1.3); } if (CartKit.near(s, P.x, P.z, 60) && Math.floor(ph * 5) !== Math.floor((ph - dt) * 5)) cartIxSound(s, 'tick', P.x, P.z, 0.5, 1.1); }
  else { P.u = (ph - C.warn - C.sweep) / (C.period - C.warn - C.sweep); P.a = P.dir * C.arc; }
  P.st = st;
  // the jet (in the road's frame: along = +tangent from the sprinkler's arc length, p = distance out from the head)
  if (st === 'sweep') {
    const ca = Math.cos(P.a), sa = Math.sin(P.a);
    // obstacles along the jet over the road (the AI's line around it, mostly so it brakes for it)
    for (let p = P.off + 2; p < P.off + P.wl + P.wr; p += 6) cartIxObs(s, P.x + (P.nx * ca + P.tx * sa) * p / ca, P.z + (P.nz * ca + P.tz * sa) * p / ca, 1.2);
    if (racing) for (const k of s.karts) {
      if (k.out || (P.mask & (1 << k.slot))) continue;
      const along = CartKit.ds(T, P.s, k.loc.s); if (Math.abs(along) > 70) continue;
      const p = P.off + k.loc.d; if (p < 2 || p > P.off + P.wl + P.wr + 4) continue;
      const phi = Math.atan2(along, p), d0 = phi - P.aPrev, d1 = phi - P.a;
      if (!(d0 * d1 <= 0 && Math.abs(d0 - d1) < 0.5)) continue;
      P.mask |= 1 << k.slot;
      if (k.air && k.y > s.terrain.height(k.x, k.z) + 0.25) { if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); continue; }
      if (k.shieldT > 0) continue;
      const jx = P.nx * ca + P.tx * sa, jz = P.nz * ca + P.tz * sa;
      k.vx = k.vx * 0.8 + jx * C.push; k.vz = k.vz * 0.8 + jz * C.push; k.slowT = Math.max(k.slowT, 0.8);
      if (k.player) { L.blind = 1.0; Sound.play('splash', { vol: 0.8, pitch: 1.1 }); s.shakeIt(0.4); }
      CartKit.touch(s, k, 'sprinkler', 'SPRINKLED!', '#7ad8ff');
      if (s.fx && CartKit.near(s, k.x, k.z, 80)) s.fx.burst(k.x, k.y + 1.2, k.z, 'ring', 8, '#bfe8ff');
    }
  }
  const o = P.obj; if (o) { const shud = st === 'warn' ? Math.sin(s.time * 50) * 0.04 : 0, ca = Math.cos(P.a), sa = Math.sin(P.a); o.live = true; o.visible = true; o.x = P.x; o.z = P.z; o.y = s.terrain.height(P.x, P.z) + 0.4; o.yaw = Math.atan2(P.nx * ca + P.tx * sa, P.nz * ca + P.tz * sa); o.pitch = shud; o.roll = shud; o.scale = 2.4; }
}
// ---- the robin: perches on the bird bath; picks a car coming down the straight, a target locks on the road where
// that car will be (it flutters over it), swoops and pecks, pecks the ground a moment, flies home ----
function gdnRobin(s, L, dt, racing) {
  const C = GDN_ROBIN, B = L.robin, T = s.T;
  B.t += dt; B.flap += dt;
  if (B.st === 'perch') {
    B.x = B.px; B.y = B.py; B.z = B.pz;
    if (racing && B.t > C.cool) {
      // a car about to come into the zone (not the one it just went for)
      let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ds(T, k.loc.s, B.s); if (ds < 20 || ds > 70) continue; const sc = ds + (k === B.last ? 40 : 0) + L.rng() * 10; if (sc < bd) { bd = sc; best = k; } }
      if (best) {
        const lead = Math.max(14, best.speed) * (C.eye + C.peck), sv = best.loc.s + lead, ds = CartKit.ds(T, B.s, sv);
        if (Math.abs(ds) < C.zone) {
          const g = T.at(((sv % T.L) + T.L) % T.L, GDN_T.at2), d = clamp(best.loc.d + (L.rng() - 0.5) * 3, -g.wl + 2, g.wr - 2);
          B.tgt = best; B.last = best; B.as = sv; B.ad = d; B.ax = g.x + g.nx * d; B.az = g.z + g.nz * d; B.st = 'eye'; B.t = 0; B.mask = 0; B.fx0 = B.x; B.fz0 = B.z;
          if (CartKit.near(s, B.px, B.pz, 90)) cartIxSound(s, 'whistle', B.px, B.pz, 0.6, 1.9);
          if (best.player) gdnBanner(s, L, best, 'HUNGRY ROBIN!', 'swerve off the target');
        }
      }
    }
  } else if (B.st === 'eye') {
    // flutter up and hover over the target, high
    const u = Math.min(1, B.t / C.eye), e = u * u * (3 - 2 * u);
    B.x = lerp(B.fx0, B.ax, e); B.z = lerp(B.fz0, B.az, e); B.y = lerp(B.py, 9, Math.min(1, u * 2));
    cartIxObs(s, B.ax, B.az, C.r + 0.8);
    if (B.t > C.eye) { B.st = 'peck'; B.t = 0; CartKit.fired(s, 'robin'); }
  } else if (B.st === 'peck') {
    const u = Math.min(1, B.t / C.peck); B.x = B.ax; B.z = B.az; B.y = 9 * (1 - u * u);
    cartIxObs(s, B.ax, B.az, C.r + 0.8);
    if (B.t > C.peck) {
      B.st = 'eat'; B.t = 0; B.y = 0;
      if (racing) for (const k of s.karts) { if (k.out || (k.air && k.y > s.terrain.height(k.x, k.z) + 1.5)) continue; const dx = k.x - B.ax, dz = k.z - B.az; if (dx * dx + dz * dz > C.r * C.r) continue; B.mask |= 1 << k.slot; if (CartKit.hit(s, k, 'flip', 'robin', { dx: dx / (Math.hypot(dx, dz) || 1), dz: dz / (Math.hypot(dx, dz) || 1), banner: 'PECKED!' })) { cartIxSound(s, 'kick', k.x, k.z, 0.9, 1.3); if (s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'star', 10, '#ffd23a'); } }
      if (s.fx && CartKit.near(s, B.ax, B.az, 90)) { s.fx.dust(B.ax, 0.4, B.az, 12, '#b89a70'); s.fx.burst(B.ax, 0.6, B.az, 'ring', 8, '#ffffff'); }
      if (CartKit.near(s, B.ax, B.az, 70)) { cartIxSound(s, 'stomp', B.ax, B.az, 0.7, 1.4); if (CartKit.near(s, B.ax, B.az, 25)) s.shakeIt(0.6); }
    }
  } else if (B.st === 'eat') {
    // on the road, pecking the ground: an obstacle (bump it and it shoves you off)
    B.x = B.ax; B.z = B.az; B.y = 0; cartIxObs(s, B.x, B.z, 3.2);
    if (racing) for (const k of s.karts) { if (k.out || (B.mask & (1 << k.slot)) || k.y > 3) continue; const dx = k.x - B.x, dz = k.z - B.z, D = Math.hypot(dx, dz); if (D > 2.8) continue; B.mask |= 1 << k.slot; if (CartKit.hit(s, k, 'knock', 'robin', { dx: dx / (D || 1), dz: dz / (D || 1), power: 11, dur: 0.8, banner: 'BIRD STRIKE!' })) cartIxSound(s, 'bump', k.x, k.z, 0.8, 1.1); }
    if (B.t > C.eat) { B.st = 'fly'; B.t = 0; B.fx0 = B.x; B.fz0 = B.z; if (CartKit.near(s, B.x, B.z, 60)) cartIxSound(s, 'whistle', B.x, B.z, 0.4, 2.3); }
  } else {
    const u = Math.min(1, B.t / C.fly), e = u * u * (3 - 2 * u); B.x = lerp(B.fx0, B.px, e); B.z = lerp(B.fz0, B.pz, e); B.y = lerp(0, B.py, e) + Math.sin(u * Math.PI) * 7;
    if (B.t > C.fly) { B.st = 'perch'; B.t = 0; }
  }
  // pose the body and the two wings
  const fly = B.st === 'eye' || B.st === 'fly' || (B.st === 'peck'), sc = C.scale;
  let yaw = B.yawR; if (B.st === 'eye' || B.st === 'peck' || B.st === 'eat') { const g = T.at(((B.as % T.L) + T.L) % T.L, GDN_T.at2); yaw = Math.atan2(-g.tx, -g.tz); } else if (B.st === 'fly') yaw = Math.atan2(B.px - B.fx0, B.pz - B.fz0);
  const peckA = B.st === 'eat' ? Math.max(0, Math.sin(B.t * 14)) * 0.5 : B.st === 'peck' ? 0.45 : 0;
  const o = B.obj; if (o) { o.live = true; o.visible = true; o.x = B.x; o.z = B.z; o.y = s.terrain.height(B.x, B.z) + B.y + (B.st === 'perch' ? Math.abs(Math.sin(s.time * 3)) * 0.15 : 0); o.yaw = yaw; o.pitch = peckA; o.roll = 0; o.scale = sc; }
  const flapA = fly ? Math.sin(s.time * 26) * 0.9 + 0.5 : 0.05, c = Math.cos(yaw), sn = Math.sin(yaw);
  for (const [w, sd] of [[B.wl, -1], [B.wr, 1]]) { if (!w) continue; const lx = sd * 1.3 * sc, ly = 3.0 * sc, lz = 0.2 * sc; w.live = true; w.visible = true; w.x = o.x + lx * c + lz * sn; w.z = o.z - lx * sn + lz * c; w.y = o.y + ly; w.yaw = yaw; w.pitch = 0; w.roll = sd * flapA; w.scale = sc; }
}
// ---- sprites: the gnome rings, the slime, the sprinkler's wedge and jet, the robin's target ----
function gdnNear(cam, x, z, r) { return (x - cam.x) ** 2 + (z - cam.z) ** 2 < r * r; }
function gdnDraw(s, L, R, S, t) {
  const C = GDN_C, cam = s.cam, T = s.T;
  for (const g of L.gnomes) {
    if (!gdnNear(cam, g.hx, g.hz, 200)) continue;
    if (g.st === 'wind' || g.st === 'jump') {
      const fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 18)), u = g.st === 'wind' ? g.u * 0.6 : 0.6 + g.u * 0.4, r = GDN_GNOME.land * 2;
      R.flat.flat(g.tx, 0.09, g.tz, r, r, 0, S.glow, C.red, 0.6 * fl, true);
      R.flat.flat(g.tx, 0.1, g.tz, r * (1.6 - u * 0.6), r * (1.6 - u * 0.6), t * 2, S.reticle || S.ring, C.red, 1, false);
      R.flat.flat(g.tx, 0.11, g.tz, r * 0.9, r * 0.9, 0, S.ring, C.white, 0.8 * fl, false);
      R.flat.flat(g.tx, 0.08, g.tz, 1 + u * 3.5, 1 + u * 3.5, 0, S.shadow, C.black, 0.25 + u * 0.4, false);
      if (g.st === 'wind') R.bbs.bb(g.hx, 6.6, g.hz, 2.6, 2.6, S.warn, C.warn, 0.6 + 0.4 * fl, true);
    } else if (g.st === 'stand') {
      R.flat.flat(g.x, 0.08, g.z, 4.5, 4.5, 0, S.shadow, C.black, 0.45, false);
      R.flat.flat(g.x, 0.1, g.z, GDN_GNOME.body * 2.4, GDN_GNOME.body * 2.4, -t, S.ring, C.warn, 0.5, false);
    } else R.flat.flat(g.x, 0.06, g.z, 3, 3, 0, S.shadow, C.black, 0.3, false);
  }
  for (const sl of L.slugs) {
    if (!gdnNear(cam, sl.x, sl.z, 200)) continue;
    // the slime: glossy green blobs with glints
    for (const p of sl.trail) {
      if (!p.live) continue; const a = Math.min(1, p.t * 4, (GDN_SLUG.life - p.t) * 0.8), w = GDN_SLUG.r * 3.1;
      R.flat.flat(p.x, 0.085, p.z, w * 1.2, w * 1.3, p.rot + 0.4, S.splat || S.puff, GDN_SLIME_RIM, 0.7 * a, false);   // a dark rim: the line reads at speed
      R.flat.flat(p.x, 0.09, p.z, w, w * 1.1, p.rot, S.splat || S.puff, C.slime, 0.95 * a, false);
      R.flat.flat(p.x, 0.1, p.z, w * 0.6, w * 0.6, p.rot + 1, S.glow, C.slimeHi, 0.4 * a, true);
      if ((p.rot * 7 | 0) % 3 === 0) R.bbs.bb(p.x, 0.5, p.z, 0.9, 0.9, S.star, C.white, 0.6 * a * (0.5 + 0.5 * Math.sin(t * 6 + p.rot)), true, t);
    }
    if (sl.st === 'peek') {
      // its path flashes green across the road, chevrons the way it'll crawl
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 16)), dir = -sl.sd, edge = Math.max(sl.wl, sl.wr) + 2;
      R.flat.flat(sl.x, 0.08, sl.z, edge * 2, 3.2, sl.yaw, S.square, C.green, 0.45 * fl, false);
      for (let i = 0; i < 6; i++) { const u = (i / 6 + t * 0.8) % 1, dd = sl.sd * edge + dir * u * edge * 2; R.flat.flat(sl.x + sl.nx * dd, 0.11, sl.z + sl.nz * dd, 3.6, 3.6, Math.atan2(sl.nx * dir, sl.nz * dir), S.arrow, C.slimeHi, 0.9 * fl, false); }
      R.bbs.bb(sl.wx, 4.4, sl.wz, 2.6, 2.6, S.warn, C.warn, 0.6 + 0.4 * fl, true);
    }
    R.flat.flat(sl.wx, 0.07, sl.wz, 4, 8, Math.atan2(sl.hx, sl.hz), S.shadow, C.black, 0.3, false);
  }
  const P = L.spr;
  if (gdnNear(cam, P.x, P.z, 240)) {
    if (P.st === 'warn') {
      // the wedge it will water flashes blue; arrows sweep the way the jet will go
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 16)), pFar = P.off + P.wl + P.wr + 3;
      for (let i = 0; i <= 8; i++) {
        const a = -GDN_SPR.arc + i / 8 * 2 * GDN_SPR.arc, ca = Math.cos(a), sa = Math.sin(a), jx = P.nx * ca + P.tx * sa, jz = P.nz * ca + P.tz * sa, l0 = (P.off + 1) / ca, l1 = pFar / ca, lm = (l0 + l1) / 2;
        R.flat.flat(P.x + jx * lm, 0.08, P.z + jz * lm, 1.2, l1 - l0, Math.atan2(jx, jz), S.square, C.blue, 0.42 * fl * (0.4 + P.u * 0.6), false);
      }
      for (let i = 0; i < 5; i++) { const a = P.dir * (-GDN_SPR.arc + ((i / 5 + t * 0.7) % 1) * 2 * GDN_SPR.arc), ca = Math.cos(a), sa = Math.sin(a), jx = P.nx * ca + P.tx * sa, jz = P.nz * ca + P.tz * sa, l = (P.off + P.wl) / ca; R.flat.flat(P.x + jx * l, 0.11, P.z + jz * l, 4.4, 4.4, Math.atan2(P.tx * P.dir * ca - P.nx * P.dir * sa, P.tz * P.dir * ca - P.nz * P.dir * sa), S.arrow, C.white, 0.9 * fl, false); }
      // sputters from the nozzle
      for (let i = 0; i < 4; i++) { const u = (t * 2 + i * 0.25) % 1; R.bbs.bb(P.x + P.nx * u * 4, 5 + u * 2 - u * u * 6, P.z + P.nz * u * 4, 0.5, 0.9, S.drop, C.water, 0.9, false); }
    } else if (P.st === 'sweep') {
      // the jet: an arc of water from the nozzle to the far side of the road, spray where it lands
      const ca = Math.cos(P.a), sa = Math.sin(P.a), jx = P.nx * ca + P.tx * sa, jz = P.nz * ca + P.tz * sa, Lj = (P.off + P.wl + P.wr + 4) / ca, n = 12, a = Math.min(1, P.u * 10, (1 - P.u) * 10);
      let px = P.x, pz = P.z, py = 5.2;
      for (let i = 1; i <= n; i++) { const u = i / n, x = P.x + jx * Lj * u, z = P.z + jz * Lj * u, y = 5.2 + Lj * 0.3 * u - (Lj * 0.3 + 4.2) * u * u, sl = Math.hypot(x - px, y - py, z - pz) + 0.8; R.bbs.streak((px + x) / 2, (py + y) / 2, (pz + z) / 2, x - px, y - py, z - pz, sl, 7.0, S.glow, C.deep, 0.8 * a); R.bbs.streak((px + x) / 2, (py + y) / 2, (pz + z) / 2, x - px, y - py, z - pz, sl, 5.4, S.streak, C.water, 1.0 * a); R.bbs.streak((px + x) / 2, (py + y) / 2 + 0.2, (pz + z) / 2, x - px, y - py, z - pz, sl, 2.8, S.streak, C.white, 1.0 * a); R.bbs.bb(x, y, z, 3.6, 3.6, S.puff, C.white, 0.7 * a, false, t * 3 + i); if (i % 2) R.bbs.bb(x + Math.sin(t * 9 + i) * 0.8, y - 1 - ((t * 3 + i * 0.3) % 1) * 3, z, 0.6, 1.1, S.drop, C.water, 0.9 * a, false); px = x; py = y; pz = z; }
      // the wet stripe on the road right under the jet (where it's hitting now)
      { const l0 = (P.off - 2) / ca, l1 = Lj, lm = (l0 + l1) / 2; R.flat.flat(P.x + jx * lm, 0.09, P.z + jz * lm, 3.4, l1 - l0, Math.atan2(jx, jz), S.square, C.deep, 0.55 * a, false); R.flat.flat(P.x + jx * lm, 0.1, P.z + jz * lm, 1.6, l1 - l0, Math.atan2(jx, jz), S.square, C.water, 0.7 * a, false); }
      for (let i = 0; i < 4; i++) { const u = 0.35 + i * 0.2, x = P.x + jx * Lj * u, z = P.z + jz * Lj * u; R.flat.flat(x, 0.1, z, 6, 6, t * 3 + i, S.ring, C.white, 0.45 * a, false); R.flat.flat(x, 0.09, z, 5, 5, 0, S.glow, C.water, 0.3 * a, true); }
      R.bbs.bb(px, 1.0, pz, 5, 3, S.puff, C.white, 0.7 * a, false, t * 4);
      if (s.fx && Math.random() < 0.5 && gdnNear(cam, P.x, P.z, 100)) s.fx.add(px, 1, pz, (Math.random() - 0.5) * 6, 3 + Math.random() * 3, (Math.random() - 0.5) * 6, 0.6, 0.4, 0.15, C.water, 0.9, 'drop', 0, 0, 0);
    }
  }
  const B = L.robin;
  if (gdnNear(cam, B.px, B.pz, 260)) {
    if (B.st === 'eye' || B.st === 'peck') {
      const u = B.st === 'eye' ? Math.min(1, B.t / GDN_ROBIN.eye) : 1, fl = 0.5 + 0.5 * Math.sin(t * (10 + u * 18)), r = GDN_ROBIN.r * 2;
      R.flat.flat(B.ax, 0.09, B.az, r * 1.2, r * 1.2, 0, S.glow, C.red, 0.6 * fl, true);
      R.flat.flat(B.ax, 0.1, B.az, r * (1.8 - u * 0.8), r * (1.8 - u * 0.8), t * 3, S.reticle || S.ring, C.red, 1, false);
      R.flat.flat(B.ax, 0.11, B.az, r * 0.9, r * 0.9, 0, S.ring, C.white, 0.8 * fl, false);
      R.flat.flat(B.ax, 0.08, B.az, 1.5 + u * 4, 1.5 + u * 4, 0, S.shadow, C.black, 0.25 + u * 0.4, false);
    } else if (B.st === 'eat') {
      R.flat.flat(B.x, 0.08, B.z, 6, 6, 0, S.shadow, C.black, 0.45, false);
      if (Math.sin(B.t * 14) > 0.9 && s.fx && gdnNear(cam, B.x, B.z, 80)) s.fx.dust(B.x + Math.sin(B.yawR) * 3, 0.3, B.z, 2, '#a88a60');
    }
    if (B.st !== 'perch' && B.st !== 'eat') R.flat.flat(B.x, 0.07, B.z, 5, 5, 0, S.shadow, C.black, 0.25, false);
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.garden) and the level's live state
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  const D = C.debug, NAMES = ['gnome-warn', 'gnome', 'slug-warn', 'slime', 'sprinkler-warn', 'sprinkler', 'robin-warn', 'robin', 'lawn'];
  D.trackShots = D.trackShots || {};
  D.trackShots.garden = { list: () => NAMES.map(name => ({ name })), shot: name => gdnShot(D, name) };
  D.trackLevel = D.trackLevel || {};
  D.trackLevel.garden = () => {
    const s = Game.scene; if (!s || !s.gdn) return null;
    const K = s.kit || {}, L = s.gdn;
    return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, gnomes: L.gnomes.map(g => g.st), slugs: L.slugs.map(q => q.st + ':' + q.trail.filter(p => p.live).length), spr: L.spr.st, robin: L.robin.st };
  };
}, 0);
function gdnShot(D, name) {
  const STEP = 1 / 60;
  D.start({ mode: 'quick', track: 'garden', car: 'snail', driver: 'brady', seed: 9, autoGas: true });
  const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
  const L = s.gdn, T = s.T, P = s.player, B = s.E.gdn;
  let pin = null; const pins = [];
  const park = (sv, lat, speed, frozen) => { const g = T.at(((sv % T.L) + T.L) % T.L, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 2; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
  const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at((((P.loc.s + r[0]) % T.L) + T.L) % T.L, {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 2; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
  s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
  const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
  const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
  let ok = true;
  if (name === 'gnome-warn' || name === 'gnome') { const g = L.gnomes[1]; park(g.s - 24, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'gnome-warn' ? g.st === 'wind' && g.u > 0.5 : g.st === 'jump' && g.u > 0.55, 12); }
  else if (name === 'slug-warn' || name === 'slime') { const sl = L.slugs[0]; park(sl.s - 22, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'slug-warn' ? sl.st === 'peek' && sl.t > 0.6 : sl.st === 'crawl' && Math.abs(sl.d) < 3, 30); }
  else if (name === 'sprinkler-warn' || name === 'sprinkler') { const p = L.spr; park(p.s - 34, 0.2, 0, true); rivals([[-50, 0, 1]]); ok = wait(() => name === 'sprinkler-warn' ? p.st === 'warn' && p.u > 0.5 : p.st === 'sweep' && p.u > 0.35 && p.u < 0.6, 14); }
  else if (name === 'robin-warn' || name === 'robin') { const b = L.robin; park(b.s - 58, 0, 20, false); rivals([[-30, 0, 1]]); ok = wait(() => name === 'robin-warn' ? b.st === 'eye' && b.t > 0.8 : b.st === 'eat' && b.t > 0.1, 14); if (ok) { pin = { x: P.x, z: P.z, yaw: P.yaw }; } }
  else if (name === 'lawn') { park(B.S.lawn + 70, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
  s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
  return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, touch: (s.kit || {}).touch, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
}
