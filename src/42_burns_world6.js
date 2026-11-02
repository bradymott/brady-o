/* ============================================================
   BRADY-O BURNS — World 6: THE ART CAR HUNT (night, deep playa)
   El Pulpo, the fire-breathing octopus art car (our own design; "El Pulpo"
   is just its nickname), rolls through deep playa on a stuck autopilot,
   towing a hot-tub party trailer. Brady hydrates its builder, climbs aboard,
   hits the kill switch, and turns it into the best party on the playa.
   Missions (Burn Tokens):
     fire      Follow the Fire      track the octopus by its flame belches
     water     Hydrate the Captain  three cold jugs for Uncle Barnacle
     board     All Aboard           up the trailer ramp + the sucker steps, hit the kill switch
     fireshow  Fire Show            light the six Fire Lilies with the flame cannon
     stunt     Terrible Idea        jump El Pulpo off Bad Idea Guy's dune ramp
     party     Party Animal         park at party spots, DJ, gift jello shots: 40 partying at once
     boss      Hostile Takeover     Chad, Founder & CEO, on a giant e-unicycle with VC drones
   Completing the world saves Save.data.burns.octopus = true (+ the artcar key item).
   ============================================================ */

const BW6 = {
  SPOTS: [
    { id: 'grove', name: 'THE GLOWSHROOM GROVE', x: -92, z: 30, r: 30 },
    { id: 'stables', name: 'SPARKLE PONY STABLES', x: -96, z: -92, r: 28 },
    { id: 'crusty', name: 'CRUSTY CORNER', x: 104, z: -96, r: 28 },
    { id: 'solar', name: 'SOLAR BRO FARM', x: 104, z: 34, r: 28 },
    { id: 'empty', name: 'THE BIG EMPTY', x: 0, z: -134, r: 36 }
  ],
  HQ: { x: 34, z: 98 }, PYR: { x: 0, z: -40 }, GARDEN: { x: 58, z: -54 }, RAMP: { x: -50, z: -6 },
  PATH: [[40, 64], [84, 8], [62, -66], [0, -86], [-60, -44], [-54, 34], [0, 70]],
  MANTLE: { z: -1.65, y: 1.6 },
  GOAL: 40,
  state: null
};
BW6.SKY = Object.assign({}, BURNS_PALETTES.night, { zen: '#04061a', mid: '#1a1240', midK: 0.5, hor: '#3a1c48', fog: '#241a36', fogD: 0.0105, haze: 0.55, moon: [150, 20], moonK: 1.25, stars: 1, city: [0, 0], cityCol: '#ff5ad8', cityK: 0.5, mtnCol: '#120c22', sky: '#4a4a8a', gnd: '#3a2a46', key: '#9aa8e8', keyK: 0.5, emB: 1.6, rim: '#a88aff', clouds: 0.15, cloudCol: '#2a2244' });
BW6.COL = { copper: '#c86a3e', copperDk: '#8e4428', copperLt: '#e08a58', patina: '#46b0a0', belly: '#f4c0a6' };

BurnsWorlds.register({
  id: 6, name: 'The Art Car Hunt', sub: 'Commandeer the fire octopus',
  sky: BW6.SKY, tod: 0,
  music: 'burns_w6',
  bounds: [-170, -190, 170, 170],
  spawn: { x: 0, y: 0, z: 150, yaw: Math.PI },
  ground: { base: '#b8987c', crack: 0.3, mottle: 0.4, res: 0.5 },
  dust: 1.3,
  missions: [
    { id: 'fire', name: 'Follow the Fire', short: 'Catch up with the fire-breathing octopus', type: 'custom', giver: 'biscuit', start: 'manual', marker: { x: 40, z: 64 },
      desc: 'Something out there belches fire every few seconds. Follow the flames and catch up with it.', hint: 'Follow the fire bursts across deep playa',
      onUpdate(g, m) { const c = BW6.state.car; m.def.marker.x = c.x; m.def.marker.z = c.z; if (Math.hypot(g.player.x - c.x, g.player.z - c.z) < 16) g.missions.complete('fire', { x: g.player.x, y: g.player.y + 1.2, z: g.player.z - 2 }); },
      onComplete(g) { BW567K.after(g, 0.4, g2 => BW6.foundOcto(g2)); } },
    { id: 'water', name: 'Hydrate the Captain', short: 'Bring Barnacle 3 cold jugs', type: 'custom', count: 3, giver: 'barnacle', start: 'manual', requires: ['fire'], progressLabel: 'Cold jugs', marker: { x: 34, z: 98 },
      desc: 'Uncle Barnacle built the octopus and has been chasing it for two days. He\'s parched. Find three cold jugs around deep playa and bring them back.', hint: 'El Pulpo HQ (Barnacle), then the Glowshroom Grove, the Laser Pyramid and the Solar Bro Farm',
      onStart(g) { for (const P of g.pickups.items) if (P.mission === 'water') P.taken = false; },
      onEvent(g, m, name, d) { if (name === 'pickup' && d.mission === 'water') { m.n++; g.toast(m.n >= 3 ? 'ALL 3 JUGS! BACK TO BARNACLE!' : `Cold jugs: ${m.n}/3`); return true; } } },
    { id: 'board', name: 'All Aboard', short: 'Board El Pulpo and hit the kill switch', type: 'custom', giver: 'barnacle', start: 'manual', requires: ['water'], marker: { x: 0, z: 0 },
      desc: 'El Pulpo is stuck on autopilot. Run up the hot-tub trailer\'s ramp, climb the sucker steps on her head and smack the big red KILL SWITCH.', hint: 'Wherever the octopus is rolling',
      onUpdate(g, m) { const c = BW6.state.car; m.def.marker.x = c.x; m.def.marker.z = c.z; } },
    { id: 'fireshow', name: 'Fire Show', short: 'Light the 6 Fire Lilies', type: 'custom', count: 6, giver: 'barnacle', start: 'manual', requires: ['board'], progressLabel: 'Fire Lilies', marker: { x: 58, z: -54 },
      desc: 'Drive El Pulpo into the Fire Garden and hold ACTION to light all six Fire Lilies with her flame cannons.', hint: 'The Fire Garden, east of the Laser Pyramid', lockedDesc: 'Commandeer the octopus first.' },
    { id: 'stunt', name: 'Terrible Idea', short: 'Jump El Pulpo off the dune ramp', type: 'custom', giver: 'badidea', start: 'manual', requires: ['board'], marker: { x: -50, z: -6 },
      desc: 'Bad Idea Guy dares you to jump a forty-ton octopus off his dune ramp. Drive up it FAST.', hint: 'The dune ramp west of the Laser Pyramid', lockedDesc: 'You need a ride. A big one.' },
    { id: 'party', name: 'Party Animal', short: 'Get 40 burners partying at once', type: 'custom', giver: 'barnacle', start: 'manual', requires: ['board'], marker: { x: -92, z: 30 },
      desc: 'Park El Pulpo at a glowing PARTY SPOT, throw a party, DJ a killer set and gift jello shots. Partiers follow you to the next spot. Get 40 dancing at once.', hint: 'Party spots: the Glowshroom Grove, Sparkle Pony Stables, Crusty Corner, Solar Bro Farm, the Big Empty', lockedDesc: 'Commandeer the octopus first.' },
    { id: 'boss', name: 'Hostile Takeover', type: 'boss', start: 'manual', requires: ['party'], tokenDirect: true, short: 'Defeat Chad, Founder & CEO!', marker: { x: 0, z: -134 },
      desc: 'Chad wants to turn your party into a platform. Dodge his pitch decks and VC drones, make him crash his giant e-unicycle, then bonk him (or flame him).', hint: 'He crashes your biggest party', lockedDesc: 'Throw a party worth taking over.' }
  ],
  build(api, g) {
    const R = api.rng;
    BW6.state = { introDone: !!BurnsSave.flag(6, 'intro'), lilies: [], party: null, followers: [], shots: 20, back: [], jugs: 0, darkwads: [], jump: null, honk: [] };
    const S = BW6.state;
    /* ---------------- ground: moonlit playa, party rings, tracks ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 170; i++) { const [px, pz] = P(R.range(-170, 170), R.range(-190, 170)), r = R.range(3, 12) * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.55; g2.addColorStop(0, dark ? 'rgba(110,80,70,0.25)' : 'rgba(230,210,190,0.18)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      c.strokeStyle = 'rgba(100,72,60,0.28)'; c.lineWidth = 0.4 * sc;
      for (let i = 0; i < BW6.PATH.length; i++) { const a = BW6.PATH[i], b = BW6.PATH[(i + 1) % BW6.PATH.length]; for (const o of [-1.9, 1.9]) { const [x0, z0] = P(a[0] + o, a[1]), [x1, z1] = P(b[0] + o, b[1]); c.beginPath(); c.moveTo(x0, z0); c.lineTo(x1, z1); c.stroke(); } }
      for (const s of BW6.SPOTS) { const [x, z] = P(s.x, s.z); c.strokeStyle = 'rgba(255,79,216,0.55)'; c.lineWidth = 0.7 * sc; c.setLineDash([2.5 * sc, 1.8 * sc]); c.beginPath(); c.arc(x, z, s.r * 0.55 * sc, 0, TAU); c.stroke(); c.setLineDash([]); c.strokeStyle = 'rgba(56,242,255,0.4)'; c.lineWidth = 0.4 * sc; c.beginPath(); c.arc(x, z, s.r * 0.62 * sc, 0, TAU); c.stroke(); }
    });
    for (const s of BW6.SPOTS) {
      api.light(s.x, s.z, s.r * 0.7, s.id === 'empty' ? '#9a6bff' : '#ff4fd8', 0.2);
      for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; api.glow(s.x + Math.sin(a) * s.r * 0.58, 0.25, s.z + Math.cos(a) * s.r * 0.58, 0.7, i % 2 ? '#ff4fd8' : '#38f2ff', { blink: 2 }); }
      api.sign('PARTY SPOT\n' + s.name, s.x + s.r * 0.62, s.z + 2, { yaw: -Math.PI / 2, h: 1.1, style: { bg: '#1a0a2a', fg: '#ffd84a', size: 24, border: '#ff4fd8', glow: '#ff4fd8' }, glow: '#ff4fd8' });
      api.marker('spot_' + s.id, s.x, s.z, s.name, { col: '#ff4fd8' });
    }
    /* ---------------- landmarks ---------------- */
    BW6.buildBase(api, g);
    BW6.buildHQ(api, g);
    BW6.buildPyramid(api, g);
    BW6.buildGrove(api, g);
    BW6.buildStables(api, g);
    BW6.buildSolar(api, g);
    BW6.buildCrusty(api, g);
    BW6.buildGarden(api, g);
    BW6.buildRamp(api, g);
    BW6.buildEmpty(api, g);
    BW6.buildWanderers(api, g);
    /* ---------------- El Pulpo + its hot-tub party trailer + the rival boombox car ---------------- */
    BW6.buildOcto(api, g);
    BW6.buildRival(api, g);
    BW6.makePuppets(g);
    // the deep-playa trash fence on the far north edge
    for (let x = -165; x < 165; x += 22) api.prop('fence', { x: x + 11, z: -186, len: 22 });
    BW567K.sanitizeActors(api);
  },
  onStart(g) {
    const S = BW6.state;
    BW567K.speedHook(g); BW567K.camHook(g);
    const done = id => g.missions.isDone(id);
    if (done('board') || BurnsSave.get().octopus) { BW6.parkOcto(g, BW6.HQ.x - 12, BW6.HQ.z - 14, -2.2); S.keys = true; }
    if (done('fireshow')) for (const L of S.lilies) BW6.lightLily(g, L, true);
    if (done('boss')) { const c = g.actor('chad'); if (c) c.hidden = true; }
    BW6.refreshInteract(g);
    if (!S.introDone) BW6.intro(g);
    else g.banner('THE ART CAR HUNT', 'Deep playa. Lasers. Dust. A fire-breathing octopus.', { col: '#ff7a2a' });
  },
  onRespawn(g) { const S = BW6.state; if (S.chadOn) { const c = g.actor('chad'); if (c && !c.defeated) { c.data.mode = 'circle'; c.data.t = 3; } } },
  update(g, dt) {
    BW567K.tick(g, dt);
    BW6.updateOcto(g, dt);
    BW6.updateParty(g, dt);
    BW6.updateRival(g, dt);
    BW6.updateDarkwads(g, dt);
    BW6.updateLilies(g, dt);
    BW6.updateUnis(g, dt);
  },
  env(g, env) { const S = BW6.state; if (S && S.party && S.party.on) env.emB += 0.2; },
  drawSprites(g, R) { BW6.sprites(g, R); },
  bw567Overlay(ctx, g) { BW6.overlay(ctx, g); }
});

/* ============================================================ landmarks ============================================================ */
BW6.buildBase = function (api, g) {
  api.prop('shade', { x: 6, z: 152, w: 6, d: 5, col: '#8a7aa8' });
  api.prop('van', { x: 14, z: 156, yaw: 0.2, seed: 601 });
  api.prop('chair', { x: 4, z: 150, yaw: 0.4, col: '#38f2ff' }); api.prop('chair', { x: 7, z: 149, yaw: -0.4, col: '#ff4fd8' });
  api.prop('cooler', { x: 5.6, z: 151.6, col: '#2a8ac8' });
  api.npc({ id: 'biscuit', name: 'BISCUIT', spec: BW6.biscuitSpec(), x: 3.2, z: 147.6, yaw: Math.PI + 0.3, always: true,
    chat: ['Deep playa at night. Spooky. Sparkly. Spooky.', 'Gary is scared of the dark. Gary is a cooler.', 'Follow the fire, buddy!'],
    talk(g, a) { BW6.talkBiscuit(g, a); } });
  api.checkpoint('cp_base', -6, 146, { yaw: Math.PI, name: 'Deep Playa Base' });
  api.light(5, 150, 10, '#ffb070', 0.5);
  api.glow(6, 2.8, 154.5, 0.8, '#ffd8a0'); api.fire(-3, 0, 154, 0.45);
  api.pickup('water', -2, 0.9, 140);
  api.npc({ type: 'ranger', seed: 61, name: 'RANGER RAE', x: -12, z: 128, behavior: 'wander', radius: 6, lines: ['Out here at night, light yourself up. Some folks don\'t. We call them darkwads.', 'Saw a giant octopus belching fire toward two o\'clock. Totally normal Tuesday.'], gift: { kind: 'water' } });
  api.glowLine(0, 136, 20, 96, 10);
};
BW6.biscuitSpec = function () {
  return Object.assign(BurnsRig.npcSpec('burner', 555), {
    kind: 'biscuit', skin: '#b87a50', skinSh: '#94603c', hair: { style: 'afro', col: '#2a1a12', hi: '#5a3a24' }, face: 'goofy',
    body: { h: 1.02, w: 1.24 }, top: { kind: 'tee', col: '#38f2ff', pattern: 'tiedye' }, coat: { kind: 'fur', col: '#e8a050', trim: '#fff2d8' },
    bottom: { kind: 'kilt', col: '#4a3a6a', pattern: 'plaid' }, shoes: { kind: 'furboots', col: '#fff2d8' }, goggles: true, glasses: null, hat: null, led: '#38f2ff',
    acc: ['ledNecklace', 'bracelets'], prop: 'water', paint: null, key: 'w6:biscuit'
  });
};
BW6.buildHQ = function (api, g) {
  const H = BW6.HQ;
  api.prop('shade', { x: H.x, z: H.z, w: 8, d: 6, col: '#c86a3e' });
  api.prop('couch', { x: H.x - 1, z: H.z - 1.4, yaw: Math.PI, col: '#5a2a1a' });
  api.mesh(H.x + 5, H.z + 2, m => {
    // welding bench, propane tanks, the JELLO DEPOT fridge
    m.color('#5a5a62'); BW567K.rbox(m, 0, 0.9, 0, 2.4, 0.12, 1.0, 0.04); for (const [x, z] of [[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]]) BW567K.limb(m, x, 0, z, x, 0.88, z, 0.04);
    for (let i = 0; i < 3; i++) { m.color(i % 2 ? '#e8e8e8' : '#d8d8e0').shine(2); BW567K.lathe(m, -2.2 + i * 0.75, 0, -1.6, [[0, 0], [0.32, 0.02], [0.32, 0.9], [0.24, 1.12], [0.08, 1.2], [0.08, 1.32], [0, 1.34]], { seg: 10 }); m.shine(0); }
    m.color('#ff7ad8').shine(2); BW567K.rbox(m, 2.6, 1.0, -1.2, 1.2, 2.0, 1.0, 0.18); m.color('#ffffff'); BW567K.rbox(m, 2.6, 1.2, -0.68, 1.0, 1.4, 0.06, 0.04); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.2, hz: 0.5, y0: 0, y1: 0.96 }, { t: 'box', x: 2.6, z: -1.2, hx: 0.6, hz: 0.5, y0: 0, y1: 2.0 }, { t: 'box', x: -1.45, z: -1.6, hx: 1.2, hz: 0.35, y0: 0, y1: 1.3 }] };
  });
  api.sign('EL PULPO HQ\nWELDING · FEELINGS · PROPANE', H.x - 5, H.z + 3.4, { yaw: 0, h: 1.2, style: { bg: '#2a1408', fg: '#ff9a4a', size: 24, border: '#c86a3e', glow: '#ff7a2a' }, glow: '#ff7a2a' });
  api.sign('JELLO DEPOT\nFREE REFILLS', H.x + 7.6, H.z + 1.0, { yaw: -Math.PI / 2, y: 2.2, h: 0.8, post: false, style: { bg: '#ff7ad8', fg: '#ffffff', size: 24 } });
  api.light(H.x, H.z, 12, '#ff9a4a', 0.45);
  api.npc({ id: 'barnacle', name: 'UNCLE BARNACLE', type: 'burner', spec: BW567K.mine('burner', 61, { face: 'beard', skin: '#b88a64', hair: { style: 'long', col: '#d8d0c0', hi: '#ffffff' }, hat: { kind: 'bandana', col: '#c86a3e' }, vest: 'patches', top: { kind: 'tee', col: '#3a3438' }, bottom: { kind: 'cargo', col: '#5a4a3a' }, shoes: { kind: 'boots', col: '#3a2a1a' }, goggles: true, prop: 'water', acc: ['toolbelt'], key: 'w6:barnacle' }),
    x: H.x - 1, z: H.z - 1.2, yaw: Math.PI, behavior: 'sit', always: true,
    chat: ['Water... water...', 'She\'s on autopilot. Two days. TWO DAYS.', 'I welded every tentacle myself.'],
    talk(g, a) { BW6.talkBarnacle(g, a); } });
  api.checkpoint('cp_hq', H.x - 6, H.z - 6, { yaw: Math.PI, name: 'El Pulpo HQ' });
};
BW6.buildPyramid = function (api, g) {
  const P = BW6.PYR;
  const tiers = [[13, 2.2], [10, 2.2], [7, 2.2], [4.2, 2.2]];
  tiers.forEach(([w, h], i) => BW567K.rb(api, P.x, i * 2.2, P.z, w, h, w, i % 2 ? '#2a1a4a' : '#3a2a6a', { r: 0.35, gloss: 2, e: 0.05 }));
  api.mesh(P.x, P.z, m => {
    for (let i = 0; i < 4; i++) { const w = tiers[i][0]; m.color(BURNS_NEON[(i * 2) % 7], 1); for (const [sx, sz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) m.box(sx * (w / 2 + 0.03), i * 2.2 + 2.0, sz * (w / 2 + 0.03), sx ? 0.06 : w * 0.9, 0.12, sz ? 0.06 : w * 0.9); }
    m.color('#ffffff', 1); BW567K.ball(m, 0, 9.4, 0, 0.7); m.emissive(0);
    return { cols: [] };
  });
  api.light(P.x, P.z, 18, '#9a6bff', 0.45);
  api.pickup('photo', P.x, 9.6, P.z + 1.4, { id: 'p1' });
  api.pickup('item:jug', P.x + 4.2, 5.3, P.z + 4.2, { mission: 'water', gate: true, label: 'COLD JUG', icon: 'drop', col: '#9adcff', id: 'jug2' });
  api.pickup('bag:bufo', P.x - 8.5, 0.9, P.z + 6);
  api.glowArc(P.x + 7.5, 0.9, P.z + 7.5, P.x + 5, 2.6, P.z + 5, 1, 3); api.glowRing(P.x, P.z, 9.5, 12);
  api.checkpoint('cp_pyr', P.x + 9, P.z + 11, { yaw: Math.PI, name: 'Laser Pyramid' });
  api.npc({ type: 'ledsuit', seed: 62, name: 'LASER LARRY', x: P.x - 7.6, z: P.z + 8, lines: ['I aim the lasers. Mostly at the sky. Sometimes at my feelings.', 'From the top you can see the whole deep playa. And your mistakes.'], gift: { kind: 'glowstick', n: 6 } });
};
BW6.buildGrove = function (api, g) {
  const s = BW6.SPOTS[0];
  const art = BW567K.bigArt(api, g, 'glowshroomGrove', s.x, s.z - 6, { rotY: 0.3, night: 'auto' });   // big-art module (falls back to my own glowing mushrooms below)
  if (!art) {
    // stand-in Glowshroom Grove: giant glowing mushrooms you can bounce on (springy caps)
    const shrooms = [[-8, -10, 4.2, 3.2], [6, -14, 5.6, 4.0], [-14, 2, 3.0, 2.4], [12, -2, 3.6, 2.8], [-2, -20, 6.8, 4.6], [16, -18, 2.6, 2.2], [-18, -14, 2.2, 1.8]];
    shrooms.forEach(([dx, dz, h, r], i) => {
      const col = ['#ff4fd8', '#38f2ff', '#7aff5a', '#ffd84a', '#9a6bff'][i % 5];
      api.lathe(s.x + dx, 0, s.z + dz, [[r * 0.3, 0, '#e8e0f0'], [r * 0.24, h * 0.6, '#f4f0ff'], [r * 0.3, h * 0.92, '#f4f0ff'], [r, h * 0.95, col, 0.5], [r * 0.92, h * 1.1, col, 0.6], [r * 0.5, h * 1.28, col, 0.7], [0, h * 1.32, col, 0.75]], '#f4f0ff', { seg: 14, gloss: 2, noCol: true });
      api.collider({ t: 'cyl', x: s.x + dx, z: s.z + dz, r: r * 0.3, y0: 0, y1: h * 0.95 });
      api.collider({ t: 'cyl', x: s.x + dx, z: s.z + dz, r: r * 0.9, y0: h * 0.95, y1: h * 1.12, spring: 15 + h * 0.6 });
      api.glow(s.x + dx, h * 1.15, s.z + dz, r * 1.1, col, { blink: 1.2 });
      api.light(s.x + dx, s.z + dz, r * 3, col, 0.3);
    });
  }
  // LSD-only path up to a hidden photo
  api.pickup('bag:lsd', s.x + 14, 0.9, s.z + 8);
  api.hidden(() => { for (let i = 0; i < 6; i++) BW567K.rb(api, s.x - 24 - i * 2.6, 1.2 + i * 1.6, s.z + 6 - i * 1.4, 2.4, 0.3, 2.4, burnsHSL(280 + i * 20, 0.9, 0.62), { e: 0.6, r: 0.1 }); api.glow(s.x - 37, 10.5, s.z - 1, 2, '#ff4fd8'); });
  api.pickup('photo', s.x - 37, 10.6, s.z - 1, { id: 'p3', hidden: true });
  api.pickup('item:jug', s.x - 2, art ? 0.9 : 9.6, s.z - 20, { mission: 'water', gate: true, label: 'COLD JUG', icon: 'drop', col: '#9adcff', id: 'jug1' });
  BW6.locals(api, s, [['ledsuit', 3], ['tutu', 2], ['furry', 3], ['burner', 2]], 'easy');
  api.glowRing(s.x, s.z, 12, 14);
};
BW6.buildStables = function (api, g) {
  const s = BW6.SPOTS[1];
  // pastel tents that won't zip, piles of tulle and glitter
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, x = s.x + Math.sin(a) * 16, z = s.z + Math.cos(a) * 16; api.prop('tent', { x, z, yaw: a, col: ['#ffb0d8', '#c8a0ff', '#9adcff', '#fff0a0'][i % 4] }); BW567K.ballAt(api, x + 2, 0, z + 1, 0.9, ['#ff9ad0', '#e8d0ff', '#bff0ff'][i % 3], { squash: 0.45, noCol: true }); }
  api.sign('SPARKLE PONY STABLES\nWATER? PLEASE?', s.x, s.z + 18, { yaw: 0, h: 1.1, style: { bg: '#ffb0d8', fg: '#5a1a4a', size: 24, border: '#ffffff' } });
  BW6.locals(api, s, [['sparklepony', 7]], 'pony');
  api.pickup('bag:molly', s.x + 6, 0.9, s.z - 6);
  api.light(s.x, s.z, 14, '#ff9ad0', 0.35);
};
BW6.buildSolar = function (api, g) {
  const s = BW6.SPOTS[3];
  // solar grid
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) api.mesh(s.x + 8 + i * 5, s.z - 12 + j * 7, m => { m.color('#9aa0aa'); BW567K.limb(m, 0, 0, 0, 0, 1.4, 0, 0.06); m.push(); m.tf(0, 1.5, 0, 0, -0.5); m.color('#1a2a6a').shine(3); BW567K.rbox(m, 0, 0, 0, 4.2, 0.08, 2.4, 0.04); m.color('#5a7ab8'); for (let k = 1; k < 4; k++) m.box(-2.1 + k * 1.05, 0.05, 0, 0.02, 0.01, 2.3); m.shine(0); m.pop(); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 1.4 }] }; });
  // the private satellite internet dish
  api.mesh(s.x - 8, s.z - 10, m => {
    m.color('#d8dce4').shine(2); BW567K.rcyl(m, 0, 0, 0, 0.6, 3.2, 0.1);
    m.push(); m.tf(0, 3.6, 0, 0.6, -0.9); BW567K.lathe(m, 0, 0, 0, [[0, 0], [1.6, 0.45], [3.0, 1.2], [3.1, 1.3], [2.9, 1.25], [1.5, 0.5], [0, 0.08]], { seg: 20 }); m.color('#3a3a44'); BW567K.limb(m, 0, 0.1, 0, 0, 2.2, 0, 0.06); m.color('#38f2ff', 1); BW567K.ball(m, 0, 2.3, 0, 0.18); m.pop(); m.shine(0).emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 3.4 }] };
  });
  api.pickup('photo', s.x - 8, 6.8, s.z - 10, { id: 'p2' });
  BW567K.rb(api, s.x - 5.6, 0, s.z - 7.4, 1.6, 1.6, 1.6, '#3a3a44', { r: 0.2 }); BW567K.rb(api, s.x - 6.6, 0, s.z - 9.0, 1.4, 3.1, 1.4, '#2a2a34', { r: 0.2 });
  api.glowArc(s.x - 5.6, 2.2, s.z - 7.4, s.x - 8, 6.4, s.z - 10, 1, 4);
  // server tents + a sign
  for (let i = 0; i < 3; i++) api.prop('dome', { x: s.x + 2 + i * 9, z: s.z + 14, r: 3.4, col: '#e8eef4', glow: '#38f2ff', lights: true });
  api.sign('SOLAR BRO FARM\nZERO CELLULAR FRICTION', s.x - 2, s.z + 18, { yaw: 0, h: 1.1, style: { bg: '#0a1a2a', fg: '#38f2ff', size: 24, border: '#38f2ff', glow: '#38f2ff' }, glow: '#38f2ff' });
  api.pickup('item:jug', s.x + 14, 0.9, s.z + 4, { mission: 'water', gate: true, label: 'COLD JUG', icon: 'drop', col: '#9adcff', id: 'jug3' });
  api.light(s.x, s.z, 16, '#38c8ff', 0.3);
  // Preston rides his custom e-bike in circles; Bryce unicycles alongside, pitching
  const circ = (r, n, off) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + off; p.push([s.x - 8 + Math.sin(a) * r, s.z - 10 + Math.cos(a) * r]); } return p; };
  api.npc({ id: 'preston', name: 'PRESTON, TURNKEY BILLIONAIRE', type: 'billionaire', seed: 1, x: s.x - 8, z: s.z - 1, behavior: 'walk', path: circ(9, 14, 0), speed: 3.2, walkAnim: 'bike',
    chat: ['Radically inclusive art car? I\'ll buy it. All of it.', 'Bryce, I said NO blockchain. ...Unless it\'s a gold blockchain.', 'My jet has a hot tub. Your octopus has a hot tub. We\'re the same.'],
    lines: ['Is that YOUR octopus? I\'ll give you a billion dollars and a lanyard.', 'No? Radical. Very radical. Security! ...Oh, I didn\'t bring them out here.'] });
  api.npc({ id: 'bryce', name: 'BRYCE, OPTIMIZER', type: 'techbro', seed: 801, x: s.x - 8, z: s.z - 3, behavior: 'walk', path: circ(7, 14, 0.25), speed: 2.6, walkAnim: 'bw6Uni', uni: 6,
    chat: ['Preston! Picture it: an octopus... on the BLOCKCHAIN.', 'It\'s like Uber, but for dust.', 'A drum circle is just decentralized community architecture.', 'My heart-rate variability LOVES this dust storm.'],
    lines: ['This week is a networking opportunity with zero cellular friction.', 'Want in on the seed round? It\'s a DAO for shade structures. Yes, I\'m on a unicycle. It\'s optimized.'] });
  BW6.locals(api, s, [['techbro', 4]], 'intern');
};
BW6.buildCrusty = function (api, g) {
  const s = BW6.SPOTS[2];
  api.mesh(s.x - 10, s.z - 8, m => { // junk sculpture: a welded totem of hubcaps and bike wheels
    m.color('#6a4a3a'); BW567K.limb(m, 0, 0, 0, 0, 6, 0, 0.18);
    for (let i = 0; i < 6; i++) { m.push(); m.tf(0, 1 + i * 0.9, 0, i * 0.7, Math.PI / 2); m.color(i % 2 ? '#9a8a7a' : '#7a5a4a').shine(2); BW567K.torus(m, 0, 0, 0, 0.7 - i * 0.05, 0.06, { seg: 12, tseg: 4 }); m.pop(); }
    m.shine(0); m.color('#ffd84a', 0.8); BW567K.ball(m, 0, 6.3, 0, 0.35); m.emissive(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.4, y0: 0, y1: 6 }] };
  });
  api.prop('bus', { x: s.x + 12, z: s.z - 10, yaw: 0.6, seed: 602, col: '#8a6a3a' });
  api.prop('dome', { x: s.x + 6, z: s.z + 12, r: 4, col: '#c8b8a0', lights: true });
  api.sign('CRUSTY CORNER\nEST. BEFORE YOU', s.x - 4, s.z + 16, { yaw: 0, h: 1.0, style: { bg: '#5a4a3a', fg: '#f4e8c8', size: 24, border: '#f4e8c8' } });
  api.npc({ id: 'crustyvet', name: 'CRUSTY CARL', type: 'crusty', seed: 62, x: s.x - 6, z: s.z - 4, yaw: -0.6, always: true,
    chat: ['TOO CORPORATE!', 'This was all better on Baker Beach.', 'Warm beer is a lifestyle, kid.'],
    talk(g, a) { BW6.talkCrusty(g, a); } });
  BW6.locals(api, s, [['crusty', 5]], 'crusty');
  api.fire(s.x + 2, 0, s.z - 2, 0.5);
  api.pickup('bag:shrooms', s.x + 14, 0.9, s.z + 2);
};
BW6.buildGarden = function (api, g) {
  const G = BW6.GARDEN, S = BW6.state;
  for (let i = 0; i < 6; i++) {
    const a = i / 6 * TAU + 0.2, x = G.x + Math.sin(a) * 10, z = G.z + Math.cos(a) * 10;
    api.mesh(x, z, m => { m.color('#4a3a44').shine(2); BW567K.lathe(m, 0, 0, 0, [[0.5, 0], [0.18, 0.4], [0.14, 2.4], [0.5, 2.7], [0.95, 3.1], [1.1, 3.25], [0.95, 3.3], [0, 3.25]], { seg: 12 }); m.shine(0); m.color('#ff7a2a', 0.3); BW567K.torus(m, 0, 3.22, 0, 0.98, 0.06, { seg: 14, tseg: 4 }); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.35, y0: 0, y1: 3.2 }] }; });
    S.lilies.push({ x, z, y: 3.3, lit: false });
  }
  api.sign('THE FIRE GARDEN\nBRING YOUR OWN DRAGON', G.x, G.z + 14, { yaw: 0, h: 1.0, style: { bg: '#2a0a0a', fg: '#ff8a2a', size: 24, border: '#ff4a1a' } });
  api.marker('garden', G.x, G.z, 'Fire Garden', { col: '#ff7a2a' });
  api.glowRing(G.x, G.z, 5, 8);
};
BW6.buildRamp = function (api, g) {
  const Rm = BW6.RAMP;
  // the dune ramp: rises toward the north (-z) to a 2.8 m wooden kicker
  api.mesh(Rm.x, Rm.z, m => {
    m.color('#d8b890'); m.push(); m.tf(0, 1.25, 0, 0, 0.27); BW567K.rbox(m, 0, 0, 0, 9, 0.5, 10.4, 0.25); m.pop();
    m.color('#8a6a3a'); m.push(); m.tf(0, 2.5, -5.1, 0, 0.32); m.box(0, 0, 0, 8.6, 0.2, 1.6, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] }); m.pop();
    m.color('#ffd84a', 0.8); for (let i = 0; i < 6; i++) m.box(-4 + i * 1.6, 2.85, -5.6, 0.4, 0.1, 0.1); m.emissive(0);
    m.color('#c8a880'); BW567K.ellip(m, 0, 0, 2, 6, 1.0, 4, { phi1: Math.PI / 2 });
    return { cols: [{ t: 'ramp', x: 0, z: 0, hx: 4.5, hz: 5.2, y0: 0, ya: 0.05, yb: 2.8, yaw: Math.PI, solid: false }] };
  });
  api.sign('BAD IDEA RAMP\nYOU\'LL BE FINE*', Rm.x + 6.5, Rm.z + 6, { yaw: -0.4, h: 1.0, style: { bg: '#ffd84a', fg: '#2a1a0a', size: 24, border: '#2a1a0a' } });
  api.sign('*NOT A GUARANTEE', Rm.x + 6.5, Rm.z + 6.1, { y: 0.5, h: 0.5, post: false, yaw: -0.4, style: { bg: '#ffd84a', fg: '#c8202a', size: 24 } });
  api.npc({ id: 'badidea', name: 'BAD IDEA GUY', type: 'badideaguy', seed: 1, x: Rm.x + 4.2, z: Rm.z + 5, yaw: -0.5,
    chat: ['Hmm. What if... we made it HIGHER?', 'My arm? Unrelated ramp incident. Totally different ramp.', 'Every bad idea is just a good idea that hasn\'t happened yet.'],
    talk(g, a) { BW6.talkBadIdea(g, a); } });
  api.glowLine(Rm.x, Rm.z + 18, Rm.x, Rm.z + 7, 5);
  try { api.prop('junktower', { x: Rm.x - 14, z: Rm.z + 8, seed: 66 }); } catch (e) { /* older engine: no junk tower */ }
};
BW6.buildEmpty = function (api, g) {
  const s = BW6.SPOTS[4];
  // the edge of everything: a few lonely lamp posts + Chad's pop-up "HQ"
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = s.x + Math.sin(a) * 26, z = s.z + Math.cos(a) * 26; BW567K.post(api, x, 0, z, 0.12, 3.4, '#2a2a30', { col: { camPass: true } }); api.glow(x, 3.5, z, 0.9, '#ffd8a0'); }
  api.mesh(s.x + 18, s.z - 18, m => { m.color('#f4f4f8').shine(2); BW567K.rbox(m, 0, 1.6, 0, 6, 3.2, 2, 0.3); m.shine(0); const reg = BURNS_ATLAS.sign('CHADCO\nOCTOPUS-AS-A-SERVICE', { bg: '#1a2a5a', fg: '#ffffff', size: 24, pad: 10 }); m.color('#ffffff', 0.5); m.decal(0, 1.8, 1.02, 5.4, 5.4 / reg.aspect, reg); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 3, hz: 1, y0: 0, y1: 3.2, cover: true }] }; }, { yaw: -0.7 });
  api.checkpoint('cp_empty', s.x - 12, s.z + 22, { yaw: Math.PI, name: 'The Big Empty' });
  api.pickup('water', s.x - 8, 0.9, s.z + 14); api.pickup('water', s.x + 10, 0.9, s.z + 8);
  api.pickup('bag:powder', s.x - 20, 0.9, s.z - 4);
  // Chad (waits for your biggest party)
  const spec = BW567K.mine('techbro', 666, { kind: 'chad', face: 'smug', glasses: 'shades', beard: null, goggles: false, hat: null, hair: { style: 'short', col: '#e8c860', hi: '#fff0b0' }, top: { kind: 'button', col: '#ffffff' }, vest: 'fleece', vestCol: '#1a1a24', bottom: { kind: 'chinos', col: '#c8b48a' }, acc: ['headset', 'bracelets'], prop: 'phone', body: { h: 1.04, w: 1.12 } });
  api.enemy({ id: 'chad', name: 'CHAD, FOUNDER & CEO', type: 'techbro', spec, scale: 1.35, x: s.x + 14, z: s.z - 14, yaw: -0.7, behavior: 'bw6Chad', hp: 4, boss: true, drop: 14, always: true, chatter: false, keepBehavior: true, uni: 7,
    onDefeat(g2) { BW6.chadDefeated(g2); } });
};
// local party crowd around a spot: [[type, n], ...]
BW6.locals = function (api, s, list, kind) {
  let k = 0;
  for (const [type, n] of list) for (let i = 0; i < n; i++, k++) {
    const a = (k * 2.399) % TAU, d = 6 + (k * 3.7) % (s.r * 0.5);
    api.npc({ id: 'pg_' + s.id + k, type, seed: 900 + hashStr(s.id) % 50 + k, x: s.x + Math.sin(a) * d, z: s.z + Math.cos(a) * d, yaw: a, behavior: k % 3 ? 'wander' : 'dance', radius: 7, style: k % 6,
      partyKind: kind, spot: s.id, partyGoer: true,
      chat: BW6.CHAT[kind], talk(g, a2) { BW6.talkPartygoer(g, a2); } });
  }
};
BW6.CHAT = {
  easy: ['Is there a party? There\'s ALWAYS a party.', 'My LEDs are at 4%. Let\'s DANCE.', 'I go where the bass goes.'],
  pony: ['Can I have some water? And a jello shot? And your hat?', 'Good vibes are a currency, right?', 'I brought three suitcases. Zero cups.'],
  crusty: ['Art cars these days. Too much LED, not enough rust.', 'I only dance to things older than me.', 'This was better on Baker Beach.'],
  intern: ['I\'m an intern at a stealth startup. Very stealth. No product.', 'Is this party... scalable?', 'My manager says dancing isn\'t billable.']
};
BW6.buildWanderers = function (api, g) {
  // darkwads: no lights, ever. Only headlights (or getting close) reveal them.
  const dw = [[-30, 60], [40, 20], [-60, -60], [30, -100], [80, -30]];
  dw.forEach(([x, z], i) => api.npc({ id: 'darkwad' + i, name: 'DARKWAD', type: 'darkwad', seed: i, x, z, behavior: 'darkwad', radius: 22, chatter: false, darkwad: true,
    lines: ['Lights? Nah. I\'m a minimalist.', 'You saw me? Ugh. Must be your headlights.', 'I\'m not invisible. You\'re just not looking hard enough.'] }));
  // Burney: the bunny-eared cowboy party photographer
  api.npc({ id: 'burney', name: 'BURNEY', type: 'burney', seed: 1, x: -40, z: 70, behavior: 'wander', radius: 10, always: true,
    chat: ['Hold it! Big smile! BIGGER!', 'This one\'s going in the scrapbook.', 'Pose like you mean it!'],
    talk(g, a) { BW6.talkBurney(g, a); } });
  // a few free-range party people between the spots
  const free = [['burner', -40, -20], ['tutu', 50, 60], ['furry', 20, -60], ['ledsuit', -70, -10], ['burner', 60, -20], ['sparklepony', -20, -90]];
  free.forEach(([t, x, z], i) => api.npc({ id: 'pg_free' + i, type: t, seed: 950 + i, x, z, behavior: 'wander', radius: 14, partyKind: 'easy', partyGoer: true, chat: BW6.CHAT.easy, talk(g, a) { BW6.talkPartygoer(g, a); } }));
  // tech bros on electric unicycles (enemies: pitch bubbles + they try to unplug your party)
  const bros = [[96, 20], [112, 46], [86, 48], [70, 0], [120, 10], [30, -30]];
  bros.forEach(([x, z], i) => api.enemy({ id: 'unibro' + i, name: 'TECH BRO', type: 'techbro', seed: 70 + i, x, z, behavior: 'bw6Unibro', hp: 2, drop: 3, uni: i, tag: 'unibro', defeatLine: ['Fine. I\'ll circle back.', 'My unicycle needs a firmware update.', 'Pivoting... to dancing.'][i % 3],
    pitches: ['UBER FOR DUST!', 'AI FOR VIBES!', 'WEB3 TENTS!', 'SYNERGY!', 'OCTOPUS AS A SERVICE!', 'TERMS OF SERVICE!'] }));
  // glow sticks scattered along the dark routes
  api.glowLine(-20, 100, -60, 60, 10); api.glowLine(60, 40, 90, 10, 8); api.glowLine(-40, -60, -80, -80, 9); api.glowLine(40, -80, 90, -90, 9); api.glowLine(-10, -70, -5, -105, 7);
  api.glowArc(-88, 1.5, 20, -94, 7, 10, 2.5, 6);
  api.pickup('water', 60, 0.9, 20); api.pickup('water', -60, 0.9, 0); api.pickup('water', 20, 0.9, -110); api.pickup('bag:weed', -110, 0.9, -40); api.pickup('bag:khole', 120, 0.9, -60);
};

/* ============================================================ El Pulpo ============================================================ */
BW6.buildOcto = function (api, g) {
  const S = BW6.state, p0 = BW6.PATH[0];
  const car = api.artCar({ x: p0[0], z: p0[1], yaw: Math.PI, label: 'DRIVE EL PULPO', maxSpeed: 9, accel: 3.4, turn: 1.0, path: BW6.PATH, pathSpeed: 3.6,
    build: m => BW6.octoBody(m), when: g2 => !!BW6.state.keys && !BW567K.busy(g2) });
  S.car = car;
  // jump physics + silly horn: extend this one car's ride()
  const ride0 = car.ride.bind(car);
  car.ride = function (p, dt) { ride0(p, dt); BW6.carAir(g, this, p, dt); };
  // the hot-tub party trailer (walkable mover, towed)
  const tr = api.mover(m => BW6.trailerMesh(m));
  S.trailer = tr;
  BW6.placeTrailer(g, true);
};
// El Pulpo's body: the shared octopus design when the W8 library is loaded, plus World 6's party upgrades
BW6.octoBody = function (m) {
  let info = null;
  try {
    if (typeof BurnsW8910Pulpo !== 'undefined' && BurnsW8910Pulpo && BurnsW8910Pulpo.body) {
      const t = new BurnsMesh(8192); t.setBone(m.bone);
      const inf = BurnsW8910Pulpo.body(t, {});
      if (inf && inf.cols && inf.seat && t.nv > 100 && t.nv < 40000) { m.append(t); info = inf; }
    }
  } catch (e) { info = null; }
  if (!info) info = BW6.octoBodyOwn(m);
  const Mz = BW6.MANTLE.z, My = BW6.MANTLE.y;
  // a third googly eye, glued on "for luck" (the pupil is a wobbly puppet bone)
  m.color('#ffffff', 0.15).shine(3); m.push(); m.tf(0, My + 3.75, Mz + 2.58, 0, -0.45); BW567K.ellip(m, 0, 0, 0, 0.62, 0.62, 0.22); m.pop(); m.emissive(0);
  m.color('#e8e8f0'); m.push(); m.tf(0, My + 3.75, Mz + 2.6, 0, -0.45); BW567K.torus(m, 0, 0, 0.1, 0.6, 0.06, { seg: 18, tseg: 5, sy: 1 }); m.pop(); m.shine(0);
  // a party hat, cocked at a jaunty angle
  m.push(); m.tf(1.25, My + 5.0, Mz + 0.7, 0, 0.15, -0.55);
  const stripes = []; for (let i = 0; i <= 8; i++) { const c = i % 2 ? '#ff4fd8' : '#ffd84a'; stripes.push([0.75 * (1 - i / 8) + 0.02, i * 0.22, c, 0.25]); stripes.push([0.75 * (1 - (i + 0.98) / 8) + 0.02, (i + 0.98) * 0.22, c, 0.25]); }
  m.color('#ffd84a').shine(2); BW567K.lathe(m, 0, 0, 0, stripes.slice(0, 17), { seg: 14 }); m.color('#38f2ff', 0.5); BW567K.ball(m, 0, 1.95, 0, 0.26); m.emissive(0).shine(0);
  m.pop();
  // a ridiculous brass party horn (sousaphone bell) on the left flank
  m.color('#e8b840').shine(3); m.push(); m.tf(-2.05, 2.2, 2.2, -1.2, -1.0, 0); BW567K.lathe(m, 0, 0, 0, [[0.12, 0], [0.14, 0.8], [0.22, 1.2], [0.5, 1.5], [0.95, 1.62], [0.98, 1.66], [0.6, 1.6], [0.1, 1.5]], { seg: 14 }); m.pop(); m.shine(0);
  // sucker steps spiralling up the back of the head + the big red KILL SWITCH on top
  const cols = info.cols.slice(), steps = [];
  for (let k = 0; k < 7; k++) {
    const a = Math.PI - k * 0.4, r = 2.92, x = Math.sin(a) * r, z = Mz + Math.cos(a) * r, y = 2.55 + k * 0.72;
    m.color(BW6.COL.belly).shine(2); m.push(); m.tf(x, y - 0.12, z, a); BW567K.rcyl(m, 0, -0.1, 0, 0.5, 0.22, 0.09); m.color('#d89a80'); BW567K.torus(m, 0, 0.1, 0, 0.32, 0.05, { seg: 12, tseg: 4 }); m.pop(); m.shine(0);
    cols.push({ t: 'box', x, z, hx: 0.48, hz: 0.42, y0: y - 0.25, y1: y, yaw: a });
    steps.push([x, y, z]);
  }
  m.color('#3a3a44'); BW567K.rcyl(m, 0, My + 5.15, Mz + 1.75, 0.16, 0.5, 0.05);
  m.color('#ff2a2a', 0.5).shine(3); BW567K.lathe(m, 0, My + 5.6, Mz + 1.75, [[0, 0], [0.42, 0.02], [0.46, 0.14], [0.36, 0.26], [0, 0.3]], { seg: 14 }); m.emissive(0).shine(0);
  BW6.STEPS = steps;
  info.cols = cols;
  info.top = info.top || 1.6;
  return info;
};
// stand-in body in the same visual language (used when the shared octopus library isn't loaded)
BW6.octoBodyOwn = function (m) {
  const C = BW6.COL, Mz = BW6.MANTLE.z, My = BW6.MANTLE.y;
  m.color('#2c2630'); BW567K.rbox(m, 0, 0.9, 0, 3.9, 0.62, 8.6, 0.24);
  for (const wz of [2.85, 0, -2.85]) for (const sx of [1, -1]) { m.push(); m.tf(sx * 1.98, 0.62, wz, 0, 0, Math.PI / 2); m.color('#1a1a1e'); BW567K.rcyl(m, 0, -0.25, 0, 0.62, 0.5, 0.15); m.color('#c8843e'); BW567K.rcyl(m, 0, -0.27, 0, 0.3, 0.54, 0.05); m.pop(); }
  m.color('#6a4630'); BW567K.rbox(m, 0, 1.45, 0.05, 4.3, 0.28, 9.1, 0.12, { top: '#8a6040' });
  for (let i = 0; i < 16; i++) { const z = -4.2 + i * 0.56; m.color(BURNS_NEON[i % 7], 1); m.box(2.19, 1.0, z, 0.04, 0.09, 0.28); m.box(-2.19, 1.0, z, 0.04, 0.09, 0.28); } m.emissive(0);
  m.color('#3a1a2a'); BW567K.rbox(m, 0, 1.92, 3.25, 0.9, 0.5, 0.8, 0.16); BW567K.rbox(m, 0, 2.42, 2.92, 0.9, 0.9, 0.22, 0.1);
  m.color('#c8843e').shine(2); m.push(); m.tf(0, 2.36, 3.72, 0, -0.9, 0); BW567K.torus(m, 0, 0, 0, 0.3, 0.045, { seg: 14, tseg: 5 }); m.pop(); m.shine(0);
  m.color('#fff4d0', 1); BW567K.rbox(m, 1.5, 1.2, 4.6, 0.4, 0.22, 0.08, 0.04); BW567K.rbox(m, -1.5, 1.2, 4.6, 0.4, 0.22, 0.08, 0.04); m.emissive(0);
  m.color(C.copper).shine(2);
  BW567K.lathe(m, 0, My, Mz, [[0, 0, C.copperDk], [2.0, 0.02, C.copperDk], [2.6, 0.55, C.copper], [2.86, 1.6, C.copper], [2.78, 2.9, C.copper], [2.36, 4.1, '#d4784a'], [1.62, 5.05, C.copperLt], [0.75, 5.55, C.copperLt], [0, 5.68, C.copperLt]], { seg: 26 });
  m.color(C.patina); BW567K.torus(m, 0, My + 1.25, Mz, 2.86, 0.13, { seg: 28, tseg: 6 }); m.shine(0);
  m.color('#a85230'); for (const [a, yy, r] of [[0.9, 3.4, 0.42], [2.3, 2.6, 0.55], [-2.0, 3.6, 0.36], [3.0, 3.9, 0.48], [-2.9, 2.4, 0.45]]) { const rr = 2.72 - Math.max(0, yy - 3) * 0.55; m.push(); m.tf(Math.sin(a) * rr, My + yy, Mz + Math.cos(a) * rr, a, -0.25, 0); BW567K.ellip(m, 0, 0, 0, r, r * 0.22, r, { seg: 10, rings: 5 }); m.pop(); }
  for (const sx of [1, -1]) {
    const ex = sx * 1.12, ey = My + 2.55, ez = Mz + 2.42;
    m.color(C.copperDk).shine(2); m.push(); m.tf(ex, ey + 0.12, ez - 0.05, sx * 0.42, -0.2, 0); BW567K.ellip(m, 0, 0, 0, 0.86, 0.7, 0.86); m.pop();
    m.color('#fbf6ec', 0.25).shine(3); BW567K.ball(m, ex, ey, ez + 0.18, 0.72); m.emissive(0);
    m.color('#14101a'); BW567K.ellip(m, ex + sx * 0.08, ey - 0.02, ez + 0.66, 0.36, 0.45, 0.36); m.shine(0);
  }
  m.color('#3a3036'); BW567K.lathe(m, 0, My + 5.55, Mz, [[0, 0], [0.55, 0], [0.55, 0], [0.42, 0.8], [0.42, 0.8], [0, 0.8]], { seg: 14 });
  m.color('#ffb040', 0.6); BW567K.torus(m, 0, My + 6.36, Mz, 0.48, 0.09, { seg: 16, tseg: 5 }); m.emissive(0);
  const lights = [{ x: 0, y: My + 6.4, z: Mz, s: 2.6, c: '#ffb040' }, { x: 1.5, y: 1.2, z: 4.7, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -1.5, y: 1.2, z: 4.7, s: 1.1, c: '#fff0c8', beam: 0 }];
  const cols = [{ t: 'box', x: 0, z: 0.05, hx: 2.15, hz: 4.55, y0: 0, y1: 1.6, cover: true }, { t: 'cyl', x: 0, z: Mz, r: 2.6, y0: 1.6, y1: My + 5.2, cover: true }, { t: 'box', x: 0, z: 4.35, hx: 1.2, hz: 0.2, y0: 1.6, y1: 2.15, walk: false }];
  return { cols, lights, seat: [0, 1.62, 3.28], poofers: [[0, My + 6.3, Mz], [1.95, 2.5, 4.2], [-1.95, 2.5, 4.2]], w: 4.3, len: 9.1, top: 1.6 };
};
// the trailer: local +Z faces the octopus. Deck at 1.25 m. Hot tub at the back, DJ booth up front.
BW6.trailerMesh = function (m) {
  const D = 1.25;
  m.color('#2a2630'); BW567K.rbox(m, 0, 0.75, 0, 3.4, 0.4, 6.6, 0.15);
  for (const z of [-1.4, 1.4]) for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.72, 0.5, z, 0, 0, Math.PI / 2); m.color('#1a1a1e'); BW567K.rcyl(m, 0, -0.2, 0, 0.5, 0.4, 0.12); m.color('#ff4fd8', 0.6); BW567K.rcyl(m, 0, -0.22, 0, 0.22, 0.44, 0.04); m.emissive(0); m.pop(); }
  m.color('#6a4630'); m.box(0, D - 0.06, 0, 3.6, 0.12, 6.8, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] });
  for (let i = 0; i < 14; i++) { m.color(BURNS_NEON[i % 7], 1); m.box(1.81, 0.95, -3.2 + i * 0.5, 0.03, 0.08, 0.22); m.box(-1.81, 0.95, -3.2 + i * 0.5, 0.03, 0.08, 0.22); } m.emissive(0);
  // tongue + hitch
  m.color('#3a3a44'); BW567K.limb(m, -0.9, 0.62, 3.3, 0, 0.62, 4.95, 0.07); BW567K.limb(m, 0.9, 0.62, 3.3, 0, 0.62, 4.95, 0.07);
  // the hot tub ("THE INK TANK")
  m.color('#c86a3e').shine(2); BW567K.lathe(m, 0, D, -1.7, [[1.45, 0], [1.5, 0.75], [1.62, 0.85], [1.62, 0.92], [1.2, 0.92], [1.15, 0.7]], { seg: 22 }); m.shine(0);
  m.color('#38e8ff', 0.75).shine(3); m.disc(0, D + 0.72, -1.7, 1.18, 20); m.emissive(0).shine(0);
  // couch on the right
  m.color('#ff4fd8'); BW567K.rbox(m, -1.25, D + 0.25, 0.9, 0.9, 0.45, 2.2, 0.18); BW567K.rbox(m, -1.6, D + 0.65, 0.9, 0.25, 0.75, 2.2, 0.12);
  // DJ booth base + a crate step
  m.color('#1a1420'); BW567K.rbox(m, 0.3, D + 0.5, 2.4, 1.6, 1.0, 1.2, 0.2);
  m.color('#c89a60'); BW567K.rbox(m, -1.3, D + 0.35, 3.15, 0.9, 0.7, 0.9, 0.08);
  // tailgate ramp (back)
  m.push(); m.tf(0, D / 2, -4.75, 0, -0.42); m.color('#5a5a62'); BW567K.rbox(m, 0, 0, 0, 3.0, 0.14, 3.0, 0.05); m.color('#ffd84a'); for (let i = 0; i < 5; i++) m.box(0, 0.08, -1.2 + i * 0.6, 2.8, 0.02, 0.12); m.pop();
  const sign = BURNS_ATLAS.sign('THE INK TANK\nHOT TUB · DJ · JELLO', { bg: '#2a1020', fg: '#ff9ad8', size: 24, pad: 8 });
  m.color('#ffffff', 0.5); m.push(); m.tf(1.82, D - 0.35, -1.2, Math.PI / 2); m.decal(0, 0, 0, 2.6, 2.6 / sign.aspect, sign); m.pop(); m.push(); m.tf(-1.82, D - 0.35, -1.2, -Math.PI / 2); m.decal(0, 0, 0, 2.6, 2.6 / sign.aspect, sign); m.pop(); m.emissive(0);
  const cols = [
    { t: 'box', x: 0, z: 0, hx: 1.8, hz: 3.4, y0: 0, y1: D },
    { t: 'cyl', x: 0, z: -1.7, r: 1.62, y0: D, y1: D + 0.7 },
    { t: 'box', x: -1.3, z: 0.9, hx: 0.45, hz: 1.1, y0: D, y1: D + 0.48 },
    { t: 'box', x: 0.3, z: 2.4, hx: 0.8, hz: 0.6, y0: D, y1: D + 1.0 },
    { t: 'box', x: -1.3, z: 3.15, hx: 0.45, hz: 0.45, y0: D, y1: D + 0.7 },
    { t: 'ramp', x: 0, z: -4.85, hx: 1.5, hz: 1.45, y0: 0, ya: 0.05, yb: D }
  ];
  const lights = [{ x: 0, y: D + 0.8, z: -1.7, s: 2.2, c: '#38e8ff' }, { x: 1.9, y: 0.9, z: 0, s: 1, c: '#ff4fd8' }, { x: -1.9, y: 0.9, z: 0, s: 1, c: '#38f2ff' }];
  return { cols, lights };
};
BW6.placeTrailer = function (g, snap) {
  const S = BW6.state, c = S.car, tr = S.trailer; if (!tr) return;
  const hx = c.x + Math.sin(c.yaw) * -4.95, hz = c.z + Math.cos(c.yaw) * -4.95;
  if (snap || Math.hypot(tr.x - c.x, tr.z - c.z) < 7.5) { tr.x = hx - Math.sin(c.yaw) * 4.95; tr.z = hz - Math.cos(c.yaw) * 4.95; tr.yaw = c.yaw; }
  const dx = hx - tr.x, dz = hz - tr.z, d = Math.hypot(dx, dz) || 1;
  tr.yaw = Math.atan2(dx, dz); tr.x = hx - dx / d * 4.95; tr.z = hz - dz / d * 4.95;
  tr.y = g.world.height(tr.x, tr.z) + (S.jump ? S.jump.y * 0.55 : 0);
};
BW6.parkOcto = function (g, x, z, yaw) {
  const c = BW6.state.car; c.x = x; c.z = z; c.yaw = yaw; c.speed = 0; c.parked = true; c.y = g.world.height(x, z); c.syncMover(); BW6.placeTrailer(g, true);
};
// trailer-local -> world
BW6.tw = function (lx, ly, lz) { const t = BW6.state.trailer, c = Math.cos(t.yaw), s = Math.sin(t.yaw); return [t.x + lx * c + lz * s, t.y + ly, t.z - lx * s + lz * c]; };
BW6.cw = function (lx, ly, lz) { const t = BW6.state.car, c = Math.cos(t.yaw), s = Math.sin(t.yaw); return [t.x + lx * c + lz * s, t.y + ly, t.z - lx * s + lz * c]; };

/* ---------------- tentacles, party bits, unicycles, drones, accessories (puppets) ---------------- */
BW6.TROOTS = [[0.62, 0.9], [-0.62, 0.9], [1.35, 1.0], [-1.35, 1.0], [2.05, 1.05], [-2.05, 1.05], [2.75, 1.1], [-2.75, 1.1]];
BW6.makePuppets = function (g) {
  const S = BW6.state, C = BW6.COL;
  // 8 tentacles x 2 segments (some tips hold jello shots)
  const tGeo = BW567K.geo('w6tent', m => {
    for (let i = 0; i < 8; i++) {
      const L = BW6.TROOTS[i][1];
      m.setBone(i * 2); m.shine(2);
      m.color(i % 2 ? C.copper : '#d47448'); BW567K.tube(m, [[0, 0, 0], [0, -0.05, 0.9 * L], [0, -0.04, 1.8 * L], [0, 0, 2.5 * L]], [0.48, 0.42, 0.36, 0.3], { seg: 10, cap: false });
      m.color(C.belly); for (let k = 0; k < 4; k++) BW567K.ellip(m, 0, -0.34 + k * 0.03, 0.4 + k * 0.6 * L, 0.16 - k * 0.015, 0.06, 0.16 - k * 0.015, { seg: 8, rings: 4 });
      m.setBone(i * 2 + 1);
      m.color(i % 2 ? '#d47448' : C.copper); BW567K.tube(m, [[0, 0, -0.05], [0, 0.0, 0.8 * L], [0, 0.18, 1.55 * L], [0, 0.6, 2.0 * L], [0, 0.95, 1.85 * L]], [0.3, 0.24, 0.17, 0.11, 0.07], { seg: 9 });
      m.color(C.belly); for (let k = 0; k < 3; k++) BW567K.ellip(m, 0, -0.22 + k * 0.06, 0.3 + k * 0.55 * L, 0.11, 0.05, 0.11, { seg: 8, rings: 4 });
      m.shine(0);
      if (i < 4) { m.color(['#ff4fd8', '#7aff5a', '#ffd84a', '#38f2ff'][i], 0.45).shine(3); BW567K.rbox(m, 0, 1.12, 1.82 * L, 0.2, 0.18, 0.2, 0.06); m.color('#f4f4f8', 0); BW567K.lathe(m, 0, 0.98, 1.82 * L, [[0.09, 0], [0.12, 0.14], [0, 0.15]], { seg: 8 }); m.emissive(0).shine(0); }
    }
  });
  const tent = new BW567Puppet(g, tGeo, 16); S.tent = tent; g.addBoss(tent);
  // party bits: 0 googly pupil, 1 disco ball, 2/3 speakers, 4 DJ booth top (decks), 5 light rig
  const pGeo = BW567K.geo('w6party', m => {
    m.setBone(0); m.color('#101014').shine(3); BW567K.ellip(m, 0, 0, 0, 0.26, 0.26, 0.1); m.shine(0);
    m.setBone(1); m.color('#d8e0ec', 0.2).shine(3); BW567K.ball(m, 0, 0, 0, 0.55, { uvFn: null }); m.color('#9aa0aa'); BW567K.limb(m, 0, 0.5, 0, 0, 1.4, 0, 0.02); m.emissive(0).shine(0);
    for (const b of [2, 3]) { m.setBone(b); m.color('#141418').shine(1); BW567K.rbox(m, 0, 1.1, 0, 1.0, 2.2, 0.9, 0.14); for (const [y, r] of [[1.6, 0.34], [0.65, 0.4]]) { m.color('#3a3a44'); m.push(); m.tf(0, y, 0.46, 0, Math.PI / 2); BW567K.torus(m, 0, 0, 0, r, 0.05, { seg: 14, tseg: 4 }); m.color('#ff4fd8', 0.6); m.cyl(0, -0.02, 0, r * 0.4, r * 0.4, 0.03, 12, {}); m.pop(); } m.emissive(0).shine(0); }
    m.setBone(4); // the decks: two glowing platters + a mixer, facing +x
    m.color('#2a2030').shine(2); BW567K.rbox(m, 0, 0.05, 0, 1.3, 0.12, 1.0, 0.05);
    for (const z of [-0.3, 0.3]) { m.color('#1a1a1e'); BW567K.rcyl(m, 0.02, 0.1, z, 0.22, 0.04, 0.01); m.color('#38f2ff', 0.9); BW567K.torus(m, 0.02, 0.15, z, 0.2, 0.012, { seg: 14, tseg: 3 }); m.color('#ff4fd8', 1); BW567K.ball(m, 0.02, 0.15, z, 0.05, { seg: 6, rings: 4 }); m.emissive(0); }
    m.color('#3a3a44'); BW567K.rbox(m, 0.05, 0.14, 0, 0.3, 0.06, 0.18, 0.02); for (let k = 0; k < 4; k++) { m.color(BURNS_NEON[k], 0.8); BW567K.ball(m, 0.1, 0.18, -0.06 + k * 0.04, 0.018, { seg: 5, rings: 3 }); } m.emissive(0).shine(0);
    m.color('#ffd84a', 0.5); m.box(0.6, 0.0, 0, 0.02, 0.1, 0.9); m.emissive(0);
    m.setBone(5); m.color('#2a2a30'); for (const sz of [-1, 1]) BW567K.limb(m, 0, 0, sz * 1.6, 0, 3.4, sz * 1.6, 0.06); BW567K.limb(m, 0, 3.4, -1.6, 0, 3.4, 1.6, 0.06);
    for (let k = 0; k < 6; k++) { m.color(BURNS_NEON[k], 1); m.push(); m.tf(0, 3.2, -1.3 + k * 0.52, 0, 0.6); BW567K.lathe(m, 0, 0, 0, [[0.1, 0], [0.14, 0.2], [0, 0.22]], { seg: 8 }); m.pop(); } m.emissive(0);
  });
  const party = new BW567Puppet(g, pGeo, 6); S.partyP = party; g.addBoss(party);
  // e-unicycles: bones 0..7 (bros, Bryce, Chad), bone 8: Preston's gold e-bike
  const uGeo = BW567K.geo('w6uni', m => {
    for (let i = 0; i < 8; i++) {
      m.setBone(i); m.push(); m.tf(0, 0.42, 0, 0, 0, Math.PI / 2);
      m.color('#1a1a1e'); BW567K.torus(m, 0, 0, 0, 0.36, 0.07, { seg: 16, tseg: 6 }); m.color(i === 7 ? '#ffd84a' : '#38f2ff', 0.9); BW567K.torus(m, 0, 0.0, 0, 0.29, 0.02, { seg: 16, tseg: 3 }); m.emissive(0);
      m.pop();
      m.color(i === 7 ? '#f4f4f8' : '#2a2a34').shine(2); BW567K.rbox(m, 0, 0.5, 0, 0.2, 0.62, 0.62, 0.09); m.shine(0);
      m.color('#3a3a44'); for (const sx of [-1, 1]) BW567K.rbox(m, sx * 0.17, 0.3, 0, 0.14, 0.04, 0.24, 0.02);
      if (i === 7) { const reg = BURNS_ATLAS.sign('CHADCO', { bg: '#f4f4f8', fg: '#1a2a5a', size: 24, pad: 4 }); m.color('#ffffff'); m.push(); m.tf(0.105, 0.55, 0, Math.PI / 2); m.decal(0, 0, 0, 0.5, 0.5 / reg.aspect, reg); m.pop(); m.push(); m.tf(-0.105, 0.55, 0, -Math.PI / 2); m.decal(0, 0, 0, 0.5, 0.5 / reg.aspect, reg); m.pop(); }
    }
    m.setBone(8); BurnsProps.bikeShape(m, 0, 0, 0, 0, '#e8c860'); m.color('#f8f6f0').shine(3); BW567K.rbox(m, 0, 0.52, 0, 0.16, 0.22, 0.5, 0.06); m.shine(0);
  });
  const uni = new BW567Puppet(g, uGeo, 9); S.uniP = uni; g.addBoss(uni);
  // VC drones (Chad)
  const dGeo = BW567K.geo('w6drone', m => { for (let i = 0; i < 6; i++) { m.setBone(i); m.color('#f4f4f8').shine(3); BW567K.ellip(m, 0, 0, 0, 0.35, 0.16, 0.35); m.color('#2a2a30'); for (const [x, z] of [[0.45, 0.45], [-0.45, 0.45], [0.45, -0.45], [-0.45, -0.45]]) { BW567K.limb(m, 0, 0, 0, x, 0.05, z, 0.03); BW567K.torus(m, x, 0.08, z, 0.22, 0.02, { seg: 10, tseg: 3 }); } m.color('#ffd84a', 1); BW567K.ball(m, 0, -0.12, 0.3, 0.07, { seg: 6, rings: 4 }); m.emissive(0).shine(0); const reg = BURNS_ATLAS.sign('$', { bg: '#1a6a2a', fg: '#ffffff', size: 28, pad: 6 }); m.color('#ffffff'); m.push(); m.tf(0, -0.2, 0, 0, Math.PI / 2); m.decal(0, 0, 0, 0.3, 0.3, reg); m.pop(); } });
  const drones = new BW567Puppet(g, dGeo, 6); S.droneP = drones; g.addBoss(drones);
  for (let i = 0; i < 6; i++) drones.off(i);
};
BW6.updateOcto = function (g, dt) {
  const S = BW6.state, c = S.car, p = g.player, t = g.time;
  BW6.placeTrailer(g, false);
  const drive = Math.min(1, Math.abs(c.speed) / 4), pon = S.party && S.party.on;
  // tentacles
  const T = S.tent, cb = T._m2 || (T._m2 = new Float32Array(12));
  BurnsM.a34Set(cb, 0, c.x, c.y, c.z, c.yaw, 0, 0, 1, 1, 1);
  BW6.TROOTS.forEach((Rt, i) => {
    const a = Rt[0], lx = Math.sin(a) * 2.35, lz = BW6.MANTLE.z + Math.cos(a) * 2.35, ph = t * (1.6 + drive) + i * 1.3;
    const lift = pon ? 0.85 + Math.sin(t * 4.1 + i) * 0.25 : 0;
    T.child(i * 2, cb, 0, lx, BW6.MANTLE.y + 0.55, lz, a + Math.sin(ph * 0.7) * (0.14 + drive * 0.1), 0.78 - lift + Math.sin(ph) * 0.1, Math.sin(ph * 0.6) * 0.15);
    T.child(i * 2 + 1, T.ch.bones, i * 2 * 12, 0, 0, 2.5 * Rt[1], 0, -0.7 - lift * 0.4 + Math.sin(ph + 1.2) * 0.25, 0);
  });
  // the googly pupil wobbles (more when honking or driving fast)
  const P = S.partyP, jig = (S.jiggle || 0); S.jiggle = Math.max(0, jig - dt * 2);
  const wx = Math.sin(t * 7.3) * (0.12 + drive * 0.12 + jig * 0.25), wy = Math.cos(t * 5.1) * (0.1 + jig * 0.2) - 0.12;
  const pp = BW6.cw(wx, BW6.MANTLE.y + 3.75 + wy, BW6.MANTLE.z + 2.86 - wy * 0.4);
  P.set(0, pp[0], pp[1], pp[2], c.yaw, -0.45);
  // party gear on the trailer
  const tr = S.trailer, tb = P._m3 || (P._m3 = new Float32Array(12));
  BurnsM.a34Set(tb, 0, tr.x, tr.y, tr.z, tr.yaw, 0, 0, 1, 1, 1);
  const k = S.deployK = BurnsM.damp(S.deployK || 0, pon ? 1 : 0, 4, dt);
  P.child(1, tb, 0, 0.6, 1.25 + 2.6 + (1 - k) * 1.0, 0.6, t * 1.2, 0, 0, 0.4 + 0.6 * k);
  P.child(2, tb, 0, 1.2, 1.25 - 2.3 * (1 - k), 3.0, Math.PI / 2 + 0.3, 0, 0);
  P.child(3, tb, 0, 1.2, 1.25 - 2.3 * (1 - k), -3.0, Math.PI / 2 - 0.3, 0, 0);
  P.child(4, tb, 0, 0.3, 2.25, 2.4, 0, 0, -(1 - k) * 1.5);
  P.child(5, tb, 0, 0, 1.25 - 3.6 * (1 - k), -0.4, Math.PI / 2, 0, 0);
  if (k < 0.02) { P.off(1); P.off(2); P.off(3); P.off(5); }
  // flame belches on autopilot (Follow the Fire), happy puffs otherwise
  S.belchT = (S.belchT || 2) - dt;
  if (S.belchT <= 0) {
    S.belchT = c.parked ? 6 + Math.random() * 6 : 2.6 + Math.random() * 2.2;
    const top = BW6.cw(0, BW6.MANTLE.y + 6.4, BW6.MANTLE.z);
    if (Math.hypot(top[0] - p.x, top[2] - p.z) < 200) {
      for (let i = 0; i < 16; i++) g.fx.add(top[0], top[1], top[2], (Math.random() - 0.5) * 2, 10 + Math.random() * 7, (Math.random() - 0.5) * 2, 0.7, 2.0, 0.6, [1, 0.55, 0.15], 1, 'flame', 1);
      g.fx.ring(top[0], top[1] + 4, top[2], 2.2, '#ffb040', 0.6);
      S.burstT = 0.6;
      if (Math.hypot(top[0] - p.x, top[2] - p.z) < 45) burnsSfx('flame_jet', { vol: 0.5, pitch: 0.6 + Math.random() * 0.2 });
      if (Math.hypot(top[0] - p.x, top[2] - p.z) < 26 && Math.random() < 0.4) BW6.octoSay(g, ['*BURRRP*', 'excuse me', '*HIC* fire', 'BLORP'][Math.floor(Math.random() * 4)]);
    }
  }
  if (S.burstT > 0) { S.burstT -= dt; const top = BW6.cw(0, BW6.MANTLE.y + 7, BW6.MANTLE.z); g.pointLight(top[0], top[1] + 2, top[2], 26, [1, 0.5, 0.15], 2.2); }
  // the silly horn: a three-note honk melody when you press JUMP while driving
  if (p.vehicle === c && p.inp.jumpPressed && !g.cine && !g.dialog.open) {
    const notes = [[0, 1.0], [0.16, 1.26], [0.32, 0.84], [0.5, 1.5]];
    for (const [d0, pi] of notes) BW567K.after(g, d0, () => burnsSfx('artcarHorn', { pitch: pi, vol: 0.7 }));
    S.jiggle = 1; BW6.octoSay(g, ['HONK HONK!', 'LA CUCA-HONK!', 'BEEP BEEP, BABY!', 'HOOOONK'][Math.floor(Math.random() * 4)]);
  }
  // kill-switch + party interactables follow the moving car
  BW6.refreshInteract(g);
  if (S.sayT > 0) S.sayT -= dt;
};
BW6.octoSay = function (g, text) { const S = BW6.state; S.say = text; S.sayT = 1.6; };
// jump physics for the dune ramp (extends this one car's ride)
BW6.carAir = function (g, c, p, dt) {
  const S = BW6.state, Rm = BW6.RAMP;
  const J = S.jump;
  if (J) {
    J.vy -= 22 * dt; J.y += J.vy * dt;
    if (J.y <= 0) { S.jump = null; g.shake(0.8); burnsSfx('stomp'); burnsSfx('crowd_cheer', { vol: 0.6 }); g.fx.dust(c.x, c.y + 0.2, c.z, 30); BW6.landed(g, J); }
    else { c.y = g.world.height(c.x, c.z) + J.y; c.syncMover(); const sp = c.seatPos(); p.y = sp[1]; }
    return;
  }
  // on the ramp: ride its surface; launch off the lip
  const dx = c.x - Rm.x, dz = c.z - Rm.z, lz = -dz;   // ramp local z (rises toward world -z)
  if (Math.abs(dx) < 4.6 && lz > -5.2 && lz < 5.4) {
    const h = clamp((lz + 5.2) / 10.4, 0, 1) * 2.8;
    c.y = g.world.height(c.x, c.z) + h; c.syncMover(); const sp = c.seatPos(); p.y = sp[1];
    S.rampSpeed = c.speed; S.onRamp = true;
  } else if (S.onRamp) {
    S.onRamp = false;
    if (lz >= 5.2 && Math.abs(dx) < 5 && Math.abs(S.rampSpeed) > 4.5) { S.jump = { y: 2.8, vy: 4 + Math.abs(S.rampSpeed) * 0.7, v: Math.abs(S.rampSpeed), x0: c.x, z0: c.z }; burnsSfx('jumpBig'); g.banner('AIRBORNE!', 'This was a terrible idea!', { col: '#ffd84a', small: true }); const bi = g.actor('badidea'); if (bi) bi.say('YESSSS! TERRIBLE! BEAUTIFUL!', 2.5); }
  }
};
BW6.landed = function (g, J) {
  const dist = Math.hypot(BW6.state.car.x - J.x0, BW6.state.car.z - J.z0);
  if (g.missions.state('stunt') === 'active') {
    if (dist > 8) { g.missions.complete('stunt', { x: g.player.x, y: g.player.y + 1.2, z: g.player.z + 3 }); const bi = g.actor('badidea'); if (bi) bi.say(`${dist.toFixed(0)} METERS! I\'m so proud. And concerned.`, 3); }
    else g.toast(`ONLY ${dist.toFixed(0)}m. GO FASTER!`);
  }
};

/* ============================================================ interactables ============================================================ */
BW6.refreshInteract = function (g) {
  const S = BW6.state;
  if (!S.ints) {
    S.ints = {
      kill: { label: 'KILL SWITCH', r: 1.9, when: g2 => g2.missions.state('board') === 'active', fn: g2 => BW6.killSwitch(g2) },
      party: { label: 'THROW A PARTY!', r: 3.0, when: g2 => BW6.canParty(g2), fn: g2 => BW6.startParty(g2) },
      dj: { label: 'DJ A SET', r: 3.0, when: g2 => BW6.state.party && BW6.state.party.on && !BW567K.busy(g2) && (BW6.state.party.cool || 0) <= 0 && !BW6.state.chadOn, fn: g2 => BW6.djSet(g2) },
      jello: { label: 'REFILL JELLO SHOTS', r: 2.6, x: BW6.HQ.x + 7.6, z: BW6.HQ.z + 0.8, when: g2 => BW6.state.keys && BW6.state.shots < 30, fn: g2 => { BW6.state.shots = 40; g2.toast('JELLO SHOTS: 40. JIGGLY.'); burnsSfx('pickup_bag'); } },
      battle: { label: 'DJ BATTLE!', r: 3.2, when: g2 => BW6.state.rival && BW6.state.rival.mode === 'steal' && !BW567K.busy(g2), fn: g2 => BW6.djBattle(g2) }
    };
    g.interactables = (g.interactables || []).concat(Object.values(S.ints));
  }
  const I = S.ints, k = BW6.cw(0, BW6.MANTLE.y + 5.2, BW6.MANTLE.z + 1.75);
  I.kill.x = k[0]; I.kill.y = k[1]; I.kill.z = k[2];
  const b = BW6.tw(0.3, 1.25, 2.4); I.party.x = b[0]; I.party.y = b[1]; I.party.z = b[2]; I.dj.x = b[0]; I.dj.y = b[1]; I.dj.z = b[2];
  const pg = BW6.tw(2.6, 0, 2.4); I.party.x2 = pg[0];
  if (S.rival) { const rc = S.rival.car; I.battle.x = rc.x; I.battle.z = rc.z; I.battle.y = g.player.y; }
};
BW6.killSwitch = function (g) {
  const S = BW6.state, c = S.car, p = g.player;
  c.parked = true; c.speed = 0; S.keys = true;
  burnsSfx('bump'); burnsSfx('crowd_cheer', { vol: 0.6 }); g.shake(0.4);
  g.missions.complete('board', { x: p.x, y: p.y + 1.2, z: p.z });
  BurnsSave.get().octopus = true; BurnsSave.flag(6, 'octopus', true); BurnsSave.save();
  BW567K.after(g, 1.4, g2 => {
    const b = g2.actor('barnacle');
    if (b) { b.setBehavior('idle'); b.x = c.x + 6; b.z = c.z + 3; b.y = g2.world.height(b.x, b.z); }
    g2.say(b || 'brady', ['She STOPPED! Kid, you\'re a natural. A natural what, I don\'t know.', 'Here. The keys. Well, it\'s a bottle opener on a lanyard. Same thing.', 'Take her. She\'s not a car, she\'s a PARTY. Park her at a party spot and let her do her thing.', 'Hop off, walk to the DJ booth on the trailer, and THROW A PARTY.'], () => { g2.giveItem('artcar'); if (b) { b.setBehavior('wander'); b.def.radius = 6; } });
  });
};

/* ============================================================ the party ============================================================ */
BW6.spotAt = function (x, z) { for (const s of BW6.SPOTS) if (Math.hypot(x - s.x, z - s.z) < s.r) return s; return null; };
BW6.canParty = function (g) {
  const S = BW6.state, c = S.car;
  if (!S.keys || (S.party && S.party.on) || c.rider || Math.abs(c.speed) > 0.4 || S.chadOn) return false;
  return true;
};
BW6.startParty = function (g) {
  const S = BW6.state, c = S.car, spot = BW6.spotAt(c.x, c.z);
  if (!spot) { g.toast('NOT A PARTY SPOT! PARK INSIDE A GLOWING RING.'); burnsSfx('bump'); return; }
  const ctr = BW6.tw(7.5, 0, 0);
  S.party = { on: true, spot, x: ctr[0], z: ctr[2], energy: 30, t: 0, joinT: 0, members: new Set(), boost: 0.6, score: 0, cool: 0, sets: 0 };
  if (g.missions.state('party') === 'available') g.missions.start('party', true);
  burnsSfx('crowd_cheer'); g.shake(0.2);
  g.banner('PARTY AT ' + spot.name + '!', 'Speakers up. Booth open. Jello: ' + S.shots, { col: '#ff4fd8' });
  // followers rush in
  for (const a of S.followers) if (a && !a.removed) BW6.joinParty(g, a, true);
  S.followers = [];
  BW567K.after(g, 1.0, g2 => BW6.djSet(g2));
};
BW6.djSet = function (g) {
  const S = BW6.state, P = S.party; if (!P || !P.on || BW567K.busy(g)) return;
  const p = g.player, stand = BW6.tw(-0.95, 1.25, 2.2), tr = S.trailer;
  p.teleport(stand[0], stand[1], stand[2], tr.yaw + Math.PI / 2);
  const look = BW6.tw(4.6, 2.9, 2.4), at = BW6.tw(-0.3, 2.3, 2.4);
  P.sets++;
  BW567K.dj(g, { title: 'LIVE ON EL PULPO', bpm: 124, genre: 'house', difficulty: Math.min(0.85, 0.35 + P.sets * 0.12), duration: 45, crowd: BW6.count(g), crowdAt: { x: P.x, z: P.z, r: 14 }, booth: { x: stand[0], y: stand[1], z: stand[2], yaw: tr.yaw + Math.PI / 2 }, deck3d: false, music: 'burns_w6',
    cam: { x: look[0], y: look[1], z: look[2], tx: at[0], ty: at[1], tz: at[2], fov: 0.85 }, anim: 'bw567dj',
    onBeat(g2, bt) { if (bt % 4 === 0) { const d = BW6.tw(0.6, 3.2, 0.6); g2.fx.notes(d[0], d[1], d[2]); } },
    onHit(g2) { if (BW6.state.party) BW6.state.party.energy = Math.min(100, BW6.state.party.energy + 0.6); },
    onDone(res) { BW6.setDone(g, res); } });
};
BW6.setDone = function (g, res) {
  const S = BW6.state, P = S.party; if (!P) return;
  P.score = res.score; P.energy = Math.min(100, P.energy + 20 + res.score * 60); P.boost = 0.5 + res.score * 1.2; P.cool = 6;
  g.banner(`SET GRADE: ${res.grade}`, res.score >= 0.8 ? 'The playa is SHOOK.' : res.score >= 0.6 ? 'Solid set. Bodies moving.' : res.score >= 0.4 ? 'Eh. The crusties are unimpressed.' : 'The jello shots are doing the heavy lifting.', { col: res.score >= 0.6 ? '#ffd84a' : '#ff9a4a', big: true });
  burnsSfx('crowd_cheer', { vol: 0.4 + res.score * 0.6 });
  // a great set wins over the tough crowds
  if (res.score >= 0.6) for (const a of g.actors) if (a.def.partyGoer && a.def.partyKind === 'intern' && !a.data.party) a.data.won = true;
  if (res.score >= 0.75) { const cv = g.actor('crustyvet'); if (cv && !cv.data.party) BW6.joinParty(g, cv); for (const a of g.actors) if (a.def.partyKind === 'crusty') a.data.won = true; }
};
BW6.count = function (g) { const P = BW6.state.party; return P ? P.members.size + (BW6.state.backN || 0) : 0; };
BW6.joinParty = function (g, a, instant) {
  const S = BW6.state, P = S.party; if (!P || !P.on || a.removed) return;
  if (a.data.party) return;
  const k = P.members.size, ang = (k * 2.399) % TAU, rad = 2.6 + Math.sqrt(k) * 1.35;
  a.data = a.data || {};
  a.setBehavior('bw6Party');
  a.data.party = true; a.data.sx = P.x + Math.sin(ang) * rad; a.data.sz = P.z + Math.cos(ang) * rad; a.data.style = k % 6;
  if (instant) { a.x = a.data.sx + (Math.random() - 0.5) * 3; a.z = a.data.sz + (Math.random() - 0.5) * 3; }
  P.members.add(a);
};
BW6.leaveParty = function (g, a, follow) {
  const S = BW6.state, P = S.party; if (P) P.members.delete(a);
  a.data.party = false;
  if (follow) { a.setBehavior('bw6Tag'); S.followers.push(a); }
  else { a.setBehavior('wander'); }
};
BW6.endParty = function (g, why) {
  const S = BW6.state, P = S.party; if (!P || !P.on) return;
  P.on = false;
  const keep = clamp(0.45 + P.energy / 160, 0.3, 0.95);
  let f = 0;
  for (const a of Array.from(P.members)) { const fol = Math.random() < keep && a.id !== 'crustyvet'; if (fol) f++; BW6.leaveParty(g, a, fol); }
  S.backN = 0; for (const b of S.back) b.on = false;
  g.toast(why === 'move' ? `PARTY ON THE MOVE! ${f} FOLLOWERS` : 'THE PARTY FIZZLED');
};
BW6.talkPartygoer = function (g, a) {
  const S = BW6.state, P = S.party;
  if (P && P.on && !a.data.party && Math.hypot(a.x - P.x, a.z - P.z) < P.spot.r + 30) {
    if (S.shots <= 0) { g.say(a, ['No jello? No party. That\'s just math.']); return; }
    S.shots--; P.energy = Math.min(100, P.energy + 6);
    a.say(['JELLO SHOT! Wobble wobble!', 'Gelatin is basically water, right?', 'Okay okay, I\'m IN.', 'This party is TOO corporate. ...Okay one dance.'][Math.floor(Math.random() * 4)], 2);
    g.fx.burst(a.x, a.y + 1.8, a.z, 'star', 8, '#ff4fd8'); burnsSfx('gift', null, 'pick');
    BW6.joinParty(g, a); return;
  }
  if (a.data.party) { g.say(a, [['Best. Party. EVER.', 'Is the octopus... looking at me? I love it.', 'Can we get in the hot tub? Too late, I\'m in the hot tub.'][Math.floor(Math.random() * 3)]]); return; }
  g.say(a, (BW6.CHAT[a.def.partyKind] || BW6.CHAT.easy).slice(0, 2));
};
BW6.updateParty = function (g, dt) {
  const S = BW6.state, P = S.party, c = S.car, p = g.player;
  // back-row dancers (one puppet... drawn as simple crowd)
  if (!P || !P.on) { BW6.updateBack(g, dt, null); return; }
  P.t += dt; if (P.cool > 0) P.cool -= dt;
  // moving the car ends (moves) the party
  if (c.rider && Math.abs(c.speed) > 1.5) { BW6.endParty(g, 'move'); return; }
  if (g.missions.state('boss') === 'available' && !S.chadOn && P.t > 6) BW6.chadArrives(g);
  const n = BW6.count(g);
  if (!BW567K.busy(g) && !S.chadOn) P.energy = Math.max(0, P.energy - dt * (n > 25 ? 0.6 : 1.0));
  // crusty heckler drains energy
  const cv = g.actor('crustyvet');
  if (cv && !cv.data.party && Math.hypot(cv.x - P.x, cv.z - P.z) < P.spot.r + 18) { P.energy = Math.max(0, P.energy - dt * 1.5); if (Math.random() < dt * 0.4) cv.say(['TOO CORPORATE!', 'Is that a SPONSORED octopus?!', 'Baker Beach never needed a hot tub!'][Math.floor(Math.random() * 3)], 1.8); }
  // joiners stream in
  P.joinT -= dt;
  if (P.joinT <= 0 && P.energy > 5 && !S.chadOn) {
    P.joinT = Math.max(0.25, 1.4 - P.energy / 100 * 0.9) / P.boost;
    const R = P.spot.r + 10 + P.energy * 0.3;
    let best = null, bd = 1e9;
    for (const a of g.actors) {
      if (!a.def.partyGoer || a.data.party || a.removed || a.hidden) continue;
      const kind = a.def.partyKind; if (kind === 'pony' && !a.data.shot) continue;
      if ((kind === 'crusty' || kind === 'intern') && !a.data.won) continue;
      const d = Math.hypot(a.x - P.x, a.z - P.z); if (d < R && d < bd) { bd = d; best = a; }
    }
    if (best) { BW6.joinParty(g, best); if (Math.random() < 0.3) best.say(['A PARTY?!', 'Is that an OCTOPUS?', 'I hear jello!', 'Wait for meee!'][Math.floor(Math.random() * 4)], 1.5); }
  }
  // fizzling: low energy sends people away
  if (P.energy <= 0 && Math.random() < dt * 0.6 && P.members.size) { const a = Array.from(P.members)[Math.floor(Math.random() * P.members.size)]; if (a && !a.def.boss) BW6.leaveParty(g, a, false); }
  BW6.updateBack(g, dt, P);
  // the win
  if (n >= BW6.GOAL && g.missions.state('party') === 'active' && !S.partyWon) {
    S.partyWon = true;
    g.missions.complete('party', { x: p.x, y: p.y + 1.5, z: p.z + 2 });
    g.banner(`${n} PARTYING!`, 'El Pulpo is the talk of the playa.', { col: '#ffd84a', big: true });
    BW567K.after(g, 3.5, g2 => BW6.chadArrives(g2));
  }
};
// back-row dancers: lightweight crowd drawn by the BW6 back puppet
BW6.updateBack = function (g, dt, P) {
  const S = BW6.state;
  if (!S.backP) {
    const geo = BW567K.geo('w6back', m => { for (let i = 0; i < 16; i++) { m.setBone(i); const col = BURNS_NEON[i % 7], skin = ['#e8b996', '#c88a5a', '#8a5a3a', '#f0c8a8'][i % 4]; m.color(col); BW567K.limb(m, 0, 0.25, 0, 0, 1.15, 0, 0.2, 0.17); m.color(i % 3 ? '#2a2a34' : '#3a2a4a'); BW567K.limb(m, -0.1, 0, 0, -0.1, 0.55, 0, 0.08); BW567K.limb(m, 0.1, 0, 0, 0.1, 0.55, 0, 0.08); m.color(skin); BW567K.ball(m, 0, 1.52, 0, 0.17); BW567K.limb(m, -0.2, 1.15, 0, -0.32, 1.75, 0.05, 0.05); BW567K.limb(m, 0.2, 1.15, 0, 0.32, 1.75, 0.05, 0.05); m.color(BURNS_NEON[(i + 3) % 7], 1); BW567K.ball(m, 0, 1.0, 0.17, 0.05, { seg: 5, rings: 3 }); m.emissive(0); } });
    S.backP = new BW567Puppet(g, geo, 16); g.addBoss(S.backP);
    for (let i = 0; i < 16; i++) S.back.push({ i, on: false, x: 0, z: 0, tx: 0, tz: 0, ph: Math.random() * 6 });
  }
  const B = S.backP;
  let n = 0;
  const want = P && P.on ? Math.min(16, Math.floor(Math.max(0, P.members.size - 6) * 0.6 + P.energy / 12)) : 0;
  for (const b of S.back) {
    if (b.on && n >= want) b.on = false;
    if (!b.on && n < want && P) { b.on = true; const a = Math.random() * TAU, r = 30 + Math.random() * 15; b.x = P.x + Math.sin(a) * r; b.z = P.z + Math.cos(a) * r; const ang = (b.i * 2.399 + 1.2) % TAU, rad = 11 + (b.i % 4) * 1.4; b.tx = P.x + Math.sin(ang) * rad; b.tz = P.z + Math.cos(ang) * rad; }
    if (!b.on) { B.off(b.i); continue; }
    n++;
    const dx = b.tx - b.x, dz = b.tz - b.z, d = Math.hypot(dx, dz), t = g.time + b.ph;
    if (d > 0.4) { const s = Math.min(d, 4.5 * dt); b.x += dx / d * s; b.z += dz / d * s; B.set(b.i, b.x, g.world.height(b.x, b.z) + Math.abs(Math.sin(t * 9)) * 0.08, b.z, Math.atan2(dx, dz)); }
    else B.set(b.i, b.x, g.world.height(b.x, b.z) + Math.abs(Math.sin(t * 8.2)) * 0.22, b.z, Math.atan2(S.trailer.x - b.x, S.trailer.z - b.z) + Math.sin(t * 2) * 0.4, 0, Math.sin(t * 4.1) * 0.12);
  }
  S.backN = n;
};

/* ---------------- behaviours ---------------- */
// party member: walk to the slot, then dance (faces the trailer)
BurnsBehaviors.register('bw6Party', {
  update(a, g, dt) {
    const D = a.data, d = a.moveTo(D.sx, D.sz, 3.4, dt, 0.4);
    if (d > 0.6) a.ch.play('run', { rate: 0.8 });
    else { a.ch.play('dance', { style: D.style || 0, bpm: 124 }); const tr = BW6.state.trailer; a.face(tr.x, tr.z, dt, 2); }
    a.physics(dt);
  },
  talk(a, g) { BW6.talkPartygoer(g, a); return true; }
});
// follower: jogs along behind El Pulpo's trailer
BurnsBehaviors.register('bw6Tag', {
  update(a, g, dt) {
    const S = BW6.state, tr = S.trailer, k = (a.data.tagK === undefined ? (a.data.tagK = Math.random()) : a.data.tagK);
    const back = BW6.tw((k - 0.5) * 10, 0, -9 - k * 10);
    const d = Math.hypot(back[0] - a.x, back[2] - a.z);
    if (d > 70) { a.x = back[0] + (Math.random() - 0.5) * 6; a.z = back[2] + (Math.random() - 0.5) * 6; a.y = g.world.height(a.x, a.z); }
    const r = a.moveTo(back[0], back[2], d > 12 ? 6.5 : 3.2, dt, 1.2);
    a.ch.play(r > 1.5 ? 'run' : 'dance', r > 1.5 ? { rate: 0.9 } : { style: 4 });
    a.physics(dt);
  },
  talk(a, g) { g.say(a, ['Where are we going? Doesn\'t matter! FOLLOW THE OCTOPUS!']); return true; }
});
// pose for e-unicycle riders: standing, knees soft, arms out for balance
BURNS_ANIMS.bw6Uni = function (P, t, k) {
  const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  const s = Math.sin(t * 2.3);
  S(B.THIGH_L, -0.25); S(B.SHIN_L, 0.35); S(B.THIGH_R, -0.25); S(B.SHIN_R, 0.35);
  S(B.UARM_L, -0.2, 0, 0.6 + s * 0.15); S(B.UARM_R, -0.2, 0, -0.6 + s * 0.15); S(B.FARM_L, -0.4); S(B.FARM_R, -0.4);
  S(B.CHEST, 0.12, s * 0.06, s * 0.05); S(B.HEAD, -0.08);
};
// tech bros on e-unicycles: zip around, pitch, and ride over to unplug your party
BurnsBehaviors.register('bw6Unibro', {
  init(a) { a.data.mode = 'roam'; a.data.cd = 2 + Math.random() * 2; a.data.ang = Math.random() * TAU; a.seatY = 0.3; },
  update(a, g, dt) {
    const D = a.data, p = g.player, S = BW6.state, P = S.party;
    D.cd -= dt;
    if (D.mode === 'roam') {
      D.ang += dt * 0.35; const tx = a.home.x + Math.sin(D.ang) * 9, tz = a.home.z + Math.cos(D.ang) * 9;
      a.moveTo(tx, tz, 4.2, dt, 0.4); a.ch.play('bw6Uni');
      if (a.distP() < 14 && D.cd <= 0) { D.cd = 2.6 + Math.random(); const pl = a.def.pitches || BURNS_PITCHES; g.projectile({ kind: 'pitch', x: a.x, y: a.y + 2.0, z: a.z, speed: 3.8, homing: 1.5, life: 5, text: pl[Math.floor(Math.random() * pl.length)], dmg: 1, r: 0.55 }); burnsSfx('pitch_blah', { vol: 0.5 }); }
      if (P && P.on && !S.saboteur && Math.hypot(a.x - P.x, a.z - P.z) < 70 && P.t > 8 && Math.random() < dt * 0.05) { D.mode = 'sabotage'; S.saboteur = a; a.say('Unplugging unlicensed fun! This party needs TERMS OF SERVICE!', 2.5); }
    } else if (D.mode === 'sabotage') {
      if (!P || !P.on) { D.mode = 'roam'; S.saboteur = null; }
      else {
        const sp = BW6.tw(1.9, 0, 3.0), d = a.moveTo(sp[0], sp[2], 5.0, dt, 0.8); a.ch.play('bw6Uni');
        if (d < 1.2) { D.mode = 'unplug'; D.t = 4.5; g.warn('A TECH BRO IS UNPLUGGING YOUR SPEAKERS!', 2); }
      }
    } else if (D.mode === 'unplug') {
      D.t -= dt; a.ch.play('phone'); a.moveTo(a.x, a.z, 0, dt);
      if (Math.random() < dt * 8) g.fx.spark(a.x, a.y + 1, a.z, 2, '#38f2ff', 3);
      if (D.t <= 0) {
        D.mode = 'roam'; S.saboteur = null;
        if (P && P.on) { P.energy = Math.max(0, P.energy - 30); let lost = 0; for (const m of Array.from(P.members)) if (Math.random() < 0.25) { BW6.leaveParty(g, m, false); lost++; } g.banner('UNPLUGGED!', `-30 energy · ${lost} burners wandered off`, { col: '#ff6a6a', small: true }); burnsSfx('powerdown'); }
      }
    }
    BurnsBehaviors.contact(a, g, 1);
    a.physics(dt);
  },
  hit(a, g) { if (a.data.mode !== 'roam' && BW6.state.saboteur === a) { BW6.state.saboteur = null; a.data.mode = 'roam'; g.toast('SABOTAGE STOPPED!'); } return true; }
});
// Chad, Founder & CEO, on a giant electric unicycle
BurnsBehaviors.register('bw6Chad', {
  init(a) { a.data.mode = 'wait'; a.data.t = 1; a.data.ang = 0; a.data.pitchT = 1.5; a.seatY = 1.05; },
  hit(a, g, kind) {
    if (a.data.mode === 'dizzy') return true;
    if (a.data.mode === 'wait') return false;
    a.say(['Let\'s take this offline!', 'You can\'t disrupt the DISRUPTOR!', 'My lawyers will circle back!', 'Per my last email: NO.'][Math.floor(Math.random() * 4)], 1.2);
    const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; if (kind !== 'fire' && kind !== 'bike') p.knock(dx / d * 8, 6, dz / d * 8);
    return false;
  },
  update(a, g, dt) {
    const D = a.data, p = g.player, A = D.arena || { x: a.home.x, z: a.home.z };
    D.t -= dt;
    a.r = D.mode === 'dizzy' ? 0.5 : 1.1;
    if (D.mode === 'wait') { a.ch.play('bw6Uni'); a.vx = a.vz = 0; a.physics(dt); return; }
    const phase = a.hp <= 2 ? 1 : 0, sp = phase ? 9.5 : 7.5;
    if (D.mode === 'circle') {
      D.ang += dt * sp / 13 * (D.cw || 1);
      a.moveTo(A.x + Math.sin(D.ang) * 13, A.z + Math.cos(D.ang) * 13, sp, dt, 0.3); a.ch.play('bw6Uni');
      D.pitchT -= dt;
      if (D.pitchT <= 0) { D.pitchT = phase ? 1.0 : 1.5; const txt = ['SERIES Z!', '10X!', 'OCTOPUS AS A SERVICE!', 'TERM SHEET!', 'PIVOT!', 'SYNERGY!', 'MOVE FAST!'][Math.floor(Math.random() * 7)]; g.projectile({ kind: 'pitch', x: a.x, y: a.y + 3.2, z: a.z, speed: phase ? 5 : 4.2, homing: 1.6, life: 5, text: txt, dmg: 1, r: 0.6 }); burnsSfx('pitch_blah', { vol: 0.6, pitch: 0.8 }); }
      if (D.t <= 0) { D.cycle = (D.cycle || 0) + 1; if (D.cycle % 3 === 0) { D.mode = 'drones'; D.t = 4.0; D.drop = 0; a.say('VC DRONES! DEPLOY THE TERM SHEETS!', 2); } else { D.mode = 'aim'; D.t = 1.0; a.say(['LET\'S DISRUPT YOUR FACE!', 'MOVE FAST AND BREAK OCTOPUSES!', 'GROWTH HACK!'][Math.floor(Math.random() * 3)], 1.3); burnsSfx('artcarHorn', { pitch: 1.6, vol: 0.5 }); } }
    } else if (D.mode === 'aim') {
      a.face(p.x, p.z, dt, 8); a.moveTo(a.x, a.z, 0, dt); a.ch.play('bw6Uni');
      if (Math.random() < dt * 20) g.fx.spark(a.x, a.y + 0.6, a.z, 1, '#ffd84a', 3);
      if (D.t <= 0) { D.mode = 'charge'; D.t = 1.6; D.dx = Math.sin(a.yaw); D.dz = Math.cos(a.yaw); D.bump = 0; }
    } else if (D.mode === 'charge') {
      const s = phase ? 15 : 13; a.vx = D.dx * s; a.vz = D.dz * s; a.ch.play('bw6Uni');
      if (Math.random() < dt * 25) g.fx.dust(a.x, a.y + 0.1, a.z, 2);
      if ((D.bump || 0) > 0 || D.t <= 0 || Math.hypot(a.x - A.x, a.z - A.z) > 24) {
        D.bump = 0; D.mode = 'dizzy'; D.t = phase ? 3.0 : 3.6; a.vx = a.vz = 0; g.shake(0.4); burnsSfx('bump'); g.fx.dust(a.x, a.y + 0.4, a.z, 16);
        a.say(['My unicycle needs a FIRMWARE UPDATE!', 'Battery at 1%! Like my personality!', 'This is a learning opportunity!'][Math.floor(Math.random() * 3)], 2);
      }
      BurnsBehaviors.contact(a, g, 1, 9);
    } else if (D.mode === 'dizzy') {
      a.ch.play('hurt'); a.vx = BurnsM.damp(a.vx, 0, 6, dt); a.vz = BurnsM.damp(a.vz, 0, 6, dt); a.yaw += dt * 3;
      if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + a.h + 0.4, a.z, 'star', 1, '#ffe24a');
      if (D.t <= 0) { D.mode = 'circle'; D.t = 4 + Math.random() * 2; D.ang = Math.atan2(a.x - A.x, a.z - A.z); D.cw = Math.random() < 0.5 ? 1 : -1; }
    } else if (D.mode === 'drones') {
      a.moveTo(a.x, a.z, 0, dt); a.ch.play('phone'); a.face(p.x, p.z, dt, 3);
      if (D.t < 3.4 - D.drop * 0.5 && D.drop < 6) {
        D.drop++; const tx = p.x + (Math.random() - 0.5) * 6, tz = p.z + (Math.random() - 0.5) * 6, T = 1.5, ty = g.world.height(tx, tz), sy = a.y + 7;
        g.projectile({ kind: 'firework', x: tx, y: sy, z: tz, vx: 0, vy: (ty - sy) / T + 0.5 * 10 * T, vz: 0, gravity: 10, life: T + 0.4, dmg: 1, col: '#ffd84a', tx, tz, blast: 2.6 });
        burnsSfx('firework_launch', { vol: 0.4, pitch: 1.4 });
      }
      if (D.t <= 0) { D.mode = 'circle'; D.t = 4.5; }
    }
    a.physics(dt);
  }
});

/* ============================================================ rival DJ (the Annoying DJ) ============================================================ */
BW6.buildRival = function (api, g) {
  const car = api.artCar({ x: -120, z: 120, yaw: 2.4, drivable: false, label: 'THE DROP', path: [[-120, 120], [-130, 40], [-60, 100]], pathSpeed: 4, build: m => BW6.boomboxMesh(m) });
  car.parked = true;
  BW6.state.rivalCar = car;
  api.npc({ id: 'annoyingdj', name: 'DJ DROPZ', type: 'annoyingdj', seed: 1, x: -120, z: 120, y: 2.0, fixedY: true, collide: false, behavior: 'dance', style: 1, always: true,
    chat: ['MAKE SOME NOOOOISE!', 'Same drop, but LOUDER!', 'I don\'t take requests. I take CROWDS.'],
    lines: ['You want the decks? Beat me in a DJ battle, octopus boy.'] });
};
BW6.boomboxMesh = function (m) {
  m.color('#1a1a22').shine(2); BW567K.rbox(m, 0, 1.6, 0, 3.6, 2.4, 7.0, 0.5); m.shine(0);
  for (const sx of [-1, 1]) for (const z of [-2.0, 2.0]) { m.push(); m.tf(sx * 1.82, 1.6, z, sx * Math.PI / 2, 0, 0); m.color('#3a3a44'); BW567K.torus(m, 0, 0, 0, 0.85, 0.12, { seg: 18, tseg: 5 }); m.color('#ff4fd8', 0.7); BW567K.ball(m, 0, 0, 0, 0.5, { seg: 10, rings: 5 }); m.emissive(0); m.pop(); }
  m.color('#c8c8d0').shine(3); BW567K.tube(m, [[0, 2.8, -2.6], [0, 4.0, -2.0], [0, 4.0, 2.0], [0, 2.8, 2.6]], [0.12, 0.12, 0.12, 0.12], { seg: 8, cap: false }); m.shine(0);
  for (let i = 0; i < 10; i++) { m.color(BURNS_NEON[i % 7], 1); m.box(0, 1.2 + (i % 5) * 0.22, -3.52, 0.25, 0.12, 0.04 + (i % 3) * 0.02); } m.emissive(0);
  for (const wz of [2.4, -2.4]) for (const sx of [1, -1]) { m.push(); m.tf(sx * 1.7, 0.45, wz, 0, 0, Math.PI / 2); m.color('#1a1a1e'); BW567K.rcyl(m, 0, -0.2, 0, 0.45, 0.4, 0.1); m.pop(); }
  m.color('#2a2a30'); BW567K.rbox(m, 0, 2.95, 0, 2.6, 0.12, 4.0, 0.05);
  const reg = BURNS_ATLAS.sign('THE DROP', { bg: '#1a1a22', fg: '#ff4fd8', size: 28, glow: '#ff4fd8', pad: 6 });
  m.color('#ffffff', 0.6); m.push(); m.tf(1.82, 1.0, 0, Math.PI / 2); m.decal(0, 0, 0, 2.6, 2.6 / reg.aspect, reg); m.pop(); m.push(); m.tf(-1.82, 1.0, 0, -Math.PI / 2); m.decal(0, 0, 0, 2.6, 2.6 / reg.aspect, reg); m.pop(); m.emissive(0);
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.8, hz: 3.5, y0: 0, y1: 2.0, cover: true }], lights: [{ x: 0, y: 3.4, z: 0, s: 2.4, c: '#ff4fd8' }], seat: [0, 2.0, 2.4], w: 3.6, len: 7 };
};
BW6.updateRival = function (g, dt) {
  const S = BW6.state, P = S.party, dj = g.actor('annoyingdj'), rc = S.rivalCar;
  if (!dj || !rc) return;
  dj.x = rc.x; dj.z = rc.z; dj.y = rc.y + 3.0; dj.yaw = rc.yaw;
  if (!S.rival && P && P.on && P.members.size >= 14 && !S.rivalBeaten && !S.chadOn) {
    // he shows up next door and starts stealing your crowd
    const a = Math.atan2(P.x - S.trailer.x, P.z - S.trailer.z) + 0.8, tx = P.x + Math.sin(a) * 26, tz = P.z + Math.cos(a) * 26;
    rc.x = tx + Math.sin(a) * 30; rc.z = tz + Math.cos(a) * 30; rc.yaw = Math.atan2(tx - rc.x, tz - rc.z); rc.parked = false; rc.o.path = [[tx, tz], [tx + 0.1, tz + 0.1]]; rc.o.pathSpeed = 5; rc.pi = 0;
    S.rival = { car: rc, mode: 'arrive', tx, tz, steal: 0 };
    g.banner('RIVAL ART CAR!', 'DJ Dropz is stealing your crowd. Walk over and challenge him to a DJ BATTLE!', { col: '#ff4fd8' });
    burnsSfx('artcarHorn', { pitch: 0.7 });
  }
  const Rv = S.rival; if (!Rv) return;
  if (Rv.mode === 'arrive') { if (Math.hypot(rc.x - Rv.tx, rc.z - Rv.tz) < 4) { rc.parked = true; rc.speed = 0; Rv.mode = 'steal'; } }
  else if (Rv.mode === 'steal') {
    if (Math.random() < dt * 0.25) { dj.say(['MAKE SOME NOOOOISE!', 'HERE COMES THE DROP! ...again!', 'SAME DROP! LOUDER!'][Math.floor(Math.random() * 3)], 1.6); burnsSfx('headbang', { vol: 0.35 }); }
    if (P && P.on && Math.random() < dt * 0.22 && P.members.size && Rv.steal < 8) {
      const a = Array.from(P.members).find(m => m.def.partyGoer);
      if (a) { BW6.leaveParty(g, a, false); a.setBehavior('bw6Party'); a.data.party = 'rival'; const ang = Math.random() * TAU; a.data.sx = rc.x + Math.sin(ang) * (4 + Math.random() * 4); a.data.sz = rc.z + Math.cos(ang) * (4 + Math.random() * 4); Rv.steal++; Rv.crowd = (Rv.crowd || []).concat([a]); }
    }
  } else if (Rv.mode === 'leave') { rc.parked = false; }
};
BW6.djBattle = function (g) {
  const S = BW6.state, Rv = S.rival; if (!Rv || Rv.mode !== 'steal') return;
  const dj = g.actor('annoyingdj'), p = g.player;
  g.say(dj, ['A DJ battle? Against ME? I\'ve been playing the same drop since 2014. I\'m UNBEATABLE.'], () => {
    const look = [p.x + Math.sin(p.yaw) * -4, p.y + 2.4, p.z + Math.cos(p.yaw) * -4];
    BW567K.dj(g, { title: 'DJ BATTLE vs DJ DROPZ', bpm: 128, genre: 'techno', difficulty: 0.62, duration: 45, crowd: BW6.count(g), crowdAt: { x: Rv.car.x, z: Rv.car.z, r: 12 }, music: 'burns_w6',
      cam: { x: look[0], y: look[1], z: look[2], tx: Rv.car.x, ty: 2.5, tz: Rv.car.z, fov: 0.9 },
      onDone(res) {
        if (res.score >= 0.5) {
          S.rivalBeaten = true; Rv.mode = 'leave';
          g.say(dj, ['...okay. That drop was SICK. Different drops! Who knew?!', 'Fine. My crowd is your crowd. MAKE SOME NOISE... for octopus boy.'], () => {
            for (const a of (Rv.crowd || [])) if (a && !a.removed) { a.data.party = false; BW6.joinParty(g, a); }
            Rv.crowd = []; Rv.car.o.path = [[-140, 140], [-150, 100]]; Rv.car.parked = false;
            if (dj) { dj.say('Same drop forever though.', 2); }
            g.banner('DJ BATTLE WON!', 'His crowd joins your party.', { col: '#ffd84a', big: true });
          });
        } else g.say(dj, ['HA! Same drop wins again! Come back when you\'ve got a better... everything.'], () => g.toast('LOST THE BATTLE. TRY AGAIN!'));
      } });
  });
};

/* ============================================================ talk handlers ============================================================ */
BW6.talkBiscuit = function (g, a) {
  const st = g.missions.state('fire');
  if (st === 'available') g.say(a, ['BUDDY! Told you I\'d meet you out here! I brought snacks. And Gary.', 'See those fire belches out there? That\'s El Pulpo. It\'s doing laps all by itself. Spooky. Sparkly.', 'Follow the fire! I\'ll guard the snacks.'], () => g.missions.start('fire'));
  else if (st === 'active') g.say(a, ['Follow the fire! Big orange burps on the horizon!']);
  else if (!g.missions.isDone('board')) g.say(a, ['An octopus with a HOT TUB trailer. I\'m crying. These are happy tears. And dust.']);
  else if (!g.missions.isDone('party')) g.say(a, ['Park her at a glowing party spot, hop off, and THROW A PARTY. I\'ll bring Gary. Gary loves bass.']);
  else g.say(a, ['Best party in the history of parties. Gary agrees. Gary always agrees.']);
};
BW6.talkBarnacle = function (g, a) {
  const w = g.missions.state('water'), b = g.missions.state('board');
  if (w === 'locked') g.say(a, ['Water... water... have you seen a giant octopus? Copper? Fire? Hot tub?']);
  else if (w === 'available') g.say(a, ['That\'s my baby out there. El Pulpo. I welded every tentacle myself.', 'She\'s stuck on autopilot and I\'ve been chasing her for two days. Haven\'t had a drop.', 'There are cold jugs around deep playa: the Glowshroom Grove, up the Laser Pyramid, the Solar Bro Farm. Bring me three?'], () => g.missions.start('water'));
  else if (w === 'active') { const m = g.missions.get('water'); if (m.n >= 3) g.say(a, ['*glug glug glug* AHHH. I can see colors again. Thank you, kid.'], () => { g.missions.complete('water', { x: a.x + 1.5, y: 1.4, z: a.z + 1.5 }); BW567K.after(g, 0.6, g2 => BW6.talkBarnacle(g2, a)); }); else g.say(a, [`${m.n} of 3. Cold ones. My throat sounds like a dune.`]); }
  else if (b === 'available') g.say(a, ['Now. My baby. She won\'t stop. There\'s a KILL SWITCH on top of her head.', 'Run up the hot-tub trailer\'s back ramp, hop to the sucker steps on her head, climb up, and smack the big red button.', 'She does about four miles an hour. You can catch her. Probably.'], () => g.missions.start('board'));
  else if (b === 'active') g.say(a, ['Back ramp, sucker steps, big red button! GO!']);
  else {
    const L = [];
    if (g.missions.state('fireshow') === 'available') { L.push('She needs to stretch her lungs. Drive her into the Fire Garden and hold ACTION. Light all six Fire Lilies!'); }
    if (g.missions.state('party') === 'available' || g.missions.state('party') === 'active') L.push('And a party! Park her in a glowing party ring, hop off, THROW A PARTY at the booth. Forty people dancing and she\'ll be famous.', 'Jello shots are in the Jello Depot fridge here. Gift them to burners: they\'ll join right up.');
    if (!L.length) L.push('She\'s yours, kid. Take care of her. Feed her propane. Tell her she\'s pretty.');
    g.say(a, L, () => { if (g.missions.state('fireshow') === 'available') g.missions.start('fireshow'); if (g.missions.state('party') === 'available') g.missions.start('party'); });
  }
};
BW6.talkCrusty = function (g, a) {
  const S = BW6.state;
  if (a.data.party) { g.say(a, ['Fine. This slaps. It\'s still too corporate. It slaps, though.']); return; }
  if (S.party && S.party.on && S.shots > 0) { S.shots--; g.say(a, ['A jello shot? ...From a HOT TUB OCTOPUS? This is the most corporate thing I\'ve ever—', '*slurp* ...okay. This is kinda punk rock. Don\'t tell anyone.'], () => BW6.joinParty(g, a)); return; }
  g.say(a, ['TOO CORPORATE! An octopus with a HOT TUB? On Baker Beach we had a couch and a dream.', 'The burn peaked in \'96. Everything since has been a remix.']);
};
BW6.talkBadIdea = function (g, a) {
  const st = g.missions.state('stunt');
  if (st === 'locked') g.say(a, ['See that ramp? I built it for something big. Bigger than a bike. Bigger than my medical bills.']);
  else if (st === 'available') g.say(a, ['Is that THE octopus? Oh, I\'ve got the WORST idea.', 'Jump it. Off my dune ramp. Floor it straight up the ramp. Like, FAST.', 'What could go wrong? Don\'t answer that. My arm already answered that.'], () => g.missions.start('stunt'));
  else if (st === 'active') g.say(a, ['Straight up the ramp, full speed! Commit to the bad idea!']);
  else g.say(a, ['Best terrible idea I\'ve had all week. And I\'ve had SIX.']);
};
BW6.talkBurney = function (g, a) {
  if (a.data.posed) { g.say(a, ['Already got your good side. Both of them.']); return; }
  a.data.posed = true;
  g.say(a, ['Hold it! Pose! Bigger! BIGGER! Like you just commandeered an octopus!'], () => { g.screenFlash('#ffffff', 0.7); burnsSfx('camera_flash'); g.player.victoryT = 1.5; BW567K.after(g, 0.6, g2 => g2.say(a, ['PERFECT. Here, take some glow sticks. Party dads always carry spares.'], () => { g2.addGlow(10); g2.toast('BURNEY GIFTED 10 GLOW STICKS'); })); });
};

/* ============================================================ fire show, darkwads ============================================================ */
BW6.lightLily = function (g, L, quiet) {
  if (L.lit) return; L.lit = true;
  g.world.fires.push({ x: L.x, y: L.y, z: L.z, r: 0.6, hazard: false, t: Math.random() * 10 });
  if (!quiet) { g.fx.burst(L.x, L.y + 1, L.z, 'spark', 20, '#ffb040'); burnsSfx('flame_jet'); }
};
BW6.updateLilies = function (g, dt) {
  const S = BW6.state, c = S.car, p = g.player;
  if (g.missions.state('fireshow') !== 'active' || p.vehicle !== c || !p.inp.action) return;
  const cc = Math.cos(c.yaw), s = Math.sin(c.yaw);
  for (const q of c.poofers) {
    const x = c.x + q[0] * cc + q[2] * s, z = c.z - q[0] * s + q[2] * cc;
    for (const L of S.lilies) if (!L.lit && Math.hypot(L.x - x, L.z - z) < 4.2) { BW6.lightLily(g, L); g.missions.progress('fireshow', 1); }
  }
};
BW6.updateDarkwads = function (g, dt) {
  // the engine's darkwad behaviour hides them in the dark (headlights, glow sticks, fires and light pools reveal them);
  // here: driving El Pulpo into one stops the art car cold
  const S = BW6.state, p = g.player, c = S.car;
  if (p.vehicle !== c || Math.abs(c.speed) < 2.5) return;
  const fx = c.x + Math.sin(c.yaw) * 4.4, fz = c.z + Math.cos(c.yaw) * 4.4;
  for (let i = 0; i < 5; i++) {
    const a = g.actor('darkwad' + i); if (!a || (a.data.bonkT || 0) > g.time) continue;
    if (Math.hypot(a.x - fx, a.z - fz) < 2.4) { a.data.bonkT = g.time + 2; c.speed = -1; g.shake(0.5); burnsSfx('bump'); a.say(['WATCH IT! Some of us don\'t do lights!', 'I was here FIRST. In the dark.', 'Ever heard of a headlight? Oh. You have one.'][Math.floor(Math.random() * 3)], 2.2); a.vx = Math.sin(c.yaw) * 5; a.vz = Math.cos(c.yaw) * 5; a.vy = 4; a.grounded = false; g.toast('DARKWAD! LIGHT YOURSELF UP, PEOPLE!'); }
  }
};

/* ============================================================ story beats ============================================================ */
BW6.intro = function (g) {
  const S = BW6.state, c = S.car, p = g.player;
  g.cutscene([
    { music: 'burns_intro' },
    { cam: { x: 30, y: 30, z: 190, tx: 20, ty: 4, tz: 60, fov: 0.85 } },
    { banner: [BurnsWorlds.label(6).toUpperCase(), 'THE ART CAR HUNT · DEEP PLAYA', { col: '#ff7a2a', big: true, dur: 3 }] },
    { do: g2 => { S.belchT = 0.1; } },
    { cam: { from: { x: 30, y: 30, z: 190, tx: 20, ty: 4, tz: 60, fov: 0.85 }, to: { x: -6, y: 3.4, z: 162, tx: c.x, ty: 5, tz: c.z, fov: 0.6 }, dur: 4 } },
    { do: g2 => { S.belchT = 0.1; } },
    { wait: 0.8 },
    { say: ['brady', ['Fire on the horizon. Just like Biscuit said.', 'Okay, octopus. Let\'s see if you can outrun a wooden lover.']] },
    { do: g2 => { BurnsSave.flag(6, 'intro', true); S.introDone = true; g2.camYaw = Math.PI; g2.snapCam = true; burnsMusic('burns_w6'); } },
    { banner: ['FOLLOW THE FIRE', 'Talk to Biscuit, then chase the flames.', { col: '#ffd84a' }] }
  ]);
};
BW6.foundOcto = function (g) {
  const S = BW6.state, c = S.car, b = g.actor('barnacle');
  g.cutscene([
    { cam: { x: c.x + 14, y: 4, z: c.z + 10, tx: c.x, ty: 3.5, tz: c.z, fov: 0.85 } },
    { do: g2 => { S.belchT = 0.05; S.jiggle = 1; } },
    { wait: 1.0 },
    { say: ['brady', ['A fire-breathing octopus. Towing a HOT TUB. With nobody driving it.']] },
    { do: g2 => { if (b) { b.setBehavior('idle'); } } },
    { cam: { x: BW6.HQ.x + 4, y: 2.4, z: BW6.HQ.z + 4, tx: BW6.HQ.x - 1, ty: 1.2, tz: BW6.HQ.z - 1.2, fov: 0.8 } },
    { say: [b || 'brady', ['HEY! KID! That\'s my baby! Over here! At the HQ! ...Bring water?']] },
    { do: g2 => { if (b) b.setBehavior('sit'); } }
  ]);
};
BW6.chadArrives = function (g) {
  const S = BW6.state, P = S.party, c = g.actor('chad'), p = g.player; if (!c || S.chadOn) return;
  S.chadOn = true;
  const A = { x: P ? P.x : p.x, z: P ? P.z : p.z };
  c.data.arena = A; c.x = A.x + 18; c.z = A.z + 6; c.y = g.world.height(c.x, c.z); c.home = { x: A.x, z: A.z };
  g.missions.start('boss', true);
  g.cutscene([
    { music: 'man_boss' },
    { cam: { x: A.x - 6, y: 3.5, z: A.z - 6, tx: c.x, ty: 2.5, tz: c.z, fov: 0.85 } },
    { do: g2 => { burnsSfx('artcarHorn', { pitch: 1.8 }); g2.shake(0.3); } },
    { banner: ['CHAD, FOUNDER & CEO', 'Octopus-as-a-Service · Boss', { col: '#38f2ff', big: true, dur: 3 }] },
    { say: [c, ['Whoa whoa whoa. Forty users? Organic growth? A HOT TUB?', 'This party is now a PLATFORM. I\'m acquiring it. And the octopus. And your bun.']] },
    { say: ['brady', ['It\'s not for sale. Nothing out here is.']] },
    { say: [c, ['Everything\'s for sale. VC DRONES! Let\'s DISRUPT this vibe!']] },
    { do: g2 => { c.data.mode = 'circle'; c.data.t = 3.5; c.data.ang = Math.atan2(c.x - A.x, c.z - A.z); c.data.cw = 1; g2.boss = BW567K.bar('CHAD, FOUNDER & CEO', c, 4, { get st() { return c.data.mode === 'dizzy' ? 'stunned' : c.data.mode; } }); g2.banner('FIGHT!', 'Spin away pitch decks · dodge the term-sheet drops · make him crash, then bonk (or flame) him', { col: '#38f2ff' }); } }
  ]);
};
BW6.chadDefeated = function (g) {
  const S = BW6.state, c = g.actor('chad');
  g.boss = null; S.chadOn = false;
  c.data.mode = 'beaten';
  g.missions.complete('boss');
  BurnsSave.get().octopus = true; BurnsSave.flag(6, 'octopus', true); BurnsSave.save(); g.giveItem('artcar', true);
  BW567K.after(g, 1.2, g2 => {
    const b = g2.actor('biscuit'), bar = g2.actor('barnacle'), car = S.car;
    if (b) { b.setBehavior('dance'); b.x = S.trailer.x + 4; b.z = S.trailer.z + 3; b.y = g2.world.height(b.x, b.z); }
    if (bar) { bar.setBehavior('dance'); bar.x = S.trailer.x + 5; bar.z = S.trailer.z - 3; bar.y = g2.world.height(bar.x, bar.z); }
    g2.cutscene([
      { music: 'burns_victory' },
      { cam: { x: c.x + 4, y: 2.6, z: c.z + 4, tx: c.x, ty: 2.2, tz: c.z, fov: 0.85 } },
      { say: [c, ['My unicycle... my drones... my valuation...', 'What if... the product... was just... FUN? For free?']] },
      { say: ['brady', ['Now you get it. Grab a jello shot.']] },
      { do: g3 => { c.setBehavior('dance'); c.friendly = true; for (let i = 0; i < 3; i++) BW567K.after(g3, i * 0.4, g4 => { const t = BW6.cw(0, BW6.MANTLE.y + 6.4, BW6.MANTLE.z); g4.fx.firework(t[0] + (Math.random() - 0.5) * 8, t[1] + 8 + Math.random() * 6, t[2] + (Math.random() - 0.5) * 8, BURNS_NEON[i * 2]); burnsSfx('firework_burst'); }); S.belchT = 0.05; } },
      { cam: { x: car.x + 12, y: 6, z: car.z + 12, tx: car.x, ty: 3.5, tz: car.z, fov: 0.9 } },
      { say: [bar || 'brady', ['Kid. She\'s yours now. Really yours.', 'She\'ll be thirsty for propane by morning. Hell Station is the only fuel on the playa. Watch out for DPW.']] },
      { say: [b || 'brady', ['Platonic buddies, art car owners, PARTY LEGENDS. Go get Chinka back, buddy!']] },
      { do: g3 => { g3.player.victoryT = 3; burnsSfx('crowd_cheer'); g3.fx.confetti(g3.player.x, g3.player.y + 2, g3.player.z, 60); } },
      { wait: 1.2 }
    ], g3 => g3.finishWorld());
  });
};

/* ============================================================ drawing ============================================================ */
BW6.sprites = function (g, R) {
  const S = BW6.state, Sp = BURNS_SPRITES.R, t = g.time, c = S.car;
  // laser pyramid beams sweeping the sky
  const P = BW6.PYR, ap = [P.x, 9.6, P.z];
  for (let i = 0; i < 4; i++) {
    const a = t * 0.3 + i * TAU / 4, el = 0.9 + Math.sin(t * 0.5 + i) * 0.3, len = 160;
    const dx = Math.sin(a) * Math.cos(el), dy = Math.sin(el), dz = Math.cos(a) * Math.cos(el);
    const col = burnsRGBf(BURNS_NEON[(i * 2) % 7]);
    for (let k = 1; k <= 6; k++) { const d = k / 6 * len; R.bbs.streak(ap[0] + dx * d, ap[1] + dy * d, ap[2] + dz * d, dx, dy, dz, len / 5.2, 0.5, Sp.glow, col, 0.6); }
  }
  // party lights + disco sparkles
  if (S.party && S.party.on && S.deployK > 0.5) {
    const L = BW6.tw(0, 4.4, -0.4);
    for (let k = 0; k < 6; k++) { const a = t * 1.6 + k, d = 9; const ex = L[0] + Math.sin(a) * d, ez = L[2] + Math.cos(a) * d; R.flat.flat(ex, g.world.height(ex, ez) + 0.06, ez, 3.4, 3.4, 0, Sp.glow, burnsRGBf(BURNS_NEON[k]), 0.55, true); }
    const db = BW6.tw(0.6, 3.85, 0.6);
    R.bbs.bb(db[0], db[1], db[2], 2.6, 2.6, Sp.glow, [1, 1, 1], 0.5 + Math.sin(t * 9) * 0.2, true);
    if (Math.random() < 0.5) g.fx.glint(db[0] + (Math.random() - 0.5), db[1] + (Math.random() - 0.5), db[2] + (Math.random() - 0.5), BURNS_NEON[Math.floor(Math.random() * 7)]);
    g.pointLight(L[0], 4, L[2], 22, [1, 0.3, 0.8], 1.4);
  }
  // octopus eye glow + googly highlight
  const e = BW6.cw(0, BW6.MANTLE.y + 3.8, BW6.MANTLE.z + 2.9);
  R.bbs.bb(e[0], e[1], e[2], 1.2, 1.2, Sp.glow, [1, 1, 1], 0.25, true);
};
BW6.overlay = function (ctx, g) {
  const S = BW6.state, W = Game.cssW, R = g.R, o = {};
  // projectile labels (pitch decks)
  for (const q of g.proj.list) { if (!q.text || q.dead) continue; if (!R.project(q.x, q.y + 0.6, q.z, W, Game.cssH, o) || o.w > 40) continue; BurnsUI.text(ctx, q.text, o.x, o.y, clamp(160 / o.w, 9, 15), '#bff8ff', { glow: '#38f2ff' }); }
  // the octopus talks (burps, honks)
  if (S.sayT > 0) { const c = S.car; if (R.project(c.x, c.y + 9.2, c.z, W, Game.cssH, o) && o.w < 60) BurnsUI.text(ctx, S.say, o.x, o.y, clamp(300 / o.w, 12, 22), '#ffd84a', { glow: '#ff7a2a' }); }
  if (g.cine || BW567K.busy(g)) return;
  const P = S.party, n = BW6.count(g);
  if ((P && P.on) || (g.missions.state('party') === 'active' && g.player.vehicle === S.car)) {
    const w = Math.min(W - 40, 360), x = (W - w) / 2, y = (g.topStack || 40) + 4;
    ctx.save(); ctx.fillStyle = 'rgba(20,6,30,0.72)'; rr(ctx, x, y, w, 40, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,79,216,0.7)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    BurnsUI.text(ctx, P && P.on ? `PARTY · ${P.spot.name}` : 'FIND A PARTY SPOT', x + 10, y + 11, 10, '#ffd84a', { align: 'left', stroke: false });
    BurnsUI.text(ctx, `${n}/${BW6.GOAL}`, x + w - 10, y + 13, 16, n >= BW6.GOAL ? '#7aff5a' : '#ffffff', { align: 'right' });
    BurnsUI.text(ctx, `JELLO ×${S.shots}`, x + w - 64, y + 13, 10, '#ff9ad8', { align: 'right', stroke: false });
    const e = P && P.on ? P.energy / 100 : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x + 10, y + 24, w - 100, 8);
    const gr = ctx.createLinearGradient(x + 10, 0, x + w - 90, 0); gr.addColorStop(0, '#ff4fd8'); gr.addColorStop(1, '#ffd84a'); ctx.fillStyle = gr; ctx.fillRect(x + 10, y + 24, (w - 100) * e, 8);
    BurnsUI.text(ctx, 'ENERGY', x + w - 84, y + 28, 9, '#ffffff', { align: 'left', stroke: false });
  }
};

/* ---------------- unicycles + e-bike under their riders; rider seat heights ---------------- */
BW6.updateUnis = function (g, dt) {
  const S = BW6.state, U = S.uniP; if (!U) return;
  const used = new Array(9).fill(false);
  for (const a of g.actors) {
    const i = a.def.uni; if (i === undefined || a.removed) continue;
    if (!a.bw6draw) { a.bw6draw = true; const d0 = a.draw.bind(a); a.draw = R => { d0(R); a.ch.y = a.y + (a.seatY || 0); }; }
    const giant = i === 7, s = giant ? 2.6 : 1;
    if (a.hidden) { U.off(i); continue; }
    if (a.defeated && a.behName !== 'bw6Chad' && a.behName !== 'dance') { U.set(i, a.x + 0.9, a.y + 0.2, a.z, a.yaw, 0, 1.45, s); a.seatY = 0; used[i] = true; continue; }
    if (a.behName === 'dance' || a.data.mode === 'dizzy' || a.data.mode === 'beaten') { U.set(i, a.x + Math.cos(a.yaw) * 1.6 * s, a.y + 0.2 * s, a.z - Math.sin(a.yaw) * 1.6 * s, a.yaw, 0, 1.45, s); a.seatY = 0; used[i] = true; continue; }
    const lean = clamp(Math.hypot(a.vx, a.vz) * 0.03, 0, 0.25);
    U.set(i, a.x, a.y, a.z, a.yaw, lean, Math.sin(g.time * 3 + i) * 0.04, s);
    a.seatY = giant ? 0.78 : 0.3; used[i] = true;
  }
  for (let i = 0; i < 8; i++) if (!used[i]) U.off(i);
  const pr = g.actor('preston');
  if (pr && !pr.hidden) { U.set(8, pr.x, pr.y, pr.z, pr.yaw); pr.seatY = 0.32; if (!pr.bw6draw) { pr.bw6draw = true; const d0 = pr.draw.bind(pr); pr.draw = R => { d0(R); pr.ch.y = pr.y + (pr.seatY || 0); }; } } else U.off(8);
};

/* test/debug access to this world's state (no globals) */
BurnsWorlds.get(6).dbg = BW6;
