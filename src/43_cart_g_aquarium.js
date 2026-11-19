/* ============================================================
   ART CART — secret arena: THE MIRROR TANK (id 'aquarium'), Glitterfin's secret level
   A giant art-installation fish tank at night: candy-coloured pebble gravel, glass walls
   with glowing rails, a mirror-tiled sunken castle in the middle, mirror pillars, plastic
   plants, bubbling air stones, a brass diver's helmet, a giant spiral shell and a hollow
   log you can drive through. A mirror ball hangs over it all and throws sweeping beams.
   Its own game: SCHOOL OF GLITTER (collect mirror fish that swim behind you as a school,
   ram a rival's school to cut it and steal every fish behind the cut).
   Registers itself in CART_ARENAS / CART_ARENA_RULES / CART_OBJECTIVES / CART_ARENA_ICONS
   and CART_SECRET_LEVELS.fish. Globals AQM_*, scene state s.aqm, world state E.aqm, kart k.aqm.
   Everything here is an original design.
   ============================================================ */
const AQM_C = {
  R: 100,                       // the glass wall radius
  N: 40,                        // mirror fish in the tank
  START_FREE: 26,               // loose at the start; the rest swim out of the castle gate one by one
  RELEASE_T: 2.6,               // seconds between castle releases
  GRAB_R: 2.9,                  // drive this close to a loose fish to collect it
  CUT_R: 2.4,                   // touch a rival's school fish this close to cut it
  SPACING: 1.75,                // metres between fish in a school
  SLOW: 0.014,                  // top speed lost per fish carried (a big school is a long, slow target)
  LOCK_T: 1.5,                  // a fish that just joined a school can't be cut for this long
  FISH_Y: 1.35
};
const AQM_P = {};               // scratch (no per-frame allocations)

/* ---------------- the mirror fish (an instanced prototype; each copy is tinted by its school) ---------------- */
function AQM_fishMesh(m) {
  const tile = (x, y, z) => ((Math.floor(x * 5 + 40) + Math.floor(y * 5 + 40) + Math.floor(z * 3.4 + 40)) % 3 === 0 ? '#9aa8c8' : null);
  m.color('#f4f8ff').shine(3);
  m.ellipsoid(0, 0, 0, 0.34, 0.56, 1.0, { seg: m.lo ? 8 : 12, rings: m.lo ? 5 : 8, colFn: tile });   // body: z forward
  // tail: two flat lobes; dorsal and side fins (pink-tipped)
  m.color('#ffd0f0', 0.25).shine(2);
  for (const s of [1, -1]) { m.push(); m.tf(0, s * 0.22, -1.05, 0, s * 0.55, 0); m.ellipsoid(0, 0, -0.32, 0.05, 0.22, 0.48, { seg: 6, rings: 4 }); m.pop(); }
  m.push(); m.tf(0, 0.5, -0.15, 0, -0.45, 0); m.ellipsoid(0, 0, 0, 0.05, 0.3, 0.5, { seg: 6, rings: 4 }); m.pop();
  for (const s of [1, -1]) { m.push(); m.tf(s * 0.32, -0.15, 0.15, s * 0.5, 0.3, 0); m.ellipsoid(0, 0, -0.15, 0.04, 0.14, 0.32, { seg: 5, rings: 3 }); m.pop(); }
  m.emissive(0);
  // eyes and lips
  m.color('#ffffff').shine(1); for (const s of [1, -1]) m.ball(s * 0.25, 0.14, 0.62, 0.13, { seg: 6, rings: 4 });
  m.color('#101828'); for (const s of [1, -1]) m.ball(s * 0.31, 0.15, 0.68, 0.07, { seg: 5, rings: 3 });
  m.color('#ff5ab0', 0.4); m.torus(0, -0.08, 0.96, 0.1, 0.045, { seg: 8, tseg: 4 }); m.emissive(0).shine(0);
}

/* ---------------- the world ---------------- */
CartWorlds.arena_aquarium = function (A, night) {
  const C = AQM_C, R = C.R;
  const E = this.base(2007, [-140, -140, 140, 140], '#33475e', 0.02);
  const sky = Object.assign({}, BURNS_PALETTES.night, {
    fog: '#0c3a58', fogD: 0.0105, fogH: 0.012, fogMax: 0.82, haze: 0.45, zen: '#050f24', hor: '#123c66', sky: '#2a5a8a', gnd: '#1a3046',
    key: '#a8e8ff', keyK: 0.6, stars: 0, clouds: 0, emB: 1.8, moonK: 0, cityK: 0, milkyway: 0, mtnH: 0, mid: '#0c3050', midK: 0.45,
    dust: 0.12, rays: 0, rim: '#ff9ae0', exposure: 0.95, grade: [1.08, 0.12, 0.38]
  });
  Object.assign(E, { id: 'aquarium', arena: A, sky, tod: 'night', music: 'kart3', night: true, R, aqm: { stones: [], fishSpots: [], beams: [] } });
  const api = E.api, T = E.terrain, rng = mulberry32(2007), Q = E.aqm;
  const pebble = ['#ff7ac8', '#5af2e8', '#f4f4ff', '#a88aff', '#ffd86a', '#7ad8ff', '#ff9a7a'];
  // ---- the gravel: thousands of candy pebbles, darker drifts, a pale ring round the castle ----
  api.paint((ctx, P, S) => {
    for (let i = 0; i < 70; i++) { const x = (rng() - 0.5) * 230, z = (rng() - 0.5) * 230, q = P(x, z); ctx.fillStyle = rng() < 0.5 ? 'rgba(20,30,60,0.25)' : 'rgba(120,150,190,0.14)'; ctx.beginPath(); ctx.ellipse(q[0], q[1], (6 + rng() * 14) * S, (4 + rng() * 9) * S, rng() * 3, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 5200; i++) {
      const a = rng() * TAU, d = Math.sqrt(rng()) * (R + 6), x = Math.sin(a) * d, z = Math.cos(a) * d, q = P(x, z), r = (0.18 + rng() * 0.32) * S;
      ctx.fillStyle = pebble[(rng() * pebble.length) | 0]; ctx.globalAlpha = 0.45 + rng() * 0.4;
      ctx.beginPath(); ctx.ellipse(q[0], q[1], r * 1.3, r, rng() * 3, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;
    const c = P(0, 0); ctx.strokeStyle = 'rgba(220,240,255,0.35)'; ctx.lineWidth = 1.2 * S; ctx.setLineDash([1.5 * S, 1.2 * S]); ctx.beginPath(); ctx.arc(c[0], c[1], 13 * S, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  });
  // gentle gravel drifts
  for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + 0.3, r = 30 + (i % 3) * 22; T.add(CartFeat.mound(Math.sin(a) * r, Math.cos(a) * r, 9 + rng() * 6, 0.7 + rng() * 0.8, { col: '#46607a', res: 1.2 })); }
  // ---- the sunken castle: mirror-tiled towers, pink windows, a gate the fish swim out of ----
  CartScene.mesh(api, 0, 0, 0, m => {
    const disco = BURNS_ATLAS.pattern('disco');
    m.color('#e4ecff').shine(3);
    m.lathe([[7.2, 0], [7.0, 0.5], [6.4, 0.7], [6.4, 4.6], [6.9, 4.8], [6.9, 5.5], [0, 5.5]], { seg: 16, uv: disco, uvRepeat: 10 });   // the keep's base
    m.lathe([[3.6, 5.4], [3.4, 11.0], [3.9, 11.2], [3.9, 12.0], [0, 12.0]], { seg: 12, uv: disco, uvRepeat: 6 });                    // the keep
    m.color('#ff7ac8', 0.35).shine(2); m.lathe([[3.9, 12.0], [2.6, 14.2], [0.8, 16.4], [0, 17.2]], { seg: 12 }); m.emissive(0);   // pink cone roof
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4, tx = Math.sin(a) * 6.2, tz = Math.cos(a) * 6.2, h = 8 + (i % 2) * 1.6;
      m.push(); m.tf(tx, 0, tz); m.color('#e4ecff').shine(3);
      m.lathe([[1.7, 0], [1.6, h], [2.0, h + 0.2], [2.0, h + 1.0], [0, h + 1.0]], { seg: 10, uv: disco, uvRepeat: 4 });
      m.color(i % 2 ? '#5af2e8' : '#a88aff', 0.35).shine(2); m.lathe([[2.0, h + 1.0], [1.2, h + 2.6], [0, h + 3.8]], { seg: 10 }); m.emissive(0);
      m.pop();
    }
    // crenellations round the keep, glowing windows, the gate arch
    m.color('#d4dcf4').shine(3); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.roundBox(Math.sin(a) * 6.75, 5.85, Math.cos(a) * 6.75, 1.1, 0.7, 1.1, 0.12); }
    m.color('#ff9ae0', 1); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5; m.push(); m.tf(Math.sin(a) * 3.55, 8.5, Math.cos(a) * 3.55, a); m.roundBox(0, 0, 0, 0.7, 1.4, 0.2, 0.2); m.pop(); }
    m.color('#5af2e8', 1); m.push(); m.tf(0, 0, 6.45); m.roundBox(0, 1.7, 0, 3.4, 3.4, 0.3, 0.9); m.pop();
    m.color('#1a2440', 0); m.push(); m.tf(0, 0, 6.6); m.roundBox(0, 1.5, 0, 2.6, 3.0, 0.2, 0.8); m.pop();
    m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 7.4, y0: 0, y1: 12 }] };
  }, { hi: true });
  api.glow(0, 1.7, 7.0, 4, '#5af2e8'); api.glow(0, 17.4, 0, 3, '#ff9ae0'); api.light(0, 0, 26, '#9ad8ff', 0.8); api.light(0, 9, 12, '#5af2e8', 0.6);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4, h = 8 + (i % 2) * 1.6; api.glow(Math.sin(a) * 6.2, h + 4.0, Math.cos(a) * 6.2, 1.6, i % 2 ? '#5af2e8' : '#a88aff'); }
  E.art.push({ x: 0, z: 0, r: 7.6 });
  // ---- the mirror ball hanging over the tank (its beams sweep in the draw pass) ----
  CartScene.mesh(api, 0, 0, 0, m => {
    m.color('#3a4458').shine(2); m.limb(0, 3.2, 0, 0, 14, 0, 0.08, 0.08, { seg: 5 });
    m.color('#f0f4ff').shine(3); m.ball(0, 0, 0, 3.2, { seg: 18, rings: 12, colFn: (x, y, z) => ((Math.floor(Math.atan2(x, z) * 5.7 + 40) + Math.floor(y * 1.8 + 40)) % 2 ? '#8a9ac0' : null) });
    m.shine(0);
  }, { hi: true, noAO: true, y: 30 });
  // ---- mirror pillars: tall hexagonal prisms with a light ring on top ----
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + 0.26, x = Math.sin(a) * 60, z = Math.cos(a) * 60, c = ['#ff7ac8', '#5af2e8', '#a88aff'][i % 3];
    CartScene.mesh(api, x, z, a, m => {
      m.color('#dfe8ff').shine(3); m.lathe([[1.9, 0], [1.9, 0.4], [1.6, 0.6], [1.6, 9.2], [1.9, 9.4], [1.9, 9.8], [0, 9.8]], { seg: 6, uv: BURNS_ATLAS.pattern('disco'), uvRepeat: 3 });
      m.color(c, 1); m.torus(0, 10.0, 0, 1.4, 0.16, { seg: 12, tseg: 4 }); m.ball(0, 10.6, 0, 0.45, { seg: 8, rings: 6 }); m.emissive(0).shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.9, y0: 0, y1: 10 }] };
    }, { hi: true, noAO: true });
    api.glow(x, 10.4, z, 3.2, c); api.light(x, z, 13, c, 0.55); E.art.push({ x, z, r: 2.1 });
  }
  // ---- plastic plants: ribbon fronds in loud colours (low detail, no colliders) ----
  const plant = (x, z, seed) => {
    const r2 = mulberry32(seed), col = r2.pick(['#3aff8a', '#ff5ab0', '#5af2e8', '#ffd84a', '#9a7aff']), n = 4 + ((r2() * 3) | 0);
    CartScene.mesh(api, x, z, r2() * TAU, m => {
      m.color(col, 0.3).shine(2);
      for (let i = 0; i < n; i++) {
        const a = i / n * TAU + r2(), h = 3.5 + r2() * 4, lean = 0.4 + r2() * 0.6, bx = Math.sin(a) * lean, bz = Math.cos(a) * lean;
        m.limb(0, 0, 0, bx * h * 0.35, h * 0.5, bz * h * 0.35, 0.22, 0.16, { seg: 5 }); m.limb(bx * h * 0.35, h * 0.5, bz * h * 0.35, bx * h * 0.75 + Math.sin(a + 1.5) * 0.6, h, bz * h * 0.75, 0.16, 0.05, { seg: 5 });
        m.push(); m.tf(bx * h * 0.55, h * 0.72, bz * h * 0.55, a, 0.3, 0); m.ellipsoid(0, 0, 0, 0.7, 0.05, 0.3, { seg: 6, rings: 3 }); m.pop();
      }
      m.color('#2a3040', 0).shine(1); m.roundCyl(0, 0, 0, 0.9, 0.35, 0.1, { seg: 8 }); m.shine(0);
    }, { noAO: true });
  };
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.12, r = 84 + (i % 2) * 6; for (let j = 0; j < 3; j++) plant(Math.sin(a) * r + (rng() - 0.5) * 7, Math.cos(a) * r + (rng() - 0.5) * 7, 300 + i * 5 + j); }
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.9; plant(Math.sin(a) * 26, Math.cos(a) * 26, 400 + i); }
  // ---- air stones: a round stone on the gravel; the bubble curtain is drawn by the rules ----
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU, x = Math.sin(a) * 40, z = Math.cos(a) * 40;
    CartScene.mesh(api, x, z, 0, m => { m.color('#3a4a5a').shine(1); m.ellipsoid(0, 0.15, 0, 1.4, 0.45, 1.4, { seg: 10, rings: 5 }); m.color('#bfe8ff', 0.8); m.torus(0, 0.42, 0, 0.9, 0.06, { seg: 12, tseg: 3 }); m.emissive(0).shine(0); }, { noAO: true });
    api.glow(x, 0.6, z, 2.4, '#7ad8ff'); api.light(x, z, 8, '#7ad8ff', 0.4); Q.stones.push({ x, z });
  }
  // ---- the brass diver's helmet ornament: a dome with portholes, a collar, an air hose ----
  CartScene.mesh(api, -48, 64, 2.4, m => {
    m.color('#d8a84a').shine(3); m.ball(0, 3.4, 0, 3.4, { seg: 16, rings: 12 }); m.lathe([[4.0, 0], [4.2, 0.6], [3.6, 1.0], [3.2, 1.2]], { seg: 16 });
    m.color('#b8862a'); for (const [a, y] of [[0, 3.5], [1.6, 3.4], [-1.6, 3.4]]) { m.push(); m.tf(Math.sin(a) * 3.2, y, Math.cos(a) * 3.2, a, Math.PI / 2, 0); m.torus(0, 0, 0, 1.0, 0.22, { seg: 12, tseg: 5 }); m.pop(); }
    m.color('#5af2e8', 0.9); for (const [a, y] of [[0, 3.5], [1.6, 3.4], [-1.6, 3.4]]) { m.push(); m.tf(Math.sin(a) * 3.15, y, Math.cos(a) * 3.15, a, Math.PI / 2, 0); m.roundCyl(0, -0.1, 0, 0.85, 0.12, 0.04, { seg: 12 }); m.pop(); }
    m.color('#2a2a30', 0).shine(1); m.limb(0, 6.6, -0.5, 1.5, 8.5, -2.5, 0.3, 0.3, { seg: 6 }); m.limb(1.5, 8.5, -2.5, 3.5, 2, -6, 0.3, 0.3, { seg: 6 }); m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.8, y0: 0, y1: 6.5 }] };
  }, { hi: true });
  api.glow(-48 + Math.sin(2.4) * 3.4, 3.5, 64 + Math.cos(2.4) * 3.4, 2.6, '#5af2e8'); api.light(-48, 64, 14, '#5af2e8', 0.5); E.art.push({ x: -48, z: 64, r: 4.2 });
  // ---- the giant spiral shell (pearly, pink lip) ----
  CartScene.mesh(api, 72, 34, -0.8, m => {
    m.color('#fff0e8').shine(3);
    for (let i = 0; i < 7; i++) { const t = i / 7, r = 3.2 * (1 - t * 0.78); m.push(); m.tf(t * 1.0, 1.6 + t * 4.2, -t * 0.6, t * 5.0, 0, 0.2); m.torus(0, 0, 0, r, r * 0.42, { seg: 14, tseg: 7 }); m.pop(); }
    m.color('#ff9ac8', 0.45); m.push(); m.tf(0, 1.4, 2.6, 0, 1.2, 0); m.ellipsoid(0, 0, 0, 2.4, 0.4, 1.5, { seg: 12, rings: 5 }); m.pop(); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.6, y0: 0, y1: 6 }] };
  }, { hi: true });
  api.glow(72, 2.6, 36.5, 3, '#ff9ac8'); api.light(72, 34, 14, '#ff9ac8', 0.5); E.art.push({ x: 72, z: 34, r: 4 });
  // ---- the hollow log: drive straight through it ----
  CartScene.mesh(api, 40, -64, 0.6, m => {
    const L = 16, R0 = 3.6;
    const tube = (u, v, out) => { const a = v * TAU, r = R0 * (1 + 0.06 * Math.sin(u * 19 + v * 7)); out[0] = Math.cos(a) * r; out[1] = Math.sin(a) * r + R0 - 0.5; out[2] = (u - 0.5) * L; };
    const cf = (u, v) => { const k = 0.75 + 0.25 * Math.sin(v * 40) * Math.sin(u * 9); return [Math.round(120 * k), Math.round(82 * k), Math.round(56 * k)]; };
    m.color('#7a5236').shine(0); m.surf(14, 12, tube, { wrapV: true, out: [0, R0 - 0.5, 0], colFn: cf }); m.surf(14, 12, tube, { wrapV: true, out: [0, R0 - 0.5, 0], flip: true, colFn: cf });
    m.color('#3aff8a', 0.4); for (let i = 0; i < 9; i++) { const a = 0.4 + i * 0.28, z = (i - 4) * 1.6; m.ball(Math.cos(a) * (R0 + 0.15), Math.sin(a) * (R0 + 0.15) + R0 - 0.5, z, 0.45, { seg: 6, rings: 4 }); } m.emissive(0);
    return { cols: [{ t: 'box', x: R0 + 0.2, z: 0, hx: 0.5, hz: L / 2, y0: 0, y1: 6 }, { t: 'box', x: -R0 - 0.2, z: 0, hx: 0.5, hz: L / 2, y0: 0, y1: 6 }] };
  }, { hi: true });
  api.light(40, -64, 12, '#3aff8a', 0.4);
  for (const s of [1, -1]) E.art.push({ x: 40 + Math.cos(0.6) * 3.8 * s, z: -64 - Math.sin(0.6) * 3.8 * s, r: 1.2 });
  // ---- joke signs ----
  const signs = ['PLEASE DO NOT\nTAP ON THE GLASS', 'FEED ONCE\nA DAY', 'NO FISHING\n(EXCEPT YOU)', 'SCHOOL\nZONE'];
  signs.forEach((t, i) => { const a = i / 4 * TAU + 0.62, x = Math.sin(a) * 74, z = Math.cos(a) * 74, c = ['#5af2e8', '#ff7ac8', '#ffd84a', '#a88aff'][i]; api.sign(t, x, z, { yaw: a + Math.PI, h: 1.1, y: 1.8, post: true, maxW: 3.4, style: { bg: '#0e1a30', fg: c, border: '#ffffff' }, glow: c }); });
  // ---- the glass walls: dark posts, a silicone foot, glowing top rails, glare streaks on the glass ----
  const poly = [], NW = 32; for (let i = 0; i < NW; i++) { const a = i / NW * TAU; poly.push([Math.sin(a) * R, Math.cos(a) * R]); }
  E.walls = poly;
  for (let i = 0; i < NW; i++) {
    const a0 = poly[i], b0 = poly[(i + 1) % NW], seg = Math.hypot(b0[0] - a0[0], b0[1] - a0[1]), x = (a0[0] + b0[0]) / 2, z = (a0[1] + b0[1]) / 2, yaw = Math.atan2(b0[0] - a0[0], b0[1] - a0[1]), c = i % 2 ? '#5af2e8' : '#ff9ae0';
    CartScene.mesh(api, x, z, yaw, m => {
      m.color('#141c2a').shine(2); m.limb(0, 0, -seg / 2, 0, 7.5, -seg / 2, 0.22, 0.22, { seg: 6 }); m.roundBox(0, 0.3, 0, 0.6, 0.6, seg, 0.15);
      m.color(c, 1); m.roundBox(0, 7.55, 0, 0.32, 0.24, seg + 0.3, 0.1); m.roundBox(-0.32, 0.62, 0, 0.06, 0.08, seg, 0.03);
      m.color('#cfefff', 0.32); for (let j = 0; j < 2; j++) { const zz = (j ? 0.22 : -0.18) * seg; m.push(); m.tf(-0.05, 3.8, zz, 0, 0.55, 0); m.box(0, 0, 0, 0.03, 4.6 - j * 1.2, 0.16 + j * 0.06); m.pop(); }
      m.emissive(0).shine(0);
    }, { noAO: true });
    api.glow(a0[0], 7.6, a0[1], 1.6, c);
  }
  // the crowd outside the glass, pressed against it to watch
  for (const [a, yaw] of [[0.0, Math.PI], [Math.PI * 0.66, 0], [Math.PI * 1.33, 0]]) { const x = Math.sin(a) * 114, z = Math.cos(a) * 114; E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 22, 3, rng)); api.light(x * 0.9, z * 0.9, 18, '#ff9ae0', 0.4); }
  E.heroes.push({ type: 'sparklepony', x: 14, z: 10, yaw: 0.8, anim: 'cheer' }, { type: 'burney', x: -66, z: 58, yaw: 2.0, anim: 'photo' }, { type: 'furry', x: 64, z: 28, yaw: -1.4, anim: 'wave' }, { type: 'playaartist', x: -10, z: -16, yaw: 3.0, anim: 'dance' });
  // ---- objective spots ----
  E.zones = [{ x: 0, z: 16, r: 9, name: 'THE CASTLE GATE' }, { x: -48, z: 64, r: 9, name: 'THE HELMET' }, { x: 72, z: 34, r: 9, name: 'THE SHELL' }, { x: 40, z: -64, r: 9, name: 'THE LOG' }];
  for (let i = 0; i < 44; i++) { const a = rng() * TAU, r = 14 + Math.sqrt(rng()) * 76; E.orbSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.flagSpots = [{ x: 0, z: 28 }, { x: -40, z: -20 }, { x: 40, z: 10 }];
  E.captures = [{ x: -60, z: -40, r: 9 }, { x: 60, z: -40, r: 9 }, { x: 0, z: 76, r: 9 }];
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.26, r = i % 2 ? 32 : 72; E.gifts.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  for (let i = 0; i < 30; i++) { const a = i / 30 * TAU + rng() * 0.2, r = 18 + ((i * 7) % 10) * 7.5; Q.fishSpots.push({ x: Math.sin(a) * r, z: Math.cos(a) * r }); }
  E.spawn = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; E.spawn.push({ x: Math.sin(a) * 50, z: Math.cos(a) * 50, yaw: a + Math.PI }); }
  // the fish prototype (moving copies are made by the game; one draw per detail level)
  api.instanceProto('aqm_fish', m => AQM_fishMesh(m), { r: 1.3, near: 40, mid: 150, lo: true, noAO: true, shadow: false });
  return this.finish(E);
};

/* ---------------- the arena's rules: bubbles, the mirror ball beams, the game's AI / HUD / drawing ---------------- */
CART_ARENA_RULES.aquarium = {
  music: 'kart3',
  onLoad(s) { if (!s.aqm) s.aqm = { t: 0 }; },
  onUpdate(s, dt, racing) { const G = s.aqm; if (G) G.t += dt; },
  onStep(s, k, dt, racing) {
    // SCHOOL OF GLITTER: every fish carried costs a little top speed
    if (k.aqm && s.objective === 'shoal') k.vmax = k.aqm.v0 * (1 - AQM_C.SLOW * k.aqm.school.length);
  },
  onHit(s, k, kind, src, o) { if (s.objective === 'shoal' && s.aqm && s.aqm.fish) AQM_scatter(s, k, src); },
  aiGoal(s, k, nearestRival) { return s.objective === 'shoal' && s.aqm && s.aqm.fish ? AQM_aiGoal(s, k) : null; },
  hud(s, ctx, W, H, top, left) {
    const G = s.aqm, k = s.player; if (!G || !G.fish || !k || !k.aqm) return;
    const portrait = H > W, y = portrait ? top + 58 + 5 * 17 + 14 : top + 62, n = k.aqm.school.length;
    if (s.state !== 'race') return;
    if (G.t < 7) BurnsUI.text(ctx, 'DRIVE THROUGH MIRROR FISH · RAM A RIVAL\'S SCHOOL TO STEAL IT', W / 2, y, portrait ? 10 : 12, '#bff4ff', { glow: '#1a8aa0' });
    else if (k.aqm.threat > 0) BurnsUI.text(ctx, 'A RIVAL IS ON YOUR TAIL!', W / 2, y, 13, Math.floor(s.time * 6) % 2 ? '#ff6a9a' : '#ffffff', { glow: '#ff2060' });
    else BurnsUI.text(ctx, 'YOUR SCHOOL: ' + n + (n === 1 ? ' FISH' : ' FISH') + (n ? ' · SPEED -' + Math.round(AQM_C.SLOW * n * 100) + '%' : ''), W / 2, y, 12, '#bff4ff', { ui: true });
    // the arrow: the nearest loose fish, else the juiciest rival school
    const t = AQM_target(s, k, AQM_P);
    if (t) { const p = AQM_P.proj || (AQM_P.proj = {}); if (s.R.project(AQM_P.tx, 3.2, AQM_P.tz, W, H, p)) { const ax = clamp(p.x, 30, W - 30), ay = clamp(p.y, 70, H - 120); ctx.save(); ctx.translate(ax, ay); ctx.fillStyle = t === 1 ? '#bff4ff' : AQM_P.col; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.restore(); } }
  },
  draw(s, R, S, t) {
    const E = s.E, cam = s.cam, fx = s.fx, H = s.terrain, k = s.player;
    // the mirror ball: a halo, and six beams sweeping the gravel with a light spot where each lands
    R.bbs.bb(0, 30, 0, 12, 12, S.glow, [0.75, 0.9, 1], 0.35, true);
    for (let i = 0; i < 6; i++) {
      const a = t * 0.35 * (i % 2 ? 1 : -1) + i * 1.047, r = 22 + 30 * (0.5 + 0.5 * Math.sin(t * 0.21 + i * 1.9)), gx = Math.sin(a) * r, gz = Math.cos(a) * r;
      const dx = gx, dy = -30, dz = gz, L = Math.hypot(dx, dy, dz), col = i % 3 === 0 ? [1, 0.55, 0.9] : i % 3 === 1 ? [0.4, 1, 0.95] : [0.7, 0.6, 1];
      R.bbs.streak(gx * 0.5, 15, gz * 0.5, dx / L, dy / L, dz / L, L, 1.6, S.streak, col, 0.16);
      R.flat.flat(gx, H.height(gx, gz) + 0.1, gz, 9, 9, 0, S.glow, col, 0.5, true);
      if (Math.random() < 0.15) fx.glint(gx + (Math.random() - 0.5) * 4, 0.5 + Math.random() * 2, gz + (Math.random() - 0.5) * 4, '#ffffff');
    }
    // caustics around the player: slow rings of light on the gravel
    if (k) {
      const cx = Math.round(k.x / 26) * 26, cz = Math.round(k.z / 26) * 26;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const px = cx + i * 26 + Math.sin(t * 0.23 + i * 2 + j) * 5, pz = cz + j * 26 + Math.cos(t * 0.19 + j * 2 - i) * 5;
        R.flat.flat(px, H.height(px, pz) + 0.12, pz, 22, 22, t * 0.1 + i + j * 2, S.ring, (i + j) & 1 ? [0.5, 0.9, 1] : [1, 0.6, 0.9], 0.09 + 0.04 * Math.sin(t * 0.9 + i * 3 + j), true);
      }
    }
    // air-stone bubble curtains
    for (const q of E.aqm.stones) {
      const d2 = (q.x - cam.x) * (q.x - cam.x) + (q.z - cam.z) * (q.z - cam.z); if (d2 > 120 * 120) continue;
      if (Math.random() < 0.7) fx.add(q.x + (Math.random() - 0.5) * 1.6, 0.6, q.z + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 0.5, 3 + Math.random() * 1.5, (Math.random() - 0.5) * 0.5, 4.5, 0.25 + Math.random() * 0.3, 0.6, [0.8, 0.95, 1], 0.7, 'ring', 1, Math.random() * 6, 1);
      R.bbs.streak(q.x, 9, q.z, 0, 1, 0, 18, 2.6, S.streak, [0.6, 0.9, 1], 0.12);
    }
    // the game: glowing fish (each school in its car's colour)
    const G = s.aqm; if (!G || !G.fish) return;
    for (const f of G.fish) {
      if (!f.d.on) continue;
      const dx = f.x - cam.x, dz = f.z - cam.z; if (dx * dx + dz * dz > 110 * 110) continue;
      if (f.owner) { const c = f.owner.aqm.rgb; R.bbs.bb(f.x, f.y, f.z, 3.0, 3.0, S.glow, c, 0.45, true); }
      else { R.bbs.bb(f.x, f.y, f.z, 3.4, 3.4, S.glow, [0.8, 0.95, 1], 0.4 + 0.2 * Math.sin(t * 4 + f.ph), true); R.flat.flat(f.x, H.height(f.x, f.z) + 0.1, f.z, 3.2, 3.2, t + f.ph, S.ring, [0.75, 0.95, 1], 0.35, true); if (Math.random() < 0.06) fx.glint(f.x + (Math.random() - 0.5), f.y + 0.4, f.z + (Math.random() - 0.5), '#ffffff'); }
    }
    for (const q of s.karts) if (q.aqm && q.aqm.school.length && q._in) R.flat.flat(q.x, q.y + 0.12, q.z, 7, 7, -t, S.ring, q.aqm.rgb, 0.5, true);
  },
  lights(s, add) {
    add(0, 9, 0, 22, [0.5, 0.95, 1], 0.8, 1.5);
    const G = s.aqm; if (!G || !G.fish) return;
    let n = 0; for (const q of s.karts) { if (!q.aqm || q.aqm.school.length < 3) continue; const f = q.aqm.school[q.aqm.school.length >> 1]; add(f.x, f.y + 1, f.z, 9, q.aqm.rgb, 0.7, 1.2); if (++n >= 4) break; }
  }
};

/* ---------------- SCHOOL OF GLITTER ---------------- */
// where a fish can go: loose fish wander between these spots (avoiding the castle)
function AQM_wanderPick(s, f) { const P = s.E.aqm ? s.E.aqm.fishSpots : s.E.orbSpots, q = P[(s.rng() * P.length) | 0]; f.wx = q.x + (s.rng() - 0.5) * 8; f.wz = q.z + (s.rng() - 0.5) * 8; }
function AQM_free(s, f, x, z) { f.owner = null; f.state = 'free'; f.x = x; f.z = z; f.d.on = true; f.speed = 2.6 + s.rng() * 1.4; AQM_wanderPick(s, f); }
// a fish joins k's school (at the tail)
function AQM_join(s, k, f) { f.owner = k; f.state = 'owned'; f.lock = AQM_C.LOCK_T; f.cool = 0; f.from = null; k.aqm.school.push(f); k.score = k.aqm.school.length; }
// k was hit: a third of its school (from the tail) scatters
function AQM_scatter(s, k, src) {
  const Sc = k.aqm && k.aqm.school; if (!Sc || !Sc.length || (s.obj && s.obj.ended)) return;
  // one fish; a rival who landed the hit gets them, otherwise they scatter loose
  const n = 1, thief = src && src !== k && src.aqm && !src.out ? src : null;
  for (let i = 0; i < n; i++) {
    const f = Sc.pop();
    if (thief) { AQM_join(s, thief, f); continue; }
    const a = s.rng() * TAU, sp = 7 + s.rng() * 5;
    f.owner = null; f.state = 'scatter'; f.t = 0.9; f.from = k; f.cool = 1.6; f.vx = Math.sin(a) * sp + k.vx * 0.3; f.vz = Math.cos(a) * sp + k.vz * 0.3;
  }
  k.score = Sc.length;
  if (thief && thief.player) s.banner('+' + n + ' FISH SWIM TO YOU', '#7aff8a', 0.9, null, true);
  s.fx.burst(k.x, k.y + 1.5, k.z, 'star', 12, '#dff4ff'); s.log('shoalscatter', { k: k.id, n, by: src && src.id });
  if (k.player) { s.banner('-' + n + (thief ? ' FISH STOLEN' : ' FISH SCATTERED'), '#ff9ae0', 1.1); Sound.play('splash', { vol: 0.6, pitch: 1.2 }); }
}
// rival a cuts b's school at fish j: a takes j..end
function AQM_cut(s, a, b, j) {
  const Sb = b.aqm.school, n = Sb.length - j;
  for (let i = j; i < Sb.length; i++) AQM_join(s, a, Sb[i]);
  Sb.length = j; b.score = j; a.aqm.cutT = 2.0; b.aqm.lostT = 3.0;
  const f = a.aqm.school[a.aqm.school.length - 1];
  s.fx.burst(f.x, f.y, f.z, 'star', 16, a.car.col); s.fx.ring(f.x, f.y, f.z, 4, '#ffffff', 0.4);
  s.log('shoalcut', { k: a.id, from: b.id, n, player: !!a.player, victim: !!b.player });
  if (a.player) { s.banner('SNIP! +' + n + ' FISH', '#7aff8a', 1.3, 'stolen from ' + b.car.name); Sound.play('kartLap', { vol: 0.7, pitch: 1.2 }); Sound.play('cartSparkle', { vol: 0.6 }); }
  else if (b.player) { s.banner('YOUR SCHOOL WAS CUT! -' + n, '#ff6a9a', 1.4, a.car.name + ' took them'); Sound.play('powerdown', { vol: 0.6, pitch: 1.3 }); s.shakeIt(0.3); }
  else if (n >= 4) s.banner(a.car.name + ' STEALS ' + n + ' FISH', '#ff9a3a', 1.0, null, true);
}
// the HUD arrow target: 1 = a loose fish (AQM_P.tx/tz), 2 = a rival's school (AQM_P.col)
function AQM_target(s, k, out) {
  const G = s.aqm; let bd = 1e9, kind = 0;
  for (const f of G.fish) { if (f.state !== 'free') continue; const d = Math.hypot(f.x - k.x, f.z - k.z); if (d < bd) { bd = d; out.tx = f.x; out.tz = f.z; kind = 1; } }
  if (bd < 45) return kind;
  let bs = 0;
  for (const q of s.karts) { if (q === k || !q.aqm) continue; const n = q.aqm.school.length; if (n < 2) continue; const f = q.aqm.school[1], d = Math.hypot(f.x - k.x, f.z - k.z), sc = n / (d + 25); if (sc > bs) { bs = sc; out.tx = f.x; out.tz = f.z; out.col = q.car.col; kind = 2; } }
  return kind;
}
// AI: the best of the loose fish near it and the rival schools worth cutting (a big school mostly avoids fights)
function AQM_aiGoal(s, k) {
  const G = s.aqm, my = k.aqm.school.length;
  let best = null, bs = 0, bx = 0, bz = 0;
  for (const f of G.fish) {
    if (f.state !== 'free' && !(f.state === 'scatter' && f.from !== k)) continue;
    const d = Math.hypot(f.x - k.x, f.z - k.z), sc = 1 / (d + 8) * (1 + (k.slot * 0.37 + f.ph) % 0.4);
    if (sc > bs) { bs = sc; best = f; bx = f.x + Math.sin(f.yaw) * f.speed * 0.5; bz = f.z + Math.cos(f.yaw) * f.speed * 0.5; }
  }
  for (const q of s.karts) {
    if (q === k || !q.aqm || q.out) continue; const Sq = q.aqm.school, n = Sq.length; if (n < 2) continue;
    // aim at an early fish of the school (cuts the most), led a little
    const j = 1, f = Sq[j], d = Math.hypot(f.x - k.x, f.z - k.z);
    const sc = (n - j) / (d + 14) * (my >= 10 ? 0.35 : 0.75) * (q.player ? 1.1 : 1);
    if (sc > bs) { bs = sc; best = f; bx = f.x + q.vx * 0.25; bz = f.z + q.vz * 0.25; }
  }
  return best ? { goal: [bx, bz] } : null;
}
CART_OBJECTIVES.shoal = {
  name: 'SCHOOL OF GLITTER', short: 'Biggest school of mirror fish',
  desc: 'Drive through mirror fish to grow a school behind you. Ram a rival\'s school to cut it and steal the rest; a hit steals a fish. First to 18.',
  time: 100, goal: 18, unit: ' fish',
  fx: {
    init(s) {
      const C = AQM_C, I = s.W.instancer(), G = s.aqm = s.aqm || { t: 0 };
      G.fish = []; G.releaseT = 3; G.released = C.START_FREE;
      const spots = s.E.aqm ? s.E.aqm.fishSpots : s.E.orbSpots;
      for (let i = 0; i < C.N; i++) {
        const d = I.dyn('aqm_fish'); if (!d) break;
        const f = { d, x: 0, y: C.FISH_Y, z: 0, yaw: 0, owner: null, state: 'free', lock: 0, cool: 0, from: null, vx: 0, vz: 0, t: 0, ph: i * 1.37, speed: 3, wx: 0, wz: 0 };
        if (i < C.START_FREE) { const q = spots[i % spots.length]; AQM_free(s, f, q.x + (s.rng() - 0.5) * 6, q.z + (s.rng() - 0.5) * 6); f.yaw = s.rng() * TAU; }
        else { f.state = 'reserve'; d.on = false; f.x = 0; f.z = 0; }
        G.fish.push(f);
      }
      for (const k of s.karts) { const c = burnsRGBf(k.car.col); k.aqm = { school: [], v0: k.vmax, rgb: c, tint: [0.55 + c[0] * 0.45, 0.55 + c[1] * 0.45, 0.55 + c[2] * 0.45], cutT: 0, lostT: 0, threat: 0 }; k.score = 0; }
    },
    update(s, dt) {
      const C = AQM_C, G = s.aqm, K = s.karts, t = s.raceT || 0;
      // the castle releases its fish, one at a time, out of the gate
      if (G.released < G.fish.length) { G.releaseT -= dt; if (G.releaseT <= 0) { G.releaseT = C.RELEASE_T; const f = G.fish[G.released++]; AQM_free(s, f, 0, 8.5); f.yaw = 0; f.wx = (s.rng() - 0.5) * 30; f.wz = 30 + s.rng() * 20; s.fx.burst(0, 2, 9, 'star', 8, '#bff4ff'); } }
      for (const k of K) { const A = k.aqm; if (A.cutT > 0) A.cutT -= dt; if (A.lostT > 0) A.lostT -= dt; A.threat = 0; }
      for (const f of G.fish) {
        if (f.state === 'reserve') continue;
        if (f.lock > 0) f.lock -= dt; if (f.cool > 0) f.cool -= dt;
        const d = f.d;
        if (f.state === 'owned') {
          const k = f.owner, Sc = k.aqm.school, i = Sc.indexOf(f);
          let tx, tz, ty;
          if (i <= 0) { const back = (k.M ? k.M.len * 0.5 : 2.2) + 1.0; tx = k.x - Math.sin(k.yaw) * back; tz = k.z - Math.cos(k.yaw) * back; ty = k.y + C.FISH_Y; }
          else { const p = Sc[i - 1]; tx = p.x; tz = p.z; ty = p.y; }
          let dx = f.x - tx, dz = f.z - tz, L = Math.hypot(dx, dz);
          const sp = i <= 0 ? 0.4 : C.SPACING;
          if (L > sp) { f.x = tx + dx / L * sp; f.z = tz + dz / L * sp; } else { f.x += (tx - f.x) * Math.min(1, dt * 2); f.z += (tz - f.z) * Math.min(1, dt * 2); }
          if (L > 0.05) f.yaw = Math.atan2(tx - f.x, tz - f.z) || f.yaw;
          f.y += (ty + Math.sin(t * 5 + i * 0.8) * 0.18 - f.y) * Math.min(1, dt * 6);
          d.x = f.x + Math.cos(f.yaw) * Math.sin(t * 7 + i * 0.9) * 0.25; d.z = f.z - Math.sin(f.yaw) * Math.sin(t * 7 + i * 0.9) * 0.25; d.y = f.y - 0.1; d.yaw = f.yaw + Math.sin(t * 9 + i) * 0.22; d.s = 1;
          const T = k.aqm.tint; d.tr = T[0]; d.tg = T[1]; d.tb = T[2];
          continue;
        }
        if (f.state === 'scatter') {
          f.x += f.vx * dt; f.z += f.vz * dt; f.vx *= Math.exp(-2.2 * dt); f.vz *= Math.exp(-2.2 * dt); f.t -= dt;
          f.y += (C.FISH_Y + 1.2 - f.y) * Math.min(1, dt * 3);
          if (f.t <= 0) { f.state = 'free'; f.speed = 2.6 + s.rng() * 1.4; AQM_wanderPick(s, f); }
        } else {
          // loose: wander between spots, shy away from the nearest car, never through the castle or the glass
          let dx = f.wx - f.x, dz = f.wz - f.z, L = Math.hypot(dx, dz);
          if (L < 3) { AQM_wanderPick(s, f); dx = f.wx - f.x; dz = f.wz - f.z; L = Math.hypot(dx, dz); }
          let ax = dx / (L || 1), az = dz / (L || 1);
          for (const k of K) { const ex = f.x - k.x, ez = f.z - k.z, e2 = ex * ex + ez * ez; if (e2 < 64 && e2 > 0.01) { const e = Math.sqrt(e2); ax += ex / e * (8 - e) * 0.18; az += ez / e * (8 - e) * 0.18; } }
          const al = Math.hypot(ax, az) || 1, want = Math.atan2(ax / al, az / al);
          f.yaw += cartWrap(want - f.yaw) * Math.min(1, dt * 3);
          f.x += Math.sin(f.yaw) * f.speed * dt; f.z += Math.cos(f.yaw) * f.speed * dt;
          f.y += (C.FISH_Y + 0.4 + Math.sin(t * 2 + f.ph) * 0.5 - f.y) * Math.min(1, dt * 2);
        }
        const r = Math.hypot(f.x, f.z);
        if (r < 9.5) { f.x *= 9.5 / (r || 1); f.z *= 9.5 / (r || 1); }
        if (r > C.R - 4) { f.x *= (C.R - 4) / r; f.z *= (C.R - 4) / r; f.vx = -f.vx * 0.5; f.vz = -f.vz * 0.5; }
        d.x = f.x; d.y = f.y - 0.1; d.z = f.z; d.yaw = f.yaw + Math.sin(t * 6 + f.ph) * 0.18; d.s = 1; d.tr = 1; d.tg = 1; d.tb = 1;
        // collected by a car driving through it
        if (f.state === 'free' || (f.state === 'scatter' && f.t < 0.6)) for (const k of K) {
          if (k.out || (f.cool > 0 && f.from === k) || Math.abs(k.y + 1 - f.y) > 3.5) continue;
          const ex = k.x - f.x, ez = k.z - f.z; if (ex * ex + ez * ez > C.GRAB_R * C.GRAB_R) continue;
          AQM_join(s, k, f); s.log('shoal', { k: k.id, n: k.score });
          s.fx.burst(f.x, f.y, f.z, 'star', 8, '#dff4ff');
          if (k.player) { Sound.play('pick', { vol: 0.6, pitch: 1.2 + Math.min(0.5, k.score * 0.03) }); if (k.score === 1 || k.score % 5 === 0) s.banner('SCHOOL OF ' + k.score + '!', '#bff4ff', 0.9, null, true); }
          break;
        }
      }
      // cuts: a car touching a rival's school fish takes that fish and every one behind it
      for (const a of K) {
        if (a.out || a.aqm.cutT > 0 || a.spinT > 0 || a.flipT > 0) continue;
        for (const b of K) {
          if (b === a || b.aqm.lostT > 0) continue; const Sb = b.aqm.school; if (!Sb.length) continue;
          let cut = -1;
          for (let j = 1; j < Sb.length; j++) {   // the fish right behind the car is the school's guard: it can't be cut
            const f = Sb[j], ex = a.x - f.x, ez = a.z - f.z, e2 = ex * ex + ez * ez;
            if (e2 < 64 && b.player) b.aqm.threat = 1;
            if (f.lock > 0 || e2 > C.CUT_R * C.CUT_R || Math.abs(a.y + 1 - f.y) > 3) continue;
            cut = j; break;
          }
          if (cut >= 0) { AQM_cut(s, a, b, cut); break; }
        }
      }
      let best = 0; for (const k of K) if (k.score > best) best = k.score;
      return best >= CART_OBJECTIVES.shoal.goal;
    },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || (b.hitsDealt - a.hitsDealt) || (a.slot - b.slot)); },
    score(k) { return k.score | 0; }
  }
};

/* ---------------- registration ---------------- */
CART_ARENAS.push({
  id: 'aquarium', name: 'THE MIRROR TANK', sub: 'A giant glowing fish tank: mirror fish, a sunken castle, a mirror ball', objectives: ['shoal', 'vibe', 'glow'],
  col: '#7ad8ff', tod: 'night',
  blurb: 'An art-installation aquarium the size of a camp. Candy gravel, glass walls, a mirror castle in the middle and a school of mirror fish waiting for a leader.'
});
var CART_SECRET_LEVELS = (typeof CART_SECRET_LEVELS !== 'undefined' && CART_SECRET_LEVELS) || {};
CART_SECRET_LEVELS.fish = { arena: 'aquarium', game: 'shoal' };
// the menu card icon: a mirror fish with bubbles
CART_ARENA_ICONS.aquarium = (ctx, s, t, col) => {
  ctx.save(); ctx.translate(-s * 0.08, Math.sin(t * 2) * s * 0.05);
  ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.36, 0, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 0.9, -s * 0.32); ctx.lineTo(-s * 0.82, 0); ctx.lineTo(-s * 0.9, s * 0.32); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, s * 0.55, s * 0.36, 0, 0, TAU); ctx.clip(); ctx.fillStyle = 'rgba(255,255,255,0.45)';
  for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) if ((i + j) & 1) ctx.fillRect(i * s * 0.16, j * s * 0.16, s * 0.15, s * 0.15);
  ctx.restore();
  ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(s * 0.3, -s * 0.08, s * 0.07, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.5, s * 0.06);
  for (let i = 0; i < 3; i++) { const ph = (t * 0.5 + i * 0.33) % 1; ctx.globalAlpha = 1 - ph; ctx.beginPath(); ctx.arc(s * 0.6 + Math.sin(t * 3 + i) * s * 0.05, -s * 0.2 - ph * s * 0.7, s * (0.06 + i * 0.03), 0, TAU); ctx.stroke(); }
  ctx.globalAlpha = 1;
};
