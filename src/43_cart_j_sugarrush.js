/* ============================================================
   ART CART — SUGAR RUSH BAKERY, Frosted Fury's career track (level agent "cupcake", Nov 19 2026).
   Recipe: docs/ART_CART_LEVEL_RECIPE.md (Love Parade is the worked example; this one copies its shape, not its content).
   A sunny pastel candy town, one lap of about 1.1 km, built like a candy cane: a long straight, a hooked crook, a cake hill.
     BAKERY BOULEVARD   the start straight between pastel bake shops; WHISK ALLEY: three giant stand mixers lean over
                        the road and PLUNGE their spinning whisks into one lane (the swirl on the road shows which):
                        dodge to the open lane or get WHISKED (a spin)
     DONUT DROP         the east straight runs up to a bridge of donut hatches; donuts drop out of it and ROLL DOWN
                        THE ROAD AT YOU in a lane (its arrows flash first): switch lanes or get bowled over (a knock)
     CANDY CANE CROOK   the hairpin hook under giant candy-cane arches; a GUMBALL AVALANCHE: the giant gumball machine
                        cranks (its globe shakes, the crossing flashes candy stripes) and pours a stream of gumballs
                        across the road: brake for it or blast through a gap (a gumball shoves you aside)
     LAYER CAKE HILL    between giant tiered cakes, two gantries slide a PIPING BAG over a lane and pipe a FROSTING BOG
                        (a dotted ring shows where): go round it, or HOP over it; drive in and you're slowed and slithering
     SPRINKLE MEADOW    lollipop trees, gumdrops and a gingerbread village back to the line
   Frosted Fury's FROSTING FLOOD is in everyone's gift boxes here (CART_TRACKS.bakery.car = 'cupcake').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'bakery' }) (or mode 'quick').
   Every global here starts with BKY_ / bky, run-time state lives on s.bky, world data on E.bky.
   ============================================================ */
const BKY_C = { pink: [1, 0.45, 0.75], hot: [1, 0.25, 0.55], mint: [0.45, 1, 0.8], lemon: [1, 0.92, 0.4], white: [1, 1, 1], cream: [1, 0.95, 0.85], choc: [0.35, 0.18, 0.1], black: [0, 0, 0], warn: [1, 0.35, 0.3], frost: [1, 0.62, 0.84], red: [1, 0.2, 0.25], sky: [0.5, 0.8, 1] };
const BKY_PAL = ['#ff9ccf', '#8ff0c8', '#ffe08a', '#8ad0ff', '#c8a0ff', '#ffb08a'];
const BKY_GUM = ['#ff3a5a', '#ffd23a', '#3ad0ff', '#5aff7a', '#ff8a2a', '#c86aff', '#ff6ad0', '#ffffff'];
const BKY_GUM_F = BKY_GUM.map(c => burnsRGBf(c));
const BKY_FROST_F = [[1, 0.62, 0.84], [0.62, 1, 0.86], [1, 0.95, 0.6]];
const BKY_T = { at: {}, at2: {} };

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the boulevard (south, heading east), the donut drop (east side, north), the candy-cane crook
// (a hook west and back down: the hairpin), the cake hill (north-west) and the sprinkle meadow back to the line
const BKY_POLY = [[-170, 0, 38], [130, 0, 34], [190, 70, 30], [185, 170, 34], [110, 205, 28], [60, 160, 18], [70, 95, 20], [-10, 80, 25], [-60, 150, 30], [-150, 175, 34], [-215, 95, 32]];
const bkyWidth = (x, z) => (x > 40 && x < 95 && z > 85 && z < 185 ? 1.1 : 1);   // the crook's hairpin is a touch wider
CART_TRACKS.bakery = {
  name: 'SUGAR RUSH BAKERY', car: 'cupcake', tod: 'day', music: 'kart2', width: 20, shoulder: 6, theme: 'bakery', blurb: 'Whisks, rolling donuts and a gumball avalanche',
  pts: CartKit.course(BKY_POLY, { start: [-40, 0], width: bkyWidth, step: 18 }),
  world: (id, D) => bkyWorld(id, D)
};
CART_CAREER_TRACKS.cupcake = 'bakery';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// a stacked cake: tiers [[radius, height, body, trim]] from the bottom; piped borders, drips, berries on top
function bkyCake(m, tiers, top) {
  let y = 0; const seg = m.lo ? 14 : 26;
  for (const [r, h, body, trim] of tiers) {
    m.color(body).shine(1); m.roundCyl(0, y, 0, r, h, 0.35, { seg });
    m.color(trim).shine(2); m.torus(0, y + h, 0, r - 0.15, 0.32, { seg, tseg: 5 }); m.torus(0, y + 0.2, 0, r + 0.05, 0.22, { seg, tseg: 4 });
    const n = Math.max(8, Math.round(r * 2.2)); for (let j = 0; j < n; j++) { const a = (j + 0.3) / n * TAU, l = 0.5 + ((j * 7) % 5) * 0.18; m.ellipsoid(Math.sin(a) * (r + 0.02), y + h - l * 0.6, Math.cos(a) * (r + 0.02), 0.32, l, 0.32, { seg: 6, rings: 4 }); }
    y += h;
  }
  m.shine(0);
  if (top === 'berries') { m.color('#e8243a').shine(3); for (let j = 0; j < 5; j++) { const a = j / 5 * TAU; m.ellipsoid(Math.sin(a) * 1.1, y + 0.55, Math.cos(a) * 1.1, 0.5, 0.65, 0.5, { seg: 8, rings: 6 }); } m.ball(0, y + 0.8, 0, 0.62, { seg: 9, rings: 7 }); m.color('#3a9a3a').shine(0); m.cyl(0, y + 1.35, 0, 0.06, 0.04, 0.6, 5); }
  else if (top === 'candle') { m.color('#ffffff'); m.cyl(0, y, 0, 0.35, 0.35, 3.2, 8); m.color('#ff6ad0'); for (let k = 0; k < 4; k++) m.torus(0, y + 0.5 + k * 0.75, 0, 0.36, 0.06, { seg: 10, tseg: 3 }); m.color('#ffd23a', 1); m.ellipsoid(0, y + 3.65, 0, 0.3, 0.55, 0.3, { seg: 7, rings: 5 }); m.emissive(0); }
  return y;
}
// the start gate: two cake towers joined by a frosting arch (clear of the camera: 8 m+ over the road)
function bkyGate(m, W) {
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * W / 2, 0, 0); bkyCake(m, [[2.7, 3.0, '#ffd8ea', '#ffffff'], [2.2, 2.6, '#8a4a2a', '#ff9ccf'], [1.7, 2.4, '#fff4dc', '#ff6ad0']], 'berries'); m.pop(); }
  const n = 30, P = []; for (let i = 0; i <= n; i++) { const a = i / n * Math.PI; P.push([Math.cos(a) * W / 2, 8 + Math.sin(a) * 6.5]); }
  m.color('#ff8ac8').shine(2); for (let i = 0; i < n; i++) m.limb(P[i][0], P[i][1], 0, P[i + 1][0], P[i + 1][1], 0, 0.75, 0.75, { seg: 8, ends: false });
  m.color('#ffffff').shine(2); for (let i = 0; i <= n; i++) for (const z of [-0.62, 0.62]) m.ball(P[i][0], P[i][1] + 0.35, z, 0.26, { seg: 6, rings: 4 });
  m.color('#ffe08a'); for (let i = 1; i < n; i += 3) m.ball(P[i][0], P[i][1] + 0.85, 0, 0.3, { seg: 6, rings: 4 }); m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 2.8, y0: 0, y1: 8, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 2.8, y0: 0, y1: 8, camPass: true }] };
}
// a bake shop (facing +z, the road): pastel walls, a piped cornice, a striped awning, a glowing display window, a giant
// treat on the roof (0 cupcake, 1 donut, 2 croissant)
function bkyShop(m, col, treat) {
  m.color(col).shine(1); m.roundBox(0, 3.6, 0, 11, 7.2, 7, 0.35);
  m.color('#ffffff').shine(2); for (let i = 0; i <= 14; i++) m.ball(-5.4 + i * 10.8 / 14, 7.25, 3.45, 0.32, { seg: 6, rings: 4 }); m.roundBox(0, 7.3, 0, 11.4, 0.35, 7.4, 0.15);
  m.color('#fff6e0', 0.35); m.roundBox(-1.6, 3.0, 3.45, 6.0, 3.4, 0.2, 0.12); m.emissive(0);
  m.color('#8a4a2a'); m.roundBox(-1.6, 1.25, 3.5, 6.4, 0.3, 0.3, 0.1); m.roundBox(3.6, 2.0, 3.5, 2.0, 4.0, 0.25, 0.1); m.color('#ffd23a').shine(3); m.ball(4.2, 2.0, 3.65, 0.14, { seg: 6, rings: 4 }); m.shine(0);
  for (let i = 0; i < 9; i++) { m.color(i % 2 ? '#ffffff' : '#ff5a8a'); m.push(); m.tf(-5.2 + 0.6 + i * 1.2, 5.4, 3.9, 0, -0.45, 0); m.box(0, 0, 0, 1.2, 0.1, 1.8); m.pop(); }
  m.color('#ff5a8a'); for (let i = 0; i < 9; i++) m.ball(-5.2 + 0.6 + i * 1.2, 4.95, 4.75, 0.3, { seg: 6, rings: 4 });
  m.push(); m.tf(0, 7.4, -0.5);
  if (treat === 0) { m.color('#e8b07a'); m.lathe([[1.6, 0], [2.1, 2.0], [2.15, 2.05], [0, 2.05]], { seg: 16 }); m.color('#ffd0e8').shine(2); m.torus(0, 2.4, 0, 1.6, 0.6, { seg: 16, tseg: 6 }); m.torus(0, 3.2, 0, 1.1, 0.52, { seg: 14, tseg: 6 }); m.torus(0, 3.9, 0, 0.6, 0.42, { seg: 12, tseg: 5 }); m.ball(0, 4.35, 0, 0.42, { seg: 8, rings: 6 }); m.color('#e8243a').shine(3); m.ball(0, 4.95, 0, 0.45, { seg: 9, rings: 7 }); m.shine(0); }
  else if (treat === 1) { m.push(); m.tf(0, 2.6, 0, 0, 0, Math.PI / 2); m.color('#d89a5a').shine(1); m.torus(0, 0, 0, 1.8, 0.85, { seg: 20, tseg: 8 }); m.color('#ff8ac8').shine(2); m.torus(0.35, 0, 0, 1.8, 0.62, { seg: 20, tseg: 6, sy: 0.5 }); m.pop(); m.shine(0); }
  else { m.color('#e8a050').shine(2); for (let k = -3; k <= 3; k++) { const a = k * 0.32, r = 1.0 - Math.abs(k) * 0.11; m.ellipsoid(Math.sin(a) * 2.6, 1.0 + r * 0.2, Math.cos(a) * 2.6 - 2.6, r * 0.8, r, r, { seg: 10, rings: 7 }); } m.shine(0); }
  m.pop();
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 5.6, hz: 3.6, y0: 0, y1: 7.5 }] };
}
// a giant stand mixer's column (the head and whisk are pooled: they ride down the column's groove)
function bkyMixerColumn(m, col) {
  m.color('#f4f0ec').shine(2); m.roundBox(0, 0.6, 0, 6, 1.2, 6, 0.4);
  m.color(col).shine(2); m.roundBox(0, 9.6, -0.4, 3.6, 18.4, 3.4, 0.9);
  m.color('#3a3240').shine(1); m.roundBox(0, 9.4, 1.32, 1.0, 15, 0.2, 0.08);
  m.color('#dfe4ea').shine(3); for (const y of [2.0, 18.4]) m.roundBox(0, y, -0.4, 3.75, 0.35, 3.55, 0.15);
  m.push(); m.tf(1.82, 4.2, -0.4, 0, 0, Math.PI / 2); m.color('#dfe4ea').shine(3); m.cyl(0, 0, 0, 0.75, 0.75, 0.25, 16); m.color('#ff5a8a'); m.cyl(0, 0.25, 0, 0.18, 0.18, 0.3, 8); m.pop(); m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: -0.4, hx: 1.9, hz: 1.8, y0: 0, y1: 19 }, { t: 'box', x: 0, z: 0, hx: 3, hz: 3, y0: 0, y1: 1.2 }] };
}
// the DONUT DROP bridge across the road: two towers and a deck with three hatches (W = tower spacing; local x across)
function bkyBridge(m, W, lanes) {
  for (const sd of [-1, 1]) { m.color('#ff9ccf').shine(1); m.roundBox(sd * W / 2, 6.5, 0, 3.4, 13, 3.4, 0.6); m.color('#ffffff').shine(2); m.torus(sd * W / 2, 13, 0, 1.6, 0.35, { seg: 14, tseg: 4 }); m.torus(sd * W / 2, 1.0, 0, 1.75, 0.3, { seg: 14, tseg: 4 }); }
  m.color('#7a4026').shine(1); m.roundBox(0, 11.4, 0, W + 3.4, 2.8, 4.4, 0.6);
  m.color('#ff8ac8').shine(2); m.roundBox(0, 12.9, 0, W + 3.6, 0.5, 4.6, 0.25);
  for (let i = 0; i < 26; i++) { const x = -W / 2 - 1.5 + i * (W + 3) / 25, l = 0.45 + ((i * 7) % 5) * 0.22; for (const z of [-2.3, 2.3]) m.ellipsoid(x, 12.6 - l * 0.6, z, 0.3, l, 0.3, { seg: 6, rings: 4 }); }
  m.color('#2a1a14'); for (const d of lanes) { m.push(); m.tf(d, 10.0, 0); m.disc(0, 0, 0, 2.6, 18); m.pop(); }
  m.color('#ffe08a').shine(2); for (const d of lanes) { m.push(); m.tf(d, 9.95, 0); m.torus(0, 0, 0, 2.7, 0.22, { seg: 18, tseg: 4 }); m.pop(); }
  // three big donuts sitting on the deck
  const ic = ['#ff8ac8', '#8ad0ff', '#ffe08a'];
  for (let i = 0; i < 3; i++) { m.push(); m.tf((i - 1) * W * 0.32, 15.6, 0, 0, 0, Math.PI / 2); m.color('#d89a5a').shine(1); m.torus(0, 0, 0, 1.7, 0.9, { seg: 18, tseg: 8 }); m.color(ic[i]).shine(2); m.torus(0.4, 0, 0, 1.7, 0.66, { seg: 18, tseg: 6, sy: 0.5 }); m.pop(); }
  m.shine(0);
  return { cols: [{ t: 'box', x: -W / 2, z: 0, hx: 1.7, hz: 1.7, y0: 0, y1: 13 }, { t: 'box', x: W / 2, z: 0, hx: 1.7, hz: 1.7, y0: 0, y1: 13 }] };
}
// the gumball machine's pedestal and coin box (the globe and crank are pooled); local +z faces the road
function bkyMachine(m) {
  m.color('#e8303f').shine(3); m.lathe([[3.4, 0], [3.4, 0.6], [2.6, 1.2], [1.7, 3.0], [1.6, 5.2], [2.6, 5.8], [2.8, 6.4], [0, 6.4]], { seg: 24 });
  m.color('#dfe4ea').shine(3); m.roundBox(0, 4.4, 1.7, 2.4, 2.4, 0.6, 0.2); m.color('#3a3240'); m.roundBox(0, 4.9, 2.02, 0.9, 0.18, 0.1, 0.04);
  // the chute: a curved silver slide down to the road
  m.color('#dfe4ea').shine(3); const P = [[0, 3.4, 1.8], [0, 2.6, 3.4], [0, 1.6, 4.8], [0, 0.9, 6.2]]; for (let i = 0; i < 3; i++) m.limb(P[i][0], P[i][1], P[i][2], P[i + 1][0], P[i + 1][1], P[i + 1][2], 0.95, 0.95, { seg: 10 });
  m.color('#ffe08a').shine(2); m.torus(0, 6.4, 0, 2.7, 0.22, { seg: 22, tseg: 4 }); m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.4, y0: 0, y1: 14 }] };
}
// a piping-bag gantry: two candy-striped posts, a wafer beam at 14.6 m (the bag hangs to 9 m: clear of the camera)
function bkyGantry(m, W) {
  for (const sd of [-1, 1]) { for (let k = 0; k < 14; k++) { m.color(k % 2 ? '#ffffff' : '#ff3a5a').shine(2); m.limb(sd * W / 2, k, 0, sd * W / 2, k + 1, 0, 0.55, 0.55, { seg: 10, ends: k === 0 }); } m.color('#ffffff'); m.roundBox(sd * W / 2, 0.3, 0, 2.2, 0.6, 2.2, 0.2); }
  m.color('#e8b878').shine(1); m.roundBox(0, 14.6, 0, W + 2.4, 1.6, 2.2, 0.3);
  m.color('#c88a50'); for (let i = 0; i < 24; i++) m.box(-W / 2 - 0.9 + i * (W + 1.8) / 23, 14.6, 1.12, 0.12, 1.4, 0.04);
  m.color('#c88a50'); for (const y of [14.1, 15.1]) m.box(0, y, 1.12, W + 2.2, 0.1, 0.04);
  m.color('#ff8ac8').shine(2); for (let i = 0; i < 20; i++) { const x = -W / 2 + i * W / 19, l = 0.35 + ((i * 5) % 4) * 0.2; m.ellipsoid(x, 15.35 - l * 0.4, 1.05, 0.25, l, 0.25, { seg: 6, rings: 4 }); } m.roundBox(0, 15.45, 0, W + 2.6, 0.3, 2.4, 0.12); m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 0.8, y0: 0, y1: 14, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 0.8, y0: 0, y1: 14, camPass: true }] };
}
// a candy-cane arch over the road (two canes whose hooks meet in the middle; > 8 m over the road)
function bkyCaneArch(m, W) {
  const n = 36, H = 15;
  for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI, a1 = (i + 1) / n * Math.PI; m.color(i % 2 ? '#ffffff' : '#ff2a45').shine(2); m.limb(Math.cos(a0) * W / 2, Math.sin(a0) * H, 0, Math.cos(a1) * W / 2, Math.sin(a1) * H, 0, 0.7, 0.7, { seg: 9, ends: false }); }
  m.color('#3a9a5a').shine(2); m.push(); m.tf(0, H + 0.2, 0, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 1.4, 0.35, { seg: 16, tseg: 5 }); m.pop(); m.color('#ff2a45'); for (const sd of [-1, 1]) m.ellipsoid(sd * 1.2, H - 0.8, 0.3, 0.6, 0.9, 0.3, { seg: 8, rings: 5 }); m.ball(0, H - 0.4, 0.4, 0.5, { seg: 8, rings: 6 }); m.shine(0);
  for (const sd of [-1, 1]) { m.color('#ffffff'); m.roundBox(sd * W / 2, 0.4, 0, 2.4, 0.8, 2.4, 0.3); }
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 1.0, y0: 0, y1: 5, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 1.0, y0: 0, y1: 5, camPass: true }] };
}
// a gingerbread house (facing +z): iced eaves, gumdrops on the ridge, a candy-cane door frame
function bkyGinger(m) {
  m.color('#b8733a').shine(1); m.roundBox(0, 2.8, 0, 9, 5.6, 7.5, 0.4);
  for (const sd of [-1, 1]) { m.color('#8a4a22'); m.push(); m.tf(sd * 2.5, 7.0, 0, 0, 0, sd * -0.72); m.roundBox(0, 0, 0, 6.6, 0.5, 8.4, 0.2); m.pop(); m.color('#ffffff').shine(2); for (let i = 0; i < 12; i++) m.ball(sd * 4.9, 5.55, -3.8 + i * 7.6 / 11, 0.28, { seg: 6, rings: 4 }); }
  for (let i = 0; i < 6; i++) { m.color(BKY_GUM[i]).shine(2); m.lathe([[0.55, 0], [0.5, 0.35], [0.25, 0.7], [0, 0.75]], { seg: 9 }); m.push(); m.tf(0, 9.25, -3 + i * 1.2); m.lathe([[0.55, 0], [0.5, 0.35], [0.25, 0.7], [0, 0.75]], { seg: 9 }); m.pop(); }
  m.color('#ffffff'); for (const x of [-2.6, 2.6]) { m.roundBox(x, 3.3, 3.78, 1.8, 1.8, 0.12, 0.06); m.color('#ffe8a0', 0.4); m.roundBox(x, 3.3, 3.8, 1.4, 1.4, 0.12, 0.05); m.emissive(0); m.color('#ffffff'); }
  m.color('#5a2a14'); m.roundBox(0, 1.5, 3.8, 1.8, 3.0, 0.14, 0.4);
  for (const sd of [-1, 1]) for (let k = 0; k < 7; k++) { m.color(k % 2 ? '#ffffff' : '#ff2a45').shine(2); m.limb(sd * 1.2, k * 0.55, 4.0, sd * 1.2, (k + 1) * 0.55, 4.0, 0.14, 0.14, { seg: 6 }); }
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 4.6, hz: 3.9, y0: 0, y1: 9 }] };
}

/* ---------------- instanced props (this world only; near-white where the tint shows) ---------------- */
const BKY_KINDS = {
  // a giant cupcake: a ridged paper cup, a swirl of frosting (tinted), a cherry
  bky_cupcake: { r: 2.2, near: 40, mid: 130, farD: 330,
    build(m) {
      m.color('#e0c8a8').shine(1); m.lathe([[1.15, 0], [1.55, 1.6], [1.6, 1.64], [0, 1.64]], { seg: m.lo ? 10 : 18 });
      m.color('#c8a888'); for (let i = 0; i < (m.lo ? 8 : 14); i++) { const a = i / (m.lo ? 8 : 14) * TAU; m.limb(Math.sin(a) * 1.18, 0.05, Math.cos(a) * 1.18, Math.sin(a) * 1.58, 1.6, Math.cos(a) * 1.58, 0.05, 0.05, { seg: 3, ends: false }); }
      m.color('#ffffff').shine(2); m.torus(0, 1.95, 0, 1.2, 0.5, { seg: m.lo ? 10 : 16, tseg: 6 }); m.torus(0, 2.6, 0, 0.85, 0.44, { seg: m.lo ? 9 : 14, tseg: 6 }); m.torus(0, 3.15, 0, 0.48, 0.36, { seg: m.lo ? 8 : 12, tseg: 5 }); m.ball(0, 3.5, 0, 0.32, { seg: 8, rings: 6 });
      m.color('#e8243a').shine(3); m.ball(0, 4.02, 0, 0.36, { seg: 9, rings: 7 }); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.5, y0: 0, y1: 3.5 }] };
    },
    far(m) { m.color('#e0c8a8'); m.cyl(0, 0, 0, 1.15, 1.55, 1.6, 6); m.color('#ffffff'); m.ball(0, 2.4, 0, 1.3, { seg: 6, rings: 4 }); } },
  // a lollipop tree: a white stick, a spiral disc (rings alternate white and tinted pink)
  bky_lolly: { r: 2.4, near: 40, mid: 130, farD: 320,
    build(m) {
      m.color('#ffffff').shine(1); m.limb(0, 0, 0, 0, 5.4, 0, 0.16, 0.16, { seg: 6 });
      m.push(); m.tf(0, 7.4, 0, 0, Math.PI / 2, 0); m.shine(2);
      for (let k = 0; k < 5; k++) { m.color(k % 2 ? '#ff6a9a' : '#ffffff'); m.torus(0, 0, 0, 0.45 + k * 0.42, 0.24, { seg: m.lo ? 10 : 16, tseg: 4, sy: 1.6 }); }
      m.color('#ffffff'); m.ball(0, 0, 0, 0.3, { seg: 6, rings: 4 }); m.pop(); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 5, camPass: true }] };
    },
    far(m) { m.color('#ffffff'); m.box(0, 2.7, 0, 0.3, 5.4, 0.3); m.push(); m.tf(0, 7.4, 0, 0, Math.PI / 2, 0); m.color('#ff6a9a'); m.disc(0, 0, 0, 2.3, 8); m.pop(); } },
  // a candy cane standing on its foot (red and white stripes, the hook at the top)
  bky_cane: { r: 1.2, near: 36, mid: 120, farD: 280,
    build(m) {
      const r = 0.24;
      for (let k = 0; k < 10; k++) { m.color(k % 2 ? '#ffffff' : '#ff2a45').shine(2); m.limb(0, k * 0.6, 0, 0, (k + 1) * 0.6, 0, r, r, { seg: m.lo ? 6 : 9, ends: k === 0 }); }
      const n = 8; for (let i = 0; i < n; i++) { const a0 = Math.PI - i / n * Math.PI, a1 = Math.PI - (i + 1) / n * Math.PI; m.color(i % 2 ? '#ff2a45' : '#ffffff'); m.limb(0.9 + Math.cos(a0) * 0.9, 6 + Math.sin(a0) * 0.9, 0, 0.9 + Math.cos(a1) * 0.9, 6 + Math.sin(a1) * 0.9, 0, r, r, { seg: m.lo ? 6 : 9, ends: false }); }
      m.color('#ffffff'); m.limb(1.8, 6, 0, 1.8, 5.5, 0, r, r, { seg: m.lo ? 6 : 9 }); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.35, y0: 0, y1: 6, camPass: true }] };
    },
    far(m) { m.color('#ff8a9a'); m.box(0, 3, 0, 0.45, 6, 0.45); m.box(0.9, 6.6, 0, 1.8, 0.45, 0.45); } },
  // a giant sprinkle lying on the ground (tinted)
  bky_sprinkle: { r: 1.2, near: 34, mid: 110, farD: 220, noAO: true, shadow: false,
    build(m) { m.color('#ffffff').shine(2); m.limb(-0.95, 0.32, 0, 0.95, 0.32, 0, 0.32, 0.32, { seg: m.lo ? 6 : 9 }); m.shine(0); },
    far(m) { m.color('#ffffff'); m.box(0, 0.3, 0, 2.4, 0.55, 0.6); } },
  // a sugared gumdrop (tinted)
  bky_gumdrop: { r: 1.2, near: 34, mid: 120, farD: 260,
    build(m) { m.color('#ffffff').shine(1); m.lathe([[1.1, 0], [1.05, 0.5], [0.8, 1.2], [0.35, 1.55], [0, 1.6]], { seg: m.lo ? 9 : 16 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 1.5 }] }; },
    far(m) { m.color('#ffffff'); m.cyl(0, 0, 0, 1.1, 0.4, 1.6, 6); } }
};

/* ---------------- building the world ---------------- */
function bkyWorld(id, D) {
  const sky = Object.assign(CART_SKIES.day(), { zen: '#5a9ae8', hor: '#ffd8ea', fog: '#f0d8e8', fogD: 0.0024, haze: 0.22, mid: '#a8d0ff', midK: 0.35, sky: '#d0e0ff', gnd: '#f0d0c0', clouds: 0.75, cloudCol: '#fff4fa', key: '#fff2e4', keyK: 0.95, rim: '#ffe0f0', mtnCol: '#e8b0c8' });
  const W = CartKit.world(id, D, { worldId: 1203, night: false, sky, ground: '#f0d2a8', crack: 0.05,
    road: { shoulder: 'rgba(255,160,205,0.55)', band: 'rgba(104,58,38,0.94)', edge: 'rgba(255,140,200,0.98)', edgeW: 0.7, centerFn: bkyPaintCenter } });
  const { E, T, api, rng } = W;
  const S = { whisk0: CartKit.sOf(T, 20, 0), d0: CartKit.sOf(T, 152, 26), d1: CartKit.sOf(T, 187, 140), crook: CartKit.sOf(T, 150, 196), gum: CartKit.sOf(T, 64, 126), cake0: CartKit.sOf(T, -36, 116), cake1: CartKit.sOf(T, -112, 166), meadow: CartKit.sOf(T, -205, 70) };
  E.bky = { S };
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };
  const taken = [];
  const free = (x, z, r) => taken.every(q => Math.hypot(q[0] - x, q[1] - z) > q[2] + r) && CartWorlds.clear(T, x, z, r);
  // ground paint: sprinkles scattered over the shortbread, a gingham picnic blanket in the meadow, icing pools
  api.paint((ctx, P, Sc) => {
    const r2 = mulberry32(77), b = T.bounds;
    for (let i = 0; i < 900; i++) { const x = b.x0 - 60 + r2() * (b.x1 - b.x0 + 120), z = b.z0 - 60 + r2() * (b.z1 - b.z0 + 120), q = P(x, z); ctx.fillStyle = BKY_GUM[i % 8]; ctx.globalAlpha = 0.55; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(r2() * 3); ctx.fillRect(-0.5 * Sc, -0.14 * Sc, 1.0 * Sc, 0.28 * Sc); ctx.restore(); }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 26; i++) { const x = b.x0 + r2() * (b.x1 - b.x0), z = b.z0 + r2() * (b.z1 - b.z0), q = P(x, z); ctx.fillStyle = ['rgba(255,170,215,0.35)', 'rgba(170,240,210,0.35)', 'rgba(255,240,170,0.4)'][i % 3]; ctx.beginPath(); ctx.ellipse(q[0], q[1], (6 + r2() * 10) * Sc, (4 + r2() * 7) * Sc, r2() * 3, 0, TAU); ctx.fill(); }
    // the gingham blanket inside the meadow bend
    { const c = P(-150, 95), sq = 3.2 * Sc; ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(0.3); for (let i = -6; i < 6; i++) for (let j = -5; j < 5; j++) { ctx.fillStyle = (i + j) % 2 ? 'rgba(255,255,255,0.85)' : 'rgba(240,70,90,0.75)'; ctx.fillRect(i * sq, j * sq, sq, sq); } ctx.restore(); }
    // the gumball crossing: candy stripes across the road
    { const g = T.at(S.gum, {}); for (let d = -g.hw; d < g.hw; d += 1.6) { const q = P(g.x + g.nx * (d + 0.4), g.z + g.nz * (d + 0.4)); ctx.fillStyle = (Math.round(d / 1.6) % 2) ? 'rgba(255,255,255,0.9)' : 'rgba(255,60,90,0.9)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-1.6 * Sc, -0.4 * Sc, 3.2 * Sc, 0.8 * Sc); ctx.restore(); } }
  });
  // barriers: red-and-white candy tyres on the bends, pastel rails on the straights; a few lamps
  CartKit.rails(E, T, (i, tight) => tight ? (i % 2 ? '#ffffff' : '#ff2a45') : BKY_PAL[Math.floor(i / 2) % 4]);
  CartKit.lamps(E, T, ['#ff9ccf', '#8ff0c8', '#ffe08a', '#8ad0ff'], 52);
  CartKit.kinds(E, BKY_KINDS);

  // ---- the start: the cake gate, the name, grandstands and fans ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 7;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => bkyGate(m, Wd), { hi: true });
    api.sign('SUGAR RUSH\nBAKERY', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.4, y: 10.6, post: false, maxW: 9, style: { bg: '#ff8ac8', fg: '#ffffff', border: '#ffffff' } });
    for (const sd of [1, -1]) { const p = side(-2, sd, 7); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 14, 2, rng)); taken.push([p.x, p.z, 14]); }
    const heroes = ['greeter_f', 'partyboy', 'burnermom', 'sparklepony'];
    heroes.forEach((type, i) => { const p = side(-14 + i * 6, i % 2 ? 1 : -1, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: i % 2 ? 'dance' : 'wave' }); });
  }
  // ---- Bakery Boulevard: whisk alley's three mixers, bake shops on both sides ----
  E.bky.mixers = [];
  for (let i = 0; i < 3; i++) {
    const s = S.whisk0 + i * 38, sd = i % 2 ? 1 : -1, g = T.at(s, {}), lane = sd * g.hw * 0.42, p = side(s, sd, 4.2);
    const lx = g.x + g.nx * lane, lz = g.z + g.nz * lane, yaw = Math.atan2(lx - p.x, lz - p.z), reach = Math.hypot(lx - p.x, lz - p.z);
    CartScene.mesh(api, p.x, p.z, yaw, m => bkyMixerColumn(m, BKY_PAL[i]), { hi: true });
    E.bky.mixers.push({ i, s, sd, x: p.x, z: p.z, yaw, reach, lx, lz, lane, col: BKY_PAL[i] });
    taken.push([p.x, p.z, 7]);
  }
  const shopNames = ['SIFT HAPPENS', 'DOUGH-RE-MI', 'KNEAD FOR SPEED', 'THE ROLLING PIN', 'BUTTER LUCK', 'CRUMB & GET IT', 'WHISK-Y BUSINESS', 'BUNS OF STEEL'];
  { let k = 0; for (let x = -150; x <= 115; x += 19) for (const sd of [1, -1]) {
    const s = CartKit.sOf(T, x + (sd > 0 ? 9 : 0), 0), p = side(s, sd, 9); if (!free(p.x, p.z, 6)) continue;
    CartScene.mesh(api, p.x, p.z, p.yaw, m => bkyShop(m, BKY_PAL[k % 6], k % 3), { hi: false });   // low detail: the start grid sees most of them (triangle budget) taken.push([p.x, p.z, 7]);
    if (k % 2 === 0) api.sign(shopNames[(k / 2) % 8], p.x - Math.sin(p.yaw) * -3.8, p.z - Math.cos(p.yaw) * -3.8, { yaw: p.yaw, h: 0.9, y: 6.3, post: false, maxW: 7, style: { bg: '#ffffff', fg: '#ff4a8a', border: '#ff8ac8' } });
    k++;
  } }
  CartKit.crowd(E, T, (T.L - 120) % T.L, T.L - 22, 1, rng, { rows: 1, off: 3, gap: 3.2 }); CartKit.crowd(E, T, (T.L - 120) % T.L, T.L - 22, -1, rng, { rows: 1, off: 3, gap: 3.2 });
  // ---- the donut drop: the bridge, donut stacks on the verges ----
  { const g = T.at(S.d1, {}), Wd = Math.max(g.wl, g.wr) * 2 + 7, lanes = [-0.55, 0, 0.55].map(f => f * g.hw);
    // the bridge's local x is the road's lateral (+ = right of travel = +nx): lanes in the same order
    CartScene.mesh(api, g.x, g.z, g.yaw, m => bkyBridge(m, Wd, lanes.map(d => -d)), { hi: true });
    api.sign('DONUT DROP', g.x - g.tx * 2.4, g.z - g.tz * 2.4, { yaw: g.yaw + Math.PI, h: 1.6, y: 11.4, post: false, maxW: 9, style: { bg: '#7a4026', fg: '#ffe08a', border: '#ff8ac8' } });
    E.bky.bridge = { s: S.d1, lanes, x: g.x, z: g.z };
    taken.push([g.x + g.nx * Wd / 2, g.z + g.nz * Wd / 2, 4], [g.x - g.nx * Wd / 2, g.z - g.nz * Wd / 2, 4]);
  }
  // ---- the candy cane crook: arches over the road, canes along the verges ----
  for (const f of [-30, 0, 30]) { const g = T.at(S.crook + f, {}); CartScene.mesh(api, g.x, g.z, g.yaw, m => bkyCaneArch(m, Math.max(g.wl, g.wr) * 2 + 5), { hi: true }); }
  for (let s = S.crook - 70; s < S.gum + 40; s += 9) for (const sd of [1, -1]) { const p = side(((s % T.L) + T.L) % T.L, sd, 1.6); if (free(p.x, p.z, 1)) CartKit.put(E, 'bky_cane', p.x, p.z, p.yaw + Math.PI / 2, '#ffffff', { scale: 1.1 }); }
  // ---- the gumball machine on the crook's outside ----
  { const g = T.at(S.gum, {}); let sd = 1, p = side(S.gum, 1, 9); if (!CartWorlds.clear(T, p.x, p.z, 5)) { sd = -1; p = side(S.gum, -1, 9); }
    CartScene.mesh(api, p.x, p.z, p.yaw, bkyMachine, { hi: true, scale: 1.0 });
    api.sign('GUMBALL\nAVALANCHE', p.x - Math.sin(p.yaw) * -4.4 + g.tx * 5, p.z - Math.cos(p.yaw) * -4.4 + g.tz * 5, { yaw: g.yaw + Math.PI, h: 1.1, y: 2.6, post: true, maxW: 3.6, style: { bg: '#ffd23a', fg: '#3a1a1a', border: '#ff3a5a' } });
    E.bky.machine = { s: S.gum, sd, x: p.x, z: p.z, yaw: p.yaw, hw: g.hw };
    taken.push([p.x, p.z, 7]);
  }
  // ---- layer cake hill: two piping gantries, giant tiered cakes ----
  E.bky.gantries = [];
  for (const sv of [S.cake0, S.cake1]) { const g = T.at(sv, {}), Wd = Math.max(g.wl, g.wr) * 2 + 5; CartScene.mesh(api, g.x, g.z, g.yaw, m => bkyGantry(m, Wd), { hi: true }); E.bky.gantries.push({ s: sv, x: g.x, z: g.z, hw: g.hw }); }
  const cakes = [[S.cake0 + 22, 1, 16, [[8, 4.2, '#fff4dc', '#ff8ac8'], [6.2, 3.8, '#ffc8e0', '#ffffff'], [4.4, 3.4, '#8a4a2a', '#ffe08a'], [2.8, 3.0, '#ffffff', '#ff6ad0']], 'candle'],
    [S.cake0 - 26, -1, 13, [[7, 4.0, '#c8f0e0', '#ffffff'], [5.2, 3.6, '#fff4dc', '#8ad0ff'], [3.4, 3.2, '#ffd8ea', '#ffffff']], 'berries'],
    [S.cake1 + 26, -1, 15, [[8.5, 4.4, '#8a4a2a', '#ffd8ea'], [6.4, 3.8, '#ffd8ea', '#ffffff'], [4.4, 3.4, '#fff4dc', '#ff8ac8'], [2.6, 2.8, '#c8a0ff', '#ffffff']], 'berries'],
    [S.cake1 - 20, 1, 14, [[7.2, 4.0, '#ffe8a0', '#ffffff'], [5.0, 3.6, '#ff9ccf', '#ffffff'], [3.0, 3.0, '#ffffff', '#8ff0c8']], 'candle']];
  for (const [sv, sd, off, tiers, top] of cakes) { const p = side(((sv % T.L) + T.L) % T.L, sd, off); if (!CartWorlds.clear(T, p.x, p.z, tiers[0][0] + 1)) continue; CartScene.mesh(api, p.x, p.z, rng() * TAU, m => { bkyCake(m, tiers, top); return { cols: [{ t: 'cyl', x: 0, z: 0, r: tiers[0][0], y0: 0, y1: 16 }] }; }, { hi: true }); taken.push([p.x, p.z, tiers[0][0] + 2]); }
  CartKit.crowd(E, T, S.cake0 - 20, S.cake0 + 20, 1, rng, { rows: 2, off: 3 });
  // ---- the sprinkle meadow: gingerbread houses, lollipops, gumdrops ----
  for (const [sv, sd] of [[S.meadow - 30, 1], [S.meadow + 40, 1], [S.cake1 + 60, -1]]) { const p = side(((sv % T.L) + T.L) % T.L, sd, 9); if (!free(p.x, p.z, 6)) continue; CartScene.mesh(api, p.x, p.z, p.yaw, bkyGinger, { hi: true }); taken.push([p.x, p.z, 7]); E.heroes.push({ type: rng() < 0.5 ? 'greeter_f' : 'burnerkid', x: p.x - Math.sin(p.yaw) * -5, z: p.z - Math.cos(p.yaw) * -5, yaw: p.yaw, anim: 'wave' }); }
  // ---- fill the verges: cupcakes, lollipops, gumdrops; sprinkles lying about ----
  for (let s = 14, k = 0; s < T.L; s += 17, k++) {
    const sd = k % 2 ? 1 : -1, off = 5 + (k % 3) * 3, p = side(s, sd, off);
    if (!free(p.x, p.z, 3)) continue;
    const kind = k % 3 === 0 ? 'bky_cupcake' : k % 3 === 1 ? 'bky_lolly' : 'bky_gumdrop';
    CartKit.put(E, kind, p.x, p.z, p.yaw + rng(), BKY_PAL[k % 6], { scale: kind === 'bky_cupcake' ? 2.2 + (k % 2) * 0.6 : kind === 'bky_gumdrop' ? 1.6 + (k % 2) * 0.8 : 1.2 });
    taken.push([p.x, p.z, 3]);
  }
  for (let i = 0; i < 70; i++) { const s = rng() * T.L, sd = rng() < 0.5 ? 1 : -1, p = side(s, sd, 3 + rng() * 22); if (free(p.x, p.z, 1.2)) CartKit.put(E, 'bky_sprinkle', p.x, p.z, rng() * TAU, BKY_GUM[i % 7], { scale: 1 + rng() * 0.8 }); }
  CartDecor.skyline(E, T, rng);
  // gift rows, boost pads (fractions of the lap), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(CartKit.sOf(T, -8, 0)), f(S.crook - 40), f(CartKit.sOf(T, 22, 84)), f(CartKit.sOf(T, -192, 135))]);
  CartKit.boosts(E, T, [[f(S.meadow), 0], [f(CartKit.sOf(T, 30, 82)), 0.35], [f(S.d1 + 30), -0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: a piped white icing squiggle
function bkyPaintCenter(ctx, P, S, T) {
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.32 * S; ctx.lineCap = 'round'; ctx.beginPath();
  for (let s = 0, i = 0; s <= T.L; s += 1, i++) { const g = T.at(s % T.L, BKY_T.at2), w = Math.sin(s * 0.8) * 0.55, q = P(g.x + g.nx * w, g.z + g.nz * w); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }
  ctx.stroke();
  for (let s = 6; s < T.L; s += 12) { const g = T.at(s, BKY_T.at2), q = P(g.x, g.z); ctx.fillStyle = 'rgba(255,140,200,0.85)'; ctx.beginPath(); ctx.arc(q[0], q[1], 0.42 * S, 0, TAU); ctx.fill(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const BkyMesh = {
  // a mixer head: an arm from the column (z = 0) out over the lane (z = reach), the motor dome at the end
  head(m, reach, col) {
    m.color(col).shine(2); m.roundBox(0, 0, reach / 2 - 0.3, 3.0, 2.4, reach + 2.4, 1.0);
    m.ellipsoid(0, 0.4, reach + 0.4, 2.0, 1.9, 2.2, { seg: 14, rings: 9 });
    m.color('#dfe4ea').shine(3); m.torus(0, -0.2, reach + 0.4, 1.95, 0.16, { seg: 18, tseg: 4 }); m.cyl(0, -2.0, reach + 0.4, 0.55, 0.7, 1.0, 12);
    m.color('#ffffff').shine(2); for (let i = 0; i < 5; i++) m.limb(-1.52, -0.6 + i * 0.3, reach - 1.8, -1.52, -0.6 + i * 0.3, reach - 0.6, 0.05, 0.05, { seg: 4 });
    m.shine(0);
  },
  // a balloon whisk hanging from its hub (y = 0) down to -8.2: six wire loops round a chrome handle
  whisk(m) {
    m.color('#dfe4ea').shine(3); m.cyl(0, -1.4, 0, 0.32, 0.38, 1.4, 10);
    const N = 14;
    for (let k = 0; k < 6; k++) {
      const yaw = k / 6 * Math.PI; m.push(); m.tf(0, 0, 0, yaw);
      let px = 0, py = -1.3;
      for (let i = 1; i <= N; i++) { const t = i / N * TAU, wv = Math.sin(t) * (0.55 + 0.45 * (1 - Math.cos(t)) / 2) * 2.3, y = -1.3 - (1 - Math.cos(t)) / 2 * 6.9; m.limb(px, py, 0, wv, y, 0, 0.13, 0.13, { seg: 5, ends: false }); px = wv; py = y; }
      m.pop();
    }
    m.color('#ff8ac8').shine(2); m.ball(0, -8.15, 0, 0.32, { seg: 8, rings: 5 }); m.shine(0);
  },
  // a rolling donut: torus axis along local x (it rolls by pitch), icing on one face with sprinkles
  donut(m, i) {
    const ic = ['#ff8ac8', '#8a4a2a', '#ffe08a', '#8ad0ff', '#ffffff', '#c8a0ff'][i % 6];
    m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2);
    m.color('#d89a5a').shine(1); m.torus(0, 0, 0, 1.6, 1.2, { seg: 20, tseg: 9 });
    m.color(ic).shine(2); m.torus(0, 0.55, 0, 1.6, 0.95, { seg: 20, tseg: 7, sy: 0.6 }); m.torus(0, -0.55, 0, 1.6, 0.95, { seg: 20, tseg: 7, sy: 0.6 });
    for (let j = 0; j < 14; j++) { const a = j / 14 * TAU, r = 1.6 + ((j * 5) % 3 - 1) * 0.45; m.color(BKY_GUM[(j + i) % 7]); m.push(); m.tf(Math.sin(a) * r, 1.12, Math.cos(a) * r, a * 2.3); m.box(0, 0, 0, 0.42, 0.14, 0.14); m.pop(); m.push(); m.tf(Math.sin(a + 0.2) * r, -1.12, Math.cos(a + 0.2) * r, a * 1.7); m.box(0, 0, 0, 0.42, 0.14, 0.14); m.pop(); }
    m.pop(); m.shine(0);
  },
  gumball(m, i) { m.color(BKY_GUM[i % 8]).shine(3); m.ball(0, 0, 0, 1.0, { seg: 12, rings: 8 }); m.color('#ffffff', 0.4); m.ball(-0.35, 0.4, 0.55, 0.18, { seg: 6, rings: 4 }); m.emissive(0).shine(0); },
  // the gumball machine's globe: a pile of gumballs in a sphere, a red cap, a rim (origin at its centre)
  globe(m) {
    const r2 = mulberry32(31); m.shine(3);
    for (let i = 0; i < 46; i++) { const u = r2() * 2 - 1, a = r2() * TAU, s = Math.sqrt(1 - u * u), R = 3.2; m.color(BKY_GUM[i % 8]); m.ball(Math.cos(a) * s * R, u * R * 0.9, Math.sin(a) * s * R, 1.05, { seg: 8, rings: 6 }); }
    m.color('#e8303f'); m.ellipsoid(0, 3.4, 0, 2.4, 1.2, 2.4, { seg: 16, rings: 6, phi1: Math.PI / 2 }); m.ball(0, 4.6, 0, 0.6, { seg: 8, rings: 6 });
    m.color('#ffffff', 0.25); m.torus(0, 0, 0, 4.25, 0.12, { seg: 28, tseg: 3 }); m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 4.25, 0.1, { seg: 28, tseg: 3 }); m.pop(); m.emissive(0).shine(0);
  },
  // the crank (turns about local z): an arm and a knob
  crank(m) { m.color('#dfe4ea').shine(3); m.cyl(0, 0, -0.1, 0.3, 0.3, 0.5, 10); m.limb(0, 0, 0.35, 0, 1.3, 0.35, 0.16, 0.16, { seg: 6 }); m.color('#ff3a5a'); m.ball(0, 1.4, 0.75, 0.38, { seg: 8, rings: 6 }); m.shine(0); },
  // a piping bag hanging from the beam (origin at the top; the star nozzle 4.8 m down)
  bag(m) {
    m.color('#fff4f8').shine(1); m.lathe([[0.4, 0.4], [1.5, 0], [1.7, -0.6], [1.2, -2.4], [0.45, -4.0], [0.3, -4.1]], { seg: 16 });
    m.color('#ff8ac8'); for (const y of [-0.6, -1.6, -2.6]) m.torus(0, y, 0, 1.7 - (y + 0.6) * -0.3, 0.1, { seg: 16, tseg: 3 });
    m.color('#dfe4ea').shine(3); m.lathe([[0.42, -4.0], [0.3, -4.5], [0.12, -4.85], [0, -4.85]], { seg: 8 });
    m.color('#ff8ac8').shine(2); m.ellipsoid(0, -4.95, 0, 0.32, 0.25, 0.32, { seg: 8, rings: 5 }); m.shine(0);
  }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const BKY_WHISK = { period: 5.2, warn: 1.3, drop: 0.25, down: 1.4, rise: 0.5, r: 3.7, top: 17.0, low: 8.7 };   // top / low: the whisk hub's height (its tip hangs 8.5 m below)
const BKY_DONUT = { every: 2.7, warn: 1.2, fall: 0.35, speed: 13, R: 2.75, N: 6 };
const BKY_GUMS = { period: 7.5, warn: 1.5, pour: 2.0, n: 12, band: 6.5 };
const BKY_BOG = { period: 7.2, slide: 1.0, warn: 1.2, pipe: 0.45, life: 5.4, r: 4.0 };
CART_TRACK_RULES.bakery = {
  onLoad(s) {
    const E = s.E, B = E.bky, T = s.T || s.TR;
    const G = CartKit.group(s, [['heads', (m, i) => BkyMesh.head(m, B.mixers[i].reach, B.mixers[i].col), 3], ['whisks', BkyMesh.whisk, 3], ['donuts', BkyMesh.donut, BKY_DONUT.N], ['gums', BkyMesh.gumball, BKY_GUMS.n], ['globe', BkyMesh.globe, 1], ['crank', BkyMesh.crank, 1], ['bags', BkyMesh.bag, 2]]);
    const L = s.bky = { G, mixers: [], donuts: [], next: 2, lane: 0, gum: null, balls: [], gantries: [], bogs: [], said: {}, hintT: -9, bogT: 0 };
    B.mixers.forEach((q, i) => L.mixers.push(Object.assign({}, q, { off: i * 1.75, ph: 0, st: 'idle', y: BKY_WHISK.top, spin: 0, spinV: 0, mask: 0, head: G.heads[i], whisk: G.whisks[i], fired: -1 })));
    for (let i = 0; i < BKY_DONUT.N; i++) L.donuts.push({ i, obj: G.donuts[i], st: 'off', t: 0, s: 0, d: 0, x: 0, y: 0, z: 0, roll: 0, flop: 0, yaw: 0, fx: 0, fz: 0 });
    const M = B.machine, gm = T.at(M.s, {});
    L.gum = { s: M.s, sd: M.sd, x: M.x, z: M.z, yaw: M.yaw, gx: gm.x, gz: gm.z, nx: gm.nx, nz: gm.nz, tx: gm.tx, tz: gm.tz, hw: gm.hw, st: 'idle', t: 0, cyc: -1, launched: 0, globe: G.globe[0], crank: G.crank[0], crankA: 0 };
    for (let i = 0; i < BKY_GUMS.n; i++) L.balls.push({ obj: G.gums[i], live: false, t: 0, d: 0, a: 0, v: 0, x: 0, y: 0, z: 0, mask: 0, ph: 0 });
    B.gantries.forEach((q, i) => { const g = T.at(q.s, {}); L.gantries.push({ i, s: q.s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw, off: i * 3.6, cyc: -1, d: 0, d0: 0, d1: 0, st: 'slide', u: 0, bag: G.bags[i], piped: false }); });
    for (let i = 0; i < 4; i++) L.bogs.push({ live: false, t: 0, x: 0, z: 0, r: BKY_BOG.r, mask: 0, col: BKY_FROST_F[i % 3], s: 0, d: 0 });
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.bky; if (!L) return;
    bkyWhisks(s, L, dt, racing); bkyDonuts(s, L, dt, racing); bkyGumballs(s, L, dt, racing); bkyBogs(s, L, dt, racing);
    if (L.bogT > 0) L.bogT = Math.max(0, L.bogT - dt);
  },
  // the AI: ease off for the gumball avalanche (by skill), hop a frosting bog dead ahead (good drivers)
  onStep(s, k, dt, racing) {
    const L = s.bky; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9, G = L.gum, ds = CartKit.ds(s.T, k.loc.s, G.s);
    if (ds > 2 && ds < 45 && (G.st === 'pour' || (G.st === 'warn' && G.t > BKY_GUMS.warn * 0.4))) {
      // arrive while it pours? (the pour ends at warn + pour); careful drivers wait, the rest gamble on a gap
      const ta = ds / Math.max(6, k.speed), left = G.st === 'warn' ? BKY_GUMS.warn - G.t + BKY_GUMS.pour : BKY_GUMS.pour - G.t;
      if (ta < left + 0.2 && ((k.slot * 3 + G.cyc) % 10) / 10 < 0.35 + (sk - 0.85) * 4) { if (k.speed > 10) I.gas = 0; if (k.speed > 17) I.brake = 0.6; }
    }
    if (!k.air) for (const b of L.bogs) {
      if (!b.live || b.t > BKY_BOG.life - 0.4) continue;
      const a = CartKit.ds(s.T, k.loc.s, b.s), lead = k.speed * 0.22;
      if (a > lead - 2 && a < lead + 2.5 && Math.abs(k.loc.d - b.d) < b.r && ((k.slot * 7 + b.s | 0) % 10) / 10 < 0.4 + (sk - 0.85) * 4) { I.driftPress = true; I.drift = false; }
    }
  },
  draw(s, R, S, t) { const L = s.bky; if (L) bkyDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.bky; if (!L) return;
    for (const q of L.mixers) if (q.st === 'down') add(q.lx, 1.5, q.lz, 10, BKY_C.pink, 0.8, 1);
  },
  hud(s, ctx, W, H) {
    const L = s.bky, p = s.player; if (!L || !p) return;
    // frosting on the screen while you're stuck in a bog: drips from the top edge
    if (L.bogT > 0) { const a = Math.min(1, L.bogT * 1.5); ctx.save(); ctx.globalAlpha = 0.75 * a; ctx.fillStyle = '#ff9ad0'; ctx.fillRect(0, 0, W, 10); for (let i = 0; i < 14; i++) { const x = (i + 0.5) / 14 * W + Math.sin(i * 2.3) * 12, l = 26 + ((i * 37) % 50) + (1.2 - L.bogT) * 40; ctx.beginPath(); ctx.moveTo(x - 11, 0); ctx.lineTo(x - 9, l * 0.7); ctx.arc(x, l * 0.7, 9, Math.PI, 0, true); ctx.lineTo(x + 11, 0); ctx.fill(); } ctx.restore(); }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 70) { L.said[key] = true; L.hintT = s.time; s.banner(text, '#ff8ac8', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.bky.S; hint('whisk', L.mixers[0].s, 'WHISK ALLEY!', 'the swirl shows the lane: take the other one'); hint('donut', S.d0 + 10, 'DONUT DROP!', 'donuts roll AT you: switch lanes'); hint('gum', L.gum.s, 'GUMBALL AVALANCHE!', 'brake for it or blast through a gap'); hint('bog', L.gantries[0].s, 'FROSTING BOGS!', 'steer round, or HOP over'); }
  }
};
// a banner for the player unless a first-lap hint just showed
function bkySay(s, L, k, text, sub) { if (k.player && !(s.time - L.hintT < 2.3)) s.banner(text, '#ff8ac8', 1.0, sub, true); }

// ---- whisk alley: idle (raised) → warn (whisk spins up, swirl on the road) → drop → down (WHISKED) → rise ----
function bkyWhisks(s, L, dt, racing) {
  const W = BKY_WHISK;
  for (const q of L.mixers) {
    const ph = ((s.time + q.off) % W.period + W.period) % W.period, tw = W.period - W.warn - W.drop - W.down - W.rise;
    const prev = q.st;
    q.st = ph < tw ? 'idle' : ph < tw + W.warn ? 'warn' : ph < tw + W.warn + W.drop ? 'drop' : ph < tw + W.warn + W.drop + W.down ? 'down' : 'rise';
    q.tele = q.st === 'warn' ? (ph - tw) / W.warn : 0;
    const u = q.st === 'drop' ? (ph - tw - W.warn) / W.drop : q.st === 'rise' ? 1 - (ph - tw - W.warn - W.drop - W.down) / W.rise : q.st === 'down' ? 1 : 0;
    q.y = lerp(W.top, W.low, u * u * (3 - 2 * u)) - (q.st === 'warn' ? Math.sin(q.tele * Math.PI * 0.5) * 0.8 : 0);
    q.spinV = q.st === 'idle' ? 0.6 : q.st === 'warn' ? 2 + q.tele * 12 : q.st === 'rise' ? 8 : 16; q.spin += q.spinV * dt;
    if (q.st === 'drop' && prev !== 'drop') { q.mask = 0; q.fired = s.time; CartKit.fired(s, 'whisk'); if (CartKit.near(s, q.lx, q.lz, 70)) cartIxSound(s, 'stomp', q.lx, q.lz, 0.8, 0.8); }
    if (q.st === 'down' && prev === 'drop') { if (s.fx && CartKit.near(s, q.lx, q.lz, 120)) s.fx.dust(q.lx, 0.3, q.lz, 12, '#fff4e4'); if (CartKit.near(s, q.lx, q.lz, 24)) s.shakeIt(0.3); }
    // the AI sees the swirl and keeps out of the lane while it is about to plunge and while it is down
    // (from late in the warning: drivers who react late get whisked)
    if (q.tele > 0.55 || q.st === 'drop' || q.st === 'down') cartIxObs(s, q.lx, q.lz, W.r + 0.2);
    if (racing && (q.st === 'down' || (q.st === 'drop' && u > 0.6))) for (const k of s.karts) {
      if (k.out || (q.mask & (1 << k.slot)) || Math.hypot(k.x - q.lx, k.z - q.lz) > W.r) continue;
      q.mask |= 1 << k.slot;
      if (CartKit.hit(s, k, 'spin', 'whisk', { dur: 1.1, banner: 'WHISKED!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.8, 1.4); if (s.fx) s.fx.burst(k.x, k.y + 1.2, k.z, 'star', 10, '#ffffff'); }
    }
    const h = q.head; if (h) { h.live = true; h.visible = true; h.x = q.x; h.y = q.y + 2.0; h.z = q.z; h.yaw = q.yaw; h.pitch = 0; h.roll = 0; h.scale = 1; }
    const w = q.whisk; if (w) { w.live = true; w.visible = true; w.x = q.lx; w.y = q.y; w.z = q.lz; w.yaw = q.spin; w.pitch = 0; w.roll = q.st === 'down' ? Math.sin(s.time * 31) * 0.03 : 0; w.scale = 1; }
  }
}
// ---- the donut drop: a donut peeks out of a hatch (its lane's arrows flash), drops, and rolls down the road at you ----
function bkyDonuts(s, L, dt, racing) {
  const T = s.T || s.TR, D = BKY_DONUT, B = s.E.bky.bridge, S = s.E.bky.S;
  L.next -= dt;
  if (L.next <= 0) {
    const d = L.donuts.find(q => q.st === 'off');
    if (d) { const seq = [0, 2, 1, 2, 0, 1, 0, 2]; L.lane = (L.lane + 1) % seq.length; d.st = 'warn'; d.t = 0; d.s = B.s; d.d = B.lanes[seq[L.lane]]; d.roll = 0; d.flop = 0; d.mask = 0; }
    L.next = D.every;
  }
  for (const d of L.donuts) {
    const o = d.obj;
    if (d.st === 'off') { if (o) { o.live = false; o.visible = false; } continue; }
    d.t += dt;
    const g = T.at(d.s, BKY_T.at); d.x = g.x + g.nx * d.d; d.z = g.z + g.nz * d.d; d.fx = -g.tx; d.fz = -g.tz; d.yaw = g.yaw + Math.PI;
    if (d.st === 'warn') { d.y = 9.6 + Math.sin(d.t * 26) * 0.12; if (d.t > D.warn) { d.st = 'fall'; d.t = 0; CartKit.fired(s, 'donut'); if (CartKit.near(s, d.x, d.z, 90)) cartIxSound(s, 'throw', d.x, d.z, 0.7, 0.7); } }
    else if (d.st === 'fall') { const u = clamp(d.t / D.fall, 0, 1); d.y = lerp(9.6, D.R, u * u); if (u >= 1) { d.st = 'roll'; d.t = 0; if (CartKit.near(s, d.x, d.z, 60)) { cartIxSound(s, 'stomp', d.x, d.z, 0.7, 1.1); s.shakeIt(0.15); } if (s.fx && CartKit.near(s, d.x, d.z, 120)) s.fx.dust(d.x, 0.3, d.z, 8, '#f0d2a8'); } }
    else if (d.st === 'roll') {
      d.s -= D.speed * dt; d.roll -= D.speed * dt / D.R; d.y = D.R + Math.abs(Math.sin(d.t * 5)) * 0.15;
      // the AI sees it coming: the donut and the stretch of its lane just in front of it
      for (let r = 0; r <= 12; r += 6) cartIxObs(s, d.x + d.fx * r, d.z + d.fz * r, 3.3 - r * 0.08);
      if (racing) for (const k of s.karts) {
        if (k.out || (d.mask & (1 << k.slot)) || k.y > 4.5 || Math.hypot(k.x - d.x, k.z - d.z) > 2.9) continue;
        d.mask |= 1 << k.slot;
        if (CartKit.hit(s, k, 'knock', 'donut', { dur: 1.0, dx: d.fx, dz: d.fz, power: 9, banner: 'BOWLED OVER!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 0.8); if (s.fx) s.fx.burst(d.x, 2, d.z, 'star', 12, '#ffe08a'); d.st = 'flop'; d.t = 0; break; }
      }
      if (CartKit.ds(T, S.d0, d.s) < 0) { d.st = 'flop'; d.t = 0; }
    } else if (d.st === 'flop') { const u = clamp(d.t / 0.6, 0, 1); d.flop = u * Math.PI / 2; d.y = lerp(D.R, 0.9, u); if (d.t > 1.1) { d.st = 'off'; if (s.fx && CartKit.near(s, d.x, d.z, 120)) s.fx.dust(d.x, 0.6, d.z, 10, '#d89a5a'); } }
    if (o) { o.live = true; o.visible = true; o.x = d.x; o.y = d.y; o.z = d.z; o.yaw = d.yaw + (d.st === 'roll' ? Math.sin(d.t * 3.1 + d.i) * 0.45 : 0.6); o.pitch = d.roll; o.roll = d.flop + (d.st === 'warn' ? Math.sin(d.t * 22) * 0.12 : 0); o.scale = d.st === 'flop' ? 1 - Math.max(0, d.t - 0.7) * 1.8 : 1; }
  }
}
// ---- the gumball avalanche: idle → warn (shake, crank, stripes flash) → pour (a stream of gumballs across the road) ----
function bkyGumballs(s, L, dt, racing) {
  const G = L.gum, P = BKY_GUMS, cyc = Math.floor(s.time / P.period), ph = s.time - cyc * P.period, t0 = P.period - P.warn - P.pour;
  const st = ph < t0 ? 'idle' : ph < t0 + P.warn ? 'warn' : 'pour';
  if (st === 'pour' && G.st !== 'pour') { G.cyc = cyc; G.launched = 0; CartKit.fired(s, 'gumball'); if (CartKit.near(s, G.x, G.z, 90)) cartIxSound(s, 'cartBubble', G.x, G.z, 0.8, 0.6); }
  G.st = st; G.t = st === 'warn' ? ph - t0 : st === 'pour' ? ph - t0 - P.warn : ph;
  G.crankA += dt * (st === 'warn' ? 9 : st === 'pour' ? 4 : 0.3);
  if (st === 'pour') {
    // launch the next ball every pour / n seconds, spread along the crossing
    while (G.launched < P.n && G.t >= G.launched * P.pour / P.n * 0.9) {
      const b = L.balls[G.launched]; b.live = true; b.t = 0; b.d = G.sd * (G.hw + 4); b.a = ((G.launched * 7 + G.cyc * 3) % 11 / 10 - 0.5) * 2 * P.band * 0.85; b.v = 11 + ((G.launched * 5 + G.cyc) % 7) * 0.9; b.mask = 0; b.ph = G.launched;
      G.launched++; if (CartKit.near(s, G.x, G.z, 70) && G.launched % 3 === 0) cartIxSound(s, 'bump', G.x, G.z, 0.4, 1.8);
    }
  }
  for (const b of L.balls) {
    const o = b.obj;
    if (!b.live) { if (o) { o.live = false; o.visible = false; } continue; }
    b.t += dt; b.d -= G.sd * b.v * dt;
    const bounce = Math.abs(Math.sin(b.t * 5.5 + b.ph)) * Math.max(0.2, 2.2 - b.t * 0.9);
    b.x = G.gx + G.nx * b.d + G.tx * b.a; b.z = G.gz + G.nz * b.d + G.tz * b.a; b.y = 1.0 + bounce;
    if (G.sd * b.d < -(G.hw + 6)) { b.live = false; if (s.fx && CartKit.near(s, b.x, b.z, 100)) s.fx.burst(b.x, 1, b.z, 'star', 4, BKY_GUM[b.ph % 8]); }
    const onRoad = Math.abs(b.d) < G.hw + 1;
    if (onRoad) cartIxObs(s, b.x, b.z, 1.6);
    if (racing && onRoad) for (const k of s.karts) {
      if (k.out || (b.mask & (1 << k.slot)) || k.shieldT > 0 || k.y > b.y + 1.2 || Math.hypot(k.x - b.x, k.z - b.z) > 2.3) continue;
      b.mask |= 1 << k.slot;
      // a shove across the road the way the ball rolls, a wobble, a moment of lost speed
      const px = -G.sd * G.nx, pz = -G.sd * G.nz; k.vx = k.vx * 0.8 + px * 7; k.vz = k.vz * 0.8 + pz * 7; k.slowT = Math.max(k.slowT, 0.7); k.yaw = cartWrap(k.yaw + (Math.random() - 0.5) * 0.35);
      CartKit.touch(s, k, 'gumball', 'GUMBALLED!', '#ffd23a');
      if (k.player) { s.shakeIt(0.4); Sound.play('bump', { vol: 0.7, pitch: 1.5 }); }
      if (s.fx) s.fx.burst(b.x, b.y, b.z, 'star', 6, BKY_GUM[b.ph % 8]);
    }
    if (o) { o.live = true; o.visible = true; o.x = b.x; o.y = b.y; o.z = b.z; o.yaw = 0; o.pitch = b.t * 6; o.roll = b.t * 4; o.scale = 1; }
  }
  // the globe shakes while it cranks, the crank turns
  const g = G.globe; if (g) { const sh = st === 'warn' ? 0.06 + G.t / P.warn * 0.1 : st === 'pour' ? 0.05 : 0; g.live = true; g.visible = true; g.x = G.x + Math.sin(s.time * 37) * sh * 0.6; g.y = 6.4 + 4.0 + Math.abs(Math.sin(s.time * 29)) * sh * 2; g.z = G.z + Math.cos(s.time * 41) * sh * 0.6; g.yaw = G.yaw; g.pitch = 0; g.roll = Math.sin(s.time * 33) * sh; g.scale = 1; }
  const c = G.crank; if (c) { c.live = true; c.visible = true; c.x = G.x + Math.sin(G.yaw) * 2.05; c.y = 4.2; c.z = G.z + Math.cos(G.yaw) * 2.05; c.yaw = G.yaw; c.pitch = 0; c.roll = G.crankA; c.scale = 1; }
}
// ---- frosting bogs: the bag slides over a lane, squeezes (a dotted ring shows where), pipes a bog that lasts a while ----
function bkyBogs(s, L, dt, racing) {
  const P = BKY_BOG, T = s.T || s.TR, lanes = [-0.5, 0.45, -0.1, 0.55, -0.55, 0.15];
  for (const q of L.gantries) {
    const cyc = Math.floor((s.time + q.off) / P.period), ph = s.time + q.off - cyc * P.period;
    if (cyc !== q.cyc) { q.cyc = cyc; q.d0 = q.d; q.d1 = lanes[(cyc + q.i * 3) % lanes.length] * q.hw; q.piped = false; }
    const tw = P.slide, tp = tw + P.warn;
    q.st = ph < tw ? 'slide' : ph < tp ? 'warn' : ph < tp + P.pipe ? 'pipe' : 'rest';
    q.tele = q.st === 'warn' ? (ph - tw) / P.warn : 0;
    const u = clamp(ph / P.slide, 0, 1); q.d = lerp(q.d0, q.d1, u * u * (3 - 2 * u));
    q.bx = q.x + q.nx * q.d; q.bz = q.z + q.nz * q.d;
    if (q.st === 'warn') cartIxObs(s, q.bx, q.bz, P.r * 0.8 * q.tele);
    if ((q.st === 'pipe' || q.st === 'rest') && !q.piped) {
      q.piped = true; let b = L.bogs.find(o => !o.live); if (!b) b = L.bogs.reduce((a, c) => (a.t > c.t ? a : c));
      b.live = true; b.t = 0; b.x = q.bx; b.z = q.bz; b.mask = 0; b.s = q.s; b.d = q.d; b.col = BKY_FROST_F[(q.cyc + q.i) % 3];
      CartKit.fired(s, 'bog'); if (CartKit.near(s, b.x, b.z, 70)) cartIxSound(s, 'splat', b.x, b.z, 0.8, 0.8);
    }
    const o = q.bag; if (o) { const sq = q.st === 'warn' ? Math.sin(q.tele * 30) * 0.04 + q.tele * 0.06 : q.st === 'pipe' ? 0.12 : 0; o.live = true; o.visible = true; o.x = q.bx; o.y = 13.8; o.z = q.bz; o.yaw = s.time * 0.3; o.pitch = 0; o.roll = q.st === 'slide' ? (q.d1 - q.d0) * 0.012 * Math.sin(u * Math.PI) : Math.sin(s.time * 20) * sq * 0.3; o.scale = 1 + sq; }
  }
  for (const b of L.bogs) {
    if (!b.live) continue;
    b.t += dt; if (b.t > P.life) { b.live = false; continue; }
    cartIxObs(s, b.x, b.z, b.r + 0.6);
    if (!racing) continue;
    for (const k of s.karts) {
      if (k.out || Math.hypot(k.x - b.x, k.z - b.z) > b.r) continue;
      const gy = s.terrain.height(k.x, k.z); if (k.air && k.y > gy + 0.2) { if (!(b.mask & (1 << k.slot)) && k.player && k.y > gy + 0.6) { b.mask |= 1 << k.slot; s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); } continue; }
      // stuck in it: speed bleeds away, the car slithers
      const drag = 1 - Math.min(0.9, 2.6 * dt); k.vx *= drag; k.vz *= drag; k.slowT = Math.max(k.slowT, 0.5);
      if (k.player) L.bogT = 1.2;
      if (!(b.mask & (1 << k.slot))) { b.mask |= 1 << k.slot; k.yaw = cartWrap(k.yaw + (Math.random() - 0.5) * 0.25); CartKit.touch(s, k, 'bog', 'FROSTING BOG!', '#ff8ac8'); if (k.player) Sound.play('splat', { vol: 0.7 }); }
    }
  }
}
// ---- sprites: whisk swirls, donut lane arrows and shadows, the crossing's stripes, bog targets and the bogs ----
function bkyDraw(s, L, R, S, t) {
  const C = BKY_C, cam = s.cam, T = s.T || s.TR, at = BKY_T.at2;
  for (const q of L.mixers) {
    if ((q.lx - cam.x) ** 2 + (q.lz - cam.z) ** 2 > 200 * 200) continue;
    if (q.st === 'warn') {
      const fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 20));
      R.flat.flat(q.lx, 0.12, q.lz, 8.5, 8.5, -q.spin, S.swirl || S.ring, C.hot, 0.95 * fl, false);
      for (let i = 0; i < 2; i++) { const u = 1 - ((q.tele * 1.6 + i / 2) % 1), r = 3 + u * 6; R.flat.flat(q.lx, 0.13, q.lz, r * 2, r * 2, 0, S.ring, C.white, 0.95 * (1 - u * 0.5) * q.tele, false); }
      R.flat.flat(q.lx, 0.11, q.lz, 9, 9, 0, S.glow, C.warn, 0.75 * (0.4 + 0.6 * q.tele) * fl, false);
    }
    if (q.st === 'drop' || q.st === 'down') { R.flat.flat(q.lx, 0.12, q.lz, 7.8, 7.8, -q.spin * 1.3, S.swirl || S.ring, C.white, 0.9, false); R.flat.flat(q.lx, 0.11, q.lz, 7.4, 7.4, 0, S.shadow, C.black, 0.35, false); if (s.fx && Math.random() < 0.5) s.fx.dust(q.lx + (Math.random() - 0.5) * 5, 0.3, q.lz + (Math.random() - 0.5) * 5, 1, '#fff4e4'); }
  }
  // donuts: the lane's arrows (pointing at the cars) while it peeks out, its shadow as it drops, a warning strip ahead of it
  for (const d of L.donuts) {
    if (d.st === 'off' || (d.x - cam.x) ** 2 + (d.z - cam.z) ** 2 > 220 * 220) continue;
    if (d.st === 'warn' || d.st === 'fall') {
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 16));
      for (let j = 1; j <= 9; j++) { T.at(d.s - j * 7, at); const x = at.x + at.nx * d.d, z = at.z + at.nz * d.d, a = Math.max(0, 1 - Math.abs(((t * 2.2 - j * 0.12) % 1))) ; R.flat.flat(x, 0.12, z, 5, 5, at.yaw, S.arrow, C.lemon, (0.5 + 0.5 * a) * fl, false); }
      const u = d.st === 'fall' ? clamp(d.t / BKY_DONUT.fall, 0, 1) : 0; R.flat.flat(d.x, 0.1, d.z, 3 + u * 2.5, 2 + u * 2, d.yaw, S.shadow, C.black, 0.3 + u * 0.35, false);
    } else if (d.st === 'roll') {
      R.flat.flat(d.x, 0.1, d.z, 2.6, 5, d.yaw, S.shadow, C.black, 0.45, false);
      for (let j = 1; j <= 5; j++) { T.at(d.s - 3 - j * 7, at); R.flat.flat(at.x + at.nx * d.d, 0.12, at.z + at.nz * d.d, 4.6, 4.6, at.yaw, S.arrow, C.lemon, 0.9 - j * 0.13, false); }
      if (s.fx && Math.random() < 0.25) s.fx.dust(d.x - d.fx * 1.5, 0.2, d.z - d.fz * 1.5, 1, '#e8c090');
    }
  }
  // the gumball crossing: stripes flash during the warning and the pour, beacons on both sides
  const G = L.gum;
  if ((G.gx - cam.x) ** 2 + (G.gz - cam.z) ** 2 < 200 * 200) {
    if (G.st !== 'idle') {
      const fl = G.st === 'warn' ? 0.35 + 0.65 * Math.max(0, Math.sin(t * 18)) : 0.8;
      for (let j = -2; j <= 2; j++) { T.at(G.s + j * BKY_GUMS.band * 0.4, at); R.flat.flat(at.x, 0.11, at.z, G.hw * 2.6, 3.0, at.yaw, S.square, (j + 2) % 2 ? C.lemon : C.red, 0.85 * fl, false); }
      if (G.st === 'warn' && s.fx && Math.random() < 0.5) s.fx.spark(G.x, 10.4, G.z, 2, BKY_GUM[Math.floor(t * 10) % 8], 5);
    }
    for (const sd of [1, -1]) { const x = G.gx + G.nx * sd * (G.hw + 1.3), z = G.gz + G.nz * sd * (G.hw + 1.3), on = G.st !== 'idle' && Math.floor(t * 5) % 2 === 0; R.bbs.streak(x, 1.6, z, 0, 1, 0, 3.2, 0.2, S.streak, [0.3, 0.2, 0.22], 1); R.bbs.bb(x, 3.3, z, on ? 2.4 : 1.2, on ? 2.4 : 1.2, S.glow, on ? C.red : C.lemon, on ? 1 : 0.5, true); }
    for (const b of L.balls) if (b.live) R.flat.flat(b.x, 0.1, b.z, 2.2, 2.2, 0, S.shadow, C.black, 0.4, false);
  }
  // bogs: the target ring while the bag squeezes, the frosting stream, the bog itself (frosting splats + sprinkles)
  for (const q of L.gantries) {
    if ((q.x - cam.x) ** 2 + (q.z - cam.z) ** 2 > 200 * 200) continue;
    if (q.st === 'warn') { const fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 18)), r = BKY_BOG.r * (2.6 - q.tele * 0.6); R.flat.flat(q.bx, 0.12, q.bz, r, r, t * 1.5, S.warn, C.hot, 0.95 * fl, false); R.flat.flat(q.bx, 0.11, q.bz, BKY_BOG.r * 2.6, BKY_BOG.r * 2.6, 0, S.glow, C.hot, 0.8 * (0.4 + 0.6 * q.tele) * fl, false); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t; R.flat.flat(q.bx + Math.sin(a) * BKY_BOG.r, 0.12, q.bz + Math.cos(a) * BKY_BOG.r, 1.1, 1.1, 0, S.dot, C.white, 0.95 * fl, false); } R.bbs.streak(q.bx, 11, q.bz, 0, 1, 0, 2.5, 0.35, S.streak, C.frost, 0.8 * q.tele); }
    if (q.st === 'pipe') R.bbs.streak(q.bx, 4.5, q.bz, 0, 1, 0, 9, 1.0, S.streak, C.frost, 0.95);
  }
  for (const b of L.bogs) {
    if (!b.live || (b.x - cam.x) ** 2 + (b.z - cam.z) ** 2 > 200 * 200) continue;
    const g = Math.min(1, b.t / 0.35), a = Math.min(1, (BKY_BOG.life - b.t) / 0.8), r = b.r * g;
    R.flat.flat(b.x, 0.08, b.z, r * 2.3, r * 2.3, 0.4, S.splat || S.dot, b.col, 0.97 * a, false);
    for (let i = 0; i < 5; i++) { const ang = i * 1.256 + 0.3, dd = r * 0.6; R.flat.flat(b.x + Math.sin(ang) * dd, 0.09, b.z + Math.cos(ang) * dd, r * 1.2, r * 1.2, i, S.splat || S.dot, b.col, 0.97 * a, false); }
    for (let i = 0; i < 9; i++) { const ang = i * 2.4, dd = r * (0.2 + (i % 3) * 0.25); R.flat.flat(b.x + Math.sin(ang) * dd, 0.1, b.z + Math.cos(ang) * dd, 0.7, 0.22, i * 1.3, S.square, BKY_GUM_F[i % 7], a, false); }
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  // hazard screenshots (tools/cart_track_test.js reads debug.trackShots.bakery; this file is named sugarrush so it loads after 43_cart_j_kit.js): park the player where the hazard plays
  // out, step until its moment
  const list = () => ['whisk-warn', 'whisk', 'donut-warn', 'donut', 'gumball-warn', 'gumball', 'bog-warn', 'bog', 'boulevard', 'crook', 'cakes'].map(name => ({ name }));
  const shot = name => {
    const D = C.debug, STEP = 1 / 60;
    D.start({ mode: 'quick', track: 'bakery', car: 'cupcake', driver: 'brady', seed: 9, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const L = s.bky, T = s.T, P = s.player, B = s.E.bky;
    let pin = null;
    const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
    const pins = [];
    const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
    s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
    const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
    const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
    let ok = true;
    if (name === 'whisk-warn' || name === 'whisk') { const q = L.mixers[1]; park(q.s - 24, -q.sd * 0.4, 0, true); rivals([[-30, 0, 1]]); ok = wait(() => name === 'whisk' ? q.st === 'down' : q.tele > 0.6, 9); }
    else if (name === 'donut-warn' || name === 'donut') { park(B.bridge.s - 70, 0.1, 0, true); rivals([[-30, 0, 1]]); ok = wait(() => L.donuts.some(d => name === 'donut' ? d.st === 'roll' && CartKit.ds(T, d.s, B.bridge.s) > 25 : d.st === 'warn' && d.t > 0.7), 12); }
    else if (name === 'gumball-warn' || name === 'gumball') { park(L.gum.s - 30, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'gumball' ? L.gum.st === 'pour' && L.gum.t > 0.9 : L.gum.st === 'warn' && L.gum.t > 1.0, 12); }
    else if (name === 'bog-warn' || name === 'bog') { const q = L.gantries[0]; park(q.s - 26, 0, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => name === 'bog' ? L.bogs.some(b => b.live && b.t > 0.6 && b.s === q.s) && q.st === 'rest' : q.st === 'warn' && q.tele > 0.6, 12); }
    else if (name === 'boulevard') { park(T.L - 40, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
    else if (name === 'crook') { park(B.S.crook - 40, 0, 18, false); rivals([[10, 0.3, 0], [18, -0.3, 0]]); wait(() => false, 0.7); }
    else if (name === 'cakes') { park(B.S.cake0 - 45, 0, 18, false); rivals([[10, 0.3, 0], [18, -0.3, 0]]); wait(() => false, 0.7); }
    s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
    return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, touch: (s.kit || {}).touch, dn: L.donuts.map(d => [d.st, +d.x.toFixed(0), +d.z.toFixed(0), +d.y.toFixed(1), +d.s.toFixed(0)]), p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)] };
  };
  C.debug.trackShots = C.debug.trackShots || {};
  C.debug.trackShots.bakery = { list, shot };
}, 0);
