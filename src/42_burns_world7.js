/* ============================================================
   BRADY GOES TO BURNING MAN — World 7 (id 7; its number in play order comes from BurnsWorlds.label): SUNRISE SET (pre-dawn -> sunrise)
   Deep playa at dawn. HEARTBEAT, a heart-topped sound art car (our own design),
   parks for the legendary sunrise set. The sun comes up as Brady earns tokens.
   The DJ at the decks is a small respectful silhouette; nobody puts words in
   his mouth. Burners just name-drop him in their chatter.
   Missions (Burn Tokens):
     race       Beat the Sunrise       timed yellow-bike ride across deep playa to the heart car
     ponies     Thirst Trap            8 water bottles for the Sparkle Ponies
     photobomb  The Selfie Strip       get down the strip without ending up in anyone's story
     crusty     Back In My Day         out-argue three crusties (choices), then climb Carl's wobbly tower
     danceoff   Dance-Off              tap-on-the-beat battle with Shuffle Sal (rhythm minigame)
     summit     Top of the Heart       climb HEARTBEAT to its crown as the sun breaks the horizon
     boss       The Glitter Queen      drone swarm, ring-light glare, glitter bombs
   Side: Lost Sole (find the Guy Who Partied Too Hard's boot)
   ============================================================ */

const BW7 = {
  CAR: { x: 0, z: -96 }, FLOOR: { x: 0, z: -66, r: 22 }, CAMP: { x: -84, z: 4 }, PONY: { x: 82, z: 6 },
  STRIP: { x0: -74, z0: -36, x1: -34, z1: -80 }, PLAT: { x: -24, z: -58 }, PIER: { x: 96, z: -30 }, GALLEON: { x: 112, z: -104, rot: Math.PI / 2 },
  SUMMIT: { x: 0, z: -99.6, y: 14.4 },
  state: null
};
BW7.SKY_A = Object.assign({}, BURNS_PALETTES.dawn, { zen: '#141a40', mid: '#4a2a62', midK: 0.55, hor: '#ff8a7a', fog: '#5a4868', fogD: 0.0085, haze: 0.6, sun: [180, -5], sunCol: '#ff8a5a', sunSize: 0.0024, moon: [250, 26], moonK: 0.7, stars: 0.55, mtnCol: '#2a1a3a', city: [0, 0], cityCol: '#ff70c0', cityK: 0.2, sky: '#8a7ab8', gnd: '#5a4458', key: '#c8b0e0', keyK: 0.6, emB: 1.45, rim: '#ffb0d8', clouds: 0.35, cloudCol: '#ff9ab8' });
BW7.SKY_B = Object.assign({}, BURNS_PALETTES.dawn, { zen: '#3a64b0', mid: '#ffa0b8', midK: 0.6, hor: '#ffd890', fog: '#f4c0a0', fogD: 0.007, haze: 0.62, sun: [180, 10], sunCol: '#ffd090', sunSize: 0.0032, moon: [250, 18], moonK: 0.1, stars: 0, mtnCol: '#8a5a7a', sky: '#d8b8c8', gnd: '#c89a80', key: '#ffc890', keyK: 1.0, emB: 1.2, rim: '#ffd0a0', clouds: 0.55, cloudCol: '#ffb8a0' });

BurnsWorlds.register({
  id: 7, name: 'Sunrise Set', sub: 'A heart-topped sound car at dawn',
  sky: BW7.SKY_A, sky2: BW7.SKY_B, tod: 0,
  music: 'burns_w7',
  bounds: [-150, -212, 150, 160],
  spawn: { x: 2, y: 0, z: 140, yaw: Math.PI },
  ground: { base: '#c8a088', crack: 0.28, mottle: 0.4, res: 0.5 },
  dust: 1.0,
  bike: true,
  missions: [
    { id: 'race', name: 'Beat the Sunrise', short: 'Ride to the heart car!', type: 'ride', vehicle: 'bike', time: 42, giver: 'biscuit', start: 'manual', target: { x: 0, z: -44, r: 8 }, marker: { x: 0, z: -44 },
      desc: 'The sunrise set is starting. Ride the yellow bike through the glowing arches to the heart car before the clock runs out.', hint: 'Start at Biscuit\'s camp; finish at the dance floor',
      onStart(g) { BW7.raceStart(g); }, onFail(g) { BW7.raceFail(g); }, onComplete(g) { BW7.raceDone(g); } },
    { id: 'ponies', name: 'Thirst Trap', short: 'Find 8 water bottles for the ponies', type: 'collect', count: 8, giver: 'ponyqueen', start: 'manual', progressLabel: 'Water bottles', marker: { x: 82, z: 6 }, tokenAt: { x: 80, y: 1.4, z: 9 },
      desc: 'The Sparkle Ponies brought three suitcases of costumes and zero water. Find 8 bottles scattered around the playa. Watch your pockets.', hint: 'The Thirst Trap, east of the dance floor',
      onStart(g) { for (const P of g.pickups.items) if (P.mission === 'ponies') P.taken = false; },
      onComplete(g) { BW7.poniesDone(g); } },
    { id: 'photobomb', name: 'The Selfie Strip', short: 'Get down the Selfie Strip unseen', type: 'stealth', giver: 'stripguide', start: 'manual', target: { x: -34, z: -80, r: 4 }, marker: { x: -54, z: -58 },
      desc: 'Influencers line the Selfie Strip. One flash and you\'re in their story forever. Sneak from one end to the other behind the giant letters and frames.', hint: 'The Selfie Strip, north-west of the dance floor',
      onStart(g) { BW7.stripStart(g); }, onFail(g) { BW7.stripFail(g); } },
    { id: 'crusty', name: 'Back In My Day', short: 'Out-argue the crusties', type: 'custom', giver: 'carl', start: 'manual', marker: { x: -84, z: 4 }, tokenAt: { x: -84.6, y: 14.2, z: 1.4 },
      desc: 'Carl and his crew insist the burn peaked on Baker Beach. Win the argument, then climb his wobbly tower for the prize.', hint: 'Camp Back In My Day, west of the dance floor (the wobbly tower)' },
    { id: 'danceoff', name: 'Dance-Off', short: 'Out-dance Shuffle Sal', type: 'custom', giver: 'sal', start: 'manual', marker: { x: -24, z: -58 },
      desc: 'Shuffle Sal hasn\'t lost a dance-off since the sun was invented. Tap JUMP and SPIN on the beat.', hint: 'The round dance platform by the dance floor' },
    { id: 'summit', name: 'Top of the Heart', short: 'Climb to the heart car\'s crown', type: 'climb', start: 'auto', requires: ['race'], target: { x: 0, z: -99.6, r: 2.2, y: 14.2 }, marker: { x: 0, z: -96 }, tokenDirect: true,
      desc: 'Climb HEARTBEAT: speaker stacks, the deck stairs, the scaffold behind the heart, then the crown. Be up there when the sun breaks.', hint: 'The heart car, north end of the dance floor', lockedDesc: 'Make it to the set first.',
      onComplete(g) { BW7.sunrise(g); } },
    { id: 'boss', name: 'The Glitter Queen', type: 'boss', start: 'manual', requires: ['summit'], tokenDirect: true, short: 'Defeat the Glitter Queen!', marker: { x: 0, z: -66 },
      desc: 'She wants the sunrise for her content. Dodge her drone swarm, hide from the ring-light glare, then bonk her while she checks her likes.', hint: 'She descends on the dance floor at sunrise', lockedDesc: 'Watch the sunrise from the top of the heart first.' },
    { id: 'boot', name: 'Lost Sole', short: 'Find the lost boot', type: 'find', token: false, giver: 'toohard', start: 'manual', marker: { x: 40, z: 60 },
      desc: 'A guy who partied way too hard lost a boot. Somewhere. He thinks. Find it.', hint: 'He wanders between the race course and the Thirst Trap',
      onComplete(g) { BW7.bootFound(g); } }
  ],
  build(api, g) {
    const R = api.rng;
    BW7.state = { introDone: !!BurnsSave.flag(7, 'intro'), wob: [], drones: [], speedK: 1, quiz: 0 };
    /* ---------------- ground ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 150; i++) { const [px, pz] = P(R.range(-150, 150), R.range(-212, 160)), r = R.range(3, 11) * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; g2.addColorStop(0, dark ? 'rgba(130,90,80,0.22)' : 'rgba(250,220,200,0.2)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      // the dance floor: trampled dust with a pink glow ring
      const F = BW7.FLOOR, [fx, fz] = P(F.x, F.z), fr = F.r * sc;
      const gf = c.createRadialGradient(fx, fz, fr * 0.1, fx, fz, fr * 1.1); gf.addColorStop(0, 'rgba(240,200,180,0.5)'); gf.addColorStop(0.9, 'rgba(230,180,170,0.4)'); gf.addColorStop(1, 'rgba(230,180,170,0)'); c.fillStyle = gf; c.beginPath(); c.arc(fx, fz, fr * 1.1, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,90,170,0.5)'; c.lineWidth = 0.6 * sc; c.beginPath(); c.arc(fx, fz, fr, 0, TAU); c.stroke();
      // race course: tyre tracks through the arches
      c.strokeStyle = 'rgba(110,80,70,0.3)'; c.lineWidth = 0.35 * sc; c.beginPath(); BW7.COURSE.forEach((q, i) => { const [x, z] = P(q[0], q[1]); i ? c.lineTo(x, z) : c.moveTo(x, z); }); c.stroke();
      // the selfie strip: a pink carpet
      c.strokeStyle = 'rgba(255,120,190,0.55)'; c.lineWidth = 3.4 * sc; c.lineCap = 'round'; const [a, b] = P(BW7.STRIP.x0, BW7.STRIP.z0), [d, e] = P(BW7.STRIP.x1, BW7.STRIP.z1); c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke();
    });
    BW7.buildCamp(api, g);
    BW7.buildCourse(api, g);
    BW7.buildHeart(api, g);
    BW7.buildFloor(api, g);
    BW7.buildStrip(api, g);
    BW7.buildCrusty(api, g);
    BW7.buildPonies(api, g);
    BW7.buildDancePlat(api, g);
    BW7.buildPier(api, g);
    BW7.buildWanderers(api, g);
    BW7.makePuppets(g);
    api.marker('heart', BW7.CAR.x, BW7.CAR.z, 'Heartbeat', { col: '#ff4fa8' });
    api.marker('camp', BW7.CAMP.x, BW7.CAMP.z, 'Back In My Day', { col: '#c8a070' });
    api.marker('ponies', BW7.PONY.x, BW7.PONY.z, 'Thirst Trap', { col: '#ff9ad0' });
    BW567K.sanitizeActors(api);
  },
  onStart(g) {
    const S = BW7.state;
    BW567K.speedHook(g); BW567K.camHook(g);
    g.tod = Math.min(1, BurnsSave.tokenCount(7) * 0.12 + (g.missions.isDone('summit') ? 0.4 : 0));
    if (g.missions.isDone('race')) BW7.setOn(g, true);
    const q = g.actor('queen'); if (q && !g.missions.isDone('boss')) q.hidden = true;
    if (!S.introDone) BW7.intro(g);
    else BW567K.after(g, 4.6, g2 => g2.banner('SUNRISE SET', 'The sun waits for no one. Neither does the bass.', { col: '#ffb0d8' }));
  },
  onRespawn(g) { const S = BW7.state; if (S.queenOn) { const q = g.actor('queen'); if (q && !q.defeated) { q.data.mode = 'float'; q.data.t = 3; } } },
  update(g, dt) {
    BW567K.tick(g, dt);
    BW7.updateWobble(g, dt);
    BW7.updateCar(g, dt);
    BW7.updateRants(g, dt);
    BW7.updateQueenRig(g, dt);
    const want = Math.min(1, BurnsSave.tokenCount(7) * 0.12 + (g.missions.isDone('summit') ? 0.4 : 0));
    if (g.tod < want - 0.001 && g.todTarget === null) g.setTod(want, 0.025);
  },
  env(g, env) { const S = BW7.state; if (S.glare > 0) { env.emB += S.glare; } },
  drawSprites(g, R) { BW7.sprites(g, R); },
  bw567Overlay(ctx, g) { BW7.overlay(ctx, g); }
});

/* ============================================================ builders ============================================================ */
BW7.COURSE = [[2, 126], [-14, 92], [12, 54], [-10, 16], [8, -18], [0, -44]];
BW7.buildCamp = function (api, g) {
  // Brady's dawn camp: El Pulpo out of propane, Biscuit with coffee
  api.prop('shade', { x: -8, z: 146, w: 6, d: 5, col: '#c8a0d8' });
  api.prop('couch', { x: -8, z: 147, yaw: Math.PI, col: '#5a2a5a' });
  api.mesh(16, 150, m => { // El Pulpo, parked and sputtering (a static stand-in, out of fuel)
    m.color('#2c2630'); BW567K.rbox(m, 0, 0.9, 0, 3.9, 0.62, 8.6, 0.24);
    m.color('#6a4630'); BW567K.rbox(m, 0, 1.45, 0.05, 4.3, 0.28, 9.1, 0.12);
    m.color('#c86a3e').shine(2); BW567K.lathe(m, 0, 1.6, -1.65, [[0, 0], [2.0, 0.02], [2.6, 0.55], [2.86, 1.6], [2.78, 2.9], [2.36, 4.1], [1.62, 5.05], [0.75, 5.55], [0, 5.68]], { seg: 22 }); m.shine(0);
    for (const sx of [1, -1]) { m.color('#fbf6ec').shine(3); BW567K.ball(m, sx * 1.12, 4.15, 0.95, 0.72); m.color('#14101a'); BW567K.ellip(m, sx * 1.15, 3.9, 1.5, 0.36, 0.2, 0.3); m.shine(0); }
    for (let i = 0; i < 8; i++) { const a = (i / 8 - 0.5) * 5.4, x = Math.sin(a) * 2.4, z = -1.65 + Math.cos(a) * 2.4; m.color(i % 2 ? '#c86a3e' : '#d47448'); BW567K.tube(m, [[x, 2.0, z], [x * 2.0, 0.6, z * 1.2 - 0.4], [x * 2.6, 0.2, z * 1.4 - 0.5]], [0.45, 0.3, 0.15], { seg: 8 }); }
    const reg = BURNS_ATLAS.sign('OUT OF PROPANE', { bg: '#2a1408', fg: '#ff9a4a', size: 24, pad: 8 });
    m.color('#ffffff', 0.4); m.decal(0, 2.6, 4.6, 2.4, 2.4 / reg.aspect, reg); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.15, hz: 4.55, y0: 0, y1: 1.6 }, { t: 'cyl', x: 0, z: -1.65, r: 2.6, y0: 1.6, y1: 6.8 }] };
  }, { yaw: -0.4 });
  api.npc({ id: 'biscuit', name: 'BISCUIT', spec: BW6.biscuitSpec ? BW6.biscuitSpec() : BW567K.who('burner', 555), x: -3, z: 136, yaw: Math.PI, always: true,
    chat: ['Sunrise set! SUNRISE SET!', 'El Pulpo coughed all night. Poor baby needs propane.', 'Gary is wearing sunglasses. Gary is ready.'],
    talk(g, a) { BW7.talkBiscuit(g, a); } });
  api.checkpoint('cp_camp', -12, 134, { yaw: Math.PI, name: 'Dawn Camp' });
  api.sign('RACE THE SUNRISE  ↑\nHEARTBEAT · SUNRISE SET', 6, 124, { yaw: 0, h: 1.2, style: { bg: '#2a1440', fg: '#ffd84a', size: 24, border: '#ff4fa8', glow: '#ff4fa8' }, glow: '#ff4fa8' });
  api.pickup('water', -6, 0.9, 128);
  api.npc({ type: 'burner', seed: 71, name: 'SUNRISE SMOOTHIE SUE', x: 22, z: 132, yaw: -2.6, lines: ['Sunrise smoothies! Mango, kale, regret.', 'It\'s free. Everything\'s free. That\'s the whole thing.'], gift: { kind: 'water' } });
};
BW7.buildCourse = function (api, g) {
  // glowing arches to ride through, sculptures to dodge
  BW7.COURSE.slice(1, 5).forEach(([x, z], i) => {
    const col = ['#ff4fd8', '#38f2ff', '#ffd84a', '#7aff5a'][i];
    api.mesh(x, z, m => { m.color(col, 0.7).shine(2); m.push(); m.tf(0, 0, 0, 0, 0, Math.PI / 2); BW567K.torus(m, 0, 0, 0, 3.4, 0.25, { seg: 22, tseg: 6 }); m.pop(); m.emissive(0).shine(0); m.color('#2a2a34'); for (const sx of [-1, 1]) BW567K.rcyl(m, sx * 3.4, 0, 0, 0.3, 0.6, 0.1); return { cols: [{ t: 'cyl', x: -3.4, z: 0, r: 0.35, y0: 0, y1: 6.5 }, { t: 'cyl', x: 3.4, z: 0, r: 0.35, y0: 0, y1: 6.5 }] }; }, { yaw: Math.PI / 2 + Math.atan2(BW7.COURSE[i + 2][0] - x, BW7.COURSE[i + 2][1] - z) - Math.PI / 2 });
    api.glow(x, 3.6, z, 3, col, { blink: 2 });
    api.light(x, z, 9, col, 0.3);
    api.glowLine(x, z + 6, x, z - 6, 4, 1.2);
  });
  // dodge these: sculptures planted near the line
  const sculpt = [[-2, 74, '#ff9ad8'], [6, 34, '#9adcff'], [-4, -2, '#ffe28a'], [14, 70, '#c8a0ff'], [-16, 30, '#7aff9a']];
  for (const [x, z, col] of sculpt) api.lathe(x, 0, z, [[1.2, 0], [1.4, 0.6], [0.6, 2.2], [1.6, 3.4], [1.7, 3.6], [0.9, 4.6], [0, 5.0]], col, { seg: 12, gloss: 2, e: 0.15 });
  api.sign('NO BRAKES\nNO PROBLEMS', 18, 100, { yaw: -0.3, h: 1.0, style: { bg: '#fff4d8', fg: '#2a1a10', size: 24 } });
};
BW7.buildHeart = function (api, g) {
  const C = BW7.CAR;
  // lower deck: a big rounded pink chassis on six wheels
  api.mesh(C.x, C.z, m => {
    m.color('#d83a7a').shine(2); BW567K.rbox(m, 0, 1.4, 0, 9, 2.0, 16, 0.6, { top: '#5a2a3a' }); m.shine(0);
    m.color('#ffd0e0', 0.6); for (let i = 0; i < 10; i++) { const z = -7 + i * 1.55; for (const sx of [-1, 1]) { m.push(); m.tf(sx * 4.52, 1.35, z, sx * Math.PI / 2); BW567K.pillow(m, BW567K.heartOutline(18).map(p => [p[0] * 0.8, p[1] * 0.8]), 0.08, { rings: 2 }); m.pop(); } } m.emissive(0);
    for (const z of [-5.5, 0, 5.5]) for (const sx of [-1, 1]) { m.push(); m.tf(sx * 4.3, 0.75, z, 0, 0, Math.PI / 2); m.color('#1a1a1e'); BW567K.rcyl(m, 0, -0.4, 0, 0.75, 0.8, 0.2); m.color('#ffd84a'); BW567K.rcyl(m, 0, -0.42, 0, 0.32, 0.84, 0.08); m.pop(); }
    // pillars to the upper deck
    m.color('#ff7ab8').shine(2); for (const [x, z] of [[-3.6, -7.2], [3.6, -7.2], [-3.6, 2.8], [3.6, 2.8]]) BW567K.rcyl(m, x, 2.4, z, 0.28, 3.3, 0.1); m.shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 4.5, hz: 8, y0: 0, y1: 2.4, cover: true }].concat([[-3.6, -7.2], [3.6, -7.2], [-3.6, 2.8], [3.6, 2.8]].map(([x, z]) => ({ t: 'cyl', x, z, r: 0.3, y0: 2.4, y1: 5.6, camPass: true }))) };
  });
  // front speaker stacks (climbable) + a step
  for (const sx of [-1, 1]) {
    api.mesh(C.x + sx * 3.2, C.z + 9.4, m => {
      m.color('#1a1418').shine(1); BW567K.rbox(m, 0, 1.2, 0, 2.2, 2.4, 1.8, 0.2); m.shine(0);
      for (const [y, r] of [[1.75, 0.5], [0.65, 0.42]]) { m.push(); m.tf(0, y, 0.91, 0, Math.PI / 2); m.color('#3a3a44'); BW567K.torus(m, 0, 0, 0, r, 0.07, { seg: 16, tseg: 4 }); m.color('#ff4fa8', 0.5); m.cyl(0, -0.02, 0, r * 0.45, r * 0.45, 0.03, 12, {}); m.emissive(0); m.pop(); }
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.9, y0: 0, y1: 2.4, cover: true }] };
    });
    BW567K.rb(api, C.x + sx * 3.2, 0, C.z + 11.1, 1.6, 1.2, 1.2, '#2a2228', { r: 0.18 });
  }
  api.pickup('photo', C.x + 3.2, 3.3, C.z + 9.4, { id: 'p2' });
  // stairs up to the upper deck (left side)
  // (they climb from the chassis roof toward the stage's front edge at z + 3.5, clear of the pillars)
  [3.3, 4.2, 5.1].forEach((y, i) => BW567K.rb(api, C.x - 3.4, y - 0.3, C.z + 7.3 - i * 1.25, 1.6, 0.3, 1.1, '#ff9ac8', { r: 0.1 }));
  // the upper deck (the stage)
  BW567K.rb(api, C.x, 5.6, C.z - 2.0, 8.4, 0.4, 11, '#5a2a3a', { r: 0.18, top: '#7a3a4a' });
  api.mesh(C.x, C.z, m => { m.color('#ffd84a').shine(2); for (const sx of [-1, 1]) BW567K.limb(m, sx * 4.1, 6.9, -7.4, sx * 4.1, 6.9, 3.4, 0.05); for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) BW567K.limb(m, sx * 4.1, 6.0, -7.4 + i * 2.16, sx * 4.1, 6.9, -7.4 + i * 2.16, 0.04); m.shine(0); return { cols: [{ t: 'box', x: -4.1, z: -2, hx: 0.08, hz: 5.4, y0: 6.0, y1: 6.95, walk: false }, { t: 'box', x: 4.1, z: -2, hx: 0.08, hz: 5.4, y0: 6.0, y1: 6.95, walk: false }] }; });
  // the DJ booth (front of the stage, facing the crowd)
  api.mesh(C.x, C.z + 1.4, m => {
    m.color('#1a1018').shine(1); BW567K.rbox(m, 0, 6.55, 0, 3.2, 1.1, 1.0, 0.2); m.shine(0);
    m.color('#ff4fa8', 1); m.box(0, 6.4, 0.51, 3.0, 0.08, 0.02); m.emissive(0);
    for (const sx of [-1, 1]) { m.color('#0d0d12'); BW567K.rcyl(m, sx * 0.8, 7.1, 0, 0.3, 0.05, 0.01); m.color('#38f2ff', 0.8); BW567K.torus(m, sx * 0.8, 7.16, 0, 0.27, 0.014, { seg: 14, tseg: 3 }); m.emissive(0); }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 0.5, y0: 6.0, y1: 7.1 }] };
  });
  // scaffold behind the heart up to the crown
  const sc = [[1.4, 7.8], [-1.4, 9.6], [1.4, 11.4], [-1.4, 13.2]];
  api.mesh(C.x, C.z - 6.6, m => { m.color('#9aa0aa'); for (const [x, z] of [[-2.2, -0.8], [2.2, -0.8], [-2.2, 0.8], [2.2, 0.8]]) BW567K.limb(m, x, 6.0, z, x, 13.6, z, 0.06); return { cols: [] }; });
  sc.forEach(([x, y]) => BW567K.rb(api, C.x + x, y - 0.25, C.z - 6.6, 2.2, 0.25, 1.6, '#c8965a', { r: 0.06 }));
  // the crown platform (the summit) above the heart's cleft
  api.mesh(C.x, BW7.SUMMIT.z, m => { m.color('#ffd84a').shine(3); BW567K.rcyl(m, 0, BW7.SUMMIT.y - 0.35, 0, 1.55, 0.35, 0.12); BW567K.torus(m, 0, BW7.SUMMIT.y + 0.8, 0, 1.5, 0.05, { seg: 18, tseg: 4 }); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; BW567K.limb(m, Math.sin(a) * 1.5, BW7.SUMMIT.y, Math.cos(a) * 1.5, Math.sin(a) * 1.5, BW7.SUMMIT.y + 0.8, Math.cos(a) * 1.5, 0.035); } m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.55, y0: BW7.SUMMIT.y - 0.35, y1: BW7.SUMMIT.y }] }; });
  api.light(C.x, C.z + 6, 18, '#ff4fa8', 0.5);
  api.checkpoint('cp_heart', C.x + 7.5, C.z + 12, { yaw: Math.PI, name: 'Heartbeat' });
  api.glowArc(C.x - 3.2, 1.8, C.z + 11.1, C.x - 3.2, 3.2, C.z + 9.4, 0.5, 3); api.glowArc(C.x - 3.4, 3.8, C.z + 7.3, C.x - 3.4, 6.4, C.z + 3.0, 0.6, 4);
  sc.forEach(([x, y], i) => { if (i) api.pickup('glowstick', C.x + x, y + 0.9, C.z - 6.6); });
};
BW7.buildFloor = function (api, g) {
  const F = BW7.FLOOR;
  // cover for the ring-light glare: speaker towers around the floor
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.5, x = F.x + Math.sin(a) * 15, z = F.z + Math.cos(a) * 15; api.mesh(x, z, m => { m.color('#1a1418').shine(1); BW567K.rbox(m, 0, 1.5, 0, 1.6, 3.0, 1.4, 0.2); m.shine(0); m.push(); m.tf(0, 2.0, 0.71, 0, Math.PI / 2); m.color('#ff4fa8', 0.5); m.cyl(0, -0.02, 0, 0.36, 0.36, 0.03, 12, {}); m.pop(); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 0.7, y0: 0, y1: 3.0, cover: true }] }; }, { yaw: a + Math.PI }); }
  // the crowd: dancers at dawn (some name-drop the DJ, respectfully)
  const types = ['burner', 'tutu', 'ledsuit', 'furcoat', 'sparklepony', 'burner', 'tutu', 'furry', 'burner', 'ledsuit'];
  const lines = ['Lee Burridge is playing the sunrise set on the heart. I\'m not crying, YOU\'RE crying.', 'This sunrise set is why I came. Every year.', 'Shhh. Just feel it.', 'Is that the sun or my heart? Both. It\'s both.', 'Best sunrise set on the playa. Don\'t @ me.'];
  for (let i = 0; i < 24; i++) {
    const a = i * 2.399, d = 4 + Math.sqrt(i) * 3.4, t = types[i % types.length];
    api.npc({ type: t, seed: 1100 + i, x: F.x + Math.sin(a) * d, z: F.z + 4 + Math.cos(a) * d * 0.8, yaw: Math.PI + (Math.random() - 0.5), behavior: 'dance', style: i % 6, bpm: 122, chat: i % 3 === 0 ? lines : ['Sunrise!', 'WOOO!', 'Hug?', 'This SLAPS.'], crowd7: true });
  }
  // greeters giving out sunrise hugs
  api.npc({ id: 'greetf', name: 'SUNRISE GREETER', type: 'greeter_f', seed: 1, x: F.x - 18, z: F.z + 20, yaw: 0.6, chat: ['Sunrise hugs! Free! Mandatory-ish!', 'Welcome hooome... again!'], lines: ['A sunrise hug! The best kind of hug. Come here!'], gift: { kind: 'water' }, talk(g, a) { BW7.hug(g, a); } });
  api.npc({ id: 'greetm', name: 'SUNRISE GREETER', type: 'greeter_m', seed: 1, x: F.x + 18, z: F.z + 20, yaw: -0.6, chat: ['HUGS FOR THE SUN!', 'Did you just get here? Welcome home!'], lines: ['Sunrise hug incoming!'], talk(g, a) { BW7.hug(g, a); } });
  // the undercover cop in a jester hat, "dancing" and watching for baggies
  api.npc({ id: 'cop', name: 'TOTALLY A BURNER', type: 'undercovercop', seed: 1, x: F.x + 8, z: F.z - 12, behavior: 'undercover', path: [[F.x + 8, F.z - 12], [F.x - 6, F.z - 14], [F.x - 10, F.z], [F.x + 10, F.z + 2]], view: 12, chatter: false, noTalk: true, always: true });
  api.checkpoint('cp_floor', F.x - 20, F.z + 26, { yaw: Math.PI, name: 'Dance Floor' });
  api.pickup('water', F.x - 10, 0.9, F.z + 24); api.pickup('water', F.x + 24, 0.9, F.z - 4);
  api.pickup('bag:molly', F.x - 26, 0.9, F.z + 10); api.pickup('bag:powder', F.x + 26, 0.9, F.z + 14);
  api.glowRing(F.x, F.z + 4, 20, 18);
  // THE GLITTER QUEEN: hidden until the sun breaks (then she floats in on her content throne)
  const qs = BW567K.mine('influencer', 77, { prop: 'ringlight', glasses: 'heart', coat: { kind: 'kimono', col: '#ffd84a', trim: '#ff9ad8' }, top: { kind: 'crop', col: '#ff9ad8' },
    hair: { style: 'long', col: '#ffb0e0', hi: '#ffffff' }, hat: { kind: 'cowboy', col: '#ffe8a0' }, key: 'w7:queen' });
  if (!g.missions.isDone('boss')) api.enemy({ id: 'queen', name: 'THE GLITTER QUEEN', type: 'influencer', spec: qs, scale: 1.15, x: F.x + 20, z: F.z - 10, y: 9, yaw: -Math.PI / 2, behavior: 'bw7Queen', hp: 4, boss: true, drop: 14, always: true, chatter: false, keepBehavior: true, fixedY: true, collide: false,
    onDefeat(g2) { BW7.queenDefeated(g2); } });
  else api.npc({ id: 'queen', name: 'THE GLITTER QUEEN', type: 'influencer', spec: qs, scale: 1.15, x: F.x + 7, z: F.z + 3, yaw: Math.PI, behavior: 'dance', style: 2, bpm: 122,
    lines: ['No filter. No phone. Just vibes. ...Okay, ONE photo.', 'The sun has more followers than me. And honestly? It deserves them.'], gift: { kind: 'glowstick', n: 6 } });
};
BW7.buildStrip = function (api, g) {
  const T = BW7.STRIP, len = Math.hypot(T.x1 - T.x0, T.z1 - T.z0), yaw = Math.atan2(T.x1 - T.x0, T.z1 - T.z0);
  const at = (t, side) => { const x = lerp(T.x0, T.x1, t), z = lerp(T.z0, T.z1, t), nx = Math.cos(yaw), nz = -Math.sin(yaw); return [x + nx * side, z + nz * side]; };
  // giant letters S-U-N-R-I-S-E down the middle (cover), photo-op frames on the sides
  'SUNRISE'.split('').forEach((ch, i) => {
    const [x, z] = at(0.12 + i * 0.12, (i % 2 ? 1.6 : -1.6));
    api.mesh(x, z, m => { const reg = BURNS_ATLAS.sign(ch, { bg: null, fg: '#ffffff', size: 72, pad: 2 }); m.color(['#ff4fa8', '#ffd84a', '#38f2ff', '#ff7a2a', '#9a6bff', '#7aff5a', '#ff4fd8'][i]).shine(2); BW567K.rbox(m, 0, 1.6, 0, 2.2, 3.2, 0.7, 0.25); m.shine(0); m.color('#ffffff', 0.7); m.decal(0, 1.6, 0.36, 1.8, 2.4, reg); m.push(); m.tf(0, 0, 0, Math.PI); m.decal(0, 1.6, 0.36, 1.8, 2.4, reg); m.pop(); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.35, y0: 0, y1: 3.2, cover: true }] }; }, { yaw: yaw + Math.PI / 2 });
  });
  const frames = [[0.2, 6, '#ffd84a'], [0.45, -6, '#ffb0d8'], [0.7, 6, '#38f2ff'], [0.9, -6, '#ffd84a']];
  frames.forEach(([t, side, col], i) => { const [x, z] = at(t, side); api.mesh(x, z, m => { m.color(col).shine(3); BW567K.rbox(m, -1.9, 2.2, 0, 0.4, 4.4, 0.4, 0.15); BW567K.rbox(m, 1.9, 2.2, 0, 0.4, 4.4, 0.4, 0.15); BW567K.rbox(m, 0, 4.4, 0, 4.2, 0.4, 0.4, 0.15); BW567K.rbox(m, 0, 0.2, 0, 4.2, 0.4, 0.4, 0.15); m.shine(0); return { cols: [{ t: 'box', x: -1.9, z: 0, hx: 0.2, hz: 0.2, y0: 0, y1: 4.4 }, { t: 'box', x: 1.9, z: 0, hx: 0.2, hz: 0.2, y0: 0, y1: 4.4 }, { t: 'box', x: 0, z: 0, hx: 2.1, hz: 0.2, y0: 4.2, y1: 4.6 }] }; }, { yaw: yaw + Math.PI / 2 }); if (i === 0) api.pickup('photo', x, 5.4, z, { id: 'p1' }); });
  // giant angel wings mural
  { const [x, z] = at(0.55, 7.5); api.mesh(x, z, m => { m.color('#f8f0ff').shine(1); for (const sx of [-1, 1]) { m.push(); m.tf(sx * 1.4, 2.6, 0, 0, 0, -sx * 0.4); BW567K.ellip(m, 0, 0, 0, 1.4, 2.2, 0.25); m.pop(); } m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.6, hz: 0.3, y0: 0, y1: 4.4, cover: true }] }; }, { yaw: yaw - Math.PI / 2 }); }
  // influencers with ring lights (their flash puts you in their story)
  const inf = [[0.18, 5], [0.38, -5], [0.58, 5], [0.78, -5], [0.95, 4]];
  inf.forEach(([t, side], i) => { const [x, z] = at(t, side); api.enemy({ id: 'inf' + i, name: 'INFLUENCER', type: 'influencer', seed: 80 + i, x, z, behavior: 'bw7Flash', hp: 2, drop: 2, range: 13, cooldown: 2.6 + i * 0.3, aggro: 14, chatter: false }); });
  api.npc({ id: 'stripguide', name: 'SELFIE SAFETY SAM', type: 'ranger', seed: 81, x: T.x0 + 4, z: T.z0 + 4, yaw: 2.4,
    chat: ['Do NOT end up in a story.', 'Stay behind the letters!'],
    talk(g, a) { BW7.talkStripGuide(g, a); } });
  api.sign('THE SELFIE STRIP\nENTER AT YOUR OWN CONTENT', T.x0 + 6, T.z0 + 1, { yaw: 2.4, h: 1.1, style: { bg: '#ffd84a', fg: '#2a1a2a', size: 24, border: '#ff4fa8' } });
};
BW7.buildCrusty = function (api, g) {
  const C = BW7.CAMP;
  api.prop('bus', { x: C.x - 12, z: C.z + 6, yaw: 1.2, seed: 701, col: '#8a6a3a' });
  api.prop('dome', { x: C.x + 10, z: C.z + 10, r: 4, col: '#a89878', lights: false });
  api.mesh(C.x + 5, C.z - 6, m => { m.color('#7a4a2a'); BW567K.rbox(m, 0, 0.4, 0, 1.6, 0.8, 0.9, 0.08); m.color('#ffd84a'); m.box(0.2, 0.5, 0.46, 0.4, 0.3, 0.02); m.color('#38f2ff'); m.box(-0.4, 0.35, 0.46, 0.3, 0.2, 0.02); m.color('#ff4fd8'); m.box(0.5, 0.25, 0.46, 0.25, 0.2, 0.02); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.8, hz: 0.45, y0: 0, y1: 0.8 }] }; });
  api.sign('BACK IN MY DAY\nTHE BURN PEAKED ON BAKER BEACH', C.x + 2, C.z + 9, { yaw: 0, h: 1.2, style: { bg: '#5a4a3a', fg: '#f4e8c8', size: 24, border: '#f4e8c8' } });
  api.fire(C.x + 1, 0, C.z + 3, 0.5);
  // the wobbly tower: rusty scaffold poles + six swaying pallet platforms
  api.mesh(C.x, C.z, m => { m.color('#8a4a2a'); for (const [x, z] of [[-2, -2], [2, -2], [-2, 2], [2, 2]]) BW567K.limb(m, x, 0, z, x * 0.9, 14.5, z * 0.9, 0.08); for (let i = 1; i < 7; i++) { m.color(i % 2 ? '#9a5a3a' : '#7a3a2a'); BW567K.limb(m, -2, i * 2.2, -2, 2, i * 2.2 - 1.1, 2, 0.05); BW567K.limb(m, 2, i * 2.2, -2, -2, i * 2.2 - 1.1, 2, 0.05); } return { cols: [-2, 2].flatMap(x => [-2, 2].map(z => ({ t: 'cyl', x, z, r: 0.1, y0: 0, y1: 14.5, camPass: true }))) }; });
  const lv = [[1.2, 2.0, 1.4], [-1.2, 4.2, 0.6], [1.0, 6.4, -1.0], [-1.0, 8.6, 0.4], [1.0, 10.8, -0.6], [-0.6, 13.0, 1.4]];
  lv.forEach(([dx, y, dz], i) => {
    const mv = api.mover(m => { m.push(); m.tf(0, 0, 0, i * 0.4); BW5.palletMesh ? BW5.palletMesh(m, false, 2.4) : BW567K.rbox(m, 0, 0.12, 0, 2.4, 0.24, 2.4, 0.05); m.pop(); m.color('#9a5a3a'); BW567K.limb(m, -1.1, 0.25, -1.1, -1.1, 0.95, -1.1, 0.04); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.2, hz: 1.2, y0: 0, y1: 0.24 }] }; });
    mv.x = C.x + dx; mv.y = y - 0.24; mv.z = C.z + dz;
    BW7.state.wob.push({ mv, x: C.x + dx, z: C.z + dz, y: y - 0.24, amp: 0.08 + i * 0.07, ph: i * 1.3, w: 1.6 + i * 0.15 });
  });
  BW567K.rb(api, C.x + 3.0, 0, C.z + 2.4, 1.4, 1.1, 1.4, '#7a5a3a', { r: 0.12 });
  api.glowArc(C.x + 3, 1.6, C.z + 2.4, C.x + 1.2, 2.8, C.z + 1.4, 0.5, 2);
  for (let i = 1; i < lv.length; i++) api.pickup('glowstick', lv[i][0] + C.x, lv[i][1] + 0.9, lv[i][2] + C.z);
  // the crusties: Carl (from the octopus party) + two old friends
  api.npc({ id: 'carl', name: 'CRUSTY CARL', type: 'crusty', seed: 62, x: C.x + 3.5, z: C.z + 5, yaw: 0.4, behavior: 'bw7Rant', always: true,
    rants: ['It was better on Baker Beach!', 'Event guide? Haven\'t read one since 2004!', 'Warm beer is a LIFESTYLE!', 'Your bike has LIGHTS? Soft.'],
    talk(g, a) { BW7.talkCarl(g, a); } });
  api.npc({ id: 'dave', name: 'DUSTY DAVE', type: 'crusty', seed: 63, variant: 'kilt', x: C.x - 3, z: C.z + 7, yaw: 0.8, behavior: 'bw7Rant', rants: ['Glitter is MOOP!', 'Back then we gifted ROCKS. And we LIKED it!'], talk(g, a) { BW7.talkCarl(g, g.actor('carl')); } });
  api.npc({ id: 'hank', name: 'OLD HANK', type: 'crusty', seed: 64, x: C.x + 8, z: C.z + 1, yaw: -0.6, behavior: 'bw7Rant', rants: ['The Man used to be TWELVE feet tall!', 'Kids these days and their SHADE.'], talk(g, a) { BW7.talkCarl(g, g.actor('carl')); } });
  api.pickup('bag:weed', C.x - 6, 0.9, C.z - 4);
  api.checkpoint('cp_camp7', C.x + 10, C.z + 16, { yaw: Math.PI, name: 'Back In My Day' });
};
BW7.buildPonies = function (api, g) {
  const P = BW7.PONY;
  // a tent that won't zip, piles of tulle, an empty glitter water bottle the size of a car
  for (let i = 0; i < 4; i++) api.prop('tent', { x: P.x - 8 + i * 5.5, z: P.z - 8 + (i % 2) * 3, yaw: i * 0.6, col: ['#ffb0d8', '#c8a0ff', '#9adcff', '#fff0a0'][i] });
  for (let i = 0; i < 5; i++) BW567K.ballAt(api, P.x - 10 + i * 4.5, 0, P.z + 6 + (i % 2) * 2, 1.1, ['#ffb0e0', '#e0c8ff', '#bff0ff'][i % 3], { squash: 0.4, noCol: true });
  api.lathe(P.x + 12, 0, P.z - 2, [[1.2, 0, '#ff9ad8'], [1.3, 2.6, '#ff9ad8'], [1.0, 3.2, '#ffffff'], [0.5, 3.6, '#ffffff'], [0.5, 4.2, '#c8a0ff'], [0, 4.3, '#c8a0ff']], '#ff9ad8', { gloss: 3, e: 0.15 });
  api.sign('THE THIRST TRAP\nGOOD VIBES ACCEPTED AS PAYMENT', P.x - 2, P.z + 12, { yaw: 0, h: 1.1, style: { bg: '#ffb0d8', fg: '#5a1a4a', size: 24, border: '#ffffff' } });
  api.npc({ id: 'ponyqueen', name: 'PRINCESS SPARKLEHOOF', type: 'sparklepony', seed: 7, x: P.x, z: P.z, yaw: Math.PI, behavior: 'sit',
    chat: ['Water? Do you have water? Or a cup? Or a flashlight?', 'Good vibes are a currency. I\'m RICH.'],
    talk(g, a) { BW7.talkPonyQueen(g, a); } });
  for (let i = 0; i < 4; i++) api.npc({ type: 'sparklepony', seed: 30 + i, x: P.x - 5 + i * 3.4, z: P.z + 3.2, yaw: Math.PI, behavior: i % 2 ? 'sit' : 'dance', style: i, chat: ['So. Thirsty.', 'Is that a WATER bottle? Can I borrow it? Forever?', 'I\'ll trade you good vibes!'] });
  // pony pickpockets (thieves) roam near the bottles
  api.enemy({ type: 'sparklepony', seed: 41, name: 'PONY PICKPOCKET', x: 50, z: -20, behavior: 'thief', hp: 1, steal: 5, chatter: false });
  api.enemy({ type: 'sparklepony', seed: 42, name: 'PONY PICKPOCKET', x: 60, z: 40, behavior: 'thief', hp: 1, steal: 5, chatter: false });
  // the eight bottles
  const B = [[46, 30], [62, -24], [96, 34], [110, -10], [30, -30], [70, 64], [104, 70], [124, 20]];
  B.forEach(([x, z], i) => api.pickup('item:bottle', x, 0.9, z, { mission: 'ponies', gate: true, label: 'WATER BOTTLE', icon: 'drop', col: '#9adcff', id: 'bottle' + i }));
  api.checkpoint('cp_pony', P.x - 12, P.z + 14, { yaw: Math.PI, name: 'Thirst Trap' });
};
BW7.buildDancePlat = function (api, g) {
  const D = BW7.PLAT;
  api.mesh(D.x, D.z, m => { m.color('#2a1a3a').shine(2); BW567K.rcyl(m, 0, 0, 0, 4.2, 0.5, 0.18); m.shine(0); for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; m.color(BURNS_NEON[i % 7], 1); BW567K.ball(m, Math.sin(a) * 4.0, 0.42, Math.cos(a) * 4.0, 0.12, { seg: 6, rings: 4 }); } m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.2, y0: 0, y1: 0.5 }] }; });
  api.sign('DANCE-OFF\nCHALLENGE SAL (IF YOU DARE)', D.x - 5.2, D.z + 3, { yaw: Math.PI / 2 + 0.3, h: 1.0, style: { bg: '#2a1a3a', fg: '#ffd84a', size: 24, border: '#ff4fd8' } });
  api.npc({ id: 'sal', name: 'SHUFFLE SAL', type: 'ledsuit', spec: BW567K.mine('ledsuit', 90, { led: '#ffd84a', face: 'goofy', hat: { kind: 'cap', col: '#ff4fd8' } }), x: D.x + 1.5, z: D.z, y: 0.5, yaw: -Math.PI / 2, behavior: 'dance', style: 4, bpm: 122,
    chat: ['Undefeated since the sun was invented.', 'My knees are 60. My feet are 19.'],
    talk(g, a) { BW7.talkSal(g, a); } });
  api.light(D.x, D.z, 8, '#ff4fd8', 0.35);
};
BW7.buildPier = function (api, g) {
  // THE LANDLOCKED GALLEON (shared big-art module, src/41_burns_bigart.js) runs aground east of the
  // pony camp; its own 45 m pier reaches north toward the playa. If the module isn't in the build, a
  // stand-in "pier to nowhere" stands at BW7.PIER instead (integration point).
  const P = BW7.PIER, G = BW7.GALLEON;
  const art = BW567K.bigArt(api, g, 'galleon', G.x, G.z, { rotY: G.rot, night: 'auto' });
  let lsd, steps;
  if (art) {
    BW7.state.galleon = art;
    const head = art.toWorld(-58, 0, 6);                        // the land end of the galleon's pier
    lsd = [head[0] - 3, head[2] + 1];
    steps = i => [head[0] - 8 - i * 2.2, 1.4 + i * 1.5, head[2] - 2 - i * 1.4];
    api.sign('THE LANDLOCKED GALLEON\nALL ASHORE WHO\'S GOING ASHORE', head[0] + 3.4, head[2] + 2, { yaw: 0, h: 1.0, style: { bg: '#2a4a6a', fg: '#ffffff', size: 24, border: '#ffd84a' } });
  } else {
    api.mesh(P.x, P.z - 15, m => { m.color('#8a6a4a'); m.box(0, 0.62, 0, 3, 0.18, 30, { uv: BURNS_ATLAS.pattern('wood'), uvFaces: ['py'] }); for (let i = 0; i <= 10; i++) for (const sx of [-1, 1]) { m.color('#6a4a2a'); BW567K.rcyl(m, sx * 1.4, 0, -15 + i * 3, 0.14, 1.4, 0.04); } m.color('#c8a060'); for (const sx of [-1, 1]) BW567K.limb(m, sx * 1.4, 1.35, -15, sx * 1.4, 1.35, 15, 0.04); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.5, hz: 15, y0: 0, y1: 0.7 }] }; });
    api.sign('THE PIER TO NOWHERE\n(BRING YOUR OWN SHIP)', P.x + 2.6, P.z + 1, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#2a4a6a', fg: '#ffffff', size: 24, border: '#ffd84a' } });
    lsd = [P.x, P.z - 2];
    steps = i => [P.x + 2 + i * 2.2, 1.4 + i * 1.5, P.z - 31 - i * 1.6];
  }
  // LSD-only steps up into the sky to a hidden photo
  api.pickup('bag:lsd', lsd[0], art ? 0.9 : 1.6, lsd[1]);
  const top = steps(5);
  api.hidden(() => { for (let i = 0; i < 6; i++) { const q = steps(i); BW567K.rb(api, q[0], q[1], q[2], 2.2, 0.3, 2.2, burnsHSL(320 + i * 18, 0.9, 0.65), { e: 0.6, r: 0.1 }); } api.glow(top[0], top[1] + 1.4, top[2], 2, '#ffd84a'); });
  api.pickup('photo', top[0], top[1] + 1.4, top[2], { id: 'p3', hidden: true });
};
BW7.buildWanderers = function (api, g) {
  // the Guy Who Partied Too Hard (one boot missing) + his boot, somewhere
  api.npc({ id: 'toohard', name: 'GUY WHO PARTIED TOO HARD', type: 'partiedtoohard', seed: 1, x: 40, z: 60, behavior: 'bw7Shamble', speed: 0.9, radius: 14,
    chat: ['What day is it? Tuesday? Since... Tuesday?', 'Have you seen my boot? It\'s like this one. But the other one.', 'I can hear colors.'],
    talk(g, a) { BW7.talkTooHard(g, a); } });
  api.pickup('item:boot', -62, 0.9, -96, { mission: 'boot', gate: true, label: 'ONE BOOT', icon: 'ticket', col: '#9a7a5a', id: 'boot' });
  // more dancers drifting toward the set
  api.crowd(40, -50, 8, 5, { types: ['burner', 'tutu', 'furcoat', 'ledsuit'], behaviors: ['dance', 'wander', 'dance'] });
  api.crowd(-40, 60, 6, 4, { types: ['burner', 'tutu', 'ledsuit'], behaviors: ['wander', 'idle'] });
  api.npc({ type: 'ranger', seed: 72, name: 'RANGER DAWN', x: 30, z: 20, behavior: 'wander', radius: 10, lines: ['Sunrise is the best time of the burn. Hydrate, hug, repeat.', 'Watch out for the guy in the jester hat. He\'s... not a burner.'], gift: { kind: 'water' } });
  api.glowLine(-30, 120, -60, 40, 9); api.glowLine(40, 100, 70, 40, 8); api.glowLine(-30, -20, -70, 0, 7); api.glowLine(30, -40, 70, -10, 7); api.glowLine(-8, -30, 8, -30, 5);
  api.pickup('bag:shrooms', 132, 0.9, -64); api.pickup('bag:khole', -120, 0.9, -60); api.pickup('water', 60, 0.9, -60); api.pickup('water', -60, 0.9, 80);
};

/* ============================================================ puppets: the pulsing heart, the DJ silhouette, the Queen's throne + drones ============================================================ */
BW7.makePuppets = function (g) {
  const S = BW7.state;
  const hGeo = BW567K.geo('w7heart', m => {
    m.setBone(0); m.color('#ff2a6a', 0.55).shine(2); BW567K.pillow(m, BW567K.heartOutline(44), 0.29, { rings: 7, capCol: '#ff3a7a' }); m.emissive(0).shine(0);
    m.color('#ffd0e0', 0.9); m.push(); m.tf(-0.16, 0.18, 0.15); BW567K.ellip(m, 0, 0, 0, 0.08, 0.05, 0.02); m.pop(); m.emissive(0);
    // bone 1: the DJ, a small respectful silhouette with headphones
    m.setBone(1); m.color('#14101c'); BW567K.limb(m, 0, 0.0, 0, 0, 0.95, 0, 0.17, 0.2); BW567K.ball(m, 0, 1.2, 0, 0.15); BW567K.limb(m, -0.22, 0.85, 0, -0.32, 0.45, 0.25, 0.05); BW567K.limb(m, 0.22, 0.85, 0, 0.38, 0.95, 0.18, 0.05);
    m.color('#26202e'); m.push(); m.tf(0, 1.2, 0, 0, 0, Math.PI / 2); BW567K.torus(m, 0, 0, 0, 0.17, 0.025, { seg: 12, tseg: 3 }); m.pop();
  });
  const H = new BW567Puppet(g, hGeo, 2); S.heartP = H; g.addBoss(H);
  const C = BW7.CAR;
  S.heartPos = [C.x, 10.6, C.z - 3.6]; S.djPos = [C.x, 6.0, C.z + 0.6];
  // the Glitter Queen's content throne (bone 0) + six drones (1..6)
  const qGeo = BW567K.geo('w7queen', m => {
    m.setBone(0); m.color('#ffd84a').shine(3); BW567K.lathe(m, 0, -0.5, 0, [[0, 0], [1.6, 0.05], [1.8, 0.3], [1.6, 0.55], [0, 0.6]], { seg: 20 }); m.color('#ff9ad8', 0.4); BW567K.torus(m, 0, -0.18, 0, 1.75, 0.07, { seg: 22, tseg: 4 }); m.emissive(0);
    m.color('#ffffff', 1); m.push(); m.tf(0, 1.9, -0.9, 0, -0.2); BW567K.torus(m, 0, 0, 0, 0.9, 0.09, { seg: 22, tseg: 5 }); m.pop(); m.emissive(0);
    m.color('#c8c8d0'); BW567K.limb(m, 0, 0, -0.9, 0, 1.0, -0.9, 0.04); m.shine(0);
    for (let i = 1; i <= 6; i++) { m.setBone(i); m.color('#f4f0ff').shine(3); BW567K.ellip(m, 0, 0, 0, 0.3, 0.13, 0.3); m.color('#ff4fd8', 0.8); BW567K.ball(m, 0, -0.1, 0.24, 0.07, { seg: 6, rings: 4 }); m.emissive(0); m.color('#2a2a30'); for (const [x, z] of [[0.4, 0.4], [-0.4, 0.4], [0.4, -0.4], [-0.4, -0.4]]) { BW567K.limb(m, 0, 0, 0, x, 0.04, z, 0.025); BW567K.torus(m, x, 0.07, z, 0.18, 0.018, { seg: 10, tseg: 3 }); } m.shine(0); }
  });
  const Q = new BW567Puppet(g, qGeo, 7); S.queenP = Q; g.addBoss(Q);
  for (let i = 0; i < 7; i++) Q.off(i);
};
BW7.updateCar = function (g, dt) {
  const S = BW7.state, H = S.heartP; if (!H) return;
  const beat = g.time * (122 / 60), k = Math.pow(Math.abs(Math.sin(beat * Math.PI)), 8);
  const sc = 9 * (1 + (S.on ? 0.035 : 0.01) * k);
  H.set(0, S.heartPos[0], S.heartPos[1], S.heartPos[2], 0, 0, Math.sin(g.time * 0.5) * 0.02, sc);
  if (S.on) H.set(1, S.djPos[0], S.djPos[1] + Math.abs(Math.sin(beat * Math.PI)) * 0.06, S.djPos[2], Math.sin(g.time * 0.6) * 0.3, Math.abs(Math.sin(beat * Math.PI)) * 0.08); else H.off(1);
  S.pulse = k;
  // confetti cannons on the drop (every 32 beats)
  const bar = Math.floor(beat / 32);
  if (S.on && bar !== S.lastDrop && Math.hypot(g.player.x - BW7.CAR.x, g.player.z - BW7.CAR.z) < 80) { S.lastDrop = bar; for (const sx of [-1, 1]) g.fx.confetti(BW7.CAR.x + sx * 3.6, 8, BW7.CAR.z + 3, 40); burnsSfx('crowd_cheer', { vol: 0.35 }); }
};
BW7.setOn = function (g, quiet) { const S = BW7.state; S.on = true; if (!quiet) { burnsSfx('crowd_cheer'); g.banner('THE SET HAS STARTED', 'Sunrise in progress. Dance responsibly.', { col: '#ffb0d8' }); } };
BW7.updateWobble = function (g, dt) {
  const t = g.time;
  for (const w of BW7.state.wob) { const s = Math.sin(t * w.w + w.ph); w.mv.x = w.x + s * w.amp; w.mv.z = w.z + Math.cos(t * w.w * 0.8 + w.ph) * w.amp * 0.6; w.mv.roll = s * w.amp * 0.15; w.mv.y = w.y; }
};

/* ============================================================ behaviours ============================================================ */
// crusties rant at you: rants slow Brady down while he's near (spin them to change the subject)
BurnsBehaviors.register('bw7Rant', {
  init(a) { a.data.cd = 1 + Math.random() * 2; a.data.quiet = 0; },
  update(a, g, dt) {
    const D = a.data, d = a.distP();
    if (D.quiet > 0) D.quiet -= dt;
    if (d < 7 && D.quiet <= 0 && !BW7.state.won) {
      a.face(g.player.x, g.player.z, dt, 4); a.ch.play('yell');
      D.cd -= dt; if (D.cd <= 0) { D.cd = 2.4 + Math.random(); const L = a.def.rants || ['It was better on Baker Beach!']; a.say(L[Math.floor(Math.random() * L.length)], 2.0); g.fx.ring(a.x, a.y + 0.1, a.z, 3.5, '#c8a070', 0.4); }
      a.data.ranting = true;
    } else { a.data.ranting = false; a.ch.play(d < 6 ? 'talk' : 'idle'); if (d < 6) a.face(g.player.x, g.player.z, dt, 2); }
    a.vx = a.vz = 0; a.physics(dt);
  },
  hit(a, g) { a.data.quiet = 8; a.say('...where was I? Oh right. 1998.', 2); burnsSfx('bump', { vol: 0.4 }); return 'handled'; }
});
BW7.updateRants = function (g, dt) {
  let k = 1;
  for (const id of ['carl', 'dave', 'hank']) { const a = g.actor(id); if (a && a.data.ranting) k = Math.min(k, 0.5); }
  g.bw567speed = BurnsM.damp(g.bw567speed === undefined ? 1 : g.bw567speed, k, 6, dt);
  if (k < 1 && Math.random() < dt * 2) g.fx.dust(g.player.x, g.player.y + 0.1, g.player.z, 1, '#c8a070');
};
// the guy who partied too hard: shambles around, sits down a lot
BurnsBehaviors.register('bw7Shamble', {
  init(a) { a.data.t = 2; a.data.sit = false; },
  update(a, g, dt) {
    const D = a.data; D.t -= dt;
    if (D.t <= 0) { D.sit = !D.sit && Math.random() < 0.4; D.t = D.sit ? 3 + Math.random() * 3 : 4 + Math.random() * 3; const t = Math.random() * TAU; D.tx = a.home.x + Math.sin(t) * (a.def.radius || 10); D.tz = a.home.z + Math.cos(t) * (a.def.radius || 10); }
    if (D.sit) { a.ch.play('sit'); a.moveTo(a.x, a.z, 0, dt); }
    else { const d = a.moveTo(D.tx, D.tz, a.speed, dt, 0.5); a.ch.play(d > 0.6 ? 'shuffle' : 'idle', { rate: 0.7 }); }
    a.physics(dt);
  }
});
// influencers on the Selfie Strip: charge the ring light, flash a cone. Getting flashed = you're in their story.
BurnsBehaviors.register('bw7Flash', {
  init(a) { a.data.cd = 1 + Math.random() * 2; a.data.ang = 0; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP();
    D.cd -= dt;
    if (D.charge > 0) {
      D.charge -= dt; a.ch.play('photo');
      if (D.charge <= 0) {
        burnsSfx('camera_flash', { vol: 0.6 }); g.fx.flashAt(a.x + Math.sin(a.yaw) * 0.6, a.y + 1.9, a.z + Math.cos(a.yaw) * 0.6);
        const ang = Math.abs(BurnsM.wrap(Math.atan2(p.x - a.x, p.z - a.z) - a.yaw));
        if (d < (a.def.range || 12) && ang < 0.5 && p.hiddenT <= 0 && !g.world.covered(a.x, a.y + 1.8, a.z, p.x, p.y + 1.0, p.z) && g.world.raycast(a.x, a.y + 1.8, a.z, p.x, p.y + 1.2, p.z, true) > 0.95) {
          g.screenFlash('#ffffff', 0.5); a.say(['You\'re in my story now!', 'TAGGED!', 'Say "content"!'][Math.floor(Math.random() * 3)], 1.6);
          g.missions.event('spotted', a);
          if (g.missions.state('photobomb') !== 'active') p.hurt(1, a.x, a.z, 4);
        }
      }
    } else {
      // sweep the ring light back and forth across the strip
      D.ang += dt * 0.9; a.yaw = (a.data.base === undefined ? (a.data.base = a.yaw) : a.data.base) + Math.sin(D.ang) * 0.9;
      a.ch.play('photo');
      if (D.cd <= 0 && d < (a.def.aggro || 14)) { D.charge = 0.9; D.cd = a.def.cooldown || 3; a.say(['SMILE!', 'CONTENT!', 'Golden hour, babe!', 'Hold still!'][Math.floor(Math.random() * 4)], 0.9); }
    }
    a.vx = a.vz = 0; BurnsBehaviors.contact(a, g, 0); a.physics(dt);
  }
});
// the Glitter Queen: floats on her content throne with a drone swarm
BurnsBehaviors.register('bw7Queen', {
  init(a) { a.data.mode = 'wait'; a.data.t = 1; a.data.ang = 0; a.data.alt = 4.2; },
  hit(a, g, kind) {
    if (a.data.mode === 'likes') { if (kind === 'love') { a.hit('spin'); return 'handled'; } return true; }
    if (a.data.mode !== 'wait') a.say(['Don\'t touch the talent!', 'Ew, sweat!', 'Not on camera!'][Math.floor(Math.random() * 3)], 1);
    return false;
  },
  update(a, g, dt) {
    const D = a.data, p = g.player, F = BW7.FLOOR, S = BW7.state;
    D.t -= dt;
    if (D.mode === 'wait') { a.ch.play('photo'); return; }
    const phase = a.hp <= 2 ? 1 : 0;
    if (D.mode === 'float') {
      D.ang += dt * (phase ? 0.5 : 0.35);
      a.x = BurnsM.damp(a.x, F.x + Math.sin(D.ang) * 13, 2, dt); a.z = BurnsM.damp(a.z, F.z + Math.cos(D.ang) * 11, 2, dt);
      a.y = BurnsM.damp(a.y, D.alt + Math.sin(g.time * 2) * 0.25, 3, dt); a.face(p.x, p.z, dt, 3); a.ch.play('photo');
      D.bombT = (D.bombT || 1.5) - dt;
      if (D.bombT <= 0) { D.bombT = phase ? 1.1 : 1.6; const tx = p.x + (Math.random() - 0.5) * 5, tz = p.z + (Math.random() - 0.5) * 5, T = 1.4, ty = g.world.height(tx, tz); g.projectile({ kind: 'firework', x: a.x, y: a.y + 1.5, z: a.z, vx: (tx - a.x) / T, vy: (ty - a.y - 1.5) / T + 0.5 * 14 * T, vz: (tz - a.z) / T, gravity: 14, life: T + 0.3, dmg: 1, col: '#ff9ad8', tx, tz, blast: 2.4 }); burnsSfx('firework_launch', { vol: 0.4, pitch: 1.5 }); }
      if (D.t <= 0) { D.cycle = (D.cycle || 0) + 1; if (D.cycle % 2) { D.mode = 'swarm'; D.t = 4.4; D.dive = 0; g.bossSay(a, 'SWARM, MY LOVES! GET HIS GOOD SIDE!'); } else { D.mode = 'glare'; D.t = 2.6; g.bossSay(a, 'RING LIGHT GLARE! HIDE YOUR FLAWS!'); g.warn('TAKE COVER!', 2.6); burnsSfx('neon_flash', { pitch: 1.4, vol: 0.4 }); } }
    } else if (D.mode === 'swarm') {
      a.face(p.x, p.z, dt, 3); a.ch.play('photo');
      if (D.t < 4.0 - D.dive * 0.6 && D.dive < 6) { const dr = S.drones[D.dive]; if (dr) { dr.mode = 'dive'; dr.t = 0; dr.tx = p.x; dr.tz = p.z; dr.x0 = dr.x; dr.y0 = dr.y; dr.z0 = dr.z; } D.dive++; burnsSfx('pitch_blah', { pitch: 1.8, vol: 0.4 }); }
      if (D.t <= 0) { D.mode = 'float'; D.t = 4.5; }
    } else if (D.mode === 'glare') {
      S.glare = (2.6 - D.t) / 2.6 * 1.5; a.face(p.x, p.z, dt, 4); a.ch.play('photo');
      if (D.t <= 0) {
        S.glare = 0; g.screenFlash('#fff8f0', 0.9); burnsSfx('camera_flash'); g.shake(0.3);
        const h = [a.x, a.y + 2.6, a.z];
        if (!g.world.covered(h[0], h[1], h[2], p.x, p.y + 1.0, p.z) && !g.world.covered(h[0], h[1], h[2], p.x, p.y + 0.3, p.z)) p.hurt(2, a.x, a.z, 5, true); else g.toast('SAFE BEHIND THE SPEAKERS!');
        D.combo = (D.combo || 0) + 1;
        if (D.combo >= 2) { D.combo = 0; D.mode = 'land'; D.t = 1.2; g.bossSay(a, 'Ugh, my battery... let me check my likes...'); }
        else { D.mode = 'float'; D.t = 4; }
      }
    } else if (D.mode === 'land') {
      a.y = BurnsM.damp(a.y, g.world.height(a.x, a.z), 4, dt); a.ch.play('phone');
      if (D.t <= 0) { D.mode = 'likes'; D.t = phase ? 3.4 : 4.2; a.y = g.world.height(a.x, a.z); }
    } else if (D.mode === 'likes') {
      a.ch.play('phone'); if (Math.random() < dt * 5) g.fx.burst(a.x, a.y + a.h + 0.3, a.z, 'star', 1, '#ffd84a');
      if (Math.random() < dt * 0.6) a.say(['Only THREE likes?!', 'Who unfollowed me?!', 'Why is the sunrise more popular than ME?'][Math.floor(Math.random() * 3)], 1.6);
      if (D.t <= 0) { D.mode = 'float'; D.t = 4; D.alt = 4.2; g.bossSay(a, 'BACK ON THE THRONE! THE LIGHTING IS PERFECT!'); }
    }
  }
});
BW7.updateQueenRig = function (g, dt) {
  const S = BW7.state, Q = S.queenP, a = g.actor('queen'); if (!Q || !a) return;
  if (!S.queenOn && !a.data.flyIn) { for (let i = 0; i < 7; i++) Q.off(i); return; }
  const onThrone = a.data.mode !== 'likes' && a.data.mode !== 'beaten';
  if (onThrone || a.data.mode === 'land') Q.set(0, a.x, a.y - 0.05, a.z, a.yaw); else Q.set(0, a.x + 2.4, g.world.height(a.x, a.z) + 0.5, a.z, a.yaw, 0, 0.3);
  if (!S.drones.length) for (let i = 0; i < 6; i++) S.drones.push({ x: a.x, y: a.y + 2, z: a.z, mode: 'orbit', t: 0 });
  const p = g.player;
  S.drones.forEach((dr, i) => {
    if (dr.mode === 'orbit') { const an = g.time * 1.5 + i * TAU / 6; dr.x = BurnsM.damp(dr.x, a.x + Math.sin(an) * 2.8, 5, dt); dr.z = BurnsM.damp(dr.z, a.z + Math.cos(an) * 2.8, 5, dt); dr.y = BurnsM.damp(dr.y, a.y + 2.2 + Math.sin(an * 2) * 0.3, 5, dt); }
    else if (dr.mode === 'dive') {
      dr.t += dt; const u = Math.min(1, dr.t / 1.0);
      dr.x = lerp(dr.x0, dr.tx, u); dr.z = lerp(dr.z0, dr.tz, u); dr.y = lerp(dr.y0, g.world.height(dr.tx, dr.tz) + 0.6, u * u);
      if (u >= 1 && !dr.hit) { dr.hit = true; g.fx.burst(dr.x, dr.y, dr.z, 'star', 12, '#ff9ad8'); if (Math.hypot(p.x - dr.x, p.z - dr.z) < 1.4 && p.y < dr.y + 1.2) p.hurt(1, dr.x, dr.z, 6); }
      if (dr.t > 1.4) { dr.mode = 'orbit'; dr.hit = false; }
    }
    if (S.queenOn || a.data.flyIn) Q.set(i + 1, dr.x, dr.y, dr.z, g.time * 3 + i); else Q.off(i + 1);
  });
};

/* ============================================================ talk + mission logic ============================================================ */
BW7.talkBiscuit = function (g, a) {
  const st = g.missions.state('race');
  if (st === 'available') g.say(a, ['Buddy! El Pulpo coughed all night. She\'s out of propane. Poor baby.', 'But LISTEN: the sunrise set on the Heartbeat car is starting. People cry at this set. Happy crying.', 'Your yellow bike\'s right here. Ride through the glowing arches and make it before the sun does. GO GO GO!'], () => g.missions.start('race'));
  else if (st === 'active') g.say(a, ['PEDAL, BUDDY!']);
  else if (!g.missions.isDone('summit')) g.say(a, ['You made it! Now climb the heart. Sunrise from the crown is a whole religious experience.']);
  else g.say(a, ['After this, Hell Station. El Pulpo needs propane. And I need a nap.']);
};
BW7.raceStart = function (g) {
  const p = g.player, S = BW7.state;
  if (g.bike && !p.vehicle) { g.bike.x = p.x; g.bike.z = p.z; g.bike.y = p.y; g.bike.yaw = Math.PI; g.bike.mount(p); g.camYaw = Math.PI; g.snapCam = true; }
  g.banner('RACE THE SUNRISE!', 'Through the arches to the heart car!', { col: '#ffd84a' });
};
BW7.raceFail = function (g) { const b = g.actor('biscuit'); if (b) b.say('So close! The sun\'s still sleepy. Try again!', 2.4); };
BW7.raceDone = function (g) { BW7.setOn(g); g.setTod(Math.max(g.tod, 0.15), 0.05); };
BW7.talkPonyQueen = function (g, a) {
  const st = g.missions.state('ponies');
  if (st === 'available') g.say(a, ['Oh thank goodness, a hydrated person. I\'m Princess Sparklehoof.', 'We brought three suitcases of costumes. And zero water. Or cups. Or flashlights.', 'There are water bottles all over the playa. Bring us eight? We\'ll pay you in good vibes. Good vibes are a currency.'], () => g.missions.start('ponies'));
  else if (st === 'active') g.say(a, [`${g.missions.get('ponies').n} of 8... I can feel my glitter rehydrating.`]);
  else g.say(a, ['We\'re hydrated! For like an hour! Then you\'ll see us again.']);
};
BW7.poniesDone = function (g) {
  const a = g.actor('ponyqueen');
  if (a) { a.setBehavior('dance'); a.say('WATER! The good vibes are flowing! TAKE SOME!', 3); g.fx.hearts(a.x, a.y + 2, a.z, 20); }
  g.addGlow(15); g.player.givePower('molly'); g.toast('PAID IN GOOD VIBES: 15 GLOW STICKS + A LOVE BOMB');
};
BW7.talkStripGuide = function (g, a) {
  const st = g.missions.state('photobomb');
  if (st === 'available') g.say(a, ['Welcome to the Selfie Strip. One flash and you\'re in somebody\'s story. FOREVER.', 'Get from here to the far end without getting flashed. Stay behind the giant letters and frames. Ring lights sweep, then flash. Watch the rhythm.'], () => g.missions.start('photobomb'));
  else if (st === 'active') g.say(a, ['Go! Stay low! Stay humble! Stay out of frame!']);
  else g.say(a, ['Not a single story. Legend. Untagged legend.']);
};
BW7.stripStart = function (g) { const T = BW7.STRIP; g.player.teleport(T.x0 + 2, 0, T.z0 + 2, Math.atan2(T.x1 - T.x0, T.z1 - T.z0)); g.camYaw = g.player.yaw; g.snapCam = true; };
BW7.stripFail = function (g) { g.toast('YOU\'RE IN A STORY NOW. 2.4K VIEWS. TRY AGAIN.'); const T = BW7.STRIP; BW567K.after(g, 0.5, g2 => { g2.player.teleport(T.x0 + 4, 0, T.z0 + 4, 2.4); g2.snapCam = true; }); };
BW7.QUIZ = [
  { who: 'carl', prompt: 'The burn peaked on Baker Beach. Prove me wrong.', options: ['Can\'t. Everything since is a remix.', 'The Man is WAY bigger now!', 'What\'s a Baker Beach?'], right: 0, no: ['', 'BIGGER isn\'t BETTER, kid!', '...I need to sit down. For a decade.'] },
  { who: 'dave', prompt: 'What\'s the finest luxury on the playa?', options: ['A hot shower', 'Air conditioning', 'Warm beer and a broken chair'], right: 2, no: ['A SHOWER? Dust IS the shower!', 'Air conditioning is for the billionaire next door!', ''] },
  { who: 'hank', prompt: 'How\'s a real burner get around?', options: ['A fixie with no brakes and a prayer', 'An app', 'My octopus has a hot tub'], right: 0, no: ['', 'An APP?! Get off my playa!', 'TOO. CORPORATE.'] }
];
BW7.talkCarl = function (g, a) {
  const st = g.missions.state('crusty'), S = BW7.state;
  if (!a) return;
  if (st === 'available') g.say(a, ['You again. The corporate octopus guy.', 'Me and my crew have a simple position: it was better in the old days. You want to argue? Three rounds. Winner gets respect. Loser gets a lecture.'], () => { g.missions.start('crusty'); S.quiz = 0; BW7.quiz(g); });
  else if (st === 'active') { if (S.won) g.say(a, ['Token\'s at the top of the tower. Respect the wobble.']); else BW7.quiz(g); }
  else g.say(a, ['You\'re alright, kid. For a corporate octopus guy.']);
};
BW7.quiz = function (g) {
  const S = BW7.state, Q = BW7.QUIZ[S.quiz || 0];
  if (!Q) return;
  const who = g.actor(Q.who);
  BW567K.choice(g, { who: (who && who.name) || 'CRUSTY', prompt: Q.prompt, options: Q.options, def: Q.right, done(g2, i) {
    if (i === Q.right) {
      S.quiz++;
      if (who) { who.say(['...Huh. Fair.', 'Okay. OKAY. You get it.', 'Respect.'][S.quiz - 1] || 'Respect.', 2); }
      if (S.quiz >= BW7.QUIZ.length) BW7.crustyWon(g2);
      else BW567K.after(g2, 0.8, g3 => BW7.quiz(g3));
    } else {
      if (who) { who.say(Q.no[i] || 'WRONG!', 2.2); g2.fx.ring(who.x, who.y + 0.1, who.z, 4, '#c8a070', 0.5); }
      g2.bw567speed = 0.4; g2.toast('THE RANT SLOWS YOU DOWN. TALK TO CARL TO TRY AGAIN.');
    }
  } });
};
BW7.crustyWon = function (g) {
  const S = BW7.state, a = g.actor('carl');
  S.won = true;
  g.say(a || 'brady', ['...You\'re alright, kid. You get it. Mostly.', 'My Burn Token from \'97 is at the top of my tower. Been up there for decades. Climb it if you can. Respect the wobble.'], () => {
    g.missions.complete('crusty', { x: BW7.CAMP.x - 0.6, y: 14.2, z: BW7.CAMP.z + 1.4 });
    g.banner('RESPECT THE WOBBLE', 'Climb the rusty tower: the token is up top.', { col: '#c8a070' });
  });
};
BW7.talkSal = function (g, a) {
  const st = g.missions.state('danceoff');
  if (st === 'done') { g.say(a, ['You out-shuffled Sal. Nobody out-shuffles Sal. I\'m going to need a minute. And a smoothie.']); return; }
  g.say(a, ['A dance-off? With ME? I\'ve been undefeated since the sun was invented.', 'Tap JUMP and SPIN on the beat. Miss too many and the crowd goes home. Let\'s DANCE.'], () => {
    if (st === 'available') g.missions.start('danceoff', true);
    BW7.danceOff(g, a);
  });
};
BW7.danceOff = function (g, a) {
  const D = BW7.PLAT, p = g.player;
  p.teleport(D.x - 1.5, 0.5, D.z, Math.PI / 2); a.x = D.x + 1.5; a.z = D.z; a.yaw = -Math.PI / 2;
  // both dancers in frame: portrait screens are narrow, so pull the camera back there
  const camL = { x: D.x, y: 2.6, z: D.z + 7.5, tx: D.x, ty: 1.4, tz: D.z, fov: 0.75 }, camP = { x: D.x, y: 3.6, z: D.z + 12.5, tx: D.x, ty: 1.2, tz: D.z, fov: 0.85 };
  const cam = () => Game.cssH > Game.cssW ? camP : camL;
  g.banner('DANCE-OFF!', 'Tap ▲ JUMP and ◉ SPIN on the beat!', { col: '#ff4fd8' });
  BW567K.rhythm(g, { title: 'DANCE-OFF vs SHUFFLE SAL', bpm: 122, duration: 22, difficulty: 0.5, cam, anim: 'dance', music: 'burns_w7',
    onBeat(g2, bt) { if (bt % 8 === 0) g2.player.ch.k = { style: (bt / 8) % 6, bpm: 122 }; },
    onHit(g2, n, pts) { if (pts === 1) g2.fx.burst(g2.player.x, g2.player.y + 2, g2.player.z, 'star', 4, '#ffd84a'); },
    onDone(res) { BW7.danceResult(g, a, res); } });
};
BW7.danceResult = function (g, a, res) {
  if (res.score >= 0.6) {
    g.say(a, [`Grade ${res.grade}?! The crowd chose you. The sun chose you. I choose... a nap.`], () => g.missions.complete('danceoff', { x: BW7.PLAT.x, y: 1.8, z: BW7.PLAT.z + 2 }));
    burnsSfx('crowd_cheer'); g.fx.confetti(g.player.x, g.player.y + 2, g.player.z, 40);
  } else g.say(a, [`Grade ${res.grade}. Not bad for a guy with a bun. Come back when your feet believe in you.`], () => { if (g.missions.state('danceoff') === 'active') g.missions.fail('danceoff', 'Sal wins this round'); });
};
BW7.hug = function (g, a) {
  g.say(a, ['Sunrise hug! The best hug of the day. Come here!'], () => { g.player.heal(6); g.fx.hearts(a.x, a.y + 2, a.z, 12); burnsSfx('gift', null, 'pick'); g.toast('SUNRISE HUG: FULLY HYDRATED (EMOTIONALLY TOO)'); a.ch.play('hug'); });
};
BW7.talkTooHard = function (g, a) {
  const st = g.missions.state('boot');
  if (st === 'available') g.say(a, ['Hey. Hey man. What day is it? Tuesday? I\'ve been up since... Tuesday.', 'I lost a boot. It looks exactly like this one. But it\'s the other one. Somewhere... north-west? Near the shiny stuff?'], () => g.missions.start('boot'));
  else if (st === 'active') g.say(a, ['North-west. Past the shiny stuff. A boot. I believe in you. I also believe the ground is moving.']);
  else g.say(a, ['Two boots. Like a king. What day is it?']);
};

BW7.bootFound = function (g) {
  const a = g.actor('toohard'); if (!a) return;
  a.x = g.player.x + 2; a.z = g.player.z + 1; a.y = g.world.height(a.x, a.z); a.setBehavior('dance');
  a.say('MY BOOT! I can walk in a straight line again! Theoretically!', 3);
  g.addGlow(12); g.toast('HE GIFTED YOU 12 GLOW STICKS + ETERNAL GRATITUDE'); g.fx.hearts(a.x, a.y + 2, a.z, 10);
};

/* ---------------- story beats ---------------- */
BW7.intro = function (g) {
  const S = BW7.state, C = BW7.CAR;
  g.cutscene([
    { music: 'burns_intro' },
    { cam: { x: 30, y: 24, z: -10, tx: C.x, ty: 9, tz: C.z, fov: 0.85 } },
    { wait: 1.6 },   // the engine's day card (day · World N · name) plays over the establishing shot
    { cam: { from: { x: 30, y: 24, z: -10, tx: C.x, ty: 9, tz: C.z, fov: 0.85 }, to: { x: 4, y: 4, z: 150, tx: 0, ty: 6, tz: 40, fov: 0.85 }, dur: 4.5 } },
    { say: ['brady', ['The night\'s almost over. Chinka would have loved this.', 'Focus, Brady. Sunrise set first. Then propane. Then the giant wooden home-wrecker.']] },
    { do: g2 => { BurnsSave.flag(7, 'intro', true); S.introDone = true; g2.camYaw = Math.PI; g2.snapCam = true; burnsMusic('burns_w7'); } },
    { banner: ['RACE THE SUNRISE', 'Talk to Biscuit. Then pedal like you mean it.', { col: '#ffd84a' }] }
  ]);
};
BW7.sunrise = function (g) {
  const S = BW7.state, C = BW7.CAR, p = g.player, T = BW7.SUMMIT;
  BurnsSave.flag(7, 'sunrise', true);
  g.setTod(1, 0.12);
  g.cutscene([
    { cam: { x: T.x + 5, y: T.y + 2.5, z: T.z + 7, tx: T.x, ty: T.y + 1, tz: T.z, fov: 0.85 } },
    { do: g2 => { p.animOverride = 'victory'; burnsSfx('crowd_cheer'); } },
    { cam: { from: { x: T.x + 5, y: T.y + 2.5, z: T.z + 7, tx: T.x, ty: T.y + 1, tz: T.z, fov: 0.85 }, to: { x: T.x - 2, y: T.y + 1.6, z: T.z + 4, tx: T.x, ty: T.y + 6, tz: T.z - 60, fov: 0.95 }, dur: 4 } },
    { say: ['brady', ['There it is. The sun. Rising over a heart. On a car. In the desert.', 'Hang on, Chinka. Whatever that wooden guy is planning, he\'s going to need daylight. So do I.']] },
    { do: g2 => { p.animOverride = null; } }
  ], () => BW567K.after(g, 1.5, g2 => BW7.queenArrives(g2)));
};
BW7.queenArrives = function (g) {
  const S = BW7.state, q = g.actor('queen'), F = BW7.FLOOR, p = g.player; if (!q || S.queenOn) return;
  q.hidden = false; q.x = F.x + 20; q.z = F.z - 10; q.y = 9; q.data.flyIn = true;
  g.missions.start('boss', true);
  g.cutscene([
    { music: 'man_boss' },
    { do: g2 => { if (p.y > 3) p.teleport(F.x, 0, F.z + 14, Math.PI); g2.snapCam = true; } },
    { cam: { x: F.x - 8, y: 3, z: F.z + 16, tx: q.x, ty: q.y, tz: q.z, fov: 0.85 } },
    { do: g2 => { S.qT = 0; } },
    { until: g2 => { S.qT += 1 / 120; const k = Math.min(1, S.qT / 2.4); q.x = lerp(F.x + 20, F.x + 8, k); q.y = lerp(9, 4.2, k); return k >= 1; } },
    { banner: ['THE GLITTER QUEEN', 'Golden Hour Influencer · Boss', { col: '#ff9ad8', big: true, dur: 3 }] },
    { say: [q, ['Hiii! Sorry, can everyone move? The sunrise is SPONSORED now.', 'This is a hashtag-no-filter moment. So get out of my filter.']] },
    { say: ['brady', ['It\'s a sunrise. It belongs to everybody.']] },
    { say: [q, ['Everything belongs to my FOLLOWERS. Drones! Get his bad side! He only HAS bad sides!']] },
    { do: g2 => { S.queenOn = true; q.data.flyIn = false; q.data.mode = 'float'; q.data.t = 3.5; q.data.ang = Math.atan2(q.x - F.x, q.z - F.z); q.data.alt = 4.2; for (const a of g2.actors) if (a.def.crowd7) { a.home = { x: a.x + (a.x - F.x) * 0.6, z: a.z + (a.z - F.z) * 0.6 }; a.x = a.home.x; a.z = a.home.z; }
      g2.boss = BW567K.bar('THE GLITTER QUEEN', q, 4, { get st() { return q.data.mode === 'likes' ? 'stunned' : q.data.mode; } });
      g2.banner('FIGHT!', 'Hide behind the speakers from the glare · dodge the drones · bonk her while she checks her likes', { col: '#ff9ad8' }); } }
  ]);
};
BW7.queenDefeated = function (g) {
  const S = BW7.state, q = g.actor('queen'), b = g.actor('biscuit'), C = BW7.CAR;
  S.queenOn = false; g.boss = null; q.data.mode = 'beaten';
  g.missions.complete('boss');
  BW567K.after(g, 1.2, g2 => {
    if (b) { b.setBehavior('dance'); b.x = BW7.FLOOR.x - 3; b.z = BW7.FLOOR.z + 6; b.y = 0; }
    g2.cutscene([
      { music: 'burns_victory' },
      { cam: { x: q.x + 3.5, y: 2.2, z: q.z + 3.5, tx: q.x, ty: 1.6, tz: q.z, fov: 0.85 } },
      { say: [q, ['My drones... my likes... my LIGHTING...', 'Wait. Is THIS what the sun looks like without a filter?', '...Wow. Okay. I\'m putting the phone down. For like... ten minutes.']] },
      { do: g3 => { q.setBehavior('dance'); q.friendly = true; burnsSfx('crowd_cheer'); g3.fx.confetti(C.x, 12, C.z + 2, 80); } },
      { say: [q, ['Oh, and your wooden guy? He was in my feed last night. Buying ALL the propane at Hell Station. Hashtag suspicious.']] },
      { cam: { x: C.x + 10, y: 6, z: C.z + 30, tx: C.x, ty: 10, tz: C.z, fov: 0.9 } },
      { say: [b || 'brady', ['Propane! He\'s hoarding propane! El Pulpo needs that propane!', 'Hell Station, buddy. Bring sunscreen. DPW does NOT do hugs.']] },
      { say: ['brady', ['Then we take the octopus to Hell Station. Chinka, I\'m coming.']] },
      { do: g3 => { g3.player.victoryT = 3; g3.fx.confetti(g3.player.x, g3.player.y + 2, g3.player.z, 50); } },
      { wait: 1.2 }
    ], g3 => g3.finishWorld());
  });
};

/* ============================================================ drawing ============================================================ */
BW7.sprites = function (g, R) {
  const S = BW7.state, Sp = BURNS_SPRITES.R, t = g.time, C = BW7.CAR;
  if (!S) return;
  const hp = S.heartPos, k = S.pulse || 0;
  R.bbs.bb(hp[0], hp[1], hp[2] + 1.6, 14 + k * 3, 14 + k * 3, Sp.glow, [1, 0.3, 0.55], 0.35 + k * 0.25, true);
  if (S.on) {
    for (let i = 0; i < 5; i++) { const a = Math.sin(t * 0.7 + i) * 0.9, el = 0.25 + Math.sin(t * 0.9 + i * 1.7) * 0.15, len = 70, dx = Math.sin(a) * Math.cos(el), dy = Math.sin(el), dz = Math.cos(a) * Math.cos(el); for (let j = 1; j <= 4; j++) R.bbs.streak(C.x, 7.4 + dy * j / 4 * len, C.z + 1 + dz * j / 4 * len, dx, dy, dz, len / 3.8, 0.3, Sp.glow, burnsRGBf(BURNS_NEON[i]), 0.45); }
    g.pointLight(C.x, 8, C.z + 6, 26, [1, 0.35, 0.6], 1 + k);
  }
  if (S.glare > 0) { const q = g.actor('queen'); if (q) R.bbs.bb(q.x, q.y + 2.4, q.z, 4 + S.glare * 10, 4 + S.glare * 10, Sp.glow, [1, 0.95, 0.9], 0.5 + S.glare * 0.3, true); }
};
BW7.overlay = function (ctx, g) {
  const S = BW7.state;
  if (g.cine || g.bw567rhythm) return;
  if (g.missions.state('photobomb') === 'active') { const W = Game.cssW; BurnsUI.text(ctx, 'DON\'T GET FLASHED', W / 2, BW567K.hudY(g) + 12, 12, '#ffd84a', { glow: '#ff4fa8' }); }
};
BurnsWorlds.get(7).dbg = BW7;
