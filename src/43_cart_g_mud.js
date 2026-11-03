/* ============================================================
   ART CART — arena: MUD YEAR (id 'mud')
   The rain-year playa: a sea of slippery mud, puddles, plywood boardwalks
   and stuck vehicles. Deep-mud patches bog cars down, boardwalks are the
   fast grippy lanes, puddles splash and dazzle whoever is downwind.
   Powers: MONSTER TIRES (mud immunity + ram), MUD BLASTER (a cone of mud),
   TOW ROPE (hook the car ahead and yank it behind you).
   Objective: MUD RESCUE (pull stuck burners out: stop beside them for 2 s).
   Everything here is an original design; affectionate playa satire.
   ============================================================ */

/* ---------------- geometry helpers (mud, boards, puddles) ---------------- */
// closest point on a boardwalk segment; returns the squared distance and fills out = [x, z, t]
function cartMudSegPt(b, x, z, out) {
  const dx = b.x1 - b.x0, dz = b.z1 - b.z0, L2 = dx * dx + dz * dz || 1;
  const t = clamp(((x - b.x0) * dx + (z - b.z0) * dz) / L2, 0, 1), px = b.x0 + dx * t, pz = b.z0 + dz * t;
  if (out) { out[0] = px; out[1] = pz; out[2] = t; }
  return (x - px) * (x - px) + (z - pz) * (z - pz);
}
// the boardwalk under (x, z), or null
function cartMudBoard(E, x, z) {
  if (!E || !E.boards) return null;
  for (const b of E.boards) { const hw = b.w / 2; if (x < b.bx0 - hw || x > b.bx1 + hw || z < b.bz0 - hw || z > b.bz1 + hw) continue; if (cartMudSegPt(b, x, z) < hw * hw) return b; }
  return null;
}
// the deep-mud patch under (x, z) (boards cross the mud, so a board wins), or null
function cartMudZone(E, x, z) {
  if (!E || !E.mud) return null;
  for (const m of E.mud) { const dx = x - m.x, dz = z - m.z; if (dx * dx + dz * dz < m.r * m.r) return cartMudBoard(E, x, z) ? null : m; }
  return null;
}
function cartMudPuddle(E, x, z) {
  if (!E || !E.puddles) return null;
  for (const p of E.puddles) { const dx = x - p.x, dz = z - p.z; if (dx * dx + dz * dz < p.r * p.r) return p; }
  return null;
}
// how much deep mud a straight line crosses (metres, sampled)
function cartMudAlong(E, ax, az, bx, bz) {
  const L = Math.hypot(bx - ax, bz - az), n = Math.min(24, Math.ceil(L / 4)); if (n <= 0) return 0;
  let bad = 0;
  for (let i = 1; i <= n; i++) { const u = i / n; if (cartMudZone(E, lerp(ax, bx, u), lerp(az, bz, u))) bad += L / n; }
  return bad;
}
// the nearest point on the boardwalk network
function cartMudNearestBoard(E, x, z, out) {
  let bd = 1e18; const p = [0, 0, 0];
  for (const b of E.boards) { const d = cartMudSegPt(b, x, z, p); if (d < bd) { bd = d; out[0] = p[0]; out[1] = p[1]; out.b = b; } }
  return Math.sqrt(bd);
}
// re-route a goal via the boardwalks when the straight line would bog the car down
function cartMudRoute(s, k, gx, gz) {
  const E = s.E; if (!E || !E.mud || !E.boards || !E.boards.length || k.tiresT > 0) return [gx, gz];
  const dist = Math.hypot(gx - k.x, gz - k.z), tmp = [0, 0];
  if (cartMudZone(E, k.x, k.z)) {   // bogged: the shortest way to planks (unless the goal is right here)
    const d = cartMudNearestBoard(E, k.x, k.z, tmp);
    if (dist < 10 || d > dist) return [gx, gz];
    return [tmp[0], tmp[1]];
  }
  const direct = cartMudAlong(E, k.x, k.z, gx, gz);
  if (direct < 6) return [gx, gz];
  // via a boardwalk: reach it, ride it toward the goal, leave it as late as possible
  let best = null, bc = direct * 2.2 + dist;
  const pk = [0, 0, 0], pg = [0, 0, 0];
  for (const b of E.boards) {
    const dk = Math.sqrt(cartMudSegPt(b, k.x, k.z, pk)), dg = Math.sqrt(cartMudSegPt(b, gx, gz, pg));
    const legA = dk + cartMudAlong(E, k.x, k.z, pk[0], pk[1]) * 2.2, legC = dg + cartMudAlong(E, pg[0], pg[1], gx, gz) * 2.2;
    const cost = legA + Math.hypot(pg[0] - pk[0], pg[1] - pk[1]) * 0.85 + legC;
    if (cost < bc) { bc = cost; best = { b, kx: pk[0], kz: pk[1], dk, gx: pg[0], gz: pg[1], dg }; }
  }
  if (!best) return [gx, gz];
  if (best.dk > 4.5) return [best.kx, best.kz];
  if (best.dg < 4) return [gx, gz];
  return [best.gx, best.gz];
}

/* ---------------- the arena: registration ---------------- */
CART_ARENAS.push({
  id: 'mud', name: 'MUD YEAR', sub: 'Rain year: mud, puddles, plywood boardwalks and stuck RVs',
  objectives: ['rescue', 'vibe', 'hill', 'flag', 'glow'], col: '#a07a4a', tod: 'dust',
  powers: ['tires', 'mudblast', 'towrope'],
  blurb: 'It rained. The playa is soup. Stick to the plywood or get stuck with everybody else.'
});

CartWorlds.arena_mud = function (A, night) {
  const E = this.base(2007, [-150, -130, 150, 130], '#5c4432', 0.05);
  const sky = Object.assign({}, BURNS_PALETTES.day, {
    zen: '#6a7482', hor: '#b8b6b0', sky: '#9aa2ac', fog: '#b8b0a8', fogD: 0.01, fogH: 0.05, haze: 0.5, fogMax: 0.93,
    clouds: 0.95, cloudCol: '#8a9098', cloudScale: 0.8, cloudSpeed: 0.03, sun: [150, 40], sunCol: '#c8c8c8', sunSize: 0.0004,
    key: '#c4cad4', keyK: 0.5, rim: '#d8dce4', mid: '#88909a', midK: 0.3, gnd: '#6a5a48', mtnCol: '#7a7a82', emB: 1.2, dust: 0
  });
  Object.assign(E, { id: 'mud', arena: A, sky, tod: 'dust', music: 'kart1', night: false, rain: true });
  const api = E.api, T = E.terrain, rng = mulberry32(2024);
  /* ---- the layout: a plank cross through the middle, an octagon ring, spurs to four landmarks ---- */
  const R8 = 80, oct = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; oct.push([Math.cos(a) * R8, Math.sin(a) * R8]); }
  const LM = { tow: [-98, -80], camp: [98, -74], closed: [-100, 82], pier: [100, 84] };
  const segs = [[-126, 0, -18, 0], [18, 0, 126, 0], [0, -108, 0, -18], [0, 18, 0, 108]];
  for (let i = 0; i < 8; i++) { const a = oct[i], b = oct[(i + 1) % 8]; segs.push([a[0], a[1], b[0], b[1]]); }
  segs.push([oct[5][0], oct[5][1], LM.tow[0], LM.tow[1]], [oct[7][0], oct[7][1], LM.camp[0], LM.camp[1]], [oct[3][0], oct[3][1], LM.closed[0], LM.closed[1]], [oct[1][0], oct[1][1], LM.pier[0], LM.pier[1]]);
  E.boards = segs.map(([x0, z0, x1, z1]) => ({ x0, z0, x1, z1, w: 6, bx0: Math.min(x0, x1), bx1: Math.max(x0, x1), bz0: Math.min(z0, z1), bz1: Math.max(z0, z1) }));
  // deep mud: a bog ring around the island, four quadrant bogs, outer pits, a pit by every landmark
  E.mud = [];
  for (let i = 0; i < 8; i++) { const a = (i + 0.5) / 8 * TAU; E.mud.push({ x: Math.cos(a) * 28, z: Math.sin(a) * 28, r: 12.5 }); }
  for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) E.mud.push({ x: sx * 46, z: sz * 46, r: 16 });
  for (const [x, z] of [[115, 32], [115, -32], [-115, 32], [-115, -32], [32, 112], [-32, 112], [32, -112], [-32, -112]]) E.mud.push({ x, z, r: 12 });
  E.mud.push({ x: -78, z: -104, r: 11 }, { x: 122, z: -102, r: 10 }, { x: -124, z: 104, r: 10 }, { x: 124, z: 106, r: 10 });
  // puddles (reflective, splashy)
  E.puddles = [[-70, 18, 6], [72, -20, 6], [-20, 68, 5], [22, -66, 5], [-98, -40, 5.5], [96, 42, 5], [-40, 96, 5], [60, 100, 5.5], [104, -8, 4.5], [-106, 8, 4.5], [8, -92, 4.5], [-8, 92, 4.5], [-60, -24, 5], [58, 26, 5], [-88, 60, 4.5], [86, -58, 4.5]].map(([x, z, r]) => ({ x, z, r, a: rng() * 3 }));
  // stuck-burner spots (the MUD RESCUE objective): the middle of every big pit
  E.rescueSpots = E.mud.slice(8).map(m => ({ x: m.x, z: m.z }));
  /* ---- ground paint: mud patches, ruts, puddles ---- */
  api.paint((ctx, P, S) => {
    for (const m of E.mud) { const q = P(m.x, m.z), g = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], m.r * S); g.addColorStop(0, 'rgba(34,20,12,0.96)'); g.addColorStop(0.75, 'rgba(40,24,14,0.9)'); g.addColorStop(1, 'rgba(60,40,26,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], m.r * S, 0, TAU); ctx.fill(); }
    // tyre ruts through the mud and around the pits
    ctx.lineCap = 'round'; ctx.strokeStyle = 'rgba(40,24,14,0.35)'; ctx.lineWidth = 0.45 * S;
    for (let i = 0; i < 70; i++) { const x = (rng() - 0.5) * 270, z = (rng() - 0.5) * 230, a = rng() * TAU, L = 8 + rng() * 22; for (const o of [-0.9, 0.9]) { const a0 = P(x + Math.cos(a + Math.PI / 2) * o, z + Math.sin(a + Math.PI / 2) * o), a1 = P(x + Math.cos(a) * L + Math.cos(a + Math.PI / 2) * o, z + Math.sin(a) * L + Math.sin(a + Math.PI / 2) * o); ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.quadraticCurveTo((a0[0] + a1[0]) / 2 + (rng() - 0.5) * 3 * S, (a0[1] + a1[1]) / 2 + (rng() - 0.5) * 3 * S, a1[0], a1[1]); ctx.stroke(); } }
    // wet sheen blotches
    for (let i = 0; i < 160; i++) { const x = (rng() - 0.5) * 280, z = (rng() - 0.5) * 240, q = P(x, z); ctx.fillStyle = `rgba(${rng() < 0.5 ? '50,34,24' : '150,140,130'},${0.05 + rng() * 0.08})`; ctx.beginPath(); ctx.ellipse(q[0], q[1], (2 + rng() * 7) * S, (1 + rng() * 3) * S, rng() * 3, 0, TAU); ctx.fill(); }
    for (const p of E.puddles) { const q = P(p.x, p.z); ctx.fillStyle = 'rgba(48,34,26,0.7)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], (p.r + 0.6) * S, (p.r * 0.8 + 0.6) * S, p.a, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(150,172,196,0.85)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], p.r * S, p.r * 0.8 * S, p.a, 0, TAU); ctx.fill(); }
  });
  /* ---- boardwalks: tan planks on joists, a low terrain feature so cars ride on them (grippy, no dust) ---- */
  for (const b of E.boards) {
    const L = Math.hypot(b.x1 - b.x0, b.z1 - b.z0), yaw = Math.atan2(b.x1 - b.x0, b.z1 - b.z0), cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, w = b.w;
    T.add(Object.assign({ x0: b.bx0 - w / 2 - 1, z0: b.bz0 - w / 2 - 1, x1: b.bx1 + w / 2 + 1, z1: b.bz1 + w / 2 + 1 }, { kind: 'concrete', noMesh: true, h(x, z) { return cartMudSegPt(b, x, z) < (w / 2) * (w / 2) ? 0.03 : 0; } }));
    CartScene.mesh(api, cx, cz, yaw, m => {
      const wd = BURNS_ATLAS.pattern('wood');
      m.color('#5a4028'); m.box(w / 2 - 0.5, 0.02, 0, 0.2, 0.04, L); m.box(-w / 2 + 0.5, 0.02, 0, 0.2, 0.04, L);
      for (let u = -L / 2 + 0.3; u < L / 2 - 0.2; u += 0.72) { const t = rng(); m.color(t < 0.5 ? '#c8a470' : t < 0.8 ? '#b8945e' : '#a88454'); m.box((rng() - 0.5) * 0.12, 0.035, u, w + (rng() - 0.5) * 0.2, 0.05, 0.55, { uv: wd, uvFaces: ['py'] }); }
    }, { noAO: true });
  }
  /* ---- terrain: the island, puddle-jumping mounds, two kickers ---- */
  T.add(CartFeat.mound(0, 0, 16, 2.4, { col: '#8a6a48' }));
  for (const [x, z] of [[-70, 10], [72, -12], [-12, 68], [14, -66], [-98, -32], [96, 50], [-48, 96], [66, 100]]) T.add(CartFeat.mound(x, z, 7, 1.3, { col: '#8a6a48' }));
  T.add(CartFeat.ramp(-60, 40, Math.PI * 0.75, 6, 7, 1.9, { col: '#6a4a32', stripe: '#ffe24a' }));
  T.add(CartFeat.ramp(62, -40, -Math.PI * 0.25, 6, 7, 1.9, { col: '#6a4a32', stripe: '#38f2ff' }));
  /* ---- landmarks ---- */
  const stuck = (kind, x, z, yaw, pitch, roll, o) => {   // a vehicle sunk and tilted in the mud, a crust of mud around its wheels
    CartScene.mesh(api, x, z, yaw, m => { m.push(); m.tf(0, -0.3, 0, 0, pitch, roll); const r = BurnsProps[kind].call(BurnsProps, m, Object.assign({ seed: Math.floor(rng() * 999) }, o || {})); m.color('#3e2a1a'); m.roundBox(0, 0.42, 0, (r.w || 2.5) + 0.3, 0.5, (r.len || 9) - 1.2, 0.18); m.pop(); return r; }, { hi: true });
    E.art.push({ x, z, r: (o && o.r) || 5 });
  };
  // THE TOW YARD: a tow truck with a rope to a sunk RV, a stuck bus, three burners pushing a car
  { const [x, z] = LM.tow;
    stuck('rv', x - 10, z - 16, 0.6, 0.12, 0.22, { r: 5 });
    stuck('bus', x + 14, z - 12, -0.9, -0.1, -0.2, { r: 6 });
    CartScene.prop(api, 'boxtruck', { x: x - 2, z: z + 4, yaw: 2.6, seed: 5, hi: true }); E.art.push({ x: x - 2, z: z + 4, r: 4.5 });
    CartScene.mesh(api, x - 6, z - 6, 0, m => { m.color('#d8c090'); m.limb(4.5, 1.1, 8.5, -4, 0.9, -8, 0.05, 0.05, { seg: 5 }); }, { noAO: true, hi: true });
    stuck('car', x + 4, z + 20, 2.9, 0.2, 0.1, { r: 3 });
    E.heroes.push({ type: 'dpw', x: x + 2, z: z + 23.5, yaw: 2.9, anim: 'charge' }, { type: 'badideaguy', x: x + 4.6, z: z + 24, yaw: 2.9, anim: 'charge' }, { type: 'crusty', x: x + 7.6, z: z + 20, yaw: -0.6, anim: 'yell' });
    api.sign('TOW YARD\nWAIT: 6 HRS', x + 10, z - 2, { yaw: 2.2, h: 0.9, y: 1.6, post: true, maxW: 3.2, style: { bg: '#2a2a30', fg: '#ffe24a', border: '#ffe24a' } });
    for (let i = 0; i < 3; i++) CartScene.prop(api, 'barrel', { x: x - 14 + i * 3, z: z + 10 });
  }
  // CAMP SOGGY BOTTOM: a camp under dripping tarps, couches on pallets, a sunk camper
  { const [x, z] = LM.camp;
    CartScene.camp(api, x + 4, z - 12, Math.PI, rng, false, 4);
    for (const [tx, tz, ty] of [[x - 12, z + 4, 0.1], [x + 14, z + 6, -0.15], [x - 4, z + 14, 0.2]]) CartScene.mesh(api, tx, tz, ty, m => {
      m.color('#2a56c8'); m.push(); m.tf(0, 2.3, 0, 0, 0.14, 0.1); m.box(0, 0, 0, 6.5, 0.05, 5.5, { uv: BURNS_ATLAS.pattern('canvas'), uvFaces: ['py', 'ny'] }); m.pop();
      m.color('#4a4a52'); for (const [px, pz] of [[2.9, 2.4], [-2.9, 2.4], [2.9, -2.4], [-2.9, -2.4]]) m.box(px, 1.2 + (px > 0 ? 0.3 : 0), pz, 0.08, 2.4 + (px > 0 ? 0.6 : 0), 0.08);
      m.color('#c8c0a8'); for (const [px, pz] of [[2.9, 2.4], [-2.9, -2.4]]) m.limb(px, 2.4, pz, px * 1.6, 0, pz * 1.6, 0.02, 0.02, { seg: 4 });
      m.color('#a07a4a'); m.box(0, 0.08, 0, 2.4, 0.16, 2.4); m.color('#8a3a5a'); m.roundBox(0, 0.55, 0, 2.0, 0.7, 0.9, 0.18);
      return { cols: [{ t: 'cyl', x: 2.9, z: 2.4, r: 0.15, y0: 0, y1: 2.4 }, { t: 'cyl', x: -2.9, z: 2.4, r: 0.15, y0: 0, y1: 2.4 }, { t: 'cyl', x: 2.9, z: -2.4, r: 0.15, y0: 0, y1: 2.4 }, { t: 'cyl', x: -2.9, z: -2.4, r: 0.15, y0: 0, y1: 2.4 }, { t: 'box', x: 0, z: 0, hx: 1.2, hz: 1.2, y0: 0, y1: 0.9 }] };
    }, { hi: true });
    E.art.push({ x: x + 4, z: z - 12, r: 7 }, { x: x - 12, z: z + 4, r: 4 }, { x: x + 14, z: z + 6, r: 4 }, { x: x - 4, z: z + 14, r: 4 });
    stuck('camper', x + 24, z - 22, 1.2, 0.18, -0.12, { r: 4 });
    E.heroes.push({ type: 'burnermom', x: x - 10, z: z + 1, yaw: -0.4, anim: 'wave' }, { type: 'partiedtoohard', x: x + 13, z: z + 3, yaw: 0.3, anim: 'dazed' });
    api.sign('CAMP SOGGY\nBOTTOM', x - 2, z - 4, { yaw: 0.2, h: 0.8, y: 2.4, post: true, maxW: 3.6, style: { bg: '#1a2a3a', fg: '#9af0ff', border: '#ffffff' } });
  }
  // ROAD CLOSED: a line of cones, a fence panel, the sign, a sunk van, a ranger
  { const [x, z] = LM.closed;
    api.sign('ROAD\nCLOSED', x - 2, z + 6, { yaw: Math.PI * 0.75, h: 1.3, y: 1.2, post: true, maxW: 3.4, style: { bg: '#ff8a1a', fg: '#1a1a1a', border: '#1a1a1a' } });
    for (let i = 0; i < 7; i++) CartScene.prop(api, 'cone', { x: x - 12 + i * 3.2, z: z + 10 + (i % 2) * 0.6 });
    CartScene.prop(api, 'fence', { x: x + 10, z: z + 12, yaw: 0.4, len: 9, h: 1.3 }); E.art.push({ x: x + 10, z: z + 12, r: 4.5 });
    CartScene.prop(api, 'barrel', { x: x - 14, z: z + 4 }); CartScene.prop(api, 'barrel', { x: x + 14, z: z + 2 });
    stuck('van', x - 18, z + 22, 1.1, 0.14, 0.3, { r: 4 });
    E.heroes.push({ type: 'ranger', x: x + 3, z: z + 4, yaw: 2.5, anim: 'radio' }, { type: 'darkwad', x: x - 6, z: z + 14, yaw: 1.0, anim: 'think' });
    CartScene.prop(api, 'lightTower', { x: x + 16, z: z + 20, aim: -2.4 }); E.art.push({ x: x + 16, z: z + 20, r: 2 });
  }
  // THE PLYWOOD PIER: a shade with a dry crowd, crates, a light tower, a sunk RV off the end
  { const [x, z] = LM.pier;
    CartScene.prop(api, 'shade', { x: x + 2, z: z + 10, yaw: 0, w: 9, d: 7, h: 3.2, col: '#e8e0d0', lights: false, seed: 3 }); E.art.push({ x: x + 2, z: z + 10, r: 5.5 });
    for (let k = 0; k < 12; k++) E.spots.push({ x: x - 1 + (rng() - 0.5) * 7, z: z + 9 + (rng() - 0.5) * 5, yaw: Math.PI + (rng() - 0.5) * 0.6 });
    for (let i = 0; i < 4; i++) CartScene.prop(api, 'crate', { x: x - 8 + (i % 2) * 1.4, z: z + 14 + Math.floor(i / 2) * 1.4, s: 1.1 });
    CartScene.prop(api, 'lightTower', { x: x + 16, z: z + 2, aim: -2.2 }); E.art.push({ x: x + 16, z: z + 2, r: 2 });
    stuck('rv', x + 20, z + 24, -2.2, -0.1, 0.25, { r: 5 });
    api.sign('PLYWOOD\nPIER', x - 6, z + 4, { yaw: -0.8, h: 0.8, y: 2.2, post: true, maxW: 3.2, style: { bg: '#3a2a1a', fg: '#ffd890', border: '#ffd890' } });
    E.heroes.push({ type: 'sparklepony', x: x - 4, z: z + 1, yaw: -2.2, anim: 'cheer' }, { type: 'burnerkid', x: x + 6, z: z + 4, yaw: -2.6, anim: 'wave' });
  }
  // stuck vehicles scattered along the mud, light towers at the far corners, cones at every spur
  stuck('car', -30, -100, 0.8, 0.22, 0.14, { r: 3 }); stuck('van', 112, 30, 2.2, -0.16, 0.2, { r: 4 }); stuck('camper', -112, -34, -1.4, 0.2, 0.18, { r: 4 }); stuck('car', 34, 108, -2.6, 0.1, -0.26, { r: 3 });
  for (const [x, z, a] of [[-130, -112, 0.8], [130, -112, -0.8], [130, 112, -2.4], [-130, 112, 2.4]]) { CartScene.prop(api, 'lightTower', { x, z, aim: a }); E.art.push({ x, z, r: 2 }); }
  for (const v of [oct[1], oct[3], oct[5], oct[7]]) for (let i = 0; i < 3; i++) CartScene.prop(api, 'cone', { x: v[0] + (rng() - 0.5) * 6, z: v[1] + (rng() - 0.5) * 6 });
  // joke signs
  const jokes = ['PLAYA\nCLOSED\nFOR SOUP', 'BOARDWALK\nSPEED LIMIT\n(IGNORED)', 'MOOP\nOR\nMUD?', 'NO SWIMMING\n(IN THE\nROAD)'];
  jokes.forEach((t, i) => { const a = i / 4 * TAU + 0.4, x = Math.cos(a) * 100, z = Math.sin(a) * 100; api.sign(t, x, z, { yaw: a + Math.PI / 2, h: 1.0, y: 1.6, post: true, maxW: 2.6, style: { bg: '#ffe24a', fg: '#1a1a1a', border: '#1a1a1a' } }); });
  // the perimeter: orange trash fence
  this.perimeter(E, [[-140, -120], [140, -120], [140, 120], [-140, 120]], 'fence');
  /* ---- objective spots ---- */
  E.zones = [{ x: 0, z: 0, r: 9, name: 'MUD ISLAND' }, { x: LM.tow[0], z: LM.tow[1], r: 9, name: 'THE TOW YARD' }, { x: LM.camp[0], z: LM.camp[1], r: 9, name: 'CAMP SOGGY BOTTOM' }, { x: LM.pier[0], z: LM.pier[1], r: 9, name: 'THE PLYWOOD PIER' }, { x: LM.closed[0], z: LM.closed[1], r: 9, name: 'ROAD CLOSED' }];
  for (let i = 0; i < 30; i++) { const b = E.boards[i % E.boards.length], t = rng(); E.orbSpots.push({ x: lerp(b.x0, b.x1, t), z: lerp(b.z0, b.z1, t) }); }
  for (let i = 0; i < 18; i++) { const a = rng() * TAU, r = 20 + rng() * 85; E.orbSpots.push({ x: Math.cos(a) * r, z: Math.sin(a) * r }); }
  E.flagSpots = [{ x: 0, z: 0 }, { x: -80, z: 0 }, { x: 80, z: 0 }, { x: 0, z: 80 }];
  E.captures = [{ x: 0, z: -80, r: 8 }, { x: 0, z: 80, r: 8 }, { x: oct[3][0], z: oct[3][1], r: 8 }, { x: oct[7][0], z: oct[7][1], r: 8 }];
  for (const v of oct) E.gifts.push({ x: v[0], z: v[1] });
  E.gifts.push({ x: -50, z: 0 }, { x: 50, z: 0 }, { x: 0, z: -50 }, { x: 0, z: 50 }, { x: 0, z: 0 });
  E.spawn = [[-50, 2.4], [-42, -2.4], [50, -2.4], [42, 2.4], [2.4, -50], [-2.4, -42], [-2.4, 50], [2.4, 42]].map(([x, z]) => ({ x, z, yaw: Math.atan2(-x, -z) }));
  return this.finish(E);
};

/* ---------------- the rules: mud, boards, puddles, rain, AI routing ---------------- */
const CART_MUD_BROWN = [0.36, 0.24, 0.14];
CART_ARENA_RULES.mud = {
  music: 'kart1',
  onLoad(s) { s.mudState = { bannerT: 0 }; for (const k of s.karts) { k.tiresT = 0; k.mudT = 0; k.splashT = 0; k.mudSplatT = 0; } },
  onStep(s, k, dt, racing) {
    const E = s.E, inp = k.inp;
    if (k.mudT > 0) k.mudT = Math.max(0, k.mudT - dt);
    if (k.splashT > 0) k.splashT = Math.max(0, k.splashT - dt);
    if (k.out) return;
    const sp = Math.hypot(k.vx, k.vz), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx;
    const board = cartMudBoard(E, k.x, k.z), mud = !board && !k.air && k.tiresT <= 0 ? cartMudZone(E, k.x, k.z) : null;
    k.onBoard = !!board; k.inMud = !!mud;
    if (mud) {
      // bogged down: hard cap on speed, the back end slides out, wheels throw mud
      k.mudT = 0.25;
      const cap = k.vmax * 0.55 * (k.boostT > 0 ? 1.25 : 1);
      if (sp > cap) { const f = Math.exp(-5 * dt), g = (cap + (sp - cap) * f) / sp; k.vx *= g; k.vz *= g; }
      k.vx += rx * -k.steer * sp * 0.28 * dt; k.vz += rz * -k.steer * sp * 0.28 * dt;
      k.drift = 0; k.charge = 0;
      if (sp > 2.5 && Math.random() < dt * 26) for (const sd of [-1, 1]) s.fx.add(k.x - fx * 1.6 + rx * sd * 1.0, k.y + 0.3, k.z - fz * 1.6 + rz * sd * 1.0, -fx * 3 + (Math.random() - 0.5) * 3, 2.5 + Math.random() * 2.5, -fz * 3 + (Math.random() - 0.5) * 3, 0.7, 0.35, 0.5, CART_MUD_BROWN, 0.9, 'drop', 2 | 4, Math.random() * 6, 3);
      if (k.player && racing && sp < 3 && inp.gas > 0 && s.mudState.bannerT <= 0 && !(s.rescue && s.rescue.burners.some(b => b.wait <= 0 && Math.hypot(b.x - k.x, b.z - k.z) < 4))) { s.mudState.bannerT = 4; s.banner('STUCK IN THE MUD!', '#c8a470', 1.4, 'find a boardwalk'); Sound.play('puke', { vol: 0.35, pitch: 0.6 }); }
    } else if (board && !k.air) {
      // plywood: grip and a little extra pace
      const lat = k.vx * rx + k.vz * rz, g = 1 - Math.exp(-3 * dt);
      k.vx -= rx * lat * g; k.vz -= rz * lat * g;
      if (inp.gas > 0 && sp < k.vmax * 1.06 && k.spinT <= 0 && k.slowT <= 0) { k.vx += fx * 2.2 * dt; k.vz += fz * 2.2 * dt; }
    }
    // puddles: a splash, and a brief dazzle for any rival just ahead (downwind of the spray)
    if (!k.air && sp > 6 && k.splashT <= 0) {
      const p = cartMudPuddle(E, k.x, k.z);
      if (p) {
        k.splashT = 0.55;
        for (let i = 0; i < 14; i++) s.fx.add(k.x + (Math.random() - 0.5) * 2, k.y + 0.3, k.z + (Math.random() - 0.5) * 2, k.vx * 0.5 + (Math.random() - 0.5) * 5, 3 + Math.random() * 5, k.vz * 0.5 + (Math.random() - 0.5) * 5, 0.6 + Math.random() * 0.3, 0.3, 0.45, [0.72, 0.8, 0.92], 0.85, 'drop', 2 | 4);
        s.fx.add(k.x, k.y + 0.08, k.z, 0, 0, 0, 0.8, 1.5, p.r * 1.8, [0.85, 0.9, 1], 0.5, 'ring', 8);
        Sound.play('splash', { vol: k.player ? 0.5 : 0.18, pitch: 1.1 + Math.random() * 0.3 });
        for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < 6 && dx * fx + dz * fz > 0 && o.shieldT <= 0) { o.dazzleT = Math.max(o.dazzleT, 0.8); if (o.player) { s.white = Math.max(s.white || 0, 0.3); s.banner('SPLASHED!', '#9ac8ff', 0.8, 'by ' + k.car.name, true); } s.log('splash', { k: o.id, by: k.id }); } }
      }
    }
    if (s.mudState && s.mudState.bannerT > 0 && k.player) s.mudState.bannerT -= dt;
    // AI: route goals via the boardwalks (re-routed when the goal changes, and every half second)
    if (k.ai && (!k.player || s.autoDrive) && k.ai.goal) {
      const ai = k.ai; ai.routeT = (ai.routeT || 0) - dt;
      if (ai.goal !== ai.goalRouted) { ai.goalRaw = ai.goal; ai.routeT = 0; }
      if (ai.routeT <= 0) { ai.routeT = 0.5; const r = cartMudRoute(s, k, ai.goalRaw[0], ai.goalRaw[1]); ai.goalRouted = r; ai.goal = r; }
      // MUD RESCUE: pull up and stop beside the burner
      if (s.objective === 'rescue' && ai.rescueTarget) {
        const b = ai.rescueTarget, d = Math.hypot(b.x - k.x, b.z - k.z);
        if (b.wait > 0) ai.rescueTarget = null;
        else if (d < 3) { inp.gas = 0; inp.brake = 1; inp.drift = false; inp.driftPress = false; ai.stuckT = 0; ai.revT = 0; }
        else if (d < 8 && k.speed > 5) { inp.gas = 0; inp.brake = 0.8; ai.stuckT = 0; ai.revT = 0; }
        else if (d < 14 && k.speed > 10) { inp.gas = 0; inp.brake = 0.4; }
      }
    }
  },
  aiGoal(s, k, nearestRival) {
    if (s.objective !== 'rescue' || !s.rescue) return null;
    const ai = k.ai; let best = null, bc = 1e9;
    for (const b of s.rescue.burners) {
      if (b.wait > 0) continue;
      let c = Math.hypot(b.x - k.x, b.z - k.z) + (s.rng() - 0.5) * 8;
      for (const slot in b.prog) if (+slot !== k.slot && b.prog[slot] > 0.6) c += 18;   // somebody else is nearly done there
      if (b.holder && b.holder !== k && b.holder.spinT <= 0) c += 10;
      if (c < bc) { bc = c; best = b; }
    }
    ai.rescueTarget = best;
    if (!best) return null;
    return { goal: [best.x, best.z], prey: null };
  },
  hud(s, ctx, W, H, top, left) {
    const k = s.player, t = s.time;
    if (k.tiresT > 0) BurnsUI.text(ctx, 'MONSTER TIRES ' + Math.ceil(k.tiresT) + 's', W / 2, top + 64, 13, '#ffd84a', { glow: '#ff8a2a' });
    else if (k.inMud && s.state === 'race' && !(s.rescue && s.rescue.burners.some(b => b.wait <= 0 && Math.hypot(b.x - k.x, b.z - k.z) < 4))) BurnsUI.text(ctx, k.speed < 3 ? 'STUCK!' : 'MUD! FIND THE PLANKS', W / 2, top + 64, 13, '#c8a470', {});
    if (s.objective === 'rescue' && s.rescue && s.state === 'race') {
      // arrow to the nearest burner, and the rescue progress
      let best = null, bd = 1e9, mine = 0;
      for (const b of s.rescue.burners) { if (b.wait > 0) continue; const d = Math.hypot(b.x - k.x, b.z - k.z); if (d < bd) { bd = d; best = b; } if (d < 3.2) mine = Math.max(mine, b.prog[k.slot] || 0); }
      if (best) { const p = {}; if (s.R.project(best.x, s.terrain.height(best.x, best.z) + 3.5, best.z, W, H, p)) { const x = clamp(p.x, 30, W - 30), y = clamp(p.y, 70, H - 120); ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.restore(); BurnsUI.text(ctx, Math.round(bd) + 'm', x, y + 22, 10, '#ffd84a', { ui: true }); } }
      if (mine > 0) BurnsUI.text(ctx, 'RESCUING… ' + Math.round(Math.min(1, mine / 2) * 100) + '%', W / 2, top + 84, 14, '#7aff8a', { glow: '#2a8a4a' });
      else if (bd < 3.2 && k.speed > 3) BurnsUI.text(ctx, 'STOP TO RESCUE', W / 2, top + 84, 12, '#ffd84a', {});
    }
  },
  draw(s, R, S, t) {
    const E = s.E, cam = s.cam, H = s.terrain, fx = s.fx;
    // rain: streaks falling around the camera, ripples on the puddles
    for (let i = 0; i < 16; i++) { const near = i < 6, sp = near ? 22 : 50; fx.add((near ? cam.x : cam.tx) + (Math.random() - 0.5) * sp, (near ? cam.y : cam.ty) + 1 + Math.random() * (near ? 7 : 11), (near ? cam.z : cam.tz) + (Math.random() - 0.5) * sp, 1.5, -22, 0.6, 0.5, near ? 0.4 : 0.34, near ? 0.4 : 0.34, [0.9, 0.94, 1], near ? 0.6 : 0.5, 'streak', 16); }
    for (const p of E.puddles) {
      const dx = p.x - cam.x, dz = p.z - cam.z; if (dx * dx + dz * dz > 150 * 150) continue;
      const gy = H.height(p.x, p.z) + 0.05;
      R.flat.flat(p.x, gy, p.z, p.r * 2, p.r * 1.6, p.a, S.glow, [0.62, 0.72, 0.86], 0.42 + Math.sin(t * 2 + p.x) * 0.05, false);
      if (Math.random() < 0.3) { const a = Math.random() * TAU, r = Math.random() * p.r * 0.8; fx.add(p.x + Math.cos(a) * r, gy + 0.02, p.z + Math.sin(a) * r * 0.8, 0, 0, 0, 0.7, 0.25, 1.4, [0.9, 0.94, 1], 0.4, 'ring', 8); }
    }
    // monster tires: a dark halo and mud flung from the wheels
    for (const k of s.karts) if (k.tiresT > 0 && k._in) R.flat.flat(k.x, H.height(k.x, k.z) + 0.06, k.z, k.M.w + 2.4, k.M.len + 2.4, k.yaw, S.ring, [1, 0.7, 0.3], 0.35 + Math.sin(t * 9) * 0.1, true);
    // MUD RESCUE: beacons over the stuck burners, a progress ring under the rescuing car
    if (s.objective === 'rescue' && s.rescue) for (const b of s.rescue.burners) {
      if (b.wait > 0) continue;
      const gy = H.height(b.x, b.z), pulse = 0.7 + 0.3 * Math.sin(t * 5 + b.x);
      R.bbs.streak(b.x, gy + 7, b.z, 0, 1, 0, 14, 1.2, S.streak, [1, 0.85, 0.3], 0.5);
      R.bbs.bb(b.x, gy + 2.6, b.z, 1.6, 1.6, S.warn, [1, 0.85, 0.3], 0.85 * pulse, true, 0);
      R.flat.flat(b.x, gy + 0.08, b.z, 6.4, 6.4, t * 0.5, S.ring, [1, 0.85, 0.3], 0.55, true);
      const h = b.holder, pr = h ? (b.prog[h.slot] || 0) : 0;
      if (h && pr > 0.05) { const u = Math.min(1, pr / 2); R.flat.flat(h.x, H.height(h.x, h.z) + 0.09, h.z, 4.5 + u * 2, 4.5 + u * 2, -t * 2, S.ring, [0.45, 1, 0.5], 0.4 + u * 0.6, true); R.bbs.bb(h.x, h.y + h.M.h + 1.2, h.z, 1.2 + u, 1.2 + u, S.heart, [1, 0.4, 0.6], 0.6 + u * 0.4, true); if (Math.random() < 0.4) fx.add(b.x + (Math.random() - 0.5), gy + 1.2, b.z + (Math.random() - 0.5), 0, 1.4, 0, 0.6, 0.2, 0.05, [1, 0.9, 0.4], 1, 'star', 1); }
    }
  }
};

/* ---------------- the three powers ---------------- */
CART_ITEMS.tires = { name: 'MONSTER TIRES', desc: '10 s of giant tyres: mud can\'t stop you, and anything you touch gets knocked flying.', col: '#ffb04a', arena: 'mud' };
CART_ITEM_FX.tires = {
  use(s, k) {
    k.tiresT = 10; k.vy = Math.max(k.vy, 3); k.air = true;
    Sound.play('kartBoost', { vol: k.player ? 0.8 : 0.3, pitch: 0.6 }); Sound.play('stomp', { vol: k.player ? 0.5 : 0.2, pitch: 0.8 });
    s.fx.burst(k.x, k.y + 0.6, k.z, 'puff', 16, '#6a4a2a');
    if (k.player) s.shakeIt(0.4);
  },
  update(s, dt, racing) {
    if (!s.karts) return;
    for (const k of s.karts) {
      if (!(k.tiresT > 0)) continue;
      k.tiresT = Math.max(0, k.tiresT - dt);
      k.bob = (k.bob || 0) + 0.4;   // rides higher on the big wheels (poseKart resets bob every step)
      if (k.out) continue;
      const sp = Math.hypot(k.vx, k.vz), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
      // off-road grip in the circuit races: the shoulder and the dirt don't slow these wheels
      if (k.off && !k.air && k.inp.gas > 0 && sp < k.vmax * 0.98 && k.spinT <= 0) { k.vx += fx * 14 * dt; k.vz += fz * 14 * dt; }
      if (sp > 4 && Math.random() < dt * 20) s.fx.add(k.x - fx * 1.5 + (Math.random() - 0.5) * 2, k.y + 0.4, k.z - fz * 1.5 + (Math.random() - 0.5) * 2, -fx * 4 + (Math.random() - 0.5) * 4, 3 + Math.random() * 3, -fz * 4 + (Math.random() - 0.5) * 4, 0.8, 0.3, 0.6, CART_MUD_BROWN, 0.9, 'drop', 2 | 4);
      // the ram: anything touching the big wheels is knocked away
      for (const o of s.karts) { if (o === k || o.out || o.invT > 0 || o.tiresT > 0) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < CART_R * 2 + 0.7 && Math.abs(o.y - k.y) < 2.2) { s.hit(o, 'knock', k, { dx: dx / (d || 1), dz: dz / (d || 1), power: 16, item: 'tires' }); s.fx.burst(o.x, o.y + 1, o.z, 'puff', 10, '#6a4a2a'); Sound.play('kartHit', { vol: 0.4, pitch: 0.7 }); } }
      if (k.tiresT === 0 && k.player) s.banner('TIRES DEFLATED', '#c8a470', 0.9, null, true);
    }
  },
  aiWants(s, k) {
    const E = s.E;
    if (k.inMud) return true;
    if (E && E.mud) { const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); for (let d = 6; d <= 24; d += 6) if (cartMudZone(E, k.x + fx * d, k.z + fz * d)) return true; }
    for (const o of s.karts) if (o !== k && !o.out && Math.hypot(o.x - k.x, o.z - k.z) < 7) return true;
    return k.ai.itemT < -5;
  },
  icon(ctx, s, col) {
    ctx.lineWidth = s * 0.1; ctx.strokeStyle = '#1a1a1e'; ctx.fillStyle = '#2a2a30';
    ctx.beginPath(); ctx.arc(0, 0, s * 0.46, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.12; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3); ctx.lineTo(Math.cos(a) * s * 0.5, Math.sin(a) * s * 0.5); ctx.stroke(); }
    ctx.fillStyle = '#c8c8d0'; ctx.beginPath(); ctx.arc(0, 0, s * 0.17, 0, TAU); ctx.fill();
  }
};

CART_ITEMS.mudblast = { name: 'MUD BLASTER', desc: 'Sprays a cone of mud ahead. Rivals caught in it get blinded, splattered and slowed.', col: '#8a5a2a', arena: 'mud' };
CART_ITEM_FX.mudblast = {
  use(s, k) {
    s.shots.push({ fx: 'mudblast', type: 'mudcone', owner: k, t: 0, life: 0.8, range: 22, half: 0.5, hit: new Set() });
    k.wpn.fireT = Math.max(k.wpn.fireT, 0.4); k.anim = 'cartFire'; k.animT = 0;
    Sound.play('puke', { vol: k.player ? 0.8 : 0.3, pitch: 0.8 }); Sound.play('splash', { vol: k.player ? 0.5 : 0.2, pitch: 0.7 });
  },
  shot(s, sh, dt) {
    const k = sh.owner;
    if (sh.type === 'splat') { const o = sh.target; if (!o || o.out) sh.dead = true; return; }
    const mz = s.muzzle(k, sh.p || (sh.p = [0, 0, 0])), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    sh.x = mz[0]; sh.y = mz[1]; sh.z = mz[2]; sh.yaw = k.yaw;
    for (let i = 0; i < 4; i++) { const a = k.yaw + (Math.random() - 0.5) * 2 * sh.half, v = 20 + Math.random() * 12; s.fx.add(mz[0], mz[1], mz[2], Math.sin(a) * v + k.vx * 0.5, 2 + Math.random() * 3, Math.cos(a) * v + k.vz * 0.5, 0.6 + Math.random() * 0.3, 0.35, 0.9, CART_MUD_BROWN, 0.95, 'drop', 2 | 4, Math.random() * 6, 4); }
    for (const o of s.karts) {
      if (o === k || sh.hit.has(o) || o.out) continue;
      const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d > sh.range || d < 0.5) continue;
      if (Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)) > sh.half + Math.atan2(1.4, d)) continue;
      sh.hit.add(o);
      if (s.hit(o, 'dazzle', k, { item: 'mudblast' })) { o.slowT = Math.max(o.slowT, 2); o.mudSplatT = 3; s.shots.push({ fx: 'mudblast', type: 'splat', owner: k, target: o, t: 0, life: 3, rot: Math.random() * 6 }); s.fx.burst(o.x, o.y + 1.4, o.z, 'drop', 14, '#5a3a1e'); if (o.player) s.banner('MUDDED!', '#c8a470', 1.0, 'by ' + k.car.name); }
    }
  },
  draw(s, R, sh, S, t) {
    if (sh.type === 'splat') { const o = sh.target; if (!o) return; const a = Math.min(1, (sh.life - sh.t) * 1.5); R.bbs.bb(o.x, o.y + o.M.h * 0.55, o.z, 2.6, 2.6, S.puff, [0.34, 0.22, 0.12], 0.85 * a, false, sh.rot); R.bbs.bb(o.x + 0.6, o.y + o.M.h * 0.3, o.z, 1.6, 1.6, S.puff, [0.42, 0.28, 0.15], 0.7 * a, false, sh.rot + 2); return; }
    if (sh.x === undefined) return;
    const a = Math.min(1, (sh.life - sh.t) * 4), fx = Math.sin(sh.yaw), fz = Math.cos(sh.yaw);
    for (let i = 0; i < 3; i++) { const d0 = sh.range * (i + 0.5) / 3; R.bbs.bb(sh.x + fx * d0, sh.y + 0.5, sh.z + fz * d0, 3 + i * 3, 3 + i * 3, S.puff, [0.38, 0.25, 0.14], 0.5 * a, false, t * 2 + i); }
  },
  aiWants(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    for (const o of s.karts) { if (o === k || o.out || o.invT > 0.3) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < 20 && Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)) < 0.45) return true; }
    return k.ai.itemT < -8;
  },
  icon(ctx, s, col) {
    ctx.fillStyle = '#5a5a62'; ctx.strokeStyle = '#1a1a1e'; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.12); ctx.lineTo(-s * 0.1, -s * 0.18); ctx.lineTo(-s * 0.1, s * 0.18); ctx.lineTo(-s * 0.5, s * 0.12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; for (const [dx, dy, r] of [[0.1, -0.25, 0.1], [0.3, -0.05, 0.14], [0.12, 0.22, 0.11], [0.42, 0.26, 0.09], [0.45, -0.3, 0.08]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fill(); ctx.stroke(); }
  }
};

CART_ITEMS.towrope = { name: 'TOW ROPE', desc: 'Hooks the car ahead and yanks it behind you. You get the boost, they get the spin.', col: '#d8c090', arena: 'mud' };
CART_ITEM_FX.towrope = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    let best = null, bd = 1e9;
    for (const o of s.karts) { if (o === k || o.out || o.towT > 0) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d > 35) continue; const a = Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)); if (a > 1.0) continue; const c = d + a * 10; if (c < bd) { bd = c; best = o; } }
    if (!best) { s.boost(k, 0.5, 'tow'); if (k.player) s.banner('NOTHING TO HOOK', '#d8c090', 0.9, null, true); Sound.play('throw', { vol: k.player ? 0.6 : 0.2 }); return; }
    s.shots.push({ fx: 'towrope', type: 'tow', owner: k, target: best, t: 0, life: 1.2, ax: k.x, az: k.z, bx: best.x, bz: best.z, byaw: best.yaw, done: false });
    k.towT = 1.3; best.towT = 1.3; best.drift = 0; best.charge = 0;
    Sound.play('throw', { vol: k.player ? 0.7 : 0.25, pitch: 0.8 }); Sound.play('pick', { vol: k.player ? 0.5 : 0.2, pitch: 0.7 });
    if (best.player) s.banner('HOOKED!', '#d8c090', 1.0, 'by ' + k.car.name);
    s.log('hook', { k: best.id, by: k.id });
  },
  update(s, dt, racing) { if (!s.karts) return; for (const k of s.karts) if (k.towT > 0) k.towT = Math.max(0, k.towT - dt); },
  shot(s, sh, dt) {
    const k = sh.owner, o = sh.target;
    if (sh.done) { sh.dead = true; return; }
    if (!o || o.out || k.out) { sh.done = true; return; }
    const u = Math.min(1, sh.t / sh.life), e = u * u * (3 - 2 * u), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx;
    // the owner is pulled up to where the target was; the target swings past on the side and ends up behind
    const side = Math.sin(Math.PI * u) * 4.5, dx = sh.bx - sh.ax, dz = sh.bz - sh.az, L = Math.hypot(dx, dz) || 1;
    const ox = sh.ax + dx * e * 1.15, oz = sh.az + dz * e * 1.15;
    const tx = sh.bx - dx * e * 1.15 - (dx / L) * 4 * e + rx * side, tz = sh.bz - dz * e * 1.15 - (dz / L) * 4 * e + rz * side;
    k.x = ox; k.z = oz; o.x = tx; o.z = tz;
    const sp = Math.max(Math.hypot(k.vx, k.vz), k.vmax * 0.9); k.vx = (dx / L) * sp; k.vz = (dz / L) * sp;
    o.vx *= Math.exp(-4 * dt); o.vz *= Math.exp(-4 * dt); o.yaw = cartWrap(o.yaw + dt * 5 * (1 - u));
    o.drift = 0; o.charge = 0; o.boostT = 0; o.inp.gas = 0;
    if (Math.random() < dt * 30) s.fx.add(lerp(ox, tx, Math.random()), k.y + 1, lerp(oz, tz, Math.random()), 0, 1, 0, 0.3, 0.2, 0.05, [1, 0.9, 0.6], 1, 'spark', 1);
    if (sh.t >= sh.life) {
      sh.done = true;
      s.boost(k, 1.0, 'tow'); s.hit(o, 'spin', k, { item: 'towrope', dur: 1.2 });
      s.fx.burst(o.x, o.y + 1, o.z, 'puff', 12, '#6a4a2a'); Sound.play('bump', { vol: 0.5, pitch: 0.8 });
      if (k.player) s.banner('YANKED!', '#7aff8a', 0.9, null, true);
    }
  },
  draw(s, R, sh, S, t) {
    const k = sh.owner, o = sh.target; if (!o || sh.done) return;
    const p = s.muzzle(k, sh.p || (sh.p = [0, 0, 0])), ax = p[0], ay = p[1], az = p[2], bx = o.x, by = o.y + 0.9, bz = o.z;
    const n = 6; let px = ax, py = ay, pz = az;
    for (let i = 1; i <= n; i++) { const u = i / n, x = lerp(ax, bx, u), y = lerp(ay, by, u) - Math.sin(u * Math.PI) * 0.6, z = lerp(az, bz, u); const dx = x - px, dy = y - py, dz = z - pz, l = Math.hypot(dx, dy, dz) || 1; R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l, 0.22, S.streak, [0.85, 0.72, 0.5], 1); px = x; py = y; pz = z; }
    R.bbs.bb(bx, by, bz, 1.6, 1.6, S.glow, [1, 0.85, 0.5], 0.8, true); R.bbs.bb(bx, by, bz, 0.8, 0.8, S.core, [1, 0.95, 0.8], 1, true);
  },
  aiWants(s, k) {
    for (const o of s.karts) { if (o === k || o.out || o.invT > 0.3 || o.towT > 0) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < 32 && d > 5 && Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)) < 0.7) return true; }
    return k.ai.itemT < -8;
  },
  icon(ctx, s, col) {
    ctx.strokeStyle = col; ctx.lineWidth = s * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.4); ctx.bezierCurveTo(-s * 0.1, -s * 0.5, s * 0.1, s * 0.1, s * 0.0, s * 0.1); ctx.stroke();
    ctx.strokeStyle = '#d8d8e0'; ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.arc(s * 0.12, s * 0.2, s * 0.22, -Math.PI * 0.5, Math.PI * 0.9); ctx.stroke();
    ctx.fillStyle = '#d8d8e0'; ctx.beginPath(); ctx.arc(s * 0.0, s * 0.1, s * 0.09, 0, TAU); ctx.fill();
  }
};

/* ---------------- objective: MUD RESCUE ---------------- */
CART_OBJECTIVES.rescue = {
  name: 'MUD RESCUE', short: 'Pull burners out', desc: 'Burners are stuck in the mud pits. Stop beside one for 2 seconds to pull them out. A rival who gets there first steals the save. First to 8.',
  time: 150, goal: 8, unit: ' saved',
  fx: {
    init(s) {
      const E = s.E, spots = (E.rescueSpots && E.rescueSpots.length >= 6 ? E.rescueSpots : E.orbSpots).slice();
      const types = ['partiedtoohard', 'sparklepony', 'burnermom', 'furry', 'burnerkid', 'playaartist', 'darkwad', 'lamplighter'];
      const R = s.rescue = { spots, burners: [], used: new Set() };
      const n = Math.min(6, spots.length);
      for (let i = 0; i < n; i++) {
        const type = types[i % types.length], model = BurnsRig.model(BurnsRig.npcSpec(type, 40 + i, {})), ch = new BurnsChar(model);
        const hero = { ch, model, h: { type, x: 0, z: 0, yaw: 0, anim: 'wave' }, fire: false };
        s.heroes.push(hero);
        const b = { hero, ch, x: 0, z: 0, spot: -1, prog: {}, holder: null, wait: 0, anims: ['wave', 'yell', 'dazed'] };
        R.burners.push(b);
        this.place(s, b);
      }
    },
    place(s, b) {
      const R = s.rescue, free = R.spots.map((p, i) => i).filter(i => !R.used.has(i));
      const i = free[Math.floor(s.rng() * free.length)];
      if (b.spot >= 0) R.used.delete(b.spot);
      b.spot = i; R.used.add(i);
      const p = R.spots[i]; b.x = p.x + (s.rng() - 0.5) * 3; b.z = p.z + (s.rng() - 0.5) * 3;
      b.prog = {}; b.holder = null; b.wait = 0;
      const ch = b.ch; ch.x = b.x; ch.z = b.z; ch.y = s.terrain.height(b.x, b.z) - 0.35; ch.yaw = s.rng() * TAU;
      ch.play(b.anims[Math.floor(s.rng() * b.anims.length)], {}, true); ch.animT = s.rng() * 3;
    },
    update(s, dt) {
      const R = s.rescue; if (!R) return false;
      const goal = CART_OBJECTIVES.rescue.goal;
      for (const b of R.burners) {
        if (b.wait > 0) { b.wait -= dt; if (b.wait <= 0) this.place(s, b); continue; }
        let best = null, bp = 0;
        for (const k of s.karts) {
          if (k.out) continue;
          const d = Math.hypot(k.x - b.x, k.z - b.z), slot = k.slot;
          if (d < 3.2 && k.speed < 4 && k.spinT <= 0 && k.flipT <= 0 && !k.air) { b.prog[slot] = (b.prog[slot] || 0) + dt; if (k.player && !b.prog.hint) { b.prog.hint = 1; } }
          else if (b.prog[slot] > 0) { b.prog[slot] = Math.max(0, b.prog[slot] - dt * (d > 5 ? 2 : 0.4)); }
          if (b.prog[slot] > bp) { bp = b.prog[slot]; best = k; }
        }
        if (best !== b.holder) {
          if (best && b.holder && (best.player || b.holder.player)) s.banner(best.player ? 'RESCUE STOLEN!' : b.holder.player ? 'THEY STOLE YOUR RESCUE!' : '', best.player ? '#7aff8a' : '#ff6a6a', 1.0, null, true);
          b.holder = best;
        }
        if (best && bp >= 2) {
          best.score++; best.cheerT = Math.max(best.cheerT, 1.2);
          s.log('rescue', { k: best.id, n: best.score, player: best.player });
          s.banner(best.player ? 'BURNER SAVED!' : best.car.name + ' SAVES ONE', best.player ? '#7aff8a' : '#ffd84a', 1.3, best.score + ' / ' + goal);
          Sound.play(best.player ? 'crowd' : 'pick', { vol: best.player ? 0.6 : 0.35 }); if (best.player) Sound.play('gift', { vol: 0.5 });
          s.fx.confetti(b.x, s.terrain.height(b.x, b.z) + 1.5, b.z, 24); s.fx.hearts(best.x, best.y + 2.5, best.z, 6);
          b.wait = 1.2; b.ch.play('cheer', {}, false); b.ch.x = 9999; b.ch.z = 9999; b.holder = null; b.prog = {};
          for (const k of s.karts) if (k.ai && k.ai.rescueTarget === b) k.ai.rescueTarget = null;
          if (best.score >= goal) return true;
        }
      }
      return false;
    },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || (b.hitsDealt - a.hitsDealt) || (a.slot - b.slot)); },
    score(k) { return k.score; }
  }
};

/* ---------------- the menu card icon: a raindrop over tyre tracks ---------------- */
CART_ARENA_ICONS.mud = (ctx, s, t, col) => {
  ctx.lineWidth = s * 0.1; ctx.strokeStyle = col; ctx.fillStyle = rgba(col, 0.25); ctx.lineCap = 'round'; ctx.setLineDash([s * 0.14, s * 0.12]);
  for (const o of [-0.45, 0.45]) { ctx.beginPath(); ctx.moveTo(-s, s * 0.55 + o * s * 0.5); ctx.quadraticCurveTo(0, s * 0.2 + o * s * 0.5, s, s * 0.55 + o * s * 0.5); ctx.stroke(); }
  ctx.setLineDash([]);
  const dy = Math.sin(t * 3) * s * 0.06;
  ctx.fillStyle = '#9ac8ff'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.08;
  ctx.beginPath(); ctx.moveTo(0, -s * 0.85 + dy); ctx.bezierCurveTo(s * 0.45, -s * 0.25 + dy, s * 0.42, s * 0.05 + dy, 0, s * 0.1 + dy); ctx.bezierCurveTo(-s * 0.42, s * 0.05 + dy, -s * 0.45, -s * 0.25 + dy, 0, -s * 0.85 + dy); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-s * 0.12, -s * 0.25 + dy, s * 0.06, s * 0.14, 0.4, 0, TAU); ctx.fill();
};
