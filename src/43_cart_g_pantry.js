/* ============================================================
   ART CART — secret arena: THE SUGAR COUNTER (id 'pantry'), Frosted Fury's level
   A giant kitchen counter, seen from a cupcake's height: white marble with
   a dusting of flour, a candy-cane fence round the edge, a three-tier
   birthday cake with lit candles in the middle, a fallen rolling pin, giant
   cupcakes, a macaron tower, a spilled sprinkle jar and a heap of sugar
   cubes; beyond the fence the kitchen looms (tiled backsplash, a stand
   mixer, a kettle, cookie jars).
   Its own game: FROSTING FRENZY. Every car pipes its own frosting colour
   onto the counter wherever it drives. Run over a rival's frosting to cover
   it with yours. CHERRY BOMBS splat a big blob of your colour; landing a hit
   on a rival splats your colour all round them. When the timer runs out,
   the most counter covered wins.
   Everything here is an original design (affectionate satire, PG-13).
   Registers itself: CART_ARENAS (no royale flag), CartWorlds.arena_pantry,
   CART_ARENA_RULES.pantry, CART_OBJECTIVES.frost, CART_ARENA_ICONS.pantry and
   CART_SECRET_LEVELS.cupcake. Globals PTY_*, scene state s.pty, world E.pty.
   ============================================================ */

const PTY_C = { HX: 58, HZ: 44, CR: 16, CS: 3.0, PAINT_R: 2.4, CHERRY_R: 9, HIT_R: 5.5, CHERRIES: 3, CHERRY_T: 6 };
// the frosting colours, one per starting slot (the player's is shown on the HUD)
const PTY_COLS = ['#ff5aa8', '#5ac8ff', '#b07aff', '#5ae88a', '#ffd23a', '#ff8a3a', '#8a5236', '#ff3a4a'];
const PTY_NAMES = ['STRAWBERRY', 'BLUEBERRY', 'LAVENDER', 'MINT', 'LEMON', 'ORANGE', 'CHOCOLATE', 'CHERRY'];
// three shades of each (cells pick one, so a frosted counter has texture, not flat paint) and the plain colour
const PTY_SH = PTY_COLS.map(c => { const v = burnsRGBf(c); return [0.86, 1, 1.12].map(k => [Math.min(1, v[0] * k), Math.min(1, v[1] * k), Math.min(1, v[2] * k)]); });
const PTY_RGB = PTY_COLS.map(c => burnsRGBf(c));
const PTY_P = {}, PTY_WHITE = [1, 1, 1], PTY_CHERRY = [1, 0.15, 0.25];
// the counter's outline: a rounded rectangle
function ptyPoly() { const C = PTY_C, out = []; for (const [cx, cz, a0] of [[C.HX - C.CR, C.HZ - C.CR, 0], [C.HX - C.CR, -(C.HZ - C.CR), Math.PI / 2], [-(C.HX - C.CR), -(C.HZ - C.CR), Math.PI], [-(C.HX - C.CR), C.HZ - C.CR, Math.PI * 1.5]]) for (let i = 0; i <= 5; i++) { const a = a0 + i / 5 * Math.PI / 2; out.push([cx + Math.sin(a) * C.CR, cz + Math.cos(a) * C.CR]); } return out; }
// how far (x, z) is inside the rounded rectangle (negative = outside)
function ptyInside(x, z) { const C = PTY_C, ax = Math.abs(x) - (C.HX - C.CR), az = Math.abs(z) - (C.HZ - C.CR); if (ax <= 0 || az <= 0) return Math.min(C.HX - Math.abs(x), C.HZ - Math.abs(z)); return C.CR - Math.hypot(ax, az); }
// obstacles (circle footprints) the frosting can't go under
const PTY_OBST = [[0, 0, 8.4], [34, -22, 4.2], [-36, -24, 4.2], [32, 24, 3.6], [-6, -30, 3.8], [-10, 31, 3.4], [-31, 9, 2.4], [-31, 18, 2.4], [-31, 0, 2.4]];

/* ---------------- the world ---------------- */
CartWorlds.arena_pantry = function (A, night) {
  const C = PTY_C, E = this.base(2044, [-110, -110, 110, 110], '#a8785a', 0.1);
  const sky = Object.assign(CART_SKIES.day(), { sky: '#ffd8ea', hor: '#ffe6d0', fog: '#e8c8d4', fogD: 0.002, zen: '#9ac8ff', key: '#fff2e0', keyK: 1.0, clouds: 0.35, haze: 0.08 });
  Object.assign(E, { id: 'pantry', arena: A, sky, tod: 'day', music: 'kart1', night: false, R: 50 });
  const api = E.api, rng = mulberry32(4444);
  const free = (x, z, r) => ptyInside(x, z) > r + 2 && PTY_OBST.every(o => Math.hypot(x - o[0], z - o[1]) > o[2] + r);
  // ---- the counter: marble veins, flour dust, sprinkles, a cutting board, sticky rings from a juice glass ----
  api.paint((ctx, P, S) => {
    const poly = ptyPoly();
    // the kitchen floor beyond the counter: warm wooden planks
    for (let x = -110; x < 110; x += 4) { const q0 = P(x, -110), q1 = P(x, 110); ctx.strokeStyle = 'rgba(70,40,24,0.35)'; ctx.lineWidth = 0.18 * S; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); for (let z = -110 + rng() * 20; z < 110; z += 14 + rng() * 10) { const q = P(x, z), r = P(x + 4, z); ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(r[0], r[1]); ctx.stroke(); } }
    ctx.fillStyle = '#d8ccc6'; ctx.beginPath(); for (const [x, z] of poly) { const q = P(x * 1.06, z * 1.06); ctx.lineTo(q[0], q[1]); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f1e6e0'; ctx.beginPath(); for (const [x, z] of poly) { const q = P(x, z); ctx.lineTo(q[0], q[1]); } ctx.closePath(); ctx.fill();
    for (let v = 0; v < 26; v++) { let x = (rng() - 0.5) * 120, z = (rng() - 0.5) * 90, a = rng() * TAU; ctx.strokeStyle = `rgba(${150 + rng() * 40 | 0},${140 + rng() * 40 | 0},${150 + rng() * 40 | 0},${0.18 + rng() * 0.2})`; ctx.lineWidth = (0.15 + rng() * 0.4) * S; ctx.beginPath(); let q = P(x, z); ctx.moveTo(q[0], q[1]); for (let i = 0; i < 24; i++) { a += (rng() - 0.5) * 0.9; x += Math.sin(a) * 2.2; z += Math.cos(a) * 2.2; q = P(x, z); ctx.lineTo(q[0], q[1]); } ctx.stroke(); }
    for (let i = 0; i < 40; i++) { const x = (rng() - 0.5) * 110, z = (rng() - 0.5) * 80, q = P(x, z), r = (2 + rng() * 6) * S, g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r); g.addColorStop(0, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, TAU); ctx.fill(); }
    // spilled sprinkles round the jar, and a sprinkle of sprinkles everywhere
    const spr = ['#ff5aa8', '#5ac8ff', '#ffd23a', '#5ae88a', '#b07aff', '#ff8a3a'];
    for (let i = 0; i < 900; i++) { const near = i < 420, a = rng() * TAU, r = near ? Math.pow(rng(), 0.7) * 14 : 0, x = near ? -10 + Math.sin(a) * r + 6 : (rng() - 0.5) * 110, z = near ? 31 + Math.cos(a) * r * 0.7 - 4 : (rng() - 0.5) * 82, q = P(x, z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(rng() * 3); ctx.fillStyle = spr[i % spr.length]; ctx.globalAlpha = near ? 0.9 : 0.5; ctx.beginPath(); ctx.ellipse(0, 0, 0.32 * S, 0.1 * S, 0, 0, TAU); ctx.fill(); ctx.restore(); }
    // sticky rings, crumbs
    for (const [x, z, r] of [[24, -6, 3.2], [-18, -14, 2.6], [12, 34, 2.8]]) { const q = P(x, z); ctx.strokeStyle = 'rgba(230,140,60,0.25)'; ctx.lineWidth = 0.5 * S; ctx.beginPath(); ctx.arc(q[0], q[1], r * S, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 160; i++) { const q = P((rng() - 0.5) * 110, (rng() - 0.5) * 80); ctx.fillStyle = `rgba(${190 + rng() * 40 | 0},${130 + rng() * 40 | 0},70,0.55)`; ctx.beginPath(); ctx.arc(q[0], q[1], (0.1 + rng() * 0.25) * S, 0, TAU); ctx.fill(); }
    // a shadow ring round the cake
    { const q = P(0, 0), g = ctx.createRadialGradient(q[0], q[1], 7 * S, q[0], q[1], 11 * S); g.addColorStop(0, 'rgba(140,90,110,0.35)'); g.addColorStop(1, 'rgba(140,90,110,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], 11 * S, 0, TAU); ctx.fill(); }
  });
  // ---- the birthday cake: three tiers, drips, piped beads, strawberries, five candles ----
  CartScene.mesh(api, 0, 0, 0, m => {
    m.color('#f0e6f4').shine(2); m.lathe([[0, 0], [8.0, 0], [8.0, 0.25], [0, 0.25]], { seg: 32 });   // the plate
    const tiers = [[7.0, 0.25, 2.6, '#ffc8de'], [5.2, 2.85, 2.4, '#fff4e0'], [3.5, 5.25, 2.2, '#c8eaff']];
    for (const [r, y, h, c] of tiers) {
      m.color(c).shine(1); m.lathe([[0, y], [r, y], [r + 0.1, y + 0.2], [r + 0.1, y + h - 0.25], [r - 0.15, y + h], [0, y + h]], { seg: 28 });
      // drips of pink icing over the rim and a bead border at the foot
      m.color('#ff7ab8').shine(2); const nd = Math.round(r * 2.2); for (let i = 0; i < nd; i++) { const a = i / nd * TAU, l = 0.4 + ((i * 7) % 5) * 0.18; m.limb(Math.sin(a) * (r + 0.12), y + h - 0.05, Math.cos(a) * (r + 0.12), Math.sin(a) * (r + 0.14), y + h - l, Math.cos(a) * (r + 0.14), 0.22, 0.17, { seg: 5 }); m.ball(Math.sin(a) * (r + 0.14), y + h - l, Math.cos(a) * (r + 0.14), 0.19, { seg: 5, rings: 3 }); }
      m.color('#ffffff').shine(1); const nb = Math.round(r * 3.2); for (let i = 0; i < nb; i++) { const a = i / nb * TAU; m.ball(Math.sin(a) * (r + 0.1), y + 0.18, Math.cos(a) * (r + 0.1), 0.24, { seg: 6, rings: 4 }); }
    }
    m.color('#ff7ab8'); m.ellipsoid(0, 7.45, 0, 3.4, 0.25, 3.4, { seg: 20, rings: 4, phi1: Math.PI / 2 });
    m.color('#e8203a').shine(3); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; m.push(); m.tf(Math.sin(a) * 2.7, 7.7, Math.cos(a) * 2.7); m.lathe([[0, -0.1], [0.42, 0.1], [0.36, 0.45], [0.12, 0.72], [0, 0.75]], { seg: 8 }); m.color('#3aa84a').shine(1); m.ball(0, 0.78, 0, 0.12, { seg: 5, rings: 3 }); m.color('#e8203a').shine(3); m.pop(); }
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, x = Math.sin(a) * 1.4, z = Math.cos(a) * 1.4; m.color(['#ff5aa8', '#5ac8ff', '#ffd23a', '#5ae88a', '#b07aff'][i]).shine(1); m.limb(x, 7.5, z, x, 9.6, z, 0.16, 0.16, { seg: 8 }); m.color('#ffffff'); for (let j = 0; j < 3; j++) m.torus(x, 7.9 + j * 0.6, z, 0.17, 0.035, { seg: 8, tseg: 3 }); m.color('#ffd060', 1); m.push(); m.tf(x, 9.75, z); m.lathe([[0, 0], [0.13, 0.1], [0.1, 0.35], [0, 0.6]], { seg: 6 }); m.pop(); m.emissive(0); }
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 7.3, y0: 0, y1: 9 }] };
  }, { hi: true });
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; api.glow(Math.sin(a) * 1.4, 10.0, Math.cos(a) * 1.4, 1.2, '#ffc860'); }
  E.art.push({ x: 0, z: 0, r: 7.8 });
  // ---- giant cupcakes: fluted wrapper, swirled frosting, sprinkles and a cherry ----
  const cupcake = (x, z, col, wrap, s) => {
    CartScene.mesh(api, x, z, rng() * TAU, m => {
      m.color(wrap).shine(1); const n = 18, prof = [];
      m.lathe([[0, 0], [2.6 * s, 0], [3.3 * s, 3.0 * s], [3.4 * s, 3.1 * s], [0, 3.1 * s]], { seg: n });
      m.color(shade(wrap, -0.15)); for (let i = 0; i < n; i++) { const a = (i + 0.5) / n * TAU; m.limb(Math.sin(a) * 2.62 * s, 0.05, Math.cos(a) * 2.62 * s, Math.sin(a) * 3.36 * s, 3.05 * s, Math.cos(a) * 3.36 * s, 0.12 * s, 0.12 * s, { seg: 4 }); }
      m.color(col).shine(2); for (let i = 0; i < 4; i++) { const r = (3.4 - i * 0.78) * s, y = (3.1 + i * 0.95) * s; m.torus(0, y + 0.35 * s, 0, r * 0.82, r * 0.3, { seg: 20, tseg: 8 }); }
      m.ellipsoid(0, 6.4 * s, 0, 0.9 * s, 1.0 * s, 0.9 * s, { seg: 10, rings: 6 });
      m.color('#e8203a').shine(3); m.ball(0, 7.6 * s, 0, 0.75 * s, { seg: 12, rings: 8 }); m.color('#5a3a1a').shine(0); m.limb(0, 8.2 * s, 0, 0.4 * s, 9.2 * s, 0.1, 0.06 * s, 0.04 * s, { seg: 4 });
      const sc = ['#ffffff', '#5ac8ff', '#ffd23a', '#5ae88a', '#b07aff']; for (let i = 0; i < 30; i++) { const a = i * 2.4, y = (3.6 + (i % 10) * 0.32) * s, r = (3.2 - (i % 10) * 0.26) * s; m.color(sc[i % sc.length]); m.push(); m.tf(Math.sin(a) * r, y, Math.cos(a) * r, a, 0.3, 1.0); m.limb(0, 0, -0.2 * s, 0, 0, 0.2 * s, 0.07 * s, 0.07 * s, { seg: 4 }); m.pop(); }
      void prof; return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.4 * s, y0: 0, y1: 8 * s }] };
    }, { hi: true });
    E.art.push({ x, z, r: 3.7 * s });
  };
  cupcake(34, -22, '#ff9ad0', '#5ac8ff', 1.1); cupcake(-36, -24, '#c8f0ff', '#ff6aa8', 1.1);
  // ---- a macaron tower ----
  CartScene.mesh(api, 32, 24, 0.4, m => {
    const cols = ['#ffb0d0', '#b8f0c8', '#d0b8ff', '#ffe8a0', '#a8dcff', '#ffc0a0'];
    for (let i = 0; i < 6; i++) { const y = i * 1.25, c = cols[i]; m.color(c).shine(1); m.ellipsoid(0, y + 0.35, 0, 2.6 - i * 0.12, 0.42, 2.6 - i * 0.12, { seg: 18, rings: 5 }); m.ellipsoid(0, y + 0.95, 0, 2.6 - i * 0.12, 0.42, 2.6 - i * 0.12, { seg: 18, rings: 5 }); m.color('#fff6ee'); m.roundCyl(0, y + 0.5, 0, 2.3 - i * 0.12, 0.3, 0.12, { seg: 18 }); }
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.8, y0: 0, y1: 7.5 }] };
  }, { hi: true });
  E.art.push({ x: 32, z: 24, r: 3.2 });
  // ---- sugar cubes (boxy on purpose), a heap of five ----
  CartScene.mesh(api, -6, -30, 0.3, m => {
    m.color('#ffffff').shine(1);
    for (const [x, y, z, a] of [[-1.3, 1.1, 0, 0.2], [1.3, 1.1, 0.3, -0.3], [0, 1.1, -2.1, 0.7], [0.1, 3.2, -0.6, 0.4], [-0.2, 1.1, 2.1, 1.1]]) { m.push(); m.tf(x, y, z, a); m.roundBox(0, 0, 0, 2.2, 2.2, 2.2, 0.25, { uv: BURNS_ATLAS.pattern('canvas') }); m.pop(); }
    return { cols: [{ t: 'cyl', x: 0, z: -0.2, r: 3.0, y0: 0, y1: 4.3 }] };
  }, { hi: true });
  E.art.push({ x: -6, z: -30, r: 3.4 });
  // ---- the sprinkle jar, tipped over ----
  CartScene.mesh(api, -10, 31, 1.9, m => {
    m.push(); m.tf(0, 2.0, 0, 0, Math.PI / 2, 0);
    m.color('#e8f4ff', 0.05).shine(3); m.lathe([[0, -3.2], [2.0, -3.2], [2.1, -2.8], [2.1, 2.2], [1.7, 2.7], [1.6, 3.2], [0, 3.2]], { seg: 18 });
    m.color('#ff5aa8').shine(2); m.lathe([[0, 3.1], [1.75, 3.1], [1.8, 3.9], [0, 3.9]], { seg: 18 });
    m.pop();
    const sc = ['#ff5aa8', '#5ac8ff', '#ffd23a', '#5ae88a', '#b07aff'];
    for (let i = 0; i < 40; i++) { const a = i * 2.4, r = 0.4 + (i % 8) * 0.2; m.color(sc[i % 5]); m.push(); m.tf(Math.sin(a) * r * 1.6, 0.4 + (i % 4) * 0.25, -3.6 - (i % 7) * 0.4 + Math.cos(a) * r, a, 0, 1.4); m.limb(0, 0, -0.18, 0, 0, 0.18, 0.08, 0.08, { seg: 4 }); m.pop(); }
    m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.1, hz: 3.6, y0: 0, y1: 4.1 }] };
  }, { hi: true });
  E.art.push({ x: -10, z: 31, r: 3.4 });
  // ---- the rolling pin, lying across the west side ----
  CartScene.mesh(api, -31, 9, 0, m => {
    m.color('#e8c08a').shine(1); m.limb(0, 1.4, -10, 0, 1.4, 10, 1.4, 1.4, { seg: 18 });
    m.color('#c8965a'); for (const z of [-10, 10]) m.limb(0, 1.4, z, 0, 1.4, z + Math.sign(z) * 0.6, 0.5, 0.5, { seg: 10 }); m.limb(0, 1.4, -10.6, 0, 1.4, -13.4, 0.55, 0.65, { seg: 12 }); m.limb(0, 1.4, 10.6, 0, 1.4, 13.4, 0.55, 0.65, { seg: 12 });
    m.color('#ffffff'); for (let i = 0; i < 10; i++) m.ball((i % 2 - 0.5) * 0.6, 2.6, -8 + i * 1.8, 0.35, { seg: 6, rings: 3 });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.5, hz: 13.4, y0: 0, y1: 2.8 }] };
  }, { hi: true });
  for (const z of [-4, 0, 4, 8, 12, 16, 20]) E.art.push({ x: -31, z: z - 2, r: 2.0 });
  // ---- the candy-cane fence: striped posts with curled tops and a taffy rail ----
  const poly = ptyPoly(); E.walls = poly;
  const per = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 4.5)); for (let j = 0; j < n; j++) per.push([lerp(a[0], b[0], j / n), lerp(a[1], b[1], j / n), Math.atan2(b[0] - a[0], b[1] - a[1]), L / n]); }
  per.forEach(([x, z, yaw, seg], i) => {
    const ox = x * 1.02, oz = z * 1.02;
    CartScene.mesh(api, ox, oz, yaw, m => {
      for (let j = 0; j < 6; j++) { m.color(j % 2 ? '#ffffff' : '#e8203a').shine(2); m.limb(0, j * 0.45, 0, 0, (j + 1) * 0.45, 0, 0.2, 0.2, { seg: 8 }); }
      m.color(i % 2 ? '#ffffff' : '#e8203a'); m.push(); m.tf(0, 2.7, 0.45, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.45, 0.2, { seg: 10, tseg: 6, phi1: Math.PI }); m.pop();
      m.color(['#ffb0d0', '#b8f0c8', '#d0b8ff', '#a8dcff'][i % 4]).shine(2); m.limb(0, 1.6, 0, 0, 1.6, seg, 0.17, 0.17, { seg: 8 });
      m.shine(0);
    }, { noAO: true });
  });
  // ---- the kitchen beyond: a tiled backsplash, a stand mixer, a kettle, cookie jars, a fruit bowl ----
  CartScene.mesh(api, 0, 92, 0, m => {
    m.color('#c8b8b0'); m.roundBox(0, -0.5, -6, 200, 1, 30, 0.3);
    const tc = ['#bfe8f0', '#f8d0e0', '#fff4e8']; for (let i = 0; i < 30; i++) for (let j = 0; j < 9; j++) { m.color(tc[(i + j) % 3]); m.roundBox(-87 + i * 6, 3 + j * 6, 8, 5.7, 5.7, 1, 0.5); }
    m.color('#a8dcf0').shine(3); m.roundBox(-30, 34, 7.2, 34, 22, 0.6, 0.4); m.color('#ffffff').shine(1); m.roundBox(-30, 34, 6.6, 1.2, 23, 0.8, 0.3); m.roundBox(-30, 34, 6.6, 35, 1.2, 0.8, 0.3); m.roundBox(-30, 45.5, 6.4, 37, 1.8, 1.2, 0.5); m.shine(0);
  }, { noAO: true });
  CartScene.mesh(api, -56, 74, 0.4, m => {
    m.color('#ff8ab8').shine(3); m.roundBox(0, 2, 0, 18, 4, 14, 1.8); m.limb(0, 3, -5, 0, 26, -5, 3.4, 3.0, { seg: 16 }); m.push(); m.tf(0, 26, 2, 0, 0, 0); m.ellipsoid(0, 0, 0, 5, 4.4, 10, { seg: 18, rings: 10 }); m.pop();
    m.color('#e8e8f0').shine(3); m.lathe([[0, 4], [5, 4], [8, 9], [8.6, 17], [8.2, 17], [0, 15]], { seg: 22 });
    m.color('#c8c8d0'); m.limb(0, 22, 4, 0, 12, 4, 0.5, 0.5, { seg: 8 }); m.shine(0);
  }, { noAO: true });
  CartScene.mesh(api, 70, 70, -0.6, m => {
    m.color('#5ae8c8').shine(3); m.lathe([[0, 0], [9, 0], [11, 6], [10, 14], [6, 18], [0, 18.5]], { seg: 22 }); m.color('#ffffff'); m.ball(0, 19.5, 0, 1.6, { seg: 10, rings: 6 });
    m.color('#3a3a44').shine(2); m.torus(0, 18, 0, 6, 0.8, { seg: 18, tseg: 6 }); m.limb(8, 9, 0, 16, 16, 0, 1.4, 0.8, { seg: 10 }); m.shine(0);
  }, { noAO: true });
  for (const [x, z, c, h] of [[86, 4, '#ffd8a0', 16], [84, -26, '#c8f0d8', 12], [-88, -10, '#d8c8ff', 18], [-84, -40, '#ffd0e0', 13]]) CartScene.mesh(api, x, z, 0, m => { m.color('#f4fbff', 0.02).shine(3); m.lathe([[0, 0], [6, 0], [6.6, 1], [6.6, h - 2], [5, h], [0, h]], { seg: 18 }); m.color(c).shine(2); m.lathe([[0, h], [5.4, h], [5.4, h + 2.5], [0, h + 3]], { seg: 18 }); m.color('#c8965a'); for (let i = 0; i < 6; i++) m.roundCyl(Math.sin(i * 1.1) * 2.6, 1 + i * 1.8, Math.cos(i * 1.1) * 2.6, 2.4, 0.6, 0.3, { seg: 12 }); m.shine(0); }, { noAO: true });
  CartScene.mesh(api, 40, -80, 0, m => { m.color('#ffffff').shine(3); m.lathe([[0, 0], [8, 0], [16, 8], [16.5, 8.5], [0, 8]], { seg: 24 }); m.color('#ff6a3a').shine(2); for (const [x, z] of [[-5, 2], [4, -4], [2, 6]]) m.ball(x, 9, z, 4, { seg: 12, rings: 8 }); m.color('#ffe24a'); m.ellipsoid(-1, 10, -1, 6, 2.2, 2.6, { seg: 12, rings: 6 }); m.shine(0); }, { noAO: true });
  // ---- the cast: a pastry chef (cheering), two sweet-toothed onlookers ----
  E.heroes.push({ type: 'sparklepony', x: 18, z: -38, yaw: 0.2, anim: 'cheer' }, { type: 'playaartist', x: -44, z: 36, yaw: 2.3, anim: 'cheer' }, { type: 'burney', x: 48, z: 34, yaw: -2.2, anim: 'photo' });
  // ---- objective spots ----
  E.zones = [{ x: 0, z: 0, r: 11, name: 'THE CAKE' }, { x: 34, z: -22, r: 8, name: 'THE BLUE CUPCAKE' }, { x: -36, z: -24, r: 8, name: 'THE PINK CUPCAKE' }, { x: 32, z: 24, r: 7, name: 'THE MACARONS' }];
  for (let i = 0; i < 46; i++) { let x = 0, z = 0; for (let t = 0; t < 40; t++) { x = (rng() - 0.5) * 2 * (C.HX - 6); z = (rng() - 0.5) * 2 * (C.HZ - 6); if (free(x, z, 1.5)) break; } E.orbSpots.push({ x, z }); }
  E.flagSpots = [{ x: 0, z: 16 }, { x: 20, z: -30 }, { x: -20, z: -10 }, { x: 14, z: 34 }];
  E.captures = [{ x: 46, z: 0, r: 7 }, { x: -46, z: -34, r: 7 }, { x: 0, z: -36, r: 7 }, { x: 46, z: 34, r: 7 }];
  for (const [x, z] of [[18, 0], [-18, 0], [0, 18], [0, -18], [44, 8], [-44, 34], [20, 34], [-22, -36], [44, -34], [12, -40], [-46, -8], [20, -10]]) E.gifts.push({ x, z });
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + Math.PI / 8, x = Math.sin(a) * 40, z = Math.cos(a) * 30; E.spawn.push({ x, z, yaw: Math.atan2(-x, -z) }); }
  // the frosting grid's cells: inside the fence and clear of the props
  const nx = Math.ceil(C.HX * 2 / C.CS), nz = Math.ceil(C.HZ * 2 / C.CS), x0 = -nx * C.CS / 2, z0 = -nz * C.CS / 2;
  const ok = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const x = x0 + (i + 0.5) * C.CS, z = z0 + (j + 0.5) * C.CS; ok[j * nx + i] = ptyInside(x, z) > 1.2 && PTY_OBST.every(o => Math.hypot(x - o[0], z - o[1]) > o[2] + 0.6) ? 1 : 0; }
  E.pty = { nx, nz, x0, z0, ok };
  return this.finish(E);
};

/* ---------------- the frosting grid ---------------- */
function ptyState(s) {
  if (s.pty) return s.pty;
  const G = s.E.pty, n = G.nx * G.nz, cells = [];
  for (let i = 0; i < n; i++) if (G.ok[i]) cells.push(i);
  const P = { nx: G.nx, nz: G.nz, x0: G.x0, z0: G.z0, ok: G.ok, own: new Int8Array(n).fill(-1), sh: new Uint8Array(n), rot: new Float32Array(n), y: new Float32Array(n), cells: new Int32Array(cells), total: cells.length, count: new Int32Array(8), bySlot: [], cherries: [], t: 0 };
  for (let i = 0; i < n; i++) { const cx = G.x0 + ((i % G.nx) + 0.5) * PTY_C.CS, cz = G.z0 + (Math.floor(i / G.nx) + 0.5) * PTY_C.CS; P.sh[i] = (i * 7 + (i >> 3)) % 3; P.rot[i] = ((i * 2654435761) % 1000) / 1000 * TAU; P.y[i] = s.terrain.height(cx, cz) + 0.05; }
  s.pty = P; return P;
}
function ptyCellX(P, i) { return P.x0 + ((i % P.nx) + 0.5) * PTY_C.CS; }
function ptyCellZ(P, i) { return P.z0 + (Math.floor(i / P.nx) + 0.5) * PTY_C.CS; }
// paint every cell whose centre is within r of (x, z) with slot's colour; returns how many changed
function ptyPaint(s, x, z, r, slot) {
  const P = s.pty, CS = PTY_C.CS; if (!P) return 0;
  const i0 = Math.max(0, Math.floor((x - r - P.x0) / CS)), i1 = Math.min(P.nx - 1, Math.floor((x + r - P.x0) / CS));
  const j0 = Math.max(0, Math.floor((z - r - P.z0) / CS)), j1 = Math.min(P.nz - 1, Math.floor((z + r - P.z0) / CS));
  let n = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const c = j * P.nx + i; if (!P.ok[c] || P.own[c] === slot) continue;
    const dx = P.x0 + (i + 0.5) * CS - x, dz = P.z0 + (j + 0.5) * CS - z; if (dx * dx + dz * dz > r * r) continue;
    const prev = P.own[c]; if (prev >= 0) P.count[prev]--; P.own[c] = slot; P.count[slot]++; n++;
  }
  return n;
}
function ptyScore(s) { const P = s.pty; for (const k of s.karts) k.score = P.count[k.ptyC] * 100 / P.total; }
// each car gets the frosting nearest its own paint job (the player first, then the grid order), so a pink car pipes pink
function ptyAssign(s) {
  const used = [false, false, false, false, false, false, false, false], order = s.karts.slice().sort((a, b) => (b.player - a.player) || (a.slot - b.slot));
  for (const k of order) { const v = burnsRGBf(jstColOr(k)); let best = -1, bd = 1e9; for (let i = 0; i < 8; i++) { if (used[i]) continue; const c = PTY_RGB[i], d = (c[0] - v[0]) ** 2 + (c[1] - v[1]) ** 2 + (c[2] - v[2]) ** 2; if (d < bd) { bd = d; best = i; } } used[best] = true; k.ptyC = best; }
}
function jstColOr(k) { const c = k.car.col; return (c === '#2a2236' || c === '#1a1a22') && k.car.col2 ? k.car.col2 : c; }
function ptySpawnCherry(s, ch) {
  const P = s.pty; let best = -1, bs = -1e9;
  for (let t = 0; t < 10; t++) { const c = P.cells[Math.floor(s.rng() * P.total)], x = ptyCellX(P, c), z = ptyCellZ(P, c); let dk = 1e9; for (const k of s.karts) dk = Math.min(dk, Math.hypot(k.x - x, k.z - z)); let dc = 1e9; for (const o of P.cherries) if (o !== ch && o.alive) dc = Math.min(dc, Math.hypot(o.x - x, o.z - z)); const sc = Math.min(dk, 30) + Math.min(dc, 40) * 0.5 + s.rng() * 10; if (sc > bs) { bs = sc; best = c; } }
  ch.x = ptyCellX(P, best); ch.z = ptyCellZ(P, best); ch.y = s.terrain.height(ch.x, ch.z); ch.alive = true; ch.t = 0; ch.ph = s.rng() * 10;
}

/* ---------------- FROSTING FRENZY ---------------- */
CART_OBJECTIVES.frost = {
  name: 'FROSTING FRENZY', short: 'Frost the most counter', time: 90, goal: 0, unit: '%',
  desc: 'Your car pipes your own frosting colour wherever it drives. Drive over rival frosting to cover it. Cherry bombs splat a big blob; hitting a rival splats your colour round them. Most counter frosted at the bell wins.',
  fx: {
    init(s) {
      const P = ptyState(s);
      ptyAssign(s);
      for (const k of s.karts) { P.bySlot[k.ptyC] = k; k.ptyGoal = [0, 0]; k.ptyT = 0; k.score = 0; }
      for (let i = 0; i < PTY_C.CHERRIES; i++) { const ch = { alive: false, x: 0, y: 0, z: 0, t: 0, ph: 0, wait: 0 }; P.cherries.push(ch); ptySpawnCherry(s, ch); }
    },
    update(s, dt) {
      const P = s.pty, C = PTY_C; if (!P) return false;
      P.t += dt;
      for (const k of s.karts) {
        if (k.out) continue;
        const slot = k.ptyC;
        // piping: whatever the car rolls over (not while flying high)
        if (!(k.air && k.y > s.terrain.height(k.x, k.z) + 1.2)) ptyPaint(s, k.x, k.z, C.PAINT_R, slot);
        // cherry bombs
        for (const ch of P.cherries) {
          if (!ch.alive || Math.hypot(k.x - ch.x, k.z - ch.z) > 3) continue;
          ch.alive = false; ch.wait = C.CHERRY_T;
          const n = ptyPaint(s, ch.x, ch.z, C.CHERRY_R, slot);
          s.log('cherry', { k: k.id, n, player: k.player });
          s.fx.burst(ch.x, ch.y + 1.5, ch.z, 'drop', 26, PTY_COLS[slot]); s.fx.burst(ch.x, ch.y + 1, ch.z, 'ring', 12, PTY_COLS[slot]); s.fx.ring(ch.x, ch.y + 0.3, ch.z, C.CHERRY_R, PTY_COLS[slot], 0.6);
          Sound.play('splash', { vol: k.player ? 0.9 : 0.35, pitch: 1.3 }); Sound.play('stomp', { vol: k.player ? 0.5 : 0.2, pitch: 1.4 });
          if (k.player) { s.banner('CHERRY BOMB!', PTY_COLS[slot], 1.1, '+' + n + ' squares frosted', true); s.shakeIt(0.4); }
          else if (s.player && Math.hypot(s.player.x - ch.x, s.player.z - ch.z) < 25) s.banner(k.car.name + ' SPLATS A CHERRY', '#ff9ad8', 0.9, null, true);
        }
      }
      for (const ch of P.cherries) if (!ch.alive) { ch.wait -= dt; if (ch.wait <= 0) ptySpawnCherry(s, ch); } else ch.t += dt;
      ptyScore(s);
      return false;
    },
    // landing a hit splats the attacker's frosting all round the victim
    onHit(s, k, src) {
      if (!s.pty || !src || src === k || src.out) return;
      const n = ptyPaint(s, k.x, k.z, PTY_C.HIT_R, src.ptyC);
      s.fx.burst(k.x, k.y + 1.4, k.z, 'drop', 16, PTY_COLS[src.ptyC]);
      if (src.player) s.banner('SPLAT!', PTY_COLS[src.ptyC], 0.8, '+' + n + ' squares', true);
      s.log('splat', { k: k.id, by: src.id, n });
    },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || (b.hitsDealt - a.hitsDealt) || (a.slot - b.slot)); },
    score(k) { return Math.round(k.score); },
    aiGoal(s, k, nearestRival) {
      const P = s.pty, C = PTY_C; if (!P) return null;
      const slot = k.ptyC;
      // a cherry close by
      let best = null, bd = 30;
      for (const ch of P.cherries) { if (!ch.alive) continue; const d = Math.hypot(ch.x - k.x, ch.z - k.z); if (d < bd) { bd = d; best = ch; } }
      if (best) return { goal: [best.x, best.z] };
      // a rival in reach with the weapon ready: a hit splats our colour on them
      if (k.wpn.t <= 0) { const r = nearestRival(); if (r && Math.hypot(r.x - k.x, r.z - k.z) < 14) return { prey: r }; }
      // else the best patch of counter that isn't ours yet: sample cells, prefer a lot of not-ours nearby, close, ahead
      k.ptyT -= 0.5;
      const g = k.ptyGoal, dg = Math.hypot(g[0] - k.x, g[1] - k.z);
      if (k.ptyT <= 0 || dg < 5 || P.own[ptyCellAt(P, g[0], g[1])] === slot) {
        k.ptyT = 2.5 + s.rng() * 1.5;
        let lead = -1, ls = -1; for (let i = 0; i < 8; i++) if (i !== slot && P.count[i] > ls) { ls = P.count[i]; lead = i; }
        const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); let bs = -1e9, bx = 0, bz = 0;
        for (let t = 0; t < 14; t++) {
          const c = P.cells[Math.floor(s.rng() * P.total)], x = ptyCellX(P, c), z = ptyCellZ(P, c), dx = x - k.x, dz = z - k.z, d = Math.hypot(dx, dz) || 1;
          let not = 0; const ci = c % P.nx, cj = Math.floor(c / P.nx);
          for (let j = cj - 2; j <= cj + 2; j++) for (let i = ci - 2; i <= ci + 2; i++) { if (i < 0 || j < 0 || i >= P.nx || j >= P.nz) continue; const q = j * P.nx + i; if (P.ok[q] && P.own[q] !== slot) not += P.own[q] === lead ? 1.4 : 1; }
          const sc = not / 25 * 2 - d / 70 + (dx * fx + dz * fz) / d * 0.45;
          if (sc > bs) { bs = sc; bx = x; bz = z; }
        }
        g[0] = bx; g[1] = bz;
      }
      return { goal: g };
    }
  }
};
function ptyCellAt(P, x, z) { const i = clamp(Math.floor((x - P.x0) / PTY_C.CS), 0, P.nx - 1), j = clamp(Math.floor((z - P.z0) / PTY_C.CS), 0, P.nz - 1); return j * P.nx + i; }

/* ---------------- the arena's rules (all three games) ---------------- */
CART_ARENA_RULES.pantry = {
  music: 'kart1',
  hud(s, ctx, W, H, top, left) {
    const P = s.pty, k = s.player; if (!P || !k || s.objective !== 'frost') return;
    const portrait = H > W, y = portrait ? top + 58 + 5 * 17 + 18 : top + 58, bw = Math.min(230, W * 0.4), bx = W / 2 - bw / 2, me = k.ptyC;
    // the share bar: every colour's slice of the counter (yours first, outlined), the bare marble grey
    ctx.save();
    ctx.fillStyle = 'rgba(10,4,20,0.55)'; burnsRR(ctx, bx - 6, y - 9, bw + 12, 18, 9); ctx.fill();
    let x = bx; const seg = (i, w) => { if (w <= 0) return; ctx.fillStyle = PTY_COLS[i]; ctx.fillRect(x, y - 5, w, 10); if (i === me) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(x, y - 5, w, 10); } x += w; };
    seg(me, bw * P.count[me] / P.total);
    for (const q of s.battleRank()) { const i = q.ptyC; if (i !== me) seg(i, bw * P.count[i] / P.total); }
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y - 5, bx + bw - x, 10);
    ctx.restore();
    BurnsUI.text(ctx, 'YOUR FROSTING: ' + PTY_NAMES[me] + ' · ' + Math.round(k.score) + '%', W / 2, y + 18, 12, PTY_COLS[me] === '#8a5236' ? '#d8a070' : PTY_COLS[me], { glow: '#1a0a18' });
    // the nearest cherry bomb
    if (s.state !== 'race') return;
    let best = null, bd = 60; for (const ch of P.cherries) { if (!ch.alive) continue; const d = Math.hypot(ch.x - k.x, ch.z - k.z); if (d < bd && d > 6) { bd = d; best = ch; } }
    if (best && s.R.project(best.x, best.y + 3, best.z, W, H, PTY_P)) { const px = clamp(PTY_P.x, 30, W - 30), py = clamp(PTY_P.y, 80, H - 120); ctx.save(); ctx.translate(px, py); ctx.fillStyle = '#ff3a5a'; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -14, 5, 0, TAU); ctx.fill(); ctx.restore(); }
  },
  draw(s, R, S, t) {
    const cam = s.cam, fx = s.fx;
    // candle flames on the cake
    if (Math.random() < 0.5) { const a = Math.floor(Math.random() * 5) / 5 * TAU; fx.fire(Math.sin(a) * 1.4, 10.0, Math.cos(a) * 1.4, 0.5); }
    const P = s.pty; if (!P) return;
    // the frosting: one soft dollop per frosted square near the camera (in front of it)
    const fwx = cam.tx - cam.x, fwz = cam.tz - cam.z, fl = Math.hypot(fwx, fwz) || 1, ux = fwx / fl, uz = fwz / fl, size = PTY_C.CS * 1.9;
    let drawn = 0;
    for (let n = 0; n < P.total && drawn < 950; n++) {
      const c = P.cells[n], o = P.own[c]; if (o < 0) continue;
      const x = P.x0 + ((c % P.nx) + 0.5) * PTY_C.CS, z = P.z0 + (Math.floor(c / P.nx) + 0.5) * PTY_C.CS, dx = x - cam.x, dz = z - cam.z;
      if (dx * dx + dz * dz > 85 * 85 || dx * ux + dz * uz < -8) continue;
      R.flat.flat(x, P.y[c], z, size, size, P.rot[c], S.dot, PTY_SH[o][P.sh[c]], 1, false); drawn++;
    }
    // cherry bombs: a glossy cherry bobbing over a pulsing splat ring
    for (const ch of P.cherries) {
      if (!ch.alive) continue;
      const y = ch.y + 1.3 + Math.sin(t * 2.4 + ch.ph) * 0.25, grow = Math.min(1, ch.t * 3);
      R.flat.flat(ch.x, ch.y + 0.09, ch.z, PTY_C.CHERRY_R * 2 * grow, PTY_C.CHERRY_R * 2 * grow, t * 0.6, S.ring, PTY_CHERRY, 0.35 + 0.15 * Math.sin(t * 4 + ch.ph), true);
      R.bbs.bb(ch.x, y, ch.z, 2.2 * grow, 2.2 * grow, S.dot, [0.85, 0.06, 0.16], 1, false);
      R.bbs.bb(ch.x - 0.22, y + 0.25, ch.z, 0.5, 0.5, S.dot, PTY_WHITE, 0.85, false);
      R.bbs.streak(ch.x + 0.15, y + 1.0, ch.z, 0.3, 1, 0, 1.0, 0.18, S.streak, [0.3, 0.6, 0.2], 0.9);
      R.bbs.bb(ch.x, y, ch.z, 4.5, 4.5, S.glow, PTY_CHERRY, 0.4, true);
    }
    // piping: a little spray of each car's colour behind it
    for (const k of s.karts) {
      if (!k._in || k.out || k.speed < 4 || Math.random() > 0.5) continue;
      const dx = k.x - cam.x, dz = k.z - cam.z; if (dx * dx + dz * dz > 50 * 50) continue;
      const fx2 = Math.sin(k.yaw), fz2 = Math.cos(k.yaw), o = k.ptyC;
      fx.add(k.x - fx2 * 1.6 + (Math.random() - 0.5), k.y + 0.4, k.z - fz2 * 1.6 + (Math.random() - 0.5), (Math.random() - 0.5) * 2, 2 + Math.random() * 2, (Math.random() - 0.5) * 2, 0.5, 0.45, 0.2, PTY_RGB[o], 1, 'dot', 0);
    }
  },
  lights(s, add) { const P = s.pty; if (!P) return; for (const ch of P.cherries) if (ch.alive) add(ch.x, ch.y + 1.5, ch.z, 7, PTY_CHERRY, 0.8, 1); }
};

/* ---------------- registration ---------------- */
CART_ARENAS.push({
  id: 'pantry', name: 'THE SUGAR COUNTER', sub: 'A giant kitchen counter: cake, cupcakes and a frosting war', objectives: ['frost', 'vibe', 'glow'],
  col: '#ff8ac8', tod: 'day', powers: [],
  blurb: "Frosted Fury's secret counter top. Pipe your frosting everywhere you drive, splat the cherry bombs, splat your rivals, and frost more of the counter than anyone."
});
CART_ARENA_ICONS.pantry = (ctx, s, t, col) => {
  // a frosting swirl on a cupcake, with a bobbing cherry
  ctx.save();
  ctx.fillStyle = '#5ac8ff'; ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.1); ctx.lineTo(s * 0.5, s * 0.1); ctx.lineTo(s * 0.36, s * 0.75); ctx.lineTo(-s * 0.36, s * 0.75); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * s * 0.18, s * 0.12); ctx.lineTo(i * s * 0.13, s * 0.73); ctx.stroke(); }
  ctx.fillStyle = col; for (const [y, w] of [[0.05, 0.6], [-0.2, 0.46], [-0.42, 0.3]]) { ctx.beginPath(); ctx.ellipse(0, y * s, w * s, s * 0.17, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#ffffff'; for (const [x, y] of [[-0.3, 0.02], [0.2, -0.22], [0.32, 0.06], [-0.1, -0.44]]) { ctx.fillRect(x * s, y * s, s * 0.09, s * 0.035); }
  const b = Math.sin(t * 3) * s * 0.05; ctx.fillStyle = '#e8203a'; ctx.beginPath(); ctx.arc(0, -s * 0.66 + b, s * 0.15, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(-s * 0.05, -s * 0.7 + b, s * 0.04, 0, TAU); ctx.fill();
  ctx.restore();
};
var CART_SECRET_LEVELS = (typeof CART_SECRET_LEVELS !== 'undefined' && CART_SECRET_LEVELS) || {};
CART_SECRET_LEVELS.cupcake = { arena: 'pantry', game: 'frost' };
