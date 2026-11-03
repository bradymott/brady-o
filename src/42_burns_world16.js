/* ============================================================
   BRADY GOES TO BURNING MAN — World 16: RHYTHM WAVE (Monday)
   Brady followed the bamboo bass all day looking for "4:30". It's a
   time, not a street. Rhythm Wave's camp lead WOLFIE makes him a deal:
   help build the camp before sundown, then win tonight's Yoga Yoni
   Tantra Enlightenment Dance Contest. He wins. BAM BAM (a burner in an
   original caveman costume) gifts the champion a "sassafras": take
   HALF. Brady takes the whole thing. The world goes wonky as a donkey,
   ground scores start showing up, and Brady rides a wobbly yellow bike
   across the playa to the giant glowing mushrooms.
   Missions (Burn Tokens):
     haul      Bamboo Haul           carry 4 poles (trailer, container roof, limbo, RV flagpole)
     lash      Lash the Floor        ground-pound the 6 loose floor panels
     sails     Raise the Shade       hoist 3 shade sails against the gusts
     lanterns  Light the Wave        climb the Wave and hang 6 lanterns (needs the poles)
     contest   The Yoga Yoni Tantra Enlightenment Dance Contest (2 rounds, win or rematch)
     guard     Shroom Security       USE a Love Bomb to win over Doug at the grove (use: 'molly')
     elder     Elder Shroom Summit   bounce up the Glowshroom Grove (big art)
   Story missions without a token: bike (find the yellow bike), ride (the wonky ride).
   Side quest: gs101 Ground Score 101 (stash, trade, use).
   Kit: 42_burns_w16_a_kit.js, 42_burns_w16_b_build.js, 42_burns_w16_c_fx.js
   ============================================================ */

BurnsWorlds.register({
  id: 16, name: 'Rhythm Wave', sub: 'The bamboo dance floor',
  day: 'Monday', dayShort: 'MON', dayCard: false, noOutro: true,
  story: 'Monday. Brady follows the bamboo bass to a camp called Rhythm Wave.',
  sky: BW16.SKY_DAY, sky2: BW16.SKY_NIGHT, tod: 0.06,
  music: BW16.track('burns_w16', 'burns_w3'),
  bounds: [-140, -178, 140, 290],
  spawn: { x: BW16.SPAWN.x, y: 0, z: BW16.SPAWN.z, yaw: BW16.SPAWN.yaw },
  ground: { base: '#cfa47c', crack: 0.27, mottle: 0.42, res: 0.55 },
  dust: 0.9,
  missions: [
    { id: 'haul', name: 'Bamboo Haul', short: 'Carry bamboo poles to the Wave', type: 'custom', count: 4, progressLabel: 'Poles delivered', giver: 'wolfie', start: 'manual',
      marker: { x: BW16.RACK.x, z: BW16.RACK.z }, desc: 'The Wave is missing four ribs. Poles are all over camp: on the trailer, on the container roof, under a limbo dancer and up on the RV. Carry each one to the rack at the Wave\'s west foot.',
      hint: 'Rhythm Wave, the rack at the west foot of the Wave', onComplete(g) { const a = g.actor('wolfie'); if (a) a.say('AWOOO! The Wave has a spine!', 2.5); } },
    { id: 'lash', name: 'Lash the Floor', short: 'Ground-pound the loose floor panels', type: 'custom', count: 6, progressLabel: 'Panels lashed', giver: 'torque', start: 'manual',
      marker: { x: BW16.F.x, z: BW16.F.z }, desc: 'Six bamboo panels on the dance floor are loose. Jump, then press ACTION in the air to slam each glowing panel into place while Torque zip-ties it.',
      hint: 'The bamboo dance floor', onEvent(g, m, name, d) { if (name === 'pound' && d) BW16.poundAt(g, d.x, d.y, d.z); } },
    { id: 'sails', name: 'Raise the Shade', short: 'Hoist the three shade sails', type: 'custom', count: 3, progressLabel: 'Sails up', giver: 'skipper', start: 'manual',
      marker: { x: BW16.LOUNGE.x, z: BW16.LOUNGE.z }, desc: 'Hoist the lounge\'s three shade sails. Tap ACTION at each winch, fast. Gusts knock a half-raised sail back down.',
      hint: 'The lounge east of the dance floor' },
    { id: 'lanterns', name: 'Light the Wave', short: 'Hang lanterns along the Wave', type: 'custom', count: 6, progressLabel: 'Lanterns hung', giver: 'luz', start: 'manual', requires: ['haul'], hold: 'bw16Lanterns',
      marker: { x: BW16.F.x - 2, z: BW16.F.z - 14 }, desc: 'Climb the Wave\'s back on the bamboo mats and walk the crest, hanging a paper lantern on every glowing hook.',
      hint: 'The Wave: up the bamboo mats on its back', lockedDesc: 'The Wave needs all its ribs first.' },
    { id: 'contest', name: 'The Yoga Yoni Tantra Enlightenment Dance Contest', short: 'Win the dance contest', type: 'custom', giver: 'wolfie', start: 'manual', tokenDirect: true,
      requires: ['haul', 'lash', 'sails', 'lanterns'], marker: { x: BW16.F.x, z: BW16.F.z },
      desc: 'Beat Moonbeam Starchild, Glitter and Sir Fluffington. Two rounds: tap JUMP and SPIN on the beat. Score to beat: 8.4.',
      hint: 'The bamboo dance floor, at sundown', lockedDesc: 'Finish building the camp first.' },
    { id: 'bike', name: 'Find a Yellow Bike', short: 'Find the yellow camp bike', type: 'custom', token: false, start: 'manual', requires: ['contest'],
      marker: { x: BW16.TREE.x, z: BW16.TREE.z }, desc: 'Wolfie said to take the yellow camp bike. Wherever it went.', hint: 'Somewhere up the Bike Tree, by the playa exit' },
    { id: 'ride', name: 'Wonky as a Donkey', short: 'Ride to the glowing mushrooms', type: 'custom', token: false, start: 'auto', requires: ['bike'],
      marker: { x: BW16.GATE.x, z: BW16.GATE.z }, desc: 'Ride the bike across the playa to the giant glowing mushrooms. The handlebars have opinions.', hint: 'Out on the deep playa: follow the lantern posts',
      onStart(g) { g.toast('PRESS BIKE TO RIDE · FOLLOW THE LANTERNS'); },
      onUpdate(g, m) { const p = g.player, G = BW16.GATE; if (Math.hypot(p.x - G.x, p.z - (G.z - 4)) < 16 && !g.cine) g.missions.complete('ride'); },
      onComplete(g) { BW16.arrive(g); } },
    { id: 'guard', name: 'Shroom Security', short: 'Win Doug over with a LOVE BOMB', type: 'custom', start: 'auto', requires: ['ride'], giver: 'doug', use: 'molly', useHint: 'USE A LOVE BOMB!',
      marker: { x: BW16.GATE.x, z: BW16.GATE.z - 3 }, tokenAt: { x: BW16.GATE.x - 1.5, y: 1.4, z: BW16.GATE.z - 3 },
      desc: 'Doug of Shroom Security won\'t open the vibe field without a waiver. Waivers are closed. A LOVE BOMB from your backpack might change his mind. Uncle Barter trades for them.',
      hint: 'The Glowshroom Grove gate (Love Bombs: Uncle Barter, mid-playa)' },
    (typeof BurnsBigArt !== 'undefined' ? BurnsBigArt.mission('glowshroomGrove', 'elder', { name: 'Elder Shroom Summit', short: 'Bounce to the top of the Elder Shroom', requires: ['guard'], marker: { x: BW16.GROVE.x, z: BW16.GROVE.z }, hint: 'The Glowshroom Grove: hop off the bike and bounce cap to cap' })
      : { id: 'elder', name: 'Elder Shroom Summit', type: 'custom', start: 'manual', requires: ['guard'] }),
    { id: 'gs101', side: true, name: 'Ground Score 101', short: 'Stash, trade and use a ground score', type: 'custom', count: 3, progressLabel: 'Ground Score 101', start: 'manual', requires: ['contest'], reward: { glow: 20 },
      desc: 'Bam Bam\'s crash course: pick up a baggie (it goes in your BACKPACK), trade one with Uncle Barter, then use one when you need it.',
      hint: 'Baggies on the ground after the pill; Uncle Barter, mid-playa',
      onEvent(g, m, name, d) {
        const st = m.data;
        if (name === 'pack' && BurnsPack.isScore(d) && !st.stash) { st.stash = 1; g.banner('STASHED!', 'Ground scores go in your BACKPACK. Open it with the bag button (or G).', { col: '#ff9ad8' }); g.missions.progress('gs101'); }
        else if (name === 'trade' && !st.trade) { st.trade = 1; g.banner('TRADED!', 'Reciprocal gifting. Totally not bartering.', { col: '#ff9ad8' }); g.missions.progress('gs101'); }
        else if (name === 'use' && BurnsPack.isScore(d) && !st.use) { st.use = 1; g.missions.progress('gs101'); }
      } }
  ],
  build(api, g) {
    const F = BW16.F, R = api.rng;
    const S = BW16.state = { g: null, timers: [], carry: null, poles: [], panels: [], sails: [], hooks: [], ribs: [], speakers: [], devils: [], wonk: 0, wonkTarget: 0, alive: false, aliveK: 0, aliveDue: 0, fieldK: 1, contest: null, spiral: 0, calm: false };
    /* ---------- ground ---------- */
    api.paint((c, P, Sx) => {
      for (let i = 0; i < 150; i++) { const x = R.range(-140, 140), z = R.range(-178, 290), [px, pz] = P(x, z), r = R.range(2, 10) * Sx; const gr = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gr.addColorStop(0, dark ? 'rgba(130,92,70,0.22)' : 'rgba(240,212,178,0.25)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      c.strokeStyle = 'rgba(110,80,62,0.18)'; c.lineWidth = 0.3 * Sx;
      for (let i = 0; i < 30; i++) { const [ax, az] = P(R.range(-140, 140), R.range(-160, 280)), ang = R() * TAU, len = R.range(30, 110) * Sx; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.4) * len * 0.5, az + Math.sin(ang + 0.4) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
      // the camp's packed-dust yard
      const [cx, cz] = P(0, -76), cr = 52 * Sx, gy = c.createRadialGradient(cx, cz, cr * 0.2, cx, cz, cr); gy.addColorStop(0, 'rgba(170,125,92,0.32)'); gy.addColorStop(1, 'rgba(170,125,92,0)'); c.fillStyle = gy; c.fillRect(cx - cr, cz - cr, cr * 2, cr * 2);
    });
    /* ---------- the camp ---------- */
    BW16.buildStreet(api, g, S);
    BW16.buildCamp(api, g, S);
    BW16.buildFloor(api, g, S);
    BW16.buildWave(api, g, S);
    BW16.buildLounge(api, g, S);
    BW16.buildSkyHammock(api, g, S);
    BW16.buildBikeTree(api, g, S);
    BW16.buildPlaya(api, g, S);
    BW16.buildGroveGate(api, g, S);
    BW16.buildVisions(api, g, S);
    // the drop-off rack at the Wave's west foot
    const Rk = BW16.RACK;
    api.mesh(Rk.x, Rk.z, m => { for (const sd of [-1, 1]) { burnsW16Bamboo(m, sd * 1.2, 0, -0.6, sd * 0.9, 2.2, 0, 0.07, { seg: 0.8 }); burnsW16Bamboo(m, sd * 1.2, 0, 0.6, sd * 0.9, 2.2, 0, 0.07, { seg: 0.8 }); } burnsW16Bamboo(m, -1.3, 2.05, 0, 1.3, 2.05, 0, 0.07, { seg: 1.3 }); for (let i = 0; i < 4; i++) burnsW16Bamboo(m, -1 + i * 0.6, 0, 0.45, -0.7 + i * 0.6, 2.4, -0.2, 0.06, { seg: 0.9 }); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.6, y0: 0, y1: 2.2, walk: false }] }; }, { yaw: 0.3 });
    api.sign('POLES GO HERE\n(POINTY END UP)', Rk.x - 2.6, Rk.z + 1.6, { yaw: 0.4, h: 0.8, style: { bg: '#f4ead0', fg: '#3a1a10', size: 34, border: '#8a5a32' } });
    /* ---------- the four poles ---------- */
    const pole = (x, y, z, yaw) => { const mv = api.mover(m => { burnsW16Bamboo(m, -2.6, 0, 0, 2.6, 0, 0, 0.11, { seg: 0.9 }); return { cols: [] }; }); mv.x = x; mv.y = y; mv.z = z; mv.yaw = yaw; return mv; };
    const Tr = BW16.TRAILER, Co = BW16.CONTAINER, Li = BW16.LIMBO, Rv = BW16.RV;
    S.poles = [
      { name: 'TRAILER', mv: pole(Tr.x, 1.66, Tr.z, 0), x: Tr.x, z: Tr.z, y: 0.6, r: 4.2 },
      { name: 'CONTAINER', mv: pole(Co.x, Co.top + 0.13, Co.z + 0.2, 0.1), x: Co.x, z: Co.z, y: Co.top, r: 3.6 },
      { name: 'LIMBO', mv: S.limboPole, x: Li.x, z: Li.z, y: 0.5, r: 0, limbo: true },
      { name: 'FLAGPOLE', mv: null, x: Rv.x - 2.2, z: Rv.z, y: 3.3, r: 2.6 }
    ];
    // the RV flagpole stands upright with a little Rhythm Wave flag
    const fp = api.mover(m => { burnsW16Bamboo(m, 0, 0, 0, 0, 4.2, 0, 0.09, { seg: 0.8 }); m.color('#ff7a3a'); m.poly([[0.05, 4.1, 0], [1.4, 3.75, 0.02], [0.05, 3.35, 0]]); m.poly([[1.4, 3.75, -0.02], [0.05, 4.1, 0], [0.05, 3.35, 0]]); m.color('#22b8c4'); m.poly([[0.05, 3.85, 0.01], [0.9, 3.72, 0.03], [0.05, 3.55, 0.01]]); return { cols: [] }; });
    fp.x = Rv.x - 2.2; fp.y = 3.3; fp.z = Rv.z; S.poles[3].mv = fp;
    /* ---------- loose floor panels (Lash the Floor) ---------- */
    S.panels = [0.25, 1.1, 1.75, 4.55, 5.2, 5.95].map((a, i) => {
      const x = F.x + Math.sin(a) * 5.6, z = F.z + Math.cos(a) * 5.6;
      const mv = api.mover(m => { m.color('#e4b46a'); m.roundBox(0, 0.05, 0, 1.6, 0.1, 1.6, 0.04); m.color('#9c7434'); for (let k = -2; k <= 2; k++) m.box(k * 0.32, 0.105, 0, 0.04, 0.012, 1.55); m.color('#ffd36a', 0.6); for (const c2 of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) m.ball(c2[0], 0.12, c2[1], 0.05, { seg: 6, rings: 4 }); m.emissive(0); return { cols: [] }; });
      mv.x = x; mv.y = F.h + 0.06; mv.z = z; mv.yaw = a;
      return { i, x, z, mv, done: false };
    });
    /* ---------- the Glowshroom Grove ---------- */
    const G = BW16.GROVE;
    if (typeof BurnsBigArt !== 'undefined') {
      S.grove = BurnsBigArt.place(api, g, 'glowshroomGrove', G.x, G.z, { rotY: Math.PI, mission: 'elder', vantage: true,
        onArrive(g2) { if (!g2.cine) g2.banner('THE GLOWSHROOM GROVE', 'They are... breathing?', { col: '#b07aff' }); },
        onReach(g2) { g2.player.say('I can see the whole playa! It\'s WAVING at me!', 2.5); } });
    } else {
      for (let i = 0; i < 6; i++) { const a = i * 1.05, r = 7; api.lathe(G.x + Math.sin(a) * r, 0, G.z + Math.cos(a) * r, [[0.4, 0], [0.4, 2 + i * 2], [2, 2.2 + i * 2], [0, 3 + i * 2]], burnsHSL(i * 60, 0.8, 0.6), { e: 0.4 }); }
    }
    /* ---------- people ---------- */
    const J = BW16.JUDGES, L = BW16.LOUNGE, K = BW16.KITCHEN, Ar = BW16.ARCH;
    api.npc({ id: 'wolfie', name: 'WOLFIE', type: 'bw16Wolfie', seed: 1, x: Ar.x - 2.5, z: Ar.z + 9, yaw: Math.PI, behavior: 'bw16Stage', talk: (g2, a) => BW16.talkWolfie(g2, a), always: true });
    api.npc({ id: 'torque', name: 'TORQUE', type: 'dpw', seed: 3, x: F.x + 8.5, z: F.z + 6.5, yaw: -2.4, prop: 'hammer', talk: (g2, a) => BW16.talkTorque(g2, a), chat: ['Don\'t let the mohawk fool you.', 'I zip-tie with love.', 'Bamboo is just tall grass with ambition.'] });
    const sk = BurnsRig.npcSpec('burner', 7); Object.assign(sk, { top: { kind: 'button', col: '#1e3a6a', open: true, under: '#f4f4f0' }, bottom: { kind: 'shorts', col: '#f4f0e6' }, shoes: { kind: 'sneakers', col: '#f4f4f0', sole: '#d8d8d8' }, hat: { kind: 'cap', col: '#f4f4f0' }, glasses: 'aviator', lensCol: '#3a6aa8', beard: { col: '#c8a070', len: 0.05, trim: true }, hair: { style: 'short', col: '#c8a070', hi: '#f0d8a8' }, goggles: false, acc: ['beads'], face: 'friendly', paint: null, key: 'w16:skipper' });
    api.npc({ id: 'skipper', name: 'SKIPPER', spec: sk, x: L.x - 6.5, z: L.z + 6.0, yaw: -2.2, talk: (g2, a) => BW16.talkSkipper(g2, a), chat: ['Ahoy, landlubber!', 'Shade is a state of mind.', 'Every gust is personal.'] });
    api.npc({ id: 'luz', name: 'LAMPLIGHTER LUZ', type: 'lamplighter', seed: 2, x: Rk.x - 2.6, z: Rk.z + 4.2, yaw: 0.6, anim: 'lantern', talk: (g2, a) => BW16.talkLuz(g2, a) });
    api.npc({ id: 'bambam', name: 'BAM BAM', type: 'bw16BamBam', seed: 1, x: L.x + 2.2, z: L.z - 0.8, yaw: -2.0, behavior: 'bw16Stage', anim0: 'bw16Bonk', talk: (g2, a) => BW16.talkBamBam(g2, a), always: true });
    api.npc({ id: 'auntie', name: 'AUNTIE NAMASTE', type: 'burnermom', seed: 3, x: K.x + 1.5, z: K.z + 1.6, yaw: 0.6, behavior: 'bw16Stage', anim0: 'cheer', lines: ['Namaste, sweetie! Are you hydrating? You look crispy.', 'I\'m judging the contest tonight. I give everybody a nine. Except people who don\'t hydrate.'], gift: { kind: 'glowstick', n: 12 }, always: true });
    const gc = BurnsRig.npcSpec('burner', 11); Object.assign(gc, { top: { kind: 'tank', col: '#f4f4f0' }, bottom: { kind: 'shorts', col: '#3a3a44' }, hat: { kind: 'bandana', col: '#c83a2a' }, glasses: null, goggles: false, acc: ['beads'], face: 'goofy', paint: null, shoes: { kind: 'sandals', col: '#6a4a2a' }, beard: { col: '#5a3a24', len: 0.06 }, key: 'w16:greg' });
    api.npc({ id: 'greg', name: 'GRILLED CHEESE GREG', spec: gc, x: K.x + 2.0, z: K.z - 0.4, yaw: 0.2, lines: ['Grilled cheese! The official sandwich of hydration. Don\'t think about it.', 'Wolfie says you\'re building with us? Eat first. Bamboo is heavy.'], gift: { kind: 'water' } });
    api.npc({ id: 'guru', name: 'GURU GARY', type: 'bw16Guru', seed: 1, x: S.booth.x + 0.9, z: S.booth.z - 0.5, y: S.booth.y, fixedY: true, yaw: 0, behavior: 'bw16Stage', anim0: 'welcome', lines: ['Mic check. One, two. Om, two.', 'The contest begins when the floor is alive. The floor is a living thing. Mostly bamboo.'], always: true });
    api.npc({ id: 'moonbeam', name: 'MOONBEAM STARCHILD', type: 'healer', seed: 4, x: F.x - 7.4, z: F.z + 4.2, yaw: 1.2, behavior: 'bw16Stage', anim0: 'bw16Aura', lines: ['I don\'t compete. I simply... arrive.', 'Your aura is very dusty. And very beige.'], chat: ['I don\'t compete. I simply... arrive.', 'The bamboo is nervous. I can hear it.', 'Your aura is very dusty. And very beige.'], always: true });
    api.npc({ id: 'glitter', name: 'GLITTER', type: 'sparklepony', seed: 2, x: F.x + 4.2, z: F.z + 5.2, yaw: -2.6, behavior: 'bw16Stage', anim0: 'dance', animK: { style: 1, bpm: 118 }, lines: ['I didn\'t practice. I manifested.', 'Can I borrow your water? For the contest? For my wings?'], chat: ['I didn\'t practice. I manifested.', 'Can I borrow your water? For my wings?', 'My spirit animal is a disco ball.'], always: true });
    api.npc({ id: 'fluff', name: 'SIR FLUFFINGTON', type: 'furry', seed: 3, x: F.x + 7.6, z: F.z - 0.4, yaw: -1.6, behavior: 'bw16Stage', anim0: 'robot', lines: ['I\'ve been training for this all year. In the suit. In August.', 'Is it hot in here or is it the fur? It\'s the fur.'], chat: ['Trained all year. In the suit. In August.', 'It\'s the fur. It\'s always the fur.', 'Don\'t touch the tail. Okay. One touch.'], always: true });
    // the limbo pole crew (pole 3)
    api.npc({ id: 'limbo1', name: 'LIMBO LOU', type: 'tutu', seed: 4, x: Li.x - 2.2, z: Li.z, yaw: Math.PI / 2, behavior: 'bw16Stage', anim0: 'cheer', talk: (g2, a) => BW16.talkLimbo(g2, a) });
    api.npc({ id: 'limbo2', name: 'LIMBO LARA', type: 'burner', seed: 9, x: Li.x + 2.2, z: Li.z, yaw: -Math.PI / 2, behavior: 'bw16Stage', anim0: 'cheer', talk: (g2, a) => BW16.talkLimbo(g2, a) });
    // the crowd on the floor's edge (they dance once the floor is alive, and react during the contest)
    for (let i = 0; i < 9; i++) {
      const a = 0.35 + i / 9 * (TAU - 1.6) + (i > 4 ? 0.9 : 0), r = F.r + 1.6 + (i % 2) * 1.1, x = F.x + Math.sin(a) * r, z = F.z + Math.cos(a) * r;
      api.npc({ type: ['burner', 'tutu', 'furcoat', 'ledsuit', 'burner', 'tutu', 'sparklepony', 'burner', 'ledsuit'][i], seed: 30 + (i % 6), x, z, yaw: Math.atan2(F.x - x, F.z - z), behavior: 'bw16Stage', anim0: 'idle', style: i % 6, bw16Crowd: true, chat: ['Is the floor done yet?', 'I came for the bamboo. I stayed for the bamboo.', 'Contest tonight! I\'m judging. Silently.', 'Wolfie says you\'re new. Welcome home!'] });
    }
    api.crowd(L.x + 1, L.z + 1, 3.0, 3, { behaviors: ['sit', 'idle', 'dance'] });
    api.crowd(K.x - 2, K.z + 1.2, 2.2, 2, { behaviors: ['idle', 'dance'] });
    // the street
    api.npc({ id: 'fairy', name: 'THE GLOW FAIRY', type: 'tutu', seed: 2, x: 6, z: -147, yaw: Math.PI, lines: ['Glow sticks! Free! Like love, but cheaper!', 'Follow the bass, honey. You\'re SO close. You\'ve been SO close for six hours.'], gift: { kind: 'glowstick', n: 15 } });
    api.crowd(-24, -156, 3.5, 4, { behaviors: ['dance', 'idle', 'wander'] });
    api.crowd(34, -152, 3.5, 3, { behaviors: ['dance', 'dance', 'idle'] });
    // the playa
    api.npc({ id: 'pickle', name: 'PICKLE PETE', type: 'crusty', seed: 21, x: 11.5, z: 22.8, yaw: -0.4, prop: 'bottle', lines: ['Pickle juice! Electrolytes, baby! Don\'t make that face.', 'Whoa. Your pupils are the size of my pickles. Drink this.'], gift: { kind: 'water' } });
    const U = BW16.BARTER;
    api.npc({ id: 'barter', name: 'UNCLE BARTER', type: 'crusty', variant: 'kilt', seed: 31, x: U.x + 0.3, z: U.z - 2.6, yaw: 0.2, prop: 'camera',
      lines: ['Welcome to Uncle Barter\'s Reciprocal Gifting Emporium. Not bartering. I\'m just named that.', 'You give a gift, I give a gift. Simultaneously. With paperwork.'],
      chat: ['Psst! Reciprocal gifting! Totally legal!', 'Got a Party Powder? I\'ve got a Love Bomb.', 'Not bartering. Not bartering!'],
      trades: [
        { id: 'p2m', give: 'powder', get: 'molly', label: 'Party Powder for a Love Bomb', once: false },
        { id: 'g2m', give: { glow: 20 }, get: 'molly', label: 'A Love Bomb for 20 glow sticks', once: false },
        { id: 'w2p', give: 'weed', get: 'powder', label: 'Floaty for Party Powder', once: false },
        { id: 'k2g', give: 'khole', get: { glow: 30 }, label: 'K-Hole for 30 glow sticks', once: false },
        { id: 'g2w', give: { glow: 10 }, get: 'water', label: 'A water bottle for later', once: false }
      ] });
    api.npc({ id: 'doug', name: 'DOUG (SHROOM SECURITY)', type: 'bw16Doug', seed: 1, x: G.x + 1.4, z: BW16.GATE.z - 2.4, yaw: Math.PI, behavior: 'bw16Stage', anim0: 'clipboard', talk: (g2, a) => BW16.talkDoug(g2, a), always: true });
    api.crowd(-14, 128, 3, 3, { behaviors: ['dance', 'idle'], types: ['ledsuit', 'burner', 'furcoat'] });
    /* ---------- pickups ---------- */
    // glow sticks: the way in, around the floor, up the Wave, the lounge, the playa
    api.glowLine(0, -150, 0, -124, 9);
    api.glowRing(F.x, F.z, F.r + 2.6, 18);
    for (const q of S.route) api.pickup('glowstick', q.x, q.y + 0.9, q.z);
    for (let x = -9; x <= 9; x += 3) api.pickup('glowstick', x, BW16.crestTop(x) + 0.9, F.z - 9);
    api.glowRing(L.x, L.z, 4.2, 10);
    api.glowRing(BW16.TREE.x, BW16.TREE.z, 2.6, 8, 0.9);
    for (let i = 0; i < BW16.PATH.length - 1; i++) { const [x0, z0] = BW16.PATH[i], [x1, z1] = BW16.PATH[i + 1]; api.glowLine(x0, z0 + 3, x1, z1 - 3, 6); }
    api.glowRing(G.x, G.z, BW16.FIELD_R + 3, 12);
    api.glowRing(U.x, U.z, 4.5, 6);
    api.glowArc(Co.x + 4.2, 2.2, Co.z - 0.5, Co.x + 1.5, 3.4, Co.z, 0.8, 4);
    api.glowArc(S.speakers[1].x, 1.9, S.speakers[1].z + 1.2, S.speakers[1].x, 4.4, S.speakers[1].z - 0.3, 0.8, 4);
    // water
    for (const [x, z] of [[-6, -100], [16, 40], [-8, 150], [6, 200], [30, -60]]) api.pickup('water', x, 0.9, z);
    // photos of Chinka
    api.pickup('photo', S.speakers[1].x, S.speakers[1].top + 0.95, S.speakers[1].z - 0.32, { id: 'ph1' });
    api.pickup('photo', S.lip.x, S.lip.y + 0.9, S.lip.z, { id: 'ph2' });
    api.pickup('photo', BW16.HAMMOCK.x, BW16.HAMMOCK.y + 1.0, BW16.HAMMOCK.z, { id: 'ph3' });
    // ground scores (invisible until Bam Bam's pill turns them on)
    api.pickup('bag:powder', F.x + 1.6, F.h + 0.9, F.z + 2.4, { label: 'GROUND SCORE!' });
    api.pickup('bag:weed', L.x + 1.0, 1.4, L.z + 4.3);
    api.pickup('bag:powder', BW16.HAMMOCK.x - 4.5, 0.9, BW16.HAMMOCK.z + 4.5);
    api.pickup('bag:khole', Co.x - 1.6, Co.top + 0.9, Co.z);
    api.pickup('bag:bufo', BW16.TREE.x - 0.6, 4.26 + 0.9, BW16.TREE.z + 0.6);
    api.pickup('bag:liquor', K.x - 2.0, 1.75, K.z - 1.4);
    api.pickup('bag:shrooms', BW16.PINATA.x + 3.5, 0.9, BW16.PINATA.z - 3.5);
    api.pickup('bag:lsd', -14, 0.9, 52);
    api.pickup('bag:weed', 10, 0.9, 176);
    /* ---------- dust devils on the playa ---------- */
    S.devils = [{ x0: 0, z0: 146, ax: 14, w: 0.32, ph: 0 }, { x0: 6, z0: 178, ax: 12, w: 0.41, ph: 2 }, { x0: -8, z0: 108, ax: 10, w: 0.27, ph: 4 }].map(d => Object.assign(d, { x: d.x0, z: d.z0 }));
    /* ---------- camp flags, map markers ---------- */
    api.checkpoint('cp_street', -6, -152, { yaw: 0, name: 'The Street Called 4:30' });
    api.checkpoint('cp_camp', 9, -108, { yaw: 0, name: 'Rhythm Wave' });
    api.checkpoint('cp_floor', 14, -58, { yaw: Math.PI, name: 'The Bamboo Floor' });
    api.checkpoint('cp_barter', -12, 101, { yaw: 0, name: 'Uncle Barter\'s Rug' });
    api.checkpoint('cp_grove', -9, 205, { yaw: 0, name: 'Shroom Security' });
    api.marker('floor', F.x, F.z, 'Bamboo Floor', { col: '#ffd36a' });
    api.marker('lounge', L.x, L.z, 'Shade Lounge', { col: '#ff7a3a' });
    api.marker('tree', BW16.TREE.x, BW16.TREE.z, 'Bike Tree', { col: '#ffd21a' });
    api.marker('barter', U.x, U.z, 'Uncle Barter', { col: '#ff9ad8' });
    api.marker('grove', G.x, G.z, 'Glowshroom Grove', { col: '#b07aff' });
    api.light(G.x, G.z, 26, '#b07aff', 0.35);
  },
  onStart(g) {
    const S = BW16.state, M = g.missions, F = BW16.F;
    S.g = g; S.calm = BW16.calm();
    BW16.hookEnv(g);
    if (!g._bw16Cam && typeof g.updateCamera === 'function') { g._bw16Cam = true; const orig = g.updateCamera; g.updateCamera = function (fdt) { orig.call(this, fdt); try { BW16.camFx(this, fdt); } catch (e) { BW16.err(e); } }; }
    // ACTION prompts
    if (!g.interactables) g.interactables = [];
    S.poles.forEach((P, i) => { if (P.limbo) return; g.interactables.push({ x: P.x, z: P.z, y: P.y, r: P.r, label: 'GRAB POLE', when: g2 => g2.missions.state('haul') === 'active' && S.carry === null && !P.taken && !P.delivered, fn: g2 => BW16.grabPole(g2, i) }); });
    S.sails.forEach(s => g.interactables.push({ x: s.winch.x, z: s.winch.z, r: 2.4, label: 'HOIST!', when: g2 => g2.missions.state('sails') === 'active' && !s.done, fn: g2 => BW16.hoist(g2, s) }));
    S.hooks.forEach(h => g.interactables.push({ x: h.x, z: h.z, y: h.y, r: 2.0, label: 'HANG LANTERN', when: g2 => g2.missions.state('lanterns') === 'active' && !h.hung, fn: g2 => BW16.hang(g2, h) }));
    g.interactables.push({ x: BW16.TREE.x, z: BW16.TREE.z, y: 4.26, r: 2.2, label: 'TAKE THE BIKE', when: g2 => g2.missions.state('bike') === 'active', fn: g2 => BW16.takeBike(g2) });
    // put the camp back the way the save remembers it
    if (M.isDone('haul')) { for (const P of S.poles) { P.delivered = true; if (P.mv) P.mv.visible = false; } for (const r of S.ribs) r.visible = true; }
    if (M.isDone('lash')) for (const q of S.panels) { q.done = true; q.seatT = 1; q.mv.y = F.h + 0.004; q.mv.pitch = q.mv.roll = 0; }
    if (M.isDone('sails')) for (const s of S.sails) { s.done = true; s.k = 1; }
    if (M.isDone('lanterns')) for (const h of S.hooks) { h.hung = true; h.mv.visible = true; h.glow.s = h.glow.s0; }
    if (BW16.BUILD.every(id => M.isDone(id))) { S.alive = true; S.aliveK = 1; for (const a of g.actors) if (a.def.bw16Crowd) BW16.stage(a, 'dance', { style: a.def.style || 0, bpm: BW16.BPM }); const w = g.actor('wolfie'); if (w) BW16.place(w, F.x - 3.0, F.z + 7.6, Math.PI, 'idle'); }
    if (M.isDone('contest')) BW16.afterContest(g, true);
    S.treeBike.visible = !M.isDone('bike');
    if (M.isDone('guard')) BW16.openField(g, true);
    if (M.isDone('contest') && !M.isDone('elder')) { BW16.wonkOn(g); S.wonk = 0.6; burnsMusic(BW16.track('burns_w16_wonk', 'glitch')); if (!BurnsSave.groundScore()) BurnsSave.setGroundScore(true); if (M.state('gs101') === 'available') M.start('gs101', true); }
    g.tod = BW16.wantTod(g);
    if (M.isDone('ride') && !M.isDone('guard')) M.track('guard');
    // story
    if (!BurnsSave.flag(16, 'intro')) BW16.intro(g);
    else {
      g.dayCard();
      // after the engine's day card has faded
      BW16.after(g, 4.2, g2 => {
        if (BurnsSave.get().worldDone[16]) g2.banner('RHYTHM WAVE', 'The floor is yours, champ. Dance as long as you like.', { col: '#ffd36a' });
        else if (g2.missions.isDone('contest')) g2.banner('WONKY AS A DONKEY', g2.missions.isDone('bike') ? 'Ride to the glowing mushrooms.' : 'Find the yellow bike. Then the mushrooms.', { col: '#ff9ad8' });
        else g2.banner('RHYTHM WAVE', 'Build the camp before sundown. Then win the contest.', { col: '#ffd36a' });
      });
    }
  },
  onRespawn(g) { const S = BW16.state; if (S.carry !== null) BW16.dropPole(g, 'THE POLE WENT BACK WHERE YOU FOUND IT.'); },
  env(g, env) {
    const S = BW16.state, t = g.tod;
    // a sunset band in the middle of the day -> night blend
    const k = Math.max(0, 1 - Math.abs(t - 0.5) / 0.3), mx = (a, b, f) => { a[0] = lerp(a[0], b[0], f); a[1] = lerp(a[1], b[1], f); a[2] = lerp(a[2], b[2], f); };
    if (k > 0) {
      mx(env.hor, [1.0, 0.44, 0.3], 0.55 * k); mx(env.fogCol, [0.84, 0.52, 0.5], 0.4 * k); mx(env.cloudCol, [1.0, 0.56, 0.44], 0.6 * k);
      if (env.mid) { mx(env.mid, [0.86, 0.32, 0.46], 0.5 * k); env.midK = Math.max(env.midK || 0, 0.42 * k); }
      mx(env.sunCol, [1.0, 0.5, 0.26], 0.6 * k); mx(env.keyCol, [env.keyCol[0] * 1.05, env.keyCol[1] * 0.78, env.keyCol[2] * 0.6], 0.5 * k);
    }
    env.belt = 0.3 + 0.7 * k;   // keep the afternoon sky golden: the Belt of Venus only at sunset
    env.rays = 1 + 0.9 * k;
    env.dust = 0.3 + 0.15 * k;
    const w = S && S.g === g ? S.wonk || 0 : 0;
    env.grade = w > 0.01 ? [1.08 + 0.42 * w, 0.12 + 0.06 * w, 0.32 + 0.12 * w] : null;
    env.bloom = 1 + 0.6 * w + (S && S.aliveK ? 0.15 * S.aliveK : 0);
  },
  update(g, dt) {
    const S = BW16.state; if (!S || S.g !== g) return;
    BW16.tick(g, dt);
    if (g.cine || g.bw567rhythm) BW16.hush(g);
    if (g.bw567rhythm && typeof BW567K !== 'undefined' && BW567K.rhythmStep) BW567K.rhythmStep(g, dt);
    if (BW16.dance) BW16.dance.poseT += dt;
    BW16.carryStep(g, dt); BW16.ribStep(g, dt); BW16.panelStep(g, dt); BW16.sailStep(g, dt); BW16.hookStep(g, dt);
    BW16.floorStep(g, dt); BW16.devilStep(g, dt); BW16.wonkStep(g, dt);
    const M = g.missions, p = g.player;
    // the sun goes down as the camp comes together
    const want = BW16.wantTod(g);
    if (Math.abs(g.tod - want) > 0.005 && g.todTarget === null) g.setTod(want, M.isDone('contest') ? 0.08 : 0.04);
    // the floor comes alive once all four build jobs are done
    if (!S.alive && BW16.BUILD.every(id => M.isDone(id))) { if (!S.aliveDue) S.aliveDue = 2.4; if (!g.cine && !g.dialog.open) { S.aliveDue -= dt; if (S.aliveDue <= 0) BW16.floorAlive(g); } }
    // the limbo pole bobs while it's still a limbo pole
    if (S.limboPole && !S.poles[2].taken && !S.poles[2].delivered) S.limboPole.y = 1.05 + Math.sin(g.time * 1.4) * 0.08;
    // Doug + a Love Bomb = a hug
    if (M.state('guard') === 'active' && !S.hugging && !g.cine && p.power === 'molly' && p.powerT > 0) { const d = g.actor('doug'); if (d && Math.hypot(d.x - p.x, d.z - p.z) < 2.8) BW16.hugDoug(g); }
    S.fieldK = BurnsM.damp(S.fieldK, M.isDone('guard') ? 0 : 1, 1.5, dt);
    // the ending: after the Elder Shroom's token
    if (M.isDone('elder') && !S.ended && !g.cine && !g.dialog.open && (BurnsSave.hasToken(16, 'elder') || (S.elderT = (S.elderT || 0) + dt) > 6)) { S.ended = true; if (!BurnsSave.get().worldDone[16]) BW16.ending(g); else BW16.wonkOff(g); }
  },
  drawSprites(g, R) { try { BW16.drawFloor(g, R); } catch (e) { BW16.err(e); } }
});

// no random NPC chatter over a cutscene: hold the chatter clocks and drop chatter bubbles (scripted lines stay)
BW16.hush = function (g) {
  const TYS = typeof BURNS_NPC_TYPES !== 'undefined' ? BURNS_NPC_TYPES : {}, LN = typeof BURNS_LINES !== 'undefined' ? BURNS_LINES : {};
  for (const a of g.actors) {
    if (!a.friendly) continue;
    if (!(a.chatT >= 1.5)) a.chatT = 1.5 + Math.random() * 3;
    if (a.bubbleText) { const TY = TYS[a.type], L = a.def.chat || (TY && TY.lines) || LN[a.type]; if (L && L.indexOf(a.bubbleText) >= 0) { a.bubbleText = null; a.bubbleT = 0; } }
  }
};

/* ---------------- talk ---------------- */
BW16.talkWolfie = function (g, a) {
  const M = g.missions, S = BW16.state;
  if (S.contest) return;
  if (BurnsSave.get().worldDone[16]) { g.say(a, ['Champ! Back for more floor? She missed you.', 'Root Society treating you right? Tell Jefr I said AWOOO.']); return; }
  if (M.isDone('contest')) { g.say(a, M.isDone('bike') ? ['The mushrooms, man. Out past Uncle Barter\'s rug. Follow the lanterns.', 'And if the ground starts breathing, that\'s normal. Probably.'] : ['The yellow bike! Last I saw it, somebody put it up the Bike Tree. For art.', 'It\'s by the playa exit, south side of camp.']); return; }
  if (M.state('contest') === 'available') {
    const again = !!g.flag('tried');
    g.say(a, again ? ['Rematch? I love a rematch. The floor loves a rematch.'] : ['Look at her, man. Lashed, shaded, glowing. You did that.', 'Ready to find your flow? Moonbeam, Glitter and Sir Fluffington are warming up.'], () => { g.flag('tried', true); BW16.contest(g, again); });
    return;
  }
  const st = M.state('haul');
  if (st === 'available') {
    g.say(a, ['Bamboo, my dude. The Wave is missing four ribs.', 'There\'s a pole on the trailer, one on the container roof, one\'s a limbo stick by the lounge, and one is the flagpole up on the RV.', 'Carry them to the rack at the Wave\'s west foot. One at a time. No spinning. Trust me.'], () => g.missions.start('haul'));
    return;
  }
  if (st === 'active') { const n = S.poles.filter(q => q.delivered).length; g.say(a, [`${n} of 4 poles. Keep 'em coming! Trailer, container roof, limbo, RV roof.`]); return; }
  const left = [];
  if (!M.isDone('lash')) left.push('Torque needs the floor lashed');
  if (!M.isDone('sails')) left.push('Skipper needs the sails up');
  if (!M.isDone('lanterns')) left.push('Luz has lanterns for the Wave');
  g.say(a, left.length ? ['The Wave has a spine! Now: ' + left.join(', ') + '.', 'Sun\'s going down, man. Chop chop. Lovingly.'] : ['Almost there...']);
};
BW16.talkTorque = function (g, a) {
  const st = g.missions.state('lash');
  if (st === 'available') g.say(a, ['Don\'t let the mohawk fool you. I cry at sunsets.', 'Six floor panels are loose. The glowing ones. Jump, then hit ACTION in the air to slam each one down. I zip-tie, you stomp.'], () => g.missions.start('lash'));
  else if (st === 'active') g.say(a, ['Jump, then ACTION in the air. Slam the glowing ones! ZIP ZIP!']);
  else g.say(a, ['Floor\'s tighter than my vest. I\'m gonna go cry at the sunset now.']);
};
BW16.talkSkipper = function (g, a) {
  const st = g.missions.state('sails');
  if (st === 'available') g.say(a, ['Ahoy! I captain the shade.', 'Three sails, three winches. Tap ACTION as fast as you can to hoist. Watch for gusts: they knock a half-raised sail right back down.'], () => g.missions.start('sails'));
  else if (st === 'active') { const n = BW16.state.sails.filter(s => s.done).length; g.say(a, [`${n} of 3 up! Pull, sailor! Faster than the wind!`]); }
  else g.say(a, ['Finest shade on the playa. I\'d salute but my arms are noodles.']);
};
BW16.talkLuz = function (g, a) {
  const st = g.missions.state('lanterns');
  if (st === 'locked') g.say(a, ['Even on my night off, I can\'t resist a lantern.', 'But the Wave needs all its ribs before it can hold any. Help Wolfie with the bamboo first.']);
  else if (st === 'available') g.say(a, ['Even on my night off, I can\'t resist a lantern.', 'Take this string. Climb the Wave\'s back on the bamboo mats, walk the crest, and hang one on every glowing hook. Six in all.'], () => g.missions.start('lanterns'));
  else if (st === 'active') g.say(a, ['Up the mats, along the crest. Every lantern is somebody\'s way home.']);
  else g.say(a, ['There. Now everybody can find their way to the floor tonight.']);
};
BW16.talkLimbo = function (g, a) {
  const S = BW16.state, P = S.poles[2];
  if (g.missions.state('haul') === 'active' && !P.taken && !P.delivered) {
    if (S.carry !== null) { g.say(a, ['One pole at a time, bud. You\'ve already got one.']); return; }
    g.say(a, ['LIMBO! How low can you— oh. You need the pole? For the WAVE?', 'Fine. Limbo is cancelled. Our chakras will never be this low again.'], () => BW16.grabPole(g, 2));
    return;
  }
  g.say(a, P.delivered ? ['We switched to interpretive limbo. No pole. Just vibes.'] : ['LIMBO! How low can your chakras go?']);
};
BW16.talkBamBam = function (g, a) {
  const M = g.missions;
  if (BurnsSave.get().worldDone[16]) { g.say(a, ['CHAMP! You came back! Did you take half this time? ...I\'m kidding. Don\'t.']); return; }
  if (M.isDone('contest')) { g.say(a, ['I said HALF, champ. HALF.', 'Ground scores on the floor go in your backpack. Uncle Barter trades for \'em. Use \'em wisely. Or don\'t. I\'m a caveman, not a cop.', 'Pro tip: Party Powder makes you jump like a caveman. Stand under the Sky Hammock and jump straight up. Twice.']); return; }
  g.say(a, ['BAM! BAM! Welcome to the cave, little buddy!', 'The club is foam. The love is real. I\'m judging the contest tonight. I give everybody a BAM out of ten.', 'The Sky Hammock? No ladder. You gotta jump REAL high to get up there. Cavemen have their ways.']);
};
BW16.talkDoug = function (g, a) {
  const M = g.missions;
  if (M.isDone('guard')) { g.say(a, ['Bounce freely, beautiful friend. I\'m filing the waiver under "love".']); return; }
  const have = g.pack && g.pack.has('molly');
  g.say(a, ['No bouncing without a signed waiver. Waivers are closed. Forever.', 'I haven\'t smiled since 2011. I\'m not about to start for a guy with spirals in his eyes.',
    have ? '...Is that a Love Bomb in your backpack? Don\'t you DARE open your backpack and use it. Don\'t you dare.' : 'Uncle Barter back there trades for anything. Not that it matters. NOTHING gets past Doug.']);
};

/* ---------------- story beats ---------------- */
BW16.intro = function (g) {
  const S = BW16.state, p = g.player, Ar = BW16.ARCH, F = BW16.F, w = g.actor('wolfie');
  p.teleport(0, 0, Ar.z - 14, 0); g.camYaw = 0;
  if (w) BW16.place(w, Ar.x + 1.4, Ar.z + 6, Math.PI, 'idle');
  const two = { x: Ar.x - 3.2, y: 2.1, z: Ar.z - 4.5, tx: Ar.x + 0.6, ty: 1.6, tz: Ar.z + 0.4, fov: 0.75 };
  g.cutscene([
    { music: BW16.track('burns_w16', 'burns_w3') },
    { title: true, wait: false },
    { crane: { from: { x: 26, y: 24, z: Ar.z - 50, tx: F.x, ty: 6, tz: F.z, fov: 0.9 }, to: { x: 9, y: 4.5, z: Ar.z - 16, tx: F.x, ty: 5, tz: F.z, fov: 0.8 }, dur: 5.5 } },
    { say: ['brady', ['Four-thirty. FOUR. THIRTY. I have walked every street in this city looking for 4:30.', '...and there\'s the bass. Boom. Tss. BAMBOO.']] },
    { do: g2 => { if (w) BW16.walkTo(w, Ar.x + 0.8, Ar.z - 1.5, Math.PI, 'idle'); p.teleport(Ar.x - 0.6, 0, Ar.z - 4.5, 0); } },
    { cam: two },
    { until: (g2, c) => !w || !w.data.goto || c.t > 3 },
    { say: [w || 'wolfie', ['AWOOOO! You found us, man. At four-thirty.', 'Everybody looks for 4:30 the STREET. It\'s 4:30 the TIME. Welcome to Rhythm Wave.']] },
    { say: ['brady', ['I don\'t have a camp. I had a tent for one night. The guy... smelled my feet.']] },
    { say: [w || 'wolfie', ['Kevin? Yeah. Everybody knows Kevin.', 'Here\'s the deal, my dude. Help us finish the camp before sundown...', '...then win tonight\'s Yoga Yoni Tantra Enlightenment Dance Contest. Do both, and the Hammock of Honor is yours.']] },
    { say: ['brady', ['The Yoga... what?']] },
    { say: [w || 'wolfie', ['Don\'t think about the name. Nobody knows who named it.', 'Start with the bamboo. Talk to me when you\'re ready. AWOOO!']] },
    { orbit: { x: F.x, y: 0, z: F.z - 8, r0: 30, r1: 24, h0: 9, h1: 13, a0: Math.PI + 0.9, a1: Math.PI - 0.5, ty: 4, dur: 4.2, fov: 0.85 } },
    { do: g2 => { BurnsSave.flag(16, 'intro', true); p.teleport(Ar.x - 0.6, 0, Ar.z + 3, 0); g2.camYaw = 0; g2.snapCam = true; if (w) BW16.place(w, Ar.x + 1.6, Ar.z + 7.5, Math.PI, 'idle'); } }
  ], g2 => { BW16.after(g2, 2.5, g3 => g3.banner('RHYTHM WAVE', 'Build the camp before sundown. Then win the contest.', { col: '#ffd36a' })); });
};
BW16.floorAlive = function (g) {
  const S = BW16.state, F = BW16.F, w = g.actor('wolfie');
  if (S.alive) return; S.alive = true;
  g.setTod(0.62, 0.12);
  const lo = { x: F.x + 2, y: F.h + 1.2, z: F.z + 12, tx: F.x, ty: F.h + 2.5, tz: F.z - 4, fov: 0.8 };
  const hi = { x: F.x + 18, y: 15, z: F.z + 22, tx: F.x, ty: 3, tz: F.z - 4, fov: 0.85 };
  g.cutscene([
    { swell: BW16.track('burns_w16', 'burns_w3') },
    { do: g2 => { if (w) BW16.place(w, F.x - 3.0, F.z + 7.6, Math.PI, 'idle'); } },
    { crane: { from: lo, to: hi, dur: 4.5 } },
    { do: g2 => { S.aliveK = Math.max(S.aliveK, 0.3); for (const a of g2.actors) if (a.def.bw16Crowd) BW16.stage(a, 'dance', { style: a.def.style || 0, bpm: BW16.BPM }); const gu = g2.actor('guru'); if (gu) BW16.stage(gu, 'dj', { bpm: BW16.BPM }); g2.fx.confetti(F.x, F.h + 3, F.z, 60); burnsSfx('crowd_cheer'); } },
    { flash: '#ffd36a' },
    { say: [w || 'wolfie', ['RHYTHM WAVE... IS... OPEN! AWOOOOO!', 'Look at her, man. Lashed, shaded and glowing. You did that.']] },
    { orbit: { x: F.x, y: 0, z: F.z, r0: 16, r1: 13, h0: 4, h1: 6, a0: 0.3, a1: 1.6, ty: 1.5, dur: 4.5, fov: 0.85 } },
    { say: [w || 'wolfie', ['The contest starts whenever you\'re ready. Come talk to me.']] }
  ], g2 => { g2.banner('THE FLOOR IS ALIVE', 'Talk to Wolfie to enter the dance contest.', { col: '#ffd36a' }); g2.missions.track('contest'); });
};
BW16.takeBike = function (g) {
  const S = BW16.state;
  if (g.missions.state('bike') !== 'active') return;
  S.treeBike.visible = false;
  g.fx.confetti(BW16.TREE.x, 5, BW16.TREE.z, 30); burnsSfx('bike_bell');
  g.giveItem('bike');
  g.player.say('A YELLOW BIKE! It\'s... breathing? No. That\'s me.', 2);
  g.missions.complete('bike');
};
BW16.arrive = function (g) {
  const S = BW16.state, G = BW16.GROVE, gate = BW16.GATE, d = g.actor('doug'), p = g.player;
  const two = { x: gate.x - 4.6, y: 2.4, z: gate.z - 9.5, tx: gate.x + 0.6, ty: 1.6, tz: gate.z - 2.4, fov: 0.8 };
  g.cutscene([
    { slowmo: 0.45, dur: 1.6 },
    { orbit: { x: G.x, y: 0, z: G.z, r0: 44, r1: 32, h0: 7, h1: 18, a0: Math.PI + 0.7, a1: Math.PI - 0.3, ty: 12, dur: 5.0, fov: 0.9 } },
    { banner: ['THE GLOWSHROOM GROVE', 'They are... breathing?', { col: '#b07aff', big: true, dur: 3 }] },
    { do: g2 => { if (p.vehicle) p.vehicle.dismount(p); p.teleport(gate.x - 1.4, 0, gate.z - 7.5, 0); if (d) d.yaw = Math.PI; } },
    { cam: two },
    { say: [d || 'doug', ['WHOA. Whoa whoa whoa. Shroom Security.', 'No bouncing without a signed waiver. Waivers are closed. Forever.']] },
    { say: ['brady', ['The mushrooms said I could.']] },
    { say: [d || 'doug', ['The mushrooms don\'t make the rules, buddy. I make the rules. I have a clipboard.']] }
  ], g2 => { g2.banner('SHROOM SECURITY', g2.pack && g2.pack.has('molly') ? 'Open your BACKPACK and use a LOVE BOMB near Doug.' : 'Get a LOVE BOMB (Uncle Barter trades for them), use it, then go hug Doug.', { col: '#ff9ad8', dur: 4 }); });
};
BW16.openField = function (g, instant) {
  const S = BW16.state;
  if (S.gateCol) S.gateCol.off = true;
  for (const c of g.world.col.statics) if (c.tag === 'bw16Field') c.off = true;
  if (S.gateRope) S.gateRope.visible = false;
  if (instant) S.fieldK = 0;
  const d = g.actor('doug'); if (d) BW16.place(d, BW16.GATE.x + 3.4, BW16.GATE.z - 1.6, Math.PI, 'dance', { style: 2, bpm: BW16.BPM });
};
BW16.hugDoug = function (g) {
  const S = BW16.state, d = g.actor('doug'), p = g.player, gate = BW16.GATE; if (!d) return;
  S.hugging = true;
  const cam = { x: (p.x + d.x) / 2 + 3.2, y: 2.0, z: (p.z + d.z) / 2 - 2.6, tx: (p.x + d.x) / 2, ty: 1.3, tz: (p.z + d.z) / 2, fov: 0.75 };
  g.cutscene([
    { cam },
    { do: g2 => { p.yaw = Math.atan2(d.x - p.x, d.z - p.z); p.animOverride = 'hug'; BW16.stage(d, 'hug'); d.yaw = Math.atan2(p.x - d.x, p.z - d.z); g2.fx.hearts(d.x, d.y + 2, d.z, 18); burnsSfx('molly'); } },
    { say: [d, ['Is this... a hug?', 'I haven\'t been hugged since the fence went up.']] },
    { do: g2 => { g2.fx.hearts(d.x, d.y + 2, d.z, 24); } },
    { say: [d, ['You know what? Bounce. Bounce, my beautiful friend.', 'VIBE FIELD: OFF. Waiver: approved. Feelings: ENORMOUS.']] },
    { do: g2 => { p.animOverride = null; BW16.openField(g2, false); g2.missions.complete('guard', { x: gate.x - 1.5, y: 1.4, z: gate.z - 3.5 }); S.hugging = false; } }
  ], g2 => { g2.banner('THE VIBE FIELD IS OFF', 'Hop off the bike and bounce up the caps to the Elder Shroom!', { col: '#b07aff' }); });
};
BW16.ending = function (g) {
  const S = BW16.state, G = BW16.GROVE, p = g.player;
  const top = S.grove && S.grove.summit ? S.grove.summit : { x: G.x, y: 24, z: G.z };
  const w = g.actor('wolfie'), b = g.actor('bambam');
  if (w) BW16.place(w, G.x - 3.2, BW16.GATE.z + 4, Math.PI, 'idle');
  if (b) BW16.place(b, G.x + 2.6, BW16.GATE.z + 4.6, Math.PI, 'bw16Bonk');
  g.cutscene([
    { do: g2 => { p.locked = true; p.animOverride = 'sit'; } },
    { orbit: { x: top.x, y: top.y, z: top.z, r0: 9, r1: 6, h0: 3, h1: 1.5, a0: 0.4, a1: 1.9, ty: 0.8, dur: 5, fov: 0.8 } },
    { say: ['brady', ['The mushrooms are humming. In D minor. I think the wonk is wearing off.']] },
    { do: g2 => { BW16.wonkOff(g2); burnsMusic(BW16.track('burns_w16', 'burns_w3')); } },
    { cam: { x: G.x, y: 5, z: BW16.GATE.z - 2, tx: G.x, ty: 6, tz: G.z, fov: 0.85 } },
    { say: [w || 'wolfie', ['BRADY! You won the contest, rode a bike sideways for a mile and climbed a giant mushroom.', 'That\'s a full Monday, my dude. AWOOO!']] },
    { say: [b || 'bambam', ['I said HALF.']] },
    { cam: { x: top.x + 3, y: top.y + 1.6, z: top.z - 3.5, tx: top.x, ty: top.y + 0.8, tz: top.z, fov: 0.75 } },
    { say: ['brady', ['...was that half?']] },
    { cam: { x: G.x, y: 5, z: BW16.GATE.z - 2, tx: G.x, ty: 6, tz: G.z, fov: 0.85 } },
    { say: [w || 'wolfie', ['Listen. Rhythm Wave is full. Forty cousins in one tent. But you need a real home for the week.', 'Go find Root Society. Jefr collects strays. Tipis, tea and terrible puns.']] },
    { say: ['brady', ['Root Society. Tipis. Got it.', '...And I\'m keeping the bike.']] },
    { say: [b || 'bambam', ['It\'s a community bike, champ. It\'s yours until somebody steals it.']] },
    { do: g2 => { p.locked = false; p.animOverride = null; p.victoryT = 3; burnsSfx('crowd_cheer'); g2.fx.confetti(p.x, p.y + 2, p.z, 60); } },
    { wait: 1.2 }
  ], g2 => g2.finishWorld());
};

// test access (the bundle is one IIFE)
try { window.BRADY_BURNS_W16 = BW16; } catch (e) { /* no window */ }
