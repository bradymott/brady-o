/* ============================================================
   BRADY GOES TO BURNING MAN — World 10: THE MAN PAVILION (the finale, Burn night)
   Brady skydives back in, pulls on his costume, and rides the yellow bike to
   the Man's pavilion: a flying-saucer base in the middle of the great circle.
   Missions (Burn Tokens):
     ride    Ride to the Burn             bike + costume, down the promenade
     lamps   The Lamplighters' Procession light the promenade lamps
     ringin  Ring In the Burn             ring your bell at six art cars to light them
     climb   Best Seat in the House       hidden: climb the Retro Rocket's gantry
     saucer  The Saucer                   final boss, phase 1: the Man atop his saucer
     giant   The Giant                    final boss, phase 2: the GIANT Man
   Then: Chinka is rescued and the Man burns, Saturday-night style.
   Ending: epilogue, credits, and a secret teaser (42_burns_w8910_ending.js).
   ============================================================ */

const BURNS_W10 = {
  DECK: 6.0, SAUCER_R: 16.2, LAND: { x: 12, z: 214 }, VIEW: { x: 0, z: 60 },
  ARENA1: { x: 0, z: 0, r: 40 }, ARENA2: { x: 0, z: 0, r: 46 },
  ROCKET: { x: 112, z: 30 }, BEAM_R: 18.6, BAD: { x: 7, z: 57.5 },
  state: null
};
const BURNS_W10_SKY = Object.assign({}, BURNS_PALETTES.night, {
  zen: '#06050f', hor: '#2c1430', mid: '#1a0c24', midK: 0.45, fog: '#22142a', fogD: 0.0085, haze: 0.5, fogMax: 0.92,
  moon: [210, 42], moonK: 0.85, stars: 1, city: [180, 0], cityCol: '#ff7a3a', cityK: 0.65, mtnCol: '#120c1c',
  sky: '#4a4a88', gnd: '#3a2a44', key: '#9aa0e0', keyK: 0.45, emB: 1.65, rim: '#ff9ad8', clouds: 0.12, cloudCol: '#3a2a4a'
});
const BURNS_W10_P1 = [
  { hp: 1, attacks: ['bombs', 'sweep'], combo: 2, rate: 1 },
  { hp: 0.67, attacks: ['bombs', 'sweep', 'fireworks'], combo: 3, rate: 1.1 },
  { hp: 0.34, attacks: ['fireworks', 'sweep', 'flash', 'bombs'], combo: 3, rate: 1.2, first: 'flash' }
];
const BURNS_W10_P2 = [
  { hp: 1, attacks: ['flash', 'stomp', 'fan', 'fireworks'], combo: 3, rate: 1, first: 'flash' },
  { hp: 0.67, attacks: ['flash', 'fan', 'fireworks', 'stomp'], combo: 3, rate: 1.12, first: 'flash' },
  { hp: 0.34, attacks: ['flash', 'fan', 'fireworks', 'swipe', 'stomp'], combo: 4, rate: 1.25, first: 'flash' }
];
const BURNS_W10_LINES1 = {
  bombs: ['MY LOVE BURNS HOT! LITERALLY!', 'CATCH, BUN BOY!'], sweep: ['THE SAUCER SWEEPS! JUMP!', 'ROUND AND ROUND MY LOVE GOES!'],
  fireworks: ['FIREWORKS FOR MY BELOVED!', 'IT IS NOT EVEN THE GRAND FINALE YET!'], flash: ['NEON FLASH! FIND COVER!', 'BEHOLD THE GLOW OF ROMANCE!']
};
const BURNS_W10_LINES2 = {
  stomp: ['EARTHQUAKE OF EMOTIONS!', 'I AM A VERY BIG BOY NOW!'], fan: ['FACE FIRE! IT IS A LOOK!', 'FEEL MY FIERY GAZE!'],
  fireworks: ['FROM MY ARMS, WITH LOVE!', 'GRAND FINALE! EARLY!'], flash: ['ULTRA NEON! HIDE OR GET WIPED OUT!', 'THE GLOW OF A THOUSAND RAVES!'],
  swipe: ['A NEON WHIP... OF LONGING!', 'JUMP IF YOU LOVE HER!']
};
const BURNS_W10_COSTUME_LINES = {
  none: 'Black tee. Black jeans. Black heart. Classic Brady.', furcoat: 'Faux fur, real feelings. Let\'s go.', tutu: 'Tulle for days. Goggles on. Let\'s go.',
  spaceman: 'LED Spaceman. Visible from orbit. Good. Let him see me coming.', unicorn: 'Unicorn onesie. Magical. Breathable-ish. Let\'s go.',
  pirate: 'Desert Pirate. Arr. I\'ve come for me wife.', disco: 'A thousand tiny suns. Let\'s light this up.'
};

BurnsWorlds.register({
  id: 10, name: 'The Man Pavilion', sub: 'Ride in. Bring her home.',
  sky: BURNS_W10_SKY, tod: 0,
  music: 'burns_w10',
  bounds: [-170, -170, 170, 236],
  spawn: { x: 12, y: 0, z: 214, yaw: Math.PI },
  ground: { base: '#b08a70', crack: 0.28, mottle: 0.38, res: 0.5 },
  dust: 1.0, bike: true,
  missions: [
    { id: 'ride', name: 'Ride to the Burn', short: 'Ride your bike to the great circle', type: 'ride', vehicle: 'bike', start: 'auto', silent: true, target: { x: 0, z: 94, r: 9 }, tokenAt: { x: 4, y: 1.4, z: 96 },
      desc: 'Bike. Costume. Burn night. Ride down the promenade to the great circle around the Man.', hint: 'The promenade, straight north from the landing' },
    { id: 'lamps', name: 'The Lamplighters\' Procession', short: 'Light the promenade lamps', type: 'custom', count: 8, giver: 'luz', start: 'manual', progressLabel: 'Lamps lit', marker: { x: -9, z: 180 },
      desc: 'Nobody walks to the Burn in the dark. Help Luz light the eight lamps along the promenade.', hint: 'The promenade, near the landing' },
    { id: 'ringin', name: 'Ring In the Burn', short: 'Ring your bell at the dark art cars', type: 'custom', count: 6, giver: 'dropz', start: 'manual', progressLabel: 'Art cars lit', marker: { x: -40, z: 88 },
      desc: 'Six art cars around the circle are still dark. Ride up and ring your bike bell to wake them up.', hint: 'DJ Dropz, by the art cars on the outer ring',
      onEvent(g, m, name, data) { if (name === 'bell') BURNS_W10.ringBell(g); } },
    { id: 'climb', name: 'Best Seat in the House', short: 'Climb the Retro Rocket', type: 'climb', start: 'trigger', secret: true, target: { x: 112, z: 30, r: 4.6, y: 18.5 }, tokenAt: { x: 109.4, y: 20.0, z: 30 },
      desc: 'The best view of the Burn is from the top of the rocket. Nobody said you could. Nobody said you couldn\'t.', hint: 'The Retro Rocket, east of the circle' },
    { id: 'saucer', name: 'The Saucer', short: 'Defeat the Man on his saucer!', type: 'boss', start: 'manual', requires: ['ride', 'lamps'], tokenDirect: true, marker: { x: 0, z: 0 },
      desc: 'He\'s on top of his pavilion with Chinka. Dodge the fire and fireworks; when he slumps, ride a tractor beam up and bonk him.', hint: 'The Man Pavilion, center of the circle', lockedDesc: 'Ride in and light the promenade first.' },
    { id: 'giant', name: 'The Giant', short: 'Defeat the GIANT Man!', type: 'boss', start: 'manual', requires: ['saucer'], tokenDirect: true, marker: { x: 0, z: 0 },
      desc: 'He grew. A lot. Hide from his neon flash (green rings are safe), dodge face fire and arm fireworks, bonk his head.', hint: 'The Man Pavilion', lockedDesc: 'Beat him on his saucer first.' }
  ],
  build(api, g) {
    const W = BURNS_W10;
    W.state = { introDone: !!BurnsSave.flag(10, 'intro'), phase: 0, lampGlows: [], lamps: [], cars: [], beamsOn: false, onDeckT: 0, mortars: [], spinners: [], burnK: 0, fireH: 0, armsK: undefined, collapseK: 0, after: false };
    if (!BurnsSave.hasItem('bike')) BurnsSave.addItem('bike');
    const cos = BurnsSave.get().costume; if (!BURNS_COSTUMES.find(c => c.id === cos)) BurnsSave.get().costume = 'none';
    W.paintGround(api);
    W.buildLanding(api);
    W.buildPromenade(api);
    W.buildCircle(api);
    W.buildArtCars(api);
    // the module's Retro Rocket: ladders up the gantry to the top deck (the hidden climb, token at the summit),
    // and a photo of Chinka at the end of the access arm; the Burn's fireworks fly from its nose cone
    W.state.rocket = W.placeArt(api, g, 'retroRocket', W.ROCKET.x, W.ROCKET.z, { rotY: -0.6, mission: 'climb', hatchReward: { kind: 'photo', id: 'p2' } }, () => W.rocket(api));
    if (!W.state.rocket.big) W.rocketGantry(api);
    const RK = W.state.rocket.big ? W.state.rocket.info : null, RP = RK && RK.summit, NOSE = RK && RK.spots && RK.spots.nose;
    W.state.rocketTop = NOSE ? [NOSE[0], NOSE[1] + 0.6, NOSE[2]] : RP ? [RP.x, RP.y + 3, RP.z] : [W.ROCKET.x, 22, W.ROCKET.z];
    if (RP) { const m = g.missions.get('climb'); if (m) Object.assign(m.def, { target: { x: RP.x, z: RP.z, r: RP.r + 0.6, y: RP.y - 0.3 }, tokenAt: { x: RP.x, y: RP.y + 1.3, z: RP.z }, hint: 'The Retro Rocket, east of the circle: up the gantry ladders' }); }
    api.trigger({ x: W.ROCKET.x, z: W.ROCKET.z, r: 13, once: true, when: g2 => g2.missions.state('climb') === 'available', onEnter: g2 => { g2.missions.start('climb'); g2.banner('HIDDEN CHALLENGE', 'Best Seat in the House: climb the Retro Rocket!', { col: '#7aff5a' }); } });
    W.buildArena(api, g);
    W.buildCast(api);
    // collectibles
    api.pickup('photo', 0, 1.2, 9.5, { id: 'p1' });
    if (!W.state.rocket.big) api.pickup('photo', W.ROCKET.x - 3.0, 19.5, W.ROCKET.z + 3.0, { id: 'p2' });
    api.pickup('bag:lsd', -30, 0.9, 120);
    api.hidden(() => { const steps = [[-44, 1.4, 104], [-48, 2.8, 100], [-52, 4.2, 97], [-56, 5.6, 95], [-60, 7.0, 94]]; steps.forEach(([x, y, z], i) => api.roundBox(x, y - 0.3, z, 2.4, 0.3, 2.4, burnsHSL(300 + i * 18, 0.85, 0.65), { e: 0.6, r: 0.12 })); api.glow(-60, 8.2, 94, 2.6, '#ff4fd8'); });
    api.pickup('photo', -60, 7.9, 94, { id: 'p3', hidden: true });
    api.pickup('bag:molly', 30, 0.9, 150); api.pickup('bag:powder', -24, 0.9, 196); api.pickup('bag:shrooms', 60, 0.9, 100); api.pickup('bag:weed', -96, 0.9, 60); api.pickup('bag:bufo', 100, 0.9, -40);
    api.pickup('water', 6, 0.9, 160); api.pickup('water', -6, 0.9, 110); api.pickup('water', 34, 0.9, 52); api.pickup('water', -34, 0.9, 52); api.pickup('water', 0, 0.9, 50);
    api.marker('man', 0, 0, 'The Man', { col: '#ffd84a' });
    api.marker('rocket', W.ROCKET.x, W.ROCKET.z, 'Retro Rocket', { col: '#ff7a2a' });
    api.update((g2, dt) => BURNS_W10.update(g2, dt));
  },
  onStart(g) {
    const W = BURNS_W10, S = W.state;
    g.giveItem('bike', true);
    S.p1done = g.missions.isDone('saucer'); S.p2done = g.missions.isDone('giant');
    for (const id of S.spinners) { const a = g.actor(id); if (a) a.hidden = true; }
    if (g.missions.isDone('lamps')) for (const L of S.lamps) W.lightLamp(g, L, true);
    if (g.missions.isDone('ringin')) for (const c of S.cars) W.wakeCar(g, c, true);
    if (S.p2done) W.afterBurn(g);
    else if (S.p1done) W.giantReady(g);
    if (!S.introDone) W.intro(g);
    else { g.banner('BURN NIGHT', S.p2done ? 'The Man has burned. The playa glows.' : 'She\'s alive. And she\'s up there.', { col: '#ffd84a' }); if (!S.p1done && !g.missions.isDone('ride')) W.mountBike(g); }
  },
  onRespawn(g) { BURNS_W10.respawnReset(g); },
  env(g, env) { BURNS_W10.env(g, env); },
  drawSprites(g, R) { BurnsW8910Haz.draw(g, R); BURNS_W10.drawSprites(g, R); },
  drawSkinned(g, R) { BurnsW8910Acc.draw(g, R); },
  update(g, dt) { BurnsW8910.tick(g, dt); }
});

/* ---------------- big art placement (guarded; see BURNS_W9.placeArt) ---------------- */
BURNS_W10.placeArt = function (api, g, kind, x, z, o, fallback) {
  // (only kinds the module already has: the others stay on our stand-in quietly until they land)
  if (typeof BurnsBigArt !== 'undefined' && BurnsBigArt && typeof BurnsBigArt.place === 'function' && (!BurnsBigArt.kinds || BurnsBigArt.kinds[kind])) {
    try { const info = BurnsBigArt.place(api, g, kind, x, z, o || {}); if (info !== false) return { big: true, info }; } catch (e) { console.warn('BurnsBigArt.place(' + kind + ') failed; using the stand-in', e); }
  }
  return { big: false, info: fallback() };
};

/* ---------------- ground ---------------- */
BURNS_W10.paintGround = function (api) {
  const R = api.rng;
  api.paint((c, P, sc) => {
    for (let i = 0; i < 200; i++) { const x = R.range(-170, 170), z = R.range(-170, 236), [px, pz] = P(x, z), r = R.range(3, 12) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gg.addColorStop(0, dark ? 'rgba(110,80,70,0.22)' : 'rgba(230,200,180,0.2)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    // the promenade
    const [a0, b0] = P(-9, 236), [a1, b1] = P(9, 84); c.fillStyle = 'rgba(232,206,178,0.35)'; c.fillRect(a0, b1, a1 - a0, b0 - b1);
    c.strokeStyle = 'rgba(120,90,70,0.3)'; c.lineWidth = 0.4 * sc; for (const lx of [-1.6, 1.6]) { const [x0, z0] = P(lx, 236), [, z1] = P(lx, 84); c.beginPath(); c.moveTo(x0, z0); c.lineTo(x0, z1); c.stroke(); }
    // the great circle: arena disc, crowd ring, a heart-pink boundary
    const [cx, cz] = P(0, 0);
    const ga = c.createRadialGradient(cx, cz, 10 * sc, cx, cz, 50 * sc); ga.addColorStop(0, 'rgba(70,46,58,0.55)'); ga.addColorStop(0.9, 'rgba(96,64,74,0.45)'); ga.addColorStop(1, 'rgba(96,64,74,0)'); c.fillStyle = ga; c.beginPath(); c.arc(cx, cz, 50 * sc, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,120,200,0.35)'; c.lineWidth = 1.2 * sc; c.beginPath(); c.arc(cx, cz, 47 * sc, 0, TAU); c.stroke();
    c.strokeStyle = 'rgba(255,220,140,0.3)'; c.lineWidth = 0.6 * sc; c.beginPath(); c.arc(cx, cz, 60 * sc, 0, TAU); c.stroke();
    for (let i = 0; i < 60; i++) { const a = R() * TAU, r = R.range(62, 84), [px, pz] = P(Math.sin(a) * r, Math.cos(a) * r); c.fillStyle = 'rgba(70,52,52,0.18)'; c.beginPath(); c.arc(px, pz, R.range(1, 3) * sc, 0, TAU); c.fill(); }
  });
};

/* ---------------- the landing: a crumpled parachute and glow-stick friends ---------------- */
BURNS_W10.buildLanding = function (api) {
  const L = BURNS_W10.LAND, st = BURNS_W10.state;
  api.mesh(L.x + 1.5, L.z + 6.5, m => {
    // the canopy lies crumpled behind Brady: a squashed, wrinkled dome in bright panels, with lines
    const cols = ['#ff4fd8', '#ffe24a', '#38f2ff', '#ff7a2a', '#7aff5a'];
    m.lathe([[0, 0.05], [1.2, 0.35, cols[0]], [2.6, 0.55, cols[1]], [3.8, 0.45, cols[2]], [4.6, 0.2, cols[3]], [4.8, 0.02, cols[4]]], { seg: 20, sx: 1.25, sz: 0.8, rMod: (th, t) => 1 + Math.sin(th * 7) * 0.08 * t + Math.cos(th * 3 + 1) * 0.06 });
    m.color('#e8e8e8'); for (let i = 0; i < 6; i++) { const a = -0.6 + i * 0.24; m.limb(Math.sin(a) * 4.6, 0.05, Math.cos(a) * 3.4 - 1, -1.2, 0.05, -6.0, 0.012, 0.012); }
    m.color('#2a2a30'); m.roundBox(-1.4, 0.18, -6.2, 0.6, 0.36, 0.45, 0.1);
    return { cols: [] };
  });
  // the costume trunk the skydive crew stashed
  api.mesh(L.x - 3.2, L.z + 1.5, m => { m.color('#8a3a6a').shine(2); m.roundBox(0, 0.4, 0, 1.4, 0.8, 0.8, 0.12); m.color('#ffd84a'); m.roundBox(0, 0.82, 0, 1.44, 0.1, 0.84, 0.04); m.shine(0); m.color('#ff9ad0'); m.ellipsoid(0.4, 0.9, 0.2, 0.3, 0.12, 0.2); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.7, hz: 0.4, y0: 0, y1: 0.86 }] }; }, { yaw: 0.4 });
  const friends = [['kid', 3.2, 4.5], ['mom', 5.0, 2.6], ['burney', -2.0, 5.5], ['furry', 4.6, 6.6]];
  st.friends = friends.map(([k, dx, dz], i) => api.npc(BURNS_W8910_ARCH.npc(k, { id: 'friend' + i, x: L.x + dx, z: L.z + dz, yaw: Math.atan2(-dx, -dz), anim: 'cheer', glowFriend: true,
    lines: [['WE SAW YOUR CHUTE OPEN FROM HALF A MILE AWAY!', 'That was the best landing I\'ve ever seen. And I\'ve seen a lot of landings. Mostly bad.'], ['Go get her, honey! I brought snacks for after!', 'I\'ll take your photo when you come back. Both of you!'], ['Hold still! *click* Got it. Brady, mid-destiny.'], ['FREE HUGS! Fuzzy ones! For luck!']][i], gift: i === 0 ? { kind: 'glowstick', n: 15 } : i === 1 ? { kind: 'water' } : undefined }))).map(d => d.id);
  api.checkpoint('cp_landing', L.x - 6, L.z - 4, { yaw: Math.PI, name: 'The Landing' });
  api.glowRing(L.x + 2, L.z + 3, 7, 12);
  api.light(L.x, L.z + 3, 12, '#ff9ad8', 0.35);
};

/* ---------------- the promenade: lamps + the lamplighters ---------------- */
BURNS_W10.buildPromenade = function (api) {
  const W = BURNS_W10, st = W.state;
  [170, 156, 142, 128].forEach((z, i) => [-7, 7].forEach(x => {
    api.mesh(x, z, m => {
      m.color('#3a2a22').shine(1); m.limb(0, 0, 0, 0, 4.0, 0, 0.1, 0.08); m.limb(0, 3.9, 0, -Math.sign(x) * 0.8, 4.1, 0, 0.05, 0.04);
      m.color('#2a2020'); m.push(); m.tf(-Math.sign(x) * 0.85, 3.4, 0); m.lathe([[0, 0], [0.2, 0.02], [0.22, 0.1], [0.2, 0.12]], { seg: 8 }); m.pop();
      m.color('#f4ecd8', 0.12); m.push(); m.tf(-Math.sign(x) * 0.85, 3.45, 0); m.lathe([[0, 0], [0.19, 0.02], [0.2, 0.46], [0.15, 0.54], [0, 0.56]], { seg: 8 }); m.pop(); m.emissive(0);
      m.color('#2a2020'); m.push(); m.tf(-Math.sign(x) * 0.85, 3.98, 0); m.lathe([[0, 0], [0.22, 0], [0.04, 0.24], [0, 0.26]], { seg: 8 }); m.pop(); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.13, y0: 0, y1: 4.0, camPass: true }] };
    });
    const G = BurnsW8910.glow(api, x - Math.sign(x) * 0.85, 3.7, z, 2.4, '#ffd890'); BurnsW8910.setGlow(G, false);
    st.lamps.push({ x, z, G, lit: false });
  }));
  // promenade dressing: pennants, glow-stick arcs for bike hops
  for (let z = 228; z > 96; z -= 22) for (const sx of [-1, 1]) api.capsule(sx * 11, 0, z, 0.08, 4.4, '#5a4a5a', { col: { camPass: true, walk: false } });
  for (let z = 228; z > 118; z -= 22) for (const sx of [-1, 1]) api.prop('pennants', { x: 0, z: 0, x0: sx * 11, y0: 4.4, z0: z, x1: sx * 11, y1: 4.4, z1: z - 22, n: 30, sag: 0.6, drop: 0.3 });
  api.glowArc(0, 0.9, 200, 0, 0.9, 186, 1.6, 5); api.glowArc(0, 0.9, 150, 0, 0.9, 136, 1.6, 5); api.glowLine(-2, 120, -2, 100, 7); api.glowLine(2, 176, 2, 160, 6);
  api.sign('THE MAN PAVILION\n▲ BURN TONIGHT ▲', 9, 200, { yaw: -Math.PI / 2 - 0.3, h: 1.4, style: { bg: '#1a0a1a', fg: '#ffd84a', glow: '#ff7a2a', size: 44, border: '#ffd84a' }, glow: '#ff7a2a' });
  api.sign('BIKES THIS WAY\nFEELINGS THAT WAY', -9, 168, { yaw: Math.PI / 2 + 0.3, h: 1.2, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 36 } });
  api.npc(BURNS_W8910_ARCH.npc('lamplighter', { id: 'luz', name: 'LAMPLIGHTER LUZ', x: -9.5, z: 181, yaw: Math.PI / 2, talk(g, a) { BURNS_W10.luzTalk(g, a); } }));
  api.npc(BURNS_W8910_ARCH.npc('lamplighter', { name: 'LAMPLIGHTER', x: -11, z: 178, yaw: 1.2, lines: ['Saturday\'s lamps are the most important ones. Everyone walks to the Burn by their light.'] }));
  api.checkpoint('cp_promenade', 12, 132, { yaw: Math.PI, name: 'The Promenade' });
  api.light(0, 150, 26, '#ffc890', 0.22);
};

/* ---------------- the great circle: seated perimeter, crowd ring, glow sticks ---------------- */
BURNS_W10.buildCircle = function (api) {
  const R = mulberry32(1010);
  // static crowd (cheap: merged into chunks) in a huge ring around the Man, open to the promenade
  const ring = (r0, r1, n, sit) => {
    for (let i = 0; i < n; i++) {
      const a = R() * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.14) continue;
      const r = R.range(r0, r1), x = Math.sin(a) * r, z = Math.cos(a) * r;
      api.mesh(x, z, m => { const out = sit ? BURNS_W10.seated(m, R) : BurnsW8910Shape.person(m, 0, 0, 0, R); if (out && out.glow && R() < 0.5) api.glow(x, out.glow[1] + 0.1, z, 0.55, R.pick(BURNS_NEON)); return { cols: [] }; }, { yaw: Math.atan2(-x, -z) + R.range(-0.4, 0.4) });
    }
  };
  ring(60, 63, 110, true);
  ring(64, 72, 170, false);
  ring(73, 80, 120, false);
  // a soft barrier collider so Brady can't run through the crowd (gap at the promenade)
  for (let i = 0; i < 36; i++) { const a = (i + 0.5) / 36 * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.2) continue; api.collider({ t: 'box', x: Math.sin(a) * 70, z: Math.cos(a) * 70, hx: 6.4, hz: 9, y0: 0, y1: 2.2, yaw: a, walk: false, camPass: true }); }
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; api.light(Math.sin(a) * 70, Math.cos(a) * 70, 10, BURNS_NEON[i % 7], 0.25); }
  // the perimeter rangers at the entrance
  api.npc({ id: 'ranger', name: 'RANGER STEADY', type: 'ranger', seed: 101, x: -6, z: 80, yaw: Math.PI,
    lines: ['Perimeter\'s holding. Nobody inside the circle until the Burn. ...Except you, apparently. Go on. She\'s up there.', 'If anybody asks, you\'re "a performer."'] });
  api.npc({ name: 'RANGER', type: 'ranger', seed: 102, x: 6, z: 80, yaw: Math.PI, lines: ['Stay behind the line, folks. Hydrate. Breathe. Cry if you need to.'] });
  api.checkpoint('cp_circle', 8, 84, { yaw: Math.PI, name: 'The Great Circle' });
};
// a seated burner for the inner perimeter
BURNS_W10.seated = function (m, R) {
  const top = R.pick(BURNS_NEON.concat(['#2a2a34', '#f4f0e8', '#8a2a5a'])), skin = R.pick(['#e8b996', '#c88a64', '#8a5a3a', '#f0c8a8']);
  const lo = m.lo; m.lo = true;
  m.color(R.pick(['#1a1a22', '#3a2a24', '#f4f0e8'])); m.limb(-0.11, 0.18, 0.05, -0.12, 0.16, 0.55, 0.09, 0.08); m.limb(0.11, 0.18, 0.05, 0.12, 0.16, 0.55, 0.09, 0.08);
  m.color(top); m.roundBox(0, 0.5, -0.05, 0.48, 0.6, 0.28, 0.12);
  m.color(skin); m.ball(0, 0.98, -0.04, 0.16);
  if (R() < 0.5) { m.color(R.pick(['#3a2a1a', '#1a1412', '#e8c870', '#ff9ad0'])); m.ellipsoid(0, 1.02, -0.06, 0.17, 0.14, 0.17, { phi1: Math.PI / 2 }); }
  m.color(skin); m.limb(0.24, 0.72, 0, 0.2, 0.5, 0.25, 0.06, 0.05); m.limb(-0.24, 0.72, 0, -0.2, 0.5, 0.25, 0.06, 0.05);
  m.lo = lo;
  return null;
};

/* ---------------- art cars around the outer ring ---------------- */
BURNS_W10.buildArtCars = function (api) {
  const st = BURNS_W10.state, R = mulberry32(1020);
  const cols = ['#3a1a5a', '#1a3a5a', '#5a1a2a', '#1a4a3a', '#4a3a1a', '#2a1a4a', '#5a2a1a', '#1a2a4a', '#3a3a1a', '#4a1a4a'];
  const sculpts = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a', '#9a6bff', '#ff3b5c', '#38f2ff', '#ffe24a', '#ff4fd8'];
  for (let i = 0; i < 10; i++) {
    const a = (i + 0.5) / 10 * TAU + 0.1; if (Math.abs(BurnsM.wrap(a)) < 0.25) continue;
    const r = 96, x = Math.sin(a) * r, z = Math.cos(a) * r, yaw = a + Math.PI / 2;
    api.prop('artcar', { x, z, yaw, len: 9, col: cols[i], sculpt: sculpts[i] });
    const dormant = st.cars.length < 6, glows = [];
    for (let k = 0; k < 10; k++) { const t = k / 9, lx = (t - 0.5) * 8, gx = x + Math.cos(yaw) * 0 + Math.sin(yaw) * lx, gz = z + Math.cos(yaw) * lx; const G = BurnsW8910.glow(api, gx + Math.cos(yaw) * 2.2, 1.2 + (k % 2) * 0.4, gz - Math.sin(yaw) * 2.2, 1.0, sculpts[(i + k) % 10]); if (dormant) BurnsW8910.setGlow(G, false); glows.push(G); }
    const big = BurnsW8910.glow(api, x, 4.2, z, 7, sculpts[i]); if (dormant) BurnsW8910.setGlow(big, false); glows.push(big);
    api.light(x, z, 12, sculpts[i], 0.3);
    if (dormant) st.cars.push({ x, z, yaw, glows, lit: false, col: sculpts[i] });
  }
  api.npc(BURNS_W8910_ARCH.npc('annoyingdj', { id: 'dropz', x: -42, z: 86, yaw: Math.PI * 0.85, anim: 'w8910dj', talk(g, a) { BURNS_W10.dropzTalk(g, a); } }));
  api.prop('boxtruck', { x: -46, z: 90, yaw: Math.PI * 0.85, col: '#1a1a22', cabCol: '#ff4fd8', seed: 1030 });
};

/* ---------------- the Retro Rocket (our stand-in) + its climbable gantry ---------------- */
BURNS_W10.rocket = function (api) {
  const K = BURNS_W10.ROCKET;
  api.mesh(K.x, K.z, m => {
    m.color('#f4f0e8').shine(2);
    m.lathe([[0, 2.2], [2.6, 2.4, '#d8d4cc'], [3.2, 4.5, '#f4f0e8'], [3.4, 9, '#f4f0e8'], [3.2, 13, '#c8202a'], [2.6, 16, '#c8202a'], [1.6, 19, '#f4f0e8'], [0.6, 21, '#f4f0e8'], [0, 21.6]], { seg: 24 });
    for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; m.color('#c8202a'); m.push(); m.tf(Math.sin(a) * 3.2, 0, Math.cos(a) * 3.2, a); m.roundBox(0, 3.0, 0.9, 0.4, 6, 3.2, 0.18); m.pop(); }
    m.color('#5ad0ff', 0.5).shine(3); for (const y of [7, 11]) { m.push(); m.tf(0, y, 3.38, 0, Math.PI / 2, 0); m.roundCyl(0, -0.08, 0, 0.8, 0.16, 0.06); m.pop(); } m.emissive(0);
    m.color('#ffb040', 0.8); m.ellipsoid(0, 1.9, 0, 2.4, 0.9, 2.4); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.3, y0: 0, y1: 15 }, { t: 'cyl', x: 0, z: 0, r: 1.9, y0: 15, y1: 21.6 }], lights: [{ x: 0, y: 1.6, z: 0, s: 6, c: '#ffb040', pool: 12 }, { x: 0, y: 21.8, z: 0, s: 2.5, c: '#ff4fd8', blink: 3 }] };
  }, { yaw: -0.6 });
  api.sign('THE RETRO ROCKET\nNEXT LAUNCH: TONIGHT\n(METAPHORICALLY)', K.x - 9, K.z + 6, { yaw: -1.0, h: 1.4, style: { bg: '#1a1a2a', fg: '#ffb040', size: 34, border: '#ffb040' } });
};
BURNS_W10.rocketGantry = function (api) {
  const K = BURNS_W10.ROCKET;
  api.prop('scaffold', { x: K.x + 6.2, z: K.z, levels: 9, lh: 2.0, w: 3, d: 3 });
  api.roundBox(K.x, 18.3, K.z, 9.8, 0.3, 9.8, '#8a8a92', { r: 0.12, top: '#a8a8b2' });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; api.glow(K.x + Math.sin(a) * 4.8, 19.0, K.z + Math.cos(a) * 4.8, 0.5, BURNS_NEON[i % 7]); }
  api.glowArc(K.x + 6.2, 1, K.z, K.x + 6.2, 18, K.z, 1.2, 8);
};

/* ---------------- the arena, the saucer and the Man ---------------- */
BURNS_W10.saucerMesh = function (m) {
  const D = BURNS_W10.DECK, R = BURNS_W10.SAUCER_R;
  m.color('#a8b0c4').shine(3);
  m.lathe([[0, 3.2, '#c8d0e0'], [4.5, 3.35], [9, 3.9], [13.4, 4.8], [15.8, 5.45], [R + 0.2, 5.78, '#8890a4'], [R, 6.0, '#8890a4'], [R, 6.0, '#5a5e70'], [14.8, D, '#5a5e70'], [0, D, '#5a5e70']], { seg: 40 });
  m.shine(0);
  // glowing rings on the deck and the rim
  for (const [r, c] of [[5.5, '#ff4fd8'], [10, '#38f2ff'], [14.4, '#ffe24a']]) { m.color(c, 1); m.torus(0, D + 0.03, 0, r, 0.08, { seg: 40, tseg: 4, sy: 0.4 }); }
  m.emissive(0);
  for (let i = 0; i < 28; i++) { const a = i / 28 * TAU; m.color(BURNS_NEON[i % 7], 1); m.ball(Math.sin(a) * (R + 0.15), 5.6, Math.cos(a) * (R + 0.15), 0.24, { seg: 6, rings: 4 }); }
  m.emissive(0);
  // landing legs + pads
  m.color('#6a7082').shine(2);
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; m.limb(Math.sin(a) * 9, 3.9, Math.cos(a) * 9, Math.sin(a) * 12.5, 0.4, Math.cos(a) * 12.5, 0.45, 0.35); m.roundCyl(Math.sin(a) * 12.5, 0, Math.cos(a) * 12.5, 1.2, 0.4, 0.15); }
  m.shine(0);
  // underside lights + the belly orb + tractor-beam emitters
  m.color('#ffd84a', 1); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; m.ball(Math.sin(a) * 8, 3.8, Math.cos(a) * 8, 0.3, { seg: 6, rings: 4 }); }
  m.color('#ff4fd8', 1); m.ball(0, 3.0, 0, 0.9); m.emissive(0);
  m.color('#9aff9a', 1); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; m.push(); m.tf(Math.sin(a) * 15.2, 5.0, Math.cos(a) * 15.2, 0, Math.PI, 0); m.roundCyl(0, 0, 0, 0.7, 0.2, 0.06); m.pop(); }
  m.emissive(0);
  const lights = [{ x: 0, y: 3.0, z: 0, s: 5, c: '#ff4fd8' }];
  for (let i = 0; i < 28; i += 2) { const a = i / 28 * TAU; lights.push({ x: Math.sin(a) * (R + 0.2), y: 5.6, z: Math.cos(a) * (R + 0.2), s: 1.3, c: BURNS_NEON[i % 7] }); }
  for (let i = 0; i < 12; i += 3) { const a = i / 12 * TAU; lights.push({ x: Math.sin(a) * 8, y: 3.6, z: Math.cos(a) * 8, s: 1.6, c: '#ffd84a' }); }
  const cols = [{ t: 'cyl', x: 0, z: 0, r: R, y0: 4.6, y1: D, cover: true }];
  // the engine's cylinder ray test only sees rays entering through the side wall, so four rotated
  // (non-solid) slabs make the deck block the neon flash from above too: hiding under the saucer works
  for (let k = 0; k < 4; k++) cols.push({ t: 'box', x: 0, z: 0, hx: 11.4, hz: 11.4, y0: 4.6, y1: D, yaw: k * Math.PI / 8, cover: true, solid: false, walk: false, camPass: true });
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; cols.push({ t: 'cyl', x: Math.sin(a) * 11.2, z: Math.cos(a) * 11.2, r: 0.7, y0: 0, y1: 3.6, camPass: true }); }
  return { cols, lights };
};
BURNS_W10.buildArena = function (api, g) {
  const W = BURNS_W10, st = W.state, S = BurnsW8910Shape;
  // cover: domes and speaker stacks around the saucer (the green rings show the safe side during a flash)
  const covers = [];
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + Math.PI / 6, x = Math.sin(a) * 31, z = Math.cos(a) * 31; api.prop('dome', { x, z, r: 4.6, col: '#e8e0f0', alt: '#c8b8e8', lights: true, glow: BURNS_NEON[i] }); covers.push({ x, z, r: 4.6 }); }
  for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU, x = Math.sin(a) * 23.5, z = Math.cos(a) * 23.5;
    api.mesh(x, z, m => { m.color('#1a1a22').shine(2); m.roundBox(0, 2.3, 0, 2.6, 4.6, 2.6, 0.28); m.color('#3a3a44'); for (const y of [1.2, 3.3]) { m.push(); m.tf(0, y, 1.31, 0, Math.PI / 2, 0); m.roundCyl(0, -0.05, 0, 0.8, 0.12, 0.05); m.pop(); } m.color(BURNS_NEON[i * 2], 1); m.torus(0, 4.62, 0, 1.0, 0.06, { seg: 16, tseg: 3 }); m.emissive(0).shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 1.3, y0: 0, y1: 4.6, cover: true }] }; }, { yaw: a + Math.PI });
    covers.push({ x, z, r: 1.6 });
  }
  st.covers = covers;
  // the saucer (a mover: it takes off when he turns giant, and lands again for the Burn)
  st.saucer = api.mover(m => W.saucerMesh(m));
  st.saucer.x = 0; st.saucer.z = 0; st.saucer.y = 0;
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + Math.PI / 4; api.light(Math.sin(a) * W.BEAM_R, Math.cos(a) * W.BEAM_R, 5, '#9aff9a', 0.4); }
  api.light(0, 0, 22, '#ff9ad8', 0.35);
  api.checkpoint('cp_giant', -10, 56, { yaw: Math.PI, name: 'Second Wind' });
  // fire spinners: they perform around the base during the Burn
  // (the engine's firespin behaviour gives them real poi / fans / staff / hoop with burning trails; our own poi if it's missing)
  const realFire = !!(BurnsBehaviors.list && BurnsBehaviors.list.firespin) && BURNS_W8910_ARCH.engineHas('firespinner');
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * TAU + 0.2, o = { id: 'spin' + i, x: Math.sin(a) * 23, z: Math.cos(a) * 23, yaw: a + Math.PI, chatter: false, noTalk: true, spinner: true };
    if (realFire) Object.assign(o, { behavior: 'firespin', tool: ['poi', 'fans', 'staff', 'hoop'][i % 4], hazard: false, turn: i % 2 ? 0.5 : -0.5, rate: 0.9 + (i % 3) * 0.12 });
    else Object.assign(o, { anim: 'w8910spin', w8910poi: true });
    const d = api.npc(BURNS_W8910_ARCH.npc('firespinner', o)); st.spinners.push(d.id);
  }
  // the Man: phase 1 on top of the saucer
  const man = new BurnsW8910Man(g, { x: 0, z: 0, y: W.DECK, yaw: 0, scale: 1.0, hp: 3, name: 'THE MAN', title: 'Pavilion Overlord',
    attacks: ['bombs', 'sweep', 'fireworks', 'flash'], stun: 7.5, arena: W.ARENA1, covers, flashCharge: 2.8, flashDamage: 2, fireworks: 8, bombs: 7,
    sweepR0: W.SAUCER_R + 0.8, sweepLen: 24, sweepDur: 3.0, sweepArc: 3.4, lines: BURNS_W10_LINES1, phases: BURNS_W10_P1,
    stunLines: ['My saucer... is spinning... or I am...', 'Need... to sit... on my own pavilion...', 'Love is... a long night...'],
    hitLines: ['MY BEAUTIFUL HEAD!', 'NOT IN FRONT OF THE CROWD!', 'SHE IS STILL MINE!', 'YOU SCRATCHED MY SAUCER!'],
    posePatch: (P, t, b) => W.posePatch(P, t, b),
    onPhase(g2, b, i) { g2.banner(i === 1 ? 'HE\'S GETTING MAD' : 'NEON INCOMING', i === 1 ? 'Fireworks! Step out of the red rings.' : 'Neon flash: hide in a green ring behind cover!', { col: '#ffd84a' }); },
    onDefeat(g2, b) { BURNS_W10.phase1Down(g2); } });
  g.addBoss(man);
  st.man = man;
  api.trigger({ x: 0, z: 68, r: 9, when: g2 => !BURNS_W10.state.fighting && !BURNS_W10.state.after && (g2.missions.state('saucer') === 'available' || (g2.missions.state('giant') === 'available' && BURNS_W10.state.phase === 2)), onEnter: g2 => BURNS_W10.arenaEnter(g2) });
};

/* ---------------- the cameo crowd: the whole cast, cheering ---------------- */
BURNS_W10.buildCast = function (api) {
  const st = BURNS_W10.state;
  // the six burner archetypes gather near Brady's viewing spot
  const six = [['billionaire', -8, 55], ['crusty', -5, 57.5], ['pony', 5, 57], ['techbro', 8, 55.5], ['captain', -11, 54], ['healer', 11, 54]];
  st.six = six.map(([k, x, z]) => api.npc(BURNS_W8910_ARCH.npc(k, { id: 'six_' + k, x, z, yaw: Math.atan2(-x, -z), behavior: 'idle', anim: 'cheer', burnLines: BURNS_W8910_ARCH.BURN[k],
    lines: [burnsW8910Pick(BURNS_W8910_ARCH.BURN[k]), k === 'captain' ? 'Fire perimeter check: complete. Hydration check: YOU. Drink.' : k === 'billionaire' ? 'Radically inclusive Burn, darling. Velvet rope starts... here.' : k === 'techbro' ? 'This circle? Decentralized community architecture.' : k === 'healer' ? 'Would you like to eye-gaze before he burns? It\'s free. It costs your soul.' : k === 'crusty' ? 'Back in my day the Man was twelve feet tall and we LIKED it.' : 'Do you have water? And a cup? And a flashlight? Love the costume though!'],
    gift: k === 'captain' ? { kind: 'water' } : k === 'crusty' ? { kind: 'glowstick', n: 8 } : undefined }))).map(d => d.id);
  // everybody else, spread around the inner edge of the crowd
  const rest = ['greeterF', 'greeterM', 'furry', 'cop', 'deathguild', 'burney', 'partied', 'kid', 'mom', 'cult', 'gatestaff', 'darkwad', 'artist', 'fencebotA', 'fencebotB', 'lamplighter'];
  const lines = {
    greeterF: ['WELCOME HOOOME! ...to the Burn! Same thing!'], greeterM: ['Welcome home, brother! First Burn? Roll in the dust! No, wait, not now.'], furry: ['It is SO hot in here and I would not change a thing.'],
    cop: ['Groovy. Totally groovy. I am a regular burner. *badge falls out*'], badidea: ['What if I got REALLY close to the fire? For the vibes.'], deathguild: ['Two men enter... no wait, wrong dome. Enjoy the Burn.'],
    burney: ['Smile! *click* Brady at the Burn. Framing that one.'], partied: ['Is it... Saturday? It\'s SATURDAY! I made it!'], kid: ['My mom is here. She\'s having more fun than me. It\'s mortifying.'],
    mom: ['Brady! Photo! Both of you! Later! Go!'], cult: ['Join us after the Burn. We have snacks. And matching pink.'], gatestaff: ['Ticket? Kidding. Enjoy the Burn, Brady.'],
    darkwad: ['You can\'t see me. That\'s the point.'], artist: ['My moth made it! She\'s on the outer ring. Glowing.'], fencebotA: ['We could neither confirm nor deny being here.'], fencebotB: ['Beep. Boop.'], lamplighter: ['Every lamp is lit. It\'s time.']
  };
  st.cast = rest.map((k, i) => {
    const a = (i + 0.5) / rest.length * TAU * 0.86 + TAU * 0.07, r = 58.5;
    const x = Math.sin(a) * r, z = Math.cos(a) * r;
    if (Math.abs(BurnsM.wrap(a)) < 0.3) return null;
    const anim = k === 'cop' ? 'shuffle' : k === 'greeterF' || k === 'greeterM' || k === 'cult' ? 'w8910welcome' : k === 'badidea' ? 'w8910think' : 'cheer';
    // chat: their own ambient lines too (the engine's default fence-bot lines quote real song titles)
    return api.npc(BURNS_W8910_ARCH.npc(k, { id: 'cast_' + k, x, z, yaw: Math.atan2(-x, -z), anim, lines: lines[k], chat: k === 'fencebotA' || k === 'fencebotB' ? ['Beep.', 'Boop.', 'We could neither confirm nor deny.'] : lines[k] })).id;
  }).filter(Boolean);
  // the Bad Idea Guy sits a few seats from Brady and Chinka... and a ranger keeps an eye on him
  const B = BURNS_W10.BAD;
  api.npc(BURNS_W8910_ARCH.npc('badidea', { id: 'cast_badidea', x: B.x, z: B.z, yaw: Math.atan2(-B.x, -B.z), behavior: 'w10BadEdge', lines: lines.badidea, chat: ['Hear me out: what if the Man... but MORE on fire?', 'I brought marshmallows. And a very long stick. And a shorter stick.'] }));
  api.npc({ id: 'ranger_sunny', name: 'RANGER SUNNY', type: 'ranger', seed: 103, x: B.x + 1.6, z: B.z - 0.4, yaw: Math.atan2(-(B.x + 1.6), -(B.z - 0.4)), lines: ['I\'ve got my eye on that one. The one with the stick.'], chat: ['Stay behind the line, folks.', 'Yes. You. Behind the line.'] });
  // a few generic dancers between them
  api.crowd(-22, 56, 4, 5, { behaviors: ['dance'] }); api.crowd(24, 54, 4, 5, { behaviors: ['dance'] });
};

/* ---------------- intro: just landed ---------------- */
BURNS_W10.intro = function (g) {
  const W = BURNS_W10, S = W.state, p = g.player, L = W.LAND, cos = BurnsSave.get().costume || 'none';
  const f0 = g.actor(S.friends[0]), f1 = g.actor(S.friends[1]);
  p.teleport(L.x, 0, L.z, Math.PI); p.locked = true; p.animOverride = 'knocked';
  // he lands in his skydiving clothes; the costume goes on in a moment
  p.model = BurnsRig.model(BurnsRig.bradySpec('none')); p.ch.setModel(p.model);
  g.cutscene([
    { music: 'burns_w10' },
    { cam: { x: L.x + 9, y: 4.5, z: L.z + 12, tx: L.x, ty: 0.8, tz: L.z + 3, fov: 0.85 } },
    { banner: [BurnsWorlds.label(10).toUpperCase(), 'THE MAN PAVILION · BURN NIGHT', { col: '#ffd84a', big: true, dur: 3.2 }] },
    { do: g2 => { g2.fx.confetti(L.x + 3, 2, L.z + 4, 40); burnsSfx('crowd_cheer'); } },
    { say: [f0, ['HE STUCK THE LANDING! ...MOSTLY!']] },
    { do: g2 => { p.animOverride = 'victory'; } },
    { cam: { from: { x: L.x + 9, y: 4.5, z: L.z + 12, tx: L.x, ty: 0.8, tz: L.z + 3, fov: 0.85 }, to: { x: L.x + 2.2, y: 2.2, z: L.z + 5.5, tx: 0, ty: 9, tz: 0, fov: 0.8 }, dur: 3.2 } },
    { say: ['brady', ['She\'s alive.', 'And she\'s up there.']] },
    { do: g2 => { p.animOverride = 'spin'; g2.fx.confetti(p.x, p.y + 1.5, p.z, 50); g2.fx.burst(p.x, p.y + 1.2, p.z, 'star', 20, '#ffe24a'); burnsSfx('costume'); p.rebuildModel(); const C = BURNS_COSTUMES.find(c => c.id === cos); g2.toast('COSTUME: ' + (C ? C.name.toUpperCase() : 'CLASSIC BRADY')); } },
    { wait: 0.6 },
    { do: g2 => { p.animOverride = 'victory'; } },
    { cam: { x: L.x - 3.4, y: 1.9, z: L.z - 3.6, tx: L.x, ty: 1.4, tz: L.z, fov: 0.75 } },
    { say: ['brady', [BURNS_W10_COSTUME_LINES[cos] || BURNS_W10_COSTUME_LINES.none]] },
    { say: [f1, ['Your bike, honey! The crew stashed it right where you said. GO GET HER!']] },
    { do: g2 => { BurnsSave.flag(10, 'intro', true); S.introDone = true; p.animOverride = null; p.locked = false; p.teleport(L.x, 0, L.z, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; W.mountBike(g2); } },
    { banner: ['RIDE TO THE BURN', 'Ride down the promenade. ACTION rings your bell.', { col: '#ffd84a' }] }
  ], null);
};
BURNS_W10.mountBike = function (g) {
  const p = g.player; if (!g.bike || p.vehicle) return;
  g.bike.x = p.x; g.bike.z = p.z; g.bike.y = p.y; g.bike.yaw = p.yaw; g.fx.confetti(p.x, p.y + 1, p.z, 10); g.bike.mount(p);
};

/* ---------------- per-step logic ---------------- */
BURNS_W10.update = function (g, dt) {
  const W = BURNS_W10, S = W.state, p = g.player, man = S.man;
  // ambient fireworks over the playa before the Burn (a few, far away)
  if (!S.burning && !S.after && Math.random() < dt * 0.15) { const a = Math.random() * TAU, d = 120 + Math.random() * 60; S.mortars.push({ x: Math.sin(a) * d, y: 0, z: Math.cos(a) * d, vy: 34 + Math.random() * 10, t: 0, top: 1.4 + Math.random() * 0.6 }); }
  W.mortarUpdate(g, dt);
  // the saucer: hovers when he's a giant, lands for the Burn
  const sau = S.saucer;
  if (S.saucerTarget !== undefined) { sau.y = BurnsM.damp(sau.y, S.saucerTarget, 0.9, dt); sau.yaw += dt * (sau.y > 4 ? 0.25 : 0); }
  // phase 1: tractor beams when he collapses, and no camping on his saucer
  if (S.phase === 1 && man.active && !man.defeated) {
    S.beamsOn = man.st === 'stunned';
    if (S.beamsOn) for (let i = 0; i < 4; i++) {
      const a = i / 4 * TAU + Math.PI / 4, bx = Math.sin(a) * W.BEAM_R, bz = Math.cos(a) * W.BEAM_R;
      if (Math.hypot(p.x - bx, p.z - bz) < 2.5 && p.y < W.DECK + 1.2 && !p.vehicle) { p.vy = Math.max(p.vy, 10); p.grounded = false; p.jumps = 1; S.lift = 0.6; S.liftDir = a; if (Math.random() < dt * 20) g.fx.burst(p.x, p.y, p.z, 'star', 1, '#9aff9a'); }
    }
    if (S.lift > 0) { S.lift -= dt; if (p.y > W.DECK + 0.6) { p.vx = -Math.sin(S.liftDir) * 7; p.vz = -Math.cos(S.liftDir) * 7; } }
    const onDeck = p.y > W.DECK - 0.4 && Math.hypot(p.x, p.z) < W.SAUCER_R && p.grounded;
    if (onDeck && man.st !== 'stunned' && man.st !== 'hurt') { S.onDeckT += dt; if (S.onDeckT > 1.2) { S.onDeckT = 0; W.quake(g); } } else S.onDeckT = 0;
  } else S.beamsOn = false;
  W.flingUpdate(g, dt);
  // phase 2: the green "SAFE" rings come from the Man (cfg.covers); hand out water after hits
  // the burn itself
  if (S.fireworks > 0) W.fireworksUpdate(g, dt);
  if (S.burning) W.burnUpdate(g, dt);
  // fire spinners spin
  for (const id of S.spinners) { const a = g.actor(id); if (a && !a.hidden && a.def.w8910poi) a.ch.play('w8910spin'); }
};
BURNS_W10.quake = function (g) {
  const W = BURNS_W10, S = W.state, p = g.player, sau = S.saucer, ox = p.x - sau.x, oz = p.z - sau.z, d = Math.hypot(ox, oz);
  const a = d > 0.6 ? Math.atan2(ox, oz) : p.yaw;
  g.bossSay(S.man, burnsW8910Pick(['OFF MY SAUCER!', 'NO STANDING ON THE PAVILION!', 'THIS IS A PRIVATE DECK!']));
  g.shake(0.6); burnsSfx('man_stomp'); g.fx.ring(sau.x, W.DECK + 0.1, sau.z, W.SAUCER_R, '#ff4fd8', 0.6); g.fx.ring(p.x, p.y + 0.1, p.z, 4, '#ffe24a', 0.5);
  p.hurt(1, sau.x, sau.z, 1);
  // the deck bucks and spins: Brady is flung clean off the rim (fair: it only happens if you stay up there while he's not stunned)
  S.fling = { a, t: 1.4 };
  p.knock(Math.sin(a) * 17, 11, Math.cos(a) * 17);
};
BURNS_W10.flingUpdate = function (g, dt) {
  const W = BURNS_W10, S = W.state, F = S.fling, p = g.player; if (!F) return;
  F.t -= dt;
  const r = Math.hypot(p.x - S.saucer.x, p.z - S.saucer.z);
  if (F.t <= 0 || p.dead || g.cine || r > W.SAUCER_R + 1.2) { S.fling = null; return; }
  p.vx = Math.sin(F.a) * 17; p.vz = Math.cos(F.a) * 17; p.knockT = Math.max(p.knockT, 0.12);
  if (p.grounded && p.y > W.DECK - 0.6) { p.vy = 8; p.grounded = false; p.platform = null; }
  if (Math.random() < dt * 30) g.fx.burst(p.x, p.y + 0.4, p.z, 'star', 1, '#ff4fd8');
};
BURNS_W10.mortarUpdate = function (g, dt) {
  const S = BURNS_W10.state;
  if (!S.mortars.length) return;
  for (const q of S.mortars) {
    q.t += dt; q.y += q.vy * dt; q.vy -= 9 * dt;
    if (q.t > q.top) {
      q.dead = true; const col = BURNS_NEON[Math.floor(Math.random() * 7)];
      g.fx.firework(q.x, q.y, q.z, col); if (q.big) { g.fx.firework(q.x + 2, q.y + 1, q.z, BURNS_NEON[Math.floor(Math.random() * 7)]); g.fx.ring(q.x, q.y, q.z, 9, col, 0.9); }
      const d = Math.hypot(q.x - g.player.x, q.z - g.player.z); if (d < 150) burnsSfx('firework_burst', { vol: clamp(1 - d / 160, 0.1, 0.8), pitch: 0.7 + Math.random() * 0.5 });
    }
  }
  S.mortars = S.mortars.filter(q => !q.dead);
};
BURNS_W10.env = function (g, env) {
  const S = BURNS_W10.state;
  // the engine lights the scene with the first 4 point lights queued; during the Burn the fire comes first
  // (the eight fire spinners each queue one, and would otherwise crowd it out)
  if (S.burnK > 0 && g.plights) {
    const k = S.burnK, fl = 1 + Math.sin(g.time * 13) * 0.06 + Math.sin(g.time * 31) * 0.04;
    g.plights.unshift({ x: 0, y: BURNS_W10.DECK + 10, z: 0, r: 60, c: [1, 0.5, 0.15], i: 2.2 * k * fl }, { x: 0, y: 2, z: 30, r: 40, c: [1, 0.55, 0.2], i: 1.2 * k * fl }, { x: 0, y: 4, z: 47, r: 24, c: [1, 0.5, 0.18], i: 0.9 * k * fl });
  }
  if (S.burnK > 0) { env.emB += S.burnK * 0.3; env.fogCol = env.fogCol.map((c, i) => lerp(c, [0.45, 0.2, 0.1][i], S.burnK * 0.35)); env.haze = Math.min(1, env.haze + S.burnK * 0.2); }
  if (S.phase === 2 && S.man && S.man.st === 'flash') env.emB += S.man.flashK * 0.6;
};
BURNS_W10.drawSprites = function (g, R) {
  const W = BURNS_W10, S = W.state, SP = BURNS_SPRITES.R, t = g.time, p = g.player;
  // mortar trails
  for (const q of S.mortars) { R.bbs.bb(q.x, q.y, q.z, 1.4, 1.4, SP.glow, [1, 0.8, 0.5], 0.9, true); if (Math.random() < 0.8) g.fx.trail(q.x, q.y, q.z, '#ffd890'); }
  // tractor beams
  if (S.beamsOn) for (let i = 0; i < 4; i++) {
    const a = i / 4 * TAU + Math.PI / 4, bx = Math.sin(a) * W.BEAM_R, bz = Math.cos(a) * W.BEAM_R, pul = 0.6 + 0.4 * Math.sin(t * 8 + i);
    R.bbs.streak(bx, 3.0, bz, 0, 1, 0, 6.5, 3.4, SP.streak, [0.5, 1, 0.55], 0.55 * pul);
    R.flat.flat(bx, 0.07, bz, 5, 5, t * 2, SP.ring, [0.5, 1, 0.55], 0.9 * pul, true);
    if (Math.random() < 0.5) g.fx.add(bx + (Math.random() - 0.5) * 2, 0.3, bz + (Math.random() - 0.5) * 2, 0, 5 + Math.random() * 3, 0, 1.0, 0.4, 0.1, [0.6, 1, 0.6], 1, 'star', 1, Math.random() * 6, 3);
  }
  // glow sticks in the hands of the landing friends
  for (const id of S.friends || []) { const a = g.actor(id); if (!a || a.hidden) continue; for (const side of [1, -1]) { const h = a.ch.bonePoint(side > 0 ? BURNS_BONES.FARM_L : BURNS_BONES.FARM_R, 0, -0.3, 0); R.bbs.bb(h[0], h[1], h[2], 0.7, 0.7, SP.glow, burnsRGBf(BURNS_NEON[(side + 2 + id.length) % 7]), 0.9, true); } }
  // fire spinners: two flaming poi each, orbiting their hands
  for (const id of S.spinners) {
    const a = g.actor(id); if (!a || a.hidden || !a.def.w8910poi) continue;
    for (const side of [1, -1]) { const h = a.ch.bonePoint(side > 0 ? BURNS_BONES.FARM_L : BURNS_BONES.FARM_R, 0, -0.3, 0), an = t * 9 * side + (side > 0 ? 0 : 1.5); const fx = h[0] + Math.cos(an) * 0.6, fy = h[1] + Math.sin(an) * 0.6, fz = h[2]; R.bbs.bb(fx, fy, fz, 0.8, 0.9, SP.flame, [1, 0.62, 0.22], 1, true); g.fx.fire(fx, fy, fz, 0.5); }
    g.pointLight(a.x, a.y + 1.5, a.z, 6, [1, 0.5, 0.15], 0.6);
  }
  // the burn: flames climb the Man, embers, a fire tornado, and the glow
  if (S.burnK > 0 && S.man) W.drawBurn(g, R);
};

/* ---------------- quests ---------------- */
BURNS_W10.luzTalk = function (g, a) {
  const st = g.missions.state('lamps');
  if (st === 'available') g.say(a, ['Brady. We\'ve heard. Everyone\'s heard.', 'Nobody walks to the Burn in the dark. Help me light the promenade: eight lamps, four each side. Then go get her.'], () => { g.missions.start('lamps'); BURNS_W10.lampInteract(g); });
  else if (st === 'active') g.say(a, [`${g.missions.get('lamps').n} of 8. Walk up to a dark lamp and light it.`]);
  else g.say(a, ['Every lamp is lit. Now go. She\'s waiting.']);
};
BURNS_W10.lampInteract = function (g) {
  const S = BURNS_W10.state;
  g.interactables = (g.interactables || []).filter(it => !it.lamp);
  for (const L of S.lamps) g.interactables.push({ lamp: true, x: L.x - Math.sign(L.x) * 0.9, z: L.z, r: 2.6, label: 'LIGHT', when: g2 => !L.lit && g2.missions.state('lamps') === 'active', fn: g2 => BURNS_W10.lightLamp(g2, L) });
};
BURNS_W10.lightLamp = function (g, L, quiet) {
  if (L.lit) return; L.lit = true; BurnsW8910.setGlow(L.G, true);
  if (quiet) return;
  g.fx.burst(L.x - Math.sign(L.x) * 0.85, 3.7, L.z, 'spark', 16, '#ffd890'); burnsSfx('pick', { pitch: 1.3 }); g.fx.confetti(L.x, 4, L.z, 8);
  g.missions.progress('lamps', 1);
};
BURNS_W10.dropzTalk = function (g, a) {
  const st = g.missions.state('ringin');
  if (st === 'available' || st === 'locked') g.say(a, ['MAKE SOME NOOOISE! ...nobody\'s making noise. The art cars are DARK, man.', 'Six of \'em on the outer ring won\'t wake up for the Burn. They only respond to... a bike bell. Don\'t ask. Art cars are weird.', 'Ride up close and ring that bell! MAKE SOME NOISE!'], () => g.missions.start('ringin'));
  else if (st === 'active') g.say(a, [`${g.missions.get('ringin').n} of 6! Ride close and RING THAT BELL!`]);
  else g.say(a, ['THE WHOLE RING IS LIT! Here comes the drop! ...here comes the drop again!']);
};
BURNS_W10.ringBell = function (g) {
  const S = BURNS_W10.state, p = g.player;
  for (const c of S.cars) if (!c.lit && Math.hypot(p.x - c.x, p.z - c.z) < 12) { BURNS_W10.wakeCar(g, c); g.missions.progress('ringin', 1); }
};
BURNS_W10.wakeCar = function (g, c, quiet) {
  if (c.lit) return; c.lit = true; for (const G of c.glows) BurnsW8910.setGlow(G, true);
  if (quiet) return;
  for (let i = 0; i < 18; i++) g.fx.add(c.x + (Math.random() - 0.5) * 3, 3, c.z + (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 2, 10 + Math.random() * 5, (Math.random() - 0.5) * 2, 0.6, 1.6, 0.6, [1, 0.55, 0.15], 1, 'flame', 1);
  g.fx.confetti(c.x, 4, c.z, 30); burnsSfx('artcarHorn'); burnsSfx('flame_jet'); burnsSfx('crowd_cheer', { vol: 0.5 });
};

/* ---------------- the final battle ---------------- */
BURNS_W10.arenaEnter = function (g) {
  const S = BURNS_W10.state;
  if (S.fighting) return;
  if (g.missions.state('saucer') === 'available') BURNS_W10.bossIntro(g);
  else if (g.missions.state('giant') === 'available' && S.phase === 2) BURNS_W10.giantResume(g);
};
BURNS_W10.bossIntro = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player;
  S.fighting = true; S.phase = 1;
  if (p.vehicle) p.vehicle.dismount(p);
  g.missions.start('saucer', true);
  g.cutscene([
    { music: 'man_boss' },
    { do: g2 => { p.teleport(0, 0, 50, Math.PI); man.x = 0; man.z = 0; man.y = W.DECK; man.yaw = 0; man.hidden = false; man.showChinka = true; man.setState('idle'); } },
    { cam: { x: 22, y: 1.5, z: 40, tx: 0, ty: 7, tz: 0, fov: 0.9 } },
    { cam: { from: { x: 22, y: 1.5, z: 40, tx: 0, ty: 7, tz: 0, fov: 0.9 }, to: { x: 6, y: 12, z: 26, tx: 0, ty: 16, tz: 0, fov: 0.8 }, dur: 3.6 } },
    { do: g2 => { g2.shake(0.4); burnsSfx('man_roar'); } },
    { banner: ['THE MAN', 'Pavilion Overlord · Final Boss', { col: '#ffd84a', big: true, dur: 3.2 }] },
    { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['BRADY! You\'re here! ...Is that a parachute in your hair?']] },
    { say: ['brady', ['Long story. Involves a plane.']] },
    { say: ['man', ['SMALL MAN. YOU CAME BACK. AGAIN.', 'THIS IS MY PAVILION. MY NIGHT. MY... CHINKA.']] },
    { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['I am NOT your Chinka! I\'m HIS Chinka! And I\'m my OWN Chinka!']] },
    { say: ['man', ['THEN WATCH, BUN BOY, AS I DEFEND MY LOVE FROM ON HIGH!']] },
    { do: g2 => { p.teleport(0, 0, 44, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; g2.boss = burnsW8910Proxy(man, { camY: 9 }); man.start(); g2.banner('THE SAUCER', 'When he slumps, ride a green beam up · bonk his head', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W10.phase1Down = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player;
  g.missions.complete('saucer');
  BurnsW8910Haz.clear(g); g.proj.list.length = 0; g.proj.waves.length = 0; S.beamsOn = false;
  BurnsW8910.timer(g, 1.5, g2 => W.toGiant(g2));
};
// the transformation: the saucer takes off, the Man grows into a giant
BURNS_W10.toGiant = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player;
  S.phase = 2; S.growT = 0;
  g.cutscene([
    { do: g2 => { burnsMusic(null); if (p.vehicle) p.vehicle.dismount(p); p.teleport(0, 0, 52, Math.PI); man.defeated = false; man.active = false; man.setState('idle'); } },
    { cam: { x: 14, y: 3, z: 38, tx: 0, ty: 12, tz: 0, fov: 0.95 } },
    { say: ['man', ['ENOUGH.', 'IF SHE WILL NOT LOVE A MAN...', '...SHE WILL LOVE A GIANT!']] },
    { music: 'man_giant' },
    { do: g2 => { S.saucerTarget = 52; g2.shake(0.8); burnsSfx('man_roar', { pitch: 0.6 }); g2.screenFlash('#ffd0f8', 0.6); } },
    { cam: { from: { x: 14, y: 3, z: 38, tx: 0, ty: 12, tz: 0, fov: 0.95 }, to: { x: 22, y: 2, z: 58, tx: 0, ty: 24, tz: 0, fov: 1.0 }, dur: 3.2 } },
    { until: g2 => { S.growT += 1 / 120; const k = Math.min(1, S.growT / 3.2); man.scale = lerp(1, 2.6, easeInOut(k)); man.y = lerp(W.DECK, 0, easeInOut(Math.min(1, k * 1.3))); if (Math.random() < 0.3) g2.fx.burst(man.x + (Math.random() - 0.5) * 6, man.y + Math.random() * 20 * man.scale, man.z + (Math.random() - 0.5) * 6, 'star', 2, '#ff9ad8'); if (Math.floor(S.growT * 3) !== Math.floor((S.growT - 1 / 120) * 3)) { g2.shake(0.4); burnsSfx('man_stomp', { vol: 0.7 }); } return k >= 1; } },
    { banner: ['THE GIANT MAN', 'Final Form · He is very, very big now', { col: '#ff4fd8', big: true, dur: 3.4 }] },
    { say: ['brady', ['...Okay. That\'s a lot of Man.']] },
    { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['BRADY! When he flashes, HIDE! Behind the domes! The speakers! Anything!']] },
    { do: g2 => { W.giantSetup(g2); const cp = g2.world.checkpoints.find(c => c.id === 'cp_giant'); if (cp) g2.checkpointTouch(cp); p.teleport(-6, 0, 50, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; g2.boss = burnsW8910Proxy(man, { camY: 6.5, name: () => 'THE GIANT MAN' }); man.start(); g2.banner('FINAL FORM', 'Flash? Hide in a green ring · bonk him when he kneels', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W10.giantSetup = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, c = man.cfg;
  S.phase = 2; S.saucerTarget = 52; S.saucer.y = Math.max(S.saucer.y, 30); S.saucer.noCollide = true;
  man.x = 0; man.z = 0; man.y = 0; man.scale = 2.6; man.yaw = Math.PI * 0; man.hp = 3; man.maxHp = 3; man.phase = 0; man.combo = 0; man.defeated = false; man.hidden = false; man.showChinka = true;
  Object.assign(c, { attacks: ['flash', 'stomp', 'fan', 'fireworks', 'swipe'], phases: BURNS_W10_P2, arena: W.ARENA2, lines: BURNS_W10_LINES2, stun: 6.5, flashCharge: 3.4, flashDamage: 6, flashWipe: true, flashWarn: 'TAKE COVER! GREEN = SAFE', fireworks: 11, stunDrop: 0.82,
    stunLines: ['BEING HUGE... IS EXHAUSTING...', 'MY KNEES... ARE MADE OF LUMBER...', 'NEED... A CUDDLE PUDDLE...'],
    hitLines: ['TIMBER! ...NO! NOT TIMBER!', 'YOU BONKED A GIANT!', 'I AM TOO BIG TO FAIL!', 'SHE... IS... MINE...'],
    onPhase(g2, b, i) { g2.banner(i === 1 ? 'HE\'S FURIOUS' : 'LAST STAND', i === 1 ? 'Faster flashes. Keep moving between cover.' : 'Everything at once. You\'ve got this.', { col: '#ff4fd8' }); },
    onHit(g2, b) { const p = g2.player; g2.spawnPickup('water', p.x + Math.sin(p.yaw) * 6, 1, p.z + Math.cos(p.yaw) * 6, { pop: true }); },
    onDefeat(g2, b) { BURNS_W10.giantDown(g2); } });
  man.setState('idle');
};
// reloaded between phases: the giant waits in the circle
BURNS_W10.giantReady = function (g) {
  const W = BURNS_W10, S = W.state;
  S.phase = 2; S.saucerTarget = 52; S.saucer.y = 52;
  W.giantSetup(g);
  S.man.active = false;
};
BURNS_W10.giantResume = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player;
  S.fighting = true;
  if (p.vehicle) p.vehicle.dismount(p);
  g.missions.start('giant', true);
  g.cutscene([
    { music: 'man_giant' },
    { cam: { x: 18, y: 2, z: 56, tx: 0, ty: 22, tz: 0, fov: 1.0 } },
    { say: ['man', ['ROUND TWO, BUN BOY. I AM STILL VERY BIG.']] },
    { do: g2 => { p.teleport(-6, 0, 50, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; g2.boss = burnsW8910Proxy(man, { camY: 6.5, name: () => 'THE GIANT MAN' }); man.start(); } }
  ]);
};
BURNS_W10.respawnReset = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man;
  BurnsW8910Haz.clear(g); g.proj.list.length = 0; g.proj.waves.length = 0; g.tempFires.length = 0;
  if (!S.fighting || S.burning || S.after) return;
  if (S.phase === 1 && !g.missions.isDone('saucer')) { man.hp = man.maxHp; man.phase = 0; man.combo = 0; man.x = 0; man.z = 0; man.y = W.DECK; man.setState('idle'); g.toast('THE MAN IS WAITING ON HIS SAUCER.'); }
  if (S.phase === 2 && !g.missions.isDone('giant')) { man.hp = 3; man.phase = 0; man.combo = 0; man.x = 0; man.z = 0; man.y = 0; man.scale = 2.6; man.setState('idle'); g.toast('THE GIANT IS WAITING. SECOND WIND!'); }
};
BURNS_W10.posePatch = function (P, t, b) {
  const S = BURNS_W10.state, B = BURNS_BONES, Sx = (bn, x, y, z) => { P.r[bn * 3] = x; P.r[bn * 3 + 1] = y || 0; P.r[bn * 3 + 2] = z || 0; };
  if (S.armsK !== undefined) { const k = easeInOut(clamp(S.armsK, 0, 1)); Sx(B.UARM_L, -0.1, 0, lerp(0.22, 2.6, k)); Sx(B.FARM_L, 0, 0, lerp(0.05, 0.25, k)); Sx(B.UARM_R, -0.1, 0, -lerp(0.22, 2.6, k)); Sx(B.FARM_R, 0, 0, -lerp(0.05, 0.25, k)); Sx(B.HEAD, lerp(0.15, -0.2, k)); P.face = 3; }
  if (S.collapseK > 0) { const k = easeInOut(clamp(S.collapseK, 0, 1)); Sx(B.THIGH_L, -0.9 * k); Sx(B.SHIN_L, 1.6 * k); Sx(B.THIGH_R, -0.6 * k); Sx(B.SHIN_R, 1.2 * k); Sx(B.CHEST, 0.5 * k); P.pitch = 1.25 * k * k; P.pivot = 0.9; P.y = -2.2 * k; }
};

/* ---------------- victory: the rescue, then the Burn ---------------- */
BURNS_W10.giantDown = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player;
  g.missions.complete('giant');
  BurnsSave.get().beaten = true; BurnsSave.flag(10, 'beaten', true); BurnsSave.save();
  BurnsW8910Haz.clear(g); g.proj.list.length = 0; g.proj.waves.length = 0; g.tempFires.length = 0;
  S.fighting = false;
  BurnsW8910.timer(g, 1.6, g2 => W.burn(g2));
};
BURNS_W10.burn = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player, V = W.VIEW;
  const chinkaWho = () => g.actor('chinka') || { name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) };
  const camAt = (x, y, z, tx, ty, tz, fov) => ({ x, y, z, tx, ty, tz, fov: fov || 0.85 });
  S.t2 = 0;
  g.cutscene([
    { do: g2 => { burnsMusic(null); g2.boss = null; g2.banners.length = 0; g2.toasts.length = 0; man.active = false; man.defeated = false; man.setState('defeated'); if (p.vehicle) p.vehicle.dismount(p); p.teleport(4, 0, 30, Math.PI); p.locked = true; } },
    { cam: camAt(16, 4, 34, 0, 10, 0, 0.9) },
    { say: ['man', ['...ENOUGH.', 'I HAVE BEEN... A VERY BIG... VERY SILLY MAN.']] },
    { do: g2 => { S.t2 = 0; man.setState('idle'); } },
    { until: g2 => { S.t2 += 1 / 120; const k = Math.min(1, S.t2 / 2.6); man.scale = lerp(2.6, 1.0, easeInOut(k)); if (Math.random() < 0.3) g2.fx.burst(man.x + (Math.random() - 0.5) * 4, man.y + Math.random() * 12, man.z + (Math.random() - 0.5) * 4, 'star', 1, '#ffd0f8'); return k >= 1; } },
    { do: g2 => { const h = man.hand(1); man.showChinka = false; man.chinka = null; const c = g2.spawnActor({ id: 'chinka', type: 'chinka', name: 'CHINKA', x: h[0], z: h[2] + 1, yaw: 0, noTalk: true, chatter: false, behavior: 'idle', always: true }); c.y = 0; g2.fx.hearts(c.x, 2, c.z, 20); burnsSfx('secret'); } },
    { cam: camAt(9, 2.2, 36, 3, 1.4, 28, 0.8) },
    { move: { actor: 'chinka', x: 4.6, z: 29.2, speed: 4.5, anim: 'run' } },
    { do: g2 => { const c = g2.actor('chinka'); c.yaw = Math.atan2(p.x - c.x, p.z - c.z); p.yaw = Math.atan2(c.x - p.x, c.z - p.z); c.ch.play('hug'); p.animOverride = 'hug'; g2.fx.hearts(p.x + 0.3, 2.2, p.z, 30); burnsSfx('crowd_cheer'); g2.banner('CHINKA RESCUED!', 'Brady and Chinka, reunited on Burn night', { col: '#ff9ad0', big: true, dur: 3.5 }); } },
    { wait: 1.6 },
    { say: [chinkaWho(), ['You came. Through a dust storm, a gas station run by DPW... and an actual airplane.']] },
    { say: ['brady', ['I told you I\'d always find you.']] },
    { say: [chinkaWho(), ['...You have a parachute in your hair.']] },
    { say: ['man', ['SHE WAS NEVER MINE TO KEEP.', 'AND YOU ALL CAME TONIGHT FOR SOMETHING, DIDN\'T YOU.', 'IT IS SATURDAY. IT IS TIME.', '...BURN ME.']] },
    { fade: 'out', dur: 1.0 },
    { do: g2 => W.burnStage(g2) },
    { music: 'burns_ending' },
    { fade: 'in', dur: 1.4 },
    // 1. the circle
    { cam: { from: camAt(-70, 14, 50, 0, 6, 0, 0.95), to: camAt(-40, 10, 78, 0, 8, 0, 0.9), dur: 4.5 } },
    { banner: ['THE BURN', 'Saturday night on the playa', { col: '#ff9a4a', big: true, dur: 3.6 }] },
    { cam: { from: camAt(60, 9, 70, 0, 7, 0, 0.9), to: camAt(30, 5, 40, 0, 8, 0, 0.85), dur: 4 } },
    // 2. the performance
    { do: g2 => { for (const id of S.spinners) { const a = g2.actor(id); if (a) a.hidden = false; } burnsSfx('flame_jet', { vol: 0.6 }); } },
    { cam: { from: camAt(18, 1.6, 30, 0, 2.5, 18, 0.85), to: camAt(-14, 1.8, 30, 0, 2.5, 18, 0.85), dur: 5 } },
    // 3. the arms: a hush, then the iconic moment
    { do: g2 => { burnsMusic(null); S.armsK = 0; for (const a of g2.actors) if (!a.hidden && a.def.ambient) a.ch.play('idle'); } },
    { cam: camAt(0, 2.0, 34, 0, 11, 0, 0.8) },
    { wait: 1.6 },
    { until: g2 => { S.armsK += 1 / 120 / 4.0; return S.armsK >= 1; } },
    { do: g2 => { S.roar = true; burnsSfx('crowd_cheer', { vol: 1 }); burnsSfx('crowd_cheer', { vol: 0.8, pitch: 0.8 }); g2.shake(0.3); burnsMusic('burns_ending'); W.crowdCheer(g2); } },
    // 4. the fireworks
    { do: g2 => { S.fireworks = 9; } },
    { cam: { from: camAt(0, 1.6, 46, 0, 22, 0, 1.0), to: camAt(14, 3, 50, 0, 28, 0, 1.05), dur: 8.5 } },
    // 5. the fire
    { do: g2 => { S.burning = true; S.burnT = 0; burnsSfx('flame_jet', { vol: 1 }); } },
    { cam: { from: camAt(10, 3, 32, 0, 9, 0, 0.9), to: camAt(-10, 4, 30, 0, 12, 0, 0.95), dur: 5.5 } },
    // (meanwhile, a few seats from Brady: the Bad Idea Guy has an idea)
    { do: g2 => W.badEdge(g2) },
    { cam: { from: camAt(W.BAD.x - 3.6, 1.7, W.BAD.z - 10.5, W.BAD.x + 1, 1.5, W.BAD.z, 0.8), to: camAt(W.BAD.x - 2.6, 1.9, W.BAD.z - 8.8, W.BAD.x + 1, 1.5, W.BAD.z, 0.8), dur: 3.8 } },
    { cam: { from: camAt(-10, 4, 30, 0, 12, 0, 0.95), to: camAt(-6, 4.5, 34, 0, 12, 0, 0.95), dur: 2.0 } },
    // 6. the fall
    { do: g2 => { S.collapseT = 0; burnsSfx('man_roar', { pitch: 0.5, vol: 0.8 }); } },
    { cam: camAt(0, 3, 44, 0, 8, 0, 0.9) },
    { until: g2 => { S.collapseT += 1 / 120; S.collapseK = Math.min(1, S.collapseT / 3.2); if (S.collapseK >= 1 && !S.fell) { S.fell = true; g2.shake(0.9); for (let i = 0; i < 6; i++) g2.fx.spark(man.x + (Math.random() - 0.5) * 8, 2 + Math.random() * 6, man.z - 8 + (Math.random() - 0.5) * 8, 30, '#ffd890', 14); burnsSfx('crowd_cheer', { vol: 1 }); burnsSfx('man_stomp'); W.crowdCheer(g2); } return S.collapseT > 4.4; } },
    // 7. Brady and Chinka, together, lit by the fire (quiet: no bubbles, no banners)
    { do: g2 => { BurnsW8910.clearTimers(g2); g2.banners.length = 0; for (const a of g2.actors) { a.bubbleT = 0; a.bubbleText = null; } } },
    { cam: camAt(V.x + 1.4, 1.4, V.z + 5.2, 0, 4, 0, 0.75) },
    { wait: 2.6 },
    { say: [chinkaWho(), ['Best. Burn. Ever.']] },
    { say: ['brady', ['Same time next year?']] },
    { say: [chinkaWho(), ['Same time next year.']] },
    { do: g2 => { W.afterBurn(g2, true); } },
    { fade: 'out', dur: 2.2 },
    { wait: 0.6 }
  ], g2 => { p.locked = false; p.animOverride = null; g2.finishWorld(gg => BURNS_W8910_END.start(gg)); });
};
// set the stage for the Burn: the saucer lands, the Man climbs on top, everyone takes their places
BURNS_W10.burnStage = function (g) {
  const W = BURNS_W10, S = W.state, man = S.man, p = g.player, V = W.VIEW;
  S.saucerTarget = 0; S.saucer.y = 0; S.saucer.yaw = 0; S.saucer.noCollide = false;
  man.x = 0; man.z = 0; man.y = W.DECK; man.scale = 1.15; man.yaw = 0; man.hidden = false; man.active = false; man.defeated = false; man.setState('idle'); man.showChinka = false; man.chinka = null;
  S.armsK = 0; S.collapseK = 0; g.banners.length = 0; g.toasts.length = 0;
  p.teleport(V.x - 0.6, 0, V.z, Math.PI); p.animOverride = 'sit'; p.locked = true;
  const c = g.actor('chinka') || g.spawnActor({ id: 'chinka', type: 'chinka', name: 'CHINKA', x: 0, z: 0, noTalk: true, chatter: false, behavior: 'idle', always: true });
  c.x = V.x + 0.6; c.z = V.z; c.y = 0; c.yaw = Math.PI; c.setBehavior('sit'); c.def.lookAt = false;
  for (const cc of S.cars) W.wakeCar(g, cc, true);
  for (const L of S.lamps) W.lightLamp(g, L, true);
  for (const id of S.spinners) { const a = g.actor(id); if (a) a.hidden = true; }
  g.tod = 1;
};
BURNS_W10.crowdCheer = function (g) {
  const talkers = [];
  for (const a of g.actors) { if (a.hidden || a.id === 'chinka' || a.def.spinner) continue; if (a.behName !== 'sit') { a.def.anim = 'cheer'; a.ch.play('cheer'); } if (a.def.burnLines) talkers.push(a); }
  // a few voices, one after another (a wall of overlapping bubbles reads as noise)
  for (let i = talkers.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = talkers[i]; talkers[i] = talkers[j]; talkers[j] = t; }
  talkers.slice(0, 3).forEach((a, i) => BurnsW8910.timer(g, 0.2 + i * 1.3, () => a.say(burnsW8910Pick(a.def.burnLines), 2.2)));
};
// fireworks from the base, from the Man himself and from the Retro Rocket (game time, so it plays the same at any frame rate)
BURNS_W10.fireworksUpdate = function (g, dt) {
  const S = BURNS_W10.state, man = S.man;
  S.fireworks -= dt;
  if (Math.random() < dt * 13) { const a = Math.random() * TAU, r = 16; S.mortars.push({ x: Math.sin(a) * r, y: 6, z: Math.cos(a) * r, vy: 30 + Math.random() * 12, t: 0, top: 1.2 + Math.random() * 0.8, big: Math.random() < 0.3 }); }
  if (Math.random() < dt * 4.8) { const h = man.hand(Math.random() < 0.5 ? 1 : -1); S.mortars.push({ x: h[0], y: h[1], z: h[2], vy: 26, t: 0, top: 0.9 + Math.random() * 0.4 }); }
  if (Math.random() < dt * 3.6 && S.rocketTop) { const K = S.rocketTop; S.mortars.push({ x: K[0], y: K[1], z: K[2], vy: 34, t: 0, top: 1.4, big: true }); }
  if (Math.random() < dt * 3) g.screenFlash('#ffe8c0', 0.08);
};
// the Bad Idea Guy edges toward the fire "for science", gets yelled at, runs back
BURNS_W10.badEdge = function (g) {
  const a = g.actor('cast_badidea'); if (!a || a.hidden) return;
  a.data.st = 'edge'; a.say('Is it hot if I get closer? For science?', 1.7);
  BurnsW8910.timer(g, 1.8, g2 => { a.data.st = 'caught'; const r = g2.actor('ranger_sunny'); if (r) r.say('BACK BEHIND THE LINE, BUDDY.', 1.6); });
  BurnsW8910.timer(g, 2.7, g2 => { a.data.st = 'back'; a.say('...Worth it.', 1.6); });
};
BurnsBehaviors.register('w10BadEdge', {
  init(a) { a.data.st = 'wait'; a.data.hx = a.x; a.data.hz = a.z; },
  update(a, g, dt) {
    const D = a.data;
    if (D.st === 'edge') { a.moveTo(0, 0, 1.5, dt, 0.4); a.ch.play('walk'); }
    else if (D.st === 'back') { const d = a.moveTo(D.hx, D.hz, 3.6, dt, 0.3); a.ch.play(d > 0.4 ? 'run' : 'idle'); if (d <= 0.4) { D.st = 'wait'; a.yaw = Math.atan2(-a.x, -a.z); } }
    else { a.vx = a.vz = 0; a.ch.play(D.st === 'caught' ? 'hurt' : (BURNS_W10.state && BURNS_W10.state.burning ? 'cheer' : 'w8910think')); }
    a.physics(dt);
  }
});
BURNS_W10.burnUpdate = function (g, dt) {
  const W = BURNS_W10, S = W.state, man = S.man;
  S.burnT = (S.burnT || 0) + dt;
  S.burnK = Math.min(1, S.burnK + dt / 3);
  S.fireH = Math.min(1, S.fireH + dt / 6);
  man.hurtTint = [1, 0.45, 0.12, 0.15 + 0.5 * S.fireH];
  // the base: fires all around the saucer
  if (Math.random() < dt * 12) { const a = Math.random() * TAU, r = 3 + Math.random() * 14; g.fx.fire(Math.sin(a) * r, W.DECK + 0.2, Math.cos(a) * r, 2.2); }
  if (!S.baseFires) { S.baseFires = true; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; g.addTempFire(Math.sin(a) * 17.5, 0, Math.cos(a) * 17.5, 1.0, 60); } }
};
BURNS_W10.drawBurn = function (g, R) {
  const W = BURNS_W10, S = W.state, man = S.man, SP = BURNS_SPRITES.R, t = g.time;
  if (!S.burning) return;
  // flames climb the structure as the fire rises
  const pts = [[BURNS_BONES.FOOT_L, 0, -0.2, 0], [BURNS_BONES.FOOT_R, 0, -0.2, 0], [BURNS_BONES.SHIN_L, 0, -1.2, 0], [BURNS_BONES.SHIN_R, 0, -1.2, 0], [BURNS_BONES.THIGH_L, 0, -1.4, 0], [BURNS_BONES.THIGH_R, 0, -1.4, 0], [BURNS_BONES.HIPS, 0, 0.2, 0], [BURNS_BONES.CHEST, 0, 1.5, 0], [BURNS_BONES.CHEST, 0, 3.2, 0], [BURNS_BONES.UARM_L, 0, -1.3, 0], [BURNS_BONES.UARM_R, 0, -1.3, 0], [BURNS_BONES.FARM_L, 0, -1.4, 0], [BURNS_BONES.FARM_R, 0, -1.4, 0], [BURNS_BONES.HEAD, 0, 1.9, 0]];
  const reach = S.fireH * pts.length;
  for (let i = 0; i < pts.length && i < reach; i++) {
    const q = pts[i], w = man.ch.bonePoint(q[0], q[1], q[2], q[3]);
    for (let k = 0; k < 2; k++) g.fx.add(w[0] + (Math.random() - 0.5) * 1.2, w[1] + (Math.random() - 0.5) * 0.8, w[2] + (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 1.2, 3 + Math.random() * 3, (Math.random() - 0.5) * 1.2, 0.55 + Math.random() * 0.3, 2.2, 0.8, [1, 0.5 + Math.random() * 0.3, 0.15], 1, 'flame', 1);
    if (Math.random() < 0.1) g.fx.add(w[0], w[1], w[2], 0, 2.5, 0, 2.2, 1.2, 4.5, [0.22, 0.16, 0.16], 0.35, 'smoke', 4);
  }
  // embers swirling up into a fire tornado
  const n = 6;
  for (let i = 0; i < n; i++) { const a = t * 3 + i / n * TAU, r = 3 + (i % 3) * 1.5, y = W.DECK + Math.random() * 26 * S.fireH; g.fx.add(Math.sin(a) * r, y, Math.cos(a) * r, Math.cos(a) * 6, 6 + Math.random() * 4, -Math.sin(a) * 6, 1.2, 0.18, 0.05, [1, 0.7, 0.3], 1, 'spark', 1 | 4); }
  // the glow
  const h = man.head(), k = S.burnK;
  R.bbs.bb(0, W.DECK + 8, 0, 34 * k, 40 * k, SP.glow, [1, 0.5, 0.15], 0.55 * k, true);
  R.bbs.bb(h[0], h[1], h[2], 14 * k, 14 * k, SP.glow, [1, 0.7, 0.3], 0.6 * k, true);
  R.flat.flat(0, 0.08, 0, 70 * k, 70 * k, 0, SP.glow, [1, 0.45, 0.12], 0.45 * k, true);
  // (the fire's point lights are queued in BURNS_W10.env, ahead of the fire spinners' own lights)
};
// after the Burn (also on revisits): the Man is an ember pile, the circle glows, Chinka hangs out
BURNS_W10.afterBurn = function (g, inCine) {
  const W = BURNS_W10, S = W.state, man = S.man;
  S.after = true; S.burning = inCine ? S.burning : false; S.fighting = false; S.phase = 3; S.beamsOn = false;
  man.active = false; man.hidden = true; man.showChinka = false;
  S.saucerTarget = 0; S.saucer.y = 0; S.saucer.noCollide = false;
  for (const cc of S.cars) W.wakeCar(g, cc, true);
  for (const L of S.lamps) W.lightLamp(g, L, true);
  if (!inCine) {
    S.burnK = 0.25;
    const c = g.actor('chinka') || g.spawnActor({ id: 'chinka', type: 'chinka', name: 'CHINKA', x: W.VIEW.x + 1.5, z: W.VIEW.z - 2, yaw: Math.PI, behavior: 'idle', always: true, chatter: false });
    c.def.noTalk = false; c.def.lines = ['Best. Burn. Ever.', 'You know what? I\'d do it all again. Maybe skip the dust storm.', 'Same time next year, babe.'];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; g.addTempFire(Math.sin(a) * 4, W.DECK, Math.cos(a) * 4, 1.2, 1e6); }
  }
};
