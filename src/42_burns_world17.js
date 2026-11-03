/* ============================================================
   BRADY GOES TO BURNING MAN — World 17: ROOT SOCIETY, Brady's home (Tuesday)
   Brady wakes on the open playa (Monday's mushroom ride is a blur), follows the
   bass to Root Society, and its leader JEFR adopts him: three chores, then a tipi
   of his own in the 27-tipi village. He meets the neighbours, and at dusk the
   Man's fan club comes looking for "a guy with a bun". The Man is hunting him:
   he needs a disguise (the Costume Cult, next world).
   After that it's HOME: free roam all week, a job board of side quests, a bedroll
   that moves the clock (morning, golden hour, night, sunrise), friends who help.
   Main missions:
     arrive      Follow the Bass            reach the camp, meet Jefr
     shade       Shade Patrol      (token)  tie down four loose shade corners up on the frame
     kitchen     Kitchen Duty      (token)  the burrito line in the common dome, against the clock
     cable       Cable Run         (token)  run the mains cable over five ramps, plug in the 90 ft dome
     tipi        A Tipi of Your Own (token) Jefr gives Brady his tipi; decorate it; siesta
     neighbors   Meet the Neighbours        Nebula, Granny, Sparky, Biscuit
     lookouts    The Man's Men     (token)  fight off the effigy's fan club with the friends; then finishWorld
   Side quests: 42_burns_w17_d_side.js. Kit + overlay + clock: 42_burns_w17_a_kit.js.
   Root Society itself (domes, coliseum, stage car, tipis, common dome) comes from BurnsCamps.
   ============================================================ */

/* ---------------- JEFR: the canonical camp dad (replaces World 11's placeholder) ---------------- */
if (typeof BurnsRig !== 'undefined' && BurnsRig.defineType) {
  BurnsRig.defineType('jefr', { anim: 'idle', lines: ['Welcome home, little brother!', 'Hydrate, then dance, then hydrate.', 'Every root needs soil.', 'The domes are loud. The tipis are quiet. Balance.'],
    spec(s) {
      s.face = 'partydad'; s.skin = '#c8906a'; s.skinSh = '#a06c48'; s.body = { h: 1.08, w: 1.08 };
      s.hair = { style: 'long', col: '#6e5a48', hi: '#a8988a' }; s.beard = { col: '#8a7a6c', len: 0.1 };
      s.hat = { kind: 'cowboy', col: '#8a6a44' }; s.glasses = 'round'; s.lensCol = '#ffb347'; s.goggles = false;
      s.top = { kind: 'button', col: '#5a6a3a', open: true, under: '#e8dcc0' }; s.vest = 'patches'; s.vestCol = '#7a5a34';
      s.bottom = { kind: 'cargo', col: '#5a4a34', cargo: true }; s.shoes = { kind: 'workboots', col: '#6a4a2a', sole: '#3a2a1a', laces: true };
      s.acc = ['beads', 'kandi', 'utilityBelt', 'w17Keys', 'headset']; s.prop = 'walkie';
    } });
}

/* ---------------- the district layout (world metres; Root Society sits at the origin, front = +Z) ---------------- */
BW17.LAYOUT = {
  espZ: 86, radX: 104, aZ: -126,
  studio: [-150, 52, 0], kBacon: [-128, 72, 0], kCheese: [-176, 72, 0], kPancake: [130, 72, 0],
  trade: [-118, 26, Math.PI / 2], radio: [-130, -34, Math.PI / 2], tea: [-182, 4, Math.PI / 2], content: [-204, -52, Math.PI / 2],
  rink: [168, 4, 0], ice: [124, -66, -Math.PI / 2], bike: [152, -112, 0], duck: [104, -30, Math.PI], deepEnd: [196, 56, 0],
  heart: [-46, 294, 0], cathedral: [124, 198, Math.PI],
  workShade: [-38, -17, 0], generator: [40, -19, 0], amp: [-21, 8, Math.PI / 2],
  ramps: [[31, -8], [24, 2.5], [13, 9], [-2, 11.5], [-13.5, 9]],
  darkwads: [[-44, -127, 0], [58, -125, Math.PI], [-150, -96, 0.5], [176, -150, -0.8]],
  baggies: [['weed', -90, 60], ['molly', 92, -60], ['powder', -160, 10], ['lsd', 160, -96], ['weed', 40, 120], ['shrooms', -60, 180], ['khole', 200, -20], ['molly', -210, -100]],
  friends: { nebula: 10, pixel: 2, granny: 4, sparky: 7, biscuit: 8 }
};

/* the Root Society village: tipi i (BurnsCamps puts 11 on the inner ring, r 15, round the common dome at (0, -54)) */
BW17.tipiAt = function (rs, i) {
  const a = 0.5 + i / 11 * (TAU - 1.0), V = rs ? rs.toWorld(0, 0, -54) : [0, 0, -54];
  const x = V[0] + Math.sin(a) * 15, z = V[2] + Math.cos(a) * 15, yaw = Math.atan2(V[0] - x, V[2] - z);
  const r = 2.4 + (i % 3) * 0.2;
  return { x, z, yaw, door: [x + Math.sin(yaw) * (r + 1.3), z + Math.cos(yaw) * (r + 1.3)] };
};

BurnsWorlds.register({
  id: 17, name: 'Root Society', sub: 'Home sweet tipi',
  sky: 'bw17day', sky2: 'bw17night', tod: 0,
  music: 'burns_w17',
  home: true, boardTitle: 'ROOT SOCIETY JOB BOARD', dayCard: false,
  story: 'Tuesday. A camp of tipis, a man named Jefr, and a place to call home.',
  bounds: [-250, -212, 250, 330],
  spawn: { x: 4, y: 0, z: 128, yaw: Math.PI },
  bike: true,
  ground: { base: '#cba680', crack: 0.27, mottle: 0.38, res: 0.5 },
  dust: 1.0,
  missions: [
    { id: 'arrive', name: 'Follow the Bass', short: 'Follow the bass to Root Society', type: 'custom', start: 'auto', token: false, silent: true, marker: { x: 6, z: 12 },
      desc: 'Tuesday morning. Somewhere a sound system is purring like a giant cat. Follow it, and find whoever is in charge.', hint: 'Through the root gate on Esplanade, then the plaza by the coliseum',
      onUpdate(g, m) { if (!m.data.near && Math.hypot(g.player.x - 0, g.player.z - 40) < 22) { m.data.near = true; m.data.marker = 'jefr'; g.toast('FIND THE BEARDED GUY BY THE COLISEUM'); } } },
    { id: 'shade', name: 'Shade Patrol', short: 'Tie down the loose shade corners', type: 'custom', count: 4, giver: 'jefr', start: 'manual', requires: ['arrive'], progressLabel: 'Corners tied', marker: { x: -38, z: -17 },
      desc: 'Last night\'s dust storm ripped the work shade loose. Climb the crates onto the frame and tie down all four corners. Mind the gusts.', hint: 'The work shade, west of the coliseum',
      onComplete(g) { BW17.clockStep(g, 1); const j = g.actor('jefr'); if (j) j.say('Tight as a drum! The dome kids thank you.', 2.4); } },
    { id: 'kitchen', name: 'Kitchen Duty', short: 'Burrito line!', type: 'custom', giver: 'kev', start: 'manual', requires: ['arrive'], time: 110, failOnFaint: true, marker: { x: 0, z: -54 },
      desc: 'Lunch rush in the common dome. Grab the ingredients in Kev\'s order, roll the burritos, feed the hungry campers. Fast.', hint: 'The common dome in the middle of the tipi village',
      onStart(g, m) { m.data.step = 0; m.data.served = 0; BW17.kitchenTracker(g, m); }, onComplete(g) { BW17.clockStep(g, 1); g.player.hold(null); }, onFail(g) { g.player.hold(null); } },
    { id: 'cable', name: 'Cable Run', short: 'Grab the cable at the generator', type: 'custom', giver: 'pixel', start: 'manual', requires: ['arrive'], time: 70, marker: { x: 40, z: -19 },
      desc: 'Pixel needs a new mains run from the generator to the 90 ft dome. Carry the cable over all five cable ramps, in order, so nobody trips. Then plug it in.', hint: 'The generator, east of the coliseum',
      onStart(g, m) { m.data.got = false; m.data.ramp = 0; m.data.pts = []; }, onComplete(g) { BW17.clockStep(g, 1); BW17.state.cable = null; g.player.hold(null); }, onFail(g) { BW17.state.cable = null; g.player.hold(null); } },
    { id: 'tipi', name: 'A Tipi of Your Own', short: 'Sleep in your tipi (SLEEP on the bedroll)', type: 'custom', giver: 'jefr', start: 'manual', requires: ['shade', 'kitchen', 'cable'], marker: { x: 7, z: -41 },
      desc: 'Chores done. Jefr has a home for you in the tipi village. Make it yours, then take a well-earned siesta.', hint: 'The tipi village, inner ring, front right', lockedDesc: 'Finish Jefr\'s three chores first.' },
    { id: 'neighbors', name: 'Meet the Neighbors', short: 'Meet Nebula, Granny, Sparky and Biscuit', type: 'custom', count: 4, token: false, start: 'auto', requires: ['tipi'], progressLabel: 'Neighbours met', marker: { x: 0, z: -54 },
      desc: 'Golden hour in the tipi village. Say hi to the neighbours: Auntie Nebula, Granny Grip, Sparky and Biscuit.', hint: 'The tipi village (look for the !)',
      onComplete(g) { BW17.after(g, 1.2, g2 => BW17.lookoutsIntro(g2)); } },
    { id: 'lookouts', name: 'The Man\'s Men', short: 'Chase off the Man\'s fan club', type: 'custom', count: 6, start: 'manual', requires: ['neighbors'], progressLabel: 'Fans sent home', tokenDirect: true, marker: { x: 0, z: -54 },
      desc: 'At dusk, the Man\'s fan club sneaks into the village looking for "a guy with a bun". Send them home. Your friends have your back.', hint: 'The tipi village at dusk',
      onEvent(g, m, name, a) { if (name === 'defeat' && a && a.def && a.def.tag === 'w17lookout') g.missions.progress('lookouts'); },
      onComplete(g) { BW17.after(g, 1.6, g2 => BW17.finale(g2)); } }
  ].concat(BW17.SIDE),
  // the day of the week follows the story (Tuesday the first time; later visits say Friday, Saturday...)
  build(api, g) { BW17.build(api, g); },
  onStart(g) { BW17.start(g); },
  update(g, dt) { BW17.update(g, dt); },
  onRespawn(g) { BW17.skatesOff(g); },
  drawSprites(g, R) { BW17.drawSprites(g, R); }
});

/* ---------------- build ---------------- */
BW17.build = function (api, g) {
  const LY = BW17.LAYOUT, R = api.rng;
  const sv = BurnsSave.get();
  const S = BW17.state = { g, timers: [], clock: 9, clockTo: null, clockRate: 0, nightK: 0, mg: null, choice: null, card: null, meter: null,
    music: null, musicLock: false, flaps: [], decor: null, rs: null, stink: 0, skates: false, gust: 0, gustT: 4, cable: null, foam: [] };
  const fl = BurnsSave.flag(17, 'clock'); S.clock = typeof fl === 'number' ? fl : 9;
  if (!BurnsSave.flag(17, 'intro')) S.clock = 8.6;
  BW17.applySky(g);
  /* ---------- ground: streets, plaza wear, tracks ---------- */
  api.paint((c, P, sc) => {
    for (let i = 0; i < 200; i++) { const x = R.range(-250, 250), z = R.range(-212, 330), [px, pz] = P(x, z), r = R.range(3, 12) * sc, dark = R() < 0.5; const gr = c.createRadialGradient(px, pz, 0, px, pz, r); gr.addColorStop(0, dark ? 'rgba(120,88,66,0.22)' : 'rgba(240,214,182,0.24)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    c.strokeStyle = 'rgba(110,80,62,0.18)'; c.lineWidth = 0.3 * sc;
    for (let i = 0; i < 36; i++) { const [ax, az] = P(R.range(-250, 250), R.range(90, 330)), ang = R() * TAU, len = R.range(30, 140) * sc; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.5) * len * 0.5, az + Math.sin(ang + 0.5) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
    // the open playa past Esplanade is paler and smoother
    const [x0, z0] = P(-300, 96), [x1, z1] = P(300, 340); const gp = c.createLinearGradient(0, z0, 0, z1); gp.addColorStop(0, 'rgba(236,212,180,0.22)'); gp.addColorStop(1, 'rgba(244,224,196,0.3)'); c.fillStyle = gp; c.fillRect(x0, z0, x1 - x0, z1 - z0);
  });
  api.road([[-262, LY.espZ], [262, LY.espZ]], 16, { tracks: [-3, 3], col: 'rgba(150,114,88,0.5)' });
  for (const sx of [-1, 1]) api.road([[sx * LY.radX, LY.espZ], [sx * LY.radX, -214]], 10, { tracks: [-1.5, 1.5] });
  for (const sx of [-1, 1]) api.road([[sx * 214, LY.espZ], [sx * 214, -214]], 9, {});
  api.road([[-262, LY.aZ], [262, LY.aZ]], 10, { tracks: [-1.5, 1.5] });
  api.road([[0, LY.espZ], [0, 58]], 8, { col: 'rgba(140,104,80,0.45)' });
  api.road([[0, LY.espZ], [-10, 160], [-38, 270]], 5, { col: 'rgba(160,122,96,0.3)' });
  /* ---------- ROOT SOCIETY (domes, coliseum + stage car, the 27-tipi village, common dome) ---------- */
  if (typeof BurnsCamps !== 'undefined') {
    S.rs = BurnsCamps.place(api, g, 'rootSociety', 0, 0, { rotY: 0, crowd: 0.5, djPrompt: true, marker: true,
      onArrive(g2) { if (g2.missions.state('arrive') === 'active') g2.banner('ROOT SOCIETY', 'Three domes, a coliseum and a tipi village', { col: '#e8c890' }); },
      onEnter(g2, camp, area) { if (area && area.id === 'bradyTipi' && BurnsSave.flag(17, 'tipiOwned') && !S.homeToast) { S.homeToast = true; g2.toast('HOME SWEET TIPI'); } } });
  } else BW17.fallbackCamp(api, g);
  const rs = S.rs;
  const spot = n => rs && rs.spots[n] ? rs.spots[n] : null;
  const L = BW17.L = Object.assign({}, LY);
  L.gate = spot('gate') ? [spot('gate').x, spot('gate').z] : [0, 54];
  L.commonDome = [0, -54];
  const bt = spot('bradyTipiInside'); L.tipi = bt ? { x: bt.x, z: bt.z, yaw: bt.yaw, r: 2.8 } : { x: 7.19, z: -40.84, yaw: -2.64, r: 2.8 };
  const bd = spot('bradyTipi'); L.tipiDoor = bd ? [bd.x, bd.z] : [L.tipi.x + Math.sin(L.tipi.yaw) * 3.7, L.tipi.z + Math.cos(L.tipi.yaw) * 3.7];
  { const c = Math.cos(L.tipi.yaw), s = Math.sin(L.tipi.yaw); L.bed = [L.tipi.x - 0.6 * c - 0.7 * s, L.tipi.z + 0.6 * s - 0.7 * c]; }
  L.moss = [-11, 9.5];
  /* ---------- Root Society additions: work shade, generator, amp rack, cable ramps, kitchen stations ---------- */
  L.shade = BW17.B.workShade(api, LY.workShade[0], LY.workShade[1], LY.workShade[2]);
  BW17.sign(api, 'WORK SHADE\n(TIE IT DOWN)', L.shade.sign[0], L.shade.sign[1], 0.3, { h: 0.8, y: 1.3, bg: '#f4e8c8', fg: '#3a2414', border: '#8a6a44', size: 32 });
  if (!BurnsSave.hasToken(17, 'shade')) for (const c of L.shade.corners) S.flaps.push({ c, mv: BW17.B.flap(api, c, Math.atan2(-c.sx, -c.sz)), tied: false, ph: R() * 6 });
  BW17.B.generator(api, LY.generator[0], LY.generator[1], LY.generator[2]);
  BW17.B.ampRack(api, LY.amp[0], LY.amp[1], LY.amp[2]);
  L.reel = [LY.generator[0] - 2.4, LY.generator[1] + 2.2];
  L.ampFront = [LY.amp[0] + 1.3, LY.amp[1]];
  api.paint((c, P, sc) => { c.fillStyle = 'rgba(255,190,70,0.5)'; for (const q of LY.ramps) { const [px, pz] = P(q[0], q[1]); c.save(); c.translate(px, pz); c.fillRect(-1.6 * sc, -0.45 * sc, 3.2 * sc, 0.9 * sc); c.fillStyle = 'rgba(30,30,30,0.5)'; for (let k = -3; k <= 3; k++) c.fillRect(k * 0.42 * sc - 0.08 * sc, -0.45 * sc, 0.16 * sc, 0.9 * sc); c.restore(); c.fillStyle = 'rgba(255,190,70,0.5)'; } });
  BW17.kitchenBuild(api, g);
  /* ---------- the district ---------- */
  L.studioYaw = LY.studio[2]; L.studio = BW17.B.studio(api, LY.studio[0], LY.studio[1], LY.studio[2]);
  L.radioYaw = LY.radio[2]; L.radio = BW17.B.radio(api, LY.radio[0], LY.radio[1], LY.radio[2]);
  L.teaYaw = LY.tea[2]; L.tea = BW17.B.teaLounge(api, LY.tea[0], LY.tea[1], LY.tea[2]);
  L.contentYaw = LY.content[2]; L.content = BW17.B.contentHouse(api, LY.content[0], LY.content[1], LY.content[2]);
  L.kBacon = Object.assign(BW17.B.kiosk(api, LY.kBacon[0], LY.kBacon[1], LY.kBacon[2], { name: 'SIZZLE SANCTUARY · BACON', food: 'bacon', col: '#c84a3a' }), { yaw: LY.kBacon[2] + Math.PI });
  L.kCheese = Object.assign(BW17.B.kiosk(api, LY.kCheese[0], LY.kCheese[1], LY.kCheese[2], { name: 'SAY CHEESE! · GRILLED', food: 'cheese', col: '#e8a82a', fg: '#6a3a10' }), { yaw: LY.kCheese[2] + Math.PI });
  L.kPancake = Object.assign(BW17.B.kiosk(api, LY.kPancake[0], LY.kPancake[1], LY.kPancake[2], { name: 'FLAPJACK FLASHBACK', food: 'pancake', col: '#7a4aaa', fg: '#3a1a5a' }), { yaw: LY.kPancake[2] + Math.PI });
  L.rinkYaw = LY.rink[2]; L.rink = BW17.B.rink(api, LY.rink[0], LY.rink[1], LY.rink[2]);
  L.iceYaw = LY.ice[2]; L.ice = BW17.B.iceDepot(api, LY.ice[0], LY.ice[1], LY.ice[2]);
  L.bikeYaw = LY.bike[2]; L.bike = BW17.B.bikeShop(api, LY.bike[0], LY.bike[1], LY.bike[2]);
  L.heartCar = BW17.B.heartCar(api, LY.heart[0], LY.heart[1], LY.heart[2]); L.heartFloor = L.heartCar.floor;
  BW17.B.heartDJ(api, L.heartCar.booth[0], L.heartCar.boothY, L.heartCar.booth[1], LY.heart[2] + Math.PI);
  // the Disco Duck: parked (broken) in the 6:00 street; drivable once it's fixed
  S.duckCar = api.artCar({ x: LY.duck[0], z: LY.duck[1], yaw: LY.duck[2], build: m => BW17.B.duckModel(m), maxSpeed: 7.5, label: 'DRIVE THE DUCK', horn: 'artcarHorn',
    hornLines: ['QUACK QUACK!', 'IT\'S THE DISCO DUCK!', 'Duck! Duck! DUCK!'], driveHint: 'DRIVING THE DISCO DUCK · JUMP = QUACK', when: () => !!BurnsSave.flag(17, 'duckFixed') });
  L.duck = [LY.duck[0], LY.duck[1]];
  // the Deep End: a pool party that's a foam party today
  if (typeof BurnsCamps !== 'undefined') {
    S.deepEnd = BurnsCamps.place(api, g, 'deepEnd', LY.deepEnd[0], LY.deepEnd[1], { rotY: LY.deepEnd[2], crowd: 0.6, lod: 'auto', marker: false });
    const f = S.deepEnd.spots.floor || { x: LY.deepEnd[0], z: LY.deepEnd[1] - 2 };
    L.foam = [f.x, f.z, 6.5];
  } else L.foam = [LY.deepEnd[0], LY.deepEnd[1], 6.5];
  // foam cannons on stands round the pool
  for (let i = 0; i < 3; i++) { const a = (i - 1) * 1.1 + Math.PI, cx = L.foam[0] + Math.sin(a) * 8.5, cz = L.foam[1] + Math.cos(a) * 8.5; S.foam.push([cx, 2.6, cz, Math.atan2(L.foam[0] - cx, L.foam[1] - cz)]);
    api.mesh(cx, cz, m => { m.color('#3a3a44').shine(2); m.limb(0, 0, 0, 0, 2.4, 0, 0.06, 0.05, { seg: 6 }); m.push(); m.tf(0, 2.55, 0, 0, Math.PI / 2 - 0.35); m.color('#38c8ff').shine(2); m.roundCyl(0, -0.4, 0, 0.22, 0.8, 0.05, { seg: 12 }); m.pop(); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 2.4, camPass: true }] }; }, { yaw: Math.atan2(L.foam[0] - cx, L.foam[1] - cz) }); }
  BW17.sign(api, 'FOAM PARTY TODAY\nYOU WILL GET WET', L.foam[0] - 10, L.foam[1] + 12, 0.4, { h: 0.9, bg: '#e8f8ff', fg: '#2a6aa8', border: '#38c8ff', size: 32 });
  // the Stick Cathedral on the open playa (burns Friday night) — with a Photo of Chinka in its bird's nest
  L.cathedral = [LY.cathedral[0], LY.cathedral[1]]; L.perimeter = [LY.cathedral[0], LY.cathedral[1] - 31];
  if (typeof BurnsBigArt !== 'undefined') {
    S.cathedral = BurnsBigArt.place(api, g, 'stickCathedral', LY.cathedral[0], LY.cathedral[1], { rotY: LY.cathedral[2] });
  }
  for (let i = 0; i < 16; i++) { const a = Math.PI + (i - 7.5) * 0.13, x = L.cathedral[0] + Math.sin(a) * 33, z = L.cathedral[1] + Math.cos(a) * 33; api.mesh(x, z, m => { m.color('#c8c8d0').shine(2); m.limb(0, 0, 0, 0, 0.9, 0, 0.04, 0.04, { seg: 5 }); m.color('#ffb347', 0.9); m.ball(0, 1.0, 0, 0.09, { seg: 8, rings: 5 }); m.emissive(0); m.shine(0); return { cols: [], lights: [{ x: 0, y: 1.0, z: 0, s: 0.6, c: '#ffb347' }] }; }); }
  BW17.sign(api, 'BURN PERIMETER\nFRIDAY NIGHT', L.perimeter[0] + 5, L.perimeter[1] - 2, Math.PI + 0.2, { h: 0.8, y: 1.2, bg: '#2a1408', fg: '#ffb347', border: '#ff7a2a', size: 32 });
  /* ---------- streets: signs, Esplanade lanterns, the city behind, the trash fence ---------- */
  const st = (t, x, z, yaw) => BW17.sign(api, t, x, z, yaw, { h: 0.7, y: 2.3, bg: '#1a3a2a', fg: '#f4f0d8', border: '#f4f0d8', size: 34 });
  st('ESPLANADE\n& 6:30', -LY.radX - 7, LY.espZ - 7, Math.PI / 4); st('ESPLANADE\n& 6:00', LY.radX + 7, LY.espZ - 7, -Math.PI / 4);
  st('A ST\n& 6:30', -LY.radX - 7, LY.aZ + 7, Math.PI * 0.75); st('A ST\n& 6:00', LY.radX + 7, LY.aZ + 7, -Math.PI * 0.75);
  for (let x = -230; x <= 230; x += 32) { if (Math.abs(x) < 20) continue; const z = LY.espZ - 10; api.mesh(x, z, m => { m.color('#4a3a2a').shine(1); m.limb(0, 0, 0, 0, 3.2, 0, 0.07, 0.06, { seg: 6 }); m.limb(0, 3.1, 0, 0.5, 3.25, 0, 0.03, 0.03, { seg: 4 }); m.shine(0); BW17.lantern(m, 0.55, 2.85, 0, '#ffcf8a', 1.1); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 3.2, camPass: true }], lights: [{ x: 0.55, y: 2.85, z: 0, s: 1.0, c: '#ffcf8a', pool: 7, i: 0.4 }] }; }); }
  for (let i = 1; i < 9; i++) { const t = i / 9, x = lerp(-4, -36, t * t) + 3.2, z = lerp(96, 268, t); api.mesh(x, z, m => { m.color('#5a4030').shine(1); m.limb(0, 0, 0, 0, 3.6, 0, 0.08, 0.06, { seg: 6 }); m.limb(0, 3.5, 0, -0.55, 3.65, 0, 0.03, 0.03, { seg: 4 }); m.shine(0); BW17.lantern(m, -0.6, 3.25, 0, i % 2 ? '#ffcf8a' : '#ff9ad0', 1.15); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 3.6, camPass: true }], lights: [{ x: -0.6, y: 3.25, z: 0, s: 1.1, c: i % 2 ? '#ffcf8a' : '#ff9ad0', pool: 6, i: 0.4 }] }; }); }
  for (let i = 0; i < 26; i++) api.prop('fence', { x: -250 + i * 20 + 10, z: -206, len: 20 });
  for (let i = 0; i < 24; i++) { const x = R.range(-240, 240), z = R.range(-200, -138); if (Math.abs(x) < 30 && z > -150) continue; api.prop('tent', { x, z, yaw: R() * TAU, col: R.pick(['#3a8a5a', '#c84a3a', '#2a6ac8', '#e8a82a', '#7a4aaa']) }); }
  for (let i = 0; i < 6; i++) api.prop('portapotty', { x: -24 + i * 1.35, z: -140, col: i % 2 ? '#2a6ac8' : '#3a8a3a' });
  // a few RVs and shade camps fill the blocks
  for (const [x, z, k, yaw] of [[-140, -150, 'rv', 0.2], [140, -160, 'van', -0.3], [-226, 40, 'bus', Math.PI / 2], [226, -40, 'rv', -Math.PI / 2], [-230, -150, 'camper', 0.6], [200, -96, 'boxtruck', 0], [-120, -96, 'rv', Math.PI / 2], [120, 30, 'car', 0.3]]) api.prop(k, { x, z, yaw, seed: Math.round(x + z) & 63 });
  for (const [x, z, col] of [[-160, -130, '#c8b8e8'], [200, 10, '#a8d8c8'], [-224, -10, '#e8c8a8'], [176, -136, '#d8c8a8']]) api.prop('shade', { x, z, w: 6, d: 5, col });
  // far skylines: neighbouring sound camps on the horizon
  if (typeof BurnsCamps !== 'undefined') { try { BurnsCamps.silhouette(api, g, 'centerCamp', -420, 260, { rotY: 0.6 }); BurnsCamps.silhouette(api, g, 'opulentTemple', 420, 300, { rotY: -0.5 }); BurnsCamps.silhouette(api, g, 'campQuestionMark', -380, -60, { rotY: 1.2 }); } catch (e) { BW17.err(e); } }
  BW17.fillerCamps(api, g);
  /* ---------- the people of Root Society ---------- */
  BW17.buildPeople(api, g);
  BW17.buildSide(api, g);
  // the friends' tipis get hand-painted signs
  for (const [id, txt, bg, fg] of [['nebula', 'AUNTIE NEBULA\nTEA & GOSSIP', '#3a2a5a', '#e8d8ff'], ['pixel', 'PIXEL LAB\nDO NOT TOUCH', '#1a2a2a', '#38f2ff'], ['granny', 'GRANNY GRIP\nROLLER LEGEND', '#5a1a2a', '#ffd84a'], ['sparky', 'SPARKY\nSAFETY THIRD', '#2a1a10', '#ffb347'], ['biscuit', 'BISCUIT\'S DEN\n*HAPPY CHIRP*', '#2a3a2a', '#ffd0e4']]) {
    const t = BW17.tipiAt(rs, LY.friends[id]), sx = t.door[0] + Math.cos(t.yaw) * 2.2, sz = t.door[1] - Math.sin(t.yaw) * 2.2;
    BW17.sign(api, txt, sx, sz, t.yaw, { h: 0.62, y: 0.9, bg, fg, border: fg, size: 30 });
  }
  { const T = L.tipi, c = Math.cos(T.yaw), sn = Math.sin(T.yaw), at = (lx, lz) => [T.x + lx * c + lz * sn, T.z - lx * sn + lz * c];
    let q = at(-2.0, T.r + 1.8); api.prop('chair', { x: q[0], z: q[1], yaw: T.yaw + 0.5, col: '#ff4fd8' });
    q = at(-2.9, T.r + 1.3); api.prop('cooler', { x: q[0], z: q[1], yaw: T.yaw, col: '#38c8ff' });
    q = at(0, T.r + 0.9); api.mesh(q[0], q[1], m => { m.color('#c85a3a').shine(0); m.roundBox(0, 0.015, 0, 1.4, 0.03, 0.8, 0.012, { uv: BURNS_ATLAS.pattern('plaid') }); return { cols: [] }; }, { yaw: T.yaw }); }
  // Brady's tipi: decorations (movers) + the bedroll prompt
  S.decor = BW17.B.decor(api, L.tipi);
  api.interact({ x: L.bed[0], z: L.bed[1], r: 1.7, label: 'SLEEP', when: g2 => BurnsSave.flag(17, 'tipiOwned') || g2.missions.state('tipi') === 'active', fn: g2 => BW17.sleepMenu(g2) });
  api.interact({ x: L.tipi.x + Math.sin(L.tipi.yaw) * 1.0, z: L.tipi.z + Math.cos(L.tipi.yaw) * 1.0, r: 1.2, label: 'DECORATE', when: g2 => !!BurnsSave.flag(17, 'tipiOwned'), fn: g2 => BW17.decorMenu(g2) });
  // festoon lights from the common dome out to every inner-ring tipi (the village glows at night)
  if (rs) api.mesh(0, -54, m => {
    const lights = [], cols = ['#ffcf8a', '#ff9ad0', '#9aff7a', '#ffcf8a', '#9adcff'];
    for (let i = 0; i < 11; i++) { const a = 0.5 + i / 11 * (TAU - 1.0); BW17.bulbs(m, lights, [Math.sin(a) * 1.4, 4.25, Math.cos(a) * 1.4], [Math.sin(a) * 13.6, 3.3, Math.cos(a) * 13.6], 11, 0.55, cols, 3); }
    return { cols: [], lights };
  }, { noAO: true });
  // and most tipis glow warm from inside after dark
  S.doorMv = BW17.B.tipiGlow(api, g, rs);
  // the job board by the village path
  if (api.questBoard) api.questBoard({ x: 17.5, z: -24, yaw: -0.5, title: 'ROOT SOCIETY JOB BOARD' });
  /* ---------- collectibles ---------- */
  const gal = spot('gallery'); if (gal) api.pickup('photo', gal.x, gal.y + 1.0, gal.z, { id: 'p1' }); else api.pickup('photo', 0, 6.4, -16, { id: 'p1' });
  api.pickup('photo', L.heartCar.top[0], L.heartCar.topY + 0.95, L.heartCar.top[1], { id: 'p2' });
  // the third photo is up on DUST FM's roof (climb the desk, then the container)
  { const q = L.radio.roof; api.pickup('photo', q[0], 3.5, q[1], { id: 'p3' }); }
  api.glowLine(-200, LY.espZ + 4, -20, LY.espZ + 4, 15); api.glowLine(20, LY.espZ + 4, 200, LY.espZ + 4, 15);
  api.glowLine(0, LY.espZ - 2, 0, 62, 6);
  api.glowRing(0, -54, 9.5, 14);
  for (const sx of [-1, 1]) api.glowLine(sx * LY.radX, LY.espZ - 8, sx * LY.radX, LY.aZ + 10, 14);
  api.glowLine(-200, LY.aZ, 200, LY.aZ, 16);
  api.glowLine(-6, 104, -40, 262, 14);
  api.glowLine(110, 110, 122, 150, 7);
  api.glowRing(L.rink.center[0], L.rink.center[1], 12.5, 12);
  api.glowArc(L.shade.corners[1].x + 1, 1.2, L.shade.corners[1].z + 2.5, L.shade.corners[1].x + 4.5, 4.4, L.shade.corners[1].z + 2.5, 1.0, 6);
  for (const [x, z] of [[-40, 74], [60, 74], [-120, 0], [140, -20], [-60, 160], [30, 200], [0, -120]]) api.pickup('water', x, 0.9, z);
  /* ---------- checkpoints + map markers ---------- */
  api.checkpoint('cp_gate', 12, 64, { yaw: Math.PI, name: 'Root Society Gate' });
  api.checkpoint('cp_tipi', L.tipiDoor[0] + Math.cos(L.tipi.yaw) * 2.2, L.tipiDoor[1] - Math.sin(L.tipi.yaw) * 2.2, { yaw: L.tipi.yaw, name: 'Brady\'s Tipi' });
  api.checkpoint('cp_west', -112, LY.espZ - 8, { yaw: Math.PI, name: 'Esplanade & 6:30' });
  api.checkpoint('cp_east', 112, LY.espZ - 8, { yaw: Math.PI, name: 'Esplanade & 6:00' });
  api.checkpoint('cp_playa', 8, 176, { yaw: 0, name: 'The Open Playa' });
  const mk = (id, x, z, label, col) => api.marker(id, x, z, label, { col });
  mk('home', L.tipi.x, L.tipi.z, 'Your tipi', '#7aff5a'); mk('studio', LY.studio[0], LY.studio[1], 'Portrait studio', '#ff7ab8'); mk('radio', LY.radio[0], LY.radio[1], 'DUST FM', '#ff4a4a');
  mk('tea', LY.tea[0], LY.tea[1], 'Tea lounge', '#9adc8a'); mk('content', LY.content[0], LY.content[1], '#ContentHouse', '#ff9ad0'); mk('rink', LY.rink[0], LY.rink[1], 'The Glide', '#ff4fd8');
  mk('ice', LY.ice[0], LY.ice[1], 'Ice', '#9adcff'); mk('bike', LY.bike[0], LY.bike[1], 'Bike repair', '#ffd21a'); mk('duck', LY.duck[0], LY.duck[1], 'Disco Duck', '#ffd21a');
  mk('deep', LY.deepEnd[0], LY.deepEnd[1], 'Deep End', '#38c8ff'); mk('heart', LY.heart[0], LY.heart[1], 'The Heart', '#ff3b7a'); mk('cath', LY.cathedral[0], LY.cathedral[1], 'Stick Cathedral', '#ffb347');
  mk('trade', LY.trade[0], LY.trade[1], 'Trading post', '#ffe24a');
};

/* little theme camps that fill the blocks (props only, a host each): the city feels lived in */
BW17.fillerCamps = function (api, g) {
  const LY = BW17.LAYOUT, R = mulberry32(1717);
  const camps = [
    [-150, 96, 0, 'CAMP NAP TIME\nQUIET (ISH) HOURS'], [-196, 96, 0.1, 'THE LOST SOCK\nEXCHANGE'], [150, 98, -0.1, 'DUST BUNNY\nSANCTUARY'],
    [196, 96, 0.05, 'HYDRATION\nSTATION'], [-130, -100, Math.PI / 2, 'CAMP\nOVERTHINK IT'], [130, -150, -Math.PI / 2, 'THE BLINKY\nBICYCLE CLUB'],
    [-190, -140, 0.4, 'SPOON\nTHEORY'], [196, -50, -Math.PI / 2, 'KAZOO\nKAMP']
  ];
  camps.forEach(([x, z, yaw, name], i) => {
    const c = Math.cos(yaw), sn = Math.sin(yaw), W = (lx, lz) => [x + lx * c + lz * sn, z - lx * sn + lz * c];
    const col = ['#d8c8a8', '#c8b8e8', '#e8c8a8', '#a8d8c8', '#e8d8f0', '#f0d8b0'][i % 6];
    api.prop('shade', { x, z, yaw, w: 6, d: 5, col });
    let q = W(-1.2, -1.2); api.prop('couch', { x: q[0], z: q[1], yaw: yaw, col: R.pick(['#8a2a5a', '#2a5a8a', '#6a4a2a', '#5a2a8a']) });
    for (let k = 0; k < 3; k++) { q = W(1.2 + k * 0.7, 0.8 + (k % 2) * 0.6); api.prop('chair', { x: q[0], z: q[1], yaw: yaw + R.range(-0.6, 0.6) + Math.PI, col: R.pick(BURNS_NEON) }); }
    q = W(2.6, -1.6); api.prop('cooler', { x: q[0], z: q[1], yaw: yaw + 0.3, col: R.pick(['#2a8ac8', '#c83a2a', '#e8e8e8']) });
    q = W(-0.5, -6.5); api.prop(R.pick(['rv', 'van', 'camper', 'bus']), { x: q[0], z: q[1], yaw: yaw + Math.PI / 2, seed: 100 + i });
    q = W(-3.6, 3.4); BW17.sign(api, name, q[0], q[1], yaw + 0.3, { h: 0.85, y: 1.4, bg: R.pick(['#f4e8c8', '#e8f4ff', '#fff0f6']), fg: '#3a2414', border: '#3a2414', size: 30 });
    q = W(0, 1.6); api.pickup('glowstick', q[0], 0.9, q[1]);
    q = W(0.4, 0.2); api.npc({ type: R.pick(['burner', 'tutu', 'furcoat', 'crusty', 'ledsuit']), seed: (i * 7) % 24, x: q[0], z: q[1], yaw: yaw + R.range(-0.5, 0.5), behavior: R.pick(['sit', 'dance', 'idle']), style: i % 6, ambient: true,
      chat: [['Shhh. Napping is a radical act.', 'Zzz... welcome... zzz.'], ['Got a lone sock? We have its soulmate.', 'Every sock deserves a second chance.'], ['Dust bunnies are people too.', 'Hop on by!'], ['Water! Free! Take two!', 'Pee clear, friend.'], ['Should I go to the dome? Or think about going to the dome?', 'I\'ve been planning to leave since Monday.'], ['Blink twice if you love bikes.', 'Our lights have lights.'], ['There is no spoon. There are, however, many spoons.', 'Spoon?'], ['TOOT.', 'Kazoo choir at sunset!']][i] });
  });
};

/* if the camps module is missing: a modest stand-in (three domes, a stage, a ring of tipis) */
BW17.fallbackCamp = function (api, g) {
  api.prop('dome', { x: -40, z: 14, r: 13.7, col: '#e8dfcc', lights: true, glow: '#ffb347' });
  api.prop('dome', { x: 40, z: 14, r: 9.1, col: '#e8dfcc', lights: true, glow: '#38f2ff' });
  api.prop('dome', { x: -34, z: 44, r: 7.6, col: '#e8dfcc', lights: true, glow: '#ff7a3a' });
  api.roundBox(0, 0, -6, 24, 1.6, 8, '#a8865c');
  for (let i = 0; i < 27; i++) { const inner = i < 11, a = inner ? 0.5 + i / 11 * (TAU - 1) : 0.32 + (i - 11) / 16 * (TAU - 0.64), r = inner ? 15 : 23; api.lathe(Math.sin(a) * r, 0, -54 + Math.cos(a) * r, [[2.5, 0], [0.2, 5.6], [0, 6.2]], '#ece0c4'); }
  api.prop('dome', { x: 0, z: -54, r: 4.6, col: '#efe6d2', lights: true });
};

/* ---------------- Jefr, the crew and the friends ---------------- */
BW17.buildPeople = function (api, g) {
  const L = BW17.L, S = BW17.state, rs = S.rs, story = !!BurnsSave.flag(17, 'storyDone');
  const tp = i => BW17.tipiAt(rs, i);
  const jefrAt = story ? [L.commonDome[0] + 1.6, L.commonDome[1] + 6.2, 0] : [9.5, 7.5, 0];
  api.npc({ id: 'jefr', name: 'JEFR', type: 'jefr', seed: 1, x: jefrAt[0], z: jefrAt[1], yaw: jefrAt[2], talk: (g2, a) => BW17.talkJefr(g2, a) });
  api.npc({ id: 'kev', name: 'KOMBUCHA KEV', type: 'w17Kev', seed: 1, x: L.commonDome[0] - 2.0, z: L.commonDome[1] + 1.4, yaw: Math.PI / 2, talk: (g2, a) => BW17.talkKev(g2, a) });
  const px = BurnsSave.hasToken(17, 'cable') ? tp(L.friends.pixel).door : [L.reel[0] - 1.2, L.reel[1] + 1.5];
  api.npc({ id: 'pixel', name: 'PIXEL', type: 'w17Pixel', seed: 1, x: px[0], z: px[1], yaw: Math.PI, talk: (g2, a) => BW17.talkPixel(g2, a) });
  for (const [id, name, type] of [['nebula', 'AUNTIE NEBULA', 'w17Nebula'], ['granny', 'GRANNY GRIP', 'w17Granny'], ['sparky', 'SPARKY', 'w17Sparky'], ['biscuit', 'BISCUIT', 'furry']]) {
    const t = tp(L.friends[id]);
    api.npc({ id, name, type, seed: id === 'biscuit' ? 3 : 1, x: t.door[0], z: t.door[1], yaw: t.yaw + Math.PI, talk: (g2, a) => BW17.talkFriend(g2, a, id),
      bw17when: g2 => g2.missions.isDone('tipi') || g2.missions.state('tipi') === 'active' || story });
  }
  api.npc({ id: 'moss', name: 'MOSS (STAGE MANAGER)', type: 'burner', seed: 11, x: L.moss[0], z: L.moss[1], yaw: 0, anim: 'clipboard', prop: 'clipboard', talk: (g2, a) => BW17.talkMoss(g2, a) });
  // hungry campers at the common dome's front door (lunch line)
  const cd = L.commonDome;
  L.diners = [];
  for (let i = 0; i < 3; i++) { const id = 'diner' + i; L.diners.push(id); api.npc({ id, name: ['HUNGRY HAZEL', 'STARVING STEVE', 'PECKISH PAT'][i], type: ['tutu', 'burner', 'furcoat'][i], seed: 60 + i, x: cd[0] - 1.6 + i * 1.6, z: cd[1] + 7.6, yaw: Math.PI, anim: 'idle', talk: (g2, a) => BW17.talkDiner(g2, a, i) }); }
};

/* ---------------- dialogue ---------------- */
BW17.talkJefr = function (g, a) {
  const M = g.missions, S = BW17.state;
  if (M.state('arrive') === 'active') { BW17.meetJefr(g, a); return; }
  const chores = ['shade', 'kitchen', 'cable'];
  if (M.state('shade') === 'available') { g.say(a, ['First chore: the work shade, west of the coliseum. The storm ripped its corners loose.', 'Climb the crates onto the frame and TIE each corner. Gusts up there, so plant your feet.'], () => M.start('shade')); return; }
  if (M.state('shade') === 'active') { g.say(a, [`${M.get('shade').n} of 4 corners. Crates, frame, corners. You got this, little brother.`]); return; }
  const left = chores.filter(c => !M.isDone(c));
  if (left.length && M.state('tipi') !== 'available') { g.say(a, [left.indexOf('kitchen') >= 0 ? 'Kev needs hands in the kitchen dome.' : 'Kitchen\'s covered.', left.indexOf('cable') >= 0 ? 'And Pixel needs a cable run from the generator, east of the coliseum.' : 'Cable\'s in. The 90 footer sounds like thunder.']); return; }
  if (M.state('tipi') === 'available') { BW17.tipiScene(g, a); return; }
  if (M.state('tipi') === 'active') { g.say(a, ['Bedroll\'s inside your tipi. SLEEP on it. Siesta is a sacred tradition.']); return; }
  if (M.state('lookouts') === 'active') { g.say(a, ['Send those fans home! Gently! Mostly gently!']); return; }
  // free roam: a few lines that follow the story
  const r = BW17.reach(), O = BurnsWorlds.order || BURNS_WORLD_ORDER;
  const lines = r >= O.indexOf(10) ? ['You brought her home. I knew you would. The tipi\'s always yours.'] : r >= O.indexOf(7) ? ['Friday already. Sparky\'s been vibrating since Tuesday. The Cathedral burns tonight.'] : r >= O.indexOf(5) ? ['How was the Orgy Dome? Don\'t answer that. Hydrate.'] : r >= O.indexOf(3) ? ['Nice disguise. I can still see the bun, but nice disguise.'] : ['Your tipi\'s right where you left it. The Costume Cult is that way.'];
  g.say(a, lines.concat(['The job board by the village path has work if you want it. Or nap. Napping is also work.']));
};
BW17.meetJefr = function (g, a) {
  const p = g.player, ab = Math.atan2(p.x - a.x, p.z - a.z);
  g.cutscene([
    { orbit: { actor: 'jefr', r0: 7, r1: 4.2, h0: 2.6, h1: 1.8, a0: ab + 1.25, a1: ab + 0.75, dur: 3.2, fov: 0.9 } },
    { say: [a, ['Whoa there, little brother. You look like a man who rode a bike into a mushroom.']] },
    { say: ['brady', ['...Two mushrooms. They were bouncy. Is it Tuesday?']] },
    { say: [a, ['All day long. I\'m Jefr. J-E-F-R. The second E is on a vision quest.', 'This is Root Society. Three domes, a coliseum, a stage that drives itself, twenty-seven tipis and one kitchen dome.']] },
    { say: ['brady', ['I don\'t have a camp. Everybody was full. Or wanted dues. Or wanted to sniff my feet.']] },
    { say: [a, ['Every root needs soil, kid. You\'re with us now.', 'But family pulls its weight. Three chores: the work shade, Kev\'s kitchen, and Pixel\'s cable. Then we\'ll talk about a bed.']] },
    { do: g2 => { g2.missions.complete('arrive'); g2.glow += 10; g2.toast('JEFR GIFTED YOU 10 GLOW STICKS'); BW17.clockStep(g2, 1); g2.banner('WELCOME HOME', 'You\'re a Root now. Chores first.', { col: '#e8c890' }); } }
  ]);
};
BW17.talkKev = function (g, a) {
  const M = g.missions;
  if (M.state('kitchen') === 'available') { g.say(a, ['A new kid! With hands! Perfect. It\'s lunch rush.', 'Burrito line: I call the ingredient, you grab it, in order. Then roll them and feed the people at the door.', 'Clock\'s ticking. The hungry are getting hangry.'], () => M.start('kitchen')); return; }
  if (M.state('kitchen') === 'active') { const st = BW17.KITCHEN[M.get('kitchen').data.step]; g.say(a, [st ? `Next: ${st.name}! ${st.where}!` : 'Feed them! FEED THEM!']); return; }
  const fm = M.get('s_food');
  if (M.state('s_radio') === 'active' && g.pack && g.pack.has('w17gerald')) { g.say(a, ['GERALD! My boy! You\'re so... slimy and perfect.', 'Thank you, Brady. Here: kombucha. Made by Gerald himself.'], () => { g.pack.take('w17gerald'); g.player.hold(null); M.complete('s_radio'); }); return; }
  if (fm && fm.state === 'active') { g.say(a, [`${fm.n} of 3 delivered. Bacon to Sparky, cheese to Pixel, pancakes to Nebula!`]); return; }
  if (BW17.offer(g, a, ['s_foam', 's_food', 's_radio'])) return;
  g.say(a, BurnsRig.types.w17Kev.lines.slice(0, 2));
};
BW17.talkPixel = function (g, a) {
  const M = g.missions;
  if (M.state('cable') === 'available') { g.say(a, ['Hi. Pixel. The mains cable to the 90 foot dome got eaten by a dust devil.', 'Grab the cable at the reel, run it over all five yellow cable ramps in order, then plug it into the amp rack by the dome door.', 'Skip a ramp and somebody trips. Then they sue. Then they hug it out, but still.'], () => M.start('cable')); return; }
  if (M.state('cable') === 'active') { g.say(a, ['Reel, ramps one to five, amp rack. Go.']); return; }
  const dm = M.get('s_duck');
  if (dm && dm.state === 'active' && !dm.data.battery) { g.say(a, ['A battery for the Disco Duck? I have eleven. Don\'t ask why.'], () => { dm.data.battery = true; g.pack.add('w17battery'); BW17.duckPart(g, dm); }); return; }
  const fm = M.get('s_food');
  if (fm && fm.state === 'active' && g.pack && g.pack.has('w17cheese')) { g.say(a, ['Grilled cheese. The only food that runs on pure joy. Thank you.'], () => { g.pack.take('w17cheese'); M.progress('s_food'); }); return; }
  if (M.state('s_darkwads') === 'available' && !BW17.isNight()) { g.say(a, ['Darkwads only come out at night. Nap in your tipi till dark, then come back.']); return; }
  if (M.state('s_darkwads') === 'active') { g.say(a, [`${M.get('s_darkwads').n} of 4 lit. Use the headlamp. Look for the glint off their sunglasses.`]); return; }
  if (BW17.offer(g, a, ['s_darkwads'])) return;
  g.say(a, BurnsRig.types.w17Pixel.lines.slice(0, 2));
};
BW17.talkMoss = function (g, a) {
  const M = g.missions, st = M.state('s_rootdrive');
  if (st === 'active') g.say(a, [g.pack && g.pack.has('w17usb') ? 'You have it! Now catch that car and HOP ON!' : 'The USB\'s on the long table in the common dome!']);
  else if (st === 'done') g.say(a, ['Set saved, crowd happy, nobody yelled at me. Best day.']);
  else if (!BW17.offer(g, a, ['s_rootdrive'])) g.say(a, ['Stage left is your left. Or mine. Depends on the stage.', 'The coliseum car docks right here, flush with the stage. Every lap. Like a giant LEGO.']);
};
// the four neighbours: meeting them, deliveries, then their side quests
BW17.MEET = {
  nebula: { lines: ['Oh, the new tipi! Come here, sweetie. Twenty-fifth Burn. I know everything and everyone.', 'Rule one: drink water. Rule two: drink tea. Rule three: never trust a man in a fur coat at noon.'], gift: { power: 'water' }, gl: 'Auntie Nebula topped up your water' },
  granny: { lines: ['Well, look at you! Fresh meat! I\'m Granny Grip. Seventy-four, still undefeated at roller disco.', 'Come here. Granny hugs are mandatory. I have strong arms.'], gift: { heal: 6 }, gl: 'A Granny hug (full hydration)' },
  sparky: { lines: ['Hey neighbour! I\'m Sparky. Burn crew. Yes, the eyebrows are a long story.', 'Here, a sparkler. Gifted. Point it away from your face. Learn from me.'], gift: { glow: 10 }, gl: 'Sparky gifted 10 glow sticks' },
  biscuit: { lines: ['*happy chirp* Hiii! I\'m Biscuit! Yes I\'m in a fursuit. Yes it\'s hot. No I won\'t take it off.', 'Here, a kandi bracelet. It says BUN BUDDY. Because of your bun. And because we\'re buddies now.'], gift: { glow: 10 }, gl: 'Biscuit gifted a kandi bracelet' }
};
BW17.talkFriend = function (g, a, id) {
  const M = g.missions, nm = M.get('neighbors');
  if (nm && nm.state === 'active' && !nm.data[id]) {
    const T = BW17.MEET[id];
    g.say(a, T.lines, () => { nm.data[id] = true; if (g.grant) g.grant(T.gift, { quiet: true }); g.toast(T.gl.toUpperCase()); g.fx.confetti(a.x, a.y + 2, a.z, 14); a.ch.play(id === 'granny' || id === 'biscuit' ? 'hug' : 'cheer', null, true); M.progress('neighbors'); });
    return;
  }
  // deliveries (Meals on Wheels)
  const fm = M.get('s_food'), want = { sparky: 'w17bacon', nebula: 'w17pancake' }[id];
  if (fm && fm.state === 'active' && want && g.pack && g.pack.has(want)) { g.say(a, [id === 'sparky' ? 'Bacon! Cooked by somebody else\'s fire for once. Bless you.' : 'Pancakes! With dust! Just like 2001. Thank you, sweetie.'], () => { g.pack.take(want); M.progress('s_food'); }); return; }
  if (id === 'biscuit' && M.state('s_ice') === 'active' && g.pack && g.pack.has('w17ice')) { g.say(a, ['ICE! *melting happy noises* You saved me! You SAVED me!', 'Take my spare fur coat. You\'ll need a disguise sooner or later. Trust me.'], () => { g.pack.take('w17ice'); g.player.hold(null); BW17.state.meter = null; a.ch.play('hug', null, true); g.fx.hearts(a.x, a.y + 2, a.z, 14); M.complete('s_ice'); }); return; }
  const ACT = { s_sunrise: 'Sleep in your tipi till five, then RIDE to the heart. The sun waits for no one.', s_tea: 'Cushion. Still. Tea. Steeping Sloth, sweetie.', s_phone: 'Sneak up behind her, swipe it, Phone Jail at the tea lounge!', s_skate: 'Lace up at The Glide and hit every ring!', s_burn: 'Perimeter, sit down, don\'t move. Tonight she burns!', s_ice: 'Ice Ice Playa! Please hurry! I\'m... becoming soup.' };
  for (const q in ACT) if (M.state(q) === 'active' && M.get(q).def.giver === id) { g.say(a, [ACT[q]]); return; }
  // time-gated offers
  let list = { nebula: ['s_sunrise', 's_tea'], granny: ['s_phone', 's_skate'], sparky: ['s_burn'], biscuit: ['s_ice'] }[id] || [];
  const hints = [];
  if (list.indexOf('s_sunrise') >= 0 && M.state('s_sunrise') === 'available') { const h = BW17.state.clock; if (h >= 7 && h < 18) { list = list.filter(q => q !== 's_sunrise'); hints.push('Ask me about the sunrise set in the evening, sweetie. It starts with a good night\'s sleep.'); } }
  if (list.indexOf('s_burn') >= 0 && M.state('s_burn') === 'available') {
    if (!BW17.storyAt(8)) { list = []; hints.push('The Stick Cathedral burns FRIDAY night. It\'s only ' + BW17.dayName() + '. Come home Friday!'); }
    else if (!BW17.isNight()) { list = []; hints.push('It burns tonight! Nap in your tipi till dark, then come find me.'); }
  }
  if (BW17.offer(g, a, list)) return;
  const idle = { nebula: BurnsRig.types.w17Nebula.lines, granny: BurnsRig.types.w17Granny.lines, sparky: BurnsRig.types.w17Sparky.lines, biscuit: ['*happy chirp*', 'Hug? Hug.', 'It\'s only a little hot in here. Like the sun.'] }[id];
  g.say(a, hints.length ? hints : [idle[Math.floor(Math.random() * idle.length)]]);
};
BW17.talkDiner = function (g, a, i) {
  const m = g.missions.get('kitchen');
  if (m && m.state === 'active' && m.data.step >= BW17.KITCHEN.length && !m.data['ate' + i]) {
    m.data['ate' + i] = true; m.data.served++;
    a.say(['FINALLY. Bless you.', 'Is that... guac? It\'s guac. I\'m crying.', 'I would die for you. Lightly.'][i], 2); a.ch.play('cheer', null, true); g.fx.hearts(a.x, a.y + 2, a.z, 6); burnsSfx('gift', { vol: 0.5 }, 'pick');
    if (m.data.served >= 3) g.missions.complete('kitchen', { x: g.player.x, y: g.player.y + 1.3, z: g.player.z + 1.5 });
    else g.toast(`FED: ${m.data.served}/3`);
    return;
  }
  g.say(a, [['When\'s lunch?', 'I can smell beans. I can SMELL them.', 'Is the new kid cooking? I trust him. I trust everyone.'][i]]);
};

/* ---------------- KITCHEN DUTY ---------------- */
BW17.KITCHEN = [
  { id: 'tortilla', name: 'TORTILLAS', where: 'the crate by the east wall' },
  { id: 'beans', name: 'BEANS', where: 'the pot on the counter' },
  { id: 'cheese', name: 'CHEESE', where: 'the cooler by the east wall' },
  { id: 'sauce', name: 'HOT SAUCE', where: 'the little rack by the counter' }
];
BW17.kitchenBuild = function (api, g) {
  const L = BW17.L, c = L.commonDome;
  const pos = { tortilla: [c[0] + 3.0, c[1] - 1.3], cheese: [c[0] + 3.0, c[1] + 1.3], beans: [c[0] - 3.2, c[1] - 0.5], sauce: [c[0] - 2.4, c[1] + 2.4], roll: [c[0] - 2.2, c[1] - 2.7] };
  L.kitchen = pos;
  api.mesh(c[0], c[1], m => {
    const cols = [];
    m.color('#a07a4a'); m.roundBox(3.0, 0.3, -1.3, 0.7, 0.6, 0.6, 0.06, { uv: BURNS_ATLAS.pattern('wood') }); m.color('#f4e8d0'); for (let k = 0; k < 4; k++) m.roundCyl(3.0, 0.62 + k * 0.03, -1.3, 0.22, 0.025, 0.01, { seg: 12 });
    m.color('#2a8ac8').shine(1); m.roundBox(3.0, 0.28, 1.3, 0.8, 0.5, 0.45, 0.06); m.color('#f4f4f0'); m.roundBox(3.0, 0.57, 1.3, 0.82, 0.1, 0.47, 0.03); m.shine(0);
    m.color('#6a4a2a'); m.roundBox(-2.4, 0.55, 2.4, 0.6, 1.1, 0.3, 0.04); for (let k = 0; k < 3; k++) { m.color(['#e83a2a', '#ff8a1a', '#3aa83a'][k]).shine(2); m.roundCyl(-2.55 + k * 0.15, 1.1, 2.4, 0.05, 0.22, 0.02, { seg: 8 }); } m.shine(0);
    m.color('#2a2a30').shine(2); m.roundBox(-2.2, 0.45, -2.7, 0.9, 0.9, 0.6, 0.06); m.color('#3a3a44'); m.roundBox(-2.2, 0.92, -2.7, 0.8, 0.04, 0.5, 0.02); m.shine(0);
    cols.push({ t: 'box', x: 3.0, z: -1.3, hx: 0.35, hz: 0.3, y0: 0, y1: 0.7 }, { t: 'box', x: 3.0, z: 1.3, hx: 0.4, hz: 0.23, y0: 0, y1: 0.62 }, { t: 'box', x: -2.4, z: 2.4, hx: 0.3, hz: 0.15, y0: 0, y1: 1.1 }, { t: 'box', x: -2.2, z: -2.7, hx: 0.45, hz: 0.3, y0: 0, y1: 0.95 });
    return { cols, lights: [] };
  });
  const it = (key, label, fn) => api.interact({ x: pos[key][0], z: pos[key][1], r: 1.5, label, when: g2 => { const m = g2.missions.get('kitchen'); return m && m.state === 'active' && fn(m); }, fn: g2 => BW17.kitchenAct(g2, key) });
  for (const K of BW17.KITCHEN) it(K.id, 'GRAB ' + K.name, m => m.data.step < BW17.KITCHEN.length);
  it('roll', 'ROLL BURRITOS', m => m.data.step === BW17.KITCHEN.length && !m.data.rolled);
};
BW17.kitchenTracker = function (g, m) { const K = BW17.KITCHEN[m.data.step]; m.def.short = K ? `Kitchen: grab the ${K.name}` : (m.data.rolled ? 'Feed the 3 campers at the door' : 'ROLL the burritos at the griddle'); };
BW17.kitchenAct = function (g, key) {
  const m = g.missions.get('kitchen'), K = BW17.KITCHEN[m.data.step], kev = g.actor('kev');
  if (key === 'roll') {
    BW17.minigame(g, { kind: 'mash', title: 'ROLL THEM BURRITOS!', sub: 'Tuck! Roll! Tuck! Roll!', need: 12, time: 5, col: '#ffb347',
      done(g2, ok) { if (!ok) { if (kev) kev.say('Loose burrito! Roll it TIGHTER!', 2); return; } m.data.rolled = true; g2.player.hold('parcel'); BW17.kitchenTracker(g2, m); if (kev) kev.say('BEAUTIFUL. Now feed the people at the door!', 2.4); m.data.marker = 'diner1'; } });
    return;
  }
  if (!K) return;
  if (K.id !== key) { m.left = Math.max(5, (m.left || 0) - 4); if (kev) kev.say(`That's ${BW17.KITCHEN.find(k => k.id === key).name.toLowerCase()}! I said ${K.name}! (-4 s)`, 2); burnsSfx('bump'); return; }
  m.data.step++; burnsSfx('pick', { pitch: 1 + m.data.step * 0.1 }); g.fx.burst(g.player.x, g.player.y + 1.4, g.player.z, 'star', 6, '#ffd84a');
  const N = BW17.KITCHEN[m.data.step];
  if (kev) kev.say(N ? `${K.name}! YES! Now ${N.name}!` : 'All in! Now ROLL them at the griddle!', 1.8);
  BW17.kitchenTracker(g, m);
};

/* ---------------- CABLE RUN ---------------- */
BW17.cableStep = function (g, m) {
  const L = BW17.L, p = g.player, C = BW17.state.cable;
  if (!m.data.got) {
    if (Math.hypot(p.x - L.reel[0], p.z - L.reel[1]) < 2.4 && !g.cine) {
      m.data.got = true; m.data.pts = [[L.reel[0], L.reel[1]]]; BW17.state.cable = m.data; p.hold('zipties');
      burnsSfx('pick'); g.banner('GOT THE CABLE', 'Over ramp 1 to 5, in order, then PLUG IN', { col: '#ffb347' });
    }
    m.def.short = 'Grab the cable at the reel (east of the coliseum)';
    return;
  }
  const R = BW17.LAYOUT.ramps, i = m.data.ramp;
  m.def.short = i < R.length ? `Cable over ramp ${i + 1} of ${R.length}` : 'PLUG IN at the amp rack by the 90 ft dome';
  if (i < R.length && Math.hypot(p.x - R[i][0], p.z - R[i][1]) < 2.6) { m.data.ramp++; m.data.pts.push([R[i][0], R[i][1]]); burnsSfx('pick', { pitch: 1 + i * 0.1 }); g.fx.ring(R[i][0], 0.2, R[i][1], 2.2, '#ffb347', 0.5); g.toast(`RAMP ${i + 1}/${R.length}`); }
  // skipped a ramp? The cable snags if he gets to a later ramp first
  for (let k = i + 1; k < R.length; k++) if (Math.hypot(p.x - R[k][0], p.z - R[k][1]) < 2.0 && (m.data.snagT || 0) < g.time) { m.data.snagT = g.time + 2.5; g.warn('WRONG RAMP! RAMP ' + (i + 1) + ' FIRST', 1.4); }
};
BW17.plugIn = function (g) {
  const m = g.missions.get('cable'), L = BW17.L, S = BW17.state; if (!m || m.state !== 'active') return;
  m.data.pts.push(L.ampFront.slice()); m.left = undefined;
  g.cutscene([
    { do: g2 => { g2.player.hold(null); burnsSfx('flame_jet', { vol: 0.4 }); } },
    { cam: { x: L.ampFront[0] + 6, y: 3.2, z: L.ampFront[1] - 4, tx: -40, ty: 9, tz: 14, fov: 0.95 } },
    { wait: 0.5 }, { shake: 0.6 }, { flash: '#ffb347' },
    { do: g2 => { burnsSfx('crowd_cheer'); g2.fx.confetti(-30, 8, 14, 40); for (let i = 0; i < 12; i++) g2.fx.notes(-36 + Math.random() * 10, 6 + Math.random() * 4, 14 + (Math.random() - 0.5) * 8); } },
    { say: [{ name: 'DJ TAPROOT (90 FT DOME)' }, ['WE HAVE POWER! This one goes out to the cable kid!']] },
    { do: g2 => { g2.missions.complete('cable', { x: g2.player.x, y: g2.player.y + 1.3, z: g2.player.z + 1.5 }); const px = g2.actor('pixel'); if (px) px.say('Clean run. No trips. I\'m... proud. That\'s new.', 2.6); } }
  ], null);
};

/* ---------------- SHADE PATROL ---------------- */
BW17.shadeStep = function (g, dt) {
  const S = BW17.state, p = g.player, m = g.missions.get('shade');
  for (const F of S.flaps) {
    const mv = F.mv; F.ph += dt * (F.tied ? 0 : 3.4);
    if (F.tied) { mv.pitch = BurnsM.damp(mv.pitch || 0, 0, 6, dt); mv.roll = BurnsM.damp(mv.roll || 0, 0, 6, dt); continue; }
    mv.pitch = Math.sin(F.ph) * 0.6 - 0.3; mv.roll = Math.sin(F.ph * 1.3 + 1) * 0.35;
  }
  if (!m || m.state !== 'active') return;
  // gusts while Brady is up on the frame
  if (p.y > 3.6 && !g.cine) {
    S.gustT -= dt;
    if (S.gustT <= 0) { S.gustT = 4.5 + Math.random() * 2.5; S.gust = 1.1; g.warn('GUST!', 0.9); burnsSfx('wind', { vol: 0.5 }, 'dust'); }
    if (S.gust > 0) { const k = S.gust; S.gust -= dt; if (S.gust <= 0.55 && k > 0.55 && p.grounded) { p.knock(2.6, 2.5, 1.2); g.fx.dust(p.x, p.y, p.z, 8); } }
  }
};
BW17.tieCorner = function (g, F) {
  F.tied = true; burnsSfx('pick'); g.fx.burst(F.c.x, F.c.y + 0.4, F.c.z, 'star', 8, '#ffb347');
  g.missions.progress('shade');
};

/* ---------------- A TIPI OF YOUR OWN ---------------- */
BW17.tipiScene = function (g, a) {
  const L = BW17.L, T = L.tipi, p = g.player, M = g.missions;
  const front = [T.x + Math.sin(T.yaw) * 6.5, T.z + Math.cos(T.yaw) * 6.5];
  g.cutscene([
    { fade: 'out', dur: 0.5 },
    { do: g2 => { M.start('tipi', true); a.x = L.tipiDoor[0] - Math.cos(T.yaw) * 1.6; a.z = L.tipiDoor[1] + Math.sin(T.yaw) * 1.6; a.yaw = T.yaw + Math.PI; p.teleport(L.tipiDoor[0] + Math.sin(T.yaw) * 1.5, 0, L.tipiDoor[1] + Math.cos(T.yaw) * 1.5, T.yaw + Math.PI); g2.snapCam = true; BurnsSave.flag(17, 'tipiOwned', true); } },
    { fade: 'in', dur: 0.6 },
    { swell: 'burns_w17' },
    { title: { day: BW17.dayName(), name: 'Brady\'s Tipi', sub: 'Home, sweet tipi' }, wait: false },
    { orbit: { x: T.x, y: 2.2, z: T.z, r0: 14, r1: 8.5, h0: 7, h1: 3.2, a0: T.yaw + 1.3, a1: T.yaw + 0.2, ty: 3.4, dur: 5.5, fov: 0.92 } },
    { say: [a, ['Twenty-seven tipis in this village. One of them\'s been waiting for you.', 'Inner ring, front row, door facing the kitchen dome. Prime real estate, little brother.']] },
    { say: ['brady', ['A tipi. My own tipi. I\'ve never owned anything with a smoke flap.']] },
    { say: [a, ['Make it yours. Every tipi needs one ridiculous thing out front.']] },
    { cam: { x: front[0], y: 2.4, z: front[1], tx: T.x, ty: 2.2, tz: T.z, fov: 0.9 } }
  ], () => BW17.choose(g, { who: 'MAKE IT YOURS', prompt: 'What goes out front?', options: ['A pink lawn flamingo', 'A pirate flag', 'A disco ball over the door'], def: 0,
    done(g2, i) {
      const id = ['flamingo', 'pirate', 'disco'][i]; BW17.giveDecor(g2, id, true); g2.fx.confetti(T.x, 3, T.z, 30); burnsSfx('gift');
      g2.cutscene([{ cam: { x: front[0] + Math.cos(T.yaw) * 2, y: 1.8, z: front[1] - Math.sin(T.yaw) * 2, tx: T.x, ty: 1.6, tz: T.z, fov: 0.85 } }, { slowmo: 0.45, dur: 1.2 }, { flash: '#fff4d8' }, { wait: 1.1 }, { slowmo: 1 }], null, { letterbox: false });
      g2.say(a, [['A flamingo. Classy. Timeless. Slightly judgmental.', 'A pirate flag! Arr. The neighbours will love it. Granny will steal it.', 'A disco ball! Now your door is a party. Your door was always a party.'][i], 'Bedroll\'s inside. Take a siesta. You\'ve earned it.'], () => { g2.banner('YOUR TIPI', 'SLEEP on the bedroll inside', { col: '#7aff5a' }); BW17.applyMusic(g2, true); });
    } }));
};

/* ---------------- sleeping: the bedroll moves the clock ---------------- */
BW17.sleepMenu = function (g) {
  const S = BW17.state, h = S.clock, M = g.missions;
  if (M.state('tipi') === 'active') { BW17.sleep(g, 17.6, 'siesta'); return; }
  const opts = [], to = [];
  if (h >= 6.5 && h < 16.5) { opts.push('SIESTA TILL GOLDEN HOUR'); to.push(17.6); }
  if (h < 20.5 && h >= 6) { opts.push('SLEEP TILL NIGHTFALL'); to.push(21.5); }
  opts.push(M.state('s_sunrise') === 'active' ? 'WAKE AT 5 AM (THE HEART!)' : 'SLEEP TILL SUNRISE'); to.push(5.05);
  opts.push('SLEEP TILL MORNING'); to.push(9.5);
  opts.push('NOT TIRED'); to.push(null);
  BW17.choose(g, { who: 'BEDROLL', prompt: `It's ${BW17.hourText(h)}. Your bedroll looks incredible.`, options: opts, def: opts.length - 1, done: (g2, i) => { if (to[i] !== null) BW17.sleep(g2, to[i]); } });
};
BW17.sleep = function (g, hour, why) {
  const S = BW17.state, L = BW17.L, T = L.tipi, p = g.player, M = g.missions;
  const cam = { x: T.x + Math.sin(T.yaw) * 1.7, y: 2.6, z: T.z + Math.cos(T.yaw) * 1.7, tx: L.bed[0], ty: 0.3, tz: L.bed[1], fov: 1.05 };
  S.musicLock = true;
  g.cutscene([
    { do: g2 => { if (p.vehicle) p.vehicle.dismount(p); p.teleport(L.bed[0], 0.25, L.bed[1], T.yaw); p.animOverride = 'sleep'; } },
    { cam },
    { do: g2 => { for (let i = 0; i < 3; i++) BW17.after(g2, i * 0.5, g3 => g3.fx.zzz(L.bed[0], 0.9, L.bed[1])); } },
    { wait: 1.2 },
    { fade: 'out', dur: 0.9 },
    { do: g2 => { BW17.setClock(g2, hour); g2.banner('ZZZ...', BW17.hourText(hour), { col: '#c8d0ff', small: true }); } },
    { wait: 1.0 },
    { fade: 'in', dur: 1.0 },
    { do: g2 => { p.animOverride = null; p.teleport(L.bed[0] + Math.sin(T.yaw) * 1.2, 0, L.bed[1] + Math.cos(T.yaw) * 1.2, T.yaw); g2.camYaw = T.yaw; g2.snapCam = true; S.musicLock = false; BW17.applyMusic(g2, true); } }
  ], g2 => {
    if (why === 'siesta' && M.state('tipi') === 'active') { BW17.wake(g2, 'gold'); M.complete('tipi', { x: L.tipiDoor[0], y: 1.3, z: L.tipiDoor[1] }); return; }
    if (M.state('s_sunrise') === 'active' && hour < 6) { BW17.wake(g2, 'heart'); return; }
    BW17.wake(g2, hour >= 5 && hour < 7.4 ? 'sunrise' : null);
  });
};
BW17.wake = function (g, kind) {
  const S = BW17.state, L = BW17.L, T = L.tipi, p = g.player;
  if (kind === 'heart') {
    S.sunrise = { t: 0 }; BW17.setClock(g, 5.05); S.clockTo = 5.92; S.clockRate = 0.016; S.musicLock = true; burnsMusic('burns_w7');
    if (!p.vehicle && g.bike) g.toast('BIKE BUTTON (OR B) TO RIDE!');
    g.banner('IT\'S 5 AM', 'Get to the heart car before the sun comes up!', { col: '#ff9ad0', big: true });
    return;
  }
  if (kind === 'sunrise') {
    // the sunrise from the tipi: Brady steps out, the domes go dark against a pink sky
    const out = [L.tipiDoor[0], L.tipiDoor[1]];
    S.clockTo = 6.3; S.clockRate = 0.03;
    g.cutscene([
      { do: g2 => { p.teleport(out[0], 0, out[1], 0.1); p.animOverride = 'victory'; } },
      { swell: 'burns_w17' },
      { crane: { from: { x: out[0] - 1.5, y: 1.1, z: out[1] - 4.5, tx: out[0], ty: 1.6, tz: out[1] + 8, fov: 0.95 }, to: { x: out[0] - 2.5, y: 6.5, z: out[1] - 7, tx: out[0] + 31, ty: 9, tz: out[1] + 95, fov: 1.0 }, dur: 5 } },   // over the village, into the sun (azimuth 18 deg)
      { banner: ['GOOD MORNING, BRADY', 'Sunrise from your own front door', { col: '#ffb48c' }] },
      { wait: 1.6 },
      { do: g2 => { p.animOverride = null; BW17.applyMusic(g2, true); } }
    ]);
    return;
  }
  if (kind === 'gold') {
    g.banner('GOLDEN HOUR', 'Go meet the neighbours', { col: '#ffbf7c' });
    const j = g.actor('jefr'); if (j) { j.x = L.commonDome[0] + 1.6; j.z = L.commonDome[1] + 6.2; j.yaw = 0; }
  }
};
BW17.decorMenu = function (g) {
  const ids = Object.keys(BW17.DECOR).filter(id => BW17.decorOwned(id));
  if (!ids.length) { g.toast('NO DECOR YET. SIDE QUESTS PAY IN TRINKETS.'); return; }
  BW17.choose(g, { who: 'DECORATE', prompt: 'Tap to show or hide:', options: ids.map(id => (BW17.decorOn(id) ? '✓ ' : '· ') + BW17.DECOR[id]).concat(['DONE']), def: ids.length,
    done(g2, i) { if (i >= ids.length) return; const id = ids[i]; BurnsSave.flag(17, 'decor:' + id, BW17.decorOn(id) ? 'off' : true); BW17.syncDecor(g2); burnsSfx('select'); BW17.after(g2, 0.1, g3 => BW17.decorMenu(g3)); } });
};

/* ---------------- THE MAN'S MEN (the finale) ---------------- */
BW17.lookoutsIntro = function (g) {
  const S = BW17.state, L = BW17.L, c = L.commonDome, M = g.missions;
  if (M.isDone('lookouts') || S.lookoutsOn) return;
  S.lookoutsOn = true;
  const spawn = [];
  for (let i = 0; i < 6; i++) { const a = 0.3 + i / 6 * TAU, x = c[0] + Math.sin(a) * 19.5, z = c[1] + Math.cos(a) * 19.5; spawn.push([x, z]); }
  g.cutscene([
    { do: g2 => { BW17.setClock(g2, 19.25); M.start('lookouts', true); for (let i = 0; i < 6; i++) { const q = spawn[i]; g2.spawnActor({ type: 'w17Lookout', seed: i, name: 'THE MAN\'S MEN', x: q[0], z: q[1], yaw: Math.atan2(c[0] - q[0], c[1] - q[1]), behavior: 'w17Lookout', hp: 2, tag: 'w17lookout', friendly: false, drop: 3, aggro: 11, afterDefeat: 'sit', defeatLine: ['I just wanted an autograph!', 'Tell him I tried!', 'Okay, okay! Fan club is going home!', 'He\'s not even that tall!', 'Ow. Groovy. Ow.', 'Bun. Too. Powerful.'][i] }); } } },
    { cam: { x: c[0] + 16, y: 6, z: c[1] + 18, tx: c[0], ty: 1.5, tz: c[1], fov: 0.95 } },
    { banner: ['DUSK', 'Something is creeping through the tipis...', { col: '#ff9a6a' }] },
    { wait: 1.2 },
    { say: [{ name: 'THE MAN\'S MEN' }, ['Psst. Have you seen a guy with a bun? Asking for a friend. A very tall, very wooden friend.', 'He said the bun guy might be hiding in a tipi. We\'re his fan club. We have shirts.']] },
    { say: ['brady', ['The Man has a FAN CLUB?']] },
    { say: [g.actor('jefr') || 'JEFR', ['Not in my village he doesn\'t. Roots! Send our guests home!']] },
    { do: g2 => { for (const id of ['granny', 'pixel', 'kev', 'sparky', 'biscuit', 'nebula']) { const a = g2.actor(id); if (!a) continue; a.hidden = false; a.def.helpLine = { granny: 'HIP CHECK!', pixel: 'STROBE MODE!', kev: 'SCOBY TO THE FACE!', sparky: 'SAFETY THIRD!', biscuit: 'HUG ATTACK!', nebula: 'YARN BOMB, SWEETIE!' }[id]; a.def.helpAnim = id === 'kev' || id === 'nebula' ? 'throw' : 'spin'; a.def.noTalk = true; a.setBehavior('w17Helper'); } g2.banner('THE MAN\'S MEN', 'Send all six home! Your friends have your back', { col: '#ff7a3a' }); } }
  ]);
};
BW17.finale = function (g) {
  const S = BW17.state, L = BW17.L, c = L.commonDome, p = g.player;
  if (S.finaleOn) return; S.finaleOn = true;
  const friends = ['nebula', 'granny', 'pixel', 'kev', 'sparky', 'biscuit'];
  g.cutscene([
    { do: g2 => { for (const id of friends) { const a = g2.actor(id); if (a) { a.setBehavior('idle'); a.def.noTalk = false; } } BW17.setClock(g2, 20.3); p.teleport(c[0], 0, c[1] + 7.2, Math.PI); g2.snapCam = true; const j = g2.actor('jefr'); if (j) { j.x = c[0] + 1.8; j.z = c[1] + 5.4; j.yaw = -0.6; }
      friends.forEach((id, i) => { const a = g2.actor(id); if (!a) return; const ang = -1.2 + i * 0.48; a.x = c[0] + Math.sin(ang) * 3.6; a.z = c[1] + 7.2 + Math.cos(ang) * 3.6 - 3.6; a.yaw = Math.atan2(p.x - a.x, p.z - a.z); }); } },
    { orbit: { x: c[0], y: 1.6, z: c[1] + 6, r0: 9, r1: 7, h0: 3, h1: 2.4, a0: -0.4, a1: 0.5, ty: 1.4, dur: 4, fov: 0.92 } },
    { say: [g.actor('jefr') || 'JEFR', ['The Man\'s got a fan club out looking for a guy with a bun. That\'s you, little brother.']] },
    { say: [g.actor('nebula') || 'NEBULA', ['You need a disguise, sweetie. Nobody hides from a forty-foot effigy in a black tee.']] },
    { say: [g.actor('granny') || 'GRANNY', ['Costume Cult, honey. Three o\'clock and C. Tell them Granny sent you.']] },
    { say: [g.actor('pixel') || 'PIXEL', ['Keep the bun. Hide the bun.']] },
    { say: [g.actor('jefr') || 'JEFR', ['Your tipi will be right here when you get back. That\'s what home means.']] },
    { say: ['brady', ['Home. ...Okay. A disguise. Then Chinka.']] },
    { do: g2 => { BurnsSave.flag(17, 'storyDone', true); BurnsSave.flag(17, 'clock', 9); } }
  ], g2 => g2.finishWorld());
};

/* ---------------- start of a visit ---------------- */
BW17.start = function (g) {
  const S = BW17.state, L = BW17.L, p = g.player, M = g.missions;
  BW17.lightInit(g); BW17.applySky(g); BW17.applyLights(g, true); BW17.applyPresence(g); BW17.syncDecor(g); BW17.addPrompts(g);
  S.music = null; BW17.applyMusic(g, true);
  // headlamp from Pixel (darkwads quest) stays with Brady at home
  if (M.isDone('s_darkwads') || M.state('s_darkwads') === 'active') p.lightR = 8;
  const story = !!BurnsSave.flag(17, 'storyDone');
  if (!BurnsSave.flag(17, 'intro')) { BW17.intro(g); return; }
  if (story && !BurnsSave.get().checkpoint[17]) {
    // home: wake up outside your own tipi
    p.teleport(L.tipiDoor[0], 0, L.tipiDoor[1], L.tipi.yaw + Math.PI); g.camYaw = L.tipi.yaw + Math.PI; g.snapCam = true;
  }
  if (g.dayCard) g.dayCard({ day: BW17.dayName(), name: 'Root Society', sub: 'Home, sweet tipi' });
  if (story) g.banner('HOME', 'The job board is by the village path', { col: '#e8c890' });
  // story already past the tipi but not finished (left mid-evening): re-run the lookouts
  if (!story && M.isDone('neighbors') && !M.isDone('lookouts')) BW17.after(g, 1.5, g2 => BW17.lookoutsIntro(g2));
};
BW17.intro = function (g) {
  const S = BW17.state, p = g.player, sp = { x: 4, z: 128 };
  p.teleport(sp.x, 0, sp.z, Math.PI); p.animOverride = 'sleep'; p.locked = true;
  g.cutscene([
    { title: { day: 'Tuesday', name: 'Root Society', sub: 'Brady\'s home' }, wait: false },
    { crane: { from: { x: -60, y: 46, z: 10, tx: 0, ty: 6, tz: 10, fov: 0.95 }, to: { x: 16, y: 7, z: 150, tx: 0, ty: 4, tz: 40, fov: 0.92 }, dur: 6.5 } },
    { cam: { x: sp.x + 2.6, y: 1.2, z: sp.z + 2.4, tx: sp.x, ty: 0.3, tz: sp.z, fov: 0.85 } },
    { wait: 0.6 },
    { do: g2 => { g2.fx.zzz(sp.x, 0.8, sp.z); } },
    { say: [{ name: 'PASSING CYCLIST' }, ['MORNING! HAPPY TUESDAY!']] },
    { do: g2 => { p.animOverride = 'dazed'; } },
    { say: ['brady', ['Tuesday? Last thing I remember is a yellow bike, a LOT of bass and a giant bouncy mushroom.', 'I still have glitter in places glitter shouldn\'t be.']] },
    { do: g2 => { g2.shake(0.25); burnsSfx('man_stomp', { vol: 0.25, pitch: 1.6 }); } },
    { orbit: { actor: 'brady', r0: 4, r1: 7, h0: 1.4, h1: 2.6, a0: 0.4, a1: 2.6, ty: 1.3, dur: 3 } },
    { say: ['brady', ['That bass. Three domes. A... coliseum? Okay. Follow the bass.']] },
    { do: g2 => { p.animOverride = 'walk'; S.walkT = 0; } }, { dof: false },   // keep the camp sharp: it's the reveal
    // over-the-shoulder tracking shot: he walks toward the bass and the camp grows in front of him
    // (the camera is set from here: a parallel track step would not reach the cutscene camera)
    { until: (g2, c) => {
      S.walkT += 1 / 120; const k = Math.min(1, S.walkT / 3.2), e = k * k * (3 - 2 * k);
      p.teleport(sp.x, 0, sp.z - k * 9, Math.PI);
      const a = Math.PI + 0.55 - 0.3 * e, d = 5.6 - 1.2 * e;
      c.cam = { x: p.x - Math.sin(a) * d, y: 2.1 - 0.3 * e, z: p.z - Math.cos(a) * d, tx: p.x, ty: 1.7, tz: p.z - 3, fov: 0.9 };
      return k >= 1;
    } },
    { do: g2 => { p.animOverride = null; p.locked = false; BurnsSave.flag(17, 'intro', true); BW17.setClock(g2, 9); p.teleport(sp.x, 0, sp.z - 9, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; BW17.applyMusic(g2, true); } }
  ], g2 => { g2.banner('FOLLOW THE BASS', 'Root Society is straight ahead', { col: '#e8c890' }); });
};
BW17.clockStep = function (g, hours) { const S = BW17.state; BW17.setClock(g, S.clock + hours, 0.25); };
// the night track by night, the day track by day (unless a set piece holds the music)
BW17.applyMusic = function (g, force) {
  const S = BW17.state; if (!S || S.musicLock) return;
  const want = BW17.isNight() ? 'burns_w17n' : 'burns_w17';
  if (force || S.music !== want) { S.music = want; burnsMusic(want); }
};

/* ---------------- per-step update ---------------- */
BW17.update = function (g, dt) {
  const S = BW17.state; if (!S || S.g !== g) return;
  const p = g.player, M = g.missions, L = BW17.L;
  BW17.stepTimers(g, dt);
  BW17.stepClock(g, dt);
  BW17.shadeStep(g, dt);
  if (M.state('cable') === 'active') BW17.cableStep(g, M.get('cable'));
  // story beats that wait for a state
  // foam cannons at the Deep End (only when someone's close enough to see them)
  if (L.foam && Math.hypot(g.cam.x - L.foam[0], g.cam.z - L.foam[1]) < 70 && !BW17.isNight()) {
    for (const q of S.foam) if (Math.random() < dt * 9) { const sp = 3 + Math.random() * 2, a = q[3] + (Math.random() - 0.5) * 0.5; g.fx.add(q[0] + Math.sin(q[3]) * 0.4, q[1], q[2] + Math.cos(q[3]) * 0.4, Math.sin(a) * sp, 2.5 + Math.random(), Math.cos(a) * sp, 2.2, 0.5, 1.6, [0.96, 0.98, 1], 0.75, 'puff', 2 | 4); }
    if (Math.random() < dt * 6) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()) * L.foam[2]; g.fx.add(L.foam[0] + Math.sin(a) * r, 0.3, L.foam[1] + Math.cos(a) * r, 0, 0.15, 0, 3, 1.2, 1.8, [0.95, 0.97, 1], 0.6, 'puff', 4); }
  }
  // presence (hour-dependent actors) every half second
  S.presT2 = (S.presT2 || 0) - dt; if (S.presT2 <= 0) { S.presT2 = 0.5; BW17.applyPresence(g); }
};
/* the shade corners + the cable plug are ACTION prompts built at start (g.interactables) */
BW17.addPrompts = function (g) {
  const S = BW17.state, L = BW17.L;
  const list = g.interactables || (g.interactables = []);
  for (const F of S.flaps) list.push({ x: F.c.x, z: F.c.z, y: F.c.y, r: 1.8, label: 'TIE IT', when: g2 => g2.missions.state('shade') === 'active' && !F.tied && g2.player.y > 3.6, fn: g2 => BW17.tieCorner(g2, F) });
  list.push({ x: L.ampFront[0], z: L.ampFront[1], r: 2.0, label: 'PLUG IN', when: g2 => { const m = g2.missions.get('cable'); return m && m.state === 'active' && m.data.got && m.data.ramp >= BW17.LAYOUT.ramps.length; }, fn: g2 => BW17.plugIn(g2) });
};

/* ---------------- sprites: the cable on the ground, ramp glows, the skate rings ---------------- */
BW17.drawSprites = function (g, R) {
  const S = BW17.state; if (!S || S.g !== g) return;
  const SP = BURNS_SPRITES.R, p = g.player, M = g.missions, L = BW17.L;
  const cm = M.get('cable');
  if (cm && cm.state === 'active') {
    const RP = BW17.LAYOUT.ramps;
    for (let i = 0; i < RP.length; i++) { const on = i < (cm.data.ramp || 0), next = i === (cm.data.ramp || 0) && cm.data.got; R.flat.flat(RP[i][0], 0.06, RP[i][1], 4.2, 4.2, 0, SP.ring, on ? [0.5, 1, 0.4] : next ? [1, 0.75, 0.25] : [0.7, 0.55, 0.4], next ? 0.75 + Math.sin(g.time * 6) * 0.2 : 0.45, true); }
    if (cm.data.got) {
      const pts = cm.data.pts.concat([[p.x + Math.sin(p.yaw) * 0.3, p.z + Math.cos(p.yaw) * 0.3]]);
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(len / 0.8)), yaw = Math.atan2(b[0] - a[0], b[1] - a[1]);
        for (let k = 0; k < n; k++) { const t = (k + 0.5) / n; R.flat.flat(lerp(a[0], b[0], t), 0.05, lerp(a[1], b[1], t), 0.16, len / n + 0.05, yaw, SP.dot, [0.05, 0.05, 0.06], 1, false); }
      }
    }
  }
  const sm = M.get('s_skate');
  if (sm && sm.state === 'active' && S.skates) for (let i = sm.n; i < Math.min(sm.n + 3, L.rink.rings.length); i++) { const q = L.rink.rings[i], c = burnsRGBf(BURNS_NEON[i % 7]); R.bbs.bb(q[0], 1.3, q[1], 2.8, 2.8, SP.ring, c, i === sm.n ? 0.95 : 0.4, true); }
};
