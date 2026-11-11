/* ============================================================
   ART CART — LOVE PARADE, Bass Valentine's career track (C3, Nov 11 2026).
   The quality bar for the other eleven car tracks (recipe: docs/ART_CART_LEVEL_RECIPE.md).
   A night parade in pink and red neon, one lap of about 1.1 km:
     VALENTINE BOULEVARD  the start straight between rows of speaker stacks under giant heart arches; four GIANT SUBS
                          drop the bass in turn: their cones pump and the road flashes for two beats, then a shockwave
                          rolls across the road and SHOVES every car on the ground (HOP on the drop and it passes under)
     THE HEART TUNNEL     a sweeping bend through a tunnel of glowing heart ribs (a boost pad inside)
     KISSING BOOTH CHICANE an S through the kissing booths, patrolled by three CUPID DRONES that drop HEART MINES ahead
                          of the cars (a heart target marks where each one will land: steer off it)
     THE DANCE FLOOR      a wide plaza of beat-lit floor tiles with a CONGA CROSSING: a conga line dances across the road
                          and back (brake or find the gap)
     CONFETTI ALLEY       four CONFETTI CANNONS that tilt, fizz and blast across the road (a flashing cone shows where):
                          caught, you're blinded for a moment and your steering wanders
     HEARTBREAK HAIRPIN   back onto the boulevard
   Bass Valentine's HEART THROB is in everyone's gift boxes here (CART_TRACKS.loveparade.car = 'heart').
   Start it without the menus: BRADY_CART.debug.start({ mode: 'career', track: 'loveparade' }) (or mode 'quick').
   ============================================================ */
const LP_BEAT = 60 / 126;   // the scene's beat (the hearts and LEDs pulse at ~126 bpm)
const LP_C = { pink: [1, 0.25, 0.6], hot: [1, 0.12, 0.42], red: [1, 0.1, 0.18], rose: [1, 0.55, 0.75], white: [1, 1, 1], gold: [1, 0.8, 0.35], violet: [0.7, 0.35, 1], black: [0, 0, 0], warn: [1, 0.2, 0.3], cyan: [0.3, 0.9, 1] };
const LP_PAL = ['#ff2a6a', '#ff7ab0', '#ffffff', '#c040ff', '#ff4f8a', '#ff9ad0', '#ff3a3a'];
const LP_PAL_F = LP_PAL.map(c => burnsRGBf(c));
const LP_CONFETTI = ['#ff3a6a', '#ffd84a', '#38f2ff', '#7aff5a', '#ff9ad8', '#c86aff', '#ffffff'];
const LP_T = { at: {} };
const LP_ROTORS = [[0.95, 0.65], [-0.95, 0.65], [0.95, -0.65], [-0.95, -0.65]];
const LP_CONFETTI_F = LP_CONFETTI.map(c => burnsRGBf(c));

/* ---------------- the course ---------------- */
// corners [x, z, radius]: the boulevard (east), the heart tunnel sweeper (north), the chicane and the dance floor
// (west along the top), confetti alley and the hairpin back down
const LP_POLY = [[-175, 0, 40], [175, 0, 42], [240, 100, 40], [180, 210, 32], [105, 195, 16], [72, 234, 15], [36, 194, 15], [2, 234, 18], [-90, 216, 32], [-155, 170, 38], [-210, 85, 32]];
const lpWidth = (x, z) => {
  if (z > 185 && x > -95 && x < 15) return 1 + 0.6 * BurnsM.smoothstep(0, 1, 1 - Math.abs(x + 44) / 46);   // the dance floor widens
  if (z > 180 && x > 15 && x < 112) return 0.9;   // the chicane is a touch narrower
  return 1;
};
CART_TRACKS.loveparade = {
  name: 'LOVE PARADE', car: 'heart', tod: 'night', music: 'kart1', width: 20, shoulder: 6, theme: 'love', blurb: 'Bass drops, cupid drones and a conga line',
  pts: CartKit.course(LP_POLY, { start: [-40, 0], width: lpWidth, step: 18 }),
  world: (id, D) => lpWorld(id, D)
};
CART_CAREER_TRACKS.heart = 'loveparade';

/* ---------------- static pieces (merged into the world's chunks) ---------------- */
// a heart outline over the road (local x across, y up, z along): W wide where it meets the ground, H tall at the lobes
function lpHeartArch(m, W, H, r, col, glow, bulbs) {
  const yg = -0.42, P = [0, 0];
  let xg = 0; for (let i = 0; i < 400; i++) { CartKit.heart(i / 400, P); if (Math.abs(P[1] - yg) < 0.02) xg = Math.max(xg, Math.abs(P[0])); }
  const sx = W / 2 / xg, sy = H / (0.85 - yg), n = 56, pts = [];
  for (let i = 0; i <= n; i++) { CartKit.heart(i / n, P); if (P[1] > yg - 0.06) pts.push([P[0] * sx, (P[1] - yg) * sy, i]); else pts.push(null); }
  m.color(col, glow).shine(2);
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[i + 1]; if (!a || !b) continue; m.limb(a[0], a[1], 0, b[0], b[1], 0, r, r, { seg: m.lo ? 5 : 7, ends: false }); }
  m.emissive(0).shine(0);
  const lights = [];
  if (bulbs) for (let i = 0; i <= n; i += 2) { const a = pts[i]; if (!a || a[1] < 0.5) continue; lights.push({ x: a[0], y: a[1], z: r + 0.05, s: 0.55, c: i % 4 ? '#ffffff' : '#ff9ad0' }); }
  // feet: a rounded plinth where each side meets the ground
  m.color('#2a1424').shine(1); for (const sd of [-1, 1]) m.roundBox(sd * W / 2, 0.5, 0, 1.6, 1.0, 1.6, 0.3); m.shine(0);
  return { cols: [{ t: 'cyl', x: -W / 2, z: 0, r: 0.9, y0: 0, y1: 3, camPass: true }, { t: 'cyl', x: W / 2, z: 0, r: 0.9, y0: 0, y1: 3, camPass: true }], lights };
}
// a giant sub cabinet facing +z (the road); the big cone is a pooled object that pumps
function lpSubCabinet(m) {
  m.color('#160e18').shine(1); m.roundBox(0, 3.3, 0, 5.4, 6.6, 3.0, 0.35);
  m.color('#2a1a2a'); m.roundBox(0, 3.3, 1.5, 4.9, 6.1, 0.12, 0.08);
  m.push(); m.tf(0, 2.75, 1.56, 0, Math.PI / 2, 0); m.color('#ff2a6a', 1); m.torus(0, 0, 0, 2.15, 0.11, { seg: 28, tseg: 5 }); m.pop();
  for (const sx of [-1.4, 1.4]) { m.push(); m.tf(sx, 5.6, 1.56, 0, Math.PI / 2, 0); m.color('#3a2a3a').shine(2); m.disc(0, 0, 0, 0.5, 14); m.color('#ff7ab0', 0.9); m.torus(0, 0, 0, 0.52, 0.05, { seg: 14, tseg: 3 }); m.pop(); }
  m.emissive(0).shine(0);
  m.color('#ff2a6a', 1); m.box(0, 6.62, 1.2, 5.0, 0.08, 0.1); m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.7, hz: 1.5, y0: 0, y1: 6.6 }], lights: [{ x: 0, y: 6.8, z: 1.3, s: 1.2, c: '#ff2a6a' }] };
}
// a kissing booth (facing +z): a counter, striped canopy, a big glowing heart on top
function lpBooth(m) {
  const wd = BURNS_ATLAS.pattern('wood');
  m.color('#c88a5a'); m.roundBox(0, 0.6, 0, 4.2, 1.2, 1.4, 0.1, { uv: wd });
  m.color('#fff4f0'); m.roundBox(0, 1.25, 0.1, 4.4, 0.1, 1.6, 0.04);
  m.color('#8a5a3a').shine(1); for (const sx of [-2, 2]) m.limb(sx, 1.2, -0.5, sx, 3.2, -0.5, 0.08, 0.08, { seg: 6 }); m.shine(0);
  for (let i = 0; i < 8; i++) { m.color(i % 2 ? '#ffffff' : '#ff2a5a', i % 2 ? 0 : 0.2); m.push(); m.tf(-2.1 + 0.3 + i * 0.6, 3.3, 0.1, 0, -0.35, 0); m.box(0, 0, 0, 0.6, 0.08, 2.0); m.pop(); }
  m.color('#ff2a5a', 1); m.push(); m.tf(0, 5.1, -0.3); m.ball(-0.42, 0.25, 0, 0.62, { seg: 12, rings: 8 }); m.ball(0.42, 0.25, 0, 0.62, { seg: 12, rings: 8 }); m.lathe([[0.95, 0.15], [0.55, -0.55], [0, -0.95]], { seg: 14 }); m.pop(); m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.2, hz: 0.8, y0: 0, y1: 3.4 }], lights: [{ x: 0, y: 5.2, z: 0.4, s: 2.6, c: '#ff2a5a' }] };
}
// a confetti cannon's carriage (the barrel is pooled: it tilts and recoils)
function lpCarriage(m) {
  m.color('#3a2030').shine(1); m.roundBox(0, 0.55, 0, 1.4, 0.5, 2.2, 0.15);
  m.color('#ffd84a').shine(3); for (const sx of [-0.85, 0.85]) { m.push(); m.tf(sx, 0.62, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.55, 0.1, { seg: 16, tseg: 4 }); m.pop(); m.limb(sx * 0.9, 0.62, 0, -sx * 0.9, 0.62, 0, 0.05, 0.05, { seg: 5 }); }
  m.shine(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.9, hz: 1.2, y0: 0, y1: 1.2 }] };
}

/* ---------------- instanced props (this world only) ---------------- */
const LP_KINDS = {
  // a stack of three speaker boxes with glowing cone rings (tinted)
  lp_stack: { r: 3, near: 34, mid: 120, farD: 320, glows: [[0, 5.6, 0.7, 1.4]], pool: 8,
    build(m, o) {
      for (let k = 0; k < 3; k++) { const y = 0.9 + k * 1.75, w = 2.2 - k * 0.25; m.color('#18121c').shine(1); m.roundBox(0, y, 0, w, 1.7, 1.6, 0.14); m.push(); m.tf(0, y, 0.81, 0, Math.PI / 2, 0); m.color('#2a2230').shine(2); m.disc(0, 0, 0, 0.6, m.lo ? 10 : 16); m.color('#ffffff', o.night ? 0.9 : 0.2); m.torus(0, 0, 0, 0.62, 0.06, { seg: m.lo ? 10 : 16, tseg: 3 }); m.pop(); }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.8, y0: 0, y1: 5.5 }] };
    },
    far(m, o) { m.color('#18121c'); m.box(0, 2.6, 0, 2.1, 5.2, 1.6); m.color('#ffffff', o.night ? 0.9 : 0.2); for (let k = 0; k < 3; k++) m.box(0, 0.9 + k * 1.75, 0.82, 1.1, 1.1, 0.02); m.emissive(0); } },
  // a bunch of heart balloons on strings (tinted)
  lp_balloons: { r: 2, near: 34, mid: 120, farD: 300, glows: [[0, 5.2, 0, 2.2]], pool: 6,
    build(m, o) {
      m.color('#3a3040'); m.roundBox(0, 0.15, 0, 0.5, 0.3, 0.5, 0.1);
      const B = [[0, 5.2, 0], [0.9, 4.6, 0.3], [-0.85, 4.7, -0.2], [0.35, 4.0, -0.7], [-0.4, 3.9, 0.7]];
      for (const [x, y, z] of B) {
        m.color('#e8e0f0'); m.limb(0, 0.3, 0, x, y - 0.6, z, 0.012, 0.012, { seg: 3, ends: false });
        m.color('#ffffff', o.night ? 0.35 : 0).shine(3); m.ball(x - 0.22, y + 0.12, z, 0.34, { seg: m.lo ? 8 : 12, rings: m.lo ? 6 : 8 }); m.ball(x + 0.22, y + 0.12, z, 0.34, { seg: m.lo ? 8 : 12, rings: m.lo ? 6 : 8 }); m.push(); m.tf(x, y, z); m.lathe([[0.52, 0.08], [0.3, -0.35], [0, -0.62]], { seg: m.lo ? 8 : 12 }); m.pop();
      }
      m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 1, camPass: true }] };
    },
    far(m, o) { m.color('#ffffff', o.night ? 0.35 : 0); m.ball(0, 5, 0, 0.8, { seg: 6, rings: 4 }); m.ball(0.6, 4.3, 0, 0.6, { seg: 6, rings: 4 }); m.emissive(0); } },
  // an LED heart stud on the road edge (it reads the edge at night from far away)
  lp_stud: { r: 0.6, near: 40, mid: 140, farD: 260, noAO: true, shadow: false,
    build(m) { m.color('#ffffff', 1); m.push(); m.tf(0, 0.06, 0); m.ball(-0.11, 0, 0.05, 0.13, { seg: 6, rings: 3 }); m.ball(0.11, 0, 0.05, 0.13, { seg: 6, rings: 3 }); m.ball(0, 0, -0.1, 0.12, { seg: 6, rings: 3 }); m.pop(); m.emissive(0); },
    far(m) { m.color('#ffffff', 1); m.box(0, 0.06, 0, 0.36, 0.08, 0.36); m.emissive(0); } }
};

/* ---------------- building the world ---------------- */
function lpWorld(id, D) {
  const sky = Object.assign({}, BURNS_PALETTES.night, { zen: '#06030e', hor: '#7a1a52', fog: '#1e0a1c', fogD: 0.0062, haze: 0.22, sky: '#22143a', gnd: '#20121e', mid: '#3a0e30', midK: 0.3, cityCol: '#ff3a8a', cityK: 0.4, key: '#c89aff', keyK: 0.55, emB: 1.75, stars: 0.75, clouds: 0.3, cloudCol: '#4a1a3a', moon: [70, 28], rim: '#ff7ab0' });
  const W = CartKit.world(id, D, { worldId: 1201, night: true, sky, ground: '#8a767a', crack: 0.2,
    road: { shoulder: 'rgba(70,30,50,0.45)', band: 'rgba(52,22,44,0.9)', edge: 'rgba(255,70,160,0.95)', edgeW: 0.6, centerFn: lpPaintCenter } });
  const { E, T, api, rng } = W;
  const S = { tunnel: CartKit.sOf(T, 222, 150), chicane0: CartKit.sOf(T, 112, 196), chicane1: CartKit.sOf(T, 6, 230), conga: CartKit.sOf(T, -44, 224), alley: CartKit.sOf(T, -122, 194), boul0: CartKit.sOf(T, 0, 0), boul1: CartKit.sOf(T, 140, 0) };
  E.lp = { S };
  // the dance floor: LED tiles painted on the plaza (the beat lights them in draw())
  api.paint((ctx, P, Sc) => {
    const T0 = S.conga - 34, T1 = S.conga + 34;
    for (let s = T0; s < T1; s += 2.6) { const g = T.at(s, {}); const n = Math.floor(g.hw * 2 / 2.6); for (let i = 0; i < n; i++) { const d = -g.hw + (i + 0.5) * g.hw * 2 / n, q = P(g.x + g.nx * d, g.z + g.nz * d); ctx.fillStyle = (Math.floor(s / 2.6) + i) % 2 ? 'rgba(120,30,90,0.75)' : 'rgba(60,20,70,0.75)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-1.2 * Sc, -1.2 * Sc, 2.4 * Sc, 2.4 * Sc); ctx.restore(); } }
    // the conga crossing: zebra stripes across the road
    const g = T.at(S.conga, {});
    for (let d = -g.hw; d < g.hw; d += 1.6) { const q = P(g.x + g.nx * (d + 0.4), g.z + g.nz * (d + 0.4)); ctx.fillStyle = 'rgba(255,240,250,0.85)'; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx)); ctx.fillRect(-2.2 * Sc, -0.4 * Sc, 4.4 * Sc, 0.8 * Sc); ctx.restore(); }
  });
  // barriers: pink / red / white along the lap (red and white tyres on the tight bends), lamps in the palette
  CartKit.rails(E, T, (i, tight) => tight ? (i % 2 ? '#ffffff' : '#ff2a4a') : LP_PAL[Math.floor(i / 2) % 3 === 2 ? 2 : Math.floor(i / 2) % 2 ? 1 : 0]);
  CartKit.lamps(E, T, ['#ff4f8a', '#ff9ad0', '#c040ff', '#ffffff'], 34);
  CartKit.kinds(E, LP_KINDS);
  // heart studs on both road edges every 5 m: the edges glow even where the barriers are far off
  for (let s = 0; s < T.L; s += 5) { const g = T.at(s, {}); for (const sd of [1, -1]) { const d = sd * (g.hw - 0.15); CartKit.put(E, 'lp_stud', g.x + g.nx * d, g.z + g.nz * d, g.yaw, Math.floor(s / 5) % 3 ? '#ff4f9a' : '#ffffff', { y: 0, noLights: true }); } }
  const taken = [];
  const side = (s, sd, off) => { const g = T.at(s, {}), o = sd > 0 ? g.wr + off : -g.wl - off; return { x: g.x + g.nx * o, z: g.z + g.nz * o, yaw: Math.atan2(-g.nx * sd, -g.nz * sd), g }; };

  // ---- the start: a giant heart gate with the name on it, the grandstands, the crowd ----
  { const g = T.at(0, {}), Wd = g.wl + g.wr + 4;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => lpHeartArch(m, Wd, 17, 0.55, '#ff2a6a', 1, true), { hi: true, noAO: true });
    api.sign('LOVE PARADE', g.x, g.z, { yaw: g.yaw + Math.PI, h: 2.0, y: 9.6, post: false, maxW: 10, style: { bg: '#2a0a20', fg: '#ffffff', border: '#ff4f9a' }, glow: '#ff4f9a' });
    api.light(g.x, g.z, 22, '#ff4f9a', 0.6);
    for (const sd of [1, -1]) { const p = side(4, sd, 6); E.spots.push(...CartScene.bleachers(api, p.x, p.z, p.yaw, 20, 3, rng)); api.light(p.x, p.z, 16, '#ffb0e0', 0.5); taken.push([p.x, p.z, 16]); }
    const heroes = ['partyboy', 'sparklepony', 'annoyingdj', 'greeter_f', 'burnermom', 'messiah'];
    heroes.forEach((type, i) => { const p = side(-10 + Math.floor(i / 2) * 8, i % 2 ? 1 : -1, 2.4); E.heroes.push({ type, x: p.x, z: p.z, yaw: p.yaw, anim: type === 'annoyingdj' ? 'dj' : type === 'messiah' ? 'welcome' : 'dance' }); });
  }
  // ---- Valentine Boulevard: giant subs, speaker stacks, heart arches overhead, crowds ----
  E.lp.subs = [];
  for (let i = 0; i < 4; i++) {
    const x = 12 + i * 36, s = CartKit.sOf(T, x, 0), sd = i % 2 ? 1 : -1, p = side(s, sd, 3.4);
    CartScene.mesh(api, p.x, p.z, p.yaw, lpSubCabinet, { hi: true, noAO: true });
    E.lp.subs.push({ i, s, sd, x: p.x, z: p.z, yaw: p.yaw, fx: Math.sin(p.yaw), fz: Math.cos(p.yaw) });
    taken.push([p.x, p.z, 6]); api.light(p.x + Math.sin(p.yaw) * 4, p.z + Math.cos(p.yaw) * 4, 9, '#ff2a6a', 0.45);
  }
  for (let s = -110; s < 150; s += 12) { const sp = ((s % T.L) + T.L) % T.L; for (const sd of [1, -1]) { const p = side(sp, sd, 9 + (Math.abs(s) % 24 === 0 ? 2 : 0)); if (!E.lp.subs.some(q => Math.hypot(q.x - p.x, q.z - p.z) < 7)) CartKit.put(E, 'lp_stack', p.x, p.z, p.yaw, LP_PAL[(Math.abs(s / 12) | 0) % 2 ? 0 : 3]); } }
  for (const x of [-95, 55, 125]) { const g = T.at(CartKit.sOf(T, x, 0), {}); CartScene.mesh(api, g.x, g.z, g.yaw, m => lpHeartArch(m, g.wl + g.wr + 4, 14, 0.38, x === 55 ? '#ffffff' : '#ff4f9a', 1, false), { hi: true, noAO: true }); api.glow(g.x, 11, g.z, 3, '#ff4f9a'); }
  CartKit.crowd(E, T, (T.L - 115) % T.L, T.L - 30, 1, rng, { rows: 1, off: 13, gap: 2.2 }); CartKit.crowd(E, T, (T.L - 115) % T.L, T.L - 30, -1, rng, { rows: 1, off: 13, gap: 2.2 });
  // ---- the heart tunnel: glowing ribs every 5.5 m, a big red heart at each end ----
  for (let k = -5; k <= 5; k++) { const g = T.at(S.tunnel + k * 5.5, {}), end = Math.abs(k) === 5, Wd = Math.max(g.wl, g.wr) * 2 + 4;
    CartScene.mesh(api, g.x, g.z, g.yaw, m => lpHeartArch(m, Wd, end ? 17 : 14.5, end ? 0.7 : 0.32, end ? '#ff1a4a' : (k % 2 ? '#ff4f9a' : '#c040ff'), 1, end), { hi: true, noAO: true });
    if (k % 2 === 0) api.light(g.x, g.z, 10, k % 4 ? '#ff4f9a' : '#c040ff', 0.55); }
  taken.push([T.at(S.tunnel, {}).x, T.at(S.tunnel, {}).z, 40]);
  // ---- the chicane: kissing booths on the outside of its bends ----
  for (const [x, z, sd] of [[72, 234, 0], [36, 194, 0]]) { const s = CartKit.sOf(T, x, z), g = T.at(s, {}), out = g.k > 0 ? -1 : 1, p = side(s, out, 5); CartScene.mesh(api, p.x, p.z, p.yaw, lpBooth, { hi: true }); api.sign('KISSING\nBOOTH', p.x - Math.sin(p.yaw) * 0.2, p.z - Math.cos(p.yaw) * 0.2, { yaw: p.yaw + Math.PI, h: 0.9, y: 1.45, post: false, maxW: 3.6, style: { bg: '#ffffff', fg: '#ff2a5a', border: '#ff2a5a' }, glow: '#ff9ad0' }); api.light(p.x, p.z, 12, '#ff4f8a', 0.6); taken.push([p.x, p.z, 8]); E.heroes.push({ type: rng() < 0.5 ? 'greeter_f' : 'greeter_m', x: p.x - Math.sin(p.yaw) * 1.4, z: p.z - Math.cos(p.yaw) * 1.4, yaw: p.yaw, anim: 'wave' }); void sd; }
  // ---- the dance floor: a DJ stage, crowds both sides, conga beacons and signs ----
  { const p = side(S.conga + 22, 1, 10); CartDecor.put(E, 'stage', p.x, p.z, p.yaw, '#ff4f9a', { scale: 1.1 }); taken.push([p.x, p.z, 10]); E.heroes.push({ type: 'annoyingdj', x: p.x + Math.sin(p.yaw) * 5.5, z: p.z + Math.cos(p.yaw) * 5.5, yaw: p.yaw, anim: 'dj' }); }
  CartKit.crowd(E, T, S.conga - 36, S.conga + 10, 1, rng, { rows: 3, off: 3 }); CartKit.crowd(E, T, S.conga - 36, S.conga + 36, -1, rng, { rows: 3, off: 3 });
  for (const sd of [1, -1]) { const p = side(S.conga, sd, 1.6); api.sign('CONGA\nCROSSING', p.x + Math.sin(p.yaw) * -0.6, p.z + Math.cos(p.yaw) * -0.6, { yaw: T.at(S.conga, {}).yaw + Math.PI, h: 1.0, y: 2.4, post: true, maxW: 3.2, style: { bg: '#ffd84a', fg: '#1a1a1a', border: '#1a1a1a' }, glow: '#ffd84a' }); }
  E.lp.crossing = { s: S.conga };
  // ---- confetti alley: four cannons, alternating sides ----
  E.lp.cannons = [];
  for (let i = 0; i < 4; i++) { const s = S.alley - 30 + i * 20, sd = i % 2 ? 1 : -1, p = side(s, sd, 3.2); CartScene.mesh(api, p.x, p.z, p.yaw, lpCarriage, { hi: true, scale: 1.8 }); E.lp.cannons.push({ i, s, sd, x: p.x, z: p.z, yaw: p.yaw }); taken.push([p.x, p.z, 4]); }
  CartKit.crowd(E, T, S.alley - 40, S.alley + 40, 1, rng, { rows: 2, off: 7 });
  // ---- balloons and speaker stacks fill the rest of the outside; searchlights and laser fans in the sky ----
  for (let s = 20, k = 0; s < T.L; s += 26, k++) { const sd = k % 2 ? 1 : -1, p = side(s, sd, 6 + (k % 3) * 2), free = taken.every(q => Math.hypot(q[0] - p.x, q[1] - p.z) > q[2] + 3); if (free && CartWorlds.clear(T, p.x, p.z, 2)) CartKit.put(E, k % 3 ? 'lp_balloons' : 'lp_stack', p.x, p.z, p.yaw, LP_PAL[k % LP_PAL.length], { scale: 1 + (k % 2) * 0.3 }); }
  CartDecor.skyline(E, T, rng);
  E.beams = []; for (let i = 0; i < 6; i++) { const p = side(T.L * (i + 0.3) / 6, i % 2 ? 1 : -1, 45 + rng() * 25); if (!CartWorlds.clear(T, p.x, p.z, 12)) continue; E.beams.push({ kind: i % 2 ? 'laser' : 'search', x: p.x, y: 1, z: p.z, c: burnsRGBf(i % 3 ? '#ff4f9a' : '#c040ff'), ph: rng() * 6, sp: 0.4 + rng() * 0.4, len: i % 2 ? 70 : 140, w: i % 2 ? 0.5 : 6, a: i % 2 ? 0.55 : 0.2 }); api.light(p.x, p.z, 10, '#ff4f9a', 0.5); }
  // gift rows, boost pads (fractions of the lap), the grid
  const f = s => (((s % T.L) + T.L) % T.L) / T.L;
  CartKit.gifts(E, T, [f(CartKit.sOf(T, 70, 0)), f(S.tunnel - 45), f(S.chicane1 + 14), f(CartKit.sOf(T, -200, 60))]);
  CartKit.boosts(E, T, [[f(S.tunnel), 0], [f(S.conga + 26), -0.45], [f(CartKit.sOf(T, -150, 0)), 0.3]]);
  CartKit.grid(E, T);
  return CartKit.finish(E);
}
// the centre line: small pink hearts every 8 m
function lpPaintCenter(ctx, P, S, T) {
  for (let s = 0; s < T.L; s += 8) { const g = T.at(s, {}), q = P(g.x, g.z); ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(Math.atan2(g.tz, g.tx) + Math.PI / 2); ctx.scale(S * 0.55, S * 0.55); ctx.fillStyle = 'rgba(255,90,170,0.75)'; ctx.beginPath(); ctx.moveTo(0, 1); ctx.bezierCurveTo(-1.8, -0.2, -0.7, -1.6, 0, -0.5); ctx.bezierCurveTo(0.7, -1.6, 1.8, -0.2, 0, 1); ctx.fill(); ctx.restore(); }
}

/* ---------------- the moving things (one pooled group) ---------------- */
const LP_DANCER_COL = [['#ff4fd8', '#ffe24a', '#2a1a12'], ['#38f2ff', '#ff9ad8', '#f4d890'], ['#ffe24a', '#ff4f8a', '#6a3a22'], ['#7aff5a', '#c86aff', '#1a1210'], ['#ff7a2a', '#38f2ff', '#c8a070'], ['#c86aff', '#ffffff', '#3a2218'], ['#ffffff', '#ff4fd8', '#e8c890'], ['#ff2a5a', '#ffe24a', '#1a1a1a'], ['#ff9ad8', '#7aff5a', '#8a4a28'], ['#3a8aff', '#ffd84a', '#f0e0c0']];
const LP_SKIN = ['#e8b890', '#c88a5a', '#8a5a3a', '#f0c8a0', '#a8704a', '#5a3a2a'];
const LpMesh = {
  // a big woofer cone facing +z (it pumps along z)
  cone(m) { m.push(); m.tf(0, 0, 0, 0, Math.PI / 2, 0); m.color('#241a26').shine(1); m.lathe([[1.95, 0], [1.8, -0.1], [0.55, -0.5], [0.5, -0.52], [0, -0.52]], { seg: 22 }); m.color('#3a3040').shine(3); m.ellipsoid(0, -0.45, 0, 0.55, 0.25, 0.55, { seg: 14, rings: 6, phi1: Math.PI / 2 }); m.pop(); m.shine(0); },
  // a cupid drone: a glossy heart body, little white wings, four rotor arms, LED eyes (forward = +z)
  drone(m) {
    m.color('#ff2a6a', 0.15).shine(3); m.ball(-0.3, 0.15, 0, 0.4, { seg: 12, rings: 8 }); m.ball(0.3, 0.15, 0, 0.4, { seg: 12, rings: 8 }); m.lathe([[0.62, 0.05], [0.35, -0.4], [0, -0.68]], { seg: 14 }); m.shine(0);
    m.color('#ffffff', 0.2); for (const sd of [-1, 1]) { m.push(); m.tf(sd * 0.75, 0.25, -0.15, 0, 0, sd * -0.5); m.ellipsoid(0, 0, 0, 0.42, 0.06, 0.22, { seg: 8, rings: 4 }); m.ellipsoid(sd * 0.18, -0.12, 0.05, 0.3, 0.05, 0.16, { seg: 8, rings: 4 }); m.pop(); }
    m.color('#2a2230').shine(2); for (const [x, z] of [[0.95, 0.65], [-0.95, 0.65], [0.95, -0.65], [-0.95, -0.65]]) { m.limb(0, 0.3, 0, x, 0.42, z, 0.04, 0.04, { seg: 4 }); m.cyl(x, 0.42, z, 0.08, 0.08, 0.1, 6); }
    m.color('#ffffff', 1); for (const sd of [-1, 1]) m.ball(sd * 0.22, 0.2, 0.43, 0.08, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
  },
  // a heart mine: an upright glossy heart on a little base, a blinking light on top
  mine(m) { m.color('#2a1424'); m.disc(0, 0.04, 0, 0.55, 12); m.color('#ff1a4a', 0.3).shine(3); m.push(); m.tf(0, 0.72, 0); m.ball(-0.25, 0.15, 0, 0.32, { seg: 10, rings: 7 }); m.ball(0.25, 0.15, 0, 0.32, { seg: 10, rings: 7 }); m.lathe([[0.5, 0.06], [0.28, -0.35], [0, -0.62]], { seg: 12 }); m.pop(); m.color('#ffffff', 1); m.ball(0, 1.18, 0, 0.07, { seg: 6, rings: 4 }); m.emissive(0).shine(0); },
  // a conga dancer (body + head + arms reaching forward onto the next one's shoulders; legs are their own objects)
  dancer(m, i) {
    const [top, skirt, hair] = LP_DANCER_COL[i % 10], skin = LP_SKIN[i % 6];
    m.color(top).shine(1); m.ellipsoid(0, 1.28, 0, 0.21, 0.33, 0.15, { seg: 9, rings: 6 }); m.shine(0);
    m.color(skirt, 0.15); m.push(); m.tf(0, 0.98, 0); m.lathe([[0.17, 0.02], [0.38, -0.12], [0.33, -0.18], [0.12, -0.06]], { seg: 10 }); m.pop(); m.emissive(0);
    m.color(skin); m.ball(0, 1.78, 0.02, 0.16, { seg: 9, rings: 7 }); for (const sd of [-1, 1]) m.limb(sd * 0.2, 1.48, 0, sd * 0.17, 1.44, 0.62, 0.05, 0.045, { seg: 5 });
    m.color(hair); m.ball(0, 1.86, -0.04, 0.17, { seg: 9, rings: 6 }); m.ball(0, 1.8, -0.16, 0.12, { seg: 7, rings: 5 });
    m.color('#1a1020'); for (const sd of [-1, 1]) m.ball(sd * 0.06, 1.8, 0.15, 0.025, { seg: 4, rings: 3 });
    m.color('#ff4f9a', 1); for (const sd of [-1, 1]) { m.limb(sd * 0.08, 1.92, 0, sd * 0.16, 2.2, 0, 0.012, 0.012, { seg: 3, ends: false }); m.ball(sd * 0.16, 2.23, 0, 0.06, { seg: 6, rings: 4 }); } m.emissive(0);
  },
  leg(m, i) { const [top, skirt] = LP_DANCER_COL[Math.floor(i / 2) % 10]; m.color(LP_SKIN[Math.floor(i / 2) % 6]); m.limb(0, 0, 0, 0, -0.55, 0.01, 0.07, 0.06, { seg: 5 }); m.color(i % 4 < 2 ? skirt : top, 0.1); m.limb(0, -0.5, 0, 0, -0.88, 0.03, 0.11, 0.13, { seg: 6 }); m.ellipsoid(0, -0.9, 0.06, 0.1, 0.06, 0.15, { seg: 6, rings: 4 }); m.emissive(0); },
  // a confetti cannon barrel, pointing along +z from its pivot
  barrel(m) { m.color('#ff4fa8', 0.1).shine(3); m.limb(0, 0, -0.7, 0, 0, 1.9, 0.5, 0.58, { seg: 14 }); m.color('#ffd84a').shine(3); for (const z of [-0.5, 0.6, 1.8]) { m.push(); m.tf(0, 0, z, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 0.56, 0.07, { seg: 16, tseg: 4 }); m.pop(); } m.color('#1a1020'); m.push(); m.tf(0, 0, 1.92, 0, Math.PI / 2, 0); m.disc(0, 0, 0, 0.5, 14); m.pop(); m.emissive(0).shine(0); }
};

/* ---------------- the rules: hazards and enemies at run time ---------------- */
const LP_SUB = { period: 8, tele: 2, speed: 34, reach: 30, band: 1.5, push: 9.5 };
const LP_DRONES = 3, LP_MINES = 8, LP_DANCERS = 8, LP_CANNON = { period: 5.6, tele: 1.1, len: 27, half: 0.42 };
CART_TRACK_RULES.loveparade = {
  onLoad(s) {
    const E = s.E, lp = E.lp, T = s.T || s.TR;
    const G = CartKit.group(s, [['cones', LpMesh.cone, 4], ['drones', LpMesh.drone, LP_DRONES], ['mines', LpMesh.mine, LP_MINES], ['bodies', LpMesh.dancer, LP_DANCERS], ['legs', LpMesh.leg, LP_DANCERS * 2], ['barrels', LpMesh.barrel, 4]]);
    const L = s.lp = { G, subs: [], drones: [], mines: [], conga: null, cannons: [], blind: 0, said: {} };
    lp.subs.forEach((q, i) => L.subs.push(Object.assign({}, q, { off: i * 2.5, t0: -99, R: 0, mask: 0, live: false, beat: -1, cone: G.cones[i] })));
    for (let i = 0; i < LP_DRONES; i++) L.drones.push({ i, obj: G.drones[i], s: lp.S.chicane0 + i * 30, d: 0, h: 5.8, vs: 0, cool: 1.5 + i * 1.1, tgt: null, mode: 'patrol', x: 0, y: 0, z: 0, yaw: 0, ph: i * 2.1 });
    for (let i = 0; i < LP_MINES; i++) L.mines.push({ obj: G.mines[i], live: false, t: 0, x: 0, z: 0, y0: 0, fall: 0.9, life: 7.5, landed: false, owner: null });
    const g = T.at(lp.crossing.s, {});
    L.conga = { s: lp.crossing.s, x: g.x, z: g.z, nx: g.nx, nz: g.nz, tx: g.tx, tz: g.tz, hw: g.hw, dir: 1, head: -g.hw - 6, state: 'walk', wait: 0, speed: 4.2, gap: 1.7, ds: [], cool: [] };
    for (let i = 0; i < LP_DANCERS; i++) { L.conga.ds.push(0); L.conga.cool.push(0); }
    lp.cannons.forEach((c, i) => L.cannons.push(Object.assign({}, c, { off: i * 1.4 + (i % 2) * 0.7, mask: 0, fired: -99, obj: G.barrels[i], tele: false })));
    CartKit.state(s);
  },
  onUpdate(s, dt, racing) {
    const L = s.lp; if (!L) return;
    lpSubs(s, L, dt, racing); lpDrones(s, L, dt, racing); lpMines(s, L, dt); lpConga(s, L, dt, racing); lpCannons(s, L, dt, racing);
    if (L.blind > 0) L.blind = Math.max(0, L.blind - dt);
  },
  // the AI: hop the bass drop (by skill), brake for the conga line
  onStep(s, k, dt, racing) {
    const L = s.lp; if (!L || k.player && !s.autoDrive || !racing || !s.T || k.out) return;
    const I = k.inp, sk = k.ai ? k.ai.skill : 0.9;
    for (const q of L.subs) if (q.live) { const D = Math.hypot(k.x - q.x, k.z - q.z), arrive = (D - q.R) / LP_SUB.speed; if (arrive > 0 && arrive < 0.12 && !k.air && D < LP_SUB.reach + 2 && ((k.slot * 7 + q.i * 3) % 10) / 10 < 0.5 + (sk - 0.85) * 3) { I.driftPress = true; I.drift = false; } }
    const C = L.conga, ds = CartKit.ds(s.T, k.loc.s, C.s);
    if (ds > 3 && ds < 38 && C.state === 'walk') {
      const ta = ds / Math.max(6, k.speed);
      for (let i = 0; i < LP_DANCERS; i++) { const d = C.ds[i] + C.dir * C.speed * ta; if (Math.abs(d) < C.hw + 1 && Math.abs(d - k.loc.d) < 3.4) { if (k.speed > 9) I.gas = 0; if (k.speed > 15) I.brake = 0.5; /* ease off to a crawl, never a full stop: the line takes 4 s to pass a lane */ break; } }
    }
  },
  draw(s, R, S, t) { const L = s.lp; if (L) lpDraw(s, L, R, S, t); },
  lights(s, add) {
    const L = s.lp; if (!L) return;
    for (const q of L.subs) if (q.live && q.R < 12) add(q.x + q.fx * 4, 3, q.z + q.fz * 4, 14, LP_C.hot, 1.6, 2);
    for (const d of L.drones) add(d.x, d.y - 1, d.z, 8, LP_C.pink, 0.9, 1);
    for (const c of L.cannons) if (s.time - c.fired < 0.4) add(c.x, 2, c.z, 14, LP_C.gold, 1.6, 2);
  },
  hud(s, ctx, W, H, top, left) {
    const L = s.lp, p = s.player; if (!L || !p) return;
    // blinded by confetti: a storm of paper over the screen, clearing from the middle
    if (L.blind > 0) { const a = Math.min(1, L.blind * 1.2), n = 90, tt = s.time; ctx.save(); for (let i = 0; i < n; i++) { const u = (i * 0.618 + tt * (0.25 + (i % 5) * 0.06)) % 1, x = ((i * 97) % 100) / 100 * W + Math.sin(tt * 3 + i) * 20, y = u * (H + 40) - 20, cx = x - W / 2, cy = y - H / 2, far = Math.min(1, Math.hypot(cx / W, cy / H) * 2.4); ctx.globalAlpha = a * (0.35 + 0.65 * far); ctx.fillStyle = LP_CONFETTI[i % 7]; ctx.save(); ctx.translate(x, y); ctx.rotate(tt * 4 + i); ctx.fillRect(-7, -4, 14, 8); ctx.restore(); } ctx.restore(); }
    // first-lap hints as each hazard comes up
    const hint = (key, sv, text, sub) => { if (L.said[key] || p.lap > 1) return; const ds = CartKit.ds(s.T, p.loc.s, sv); if (ds > 0 && ds < 70) { L.said[key] = true; s.banner(text, '#ff9ad0', 2.0, sub); } };
    if (s.state === 'race' && s.T) { const S = s.E.lp.S; hint('subs', L.subs[0].s, 'BASS DROPS AHEAD!', 'HOP on the drop and the wave passes under'); hint('drones', S.chicane0, 'CUPID DRONES!', 'steer off the heart targets'); hint('conga', L.conga.s, 'CONGA CROSSING!', 'brake or find the gap'); hint('cannons', L.cannons[0].s, 'CONFETTI CANNONS!', 'pass while they reload'); }
  }
};

// ---- the giant subs: every 8 beats, staggered; 2 beats of warning, then the shockwave ----
function lpSubs(s, L, dt, racing) {
  const beat = s.time / LP_BEAT;
  for (const q of L.subs) {
    const ph = ((beat + q.off) % LP_SUB.period + LP_SUB.period) % LP_SUB.period;
    q.tele = ph >= LP_SUB.period - LP_SUB.tele ? (ph - (LP_SUB.period - LP_SUB.tele)) / LP_SUB.tele : 0;
    if (ph < 0.5 && !q.live && s.time - q.t0 > LP_BEAT * (LP_SUB.period - 1)) {
      q.live = true; q.t0 = s.time; q.R = 0; q.mask = 0; CartKit.fired(s, 'bass');
      if (CartKit.near(s, q.x, q.z, 60)) { cartIxSound(s, 'cartBass', q.x, q.z, 1, 0.75); cartIxSound(s, 'cartBoom', q.x, q.z, 0.35, 0.6); }
      if (CartKit.near(s, q.x, q.z, 26)) s.shakeIt(0.35);
      if (s.fx && q.cone && CartKit.near(s, q.x, q.z, 120)) s.fx.dust(q.x + q.fx * 3, 0.4, q.z + q.fz * 3, 10, '#a06a8a');
    }
    if (q.live) {
      q.R = (s.time - q.t0) * LP_SUB.speed;
      if (q.R > LP_SUB.reach) q.live = false;
      else if (racing) for (const k of s.karts) {
        if (k.out || (q.mask & (1 << k.slot))) continue;
        const dx = k.x - q.x, dz = k.z - q.z, D = Math.hypot(dx, dz); if (Math.abs(D - q.R) > LP_SUB.band || dx * q.fx + dz * q.fz < 0) continue;
        q.mask |= 1 << k.slot;
        const gh = s.terrain.height(k.x, k.z); if (k.air && k.y > gh + 0.25) { if (k.player) s.banner('NICE HOP!', '#7aff8a', 0.7, null, true); continue; }   // hopped it
        if (k.shieldT > 0 || k.immuneT > 0 || k.fly || k.sunk) continue;
        const pw = LP_SUB.push * (1 - 0.55 * D / LP_SUB.reach), nx = dx / (D || 1), nz = dz / (D || 1);
        k.vx += nx * pw; k.vz += nz * pw; k.vy = Math.max(k.vy, 2.6); k.air = true; k.hop = true; k.drift = 0; k.charge = 0; k.yaw = cartWrap(k.yaw + (Math.random() - 0.5) * 0.18);
        CartKit.touch(s, k, 'bass', 'BASS SHOVE!', '#ff4f9a');
        if (k.player) { s.shakeIt(0.6); Sound.play('bump', { vol: 0.6, pitch: 0.7 }); }
      }
    }
    // the cone pumps: a slow throb all the time, a hard push on the drop, a quiver in the warning beats
    const c = q.cone; if (c) { const after = s.time - q.t0, kick = after < 0.25 ? Math.sin(after / 0.25 * Math.PI) : 0, quiver = q.tele ? Math.sin(s.time * 40) * 0.08 * q.tele : 0, throb = Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 6) * 0.12; c.live = true; c.visible = true; c.x = q.x + q.fx * 1.62; c.y = 2.75; c.z = q.z + q.fz * 1.62; c.yaw = q.yaw; c.pitch = 0; c.roll = 0; c.scale = 1 + kick * 0.18 + quiver + throb; }
  }
}
// ---- cupid drones: patrol the chicane, pick a car, fly ahead of it, drop a heart mine on where it will be ----
function lpDrones(s, L, dt, racing) {
  const T = s.T || s.TR, lp = s.E.lp, s0 = lp.S.chicane0 - 15, s1 = lp.S.chicane1 + 25;
  for (const d of L.drones) {
    d.cool -= dt;
    let goalS = s0 + ((Math.sin(s.time * 0.21 + d.ph) * 0.5 + 0.5) * (CartKit.ds(T, s0, s1))), goalD = Math.sin(s.time * 0.7 + d.ph * 2) * 6;
    if (racing && d.cool <= 0 && !d.tgt) {
      // a target: a car coming into the chicane, not already marked by another drone
      let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.finished) continue; const ds = CartKit.ds(T, s0 - 30, k.loc.s); if (ds < 0 || ds > CartKit.ds(T, s0 - 30, s1) - 15) continue; if (L.drones.some(o => o.tgt === k)) continue; const sc = Math.abs(CartKit.ds(T, d.s, k.loc.s)) + (k.player ? -6 : 0); if (sc < bd) { bd = sc; best = k; } }
      if (best) { d.tgt = best; d.mode = 'chase'; d.chase = 0; }
      else d.cool = 0.6;
    }
    if (d.tgt) {
      const k = d.tgt; d.chase += dt;
      const lead = Math.max(8, k.speed * 1.15); goalS = k.loc.s + lead; goalD = k.loc.d;
      if (d.chase > 0.6 && Math.abs(CartKit.ds(T, d.s, goalS)) < 6) { lpDropMine(s, L, d, k); d.tgt = null; d.cool = 2.6 + Math.random() * 1.6; d.mode = 'patrol'; }
      else if (d.chase > 3.5 || k.out || k.finished) { d.tgt = null; d.cool = 1.2; }
    }
    // fly: fast along the course toward the goal, sway, bank
    const dsg = CartKit.ds(T, d.s, goalS), sp = d.tgt ? 46 : 14; d.vs = approach(d.vs, clamp(dsg * 3, -sp, sp), 60 * dt); d.s += d.vs * dt; d.d = lerp(d.d, goalD, 1 - Math.exp(-3 * dt));
    const g = T.at(d.s, LP_T.at); d.x = g.x + g.nx * d.d; d.z = g.z + g.nz * d.d; d.y = s.terrain.height(d.x, d.z) + d.h + Math.sin(s.time * 2.3 + d.ph) * 0.5; d.yaw = g.yaw + (d.vs < -1 ? Math.PI : 0);
    const o = d.obj; if (o) { o.live = true; o.visible = true; o.x = d.x; o.y = d.y; o.z = d.z; o.yaw = d.yaw; o.pitch = clamp(d.vs * 0.012, -0.35, 0.35); o.roll = Math.sin(s.time * 1.7 + d.ph) * 0.15; o.scale = 2.4; }
  }
}
function lpDropMine(s, L, d, k) {
  let m = L.mines.find(q => !q.live); if (!m) m = L.mines.reduce((a, b) => (a.t > b.t ? a : b));
  const T = s.T || s.TR, g = T.at(k.loc.s + Math.max(14, k.speed * 1.0), LP_T.at), dd = clamp(k.loc.d, -g.hw + 1.5, g.hw - 1.5);
  m.live = true; m.t = 0; m.landed = false; m.x = g.x + g.nx * dd; m.z = g.z + g.nz * dd; m.y0 = d.y; m.sx = d.x; m.sz = d.z; m.owner = d; m.mask = 0;
  CartKit.fired(s, 'heartmine'); cartIxSound(s, 'throw', m.x, m.z, 0.5, 1.4); cartIxSound(s, 'cartSparkle', m.x, m.z, 0.4, 1.3);
  if (k.player) s.banner('HEART MINE INCOMING!', '#ff4f8a', 1.0, 'steer off the target', true);
}
function lpMines(s, L, dt) {
  for (const m of L.mines) {
    const o = m.obj;
    if (!m.live) { if (o) { o.live = false; o.visible = false; } continue; }
    m.t += dt;
    const gy = s.terrain.height(m.x, m.z), u = clamp(m.t / m.fall, 0, 1);
    if (!m.landed && m.t >= m.fall) {
      m.landed = true; cartIxSound(s, 'stomp', m.x, m.z, 0.6, 1.4); if (s.fx) s.fx.hearts(m.x, gy + 1, m.z, 5);
      for (const k of s.karts) { if (k.out || k.air) continue; if (Math.hypot(k.x - m.x, k.z - m.z) < 2.2) { lpMinePop(s, m, k); break; } }
    }
    if (m.live && m.landed) {
      cartIxObs(s, m.x, m.z, 1.8);
      for (const k of s.karts) { if (k.out || k.air) continue; if (Math.hypot(k.x - m.x, k.z - m.z) < 1.7) { lpMinePop(s, m, k); break; } }
      if (m.t > m.life) { m.live = false; if (s.fx) s.fx.burst(m.x, gy + 0.8, m.z, 'heart', 6, '#ff4f8a'); }
    } else if (m.live && u > 0.4) cartIxObs(s, m.x, m.z, 2.2);
    if (o) { o.live = m.live; o.visible = m.live; o.x = lerp(m.sx, m.x, u); o.z = lerp(m.sz, m.z, u); o.y = m.landed ? gy : lerp(m.y0 - 1, gy, u * u); o.yaw = m.t * (m.landed ? 0.8 : 4); o.pitch = 0; o.roll = 0; o.scale = m.landed ? 1.7 + Math.pow(Math.max(0, Math.sin(m.t * 6)), 8) * 0.15 : 1.4; }
  }
}
function lpMinePop(s, m, k) {
  m.live = false; const gy = s.terrain.height(m.x, m.z);
  CartKit.hit(s, k, 'spin', 'heartmine', { dur: 1.0, banner: 'HEART MINE!' });
  k.charmT = Math.max(k.charmT || 0, 1.2); k.charmBy = null;
  if (s.fx) { s.fx.hearts(m.x, gy + 1.2, m.z, 16); s.fx.burst(m.x, gy + 1, m.z, 'star', 12, '#ff4f8a'); }
  cartIxSound(s, 'break', m.x, m.z, 0.8, 1.5); cartIxSound(s, 'swell', m.x, m.z, 0.3, 1.8);
}
// ---- the conga line: dances across the road at the crossing, waits, dances back ----
function lpConga(s, L, dt, racing) {
  const C = L.conga, n = LP_DANCERS, G = L.G, edge = C.hw + 5, len = (n - 1) * C.gap;
  if (C.state === 'wait') { C.wait -= dt; if (C.wait <= 0) { C.state = 'walk'; C.dir = -C.dir; C.head = -C.dir * edge; } }
  else { C.head += C.dir * C.speed * dt; if (C.dir * C.head > edge + len) { C.state = 'wait'; C.wait = 3.5; CartKit.fired(s, 'conga'); } }
  const beat = s.time / LP_BEAT;
  for (let i = 0; i < n; i++) {
    const d = C.state === 'wait' ? C.dir * (edge + len - i * C.gap) : C.head - C.dir * i * C.gap;
    C.ds[i] = d;
    if (C.cool[i] > 0) C.cool[i] -= dt;
    const sway = Math.sin((beat + i * 0.5) * Math.PI) * 0.25, x = C.x + C.nx * d + C.tx * sway, z = C.z + C.nz * d + C.tz * sway, gy = s.terrain.height(x, z);
    const onRoad = Math.abs(d) < C.hw + 0.5;
    if (onRoad && C.state === 'walk') {
      cartIxObs(s, x, z, 1.2);
      if (racing && C.cool[i] <= 0) for (const k of s.karts) { if (k.out || (k.air && k.y > gy + 1.5)) continue; if (Math.hypot(k.x - x, k.z - z) < 2.1) { C.cool[i] = 1.2; CartKit.hit(s, k, 'spin', 'conga', { dur: 0.9, banner: 'CONGA LINE!' }); k.vx *= 0.4; k.vz *= 0.4; cartIxSound(s, 'bump', x, z, 0.8, 1.3); cartIxSound(s, 'crowd', x, z, 0.5, 1.4); if (s.fx) s.fx.confetti(x, gy + 2, z, 12); break; } }
    }
    // pose: hop on the kick beat, twirl when bumped
    const step = (beat + i * 0.25) % 4, kick = step > 3 ? Math.sin((step - 3) * Math.PI) : 0, hop = Math.abs(Math.sin(beat * Math.PI)) * 0.08, spin = C.cool[i] > 0 ? (1.2 - C.cool[i]) * 9 : 0, yaw = Math.atan2(C.nx * C.dir, C.nz * C.dir);
    const b = G.bodies[i]; if (b) { b.live = true; b.visible = true; b.x = x; b.y = gy + hop + (C.cool[i] > 0 ? Math.sin((1.2 - C.cool[i]) / 1.2 * Math.PI) * 1.2 : 0); b.z = z; b.yaw = yaw + spin; b.roll = sway * 0.4; b.pitch = 0; b.scale = 1.45; }
    for (let l = 0; l < 2; l++) { const o = G.legs[i * 2 + l]; if (!o) continue; const sd = l ? 1 : -1, sw = C.state === 'walk' ? Math.sin(beat * Math.PI + l * Math.PI) * 0.45 : 0; o.live = true; o.visible = true; o.x = x + Math.cos(yaw + spin) * sd * 0.11 * 1.45; o.z = z - Math.sin(yaw + spin) * sd * 0.11 * 1.45; o.y = (b ? b.y : gy) + 0.95 * 1.45; o.yaw = yaw + spin; o.pitch = sw - (l === 1 ? kick * 1.1 : 0); o.roll = 0; o.scale = 1.45; }
  }
}
// ---- confetti cannons: tilt and fizz (warning), BOOM across the road, reload ----
function lpCannons(s, L, dt, racing) {
  const T = s.T || s.TR;
  for (const c of L.cannons) {
    const ph = ((s.time + c.off) % LP_CANNON.period + LP_CANNON.period) % LP_CANNON.period, until = LP_CANNON.period - ph;
    c.tele = until < LP_CANNON.tele ? 1 - until / LP_CANNON.tele : 0;
    if (ph < 0.2 && s.time - c.fired > 1) {
      c.fired = s.time; c.mask = 0; CartKit.fired(s, 'confetti');
      if (CartKit.near(s, c.x, c.z, 70)) { cartIxSound(s, 'cartBoom', c.x, c.z, 0.7, 1.5); cartIxSound(s, 'firework_launch', c.x, c.z, 0.5, 1.2); }
      if (s.fx && CartKit.near(s, c.x, c.z, 140)) for (let i = 0; i < 70; i++) { const a = c.yaw + (Math.random() - 0.5) * LP_CANNON.half * 2, sp = 14 + Math.random() * 18; s.fx.add(c.x + Math.sin(c.yaw) * 2, 2.2, c.z + Math.cos(c.yaw) * 2, Math.sin(a) * sp, 3 + Math.random() * 6, Math.cos(a) * sp, 1.4 + Math.random() * 1.2, 0.5, 0.4, LP_CONFETTI_F[i % 7], 1, 'square', 2 | 4, Math.random() * 6, 9); }
    }
    const after = s.time - c.fired;
    if (after < 0.45 && racing) for (const k of s.karts) {
      if (k.out || (c.mask & (1 << k.slot)) || k.shieldT > 0) continue;
      const dx = k.x - c.x, dz = k.z - c.z, D = Math.hypot(dx, dz); if (D > LP_CANNON.len * Math.min(1, after / 0.25 + 0.2)) continue;
      if (Math.abs(cartWrap(Math.atan2(dx, dz) - c.yaw)) > LP_CANNON.half) continue;
      c.mask |= 1 << k.slot;
      k.lostT = Math.max(k.lostT || 0, 1.1); k.slowT = Math.max(k.slowT, 0.8);
      if (k.player) { s.lp.blind = 1.5; Sound.play('cartSparkle', { vol: 0.7 }); }
      CartKit.touch(s, k, 'confetti', 'CONFETTI\'D!', '#ffd84a');
      if (s.fx) s.fx.confetti(k.x, k.y + 2, k.z, 16);
    }
    // the AI sees the cone coming and keeps out of it while it is about to fire
    if (c.tele > 0.3 || after < 0.4) for (let r = 6; r < LP_CANNON.len; r += 6) cartIxObs(s, c.x + Math.sin(c.yaw) * r, c.z + Math.cos(c.yaw) * r, 2.2 + r * 0.25);
    const o = c.obj; if (o) { const rec = after < 0.5 ? Math.sin(after / 0.5 * Math.PI) : 0; o.live = true; o.visible = true; o.x = c.x - Math.sin(c.yaw) * rec * 0.9; o.y = 2.3; o.z = c.z - Math.cos(c.yaw) * rec * 0.5; o.yaw = c.yaw + (c.tele ? Math.sin(s.time * 30) * 0.03 * c.tele : 0); o.pitch = -0.32 - c.tele * 0.12 + rec * 0.2; o.roll = 0; o.scale = 1.8 + c.tele * 0.1; }
    void T;
  }
}
// ---- sprites: shockwaves and their warnings, drone rotors, mine targets, the dance floor, the cannon cones ----
function lpDraw(s, L, R, S, t) {
  const C = LP_C, cam = s.cam, beat = s.time / LP_BEAT, pulse = Math.pow(Math.max(0, Math.sin(beat * Math.PI)), 6);
  for (const q of L.subs) {
    if ((q.x - cam.x) ** 2 + (q.z - cam.z) ** 2 > 220 * 220) continue;
    const fx = q.fx, fz = q.fz, gy = 0.12;
    // the cabinet's LEDs: three count-in lights over the cone during the warning, the glow of the cone ring on the beat
    R.bbs.bb(q.x + fx * 1.7, 2.75, q.z + fz * 1.7, 5 + pulse * 1.5 + q.tele * 3, 5 + pulse * 1.5 + q.tele * 3, S.glow, C.hot, 0.35 + pulse * 0.25 + q.tele * 0.5, true);
    if (q.tele > 0) {
      for (let i = 0; i < 3; i++) { const on = q.tele * 3 > i; R.bbs.bb(q.x + fx * 1.6 + Math.cos(q.yaw) * (i - 1) * 1.2, 6.2, q.z + fz * 1.6 - Math.sin(q.yaw) * (i - 1) * 1.2, on ? 1.1 : 0.7, on ? 1.1 : 0.7, S.dot, on ? C.white : C.hot, on ? 1 : 0.4, true); }
      // the road flashes: rings closing in on the sub, a red half-disc over its reach, light posts blinking on its edge
      const fl = 0.35 + 0.65 * Math.max(0, Math.sin(t * 22));
      R.flat.flat(q.x + fx * LP_SUB.reach * 0.45, gy, q.z + fz * LP_SUB.reach * 0.45, LP_SUB.reach * 1.15, LP_SUB.reach * 1.0, q.yaw, S.glow, C.warn, 0.4 * q.tele * fl, true);
      for (let i = 0; i < 3; i++) { const u = 1 - ((q.tele * 1.5 + i / 3) % 1), r = 4 + u * LP_SUB.reach; R.flat.flat(q.x, gy + 0.01, q.z, r * 2, r * 2, 0, S.ring, C.hot, 0.95 * (1 - u * 0.6) * q.tele, true); }
      for (let i = 0; i <= 12; i++) { const ang = q.yaw + (i / 12 - 0.5) * 2.9, px = q.x + Math.sin(ang) * LP_SUB.reach, pz = q.z + Math.cos(ang) * LP_SUB.reach; R.bbs.streak(px, 1.1, pz, 0, 1, 0, 2.2, 0.4, S.streak, C.hot, 0.8 * fl * q.tele); }
    }
    if (q.live) {
      // the shockwave: a wall of pink light rolling out across the road, thick rings on the ground under it
      const a = 1 - q.R / LP_SUB.reach;
      for (const dr of [-0.6, 0, 0.6]) R.flat.flat(q.x, gy + 0.03, q.z, (q.R + dr) * 2, (q.R + dr) * 2, 0, S.ring, dr ? C.pink : C.white, a, true);
      for (let i = 0; i <= 16; i++) { const ang = q.yaw + (i / 16 - 0.5) * 2.9, px = q.x + Math.sin(ang) * q.R, pz = q.z + Math.cos(ang) * q.R; R.bbs.streak(px, 1.4, pz, 0, 1, 0, 2.8, 1.1, S.streak, i % 2 ? C.pink : C.rose, 0.85 * a); }
      if (Math.random() < 0.6 && s.fx) s.fx.notes(q.x + fx * q.R * 0.5, 1.5, q.z + fz * q.R * 0.5);
    }
  }
  for (const d of L.drones) {
    // rotor blur discs, a pink glow, a tether of hearts trailing
    const o = d.obj; if (!o) continue;
    for (const [x, z] of LP_ROTORS) { const c = Math.cos(d.yaw), sn = Math.sin(d.yaw), wx = d.x + (x * c + z * sn) * 2.4, wz = d.z + (-x * sn + z * c) * 2.4; R.flat.flat(wx, d.y + 1.1, wz, 1.4, 1.4, t * 30, S.ring, C.white, 0.45, true); }
    R.bbs.bb(d.x, d.y, d.z, 4.5, 4.5, S.glow, C.pink, 0.4, true);
    if (d.tgt) { const gy = s.terrain.height(d.x, d.z); R.bbs.streak(d.x, (d.y + gy) / 2, d.z, 0, 1, 0, d.y - gy, 0.6, S.streak, C.hot, 0.25); }
  }
  for (const m of L.mines) {
    if (!m.live) continue; const gy = s.terrain.height(m.x, m.z) + 0.1;
    if (!m.landed) { const u = clamp(m.t / m.fall, 0, 1), sz = 6 - u * 2, bl = 0.55 + 0.45 * Math.sin(t * (12 + u * 20)); R.flat.flat(m.x, gy, m.z, sz, sz, t * 2, S.reticle || S.ring, C.hot, 0.8 * bl, true); R.flat.flat(m.x, gy + 0.01, m.z, sz * 0.6, sz * 0.6, 0, S.heart, C.hot, 0.9 * bl, true); R.flat.flat(m.x, gy - 0.02, m.z, 1 + u * 2.2, 1 + u * 2.2, 0, S.shadow, C.black, 0.3 + u * 0.4, false); }
    else { const bl = Math.pow(Math.max(0, Math.sin(m.t * 6)), 8); R.flat.flat(m.x, gy, m.z, 4.2 + bl, 4.2 + bl, 0, S.glow, C.hot, 0.55 + bl * 0.3, true); R.bbs.bb(m.x, gy + 1.2, m.z, 1 + bl, 1 + bl, S.glow, C.white, 0.5 + bl * 0.5, true); }
  }
  // the dance floor: tiles light up in moving patterns on the beat
  const Cg = L.conga, T = s.T || s.TR;
  if ((Cg.x - cam.x) ** 2 + (Cg.z - cam.z) ** 2 < 200 * 200) {
    const b = Math.floor(beat), at = LP_T.at;
    for (let j = -12; j <= 12; j++) { const sv = Cg.s + j * 2.6; T.at(sv, at); const n = Math.floor(at.hw * 2 / 2.6); for (let i = 0; i < n; i++) { const lit = ((i + j + b) % 4 === 0) || ((i * 3 - j + b * 2) % 7 === 0); if (!lit) continue; const d = -at.hw + (i + 0.5) * at.hw * 2 / n; R.flat.flat(at.x + at.nx * d, 0.09, at.z + at.nz * d, 2.3, 2.3, at.yaw, S.square, LP_PAL_F[(((i + j + b) % 7) + 7) % 7], 0.5 * (0.5 + pulse * 0.5), true); } }
    // the crossing's beacons (flash while the line is on the road) and the zebra glow
    const on = Cg.state === 'walk', fl = on ? Math.floor(t * 4) % 2 : 0;
    for (const sd of [1, -1]) { const x = Cg.x + Cg.nx * sd * (Cg.hw + 1.2), z = Cg.z + Cg.nz * sd * (Cg.hw + 1.2); R.bbs.streak(x, 1.6, z, 0, 1, 0, 3.2, 0.2, S.streak, [0.2, 0.2, 0.22], 1); R.bbs.bb(x, 3.3, z, fl ? 2.4 : 1.2, fl ? 2.4 : 1.2, S.glow, [1, 0.8, 0.2], fl ? 1 : 0.4, true); }
  }
  for (const c of L.cannons) {
    if ((c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 > 200 * 200) continue;
    const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw), after = s.time - c.fired;
    if (c.tele > 0) {
      // the danger cone flashes on the road; the fuse fizzes at the back of the barrel
      const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 18)), len = LP_CANNON.len;
      for (let r = 4; r < len; r += 4) { const w = 2 * r * Math.tan(LP_CANNON.half); R.flat.flat(c.x + fx * r, 0.1, c.z + fz * r, w, 4.2, c.yaw, S.square, C.gold, 0.18 * c.tele * fl, true); }
      for (const sd of [-1, 1]) { const a = c.yaw + sd * LP_CANNON.half; R.flat.flat(c.x + Math.sin(a) * len / 2, 0.11, c.z + Math.cos(a) * len / 2, 0.5, len, a, S.square, C.gold, 0.8 * c.tele * fl, true); }
      if (s.fx && Math.random() < 0.7) s.fx.spark(c.x - fx * 0.6, 1.9, c.z - fz * 0.6, 2, '#ffd84a', 4);
    }
    if (after < 0.6) R.bbs.bb(c.x + fx * 2.6, 2.1, c.z + fz * 2.6, 7 * (1 - after), 7 * (1 - after), S.glow, C.gold, 1 - after / 0.6, true);
  }
}

if (typeof window !== 'undefined') setTimeout(() => {
  const C = window.BRADY_CART; if (!C || !C.debug) return;
  // the level's live state for tests: hazard counters, enemy positions
  // hazard screenshots (tools/cart_track_test.js): park the player where the hazard plays out, step until its moment
  C.debug.levelShots = () => ['bass-warn', 'bass', 'drone', 'mine', 'conga', 'cannon-warn', 'cannon', 'blind', 'tunnel', 'booths'].map(name => ({ name }));
  C.debug.levelShot = name => {
    const D = C.debug, STEP = 1 / 60;
    D.start({ mode: 'quick', track: 'loveparade', car: 'heart', driver: 'brady', seed: 9, autoGas: true });
    const s = D.scene(); s.state = 'race'; s.stateT = 0; window.BRADY.Input.setMode('game'); s.layoutControls(); s.update(STEP);
    const L = s.lp, T = s.T, P = s.player, lp = s.E.lp;
    let pin = null;   // a parked player is held in place (a frozen car would back away with its brakes on)
    const park = (sv, lat, speed, frozen) => { const g = T.at(sv, {}); D.place(-1, g.x + g.nx * g.hw * lat, g.z + g.nz * g.hw * lat, g.yaw, { speed: speed || 0, frozen: false }); P.prevS = P.loc.s; P.lap = 1; P.prog = P.loc.s; pin = frozen ? { x: P.x, z: P.z, yaw: P.yaw } : null; };
    const pins = [];
    const rivals = list => { let j = 0; for (let i = 0; i < s.karts.length; i++) { const k = s.karts[i]; if (k.player) continue; const r = list[j++] || [-300 - j * 12, 0, 1]; const g = T.at(P.loc.s + r[0], {}); D.place(i, g.x + g.nx * g.hw * r[1], g.z + g.nz * g.hw * r[1], g.yaw, { speed: r[2] ? 0 : 18, frozen: false }); if (r[2]) pins.push({ k, x: k.x, z: k.z, yaw: k.yaw }); k.prevS = k.loc.s; k.lap = 1; k.prog = k.loc.s; if (k.ai) { k.ai.itemT = 99; k.ai.fireT = 99; } k.wpn.t = 99; } };
    s.autoDrive = true; if (!P.ai) s.aiInput(P, STEP, true); P.ai.itemT = 99; P.ai.fireT = 99; P.wpn.t = 99;
    const hold = () => { if (pin) { P.x = pin.x; P.z = pin.z; P.yaw = pin.yaw; P.vx = P.vz = 0; } for (const q of pins) { q.k.x = q.x; q.k.z = q.z; q.k.yaw = q.yaw; q.k.vx = q.k.vz = 0; } };
    const wait = (fn, secs) => { for (let i = 0; i < secs * 60; i++) { s.update(STEP); hold(); if (fn()) return true; } return false; };
    let ok = true;
    if (name === 'bass-warn' || name === 'bass') { const q = L.subs[2]; park(q.s - 26, -q.sd * 0.3, 0, true); rivals([[18, 0.3, 0], [24, -0.3, 0], [-10, 0, 1]]); ok = wait(() => name === 'bass' ? q.live && q.R > 15 && q.R < 21 : q.tele > 0.65, 9); }
    else if (name === 'drone' || name === 'mine') { park(lp.S.chicane0 - 18, 0, 0, true); rivals([[-30, 0.3, 1]]); ok = wait(() => L.mines.some(m => m.live && (name === 'mine' ? m.landed && m.t > 0.3 : !m.landed && m.t > 0.45)), 9); }
    else if (name === 'conga') { park(L.conga.s - 24, -0.25, 0, true); rivals([[-40, 0, 1]]); ok = wait(() => L.conga.state === 'walk' && Math.abs(L.conga.head) < 4, 25); }
    else if (name === 'cannon-warn' || name === 'cannon' || name === 'blind') { const c = L.cannons[1]; park(c.s + (name === 'blind' ? 0 : -16), name === 'blind' ? 0 : -0.2, 0, true); rivals([[6, 0.3, 1], [10, -0.3, 1]]); ok = wait(() => name === 'cannon-warn' ? c.tele > 0.7 : name === 'cannon' ? s.time - c.fired < 0.2 && s.time - c.fired > 0.08 : L.blind > 1.2, 9); }
    else if (name === 'tunnel') { park(lp.S.tunnel - 30, 0, 20, false); rivals([[10, 0.3, 0], [16, -0.3, 0], [26, 0, 0]]); wait(() => false, 0.8); }
    else if (name === 'booths') { park(lp.S.chicane0 + 10, 0, 18, false); rivals([[10, 0.3, 0], [18, -0.3, 0]]); wait(() => false, 0.7); }
    s.snapCam = true; for (let i = 0; i < 4; i++) { D.step(1, 1); hold(); }
    return { ok, draws: s.stats.draws, tris: s.stats.tris, hits: (s.kit || {}).hits, p: [+P.x.toFixed(1), +P.z.toFixed(1), +P.loc.s.toFixed(1)], conga: [+L.conga.x.toFixed(1), +L.conga.z.toFixed(1), +L.conga.s.toFixed(1), +L.conga.head.toFixed(1), L.conga.state], sub2: [+L.subs[2].x.toFixed(1), +L.subs[2].z.toFixed(1), +L.subs[2].s.toFixed(1)] };
  };
  C.debug.level = () => { const s = Game.scene, K = s.kit || {}, L = s.lp; return { hits: K.hits || {}, touch: K.touch || {}, fired: K.fired || {}, L: s.T ? +s.T.L.toFixed(1) : 0, drones: L ? L.drones.map(d => ({ x: +d.x.toFixed(1), z: +d.z.toFixed(1), mode: d.mode })) : null, mines: L ? L.mines.filter(m => m.live).length : 0, conga: L ? { state: L.conga.state, head: +L.conga.head.toFixed(1) } : null, subsLive: L ? L.subs.filter(q => q.live).length : 0 }; };
}, 0);
