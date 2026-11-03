/* ============================================================
   BRADY GOES TO BURNING MAN — World 98: THEME CAMP SANDBOX (debug only)
   Not in BURNS_WORLD_ORDER and not on the hub. Open it from the console / tests:
     window.BRADY_BURNS.debug.play(98)
   Every BurnsCamps camp (src/41_burns_camps.js) on one open playa, with the yellow bike,
   a day/night toggle (g.tod 0..1: day -> night) and a far-LOD silhouette row on the horizon.
   ============================================================ */
const BURNS_W98 = {
  // kind, x, z, rotY (the camp's front faces rotY)
  LAYOUT: [
    ['rootSociety', 0, 0, 0],
    ['playground', 185, -40, -Math.PI / 2],
    ['opulentTemple', 185, 95, -Math.PI / 2],
    ['campQuestionMark', -180, 95, Math.PI / 2],
    ['disorient', -180, -40, Math.PI / 2],
    ['deepEnd', -180, -170, Math.PI / 2],
    ['thunderdome', 0, 175, Math.PI],
    ['centerCamp', 0, -205, 0],
    ['spaceCowboys', 185, -175, -Math.PI / 2],
    ['solSystem', -175, 215, Math.PI * 0.75]
  ],
  camps: {}
};

BurnsWorlds.register({
  id: 98, name: 'Theme Camp Sandbox', sub: 'Debug: every theme camp',
  sky: 'day', sky2: 'night', tod: 0,
  music: 'burns_w11',
  bounds: [-300, -300, 300, 300],
  spawn: { x: 0, y: 0, z: 82, yaw: Math.PI },
  ground: { base: '#c9a07c', crack: 0.26, mottle: 0.4, res: 0.5 },
  bike: true,
  dayCard: false,
  missions: [],
  build(api, g) {
    const W = BURNS_W98;
    W.camps = {};
    api.paint((c, P, sc) => {
      const R = mulberry32(98);
      for (let i = 0; i < 260; i++) { const x = R() * 600 - 300, z = R() * 600 - 300, [px, pz] = P(x, z), r = (2 + R() * 9) * sc; const gr = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gr.addColorStop(0, dark ? 'rgba(120,85,65,0.2)' : 'rgba(235,205,170,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    });
    for (const [kind, x, z, rot] of W.LAYOUT) {
      if (!BurnsCamps.kinds[kind]) continue;
      W.camps[kind] = BurnsCamps.place(api, g, kind, x, z, { rotY: rot, marker: true, djPrompt: true });
    }
    // the open-world skyline test: far silhouettes of a few camps out past the trash fence line
    let k = 0;
    for (const kind of Object.keys(BurnsCamps.kinds)) { if (k >= 4) break; BurnsCamps.silhouette(api, g, kind, -240 + k * 160, -285, { id: 'far_' + kind, rotY: 0, crowd: false }); k++; }
    api.sign('THEME CAMP SANDBOX\n(debug world)', 8, 76, { yaw: Math.PI, h: 1.3, style: { bg: '#1a0a2a', fg: '#ffd84a', size: 40, border: '#ff4fd8', glow: '#ff4fd8' }, glow: '#ff4fd8' });
    api.pickup('water', 3, 0.9, 74);
  },
  onStart(g) {
    g.giveItem('bike', true); g.giveItem('map', true); g.giveItem('www', true);
    g.banner('THEME CAMP SANDBOX', 'Every theme camp in one place. (Debug world)', { col: '#ffd84a' });
  }
});
