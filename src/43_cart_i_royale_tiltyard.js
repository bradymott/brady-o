/* ============================================================
   ART CART — royale arena: THE TILTYARD (id 'tiltyard', Sir Scorchalot's arena; level agent 'dragon', Nov 19 2026)
   A tournament ground on a summer afternoon inside a ring of castle walls. Down the middle run THE LISTS: a sand field
   with the TILT (a long painted fence) and grandstands on both sides; the ROYAL BOX at the south end, THE ROOST (a
   round tower with a live red dragon on top) at the north end; a ring of wall stretches and pavilions as cover; four
   catapults on the outer field.
   Its enemies (all telegraphed, all readable on a phone):
     · JOUSTING KNIGHTS: a red and a blue knight wait at the two ends of the tilt while their lanes flash with arrows
       (1.6 s), then charge down the lanes past each other, foam lances first: JOUSTED, 10 HP and a shove
     · FIREBALL CATAPULTS: a catapult cranks back (1.1 s) and lobs a fireball; a ring of fire marks the landing for the
       whole 1.5 s flight: 12 HP
     · THE ROOST DRAGON: picks a car within 62 m, an amber cone lights up on the ground and smoke curls from its nose
       (1.5 s), then it sweeps fire across the cone: 11 HP
   DRAGON FLIGHT (Sir Scorchalot's special) is in everyone's gift boxes here (arena levelCar → the scene's poolCar).
   Shares its castle kit with the career track DRAGON'S KEEP (43_cart_j_keep.js: DKP_KINDS, DkpMesh, dkpCatapult),
   used at run time only (that file loads after this one). Registers itself (see 43_cart_a_data.js, 43_cart_i_royale.js).
   ============================================================ */
const TYD = { R: 178, laneX: 4.6, lz: 62, roost: [0, 106], catR: 150, standX: 31, ring: 114 };
const TYD_C = { fire: [1, 0.55, 0.12], ember: [1, 0.32, 0.05], amber: [1, 0.66, 0.12], gold: [1, 0.82, 0.3], red: [0.95, 0.12, 0.18], blue: [0.25, 0.5, 1], white: [1, 1, 1], black: [0, 0, 0], smoke: [0.35, 0.3, 0.3] };
const TYD_T = { tip: [0, 0, 0], p: { x: 0, y: 0 } };
const TYD_CAT = { wind: 1.1, throw: 0.3, reload: 0.9, flight: 1.5, R: 4.2 };
const TYD_JOUST = { warn: 1.6, speed: 18, turn: 2.4 };
const TYD_DRAG = { warn: 1.5, breath: 1.4, range: 60, half: 0.55 };

/* ---------------- static pieces ---------------- */
// the tilt: a 2 x lz long painted fence down the middle of the lists (posts every 3 m, red / white boards, end poles)
function tydTilt(m) {
  const L = TYD.lz, wd = BURNS_ATLAS.pattern('wood');
  for (let z = -L; z <= L + 0.01; z += 3) { m.color('#4a3020'); m.roundBox(0, 0.8, z, 0.3, 1.6, 0.3, 0.05); m.color('#f2b630').shine(2); m.ball(0, 1.68, z, 0.16, { seg: 6, rings: 4 }); m.shine(0); }
  for (let z = -L, i = 0; z < L; z += 3, i++) { m.color(i % 2 ? '#c8102e' : '#ffffff').shine(1); m.roundBox(0, 1.2, z + 1.5, 0.16, 0.5, 3.02, 0.05); m.roundBox(0, 0.55, z + 1.5, 0.16, 0.4, 3.02, 0.05); m.shine(0); }
  m.color('#5a3a22'); m.roundBox(0, 1.52, 0, 0.26, 0.12, L * 2 + 0.3, 0.04, { uv: wd });
  for (const sd of [-1, 1]) { m.color('#ffffff'); m.cyl(0, 0, sd * (L + 1), 0.16, 0.12, 6.5, 8, { stripes: ['#ffffff', '#c8102e'] }); m.color(sd > 0 ? '#1e4ab8' : '#c8102e'); m.push(); m.tf(0, 5.8, sd * (L + 1), Math.PI / 2); m.extrude([[0, 0.5], [2.4, 0.2], [1.9, 0], [2.4, -0.2], [0, -0.5]], 0.05); m.pop(); m.color('#f2b630').shine(3); m.ball(0, 6.6, sd * (L + 1), 0.2, { seg: 6, rings: 4 }); m.shine(0); }
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.35, hz: L + 1.2, y0: 0, y1: 1.7 }] };
}
// THE ROOST: a round tower (door, slits, merlons, banners) with the dragon's body, folded wings and tail on top; the
// head and neck are pooled (they turn and breathe)
function tydRoost(m) {
  const H = 12, r = 7;
  m.color('#9a8f7c'); m.cyl(0, 0, 0, r + 0.6, r + 0.4, 1.4, 24);
  m.color('#c4b9a4'); m.cyl(0, 1.4, 0, r, r - 0.3, H - 1.4, 24);
  m.color('#a89d88'); for (const y of [4.5, 8.5]) m.cyl(0, y, 0, r - 0.1, r - 0.15, 0.3, 24);
  m.color('#d4c9b4'); m.cyl(0, H - 0.4, 0, r - 0.3, r + 0.4, 0.8, 24); m.cyl(0, H + 0.4, 0, r + 0.4, r + 0.4, 0.8, 24);
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; m.push(); m.tf(Math.sin(a) * (r + 0.1), H + 1.4, Math.cos(a) * (r + 0.1), a); m.box(0, 0, 0, 1.4, 1.2, 0.7); m.pop(); }
  m.color('#2a2020'); for (const a of [0.8, 2.3, 3.9, 5.4]) { m.push(); m.tf(Math.sin(a) * (r - 0.15), 7, Math.cos(a) * (r - 0.15), a); m.box(0, 0, 0, 0.4, 1.6, 0.2); m.pop(); }
  m.push(); m.tf(0, 0, -(r - 0.05), Math.PI); m.color('#4a3020'); m.box(0, 1.7, 0, 2.4, 3.4, 0.2); m.ball(0, 3.4, 0, 1.2, { seg: 10, rings: 4 }); m.pop();
  for (const a of [Math.PI - 0.7, Math.PI + 0.7]) { m.push(); m.tf(Math.sin(a) * (r + 0.02), 7.5, Math.cos(a) * (r + 0.02), a); m.color(a < Math.PI ? '#c8102e' : '#1e4ab8'); m.box(0, 0, 0, 2.0, 6, 0.08); m.color('#f2b630'); m.box(0, 1.8, 0.05, 2.05, 0.3, 0.04); m.extrude([[-1, -3], [1, -3], [0, -4]], 0.08); m.pop(); }
  // the dragon (deep red, gold belly): body, haunches, folded wings, the tail curling down the tower
  const Y = H + 0.8;
  m.color('#a8322a').shine(2); m.ellipsoid(0, Y + 2.4, 1.0, 3.4, 2.5, 5.0, { seg: 16, rings: 10 });
  m.color('#e8b84a'); m.ellipsoid(0, Y + 1.7, 2.2, 2.6, 1.6, 3.4, { seg: 12, rings: 7 });
  m.color('#a8322a'); for (const sd of [-1, 1]) { m.ellipsoid(sd * 2.8, Y + 1.6, -1.6, 1.4, 1.6, 2.0, { seg: 10, rings: 7 }); m.limb(sd * 2.4, Y + 1.8, 3.6, sd * 3.0, Y + 0.1, 5.4, 0.7, 0.5, { seg: 8 }); m.color('#efe2c0'); for (const cx of [-0.3, 0, 0.3]) m.limb(sd * 3.0 + cx, Y + 0.1, 5.7, sd * 3.0 + cx, Y - 0.6, 6.6, 0.12, 0.03, { seg: 4 }); m.color('#a8322a'); }
  m.color('#8a2620');
  for (const sd of [-1, 1]) { m.push(); m.tf(sd * 2.6, Y + 3.6, -0.5, -sd * 0.25, 0.15, sd * 0.35); const P = [[0, 0], [sd * 1.2, 3.0], [sd * 4.6, 2.4], [sd * 5.6, 0.6], [sd * 4.4, -1.4], [sd * 1.6, -2.2]]; m.extrude(sd > 0 ? P : P.slice().reverse(), 0.25, { convex: false }); m.color('#5a1a14'); m.limb(0, 0, 0, sd * 1.2, 3.0, 0, 0.3, 0.2, { seg: 6 }); m.limb(sd * 1.2, 3.0, 0, sd * 4.6, 2.4, 0, 0.2, 0.1, { seg: 5 }); m.color('#8a2620'); m.pop(); }
  m.color('#e8b84a'); for (let i = 0; i < 6; i++) { const z = -3.5 + i * 1.3; m.limb(0, Y + 4.6 - Math.abs(z - 0.5) * 0.15, z, 0, Y + 5.6 - Math.abs(z - 0.5) * 0.15, z - 0.4, 0.38, 0.04, { seg: 5 }); }
  const tail = [[0, Y + 2, -3.8], [-2.6, Y + 1.0, -6.0], [-5.6, Y - 0.2, -5.0], [-7.4, Y - 2.6, -2.0], [-7.6, Y - 5.4, 1.2], [-6.6, Y - 7.6, 3.6]], tr = [1.6, 1.25, 0.95, 0.7, 0.5, 0.3];
  m.color('#a8322a'); for (let i = 0; i < 5; i++) m.limb(tail[i][0], tail[i][1], tail[i][2], tail[i + 1][0], tail[i + 1][1], tail[i + 1][2], tr[i], tr[i + 1], { seg: 9 });
  m.color('#e8b84a').shine(3); m.push(); m.tf(-6.5, Y - 8.0, 4.0, 0.6, 0, 0.3); m.extrude([[0, 1.0], [0.8, -0.2], [0, -0.6], [-0.8, -0.2]], 0.25); m.pop(); m.shine(0);
  return { cols: [{ t: 'cyl', x: 0, z: 0, r: r + 0.8, y0: 0, y1: H + 8 }], lights: [{ x: 0, y: H + 3, z: 4, s: 3, c: '#ff8a2a' }] };
}
// the dragon's neck and head, pivoting at the neck's base (forward = +z): it turns to aim and breathes fire
function tydHead(m) {
  m.color('#a8322a').shine(2);
  m.limb(0, 0, 0, 0, 2.2, 1.6, 1.25, 1.0, { seg: 10 }); m.limb(0, 2.2, 1.6, 0, 3.2, 3.4, 1.0, 0.85, { seg: 10 });
  m.color('#e8b84a'); for (let i = 0; i < 4; i++) m.ellipsoid(0, 0.6 + i * 0.75, 1.0 + i * 0.6, 0.85, 0.32, 0.35, { seg: 8, rings: 4 });
  m.color('#a8322a'); m.ellipsoid(0, 3.5, 4.0, 1.25, 1.1, 1.6, { seg: 12, rings: 9 }); m.ellipsoid(0, 3.1, 5.6, 0.85, 0.7, 1.2, { seg: 10, rings: 7 });
  m.color('#e8b84a'); m.ellipsoid(0, 2.55, 5.1, 0.8, 0.32, 1.3, { seg: 9, rings: 5 });
  m.color('#efe2c0'); for (const sd of [-1, 1]) { m.limb(sd * 0.6, 4.4, 3.4, sd * 1.4, 5.8, 2.2, 0.28, 0.04, { seg: 6 }); m.limb(sd * 0.45, 2.75, 6.2, sd * 0.45, 2.35, 6.3, 0.09, 0.02, { seg: 4 }); }
  m.color('#e8b84a'); for (let i = 0; i < 3; i++) m.limb(0, 3.6 + i * 0.1 - (i ? 0 : 0), 0.6 + i * 1.1, 0, 4.4 + i * 0.05, 0.2 + i * 1.1, 0.3, 0.03, { seg: 5 });
  m.color('#1a1414'); for (const sd of [-1, 1]) m.ball(sd * 0.32, 3.3, 6.75, 0.13, { seg: 6, rings: 4 });
  m.color('#ffd020', 1); for (const sd of [-1, 1]) m.ellipsoid(sd * 0.82, 3.95, 4.7, 0.22, 0.17, 0.26, { seg: 8, rings: 5 }); m.emissive(0).shine(0);
}

/* ---------------- the world ---------------- */
CartWorlds.arena_tiltyard = function (A, night) {
  const S = TYD, E = this.base(2140, [-235, -235, 235, 235], '#5e9a3a', 0);
  const sky = Object.assign(CART_SKIES.day(), { hor: '#f4dcb8', sky: '#8cbcf0', zen: '#3a86e0', clouds: 0.62, mtnCol: '#5a7a6a', mtnH: 4.2, fogD: 0.0013, haze: 0.12, fogMax: 0.55, fog: '#c8dcec' });
  Object.assign(E, { id: 'tiltyard', arena: A, sky, tod: 'day', music: 'kart2', night: false, R: S.R });
  const api = E.api, rng = mulberry32(2140), ang = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];
  CartDecor.protos(E); CartKit.kinds(E, DKP_KINDS);
  const coverA = i => (i + 0.5) / 8 * TAU, catA = i => Math.PI / 4 + i * Math.PI / 2;
  // ---- ground paint: grass mottle and flowers, the sand of the lists, the riding lanes, dirt paths, painted shields ----
  api.paint((ctx, P, sc) => {
    // mown stripes across the whole field (light / dark bands), then the mottle
    for (let k = -24; k < 24; k++) { const q0 = P(k * 10, -260), q1 = P(k * 10, 260); ctx.strokeStyle = k % 2 ? 'rgba(150,200,80,0.28)' : 'rgba(40,90,30,0.22)'; ctx.lineWidth = 10 * sc; ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
    for (let i = 0; i < 300; i++) { const x = (rng() - 0.5) * 460, z = (rng() - 0.5) * 460, q = P(x, z); ctx.fillStyle = rng() < 0.5 ? `rgba(40,80,24,${0.14 + rng() * 0.16})` : `rgba(160,180,80,${0.1 + rng() * 0.12})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (3 + rng() * 12) * sc, (2 + rng() * 7) * sc, rng() * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 420; i++) { const x = (rng() - 0.5) * 440, z = (rng() - 0.5) * 440, q = P(x, z); ctx.fillStyle = ['rgba(255,236,90,0.85)', 'rgba(255,255,255,0.8)', 'rgba(235,90,180,0.75)', 'rgba(120,150,255,0.7)'][i % 4]; ctx.beginPath(); ctx.arc(q[0], q[1], (0.35 + (i % 3) * 0.15) * sc, 0, TAU); ctx.fill(); }
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = coverA(i) + TAU / 16, p0 = P(...ang(a, 52)), p1 = P(...ang(a, S.R - 6)); ctx.strokeStyle = 'rgba(176,130,78,0.75)'; ctx.lineWidth = 7 * sc; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
    const c0 = P(0, 0); ctx.fillStyle = 'rgba(214,184,128,0.95)'; ctx.beginPath(); ctx.ellipse(c0[0], c0[1], 44 * sc, 84 * sc, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 0.5 * sc; ctx.beginPath(); ctx.ellipse(c0[0], c0[1], 44.5 * sc, 84.5 * sc, 0, 0, TAU); ctx.stroke();
    for (const sd of [-1, 1]) { for (let z = -S.lz - 4; z < S.lz + 4; z += 2) { const q = P(sd * S.laneX, z); ctx.fillStyle = Math.floor(z / 2) % 2 ? 'rgba(236,212,160,0.8)' : 'rgba(226,198,146,0.8)'; ctx.fillRect(q[0] - 2.4 * sc, q[1] - 1 * sc, 4.8 * sc, 2 * sc); } const a = P(sd * (S.laneX + 2.6), -S.lz - 4), b = P(sd * (S.laneX + 2.6), S.lz + 4); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 0.3 * sc; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // big painted shields on the grass between the cover pieces
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + TAU / 16, q = P(...ang(a, i % 2 ? 150 : 88)), h = 7 * sc; ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(-a); ctx.fillStyle = (i >> 1) % 2 ? 'rgba(30,74,184,0.85)' : 'rgba(200,16,46,0.85)'; ctx.beginPath(); ctx.moveTo(-h, -h); ctx.lineTo(h, -h); ctx.lineTo(h, 0); ctx.quadraticCurveTo(h, h, 0, h * 1.5); ctx.quadraticCurveTo(-h, h, -h, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(242,182,48,0.95)'; ctx.fillRect(-h * 0.15, -h * 0.9, h * 0.3, h * 2); ctx.fillRect(-h * 0.8, -h * 0.35, h * 1.6, h * 0.3); ctx.restore(); }
  });
  // ---- THE LISTS: the tilt, grandstands both sides (with gaps to drive through), banners ----
  CartScene.mesh(api, 0, 0, 0, tydTilt, { hi: true });
  E.art.push({ x: 0, z: -S.lz * 0.5, r: 1.2 }, { x: 0, z: 0, r: 1.2 }, { x: 0, z: S.lz * 0.5, r: 1.2 });
  for (const sd of [-1, 1]) for (const z of [-34, 0, 34]) { const x = sd * S.standX, yaw = sd > 0 ? -Math.PI / 2 : Math.PI / 2; E.spots.push(...CartScene.bleachers(api, x, z, yaw, 20, 4, rng)); E.art.push({ x: x + sd * 2, z, r: 10.5 }); }
  for (const sd of [-1, 1]) for (let z = -48; z <= 48; z += 16) CartKit.put(E, 'dkp_banner', sd * (S.standX + 7), z, sd > 0 ? 0 : Math.PI, z % 32 ? '#f2b630' : (sd > 0 ? '#c8102e' : '#1e4ab8'));
  // ---- the ROYAL BOX at the south end ----
  { const z = -104; CartKit.put(E, 'dkp_tent', 0, z, 0, '#c8102e', { scale: 2.0 }); for (const sd of [-1, 1]) { CartKit.put(E, 'dkp_tent', sd * 12, z - 4, 0, sd > 0 ? '#1e4ab8' : '#f2b630', { scale: 1.2 }); CartKit.put(E, 'dkp_banner', sd * 7, z + 8, 0, '#c8102e'); }
    api.sign('THE ROYAL BOX', 0, z + 8.2, { yaw: 0, h: 1.4, y: 2.0, post: true, maxW: 6, style: { bg: '#5a1018', fg: '#ffe6a0', border: '#f2b630' } });
    E.art.push({ x: 0, z, r: 8 }, { x: -12, z: z - 4, r: 5 }, { x: 12, z: z - 4, r: 5 }); }
  // ---- THE ROOST at the north end ----
  CartScene.mesh(api, S.roost[0], S.roost[1], Math.PI, tydRoost, { hi: true });
  api.sign('THE ROOST\nKEEP BACK!', 0, S.roost[1] - 12, { yaw: 0, h: 1.2, y: 1.6, post: true, maxW: 3.6, style: { bg: '#f2e6c8', fg: '#8a1a14', border: '#8a1a14' } });
  E.art.push({ x: S.roost[0], z: S.roost[1], r: 8.5 });
  // ---- cover: a ring of wall stretches (with a tower) and pavilion clusters, with gaps between ----
  for (let i = 0; i < 8; i++) {
    const a = coverA(i), [cx, cz] = ang(a, S.ring);
    if (i % 2 === 0) { for (const k of [-1, 1]) { const b = a + k * 0.075, [x, z] = ang(b, S.ring); CartKit.put(E, 'dkp_wall', x, z, b + Math.PI / 2, '#ffffff'); E.art.push({ x, z, r: 6.2 }); } CartKit.put(E, 'dkp_tower', cx, cz, 0, '#ffffff'); E.art.push({ x: cx, z: cz, r: 4.6 }); }
    else { for (const k of [-1, 0, 1]) { const b = a + k * 0.09, [x, z] = ang(b, S.ring + (k ? 3 : -2)); CartKit.put(E, 'dkp_tent', x, z, b + Math.PI, DKP_HERALD[(i + k + 3) % DKP_HERALD.length]); E.art.push({ x, z, r: 4.2 }); } const [bx, bz] = ang(a, S.ring - 9); CartKit.put(E, 'dkp_banner', bx, bz, a, DKP_HERALD[i % DKP_HERALD.length]); }
  }
  // hay bale walls and the odd oak on the outer field
  for (let i = 0; i < 8; i++) { const a = coverA(i) + TAU / 16 + 0.18, [x, z] = ang(a, 138); CartKit.put(E, 'dkp_hay', x, z, a + Math.PI / 2, '#c8102e'); E.art.push({ x, z, r: 4 }); }
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5, [x, z] = ang(a, 164); CartKit.put(E, 'dkp_tree', x, z, a, ['#5f8a3a', '#4f7a34', '#6a9a40'][i % 3], { scale: 1.2 }); E.art.push({ x, z, r: 1.4 }); }
  // Nov 19 polish: more life on the open field: oaks between the cover, hay bales round the lists, herald banners on the outer ring
  for (let i = 0; i < 8; i++) { const a = coverA(i) + 0.2, r = 76 + (i % 2) * 8, [x, z] = ang(a, r); if (Math.abs(x) < S.standX + 12 && Math.abs(z) < 90) continue; CartKit.put(E, 'dkp_tree', x, z, a, ['#4f8a34', '#5f9a3a', '#3f7a2e'][i % 3], { scale: 1.0 + (i % 3) * 0.15 }); E.art.push({ x, z, r: 1.4 }); }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + TAU / 8, [x, z] = ang(a, 66); CartKit.put(E, 'dkp_hay', x, z, a, '#c8102e'); E.art.push({ x, z, r: 4 }); }
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * TAU, [x, z] = ang(a, S.R - 6); CartKit.put(E, 'dkp_banner', x, z, a + Math.PI, DKP_HERALD[i % DKP_HERALD.length]); }
  // ---- the four catapults on the outer field, facing in ----
  E.tydCats = []; for (let i = 0; i < 4; i++) { const a = catA(i), [x, z] = ang(a, S.catR); CartScene.mesh(api, x, z, a + Math.PI, dkpCatapult, { hi: true, scale: 1.4 }); E.tydCats.push({ x, z, yaw: a + Math.PI, a }); E.art.push({ x, z, r: 4 }); }
  // ---- the castle wall all round, towers, the countryside beyond ----
  const poly = []; for (let i = 0; i < 48; i++) { const a = i / 48 * TAU; poly.push([Math.sin(a) * S.R, Math.cos(a) * S.R]); }
  E.walls = poly;
  { const Rw = S.R + 3.2, n = Math.round(TAU * Rw / 12); for (let i = 0; i < n; i++) { const a = i / n * TAU, [x, z] = ang(a, Rw); if (i % 8 === 0) CartKit.put(E, 'dkp_tower', x, z, 0, '#ffffff'); else CartKit.put(E, 'dkp_wall', x, z, a + Math.PI / 2, '#ffffff'); } }
  for (let i = 0; i < 60; i++) { const a = rng() * TAU, r = S.R + 18 + rng() * 45, x = Math.sin(a) * r, z = Math.cos(a) * r; CartKit.put(E, i % 5 === 0 ? 'dkp_house' : 'dkp_tree', x, z, rng() * TAU, ['#5f8a3a', '#4f7a34', '#6a9a40', '#8a9a3a'][i % 4], { scale: 1 + rng() * 0.5 }); }
  E.heroes.push({ type: 'greeter_f', x: -4, z: -96, yaw: 0, anim: 'cheer' }, { type: 'burnermom', x: 4, z: -96, yaw: 0, anim: 'wave' }, { type: 'sparklepony', x: -24, z: 50, yaw: Math.PI / 2, anim: 'cheer' });
  // ---- royale spots ----
  for (const [x, z] of [[-17, -46], [17, -46], [-17, 46], [17, 46], [-S.laneX, -24], [S.laneX, 24]]) E.gifts.push({ x, z });   // two in the knights' lanes
  for (let i = 0; i < 8; i++) { const [x, z] = ang(coverA(i) + TAU / 16, 96); E.gifts.push({ x, z }); }
  for (let i = 0; i < 4; i++) { const [x, z] = ang(catA(i) + 0.25, 158); E.gifts.push({ x, z }); }
  const repairs = []; for (let i = 0; i < 8; i++) repairs.push(ang(coverA(i) + TAU / 16 - 0.12, 128));
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, [x, z] = ang(a, 145); E.spawn.push({ x, z, yaw: a + Math.PI / 2 }); }
  for (let i = 0; i < 40; i++) { const a = rng() * TAU, r = 30 + rng() * 135, x = Math.sin(a) * r, z = Math.cos(a) * r; if (Math.hypot(x - S.roost[0], z - S.roost[1]) < 14 || Math.abs(x) < 2) { i--; continue; } E.orbSpots.push({ x, z }); }
  E.zones = [{ x: 0, z: -70, r: 10, name: 'THE ROYAL BOX' }]; E.flagSpots = [{ x: 60, z: 0 }]; E.captures = [{ x: -60, z: 0, r: 9 }];
  E.royale = {
    R: S.R - 4, x: 0, z: 0, ends: [[0, -78], [78, 18], [-78, 18], [58, -64], [-58, -64]], repairs, storm: { name: 'DUST STORM', col: '#ffb870' },
    avoid: [[S.roost[0], S.roost[1], 26]],   // roaming AI keep clear of the dragon (hunting AI still go in)
    // a straight line through the tilt goes round its nearer end instead
    route(x0, z0, tx, tz, G) {
      if (x0 * tx >= 0 || Math.abs(x0) < 0.6) return false;
      const u = x0 / (x0 - tx), zc = lerp(z0, tz, u); if (Math.abs(zc) > TYD.lz + 2) return false;
      const ez = (Math.abs(z0) > TYD.lz - 6 ? z0 : zc) > 0 ? TYD.lz + 8 : -TYD.lz - 8;
      G[0] = x0 > 0 ? 5 : -5; G[1] = ez; return true;
    }
  };
  return this.finish(E);
};

/* ---------------- the arena's enemies: the knights, the catapults, the dragon ---------------- */
CART_ARENA_RULES.tiltyard = {
  music: 'kart2',
  onLoad(s) {
    const E = s.E;
    const G = CartKit.group(s, [['knights', DkpMesh.knight, 2], ['legs', DkpMesh.legs, 4], ['arms', DkpMesh.arm, 4], ['balls', DkpMesh.ball, 4], ['head', tydHead, 1]]);
    const D = s.tyd = { G, t: 0, knights: [], cats: [], balls: [], scorch: [], clash: -1, lastThrow: -9, bannerT: -9 };
    for (let i = 0; i < 2; i++) D.knights.push({ i, x: 0, z: 0, yaw: 0, dir: 1, lane: 0, st: 'warn', ph: 0, cyc: -1, mask: 0, rear: 0, run: 0, bob: 0, obj: G.knights[i], legs: [G.legs[i * 2], G.legs[i * 2 + 1]] });
    E.tydCats.forEach((c, i) => D.cats.push(Object.assign({}, c, { st: 'idle', t: 0, cool: 7 + i * 2.5, tgt: null, pitch: -1.25, obj: G.arms[i], ball: null })));
    for (let i = 0; i < 4; i++) D.balls.push({ live: false, held: null, t: 0, x: 0, y: 0, z: 0, x0: 0, y0: 0, z0: 0, x1: 0, z1: 0, obj: G.balls[i] });
    for (let i = 0; i < 6; i++) D.scorch.push({ t: 99, x: 0, z: 0 });
    D.drag = { st: 'idle', t: 0, cool: 9, yaw: Math.PI, a0: Math.PI, a1: Math.PI, mask: 0, tgt: null, obj: G.head[0], x: TYD.roost[0], z: TYD.roost[1], y: 12 + 0.8 + 3.0, warned: false };
  },
  onUpdate(s, dt, racing) {
    const D = s.tyd; if (!D) return;
    const live = racing && s.state === 'race' && !(s.obj && s.obj.ended);
    if (live) D.t += dt;
    tydKnights(s, D, dt, live); tydCatapults(s, D, dt, live); tydDragon(s, D, dt, live);
    for (const q of D.scorch) q.t += dt;
  },
  draw(s, R, Sp, t) { const D = s.tyd; if (D) tydDraw(s, D, R, Sp, t); },
  lights(s, add) {
    const D = s.tyd; if (!D) return;
    for (const b of D.balls) if (b.live) add(b.x, b.y, b.z, 12, TYD_C.fire, 1.6, 2);
    const g = D.drag; if (g.st === 'breath') { add(g.x + Math.sin(g.yaw) * 14, 3, g.z + Math.cos(g.yaw) * 14, 30, TYD_C.fire, 2.4, 2); add(g.x + Math.sin(g.yaw) * 40, 2, g.z + Math.cos(g.yaw) * 40, 30, TYD_C.fire, 2, 2); }
  },
  radar(s, ctx, P, sc) {
    const q = CART_ROY_T.p;
    P(0, -TYD.lz, q); const x0 = q.x, y0 = q.y; P(0, TYD.lz, q); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(q.x, q.y); ctx.stroke();
    P(TYD.roost[0], TYD.roost[1], q); ctx.fillStyle = 'rgba(255,90,40,0.9)'; ctx.beginPath(); ctx.arc(q.x, q.y, 3.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,80,0.85)'; for (const c of s.E.tydCats) { P(c.x, c.z, q); ctx.fillRect(q.x - 2, q.y - 2, 4, 4); }
    void sc;
  }
};
// ---- the knights: both wait at their ends (lanes lit), charge past each other down the two sides of the tilt, then
// ride round the tilt's end and turn to joust back the other way ----
function tydKnights(s, D, dt, live) {
  const J = TYD_JOUST, Lz = TYD.lz, ride = (2 * Lz) / J.speed, half = J.warn + ride + J.turn, P = half * 2;
  let mid = 0;
  for (const n of D.knights) {
    const tt = D.t + 2, ph = ((tt % P) + P) % P, cyc = Math.floor(tt / half), h = ph < half ? 0 : 1, q = ph - h * half;
    if (cyc !== n.cyc) { n.cyc = cyc; n.mask = 0; }
    n.ph = q;
    // red (0) rides +z on the +x lane in the first half; blue mirrors it; they swap lanes and directions each half
    const dir = (n.i === 0) === (h === 0) ? 1 : -1, lane = dir * TYD.laneX;
    let z, x = lane, yaw = dir > 0 ? 0 : Math.PI, run = 0;
    if (q < J.warn) { n.st = 'warn'; z = -dir * (Lz + 1); }
    else if (q < J.warn + ride) { if (n.st !== 'charge' && live) { if (s.player && Math.hypot(s.player.x, s.player.z) < 90) { cartIxSound(s, 'whistle', 0, 0, 0.7, 0.8); cartIxSound(s, 'crowd', 0, 0, 0.5, 1.1); } } n.st = 'charge'; z = -dir * (Lz + 1) + dir * (q - J.warn) * J.speed; run = 2; }
    else { n.st = 'turn'; const u = (q - J.warn - ride) / J.turn, e = BurnsM.smoothstep(0, 1, u); z = dir * (Lz + 1) + dir * Math.sin(e * Math.PI) * 6; x = lane * Math.cos(e * Math.PI); yaw = (dir > 0 ? 0 : Math.PI) + e * Math.PI * (dir > 0 ? 1 : -1) * (lane > 0 ? -1 : 1); run = 1; }
    n.x = x; n.z = z; n.yaw = yaw; n.dir = dir; n.lane = lane; n.run = run;
    n.rear = n.st === 'warn' && q > 0.3 ? Math.max(0, Math.sin((q - 0.3) / (J.warn - 0.3) * Math.PI)) : 0;
    if (n.st === 'charge' && Math.abs(z) < 2.5) mid++;
    if (live && n.st === 'charge') for (const k of s.karts) {
      if (k.out || (n.mask & (1 << k.slot)) || k.y > 3.5) continue;
      const ahead = (k.z - z) * dir; if (Math.abs(k.x - lane) > 2.5 || ahead < -2.2 || ahead > 5.6) continue;
      n.mask |= 1 << k.slot;
      if (s.hit(k, 'knock', null, { item: 'tyd_lance', dx: Math.sign(lane) * 0.9, dz: dir * 0.3, power: 11, dur: 1.0, banner: 'JOUSTED!' })) { cartIxSound(s, 'bump', k.x, k.z, 0.9, 1.2); if (s.fx) { s.fx.burst(k.x, k.y + 1.6, k.z, 'star', 10, '#ffe85a'); s.fx.burst(k.x, k.y + 1.4, k.z, 'puff', 8, '#fff4a0'); } }
    }
    // pose (shared with Dragon's Keep's knights)
    const sc = 1.3, gy = 0, stride = s.time * (run === 2 ? 11 : run === 1 ? 7 : 0);
    n.bob = run ? Math.abs(Math.sin(stride)) * (run === 2 ? 0.16 : 0.08) : 0;
    const o = n.obj; if (o) { o.live = true; o.visible = true; o.x = n.x; o.y = gy + n.bob + n.rear * 0.5; o.z = n.z; o.yaw = n.yaw; o.pitch = -n.rear * 0.45 + (run === 2 ? Math.sin(stride) * 0.04 : 0); o.roll = 0; o.scale = sc; }
    const fx = Math.sin(n.yaw), fz = Math.cos(n.yaw);
    n.legs.forEach((lg, j) => { if (!lg) return; const zz = (j ? -0.85 : 0.85) * sc, swing = run ? Math.sin(stride + j * Math.PI) * (run === 2 ? 0.7 : 0.4) : 0, rearUp = j === 0 ? n.rear * 0.9 : 0; lg.live = true; lg.visible = true; lg.x = n.x + fx * zz; lg.z = n.z + fz * zz; lg.y = gy + n.bob + 1.25 * sc + (j === 0 ? n.rear * 1.2 : n.rear * 0.1); lg.yaw = n.yaw; lg.pitch = swing - rearUp - n.rear * 0.45; lg.roll = 0; lg.scale = sc; });
  }
  // the lances clash as they pass: a burst of foam and sparkles, the crowd roars
  if (mid === 2 && s.time - D.clash > 2) { D.clash = s.time; if (s.fx) { s.fx.burst(0, 3.2, 0, 'star', 18, '#ffe85a'); s.fx.burst(0, 3.2, 0, 'puff', 12, '#fff4a0'); } if (s.player && Math.hypot(s.player.x, s.player.z) < 70) { cartIxSound(s, 'break', 0, 0, 0.6, 1.4); cartIxSound(s, 'crowd', 0, 0, 0.7, 1.2); } }
}
// the bucket of catapult c at arm pitch p (into TYD_T.tip)
function tydArmTip(c, p, sc) { const ly = -Math.sin(p) * 4.3 * sc, lz = Math.cos(p) * 4.3 * sc; TYD_T.tip[0] = c.x + Math.sin(c.yaw) * lz; TYD_T.tip[1] = 1.75 * sc + ly; TYD_T.tip[2] = c.z + Math.cos(c.yaw) * lz; return TYD_T.tip; }
// ---- the catapults: pick a car 30–135 m away, crank back, throw where it will be; a ring of fire marks the landing ----
function tydCatapults(s, D, dt, live) {
  const C = TYD_CAT, sc = 1.4, Rr = TYD.R - 8;
  for (const c of D.cats) {
    c.t += dt;
    if (c.st === 'idle') {
      c.pitch = approach(c.pitch, -1.25, 2 * dt); if (live) c.cool -= dt;
      if (live && c.cool <= 0 && s.time - D.lastThrow > 1.4) {
        let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.hidden || k.invT > 0.5) continue; const d = Math.hypot(k.x - c.x, k.z - c.z); if (d < 30 || d > 135) continue; if (D.cats.some(o => o !== c && o.tgt === k)) continue; const sc2 = Math.abs(d - 70) + s.rng() * 30; if (sc2 < bd) { bd = sc2; best = k; } }
        if (best) { c.st = 'wind'; c.t = 0; c.tgt = best; D.lastThrow = s.time; const b = D.balls.find(q => !q.live && !q.held); if (b) { b.held = c; c.ball = b; } if (s.player && Math.hypot(s.player.x - c.x, s.player.z - c.z) < 70) cartIxSound(s, 'pick', c.x, c.z, 0.6, 0.5); }
        else c.cool = 1;
      }
    } else if (c.st === 'wind') {
      c.pitch = lerp(-1.25, -2.85, BurnsM.smoothstep(0, 1, Math.min(1, c.t / C.wind)));
      if (c.t >= C.wind) {
        c.st = 'throw'; c.t = 0; const k = c.tgt, b = c.ball;
        if (b && k && !k.out) {
          const lead = C.flight + C.throw * 0.5; let x = k.x + k.vx * lead + (s.rng() - 0.5) * 3, z = k.z + k.vz * lead + (s.rng() - 0.5) * 3; const r = Math.hypot(x, z); if (r > Rr) { x *= Rr / r; z *= Rr / r; }
          tydArmTip(c, -1.4, sc); b.held = null; b.live = true; b.t = 0; b.x0 = TYD_T.tip[0]; b.y0 = TYD_T.tip[1]; b.z0 = TYD_T.tip[2]; b.x1 = x; b.z1 = z; b.x = b.x0; b.y = b.y0; b.z = b.z0;
          if (s.player && Math.hypot(s.player.x - c.x, s.player.z - c.z) < 90) { cartIxSound(s, 'throw', c.x, c.z, 0.9, 0.6); cartIxSound(s, 'flame', c.x, c.z, 0.5, 0.9); }
          if (k.player && s.time - D.bannerT > 3) { D.bannerT = s.time; s.banner('FIREBALL INCOMING!', '#ff8a2a', 0.9, 'steer off the ring of fire', true); }
        } else if (b) b.held = null;
        c.ball = null; c.tgt = null;
      }
    } else if (c.st === 'throw') { c.pitch = lerp(-2.85, -1.05, Math.min(1, c.t / C.throw)); if (c.t >= C.throw) { c.st = 'reload'; c.t = 0; } }
    else if (c.st === 'reload') { c.pitch = lerp(-1.05, -1.25, Math.min(1, c.t / C.reload)); if (c.t >= C.reload) { c.st = 'idle'; c.t = 0; c.cool = 6 + s.rng() * 4; } }
    const o = c.obj; if (o) { o.live = true; o.visible = true; o.x = c.x; o.y = 1.75 * sc; o.z = c.z; o.yaw = c.yaw; o.pitch = c.pitch; o.roll = 0; o.scale = sc; }
  }
  for (const b of D.balls) {
    const o = b.obj;
    if (b.held) { const c = b.held; tydArmTip(c, c.pitch, sc); b.x = TYD_T.tip[0]; b.y = TYD_T.tip[1] + 0.5; b.z = TYD_T.tip[2]; if (o) { o.live = true; o.visible = true; o.x = b.x; o.y = b.y; o.z = b.z; o.yaw = s.time * 3; o.pitch = 0; o.roll = 0; o.scale = 0.9 + Math.min(1, c.t / C.wind) * 0.5; } continue; }
    if (!b.live) { if (o) { o.live = false; o.visible = false; } continue; }
    b.t += dt; const u = Math.min(1, b.t / C.flight);
    b.x = lerp(b.x0, b.x1, u); b.z = lerp(b.z0, b.z1, u); b.y = lerp(b.y0, 0.6, u) + 64 * u * (1 - u) * 0.5;
    if (u >= 1) {
      b.live = false;
      if (live) for (const k of s.karts) { if (k.out || k.y > 2.5) continue; if (Math.hypot(k.x - b.x1, k.z - b.z1) < C.R) s.hit(k, 'spin', null, { item: 'tyd_fireball', dur: 1.0, banner: 'FIREBALL!' }); }
      const sq = D.scorch.reduce((a, q) => (q.t > a.t ? q : a)); sq.t = 0; sq.x = b.x1; sq.z = b.z1;
      const P = s.player, near = P && Math.hypot(P.x - b.x1, P.z - b.z1);
      if (near < 90) { cartIxSound(s, 'cartBoom', b.x1, b.z1, 0.9, 0.8); cartIxSound(s, 'flame', b.x1, b.z1, 0.6, 0.8); }
      if (near < 30) s.shakeIt(0.4);
      if (s.fx && near < 140) { s.fx.burst(b.x1, 0.8, b.z1, 'flame', 18, '#ff8a2a'); s.fx.spark(b.x1, 0.6, b.z1, 22, '#ffd060', 9); s.fx.smoke(b.x1, 1, b.z1, 8, '#4a3a34'); s.fx.ring(b.x1, 0.3, b.z1, 5, '#ff8a2a', 0.5); }
    }
    if (o) { o.live = true; o.visible = true; o.x = b.x; o.y = b.y; o.z = b.z; o.yaw = s.time * 5; o.pitch = s.time * 3; o.roll = 0; o.scale = 1.7; }
  }
}
// ---- the roost dragon: picks a car, an amber cone on the ground and smoke (warn), then a sweep of fire across it ----
function tydDragon(s, D, dt, live) {
  const g = D.drag, J = TYD_DRAG;
  g.t += dt;
  if (g.st === 'idle') {
    g.yaw = Math.PI + Math.sin(s.time * 0.35) * 0.6;
    if (live) g.cool -= dt;
    if (live && g.cool <= 0) {
      let best = null, bd = 1e9; for (const k of s.karts) { if (k.out || k.hidden) continue; const d = Math.hypot(k.x - g.x, k.z - g.z); if (d < 12 || d > J.range + 2) continue; const sc = d + s.rng() * 15; if (sc < bd) { bd = sc; best = k; } }
      if (best) { const a = Math.atan2(best.x - g.x, best.z - g.z), sd = s.rng() < 0.5 ? 1 : -1; g.a0 = a - sd * J.half; g.a1 = a + sd * J.half; g.st = 'warn'; g.t = 0; g.mask = 0; g.tgt = best; g.y0 = g.yaw; const P = s.player; if (P && !P.out && Math.hypot(P.x - g.x, P.z - g.z) < J.range + 10) { cartIxSound(s, 'flame', g.x, g.z, 0.7, 0.45); if (s.time - D.bannerT > 3) { D.bannerT = s.time; s.banner('DRAGON\'S BREATH!', '#ffb02a', 1.3, 'get out of the amber cone', true); } } }
      else g.cool = 1.2;
    }
  } else if (g.st === 'warn') {
    g.yaw = g.y0 + cartWrap(g.a0 - g.y0) * BurnsM.smoothstep(0, 1, Math.min(1, g.t / 0.8));
    if (g.t >= J.warn) { g.st = 'breath'; g.t = 0; const P = s.player, d = P ? Math.hypot(P.x - g.x, P.z - g.z) : 999; if (d < J.range + 30) { cartIxSound(s, 'flame', g.x, g.z, 1.0, 0.55); cartIxSound(s, 'cartBoom', g.x, g.z, 0.5, 0.5); } if (d < J.range + 5) s.shakeIt(0.5); }
  } else if (g.st === 'breath') {
    const u = Math.min(1, g.t / J.breath); g.yaw = g.a0 + cartWrap(g.a1 - g.a0) * u;
    if (live) for (const k of s.karts) {
      if (k.out || (g.mask & (1 << k.slot)) || k.y > 6) continue;
      const dx = k.x - g.x, dz = k.z - g.z, d = Math.hypot(dx, dz); if (d < 7 || d > J.range) continue;
      if (Math.abs(cartWrap(Math.atan2(dx, dz) - g.yaw)) > 0.1 + 1.6 / d) continue;
      g.mask |= 1 << k.slot;
      if (s.hit(k, 'spin', null, { item: 'tyd_breath', dur: 1.0, banner: 'DRAGON FIRE!' }) && s.fx) s.fx.burst(k.x, k.y + 1, k.z, 'flame', 12, '#ff8a2a');
    }
    if (g.t >= J.breath) { g.st = 'idle'; g.t = 0; g.cool = 6 + s.rng() * 4; g.tgt = null; }
  }
  const o = g.obj; if (o) { o.live = true; o.visible = true; o.x = g.x; o.y = g.y; o.z = g.z - 2.6; o.yaw = g.yaw; o.pitch = g.st === 'breath' ? 0.32 : g.st === 'warn' ? 0.18 : 0.05 + Math.sin(s.time * 0.8) * 0.05; o.roll = 0; o.scale = 1.3; }
}
// ---- sprites ----
function tydDraw(s, D, R, Sp, t) {
  const C = TYD_C;
  for (const n of D.knights) {
    if (n.st === 'warn' || n.st === 'charge') {
      // the lane he rides: arrows in his colour from him to the far end, a glow over his plume
      const col = n.i ? C.blue : C.red, fl = 0.45 + 0.55 * Math.max(0, Math.sin(t * 14)), a = n.st === 'warn' ? Math.min(1, n.ph / 0.4) : 0.7;
      for (let z = n.z + n.dir * 4; Math.abs(z) < TYD.lz + 1; z += n.dir * 6) R.flat.flat(n.lane, 0.08, z, 3.6, 3.6, n.dir > 0 ? 0 : Math.PI, Sp.arrow, col, 0.85 * a * fl, true);
      R.bbs.bb(n.x, 6.2, n.z, 3.4, 3.4, Sp.glow, col, 0.5 + 0.3 * fl, true);
      if (n.st === 'charge' && s.fx && Math.random() < 0.5) s.fx.dust(n.x, 0.3, n.z, 2, '#c8a878');
    }
  }
  for (const b of D.balls) {
    if (b.held) { R.bbs.bb(b.x, b.y, b.z, 2.8, 2.8, Sp.glow, C.fire, 0.7, true); if (s.fx && Math.random() < 0.5) s.fx.fire(b.x, b.y, b.z, 0.8); continue; }
    if (!b.live) continue;
    const u = Math.min(1, b.t / TYD_CAT.flight), bl = 0.55 + 0.45 * Math.sin(t * (14 + u * 20)), r0 = TYD_CAT.R * 2;
    R.flat.flat(b.x1, 0.12, b.z1, r0 * (1.5 - u * 0.5), r0 * (1.5 - u * 0.5), t * 2, Sp.ring, C.fire, 0.95 * bl, true);
    R.flat.flat(b.x1, 0.13, b.z1, r0, r0, 0, Sp.glow, C.ember, 0.35 + 0.3 * u, true);
    R.flat.flat(b.x1, 0.1, b.z1, 1 + u * 4, 1 + u * 4, 0, Sp.shadow, C.black, 0.25 + u * 0.45, false);
    R.bbs.bb(b.x, b.y, b.z, 4.8, 4.8, Sp.glow, C.fire, 0.8, true);
    if (s.fx) { s.fx.fire(b.x, b.y, b.z, 1.3); if (Math.random() < 0.4) s.fx.smoke(b.x, b.y, b.z, 1, '#5a4a44'); }
  }
  for (const q of D.scorch) {
    if (q.t > 4) continue; const a = 1 - q.t / 4;
    R.flat.flat(q.x, 0.09, q.z, 8.4, 8.4, 0, Sp.shadow, C.black, 0.6 * a, false);
    if (q.t < 1.6) for (let i = 0; i < 5; i++) { const an = i * 1.26 + q.x, r = 1.4 + (i % 2) * 1.1, h = (1.5 + Math.sin(t * 9 + i) * 0.3) * (1 - q.t / 1.6); R.bbs.bb(q.x + Math.sin(an) * r, h * 0.5, q.z + Math.cos(an) * r, 1.3 * h, 1.7 * h, Sp.flame, C.fire, 0.9, true); }
  }
  // the dragon: smoke from its nose while it idles and warns; the amber cone; the fire
  const g = D.drag, J = TYD_DRAG, hx = g.x + Math.sin(g.yaw) * 8.6, hz = g.z - 2.6 + Math.cos(g.yaw) * 8.6, hy = g.y + 4.0;
  if (s.fx && Math.random() < (g.st === 'warn' ? 0.6 : 0.06)) s.fx.smoke(hx, hy + 0.6, hz, 1, g.st === 'warn' ? '#6a5a50' : '#a8a0a0');
  if (g.st === 'warn') {
    const fl = 0.4 + 0.6 * Math.max(0, Math.sin(t * 16)), a = Math.min(1, g.t / 0.5), span = cartWrap(g.a1 - g.a0);
    for (let i = 0; i <= 8; i++) { const an = g.a0 + span * i / 8; for (let r = 10; r < J.range; r += 6) { const w = r * Math.abs(span) / 8 + 1; R.flat.flat(g.x + Math.sin(an) * r, 0.1, g.z + Math.cos(an) * r, w, 6, an, Sp.square, C.amber, 0.16 * a * fl, true); } }
    for (const an of [g.a0, g.a1]) R.flat.flat(g.x + Math.sin(an) * J.range / 2, 0.11, g.z + Math.cos(an) * J.range / 2, 0.6, J.range - 8, an, Sp.square, C.amber, 0.85 * a * fl, true);
    R.bbs.bb(hx, hy, hz, 3 + g.t * 2, 3 + g.t * 2, Sp.glow, C.fire, 0.3 + 0.4 * (g.t / J.warn), true);
  } else if (g.st === 'breath') {
    const fx = Math.sin(g.yaw), fz = Math.cos(g.yaw);
    // the jet: a thick roaring cone of flame from the jaws down to the ground, glowing round it, white-hot in the throat
    for (let i = 1; i <= 18; i++) {
      const u = i / 18, r = 6 + u * (J.range - 6), y = lerp(hy, 1.6, Math.min(1, u * 1.5)), w = 3 + u * 10, f = 0.8 + 0.25 * Math.sin(t * 30 + i * 1.7), jx = Math.sin(t * 23 + i) * 0.5 * w * 0.2, x = g.x + fx * r - fz * jx, z = g.z + fz * r + fx * jx;
      R.bbs.bb(x, y, z, w * 2.0, w * 2.0, Sp.glow, C.ember, 0.4, true);
      R.bbs.bb(x, y + w * 0.15, z, w * f, w * 1.3 * f, Sp.flame, i % 3 ? C.fire : C.gold, 0.95, true);
      if (i < 10) R.bbs.bb(x, y, z, w * 0.45, w * 0.6, Sp.flame, C.gold, 1, true);
    }
    // the swept ground burns behind the jet: a fan of flames over the part of the cone already swept, dying down
    const span = cartWrap(g.yaw - g.a0), n = Math.max(1, Math.ceil(Math.abs(span) / 0.09));
    for (let j = 0; j < n; j++) {
      const an = g.a0 + span * j / n, al = 0.35 + 0.6 * j / n, sa = Math.sin(an), ca = Math.cos(an);
      for (let r = 12; r < J.range; r += 7) { const h = (2.2 + ((r * 7 + j * 13) % 5) * 0.45) * (0.85 + 0.15 * Math.sin(t * 11 + r + j)); R.bbs.bb(g.x + sa * r, h * 0.45, g.z + ca * r, h * 0.9, h * 1.4, Sp.flame, (j + r) % 2 ? C.fire : C.gold, al, true); }
      R.flat.flat(g.x + sa * J.range * 0.55, 0.11, g.z + ca * J.range * 0.55, 6, J.range * 0.9, an, Sp.glow, C.ember, 0.3 * al, true);
    }
    for (let r = 10; r < J.range; r += 8) R.flat.flat(g.x + fx * r, 0.12, g.z + fz * r, 6 + r * 0.16, 9, g.yaw, Sp.glow, C.fire, 0.75, true);
    if (s.fx && Math.random() < 0.6) { const r = 8 + Math.random() * (J.range - 8); s.fx.spark(g.x + fx * r, 1.5, g.z + fz * r, 3, '#ffd060', 7); }
    if (s.fx && Math.random() < 0.8) { const r = 10 + Math.random() * (J.range - 10); s.fx.fire(g.x + fx * r, 0.6, g.z + fz * r, 1.6); }
  }
}

/* ---------------- the registry ---------------- */
CART_ARENAS.push({
  id: 'tiltyard', name: 'THE TILTYARD', sub: 'Battle royale: jousting knights, fireball catapults, a dragon on its roost', objectives: ['royale'], royale: true, levelCar: 'dragon',
  col: '#c8102e', tod: 'day', blurb: 'Sir Scorchalot\'s tournament ground. Keep out of the knights\' lanes, off the rings of fire and out of the dragon\'s amber cone. Last car running wins.'
});
CART_ROYALE_ARENAS.dragon = 'tiltyard';
CART_ARENA_ICONS.tiltyard = (ctx, s, t, col) => {
  // a heraldic shield with two crossed lances and a flame
  const b = 1 + Math.pow(Math.max(0, Math.sin(t * 3)), 6) * 0.08;
  ctx.save(); ctx.scale(b, b);
  ctx.fillStyle = '#f2e6c8'; ctx.strokeStyle = col; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-s * 0.62, -s * 0.7); ctx.lineTo(s * 0.62, -s * 0.7); ctx.lineTo(s * 0.62, 0); ctx.quadraticCurveTo(s * 0.6, s * 0.6, 0, s * 0.85); ctx.quadraticCurveTo(-s * 0.6, s * 0.6, -s * 0.62, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  for (const sd of [-1, 1]) { ctx.strokeStyle = sd > 0 ? '#1e4ab8' : col; ctx.lineWidth = s * 0.1; ctx.beginPath(); ctx.moveTo(sd * -s * 0.5, s * 0.5); ctx.lineTo(sd * s * 0.45, -s * 0.55); ctx.stroke(); ctx.fillStyle = '#ffe85a'; ctx.beginPath(); ctx.arc(sd * s * 0.47, -s * 0.58, s * 0.1, 0, TAU); ctx.fill(); }
  const f = 0.85 + 0.15 * Math.sin(t * 9);
  ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(0, s * 0.45); ctx.quadraticCurveTo(-s * 0.22, s * 0.2, 0, -s * 0.2 * f); ctx.quadraticCurveTo(s * 0.22, s * 0.2, 0, s * 0.45); ctx.fill();
  ctx.restore();
};
