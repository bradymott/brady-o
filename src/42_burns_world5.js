/* ============================================================
   BRADY-O BURNS — World 5: COSTCO SOUL TRADING CO. (midday -> golden afternoon)
   A parody gifting "warehouse" camp (our own design; the name is a nod).
   Brady meets BISCUIT, a platonic burner buddy, who helps him find out
   where the fire-breathing octopus art car roams.
   Missions (Burn Tokens):
     member    Membership Card        photo on the X + the gifting quiz (choice UI)
     gary      Gary Got Snatched      catch Snatchy Steve, rescue Biscuit's cooler -> Biscuit joins
     sprint    Sample Line Sprint     6 free samples in 40 s (one on the pickle jar)
     pallets   Stack the Pallets      ride the forklift pallets up Aisle 99 for the last ice
     escort    The Cart Chute         walk Biscuit up the chute through a cart avalanche (set piece)
     boss      The Barter Baron       boss: a huckster on a forklift ("everything has a price")
     lookout   The Overstock Lookout  climb the tower, spot El Pulpo's fire on the horizon -> finish
   ============================================================ */

const BW5 = {
  ROWS: [16, 30, 44], FRONT: 56, BACK: -86,
  DOCK: { x: -29, z: -112, r: 19 }, TOWER: { x: 34, z: -134 }, RET: { x: 0, z: -79 },
  CHUTE: { z0: -70, z1: -30, h: 4 },
  BISCUIT_PIC: { x: 24, z: 92 },
  state: null
};
BW5.SKY_A = Object.assign({}, BURNS_PALETTES.day, { zen: '#2a74e0', mid: '#7ab8f4', midK: 0.45, hor: '#dcf2ff', fog: '#ecdcc4', fogD: 0.0048, haze: 0.45, sun: [150, 64], sunCol: '#fff8e8', key: '#fff2dc', keyK: 0.95, sky: '#c8e0f8', gnd: '#d8b894', mtnCol: '#8a90b4', emB: 1.15, rim: '#e8f8ff', clouds: 0.35, cloudCol: '#ffffff' });
BW5.SKY_B = Object.assign({}, BURNS_PALETTES.day, { zen: '#3656b8', mid: '#e89ab8', midK: 0.35, hor: '#ffc690', fog: '#f0c8a0', fogD: 0.006, haze: 0.62, sun: [238, 18], sunCol: '#ffd29a', sunSize: 0.0026, key: '#ffcc94', keyK: 0.95, sky: '#d4b8c8', gnd: '#c89878', mtnCol: '#7a5a7a', emB: 1.25, rim: '#ffd0a0', clouds: 0.45, cloudCol: '#ffd8c0' });
BW5.chuteY = z => z >= BW5.CHUTE.z1 ? 0 : z <= BW5.CHUTE.z0 ? BW5.CHUTE.h : BW5.CHUTE.h * (BW5.CHUTE.z1 - z) / (BW5.CHUTE.z1 - BW5.CHUTE.z0);

BurnsWorlds.register({
  id: 5, name: 'Costco Soul Trading Co.', sub: 'The great gifting warehouse',
  sky: BW5.SKY_A, sky2: BW5.SKY_B, tod: 0,
  music: 'burns_w5',
  bounds: [-128, -172, 128, 152],
  spawn: { x: 0, y: 0, z: 140, yaw: Math.PI },
  ground: { base: '#dcb890', crack: 0.3, mottle: 0.35, res: 0.5 },
  dust: 0.8,
  missions: [
    { id: 'member', name: 'Membership Card', short: 'Get carded by Marge', type: 'custom', giver: 'marge', start: 'manual', marker: { x: -7, z: 64 },
      desc: 'Membership is free, lifetime and mandatory. Stand on the X for your photo, then pass Marge\'s gifting quiz.', hint: 'Membership desk at the warehouse entrance',
      onComplete(g) { BW5.openTurnstiles(g); g.setTod(Math.max(g.tod, 0.14), 0.04); } },
    { id: 'gary', name: 'Gary Got Snatched', short: 'Catch the cooler thief', type: 'custom', giver: 'biscuit', start: 'manual', marker: { x: 0, z: 88 },
      desc: 'Snatchy Steve stole Gary, Biscuit\'s emotional support cooler. He runs laps of the parking lot. Spin him, then grab Gary.', hint: 'Parking lot, Biscuit is at the picnic table',
      onComplete(g) { BW5.biscuitJoins(g); g.setTod(Math.max(g.tod, g.tod + 0.14), 0.04); } },
    { id: 'sprint', name: 'Sample Line Sprint', short: 'Grab 6 samples', type: 'collect', count: 6, time: 40, giver: 'dot', start: 'manual', requires: ['member'], progressLabel: 'Samples', marker: { x: -6.5, z: 38 },
      desc: 'Six free samples, forty seconds. It\'s not a race. It\'s absolutely a race. One sits on the giant pickle jar.', hint: 'Dot\'s sample cart, front of the Bulk Aisle', lockedDesc: 'Members only. Get carded first.',
      onStart(g) { for (const P of g.pickups.items) if (P.mission === 'sprint') P.taken = false; },
      onComplete(g) { const d = g.actor('dot'); if (d) d.say('SIX! You\'re bulk-buying at LIFE!', 3); g.setTod(Math.max(g.tod, g.tod + 0.14), 0.04); } },
    { id: 'pallets', name: 'Stack the Pallets', short: 'Fetch the ice from Aisle 99', type: 'find', giver: 'fran', start: 'manual', requires: ['member'], marker: { x: -28, z: -66 }, tokenAt: { x: -43, y: 13.2, z: -77.6 },
      desc: 'The last bag of ice on the playa sits on the top shelf of Aisle 99. The forklifts only go up and down. Forever. Ride them.', hint: 'Back of the warehouse, west side (Fran the forklift lady)', lockedDesc: 'Members only. Get carded first.',
      onComplete(g) { const f = g.actor('fran'); if (f) f.say('ICE! One sad, melting cube for everybody!', 3); g.setTod(Math.max(g.tod, g.tod + 0.14), 0.04); } },
    { id: 'escort', name: 'The Cart Chute', short: 'Get Biscuit up the Cart Chute', type: 'escort', companion: 'biscuit', giver: 'biscuit', start: 'manual', requires: ['member', 'gary'], target: { x: 0, z: -78, r: 5 }, failOnFaint: true, marker: { x: 0, z: -50 },
      desc: 'Rhonda at Returns knows every art car on the playa. She works at the top of the Cart Chute. Walk Biscuit up it. Carts come down like a waterfall: spin them away.', hint: 'North end of the Bulk Aisle', lockedDesc: 'Rescue Gary and get carded first.',
      onStart(g) { BW5.chuteStart(g); },
      onFail(g) { BW5.chuteReset(g); },
      onComplete(g) { BW5.chuteDone(g); g.setTod(Math.max(g.tod, g.tod + 0.14), 0.04); } },
    { id: 'boss', name: 'The Barter Baron', type: 'boss', start: 'manual', requires: ['escort'], tokenDirect: true, short: 'Defeat the Barter Baron!', marker: { x: -29, z: -112 },
      desc: 'He sits on the Overstock lookout gate and wants a trade for everything. Make him crash his forklift, then bonk him.', hint: 'The loading dock, out the back west door', lockedDesc: 'Talk to Rhonda at Returns first.' },
    { id: 'lookout', name: 'The Overstock Lookout', type: 'climb', start: 'auto', requires: ['boss'], tokenDirect: true, short: 'Climb the Overstock lookout', target: { x: 34, z: -134, r: 3.6, y: 25.6 }, marker: { x: 34, z: -134 },
      desc: 'Climb the tower of overstock and look for fire on the horizon.', hint: 'Out the back east door', lockedDesc: 'The Barter Baron is sitting on the gate.',
      onComplete(g) { BW5.finale(g); } }
  ],
  build(api, g) {
    const R = api.rng;
    BW5.state = { introDone: !!BurnsSave.flag(5, 'intro'), lifts: [], turn: [], turnOpen: false, carts: [], gary: null, chute: { on: false, hits: 0 }, photo: false, quiz: 0 };
    const S = BW5.state;
    /* ---------------- ground paint ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 150; i++) { const [px, pz] = P(R.range(-128, 128), R.range(-172, 152)), r = R.range(2, 10) * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; g2.addColorStop(0, dark ? 'rgba(150,110,80,0.22)' : 'rgba(250,230,200,0.25)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      // the warehouse floor: sealed concrete with painted aisle lines
      const [x0, z0] = P(-57, BW5.FRONT), [x1, z1] = P(57, BW5.BACK);
      c.fillStyle = 'rgba(176,170,168,0.92)'; c.fillRect(x0, z1, x1 - x0, z0 - z1);
      c.fillStyle = 'rgba(120,116,120,0.25)'; for (let x = -57; x < 57; x += 6) { const [a] = P(x, 0); c.fillRect(a, z1, 1, z0 - z1); }
      for (let z = BW5.BACK; z < BW5.FRONT; z += 6) { const [, b] = P(0, z); c.fillRect(x0, b, x1 - x0, 1); }
      c.strokeStyle = 'rgba(255,214,60,0.85)'; c.lineWidth = 0.35 * sc;
      for (const x of [-14.8, 14.8, -9.9, 9.9]) { const [a, b] = P(x, 50), [, d] = P(x, -60); c.beginPath(); c.moveTo(a, b); c.lineTo(a, d); c.stroke(); }
      c.strokeStyle = 'rgba(56,242,255,0.6)'; c.lineWidth = 0.5 * sc; for (const z of [2, -6]) { const [a, b] = P(-57, z), [d] = P(57, z); c.beginPath(); c.moveTo(a, b); c.lineTo(d, b); c.stroke(); }
      // the parking lot
      const [lx0, lz0] = P(-56, 112), [lx1, lz1] = P(56, 62);
      c.fillStyle = 'rgba(140,120,108,0.35)'; c.fillRect(lx0, lz0, lx1 - lx0, lz1 - lz0);
      c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 0.18 * sc;
      for (let x = -52; x <= 52; x += 4.5) for (const zz of [[66, 74], [100, 108]]) { const [a, b] = P(x, zz[0]), [, d] = P(x, zz[1]); c.beginPath(); c.moveTo(a, b); c.lineTo(a, d); c.stroke(); }
      // the membership photo X
      const [qx, qz] = P(5, 66); c.strokeStyle = 'rgba(255,79,216,0.95)'; c.lineWidth = 0.5 * sc; const k = 1.1 * sc; c.beginPath(); c.moveTo(qx - k, qz - k); c.lineTo(qx + k, qz + k); c.moveTo(qx + k, qz - k); c.lineTo(qx - k, qz + k); c.stroke();
      // loading dock + lookout pad
      const [dx, dz] = P(BW5.DOCK.x, BW5.DOCK.z), dr = BW5.DOCK.r * sc;
      const gd = c.createRadialGradient(dx, dz, dr * 0.2, dx, dz, dr * 1.05); gd.addColorStop(0, 'rgba(150,146,150,0.85)'); gd.addColorStop(0.95, 'rgba(140,136,140,0.75)'); gd.addColorStop(1, 'rgba(140,136,140,0)'); c.fillStyle = gd; c.beginPath(); c.arc(dx, dz, dr * 1.05, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,200,40,0.8)'; c.lineWidth = 0.6 * sc; c.setLineDash([2 * sc, 2 * sc]); c.beginPath(); c.arc(dx, dz, dr * 0.96, 0, TAU); c.stroke(); c.setLineDash([]);
    });
    api.road([[-128, 128], [128, 128]], 10, { tracks: [-2, 2] });
    api.road([[0, 128], [0, 62]], 8, { tracks: [-1.5, 1.5] });
    api.road([[0, BW5.BACK - 2], [0, -100], [-29, -100]], 7);
    api.road([[0, -100], [34, -104], [34, -116]], 6);
    /* ---------------- the warehouse shell ---------------- */
    BW5.buildShell(api);
    /* ---------------- shelving rows ---------------- */
    for (const sx of [-1, 1]) for (const rx of BW5.ROWS) {
      const x = sx * rx;
      BW5.shelfRun(api, x, 25, 42, 3, 2.3, 1000 + rx * 3 + (sx > 0 ? 1 : 0));
      BW5.shelfRun(api, x, -33, 54, 3, 2.3, 2000 + rx * 3 + (sx > 0 ? 1 : 0));
    }
    // aisle number signs hanging over the side aisles
    const aisleNames = [['AISLE 7\nBULK GLITTER', -23], ['AISLE 12\nSPARE GOGGLES', 23], ['AISLE 3\nEMOTIONAL SUPPORT', -37], ['AISLE 9\nZIP TIES (SOLD OUT)', 37], ['AISLE 0\nFREE HUGS (SAMPLE SIZE)', -51], ['AISLE 11\nMOOP BAGS', 51]];
    for (const [t, x] of aisleNames) for (const z of [44, -58]) api.sign(t, x, z, { y: 8.2, h: 1.1, post: false, yaw: z > 0 ? 0 : Math.PI, style: { bg: '#1a2a5a', fg: '#ffffff', size: 34, border: '#38f2ff' } });
    /* ---------------- outside: the street + camps ---------------- */
    BW5.buildStreet(api, g);
    /* ---------------- parking lot ---------------- */
    BW5.buildLot(api, g);
    /* ---------------- membership desk + turnstiles ---------------- */
    BW5.buildEntrance(api, g);
    /* ---------------- the Bulk Aisle: pickle jar, wipes pyramid, sample stations ---------------- */
    BW5.buildBulk(api, g);
    /* ---------------- the Cart Chute + Returns mezzanine ---------------- */
    BW5.buildChute(api, g);
    /* ---------------- Aisle 99: forklift pallets ---------------- */
    BW5.buildAisle99(api, g);
    /* ---------------- side aisles: hoarders, gift police, shoplifters ---------------- */
    BW5.buildAisles(api, g);
    /* ---------------- the loading dock (boss) + the Overstock lookout ---------------- */
    BW5.buildDock(api, g);
    BW5.buildTower(api, g);
    /* ---------------- the far horizon: El Pulpo, as seen from the lookout ---------------- */
    BW5.buildFarOcto(api);
    /* ---------------- puppets: carts + forklift ---------------- */
    BW5.makePuppets(g);
    api.marker('ware', 0, 0, 'Warehouse', { col: '#38f2ff' });
    api.marker('dock', BW5.DOCK.x, BW5.DOCK.z, 'Dock', { col: '#ffd84a' });
    api.marker('tower', BW5.TOWER.x, BW5.TOWER.z, 'Lookout', { col: '#ff9a4a' });
  },
  onStart(g) {
    const S = BW5.state;
    BW567K.speedHook(g);
    g.spinHit = (x, y, z, r) => BW5.spinCarts(g, x, y, z, r);
    S.garyP = g.actor('biscuit');
    if (g.missions.isDone('member')) BW5.openTurnstiles(g, true);
    if (g.missions.isDone('boss')) BW5.openToll(g, true);
    BW5.placeBiscuit(g);
    g.tod = Math.min(1, BurnsSave.tokenCount(5) * 0.14);
    if (!S.introDone) BW5.intro(g);
    else g.banner('COSTCO SOUL TRADING CO.', 'Gifting is not bartering. Bulk is a lifestyle.', { col: '#38f2ff' });
  },
  onRespawn(g) { const S = BW5.state; if (S.baron && !S.baron.defeated && S.bossOn) { S.baron.data.mode = 'drive'; S.baron.data.t = 3; } },
  update(g, dt) {
    BW567K.tick(g, dt);
    BW5.updateLifts(g, dt);
    BW5.updateTurnstiles(g, dt);
    BW5.updateGary(g, dt);
    BW5.updateCarts(g, dt);
    BW5.updateForklift(g, dt);
    const want = Math.min(1, BurnsSave.tokenCount(5) * 0.14);
    if (g.tod < want - 0.001 && g.todTarget === null) g.setTod(want, 0.03);
  },
  bw567Overlay(ctx, g) { BW5.drawLabels(ctx, g); }
});

/* ============================================================ builders ============================================================ */
BW5.buildShell = function (api) {
  const F = BW5.FRONT, B = BW5.BACK;
  // tall rounded walls (painted panels): front (with the entrance gap), sides and back (two doors)
  const wall = (x0, z0, x1, z1, h) => {
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0), cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    api.mesh(cx, cz, m => {
      m.lo = true;
      const n = Math.max(1, Math.round(len / 8)), seg = len / n;
      for (let i = 0; i < n; i++) { const z = -len / 2 + seg * (i + 0.5); m.color(i % 2 ? '#e8e2d6' : '#f2ede4'); BW567K.rbox(m, 0, h / 2, z, 1.0, h, seg - 0.12, 0.3); m.color('#38c8e8'); m.box(0.52, h - 0.6, z, 0.04, 0.5, seg - 0.6); m.color('#ff7a2a'); m.box(0.52, 0.5, z, 0.04, 0.4, seg - 0.6); }
      m.lo = false;
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.5, hz: len / 2, y0: 0, y1: h, cover: true }] };
    }, { yaw });
  };
  wall(-57.5, F, -9.5, F, 6); wall(9.5, F, 57.5, F, 6);
  wall(-57.5, F, -57.5, B, 6); wall(57.5, F, 57.5, B, 6);
  wall(-57.5, B, -37.5, B, 6); wall(-20.5, B, 20.5, B, 6); wall(37.5, B, 57.5, B, 6);
  // pillars + the striped canopy roof (no collider: it's shade)
  for (const x of [-10.5, 10.5, -57.5, 57.5]) for (const z of [44, 20, -4, -28, -52, -76]) {
    if (Math.abs(x) < 20 && z < -66) continue;
    BW567K.post(api, x, 0, z, Math.abs(x) > 50 ? 0.6 : 0.45, 18, Math.abs(x) > 50 ? '#d8d2c6' : '#ff8a2a', { gloss: 2, seg: 12, col: { camPass: true } });
  }
  api.mesh(0, -15, m => {
    m.lo = true;
    for (let i = 0; i < 12; i++) { const z = 71 - 5 - i * 12 - 15; m.color(i % 2 ? '#ff9a3a' : '#f4ecdc'); BW567K.rbox(m, 0, 18.2, z + 15, 118, 0.35, 10.4, 0.15); }
    m.color('#7a7a84'); for (const x of [-57.5, -10.5, 10.5, 57.5]) m.box(x, 17.9, 0, 0.3, 0.3, 142);
    m.lo = false;
    return { cols: [] };
  });
  // the giant facade sign
  api.mesh(0, F + 0.8, m => {
    m.color('#1f4fae').shine(2);
    for (const x of [-15, 15]) BW567K.rcyl(m, x, 0, 0, 0.6, 15, 0.2);
    BW567K.rbox(m, 0, 12, 0, 32, 5.6, 1.0, 0.45);
    m.color('#ff4a2a'); BW567K.rbox(m, 0, 14.95, 0.2, 31, 0.5, 1.0, 0.2); BW567K.rbox(m, 0, 9.05, 0.2, 31, 0.5, 1.0, 0.2);
    m.shine(0);
    const reg = BURNS_ATLAS.sign('COSTCO SOUL\nTRADING CO.', { bg: '#1f4fae', fg: '#ffffff', size: 64, glow: '#38f2ff', pad: 18, font: FONT_DISPLAY });
    m.color('#ffffff', 0.6); m.decal(0, 12, 0.52, Math.min(28, 4.8 * reg.aspect), Math.min(28, 4.8 * reg.aspect) / reg.aspect, reg); m.emissive(0);
    const sub = BURNS_ATLAS.sign('EST. WHENEVER  ·  MEMBERS: EVERYONE', { bg: '#ff4a2a', fg: '#ffffff', size: 36, pad: 10 });
    m.color('#ffffff', 0.3); m.decal(0, 8.2, 0.55, 14, 14 / sub.aspect, sub); m.emissive(0);
    m.color('#ffd84a', 1); for (let i = 0; i < 26; i++) { const t = i / 25; m.box(-15.6 + t * 31.2, 15.35, 0.55, 0.18, 0.18, 0.1); m.box(-15.6 + t * 31.2, 8.65, 0.55, 0.18, 0.18, 0.1); } m.emissive(0);
    return { cols: [{ t: 'cyl', x: -15, z: 0, r: 0.6, y0: 0, y1: 15 }, { t: 'cyl', x: 15, z: 0, r: 0.6, y0: 0, y1: 15 }] };
  });
  for (let i = 0; i < 12; i++) api.glow(-15 + i * 30 / 11, 15.4, F + 1.4, 0.7, i % 2 ? '#ffd84a' : '#38f2ff', { blink: 2 });
  // warm light pools inside under the canopy
  for (const x of [-37, -23, 0, 23, 37]) for (const z of [40, 16, -8, -32, -56]) api.light(x, z, 9, x === 0 ? '#ffe8c0' : '#c8e8ff', 0.22);
};

/* a shelving run along Z centred at (x, zc): length L, levels, level height lh */
BW5.shelfRun = function (api, x, zc, L, levels, lh, seed) {
  api.mesh(x, zc, m => {
    const rng = mulberry32(seed), D = 2.8, cols = [];
    const n = Math.max(1, Math.round(L / 6)), seg = L / n, H = levels * lh + 0.25;
    m.lo = true;
    // uprights (blue) + cross braces
    for (let i = 0; i <= n; i++) {
      const z = -L / 2 + i * seg;
      for (const sx of [-1, 1]) { m.color('#1f6fd0').shine(2); BW567K.rcyl(m, sx * (D / 2 - 0.1), 0, z, 0.1, H, 0.05); m.shine(0); cols.push({ t: 'cyl', x: sx * (D / 2 - 0.1), z, r: 0.12, y0: 0, y1: H, camPass: true }); }
      m.color('#4a8ae0'); for (let l = 0; l < levels; l++) m.beam(-D / 2 + 0.1, l * lh + 0.3, z, D / 2 - 0.1, (l + 1) * lh - 0.3, z, 0.05);
    }
    // levels: orange beams + wooden decking
    for (let l = 1; l <= levels; l++) {
      const y = l * lh;
      m.color('#ff7a1a').shine(2); for (const sx of [-1, 1]) BW567K.rbox(m, sx * (D / 2 - 0.1), y - 0.12, 0, 0.16, 0.22, L, 0.06); m.shine(0);
      m.color('#c8a070'); m.box(0, y - 0.05, 0, D - 0.3, 0.08, L - 0.1, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
      cols.push({ t: 'box', x: 0, z: 0, hx: D / 2, hz: L / 2, y0: y - 0.24, y1: y });
    }
    // goods
    for (let l = 0; l < levels; l++) {
      const y = l === 0 ? 0.02 : l * lh, maxH = Math.min(lh - 0.45, 1.5);
      let z = -L / 2 + 0.5;
      while (z < L / 2 - 0.8) {
        if (rng() < 0.22) { z += rng.range(0.6, 1.6); continue; }
        const gd = BW5.good(m, 0, y, z, rng, maxH, D - 0.5);
        const zc = z + gd.d / 2;
        if (gd.h > 0.3) cols.push({ t: 'box', x: gd.x || 0, z: zc - (z - z) + (gd.dz || 0), hx: gd.w / 2, hz: gd.d / 2, y0: y, y1: y + gd.h });
        z += gd.d + rng.range(0.15, 0.6);
      }
    }
    m.lo = false;
    return { cols };
  });
};
// one item of merch on a shelf at (x, y, z0 = front-most z of the item along the run). Returns its footprint.
BW5.good = function (m, x, y, z0, rng, maxH, maxW) {
  const k = rng();
  if (k < 0.34) { // cardboard boxes, sometimes two high
    const w = Math.min(maxW, rng.range(0.8, 1.6)), d = rng.range(0.7, 1.3), h = Math.min(maxH, rng.range(0.55, 1.0));
    m.color(rng.pick(['#c89a60', '#b88a50', '#d8aa70', '#c49058'])); BW567K.rbox(m, x, y + h / 2, z0 + d / 2, w, h, d, 0.05);
    m.color('#f0e4c4'); m.box(x, y + h + 0.004, z0 + d / 2, 0.16, 0.012, d - 0.02);
    m.color(rng.pick(BURNS_NEON)); m.box(x + w / 2 + 0.005, y + h * 0.55, z0 + d / 2, 0.01, h * 0.3, d * 0.5);
    if (h < maxH - 0.6 && rng() < 0.4) { const h2 = Math.min(0.5, maxH - h - 0.05); m.color('#d8b078'); BW567K.rbox(m, x, y + h + h2 / 2, z0 + d / 2, w * 0.8, h2, d * 0.8, 0.04); return { w, d, h: h + h2 }; }
    return { w, d, h };
  }
  if (k < 0.5) { // bulk tubs (glitter, trail mix, electrolytes)
    const r = 0.36, n = rng() < 0.5 ? 2 : 3, col = rng.pick(['#ff6ad0', '#ffd84a', '#7aff9a', '#9a7aff', '#ff8a3a']);
    const h = Math.min(maxH, 0.8);
    for (let i = 0; i < n; i++) { m.color(col); BW567K.rcyl(m, x + (i - (n - 1) / 2) * 0.78, y, z0 + r, r, h, 0.08); m.color('#f4f4f0'); BW567K.rcyl(m, x + (i - (n - 1) / 2) * 0.78, y + h, z0 + r, r * 1.02, 0.1, 0.04); }
    return { w: n * 0.78, d: r * 2, h: h + 0.1 };
  }
  if (k < 0.62) { // coolers
    const w = 0.95, d = 0.6, h = 0.55, col = rng.pick(['#2a8ac8', '#c83a2a', '#e8e8e8', '#2ab87a']);
    m.color(col).shine(2); BW567K.rbox(m, x, y + h / 2, z0 + d / 2, w, h, d, 0.08); m.color('#f4f4f0'); BW567K.rbox(m, x, y + h + 0.05, z0 + d / 2, w + 0.04, 0.1, d + 0.04, 0.04); m.shine(0);
    return { w, d, h: h + 0.1 };
  }
  if (k < 0.72) { // water jugs
    for (let i = 0; i < 3; i++) { m.color('#9ad8ff').shine(3); BW567K.rcyl(m, x + (i - 1) * 0.5, y, z0 + 0.25, 0.22, 0.6, 0.08); m.color('#2a6aff'); BW567K.rcyl(m, x + (i - 1) * 0.5, y + 0.6, z0 + 0.25, 0.08, 0.12, 0.03); m.shine(0); }
    return { w: 1.5, d: 0.5, h: 0.72 };
  }
  if (k < 0.8) { // giant plush playa bear
    const s = Math.min(1, maxH / 1.2), col = rng.pick(['#d89a60', '#ff9ad0', '#9adcff', '#c8a0ff']);
    m.color(col); BW567K.ellip(m, x, y + 0.42 * s, z0 + 0.45, 0.42 * s, 0.42 * s, 0.38 * s); BW567K.ball(m, x, y + 0.98 * s, z0 + 0.45, 0.28 * s);
    BW567K.ball(m, x + 0.2 * s, y + 1.2 * s, z0 + 0.45, 0.09 * s); BW567K.ball(m, x - 0.2 * s, y + 1.2 * s, z0 + 0.45, 0.09 * s);
    m.color('#1a1418'); m.box(x + 0.09 * s, y + 1.02 * s, z0 + 0.45 + 0.26 * s, 0.05, 0.05, 0.02); m.box(x - 0.09 * s, y + 1.02 * s, z0 + 0.45 + 0.26 * s, 0.05, 0.05, 0.02);
    return { w: 0.9 * s, d: 0.9, h: 1.25 * s };
  }
  if (k < 0.88) { // kiddie pools, stacked
    for (let i = 0; i < 3; i++) { m.color(['#38c8ff', '#ff6ad0', '#ffd84a'][i]); BW567K.torus(m, x, y + 0.1 + i * 0.16, z0 + 0.65, 0.5, 0.09, { seg: 12, tseg: 6 }); }
    return { w: 1.3, d: 1.3, h: 0.5 };
  }
  if (k < 0.94) { // inflatable flamingo
    const s = Math.min(1, maxH / 1.3);
    m.color('#ff7ab8').shine(2); BW567K.ellip(m, x, y + 0.35 * s, z0 + 0.5, 0.32 * s, 0.24 * s, 0.48 * s); BW567K.limb(m, x, y + 0.45 * s, z0 + 0.82, x, y + 1.05 * s, z0 + 0.9, 0.07 * s, 0.06 * s); BW567K.ball(m, x, y + 1.1 * s, z0 + 0.95, 0.12 * s);
    m.color('#2a2a2a'); BW567K.limb(m, x, y + 1.1 * s, z0 + 1.02, x, y + 1.0 * s, z0 + 1.16, 0.04 * s, 0.02); m.shine(0);
    return { w: 0.7, d: 1.0, h: 1.2 * s };
  }
  // LED hula hoops
  for (let i = 0; i < 4; i++) { m.color(BURNS_NEON[i % 7], 0.6); BW567K.torus(m, x, y + 0.05 + i * 0.06, z0 + 0.5, 0.45, 0.025, { seg: 12, tseg: 4 }); }
  m.emissive(0);
  return { w: 1, d: 1, h: 0.3 };
};

BW5.buildStreet = function (api, g) {
  const camp = (x, z, side, seed, o) => {
    o = o || {};
    const r = mulberry32(seed), yaw = side > 0 ? Math.PI : 0;
    api.prop(o.vehicle || r.pick(['rv', 'van', 'camper', 'bus']), { x, z, yaw: yaw + r.range(-0.15, 0.15), seed });
    api.prop('shade', { x: x + 6 * (side > 0 ? -1 : 1) * 0 + (o.dx || 0), z: z - side * 7, w: 6, d: 5, col: r.pick(['#a8e8f0', '#f0d0a8', '#d8c8f0', '#f4e0a0']) });
    api.prop('couch', { x: x + 1.2 + (o.dx || 0), z: z - side * 7, yaw: side > 0 ? 0 : Math.PI, col: r.pick(['#2a5a8a', '#8a2a5a', '#5a8a2a']) });
    for (let i = 0; i < 3; i++) api.prop('chair', { x: x - 2 + i * 1.3 + (o.dx || 0), z: z - side * 9, yaw: r() * TAU, col: r.pick(BURNS_NEON) });
    api.prop('cooler', { x: x + 3.4, z: z - side * 5.5, col: r.pick(['#2a8ac8', '#c83a2a']) });
    if (o.sign) api.sign(o.sign, x - 4, z - side * 10.5, { yaw: side > 0 ? 0 : Math.PI, h: 1.0, style: { bg: o.bg || '#fff4d8', fg: '#2a1a10', size: 34, border: '#2a1a10' } });
  };
  camp(-36, 146, 1, 501, { sign: 'PANCAKES ARE A\nLOVE LANGUAGE', vehicle: 'bus' });
  camp(36, 146, 1, 502, { sign: 'HYDRATION NATION', bg: '#d8f4ff' });
  camp(-64, 112, -1, 503, { sign: 'CAMP DUSTY HUGS' });
  camp(66, 112, -1, 504, { vehicle: 'rv' });
  camp(-92, 146, 1, 505, {});
  camp(94, 146, 1, 506, { vehicle: 'boxtruck' });
  api.npc({ id: 'flo', name: 'FLAPJACK FLO', type: 'tutu', seed: 51, x: -34, z: 139, yaw: 0, lines: ['Pancakes are a love language. This one says "eat me."', 'Big warehouse up the road. They call it Costco Soul Trading Co. Everything\'s free. Even the guilt.'], gift: { kind: 'glowstick', n: 8 } });
  api.npc({ id: 'hydro', name: 'HYDRO HAL', type: 'burner', seed: 52, x: 38, z: 139, yaw: 0, lines: ['Water! Electrolytes! Unsolicited advice!', 'Here. Drink this. Your face is doing a raisin thing.'], gift: { kind: 'water' } });
  api.npc({ id: 'hugs', name: 'DUSTY HUG DAN', type: 'furcoat', seed: 53, x: -62, z: 104, yaw: Math.PI, lines: ['Free hug? Sample size. You can come back for bulk.', 'Heard there\'s a fire-breathing OCTOPUS roaming deep playa. I hugged it once. Singed.'], gift: { kind: 'glowstick', n: 5 } });
  api.npc({ type: 'burner', seed: 54, name: 'GIFT ECONOMIST', x: 60, z: 132, behavior: 'wander', radius: 5, lines: ['In a gift economy, value is relational, not transac—', '...hey, where are you going? I had slides.'] });
  api.crowd(-20, 140, 4, 4, { behaviors: ['dance', 'idle', 'dance'] });
  api.crowd(20, 116, 3, 3, { behaviors: ['wander', 'idle'] });
  api.checkpoint('cp_street', 9, 136, { yaw: Math.PI, name: 'Esplanade-ish' });
  api.pickup('water', -6, 0.9, 130);
  api.pickup('bag:shrooms', -88, 0.9, 136);
  api.glowLine(0, 122, 0, 76, 12);
  api.glowLine(-30, 132, -6, 132, 6); api.glowLine(6, 132, 30, 132, 6);
  for (const sx of [-1, 1]) for (let z = 150; z > 112; z -= 38) api.prop('lightTower', { x: sx * 12, z, yaw: sx > 0 ? -Math.PI / 2 : Math.PI / 2 });
  api.sign('COSTCO SOUL\nTRADING CO.  ↑', 6, 118, { yaw: 0, h: 1.2, style: { bg: '#1f4fae', fg: '#ffffff', size: 40, border: '#ff4a2a' } });
  api.sign('FREE PARKING\n(EVERYTHING IS FREE)', -7, 112, { yaw: 0, h: 1.1, style: { bg: '#fff4d8', fg: '#1f4fae', size: 34, border: '#1f4fae' } });
};

BW5.buildLot = function (api, g) {
  // bike racks
  api.mesh(-36, 104, m => { m.color('#9aa0aa'); m.lo = true; for (let i = 0; i < 12; i++) { const x = -11 + i * 2; BW567K.limb(m, x, 0, 0, x, 0.8, 0, 0.04); BurnsProps.bikeShape(m, x, 0, 0.6, 0.15, BURNS_NEON[i % 7]); } m.lo = false; return { cols: [{ t: 'box', x: 0, z: 0.3, hx: 12, hz: 0.6, y0: 0, y1: 0.9 }] }; });
  api.mesh(38, 104, m => { m.color('#9aa0aa'); m.lo = true; for (let i = 0; i < 8; i++) { const x = -7 + i * 2; BW567K.limb(m, x, 0, 0, x, 0.8, 0, 0.04); BurnsProps.bikeShape(m, x, 0, 0.6, -0.1, BURNS_NEON[(i + 3) % 7]); } m.lo = false; return { cols: [{ t: 'box', x: 0, z: 0.3, hx: 8, hz: 0.6, y0: 0, y1: 0.9 }] }; });
  // cart corral with parked carts
  api.mesh(-34, 80, m => {
    m.color('#38c8e8').shine(2);
    BW567K.limb(m, -5, 1.0, -2.2, 5, 1.0, -2.2, 0.07); BW567K.limb(m, -5, 1.0, 2.2, 5, 1.0, 2.2, 0.07); BW567K.limb(m, 5, 1.0, -2.2, 5, 1.0, 2.2, 0.07);
    for (const [x, z] of [[-5, -2.2], [-5, 2.2], [5, -2.2], [5, 2.2], [0, -2.2], [0, 2.2]]) BW567K.limb(m, x, 0, z, x, 1.0, z, 0.07);
    m.shine(0);
    for (let i = 0; i < 7; i++) { m.push(); m.tf(-4 + i * 1.1, 0, 0, Math.PI / 2 + 0.05 * Math.sin(i)); BW5.cartMesh(m, i % 3 ? '#b8c0cc' : '#c8ccd8'); m.pop(); }
    return { cols: [{ t: 'box', x: 0, z: -2.2, hx: 5, hz: 0.1, y0: 0, y1: 1.05 }, { t: 'box', x: 0, z: 2.2, hx: 5, hz: 0.1, y0: 0, y1: 1.05 }, { t: 'box', x: 5, z: 0, hx: 0.1, hz: 2.2, y0: 0, y1: 1.05 }, { t: 'box', x: -0.5, z: 0, hx: 4.4, hz: 1.4, y0: 0, y1: 1.05 }] };
  });
  api.sign('CART RETURN\nCARTS ARE PEOPLE TOO', -34, 84.6, { yaw: 0, h: 1.0, style: { bg: '#1f4fae', fg: '#ffffff', size: 32, border: '#ffffff' } });
  // parked camp vehicles along the lot edges
  api.prop('van', { x: 52, z: 76, yaw: -Math.PI / 2, seed: 520 });
  api.prop('car', { x: 47, z: 86, yaw: -Math.PI / 2 + 0.1, seed: 521 });
  api.prop('camper', { x: -52, z: 92, yaw: Math.PI / 2, seed: 522 });
  // Biscuit's picnic table
  const B = BW5.BISCUIT_PIC;
  api.mesh(B.x, B.z, m => {
    m.color('#c87a3a').shine(1); BW567K.rbox(m, 0, 0.78, 0, 2.6, 0.1, 1.1, 0.05);
    for (const sz of [-1, 1]) { BW567K.rbox(m, 0, 0.46, sz * 0.95, 2.6, 0.08, 0.36, 0.04); BW567K.limb(m, -1, 0, sz * 0.9, -1, 0.76, 0, 0.05); BW567K.limb(m, 1, 0, sz * 0.9, 1, 0.76, 0, 0.05); }
    m.shine(0);
    m.color('#38f2ff'); BW567K.lathe(m, 0, 0.83, 0, [[0, 0], [0.5, 0.02], [0.5, 0.06], [0, 0.07]]); // a frisbee
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.55, y0: 0, y1: 0.83 }, { t: 'box', x: 0, z: 0.95, hx: 1.3, hz: 0.2, y0: 0, y1: 0.5 }, { t: 'box', x: 0, z: -0.95, hx: 1.3, hz: 0.2, y0: 0, y1: 0.5 }] };
  });
  // Biscuit (look built from the burner rig)
  const spec = Object.assign(BurnsRig.npcSpec('burner', 555), {
    kind: 'biscuit', skin: '#b87a50', skinSh: '#94603c', hair: { style: 'afro', col: '#2a1a12', hi: '#5a3a24' }, face: 'goofy',
    body: { h: 1.02, w: 1.24 }, top: { kind: 'tee', col: '#38f2ff', pattern: 'tiedye' }, coat: { kind: 'fur', col: '#e8a050', trim: '#fff2d8' },
    bottom: { kind: 'kilt', col: '#4a3a6a', pattern: 'plaid' }, shoes: { kind: 'furboots', col: '#fff2d8' }, goggles: true, glasses: null, hat: null,
    acc: ['ledNecklace', 'bracelets'], prop: 'water', paint: null, key: 'w5:biscuit'
  });
  BW5.BISCUIT_SPEC = spec;
  api.npc({ id: 'biscuit', name: 'BISCUIT', spec, x: B.x, z: B.z + 1.25, yaw: Math.PI, behavior: 'sit', always: true, followDist: 2.4,
    chat: ['Platonic buddies, ASSEMBLE.', 'I\'m not lost. I\'m FOLLOWING.', 'Gary says hi.', 'You smell like dust. Same.', 'I packed snacks. For you. For Gary. For the vibes.'],
    talk(g, a) { BW5.talkBiscuit(g, a); } });
  // Gary: Biscuit's emotional support cooler (a mover with googly eyes)
  const gary = api.mover(m => { BW5.garyMesh(m); return { cols: [] }; });
  gary.x = 0; gary.z = 88; gary.y = 0;
  BW5.state.gary = { mv: gary, mode: 'thief', vy: 0, y: 0 };
  // Snatchy Steve (with Gary on his head)
  if (!BurnsSave.hasToken(5, 'gary')) {
    api.enemy({ id: 'steve', name: 'SNATCHY STEVE', type: 'burner', seed: 560, x: -10, z: 80, behavior: 'bw5Snatch', hp: 1, drop: 6, always: true,
      spec: Object.assign(BurnsRig.npcSpec('burner', 560), { hat: { kind: 'bandana', col: '#1a1a1a' }, glasses: 'shades', face: 'goofy', top: { kind: 'tee', col: '#5a5a64' }, key: 'w5:steve' }),
      defeatLine: 'Okay okay! Gary is VERY judgmental anyway!', afterDefeat: 'chill',
      onDefeat(g2) { BW5.garyDrop(g2); } });
  } else gary.visible = false;
  // shoplifters + lot life
  api.enemy({ type: 'burner', seed: 561, name: 'SHOPLIFTER', x: 30, z: 72, behavior: 'thief', hp: 1, steal: 5, chatter: false });
  api.enemy({ type: 'sparklepony', seed: 562, name: 'SHOPLIFTER', x: -22, z: 100, behavior: 'thief', hp: 1, steal: 5, chatter: false });
  api.crowd(10, 102, 3, 3, { behaviors: ['idle', 'wander'], lines: ['Is this where the free stuff is?', 'I came for one thing. I\'m leaving with a canoe.'] });
  api.glowRing(0, 88, 24, 16);
  api.pickup('water', 26, 0.9, 88);
  api.pickup('bag:molly', -48, 0.9, 70);
};

BW5.buildEntrance = function (api, g) {
  const F = BW5.FRONT;
  // entrance arch
  api.mesh(0, F, m => {
    m.color('#ff4a2a').shine(2); for (const x of [-9.4, 9.4]) BW567K.rcyl(m, x, 0, 0, 0.45, 6.4, 0.15);
    BW567K.rbox(m, 0, 6.6, 0, 19.6, 0.7, 0.9, 0.3); m.shine(0);
    const reg = BURNS_ATLAS.sign('MEMBERS  →  ENTRANCE', { bg: '#ff4a2a', fg: '#ffffff', size: 34, pad: 8 });
    m.color('#ffffff', 0.2); m.decal(0, 6.6, 0.47, 9, 9 / reg.aspect, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 6.6, 0.47, 9, 9 / reg.aspect, reg); m.pop(); m.emissive(0);
    return { cols: [{ t: 'cyl', x: -9.4, z: 0, r: 0.45, y0: 0, y1: 6.4 }, { t: 'cyl', x: 9.4, z: 0, r: 0.45, y0: 0, y1: 6.4 }] };
  });
  // turnstiles: posts + rotating arms (movers); the barrier lifts when you're carded
  for (const x of [-6, -2, 2, 6]) BW567K.post(api, x, 0, F, 0.22, 1.1, '#c8ccd4', { gloss: 3 });
  BW5.state.barrier = api.collider({ t: 'box', x: 0, z: F, hx: 9, hz: 0.45, y0: 0, y1: 4.6, walk: false });
  for (const x of [-4, 0, 4]) {
    const mv = api.mover(m => { m.color('#9aa0aa').shine(3); BW567K.rcyl(m, 0, 0, 0, 0.16, 1.05, 0.05); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; BW567K.limb(m, 0, 0.95, 0, Math.sin(a) * 0.85, 0.95, Math.cos(a) * 0.85, 0.035); } m.shine(0); return { cols: [] }; });
    mv.x = x; mv.z = F; mv.y = 0; BW5.state.turn.push(mv);
  }
  // membership desk
  api.mesh(-7, 64, m => {
    m.color('#1f4fae').shine(2); BW567K.rbox(m, 0, 0.55, 0, 3.8, 1.1, 1.3, 0.25); m.color('#ffffff'); BW567K.rbox(m, 0, 1.14, 0, 4.0, 0.1, 1.45, 0.05); m.shine(0);
    m.color('#ff4a2a'); BW567K.lathe(m, 1.4, 1.2, 0.2, [[0.04, 0], [0.04, 1.9], [1.4, 2.0], [1.5, 2.15], [0, 2.5]], { seg: 12 });
    m.color('#2a2a30'); BW567K.rbox(m, -1.0, 1.36, 0.2, 0.5, 0.36, 0.3, 0.05); m.color('#5ab0ff', 0.8); m.box(-1.0, 1.38, 0.36, 0.42, 0.26, 0.01); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 2, hz: 0.72, y0: 0, y1: 1.2 }] };
  });
  api.sign('MEMBERSHIP\nFREE · LIFETIME · MANDATORY', -7, 66.6, { yaw: 0, y: 2.6, h: 1.1, post: false, style: { bg: '#ffffff', fg: '#1f4fae', size: 34, border: '#ff4a2a' } });
  // photo booth tripod pointing at the X
  api.mesh(5, 70.5, m => {
    m.color('#2a2a30'); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; BW567K.limb(m, Math.sin(a) * 0.5, 0, Math.cos(a) * 0.5, 0, 1.4, 0, 0.03); }
    m.color('#1a1a1a').shine(2); BW567K.rbox(m, 0, 1.55, 0, 0.45, 0.32, 0.3, 0.06); m.color('#5a5a62'); BW567K.rcyl(m, 0, 1.45, -0.18, 0.11, 0.2, 0.03, {}); m.shine(0);
    m.color('#ffffff', 1); BW567K.torus(m, 0.7, 1.7, 0, 0.32, 0.04, { seg: 14, tseg: 5 }); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 0, y1: 1.7, camPass: true }] };
  });
  api.npc({ id: 'marge', name: 'MARGE, MEMBERSHIP', type: 'greeter', seed: 570, x: -7, z: 62.6, yaw: 0,
    spec: Object.assign(BurnsRig.npcSpec('greeter', 570), { hair: { style: 'bun', col: '#c8c8d0', hi: '#ffffff' }, glasses: 'clear', hat: null, top: { kind: 'button', col: '#38c8e8' }, bottom: { kind: 'chinos', col: '#2a2a40' }, prop: 'clipboard', acc: ['lei'], face: 'greeter', key: 'w5:marge' }),
    chat: ['MEMBERS! Everyone\'s a member!', 'Card, hon? Everybody gets carded.', 'No smiling in membership photos. House rules.'],
    talk(g, a) { BW5.talkMarge(g, a); } });
  api.trigger({ x: 5, z: 66, r: 1.4, when: g2 => g2.missions.state('member') === 'active' && !BW5.state.photo, onEnter: g2 => BW5.photo(g2) });
  api.checkpoint('cp_desk', 12, 66, { yaw: Math.PI, name: 'Membership Desk' });
  api.npc({ type: 'influencer', seed: 571, name: 'PHOTO PHIL', x: 6.6, z: 71.8, yaw: Math.PI, chat: ['Don\'t smile. Don\'t blink. Don\'t exist.', 'Membership photo! Very serious.'], lines: ['I take the membership photos. Everyone looks dusty. It\'s the brand.'] });
  api.glowArc(-3, 0.9, 74, 3, 0.9, 74, 1.2, 5);
};

BW5.buildBulk = function (api, g) {
  // the giant pickle jar
  api.lathe(0, 0, 16, [[2.2, 0, '#3a8a3a'], [2.5, 0.4, '#4aa04a'], [2.5, 4.3, '#4aa04a'], [2.0, 4.8, '#4aa04a'], [1.6, 4.9, '#e8e0d0'], [1.75, 5.0, '#e8e0d0'], [1.75, 5.35, '#e8e0d0'], [0, 5.4, '#e8e0d0']], '#4aa04a', { gloss: 3, seg: 20 });
  api.mesh(0, 16, m => {
    m.color('#fff4c8'); BW567K.lathe(m, 0, 1.6, 0, [[2.52, 0], [2.52, 1.4]], { seg: 20 });
    m.color('#3a7a2a'); for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; BW567K.ellip(m, Math.sin(a) * 2.3, 3.6 + (i % 3) * 0.2, Math.cos(a) * 2.3, 0.25, 0.7, 0.25, { seg: 8, rings: 5 }); }
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.55, y0: 0, y1: 5.35 }] };
  });
  api.sign('BULK PICKLES\n1 TON (LOOSELY)', 0, 18.7, { yaw: 0, y: 1.6, h: 1.1, post: false, style: { bg: '#fff4c8', fg: '#2a5a2a', size: 34, border: '#2a5a2a' } });
  // crate steps up the jar
  BW567K.rb(api, 4.8, 0, 19.6, 1.6, 1.3, 1.6, '#c89a60', { r: 0.12 });
  BW567K.rb(api, 4.2, 0, 17.4, 1.6, 2.6, 1.6, '#b88a50', { r: 0.12 });
  BW567K.rb(api, 3.1, 0, 15.3, 1.5, 3.9, 1.5, '#c89a60', { r: 0.12 });
  api.pickup('photo', 0, 6.3, 16, { id: 'p1' });
  api.glowArc(4.8, 2.0, 19.6, 3.1, 4.6, 15.3, 1, 4);
  // the baby-wipe pyramid (the playa shower)
  const PZ = -12;
  api.mesh(0, PZ, m => {
    const cols = [];
    m.lo = true;
    const tiers = [[3, 1.2], [2.2, 1.2], [1.4, 1.2], [0.6, 1.2]];
    tiers.forEach(([hw, h], t) => {
      const y = t * 1.2, n = Math.max(1, Math.round(hw * 2 / 0.95));
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const x = -hw + (i + 0.5) * (hw * 2 / n), z = -hw + (j + 0.5) * (hw * 2 / n);
        m.color('#f4f4f8').shine(2); BW567K.rcyl(m, x, y, z, 0.42, 1.0, 0.12); m.color('#3aa0ff'); BW567K.rcyl(m, x, y + 1.0, z, 0.36, 0.2, 0.06); m.shine(0);
      }
      cols.push({ t: 'box', x: 0, z: 0, hx: hw, hz: hw, y0: y, y1: y + 1.2 });
    });
    m.lo = false;
    return { cols };
  });
  api.sign('BULK BABY WIPES\nTHE PLAYA SHOWER', 4.6, PZ + 3.6, { yaw: 0.4, h: 1.0, style: { bg: '#e8f4ff', fg: '#1f4fae', size: 34, border: '#3aa0ff' } });
  api.npc({ type: 'crusty', seed: 580, name: 'AUNTIE WIPES', x: -4.2, z: PZ + 3.4, yaw: 0.6, lines: ['Six days, zero showers, one hundred wipes. That\'s the playa math.', 'Take a wipe. Take two. Your elbows are a disgrace.'], gift: { kind: 'water' } });
  api.pickup('bag:lsd', -3.8, 0.9, PZ - 3.8);
  api.glowRing(0, PZ, 4.6, 10);
  // LSD-only rafter walk to a hidden photo
  api.hidden(() => {
    const steps = [[-1.5, 6.4, PZ - 1], [-3.5, 8.0, PZ - 2.5], [-5.5, 9.6, PZ - 4], [-7.5, 11.2, PZ - 5.5], [-9.5, 12.8, PZ - 7], [-11.5, 14.4, PZ - 8.5], [-13.5, 15.4, PZ - 10]];
    steps.forEach(([x, y, z], i) => BW567K.rb(api, x, y - 0.3, z, 2.4, 0.3, 2.4, burnsHSL(180 + i * 25, 0.9, 0.62), { e: 0.6, r: 0.1 }));
    api.glow(-13.5, 16.4, PZ - 10, 2.2, '#38f2ff');
  });
  api.pickup('photo', -13.5, 16.3, PZ - 10, { id: 'p3', hidden: true });
  // sample stations (Dot's HQ + six stations)
  BW5.SAMPLES = [
    { x: 6.5, z: 26, y: 0.9, label: 'KOMBUCHA SHOT', icon: 'drop' }, { x: -6.5, z: 4, y: 0.9, label: 'ONE (1) DATE', icon: 'heart' },
    { x: 23, z: -22, y: 0.9, label: 'MYSTERY JERKY', icon: 'heart' }, { x: -23, z: -44, y: 0.9, label: 'TOFU CUBE', icon: 'heart' },
    { x: -37, z: 26, y: 0.9, label: 'ELECTROLYTE GUMMY', icon: 'drop' }, { x: 0, z: 16, y: 6.4, label: 'PICKLE SPEAR', icon: 'heart' }
  ];
  BW5.SAMPLES.forEach((s, i) => {
    api.pickup('item:sample', s.x, s.y, s.z, { mission: 'sprint', gate: true, label: s.label, icon: s.icon, col: '#ffd84a', id: 'sample' + i });
    if (i === 5) return;
    BW5.sampleStation(api, s.x + (s.x > 0 ? 1.1 : -1.1), s.z, i);
  });
  BW5.sampleStation(api, -8.2, 38, 9);
  api.npc({ id: 'dot', name: 'DOT, SAMPLES', type: 'tutu', seed: 590, x: -8.2, z: 36.8, yaw: 0,
    spec: Object.assign(BurnsRig.npcSpec('tutu', 590), { hat: { kind: 'cap', col: '#ffffff' }, goggles: false, glasses: 'heart', prop: 'coffee', top: { kind: 'tank', col: '#ffd84a' }, key: 'w5:dot' }),
    chat: ['Free samples! One per customer. Six per hero.', 'Toothpicks wait for no one.'],
    talk(g, a) { BW5.talkDot(g, a); } });
  api.pickup('bag:powder', -4.5, 0.9, 41);
  api.checkpoint('cp_aisle', 12.6, -1.5, { yaw: Math.PI, name: 'Cross Aisle' });
  api.glowLine(-3, 50, -3, 28, 8); api.glowLine(3, 8, 3, -4, 5); api.glowLine(-50, -1, -20, -1, 10); api.glowLine(20, -1, 50, -1, 10);
  api.pickup('water', 12, 0.9, 30); api.pickup('water', -12, 0.9, -20);
};
BW5.sampleStation = function (api, x, z, i) {
  const col = BURNS_NEON[i % 7];
  api.mesh(x, z, m => {
    m.color('#f4f4f0').shine(2); BW567K.rbox(m, 0, 0.5, 0, 1.4, 1.0, 1.0, 0.2); m.color(col); BW567K.rbox(m, 0, 1.03, 0, 1.5, 0.08, 1.1, 0.04);
    m.color('#9aa0aa'); BW567K.limb(m, 0.5, 1.0, 0, 0.5, 2.5, 0, 0.03); m.shine(0);
    BW567K.lathe(m, 0.5, 2.4, 0, [[0, 0], [1.1, 0.2, col], [1.1, 0.24, '#ffffff'], [0, 0.6, '#ffffff']], { seg: 10 });
    m.color('#e8d8b0'); for (let k = 0; k < 6; k++) BW567K.ball(m, -0.4 + (k % 3) * 0.2, 1.12, -0.15 + Math.floor(k / 3) * 0.3, 0.06, { seg: 6, rings: 4 });
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.72, hz: 0.52, y0: 0, y1: 1.1 }, { t: 'cyl', x: 0.5, z: 0, r: 0.05, y0: 0, y1: 2.6, camPass: true }] };
  });
  if (i < 9) api.npc({ type: i % 2 ? 'tutu' : 'burner', seed: 600 + i, name: 'SAMPLE GIVER', x: x + (x > 0 ? 0.9 : -0.9), z: z + 0.2, yaw: x > 0 ? -Math.PI / 2 : Math.PI / 2, chat: ['Free sample!', 'Try the kombucha. Or don\'t. It\'s alive.', 'One per customer. Okay, two.', 'Grab it and GO, sprinter!'] });
};

BW5.buildChute = function (api, g) {
  const C = BW5.CHUTE, len = C.z1 - C.z0, mid = (C.z0 + C.z1) / 2, slope = Math.atan2(C.h, len), L = Math.hypot(len, C.h);
  // the ramp slab + its side walls
  api.mesh(0, mid, m => {
    m.push(); m.tf(0, C.h / 2 - 0.16, 0, 0, slope, 0);
    m.color('#7a8496').shine(1); BW567K.rbox(m, 0, 0, 0, 18, 0.3, L, 0.12); m.shine(0);
    m.color('#ffd84a'); for (let i = 0; i < 9; i++) m.box(0, 0.16, -L / 2 + 2 + i * 4.5, 16, 0.02, 0.4);
    for (const sx of [-1, 1]) { m.color('#1f6fd0').shine(2); BW567K.rbox(m, sx * 9.3, 0.7, 0, 0.5, 1.4, L, 0.2); m.shine(0); }
    m.pop();
    return { cols: [
      { t: 'ramp', x: 0, z: 0, hx: 9.05, hz: len / 2, y0: 0, ya: C.h, yb: 0.02 },
      { t: 'ramp', x: -9.3, z: 0, hx: 0.25, hz: len / 2, y0: 0, ya: C.h + 1.4, yb: 1.4 },
      { t: 'ramp', x: 9.3, z: 0, hx: 0.25, hz: len / 2, y0: 0, ya: C.h + 1.4, yb: 1.4 }
    ] };
  });
  // the Returns mezzanine (top of the chute)
  BW567K.rb(api, 0, 0, -78, 19.2, C.h, 16, '#5a6478', { r: 0.25, top: '#8a96a8' });
  for (const sx of [-1, 1]) api.mesh(sx * 9.5, -78, m => { m.color('#ffd84a').shine(2); BW567K.limb(m, 0, C.h + 1.0, -7.8, 0, C.h + 1.0, 7.8, 0.06); for (let i = 0; i < 5; i++) BW567K.limb(m, 0, C.h, -7.8 + i * 3.9, 0, C.h + 1.0, -7.8 + i * 3.9, 0.05); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.12, hz: 7.9, y0: C.h, y1: C.h + 1.05, walk: false }] }; });
  // cart hopper at the top + catcher piles at the bottom
  api.mesh(0, -84.5, m => { m.color('#1f6fd0').shine(2); BW567K.rbox(m, 0, C.h + 1.5, 0, 16, 3, 2, 0.4); m.shine(0); m.color('#ffd84a', 0.4); m.box(0, C.h + 2.6, 1.02, 15, 0.3, 0.02); m.emissive(0); for (let i = 0; i < 8; i++) { m.push(); m.tf(-6.5 + i * 1.85, C.h + 3.0, -0.3, Math.PI, 0.5); BW5.cartMesh(m, '#b8c0cc'); m.pop(); } return { cols: [{ t: 'box', x: 0, z: 0, hx: 8, hz: 1, y0: C.h, y1: C.h + 3 }] }; });
  api.sign('THE CART CHUTE\nDO NOT RIDE (RIDE)', 12.5, -30, { yaw: -0.5, h: 1.2, style: { bg: '#ffd84a', fg: '#1a1a2a', size: 36, border: '#1a1a2a' } });
  for (const sx of [-1, 1]) api.mesh(sx * 12, -27, m => { for (let i = 0; i < 6; i++) { m.push(); m.tf((i % 3 - 1) * 0.9, Math.floor(i / 3) * 0.95, (i % 2) * 0.6, i * 1.3, 0, Math.floor(i / 3) * 0.3); BW5.cartMesh(m, '#c0c6d0'); m.pop(); } return { cols: [{ t: 'box', x: 0, z: 0.3, hx: 1.6, hz: 1.0, y0: 0, y1: 1.8 }] }; });
  // Returns desk + Rhonda
  api.mesh(0, -76.5, m => { m.color('#ff4a2a').shine(2); BW567K.rbox(m, 0, C.h + 0.55, 0, 4.4, 1.1, 1.0, 0.25); m.color('#ffffff'); BW567K.rbox(m, 0, C.h + 1.13, 0, 4.6, 0.08, 1.1, 0.04); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.2, hz: 0.5, y0: C.h, y1: C.h + 1.17 }] }; }, { y: 0 });
  api.sign('RETURNS\nNONE ACCEPTED · NO REGRETS', 0, -78.5, { y: C.h + 1.6, h: 1.1, post: false, style: { bg: '#ff4a2a', fg: '#ffffff', size: 34, border: '#ffffff' } });
  api.npc({ id: 'rhonda', name: 'RHONDA, RETURNS', type: 'crusty', seed: 610, x: 0, z: -77.8, y: C.h, fixedY: true, yaw: 0, always: true,
    spec: Object.assign(BurnsRig.npcSpec('crusty', 610), { hair: { style: 'pony', col: '#8a3a2a', hi: '#c86a4a' }, glasses: 'heart', goggles: false, hat: null, face: 'stern', prop: 'clipboard', body: { h: 0.95, w: 1.05 }, key: 'w5:rhonda' }),
    chat: ['No returns.', 'We don\'t take returns. We don\'t take ANYTHING.'],
    talk(g, a) { BW5.talkRhonda(g, a); } });
  api.pickup('bag:liquor', 6, C.h + 0.9, -82);
  api.pickup('bag:khole', -6.5, 0.9, -26);
  api.glowLine(0, -32, 0, -66, 10, undefined);
};

BW5.buildAisle99 = function (api, g) {
  // the tall rack along X (z = -78), five levels
  const RX = -43, RZ = -78, L = 22, lh = 2.4, D = 2.8;
  api.mesh(RX, RZ, m => {
    const cols = [], rng = mulberry32(990), levels = 5, H = levels * lh + 0.25, n = 4, seg = L / n;
    for (let i = 0; i <= n; i++) { const x = -L / 2 + i * seg; for (const sz of [-1, 1]) { m.color('#1f6fd0').shine(2); BW567K.rcyl(m, x, 0, sz * (D / 2 - 0.1), 0.12, H, 0.05); m.shine(0); cols.push({ t: 'cyl', x, z: sz * (D / 2 - 0.1), r: 0.13, y0: 0, y1: H, camPass: true }); } }
    for (let l = 1; l <= levels; l++) {
      const y = l * lh;
      m.color('#ff7a1a').shine(2); for (const sz of [-1, 1]) BW567K.rbox(m, 0, y - 0.12, sz * (D / 2 - 0.1), L, 0.22, 0.16, 0.06); m.shine(0);
      m.color('#c8a070'); m.box(0, y - 0.05, 0, L - 0.1, 0.08, D - 0.3, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
      cols.push({ t: 'box', x: 0, z: 0, hx: L / 2, hz: D / 2, y0: y - 0.24, y1: y });
      if (l < levels) for (let x = -L / 2 + 0.6; x < L / 2 - 1; x += rng.range(1.6, 2.6)) { // merch at the back half only (walkway in front)
        m.color(rng.pick(['#c89a60', '#d8aa70', '#2a8ac8', '#ff6ad0'])); const w = rng.range(0.8, 1.3), h = rng.range(0.6, 1.1); BW567K.rbox(m, x, y + h / 2, -0.75, w, h, 1.0, 0.06);
        cols.push({ t: 'box', x, z: -0.75, hx: w / 2, hz: 0.5, y0: y, y1: y + h });
      }
    }
    return { cols };
  });
  api.sign('AISLE 99\nTOP SHELF', RX + 9, RZ + 1.6, { y: 12.9, h: 1.1, post: false, style: { bg: '#ffd84a', fg: '#1a1a2a', size: 36, border: '#1a1a2a' } });
  // forklift lifts: mast + a pallet platform (mover) that rides up and down
  const lifts = [{ x: -33.6, lo: 2.0, hi: 4.82, per: 6.2, ph: 0 }, { x: -52.0, lo: 4.82, hi: 9.62, per: 7.0, ph: 1.5 }, { x: -39.0, lo: 9.62, hi: 12.02, per: 5.6, ph: 3.0 }];
  for (const L0 of lifts) {
    api.mesh(L0.x, RZ + 3.6, m => { m.color('#ffb81c').shine(2); BW567K.rbox(m, 0, 0.6, 1.6, 1.6, 1.0, 2.0, 0.25); m.color('#2a2a30'); for (const sx of [-1, 1]) BW567K.rcyl(m, sx * 0.7, 0, -0.2, 0.09, L0.hi + 1.4, 0.04); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 1.6, hx: 0.8, hz: 1.0, y0: 0, y1: 1.1 }] }; });
    const mv = api.mover(m => { BW5.palletMesh(m, false); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 1.1, y0: 0, y1: 0.24 }] }; });
    mv.x = L0.x; mv.z = RZ + 2.7; mv.y = L0.lo; mv.yaw = 0;
    BW5.state.lifts.push(Object.assign({ mv }, L0));
  }
  // stack of crates to reach the first lift
  BW567K.rb(api, -29.5, 0, -71, 1.6, 1.2, 1.6, '#c89a60', { r: 0.12 });
  BW567K.rb(api, -31.6, 0, -73.0, 1.6, 2.4, 1.6, '#b88a50', { r: 0.12 });
  api.pickup('item:ice', -47, 12.9, -78, { mission: 'pallets', gate: true, label: 'LAST BAG OF ICE', icon: 'drop', col: '#bff0ff', id: 'ice' });
  api.glowArc(-29.5, 2.0, -71, -31.6, 3.2, -73, 0.6, 3);
  api.glowLine(-36, 5.7, -77, -49, 5.7, -77, 6); api.glowLine(-50, 10.5, -77, -41, 10.5, -77, 5); api.glowLine(-41, 12.9, -77.5, -45, 12.9, -77.5, 3);
  api.npc({ id: 'fran', name: 'FRAN, FORKLIFTS', type: 'dpw', seed: 620, x: -27, z: -66, yaw: Math.PI,
    spec: Object.assign(BurnsRig.npcSpec('dpw', 620), { face: 'friendly', hair: { style: 'pony', col: '#3a2a1a' }, body: { h: 0.96, w: 1.05 }, key: 'w5:fran' }),
    chat: ['Forklift certified. Sort of.', 'They go up. They go down. That\'s the whole job.'],
    talk(g, a) { BW5.talkFran(g, a); } });
  api.prop('crate', { x: -25, z: -70, s: 1.2 }); api.prop('crate', { x: -24, z: -71.4, s: 1.0 });
};

BW5.buildAisles = function (api, g) {
  // cart-pushing hoarders (their carts are puppet carts 0..2)
  const hoard = [{ x: 37, z0: 44, z1: -56, seed: 630 }, { x: -51, z0: -56, z1: 44, seed: 631 }, { x: 23, z0: -56, z1: 40, seed: 632 }];
  hoard.forEach((h, i) => api.enemy({ id: 'hoard' + i, name: 'HOARDER', type: 'crusty', seed: h.seed, x: h.x, z: h.z0, behavior: 'bw5Hoarder', hp: 2, cart: i, path: [[h.x, h.z0], [h.x, h.z1]], speed: 2.6, drop: 3,
    spec: Object.assign(BurnsRig.npcSpec('crusty', h.seed), { hat: { kind: 'cap', col: '#c83a2a' }, coat: null, vest: 'fleece', vestCol: '#5a5a64', face: 'grumpy', key: 'w5:hoard' + i }),
    chat: ['Bulk is a lifestyle.', 'I\'ll need eleven of those.', 'Out of my way. Stocking up for the apocalypse. And Tuesday.'], defeatLine: 'Fine. I\'ll only take TEN.' }));
  // gift police (patrol + vision cones)
  const police = [{ x: -23, path: [[-23, 40], [-23, -56]] }, { x: 37, path: [[37, -40], [37, 30]] }, { x: -37, path: [[-37, -56], [-37, 10]] }, { x: 51, path: [[51, 40], [51, -56]] }];
  police.forEach((p, i) => api.enemy({ name: 'GIFT POLICE', type: 'ranger', seed: 640 + i, x: p.path[0][0], z: p.path[0][1], behavior: 'patrol', path: p.path, view: 10, fov: 0.55, speed: 1.6, chaseSpeed: 4.4, hp: 2, drop: 3, spotLine: 'HALT! WAS THAT A TRADE?!',
    spec: Object.assign(BurnsRig.npcSpec('ranger', 640 + i), { top: { kind: 'button', col: '#ff6ad0' }, hat: { kind: 'cap', col: '#1a1a3a' }, vest: 'hivis', key: 'w5:police' + i }),
    chat: ['Gifting is NOT bartering!', 'I saw that eye contact. Very transactional.', 'Step away from the reciprocity.'], defeatLine: 'Okay. Was that a gift? It felt like a gift.' }));
  // shoplifter in the aisles
  api.enemy({ type: 'burner', seed: 650, name: 'SHOPLIFTER', x: 44, z: 2, behavior: 'thief', hp: 1, steal: 5, chatter: false });
  // shelf-top photo + a climb onto the east row
  BW567K.rb(api, 46.6, 0, -47, 1.4, 1.3, 1.4, '#c89a60', { r: 0.1 });
  BW567K.rb(api, 46.6, 0, -49.2, 1.4, 2.6, 1.4, '#b88a50', { r: 0.1 });
  BW567K.rb(api, 46.6, 0, -51.4, 1.4, 3.9, 1.4, '#c89a60', { r: 0.1 });
  api.pickup('photo', 44, 7.9, -55, { id: 'p2' });
  api.glowLine(44, 7.4, -40, 44, 7.4, -54, 6);
  // glow sticks down the side aisles
  for (const x of [-37, 23, -51, 51]) api.glowLine(x, 40, x, -50, 8);
  api.pickup('water', -37, 0.9, -12); api.pickup('water', 37, 0.9, 12); api.pickup('bag:weed', 51, 0.9, 30);
};

BW5.buildDock = function (api, g) {
  const A = BW5.DOCK;
  // arena posts with string lights
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * TAU; if (Math.abs(BurnsM.wrap(a - Math.PI)) < 0.35) continue;
    const x = A.x + Math.sin(a) * (A.r + 1.5), z = A.z + Math.cos(a) * (A.r + 1.5);
    BW567K.post(api, x, 0, z, 0.14, 3.2, '#2a2a30', { col: { camPass: true } }); api.glow(x, 3.3, z, 0.8, i % 2 ? '#ffd84a' : '#38f2ff', { blink: 2 });
  }
  // pallet stacks to crash into (and hide behind)
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * TAU + 0.3, x = A.x + Math.sin(a) * 11, z = A.z + Math.cos(a) * 11, h = i % 2 ? 2.4 : 1.6;
    api.mesh(x, z, m => { for (let k = 0; k < Math.round(h / 0.8); k++) { m.push(); m.tf(0, k * 0.8, 0, k * 0.2); BW5.palletMesh(m, true); m.pop(); } return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.15, hz: 1.15, y0: 0, y1: h, cover: true }] }; });
  }
  api.sign('BARTER BARON\'S LOADING DOCK\nEVERYTHING HAS A PRICE', A.x + 6, A.z + A.r + 2.5, { yaw: Math.PI, h: 1.3, style: { bg: '#2a1a0a', fg: '#ffd84a', size: 36, border: '#ffd84a', glow: '#ffb020' }, glow: '#ffd84a' });
  api.checkpoint('cp_dock', -4, -98, { yaw: Math.PI, name: 'Loading Dock' });
  api.pickup('water', A.x - 14, 0.9, A.z + 8); api.pickup('water', A.x + 14, 0.9, A.z - 6);
  api.glowRing(A.x, A.z, 7, 12);
  // the Barter Baron
  const spec = Object.assign(BurnsRig.npcSpec('furcoat', 660), { coat: { kind: 'fur', col: '#e8c040', trim: '#fff4c8' }, hat: { kind: 'tophat', col: '#1a1a1a' }, glasses: 'shades', goggles: false, face: 'smug', prop: 'clipboard', top: { kind: 'button', col: '#ffffff' }, bottom: { kind: 'chinos', col: '#2a2a30' }, acc: ['ledNecklace'], body: { h: 1.0, w: 1.15 }, key: 'w5:baron' });
  BW5.BARON_SPEC = spec;
  if (!BurnsSave.hasToken(5, 'boss')) {
    api.enemy({ id: 'baron', name: 'THE BARTER BARON', spec, scale: 1.25, x: A.x, z: A.z - 8, yaw: 0, behavior: 'bw5Baron', hp: 4, boss: true, drop: 12, always: true, chatter: false, keepBehavior: true,
      onDefeat(g2) { BW5.baronDefeated(g2); } });
  } else {
    api.npc({ id: 'baron', name: 'THE GIFTING BARON', spec, scale: 1.25, x: A.x + 3, z: A.z - 4, yaw: Math.PI, behavior: 'dance',
      lines: ['Everything is FREE. It\'s TERRIFYING. I love it.', 'Take a glow stick. Take nine. I want NOTHING. Oh wow.'], gift: { kind: 'glowstick', n: 9 } });
  }
  api.trigger({ x: A.x, z: A.z, r: 13, when: g2 => g2.missions.state('boss') === 'available' && !BW5.state.bossOn, onEnter: g2 => BW5.bossIntro(g2) });
};

BW5.buildTower = function (api, g) {
  const T = BW5.TOWER;
  // the fence around the lookout (tarp walls) with a toll gate
  const panel = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), yaw = Math.atan2(x1 - x0, z1 - z0);
    api.mesh((x0 + x1) / 2, (z0 + z1) / 2, m => { m.lo = true; const n = Math.max(1, Math.round(len / 4)); for (let i = 0; i < n; i++) { m.color(i % 2 ? '#2a6ac8' : '#38a8e8'); BW567K.rbox(m, 0, 2.5, -len / 2 + (i + 0.5) * len / n, 0.3, 5, len / n - 0.1, 0.12); } m.lo = false; return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.15, hz: len / 2, y0: 0, y1: 5 }] }; }, { yaw });
  };
  panel(18, -116, 31, -116); panel(37, -116, 50, -116); panel(18, -116, 18, -152); panel(50, -116, 50, -152); panel(18, -152, 50, -152);
  api.prop('booth', { x: 41.5, z: -111.5, roof: '#ffd84a', col: '#2a1a0a' });
  api.sign('OVERSTOCK LOOKOUT\nACCESS: ONE (1) TRADE', 27.6, -112, { yaw: 0, h: 1.2, style: { bg: '#2a1a0a', fg: '#ffd84a', size: 36, border: '#ffd84a' } });
  BW5.state.toll = api.collider({ t: 'box', x: 34, z: -116, hx: 3.2, hz: 0.4, y0: 0, y1: 5, walk: false });
  const arm = api.mover(m => { m.color('#2a2a30'); BW567K.rbox(m, 0, -0.5, 0, 0.5, 1.0, 0.5, 0.1); m.color('#ffd84a').shine(2); BW567K.rbox(m, 3.2, 0, 0, 6.4, 0.25, 0.22, 0.1); m.color('#1a1a1a'); for (let k = 0; k < 4; k++) m.box(1.2 + k * 1.5, 0, 0, 0.5, 0.26, 0.23); m.shine(0); return { cols: [] }; });
  arm.x = 30.8; arm.y = 1.1; arm.z = -116; BW5.state.tollArm = arm;
  // central column of giant overstock
  api.mesh(T.x, T.z, m => {
    const cols = [];
    let y = 0;
    const cs = ['#ff7a1a', '#38c8e8', '#ffd84a', '#ff6ad0', '#7aff9a', '#9a7aff', '#f4f4f0'];
    for (let i = 0; y < 25.5; i++) { const h = 2.2 + (i % 3) * 0.6, w = 4.2 - (i % 2) * 0.6; m.color(cs[i % cs.length]).shine(2); BW567K.rbox(m, 0, y + h / 2, 0, w, h, w, 0.35); m.shine(0); m.push(); m.tf(0, 0, 0, i * 0.37); m.color('#ffffff'); m.box(0, y + h / 2, w / 2 + 0.01, w * 0.5, 0.25, 0.02); m.pop(); y += h; }
    cols.push({ t: 'box', x: 0, z: 0, hx: 2.0, hz: 2.0, y0: 0, y1: y });
    return { cols };
  });
  // the spiral of pallets
  const N = 11;
  for (let k = 0; k < N; k++) {
    const a = k * 0.95 + 0.2, x = T.x + Math.sin(a) * 5.2, z = T.z + Math.cos(a) * 5.2, y = 1.3 + k * 2.25;
    api.mesh(x, z, m => { m.push(); m.tf(0, y - 0.26, 0, a); BW5.palletMesh(m, false, 3.2); m.pop(); m.color('#5a5a62'); BW567K.limb(m, 0, y - 0.3, 0, -Math.sin(a) * 3.4, y - 1.6, -Math.cos(a) * 3.4, 0.07); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 1.6, y0: y - 0.3, y1: y, yaw: a }] }; });
    if (k > 0) { const a0 = (k - 1) * 0.95 + 0.2; api.glowArc(T.x + Math.sin(a0) * 5.2, 1.3 + (k - 1) * 2.25 + 0.6, T.z + Math.cos(a0) * 5.2, x, y + 0.6, z, 1.2, 2); }
  }
  // crow's nest at the top
  const top = 26;
  api.mesh(T.x, T.z, m => {
    m.color('#c8965a'); BW567K.rcyl(m, 0, top - 0.4, 0, 3.4, 0.4, 0.12);
    m.color('#ff4a2a').shine(2); BW567K.torus(m, 0, top + 1.0, 0, 3.3, 0.07, { seg: 24, tseg: 6 }); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; BW567K.limb(m, Math.sin(a) * 3.3, top, Math.cos(a) * 3.3, Math.sin(a) * 3.3, top + 1.0, Math.cos(a) * 3.3, 0.05); }
    m.color('#2a2a30'); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; BW567K.limb(m, 1.2 + Math.sin(a) * 0.4, top, -1.2 + Math.cos(a) * 0.4, 1.2, top + 1.2, -1.2, 0.03); }
    m.push(); m.tf(1.2, top + 1.3, -1.2, Math.PI * 0.8, -0.25, 0); m.color('#d8a020').shine(3); BW567K.lathe(m, 0, 0, 0, [[0.12, -0.7], [0.14, 0], [0.2, 0.6], [0.22, 0.75], [0, 0.78]], { seg: 10 }); m.pop(); m.shine(0);
    m.color('#9aa0aa'); BW567K.limb(m, -2.4, top, 1.6, -2.4, top + 5, 1.6, 0.06);
    m.color('#ff4a2a'); m.poly([[-2.4, top + 5, 1.6], [-0.2, top + 4.4, 1.6], [-2.4, top + 3.8, 1.6]]); m.poly([[-0.2, top + 4.4, 1.6], [-2.4, top + 5, 1.6], [-2.4, top + 3.8, 1.6]]);
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.4, y0: top - 0.4, y1: top }] };
  });
  api.light(T.x, T.z, 12, '#ffd8a0', 0.3);
  api.pickup('bag:weed', T.x - 4, 0.9, T.z + 7);
  api.pickup('water', T.x + 0.6, top + 0.9, T.z + 1.4);
};

BW5.buildFarOcto = function (api) {
  // a distant silhouette on the horizon (only really visible from the lookout)
  const O = { x: 108, z: -300 };
  BW5.FAR_OCTO = O;
  api.mesh(O.x, O.z, m => {
    m.color('#5a2a2a'); BW567K.ellip(m, 0, 7, 0, 3.6, 4.6, 3.8);
    m.color('#3a1a1a'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; BW567K.limb(m, Math.sin(a) * 2.6, 3.4, Math.cos(a) * 2.6, Math.sin(a) * 6.5, 0.4, Math.cos(a) * 6.5, 0.8, 0.3); }
    m.color('#2a2a30'); BW567K.rbox(m, 0, 1.4, 0, 8, 1.6, 12, 0.5);
    m.color('#ffb020', 1); BW567K.ball(m, 1.6, 8, 3.1, 0.7); BW567K.ball(m, -1.6, 8, 3.1, 0.7); m.emissive(0);
    return { cols: [] };
  }, { yaw: -0.6 });
};

/* ---------------- meshes ---------------- */
BW5.cartMesh = function (m, col) {
  const c = col || '#b8c0cc', d = shade(c, -0.45);
  m.color(c).shine(3); BW567K.rbox(m, 0, 0.8, 0.04, 0.6, 0.42, 0.94, 0.05); m.shine(0);
  m.color(d);
  for (let i = 0; i < 6; i++) { const z = -0.37 + i * 0.165; m.box(0.306, 0.8, z, 0.012, 0.38, 0.025); m.box(-0.306, 0.8, z, 0.012, 0.38, 0.025); }
  for (let i = 0; i < 4; i++) m.box(-0.21 + i * 0.14, 0.8, 0.515, 0.025, 0.38, 0.012);
  m.color('#dfe4ea').shine(3);
  BW567K.limb(m, -0.31, 1.01, -0.43, -0.31, 1.01, 0.5, 0.022); BW567K.limb(m, 0.31, 1.01, -0.43, 0.31, 1.01, 0.5, 0.022); BW567K.limb(m, -0.31, 1.01, 0.5, 0.31, 1.01, 0.5, 0.022);
  BW567K.limb(m, -0.3, 1.0, -0.43, -0.3, 1.1, -0.58, 0.02); BW567K.limb(m, 0.3, 1.0, -0.43, 0.3, 1.1, -0.58, 0.02);
  for (const [x, z] of [[0.24, 0.36], [-0.24, 0.36], [0.24, -0.36], [-0.24, -0.36]]) BW567K.limb(m, x * 1.1, 0.58, z * 1.15, x, 0.14, z, 0.02);
  m.color('#e82a3a'); BW567K.limb(m, -0.33, 1.1, -0.58, 0.33, 1.1, -0.58, 0.04);
  m.shine(0);
  m.color(d); m.box(0, 0.24, 0, 0.5, 0.025, 0.78);
  m.color('#22222a'); for (const [x, z] of [[0.24, 0.36], [-0.24, 0.36], [0.24, -0.36], [-0.24, -0.36]]) BW567K.ball(m, x, 0.08, z, 0.08, { seg: 8, rings: 5 });
};
BW5.palletMesh = function (m, load, size) {
  const s = size || 2.2;
  m.color('#c8965a');
  for (let i = 0; i < 5; i++) BW567K.rbox(m, -s / 2 + 0.2 + i * (s - 0.4) / 4, 0.21, 0, 0.32, 0.06, s, 0.02);
  for (const z of [-s / 2 + 0.15, 0, s / 2 - 0.15]) BW567K.rbox(m, 0, 0.1, z, s, 0.14, 0.24, 0.03);
  if (load) { m.color('#8ad0ff').shine(2); BW567K.rbox(m, 0, 0.62, 0, s - 0.3, 0.8, s - 0.3, 0.15); m.color('#d8aa70'); m.box(0, 1.03, 0, s - 0.4, 0.02, 0.2); m.shine(0); }
};
BW5.garyMesh = function (m) {
  m.color('#2a8ac8').shine(2); BW567K.rbox(m, 0, 0.32, 0, 0.82, 0.52, 0.5, 0.1); m.color('#f4f4f0'); BW567K.rbox(m, 0, 0.62, 0, 0.86, 0.12, 0.54, 0.05); m.shine(0);
  m.color('#e8e8f0'); BW567K.limb(m, -0.3, 0.68, 0, 0.3, 0.68, 0, 0.03);
  // googly eyes
  m.color('#ffffff'); BW567K.ball(m, 0.17, 0.4, 0.27, 0.11, { seg: 10, rings: 6 }); BW567K.ball(m, -0.17, 0.4, 0.27, 0.11, { seg: 10, rings: 6 });
  m.color('#111111'); BW567K.ball(m, 0.19, 0.37, 0.36, 0.05, { seg: 8, rings: 5 }); BW567K.ball(m, -0.15, 0.39, 0.36, 0.05, { seg: 8, rings: 5 });
  m.color('#1a1a1a'); m.box(0, 0.24, 0.255, 0.22, 0.03, 0.01);
};
BW5.forkMesh = function (m) {
  // bone 0: body; bone 1: carriage + forks; bone 2: the pallet on the forks
  m.setBone(0);
  m.color('#ffb81c').shine(2); BW567K.rbox(m, 0, 0.78, -0.25, 1.6, 0.95, 2.3, 0.3);
  m.color('#2a2a30'); BW567K.rbox(m, 0, 0.9, -1.4, 1.55, 1.05, 0.55, 0.22);
  for (const [x, z] of [[0.66, 0.35], [-0.66, 0.35], [0.66, -1.1], [-0.66, -1.1]]) BW567K.limb(m, x, 1.2, z, x, 2.45, z * 0.95, 0.05);
  BW567K.rbox(m, 0, 2.5, -0.38, 1.5, 0.12, 1.65, 0.05);
  m.color('#3a3a44'); BW567K.rbox(m, 0, 1.38, -0.6, 0.62, 0.22, 0.56, 0.08); BW567K.rbox(m, 0, 1.7, -0.86, 0.6, 0.6, 0.14, 0.06);
  m.color('#1a1a1a'); m.push(); m.tf(0, 1.62, 0.12, 0, 0.7); BW567K.torus(m, 0, 0, 0, 0.2, 0.025, { seg: 12, tseg: 4 }); m.pop();
  for (const [x, z, r] of [[0.8, 0.5, 0.4], [-0.8, 0.5, 0.4], [0.8, -1.05, 0.34], [-0.8, -1.05, 0.34]]) { m.push(); m.tf(x, r, z, 0, 0, Math.PI / 2); m.color('#1a1a1e'); BW567K.rcyl(m, 0, -0.18, 0, r, 0.36, 0.1); m.color('#d8d8d8'); BW567K.rcyl(m, 0, -0.19, 0, r * 0.5, 0.38, 0.04); m.pop(); }
  m.color('#3a3a44'); for (const sx of [-1, 1]) BW567K.rbox(m, sx * 0.48, 1.7, 0.95, 0.12, 3.2, 0.14, 0.04);
  m.color('#ffd84a', 1); m.box(0.55, 1.0, 0.92, 0.18, 0.12, 0.04); m.box(-0.55, 1.0, 0.92, 0.18, 0.12, 0.04); m.emissive(0);
  const plate = BURNS_ATLAS.sign('BARTER\nLIFT', { bg: '#2a1a0a', fg: '#ffd84a', size: 30, pad: 6 });
  m.color('#ffffff', 0.3); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 0.95, 1.69, 0.9, 0.9 / plate.aspect, plate); m.pop(); m.emissive(0);
  m.shine(0);
  m.setBone(1);
  m.color('#5a5a62'); BW567K.rbox(m, 0, 0.45, 1.05, 1.2, 0.8, 0.1, 0.04);
  m.color('#3a3a44'); for (const sx of [-1, 1]) BW567K.rbox(m, sx * 0.36, 0.08, 1.75, 0.16, 0.08, 1.4, 0.03);
  m.setBone(2);
  m.push(); m.tf(0, 0.14, 1.85); BW5.palletMesh(m, true, 1.6); m.pop();
};

/* ============================================================ behaviours ============================================================ */
// Snatchy Steve: runs laps of the parking lot with Gary on his head; stops to catch his breath
BurnsBehaviors.register('bw5Snatch', {
  init(a) { a.data.mode = 'idle'; a.data.t = 0; a.data.dir = 1; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP(), C = { x: 0, z: 88 }, R = 23;
    D.t -= dt;
    if (D.mode === 'idle') {
      a.ch.play('idle'); a.moveTo(a.x, a.z, 0, dt);
      if (d < 16 && g.missions.state('gary') === 'active') { D.mode = 'run'; D.t = 4.5; a.say('Finders keepers! Gifters weepers!', 1.8); }
      else if (d < 9 && Math.random() < dt * 0.5) a.say(['Nice cooler, huh? It\'s mine. Now.', 'Gary and I are in love.'][Math.floor(Math.random() * 2)], 1.6);
    } else if (D.mode === 'run') {
      const ang = Math.atan2(a.x - C.x, a.z - C.z), pang = Math.atan2(p.x - C.x, p.z - C.z);
      const away = BurnsM.wrap(ang - pang); D.dir = away >= 0 ? 1 : -1;
      const tgt = ang + D.dir * 0.55, tx = C.x + Math.sin(tgt) * R, tz = C.z + Math.cos(tgt) * R;
      a.moveTo(tx, tz, d < 10 ? 6.4 : 5.2, dt, 0.2); a.ch.play('run', { rate: 0.95 });
      if (Math.random() < dt * 4) g.fx.dust(a.x, a.y + 0.05, a.z, 1);
      if (D.t <= 0) { D.mode = 'tired'; D.t = 1.8; a.say(['Gary is SO heavy!', 'Hold on... cardio...', 'Why is he full of ROCKS?'][Math.floor(Math.random() * 3)], 1.8); }
    } else if (D.mode === 'tired') {
      a.moveTo(a.x, a.z, 0, dt); a.ch.play('hurt'); if (D.t <= 0) { D.mode = 'run'; D.t = 4 + Math.random() * 1.5; }
    }
    BurnsBehaviors.contact(a, g, 0);
    a.physics(dt);
  }
});
// cart-pushing hoarder: pushes a puppet cart along a ping-pong path; the cart hurts on contact
BurnsBehaviors.register('bw5Hoarder', {
  init(a) { a.data.i = 1; a.data.wait = 0; },
  update(a, g, dt) {
    const D = a.data, P = a.def.path, tgt = P[D.i];
    if (D.wait > 0) { D.wait -= dt; a.moveTo(a.x, a.z, 0, dt); a.ch.play('idle'); if (D.wait <= 0 && Math.random() < 0.5) a.say(['Ooh, a sale on nothing!', 'Mine. Mine. Also mine.', 'BULK!'][Math.floor(Math.random() * 3)], 1.4); }
    else { const d = a.moveTo(tgt[0], tgt[1], a.speed, dt, 0.4); a.ch.play('walk', { rate: 1.1 }); if (d < 0.6) { D.i = 1 - D.i; D.wait = 1.2; } }
    BurnsBehaviors.contact(a, g, 1);
    a.physics(dt);
  }
});
// the Barter Baron on his forklift
BurnsBehaviors.register('bw5Baron', {
  init(a) { a.data.mode = 'park'; a.data.t = 1; a.data.lift = 0; a.data.ang = 0; a.data.tagT = 1.5; a.data.cycle = 0; },
  hit(a, g, kind) {
    if (a.data.mode === 'stuck') return true;
    a.say(['No haggling!', 'Make me an OFFER!', 'That\'s not a trade!', 'Price check: NO.'][Math.floor(Math.random() * 4)], 1.1);
    const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 8, 6, dz / d * 8); burnsSfx('bump');
    return false;
  },
  update(a, g, dt) {
    const D = a.data, p = g.player, A = BW5.DOCK, S = BW5.state;
    D.t -= dt;
    a.r = D.mode === 'stuck' ? 0.45 : 1.25;
    const inArena = Math.hypot(p.x - A.x, p.z - A.z) < A.r + 4;
    if (D.mode === 'park') { a.ch.play('sit'); a.vx = a.vz = 0; a.physics(dt); return; }
    const phase = a.hp <= 2 ? 1 : 0, sp = phase ? 7.2 : 5.6;
    if (D.mode === 'drive') {
      // circle the dock, tossing price tags
      D.ang += dt * sp / 11 * (D.cw || 1);
      const tx = A.x + Math.sin(D.ang) * 11, tz = A.z + Math.cos(D.ang) * 11;
      a.moveTo(tx, tz, sp, dt, 0.2); a.ch.play('sit');
      D.tagT -= dt;
      if (D.tagT <= 0 && inArena) {
        D.tagT = phase ? 1.15 : 1.6;
        const txt = ['TRADE?', '3 FOR 1!', 'BOGO!', 'NO RETURNS!', 'MAKE AN OFFER!', 'PRICE CHECK!', 'CASH ONLY!'][Math.floor(Math.random() * 7)];
        g.projectile({ kind: 'pitch', x: a.x, y: a.y + 3.0, z: a.z, speed: phase ? 4.6 : 3.8, homing: 1.4, life: 5, text: txt, dmg: 1, r: 0.55, bw5: true });
        burnsSfx('pitch_blah', { vol: 0.6, pitch: 1.3 });
      }
      if (D.t <= 0 && inArena) { D.cycle++; if (D.cycle % 3 === 2) { D.mode = 'drop'; D.t = 1.6; D.lift = 0; a.say('PALLET DROP! NO REFUNDS!', 1.4); } else { D.mode = 'aim'; D.t = 1.0; a.say(['MAKE ME AN OFFER!', 'BUY ONE, GET YOU FREE!', 'PRICE CHECK ON AISLE YOU!'][Math.floor(Math.random() * 3)], 1.2); burnsSfx('artcarHorn', { pitch: 0.7, vol: 0.6 }); } }
    } else if (D.mode === 'aim') {
      a.face(p.x, p.z, dt, 7); a.moveTo(a.x, a.z, 0, dt); a.ch.play('sit');
      if (Math.random() < dt * 30) g.fx.smoke(a.x - Math.sin(a.yaw) * 1.6, a.y + 0.6, a.z - Math.cos(a.yaw) * 1.6, 1, '#6a6a72');
      a.x += Math.sin(g.time * 70) * 0.008;
      if (D.t <= 0) { D.mode = 'charge'; D.t = 1.9; D.dx = Math.sin(a.yaw); D.dz = Math.cos(a.yaw); D.bump = 0; }
    } else if (D.mode === 'charge') {
      const s = phase ? 12.5 : 10.5; a.vx = D.dx * s; a.vz = D.dz * s; a.ch.play('sit');
      if (Math.random() < dt * 20) g.fx.dust(a.x, a.y + 0.1, a.z, 2);
      const out = Math.hypot(a.x - A.x, a.z - A.z) > A.r - 1.2;
      if ((D.bump || 0) > 0 || out || D.t <= 0) {
        D.bump = 0; D.mode = 'stuck'; D.t = phase ? 2.8 : 3.4; D.fx = a.x; D.fz = a.z; D.fyaw = a.yaw;
        a.vx = a.vz = 0; g.shake(0.45); burnsSfx('bump'); burnsSfx('stomp'); g.fx.dust(a.x, a.y + 0.3, a.z, 16);
        a.say(['This forklift was a TRADE! I got ROBBED!', 'WHO PUT THAT THERE?! I did. I put that there.', 'Warranty VOID!'][Math.floor(Math.random() * 3)], 2.0);
        // hop off to the side
        a.x += Math.cos(a.yaw) * 1.6; a.z -= Math.sin(a.yaw) * 1.6;
      }
      BurnsBehaviors.contact(a, g, 1, 9);
    } else if (D.mode === 'stuck') {
      a.vx = BurnsM.damp(a.vx, 0, 6, dt); a.vz = BurnsM.damp(a.vz, 0, 6, dt); a.ch.play('hurt'); a.yaw += dt * 3;
      if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + a.h + 0.2, a.z, 'star', 1, '#ffe24a');
      if (D.t <= 0) { D.mode = 'drive'; D.t = 4 + Math.random() * 2; a.x = D.fx; a.z = D.fz; a.yaw = D.fyaw; D.ang = Math.atan2(a.x - A.x, a.z - A.z); D.cw = Math.random() < 0.5 ? 1 : -1; a.say('Back on the lift! Prices are UP!', 1.4); }
    } else if (D.mode === 'drop') {
      a.moveTo(a.x, a.z, 0, dt); a.face(p.x, p.z, dt, 4); a.ch.play('sit');
      D.lift = Math.min(1, D.lift + dt * 1.4);
      if (D.t <= 0.35 && !D.dropped) {
        D.dropped = true; const fx = a.x + Math.sin(a.yaw) * 2.2, fz = a.z + Math.cos(a.yaw) * 2.2;
        g.shockwave({ x: fx, z: fz, y: 0, speed: 9, max: 16, h: 0.65, dmg: 1, col: '#ffb020', dust: true });
        g.fx.dust(fx, 0.2, fz, 20); g.shake(0.4); burnsSfx('groundpound');
      }
      if (D.t <= 0) { D.mode = 'drive'; D.t = 4.5; D.dropped = false; D.lift = 0; }
    } else if (D.mode === 'beaten') { a.ch.play('dance', { style: 1 }); a.vx = a.vz = 0; }
    a.physics(dt);
  }
});

/* ============================================================ runtime ============================================================ */
BW5.makePuppets = function (g) {
  const S = BW5.state;
  const cartGeo = BW567K.geo('w5carts16', m => { for (let i = 0; i < 16; i++) { m.setBone(i); BW5.cartMesh(m, i % 4 === 0 ? '#c8ccd8' : '#b8c0cc'); } });
  const carts = new BW567Puppet(g, cartGeo, 16);
  S.cartP = carts;
  g.addBoss(carts);
  // avalanche carts: puppet bones 3..14
  for (let i = 3; i < 15; i++) S.carts.push({ i, on: false, x: 0, y: 0, z: 0, vx: 0, vz: 0, wait: 0, yaw: 0, hitT: 0 });
  const forkGeo = BW567K.geo('w5fork', m => BW5.forkMesh(m));
  const fork = new BW567Puppet(g, forkGeo, 3);
  fork.cols = [{ t: 'box', hx: 0.85, hz: 1.4, y0: 0, y1: 2.5, walk: true, solid: true, cover: true }];
  fork.addColliders = function () { if (this.hidden || !this.colOn) return; for (const c of this.cols) this.g.world.col.addDyn(c); };
  S.forkP = fork;
  g.addBoss(fork);
};
BW5.updateCarts = function (g, dt) {
  const S = BW5.state, P = S.cartP; if (!P) return;
  // hoarder carts (bones 0..2) ride in front of their hoarders
  for (let i = 0; i < 3; i++) {
    const a = g.actor('hoard' + i);
    if (!a) { P.off(i); continue; }
    const x = a.x + Math.sin(a.yaw) * 1.05, z = a.z + Math.cos(a.yaw) * 1.05;
    P.set(i, x, a.y, z, a.yaw);
    if (!a.defeated && !g.cine) BW567K.hurtNear(g, x, a.y, z, 0.55, 1, 7);
  }
  // the Cart Chute avalanche
  const C = BW5.CHUTE, on = S.chute.on;
  for (const c of S.carts) {
    if (!c.on) {
      P.off(c.i);
      if (!on) continue;
      c.wait -= dt; if (c.wait > 0) continue;
      c.on = true; c.x = (Math.random() - 0.5) * 15; c.z = C.z0 + 0.6; c.vx = (Math.random() - 0.5) * 6; c.vz = 4.5 + Math.random() * 3.5; c.hitT = 0; c.spin = 0;
      if (Math.random() < 0.3) burnsSfx('bump', { pitch: 0.6, vol: 0.4 });
    }
    c.vz = Math.min(c.vz + dt * 2.2, 11);
    c.x += c.vx * dt; c.z += c.vz * dt;
    if (Math.abs(c.x) > 8.4) { c.x = Math.sign(c.x) * 8.4; c.vx = -c.vx * 0.9; if (Math.random() < 0.5) burnsSfx('bump', { vol: 0.25, pitch: 1.4 }); }
    c.y = BW5.chuteY(c.z);
    c.spin = (c.spin || 0) * Math.exp(-2 * dt);
    c.yaw = Math.atan2(c.vx, c.vz) + c.spin;
    if (c.hitT > 0) c.hitT -= dt;
    if (c.z > C.z1 + 1.5) { c.on = false; c.wait = 0.3 + Math.random() * 1.9; g.fx.dust(c.x, 0.3, c.z, 6); P.off(c.i); continue; }
    P.set(c.i, c.x, c.y, c.z, c.yaw, Math.atan2(C.h, C.z1 - C.z0));
    // hit Brady / Biscuit
    if (!g.cine) {
      const p = g.player;
      if (Math.abs(p.x - c.x) < 0.75 && Math.abs(p.z - c.z) < 0.85 && p.y < c.y + 1.0) p.hurt(1, c.x, c.z - 1.5, 8);
      const b = g.actor('biscuit');
      if (b && on && c.hitT <= 0 && Math.abs(b.x - c.x) < 0.85 && Math.abs(b.z - c.z) < 0.9 && b.y < c.y + 1.0) {
        c.hitT = 1; b.vx = (b.x - c.x) * 3; b.vz = 7; b.vy = 6; b.grounded = false; S.chute.hits++;
        g.fx.burst(b.x, b.y + 1.5, b.z, 'star', 10, '#ffe24a'); burnsSfx('hurt3d', { pitch: 0.7 });
        b.say(['OOF! MY SNACKS!', 'CART TO THE SHIN!', 'I\'m okay! Gary\'s okay!'][Math.min(2, S.chute.hits - 1)], 1.6);
        if (S.chute.hits >= 3) g.missions.fail('escort', 'Biscuit got carted!');
        else g.toast(`BISCUIT GOT HIT! ${3 - S.chute.hits} MORE AND HE'S DONE`);
      }
    }
  }
};
// spin deflects nearby carts (the player calls g.spinHit while spinning)
BW5.spinCarts = function (g, x, y, z, r) {
  for (const c of BW5.state.carts) {
    if (!c.on || c.spin > 2) continue;
    if (Math.hypot(c.x - x, c.z - z) < r + 0.6 && Math.abs(c.y - y) < 1.6) {
      const dx = c.x - x || 0.1; c.vx = Math.sign(dx) * 9; c.vz = Math.max(c.vz, 6); c.spin = 6; c.hitT = 0.6;
      g.fx.burst(c.x, c.y + 0.8, c.z, 'star', 8, '#38f2ff'); burnsSfx('bump', { pitch: 1.6, vol: 0.5 }); g.toast('CART DEFLECTED!');
    }
  }
};
BW5.chuteStart = function (g) {
  const S = BW5.state; S.chute.on = true; S.chute.hits = 0;
  S.carts.forEach((c, k) => { c.on = false; c.wait = 0.5 + k * 0.35; });
  burnsSfx('crowd', { vol: 0.4 }); g.shake(0.3);
  const b = g.actor('biscuit'); if (b) { if (b.behName !== 'follow') b.setBehavior('follow'); b.say('CARTS AWAAAAY! Stick close, buddy!', 2.2); }
  g.banner('CART AVALANCHE!', 'Spin carts away from Biscuit. Jump the rest.', { col: '#ffd84a' });
};
BW5.chuteReset = function (g) {
  const S = BW5.state; S.chute.on = false; S.chute.hits = 0;
  for (const c of S.carts) { c.on = false; S.cartP.off(c.i); }
  const b = g.actor('biscuit'); if (b) { b.x = -3; b.z = -20; b.y = 0; b.vx = b.vz = b.vy = 0; b.say('Ow. Okay. Again! Gary believes in us.', 2.4); }
};
BW5.chuteDone = function (g) {
  const S = BW5.state; S.chute.on = false;
  for (const c of S.carts) { c.on = false; S.cartP.off(c.i); }
  const b = g.actor('biscuit'); if (b) { b.setBehavior('idle'); b.x = 2.2; b.z = -75.2; b.y = BW5.CHUTE.h; }
  BW567K.after(g, 0.6, g2 => BW5.talkRhonda(g2, g2.actor('rhonda'), true));
};
BW5.updateLifts = function (g, dt) {
  for (const L of BW5.state.lifts) {
    const u = ((g.time + L.ph) % L.per) / L.per, tri = u < 0.5 ? u * 2 : 2 - u * 2;
    L.mv.y = lerp(L.lo, L.hi, BurnsM.smoothstep(0.12, 0.88, tri));
  }
};
BW5.openTurnstiles = function (g, quiet) {
  const S = BW5.state; if (S.turnOpen) return; S.turnOpen = true; S.barrier.off = true;
  if (!quiet) { burnsSfx('crowd_cheer', { vol: 0.5 }); g.toast('TURNSTILES OPEN. WELCOME, MEMBER!'); }
};
BW5.updateTurnstiles = function (g, dt) {
  const S = BW5.state;
  for (const mv of S.turn) mv.yaw += dt * (S.turnOpen ? 2.4 : 0);
  if (S.tollArm) S.tollArm.roll = BurnsM.damp(S.tollArm.roll || 0, S.tollOpen ? 1.35 : 0, 2, dt);
};
BW5.openToll = function (g, quiet) { const S = BW5.state; S.tollOpen = true; if (S.toll) S.toll.off = true; if (!quiet) g.toast('THE LOOKOUT GATE IS OPEN!'); };
BW5.updateGary = function (g, dt) {
  const S = BW5.state, G = S.gary; if (!G) return;
  const mv = G.mv;
  if (G.mode === 'thief') {
    const a = g.actor('steve');
    if (!a || a.defeated) { if (!BurnsSave.hasToken(5, 'gary') && G.mode === 'thief' && a) BW5.garyDrop(g); return; }
    mv.visible = true; mv.x = a.x; mv.z = a.z; mv.y = a.y + a.h + 0.02 + Math.abs(Math.sin(g.time * 9)) * 0.06 * (a.data.mode === 'run' ? 1 : 0); mv.yaw = a.yaw;
  } else if (G.mode === 'fall') {
    G.vy -= 18 * dt; mv.y += G.vy * dt; mv.yaw += dt * 6;
    if (mv.y <= 0) { mv.y = 0; G.mode = 'ground'; g.fx.dust(mv.x, 0.1, mv.z, 8); burnsSfx('land'); }
  } else if (G.mode === 'ground') {
    mv.visible = true;
    const p = g.player;
    if (Math.hypot(p.x - mv.x, p.z - mv.z) < 1.5 && p.y < 1.5 && g.missions.state('gary') === 'active') {
      G.mode = 'biscuit'; burnsSfx('pick'); g.fx.hearts(mv.x, 1, mv.z, 10);
      g.missions.complete('gary', { x: mv.x, y: 1.4, z: mv.z });
    }
  } else if (G.mode === 'biscuit') {
    const b = g.actor('biscuit');
    if (!b || b.hidden) { mv.visible = false; return; }
    mv.visible = true;
    const sitting = b.behName === 'sit';
    if (sitting) { mv.x = BW5.BISCUIT_PIC.x + 0.8; mv.z = BW5.BISCUIT_PIC.z; mv.y = 0.83; mv.yaw = 2.6; }
    else { mv.x = b.x - Math.sin(b.yaw) * 0.42; mv.z = b.z - Math.cos(b.yaw) * 0.42; mv.y = b.y + 0.95 * (b.scale || 1); mv.yaw = b.yaw + Math.PI; }
  }
};
BW5.garyDrop = function (g) {
  const G = BW5.state.gary; if (!G || G.mode !== 'thief') return;
  G.mode = 'fall'; G.vy = 6; g.toast('GARY! GRAB HIM!'); burnsSfx('pick', { pitch: 1.4 });
  const b = g.actor('biscuit'); if (b) b.say('GARYYYY! Grab him, Brady!', 2);
};
BW5.placeBiscuit = function (g) {
  const b = g.actor('biscuit'), G = BW5.state.gary; if (!b) return;
  const done = id => g.missions.isDone(id);
  if (BurnsSave.get().worldDone[5] || !done('gary')) { b.setBehavior('sit'); if (done('gary')) G.mode = 'biscuit'; return; }
  G.mode = 'biscuit';
  if (done('escort')) { b.setBehavior('idle'); b.x = 2.2; b.z = -75.2; b.y = BW5.CHUTE.h; return; }
  b.setBehavior('follow'); const p = g.player; b.x = p.x + 1.5; b.z = p.z + 1.5; b.y = 0;
};
BW5.biscuitJoins = function (g) {
  const b = g.actor('biscuit');
  BW567K.after(g, 0.8, g2 => {
    g2.say(b, ['GARY! You came back! You\'re so cold! You\'re supposed to be cold!', 'I\'m Biscuit. I owe you one. And by "owe" I mean I\'m GIFTING you my friendship. Platonically. You have a wife. I have a cooler.', 'You\'re hunting an art car? Rhonda at Returns knows every art car on the playa. She\'s at the top of the Cart Chute. Let\'s go!'], () => {
      if (b) { b.setBehavior('follow'); b.def.followDist = 2.4; }
      if (!g2.missions.isDone('member')) g2.say(b, ['But first: membership cards. Marge at the front. She\'s... thorough.']);
    });
  });
};

/* ---------------- talk handlers ---------------- */
BW5.talkMarge = function (g, a) {
  const st = g.missions.state('member'), S = BW5.state;
  if (st === 'available') g.say(a, ['Welcome to Costco Soul Trading Co., hon! Membership is free, lifetime, and mandatory.', 'First: your photo. Stand on the big pink X. And don\'t smile. Nobody smiles in these.'], () => g.missions.start('member'));
  else if (st === 'active') { if (!S.photo) g.say(a, ['The X, hon. Stand on the X. Phil\'s got the camera.']); else BW5.quiz(g); }
  else g.say(a, ['Your card\'s good for life. Your life. Not mine. I\'m on shift till Tuesday.']);
};
BW5.photo = function (g) {
  const S = BW5.state, p = g.player; if (S.photo) return;
  S.photo = true;
  g.cutscene([
    { do: g2 => { p.teleport(5, 0, 66, 0); p.animOverride = 'idle'; } },
    { cam: { x: 5.4, y: 1.75, z: 69.6, tx: 5, ty: 1.55, tz: 66, fov: 0.6 } },
    { say: [g.actor('marge') || 'marge', ['Say "playa"!']] },
    { do: g2 => { g2.screenFlash('#ffffff', 0.95); burnsSfx('camera_flash'); g2.fx.flashAt(5.7, 1.7, 70.4); } },
    { wait: 0.7 },
    { say: ['brady', ['Did I blink?', '...I definitely blinked.']] },
    { do: g2 => { p.animOverride = null; } }
  ], () => BW5.quiz(g));
};
BW5.QUIZ = [
  { prompt: 'A stranger gifts you a grilled cheese. You say...', options: ['"Cool, what do I owe you?"', '"Thank you! Can I hug you?"', '"Is it gluten-free and ethically griddled?"'], right: 1,
    no: ['OWE? Hon. That\'s BARTERING. Gifts aren\'t trades. Again.', '', 'That\'s not a thank-you, that\'s a whole personality. Again.'] },
  { prompt: 'Someone gifts you a glow stick. Best follow-up?', options: ['Gift it to the next sad-looking person', 'Ask for a receipt', 'Sell it to a tech bro for crypto'], right: 0,
    no: ['', 'A RECEIPT?! The Gift Police are crying somewhere.', 'Hon. The tech bros have enough crypto. And enough everything.'] }
];
BW5.quiz = function (g) {
  const S = BW5.state, a = g.actor('marge'), Q = BW5.QUIZ[S.quiz || 0];
  if (!Q) return;
  g.say(a, [S.quiz ? 'One more. Gifting is a lifestyle, not a quiz. But this is a quiz.' : 'Lovely. You look dusty. That\'s the brand. Now the quiz.'], () => {
    BW567K.choice(g, { who: 'MARGE, MEMBERSHIP', prompt: Q.prompt, options: Q.options, def: Q.right, done(g2, i) {
      if (i === Q.right) {
        S.quiz = (S.quiz || 0) + 1;
        if (S.quiz >= BW5.QUIZ.length) {
          g2.say(a, ['PERFECT. Here\'s your card. It\'s laminated. It\'s dusty. It\'s YOU.'], () => {
            g2.banner('MEMBERSHIP CARD', 'Lifetime. Laminated. Dusty.', { col: '#38f2ff', big: true, icon: 'ticket' });
            g2.missions.complete('member', { x: -4.6, y: 1.6, z: 66.4 });
            BurnsSave.flag(5, 'card', true);
          });
        } else BW5.quiz(g2);
      } else g2.say(a, [Q.no[i] || 'Not quite, hon. Again.'], () => BW5.quiz(g2));
    } });
  });
};
BW5.talkDot = function (g, a) {
  const st = g.missions.state('sprint');
  if (st === 'locked') g.say(a, ['Members only, sweetie. Marge at the front will card you.']);
  else if (st === 'available') g.say(a, ['Six free samples, forty seconds. It\'s not a race. It\'s absolutely a race.', 'One\'s on top of the pickle jar. Don\'t ask. Toothpicks ready? GO!'], () => g.missions.start('sprint'));
  else if (st === 'active') g.say(a, ['GO GO GO! Toothpicks wait for no one!']);
  else g.say(a, ['You ate six samples in forty seconds. I\'ve never been prouder of a stranger.']);
};
BW5.talkFran = function (g, a) {
  const st = g.missions.state('pallets');
  if (st === 'locked') g.say(a, ['Members only back here. Also forklift-certified only. I\'m sort of both.']);
  else if (st === 'available') g.say(a, ['The last bag of ice on the whole playa sits on the TOP shelf of Aisle 99.', 'The forklifts are busted. They only go up and down. Forever. Ride the pallets up and grab it!'], () => g.missions.start('pallets'));
  else if (st === 'active') g.say(a, ['Up the pallets! Ice waits for no one! It literally melts!']);
  else g.say(a, ['Ice! One sad, melting cube for everybody. That\'s community.']);
};
BW5.talkBiscuit = function (g, a) {
  const gst = g.missions.state('gary'), est = g.missions.state('escort');
  if (gst === 'available') g.say(a, ['*sniff* Someone snatched Gary. My emotional support cooler.', 'He\'s got googly eyes and a bad attitude. Gary, I mean. The thief\'s got Gary.', 'See that guy running laps with a cooler on his head? Spin him. Gently. Then save Gary!'], () => g.missions.start('gary'));
  else if (gst === 'active') g.say(a, ['He gets tired! Gary\'s heavy! Gary\'s full of feelings!']);
  else if (est === 'locked') g.say(a, ['Membership first, buddy. Marge is at the front. She\'ll card you. Emotionally.']);
  else if (est === 'available') g.say(a, ['Rhonda at Returns knows every art car on the playa. She works at the top of the Cart Chute.', 'Carts come down that thing like a waterfall. Spin \'em away from me. I bruise like a peach.', 'Lead the way, buddy!'], () => g.missions.start('escort'));
  else if (est === 'active') g.say(a, ['Up the chute! I\'m right behind you! Mostly!']);
  else if (BurnsSave.get().worldDone[5]) g.say(a, ['Platonic buddies for life. Gary agrees. Gary always agrees.']);
  else g.say(a, ['Rhonda said the Baron\'s sitting on the lookout gate. Ugh. HIM.', 'Go teach him about gifting. I\'ll guard Gary.']);
};
BW5.talkRhonda = function (g, a, arrival) {
  const est = g.missions.state('escort'), b = g.actor('biscuit');
  if (!a) return;
  if (arrival || (est === 'done' && !g.missions.isDone('boss') && !BW5.state.rhondaTold)) {
    BW5.state.rhondaTold = true;
    g.say(a, ['Returns. We don\'t accept returns. Whaddya want?'], () => {
      g.say(b || 'brady', [{ who: b || 'brady', text: 'Rhonda! He\'s looking for a fire-breathing art car!' }], () => {
        g.say(a, ['El Pulpo? The octopus? Owner tried to return a propane tank yesterday. I said no. Obviously.', 'They said they were heading to deep playa. You\'d need height to spot \'em. The Overstock lookout, out the back.', 'But the Barter Baron\'s sitting on the gate. Wants a trade for everything. Out the back west door, at the loading dock.'], () => {
          if (b) b.say('Ugh. HIM.', 2);
        });
      });
    });
    return;
  }
  if (est !== 'done') g.say(a, ['No returns. No refunds. No regrets. Also no visitors, unless you survive the Chute.']);
  else g.say(a, ['No returns. No refunds. No regrets.']);
};

/* ---------------- forklift + Baron ---------------- */
BW5.updateForklift = function (g, dt) {
  const S = BW5.state, F = S.forkP; if (!F) return;
  const a = g.actor('baron');
  if (!a || BurnsSave.hasToken(5, 'boss') && !S.bossOn) {
    // parked by the dock after the fight
    F.set(0, BW5.DOCK.x - 6, 0, BW5.DOCK.z + 9, 2.2); F.child(1, F.ch.bones, 0, 0, 0, 0); F.off(2); F.colOn = true;
    F.cols[0].x = BW5.DOCK.x - 6; F.cols[0].z = BW5.DOCK.z + 9; F.cols[0].yaw = 2.2;
    return;
  }
  const D = a.data, stuck = D.mode === 'stuck' || D.mode === 'beaten';
  const fx = stuck ? D.fx : a.x, fz = stuck ? D.fz : a.z, fy = stuck ? (D.fyaw || 0) : a.yaw;
  F.set(0, fx, a.y, fz, fy);
  F.child(1, F.ch.bones, 0, 0, (D.lift || 0) * 2.2, 0);
  if (D.dropped || D.mode === 'beaten') F.off(2); else F.child(2, F.ch.bones, 12, 0, 0, 0);
  F.colOn = stuck; F.cols[0].x = fx - Math.sin(fy) * 0.25; F.cols[0].z = fz - Math.cos(fy) * 0.25; F.cols[0].yaw = fy;
  // the Baron sits on the seat while driving
  a.seatY = stuck ? 0 : 1.0;
  if (!a.bw5draw) { a.bw5draw = true; const d0 = a.draw.bind(a); a.draw = R => { d0(R); a.ch.y = a.y + (a.seatY || 0); }; }
};
BW5.bossIntro = function (g) {
  const S = BW5.state, a = g.actor('baron'), p = g.player, A = BW5.DOCK;
  if (S.bossOn || !a) return; S.bossOn = true;
  g.missions.start('boss', true);
  g.cutscene([
    { music: 'man_boss' },
    { cam: { x: A.x + 8, y: 3.5, z: A.z + 2, tx: a.x, ty: 2.2, tz: a.z, fov: 0.85 } },
    { do: g2 => { a.data.mode = 'aim'; a.data.t = 99; burnsSfx('artcarHorn', { pitch: 0.6 }); } },
    { banner: ['THE BARTER BARON', 'Everything Has a Price · Boss', { col: '#ffd84a', big: true, dur: 3 }] },
    { say: [a, ['Welcome, welcome, WELCOME! The Overstock Lookout? It\'s yours! For a small... trade.']] },
    { say: ['brady', ['This is a GIFTING camp.']] },
    { say: [a, ['And I\'m gifting you the OPPORTUNITY to make me an offer! Your man bun for the view. Final offer.']] },
    { say: ['brady', ['Not the bun.']] },
    { say: [a, ['Then we do this the hard way. EVERYTHING HAS A PRICE!']] },
    { do: g2 => { p.teleport(A.x, 0, A.z + 14, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; a.data.mode = 'drive'; a.data.t = 3.5; a.data.ang = Math.atan2(a.x - A.x, a.z - A.z); a.data.cw = 1;
      g2.boss = BW567K.bar('THE BARTER BARON', a, 4, { get st() { return a.data.mode === 'stuck' ? 'stunned' : a.data.mode; } });
      g2.banner('FIGHT!', 'Dodge his forklift so he crashes into the pallets · bonk him while he\'s stuck · spin away price tags', { col: '#ffd84a' }); } }
  ]);
};
BW5.baronDefeated = function (g) {
  const S = BW5.state, a = g.actor('baron'), A = BW5.DOCK;
  a.data.mode = 'beaten'; a.data.fx = a.data.fx || a.x; a.data.fz = a.data.fz || a.z;
  g.boss = null;
  g.missions.complete('boss');
  BW567K.after(g, 1.2, g2 => {
    g2.cutscene([
      { music: 'burns_victory' },
      { cam: { x: a.x + 4, y: 2.6, z: a.z + 5, tx: a.x, ty: 2.0, tz: a.z, fov: 0.85 } },
      { say: [a, ['My margins... my markups... my BOGOs...', 'I... I want to GIVE you something. For nothing. Is that... is that allowed?']] },
      { say: ['brady', ['That\'s literally the whole point of this place.']] },
      { do: g3 => { g3.fx.confetti(a.x, a.y + 2.5, a.z, 60); burnsSfx('crowd_cheer'); for (let i = 0; i < 10; i++) { const t = i / 10 * TAU; g3.spawnPickup('glowstick', a.x + Math.sin(t) * 2.5, 1.2, a.z + Math.cos(t) * 2.5, { pop: true }); } } },
      { say: [a, ['TAKE IT! TAKE ALL OF IT! IT\'S FREE! OH WOW, THAT FEELS AMAZING!', 'The lookout gate\'s open. On the house. Everything\'s on the house. I own NOTHING now. I feel GREAT.']] },
      { do: g3 => { BW5.openToll(g3); burnsMusic('burns_w5'); } }
    ]);
  });
};

/* ---------------- intro + finale ---------------- */
BW5.intro = function (g) {
  const S = BW5.state, p = g.player;
  g.cutscene([
    { music: 'burns_intro' },
    { cam: { x: 46, y: 34, z: 170, tx: 0, ty: 8, tz: 40, fov: 0.85 } },
    { banner: ['WORLD 5', 'COSTCO SOUL TRADING CO.', { col: '#38f2ff', big: true, dur: 3 }] },
    { cam: { from: { x: 46, y: 34, z: 170, tx: 0, ty: 8, tz: 40, fov: 0.85 }, to: { x: 6, y: 3.2, z: 146, tx: 0, ty: 4, tz: 60, fov: 0.85 }, dur: 4 } },
    { say: ['brady', ['The informant said everybody passes through Costco Soul Trading Co. eventually.', 'If I\'m catching a forty-foot wooden guy with a crush on my wife, I need wheels. Big ones. Preferably on fire.']] },
    { cam: { x: -2, y: 2.4, z: 70, tx: -7, ty: 1.6, tz: 62.6, fov: 0.8 } },
    { say: [g.actor('marge') || 'marge', ['MEMBERS! Everyone\'s a member! Come get carded, hon!']] },
    { do: g2 => { BurnsSave.flag(5, 'intro', true); S.introDone = true; g2.camYaw = Math.PI; g2.snapCam = true; burnsMusic('burns_w5'); } },
    { banner: ['GET CARDED', 'Then find a ride that breathes fire.', { col: '#ffd84a' }] }
  ]);
};
BW5.finale = function (g) {
  const T = BW5.TOWER, p = g.player, b = g.actor('biscuit'), O = BW5.FAR_OCTO;
  BW5.state.finale = true;
  const look = { x: T.x - 1.2, y: 27.6, z: T.z + 1.6, tx: O.x, ty: 9, tz: O.z, fov: 0.32 };
  g.cutscene([
    { do: g2 => { p.teleport(T.x - 1.0, 26, T.z + 0.6, Math.atan2(O.x - T.x, O.z - T.z)); if (b) { b.setBehavior('idle'); b.x = T.x + 1.3; b.z = T.z + 1.4; b.y = 26; b.def.fixedY = true; } } },
    { cam: { x: T.x + 5, y: 28.5, z: T.z + 6, tx: T.x, ty: 26.8, tz: T.z, fov: 0.85 } },
    { say: [b || 'brady', ['I took the stairs. There were stairs. Inside. The whole time.']] },
    { say: ['brady', ['Look for fire on the horizon...']] },
    { cam: look },
    { do: g2 => { BW5.state.farFire = 4.5; } },
    { wait: 1.4 },
    { say: [b || 'brady', ['THERE! Fire on the horizon! That\'s El Pulpo, the fire-breathing octopus!']] },
    { say: ['brady', ['If anything can catch a forty-foot wooden lover... it\'s a fire-breathing octopus.']] },
    { cam: { x: T.x + 4, y: 27.8, z: T.z + 4, tx: T.x, ty: 26.9, tz: T.z, fov: 0.8 } },
    { say: [b || 'brady', ['It roams deep playa at night. I\'ll meet you out there. I\'m bringing snacks. And Gary.', 'Platonic buddies FOREVER. Or until Sunday. Whichever comes first.']] },
    { do: g2 => { BurnsSave.flag(5, 'octopusSpotted', true); p.victoryT = 3; burnsSfx('crowd_cheer'); g2.fx.confetti(p.x, p.y + 2, p.z, 50); } },
    { wait: 1.2 }
  ], g2 => g2.finishWorld());
};

/* ---------------- sprites + overlay ---------------- */
BW5.drawLabels = function (ctx, g) {
  const R = g.R, W = Game.cssW, H = Game.cssH, o = {};
  for (const q of g.proj.list) {
    if (!q.text || q.dead) continue;
    if (!R.project(q.x, q.y + 0.6, q.z, W, H, o) || o.w > 40) continue;
    BurnsUI.text(ctx, q.text, o.x, o.y, clamp(160 / o.w, 9, 16), '#ffe8a0', { glow: '#ff9a2a' });
  }
};
// distant El Pulpo fire (finale) — drawn by a tiny always-on puppet-less hook via def.drawSprites
BurnsWorlds.get(5).drawSprites = function (g, R) {
  const S = BW5.state; if (!S || !S.farFire) return;
  const O = BW5.FAR_OCTO, S2 = BURNS_SPRITES.R;
  S.farFire = Math.max(0, S.farFire - 1 / 60);
  const k = 0.5 + 0.5 * Math.sin(g.time * 7);
  R.bbs.bb(O.x, 12 + k * 4, O.z, 14, 26, S2.flame, [1, 0.55, 0.15], 1, true);
  R.bbs.bb(O.x - 4, 10 + k * 3, O.z + 2, 8, 16, S2.flame, [1, 0.7, 0.2], 1, true);
  R.bbs.bb(O.x, 10, O.z, 40, 40, S2.glow, [1, 0.5, 0.2], 0.7, true);
  if (Math.random() < 0.5) g.fx.add(O.x + (Math.random() - 0.5) * 4, 11, O.z, (Math.random() - 0.5) * 3, 14 + Math.random() * 8, 0, 1.0, 5, 2, [1, 0.6, 0.2], 1, 'flame', 1);
};
