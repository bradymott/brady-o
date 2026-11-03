/* ============================================================
   BRADY GOES TO BURNING MAN — World 99: BIG ART SANDBOX (debug only)
   Not in BURNS_WORLD_ORDER and not on the hub. Open it from the console / tests:
     window.BRADY_BURNS.debug.play(99)
   Shows every BurnsBigArt piece (src/41_burns_bigart.js) on one open playa, with the yellow
   bike, a summit token mission per piece, and a day/night toggle (g.tod 0..1).
   ============================================================ */
const BURNS_W99 = {
  LAYOUT: [
    ['knottedSemi', -110, -60, 0],
    ['pumpJack', -10, -130, Math.PI / 2],
    ['sleepingGiant', 100, -100, 0.35],
    ['galleon', 150, 40, 0],
    ['stickCathedral', 45, 125, Math.PI],
    ['glowshroomGrove', -60, 110, 0],
    ['lighthouses', -150, 130, 0.4],
    ['retroRocket', 20, -15, -0.6]
  ],
  pieces: {}
};

BurnsWorlds.register({
  id: 99, name: 'Big Art Sandbox', sub: 'Debug: every big art piece',
  sky: 'day', sky2: 'night', tod: 0,
  music: 'burns_w9',
  bounds: [-210, -210, 210, 210],
  spawn: { x: 0, y: 0, z: 45, yaw: Math.PI },
  ground: { base: '#c9a07c', crack: 0.26, mottle: 0.4, res: 0.5 },
  bike: true,
  missions: BURNS_W99.LAYOUT.filter(l => BurnsBigArt.kinds[l[0]]).map(l => BurnsBigArt.mission(l[0], 'top_' + l[0], { hint: 'Sandbox: ' + BurnsBigArt.kinds[l[0]].name })),
  build(api, g) {
    const W = BURNS_W99;
    W.pieces = {};
    api.paint((c, P, sc) => {
      const R = mulberry32(99);
      for (let i = 0; i < 220; i++) { const x = R() * 420 - 210, z = R() * 420 - 210, [px, pz] = P(x, z), r = (2 + R() * 9) * sc; const gr = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gr.addColorStop(0, dark ? 'rgba(120,85,65,0.22)' : 'rgba(235,205,170,0.22)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    });
    for (const [kind, x, z, rot] of W.LAYOUT) {
      if (!BurnsBigArt.kinds[kind]) continue;
      W.pieces[kind] = BurnsBigArt.place(api, g, kind, x, z, { rotY: rot, mission: 'top_' + kind });
      const cp = W.pieces[kind].F.w(0, 0, -BurnsBigArt.kinds[kind].size * 0.45 - 6);
      api.checkpoint('cp_' + kind, cp[0], cp[2], { yaw: rot, name: BurnsBigArt.kinds[kind].name });
      api.marker(kind, x, z, BurnsBigArt.kinds[kind].name, { col: '#ffd84a' });
    }
    api.sign('BIG ART SANDBOX\n(debug world)', 0, 30, { yaw: Math.PI, h: 1.4, style: { bg: '#1a0a2a', fg: '#ffd84a', size: 40, border: '#ff4fd8', glow: '#ff4fd8' }, glow: '#ff4fd8' });
    api.pickup('water', 3, 0.9, 38);
  },
  onStart(g) {
    g.giveItem('bike', true); g.giveItem('map', true); g.giveItem('www', true);
    g.banner('BIG ART SANDBOX', 'Every big art piece in one place. (Debug world)', { col: '#ffd84a' });
  }
});
