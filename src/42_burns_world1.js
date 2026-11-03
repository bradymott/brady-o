/* ============================================================
   BRADY GOES TO BURNING MAN — World 1: THE LINE (Gate Road) · Sunday, arrival
   Dusk into night. A miles-long line of RVs crawls toward the gate. First-timers Brady and
   Chinka hitched a ride on the roof of the Red Light District camp's pink RV. Brady has no
   ticket (Chinka had both), and the Man just stole Chinka.
   Missions (Burn Tokens):
     ticket    Golden Ticket       chase a blown-away ticket across moving RV roofs
     zipties   Zip-Tie Crisis      collect 8 bundles for a melting-down camp lead
     drivers   Wake the Line       wake four dozing 6-day drivers holding up lane 2
     greeters  Greeter Gauntlet    three greeter sub-bosses
     stack     Top of the Stack    hidden: climb Camp Overkill's vehicle tower
     boss      The Man at the Gate boss fight (needs the ticket + the greeting)
   This file is also the worked example in docs/BURNS_GUIDE.md.
   ============================================================ */

const BURNS_W1 = {
  LANES: [-10.5, -3.5, 3.5, 10.5],
  FRONT: -207, BACK: 430, GATE_Z: -240,
  ARENA: { x: 0, z: -278, r: 34 }, MAN: { x: 0, z: -306 },
  CAR: { x: 19.5, z: 300 },
  state: null
};

BurnsWorlds.register({
  id: 1, name: 'The Line', sub: 'Gate Road',
  sky: 'dusk', sky2: 'night', tod: 0,
  music: 'burns_w1',
  dayCard: false,   // the intro shows the day card itself (onStart shows it on return visits)
  bounds: [-118, -318, 118, 340],
  spawn: { x: 17.2, y: 0, z: 296, yaw: Math.PI },
  // flat playa inside the corridor; soft rolling dunes rise outside the bounds and settle again before the horizon skirt
  ground: { base: '#c9a07c', crack: 0.26, mottle: 0.4, res: 0.5, height(x, z) {
    const dx = Math.max(-118 - x, 0, x - 118), dz = Math.max(-318 - z, 0, z - 340), d = Math.hypot(dx, dz);
    if (d <= 0) return 0;
    const t = Math.min(1, d / 58), k = Math.pow(Math.sin(t * Math.PI), 1.4);
    return k * (2.2 + 1.3 * Math.sin(x * 0.061 + z * 0.043) * Math.cos(z * 0.052 - x * 0.029) + 0.5 * Math.sin(x * 0.17 - z * 0.11));
  } },
  dust: 1.2,
  missions: [
    { id: 'ticket', name: 'Golden Ticket', short: 'Catch the ticket on the RV roofs', type: 'find', giver: 'lucky', start: 'manual', marker: { x: 16, z: 72 },
      desc: 'Lucky has a spare ticket. Then the wind has opinions.', hint: 'Pre-Gate Party, east shoulder (Lucky on the couch)',
      onComplete(g) { g.giveItem('ticket'); g.setTod(Math.max(g.tod, 0.35), 0.05); const lk = g.actor('lucky'); if (lk) lk.say('Told ya. LUCKY.', 2.5); } },
    { id: 'zipties', name: 'Zip-Tie Crisis', type: 'collect', count: 8, giver: 'dex', start: 'manual', progressLabel: 'Zip ties', short: 'Find zip-tie bundles', marker: { x: -30, z: 228 },
      desc: 'Camp lead Dex needs 8 zip-tie bundles. Other camp leads are yelling. Jump the yelling.', hint: 'Zip & Zen camp, west of the back of the line',
      onComplete(g) { const d = g.actor('dex'); if (d) d.say('A HERO! A sweaty, dusty hero!', 3); g.setTod(Math.max(g.tod, g.tod + 0.18), 0.05); } },
    { id: 'drivers', name: 'Wake the Line', type: 'custom', count: 4, giver: 'gus', start: 'manual', progressLabel: 'Drivers awake', short: 'Wake the 6-day drivers', marker: { x: -7, z: 195 },
      desc: 'Lane two is stuck behind four snoozing 6-day drivers. Talk, spin or stomp them awake.', hint: 'Lane two, between the back of the line and the party',
      onComplete(g) { const d = g.actor('gus'); if (d) d.say("We're MOVING! Point two miles an hour, baby!", 3); g.setTod(Math.max(g.tod, g.tod + 0.18), 0.05); } },
    { id: 'greeters', name: 'Greeter Gauntlet', type: 'custom', giver: 'dusty', start: 'manual', short: 'Survive the greeters', marker: { x: -40, z: -152 },
      desc: 'Survive Mama Dusty\'s three most intense greeters to be officially welcomed.', hint: 'Greeter Station, west side near the gate',
      onComplete(g) { g.giveItem('www'); g.setTod(Math.max(g.tod, 0.75), 0.05); } },
    { id: 'stack', name: 'Top of the Stack', type: 'climb', giver: 'dare', start: 'manual', secret: true, silent: false, short: 'Climb to the top of the junk-car tower', target: { x: -64, z: 31, r: 2.4, y: 9.5 }, tokenAt: { x: -64, y: 11.5, z: 31 },
      desc: 'Camp Overkill stacked eight junk cars into a tower. For art. Danny dares you to climb it.', hint: 'Camp Overkill, far west of the Pre-Gate Party' },
    { id: 'boss', name: 'The Man at the Gate', type: 'boss', start: 'manual', requires: ['ticket', 'greeters'], tokenDirect: true, short: 'Defeat the Man!', marker: { x: 0, z: -290 },
      desc: 'He\'s blocking the gate. With your wife. Take cover from his neon flash.', hint: 'Through the gate', lockedDesc: 'Needs a ticket and a proper greeting.' }
  ],
  build(api, g) {
    const W1 = BURNS_W1, R = api.rng, L = W1.LANES;
    W1.state = { gust: 0, ticket: null, gateOpen: false, round: 0, introDone: !!BurnsSave.flag(1, 'intro') };
    const S = W1.state;
    /* ---------------- ground ---------------- */
    api.paint((c, P, sc) => {
      // tyre-rutted gate road
      const [x0, z0] = P(-16, W1.BACK), [x1, z1] = P(16, W1.FRONT - 4);
      const gr = c.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, 'rgba(150,110,85,0)'); gr.addColorStop(0.08, 'rgba(150,110,85,0.55)'); gr.addColorStop(0.92, 'rgba(150,110,85,0.55)'); gr.addColorStop(1, 'rgba(150,110,85,0)');
      c.fillStyle = gr; c.fillRect(x0, z1, x1 - x0, z0 - z1);
      c.strokeStyle = 'rgba(95,68,52,0.35)'; c.lineWidth = 0.45 * sc;
      for (const lx of L) for (const o of [-0.85, 0.85]) { const [a, b] = P(lx + o, W1.BACK), [, d] = P(lx + o, W1.FRONT); c.beginPath(); c.moveTo(a, b); c.lineTo(a, d); c.stroke(); }
      // blotchy patches + random tracks across the playa
      for (let i = 0; i < 160; i++) { const x = R.range(-118, 118), z = R.range(-318, 340), [px, pz] = P(x, z), r = R.range(2, 9) * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; g2.addColorStop(0, dark ? 'rgba(120,85,65,0.25)' : 'rgba(235,205,170,0.25)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      c.strokeStyle = 'rgba(110,80,62,0.2)'; c.lineWidth = 0.3 * sc;
      for (let i = 0; i < 26; i++) { const [ax, az] = P(R.range(-118, 118), R.range(-318, 340)), ang = R() * TAU, len = R.range(30, 120) * sc; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.4) * len * 0.5, az + Math.sin(ang + 0.4) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
      // arena: a dark disc with a dusty ring
      const [ax2, az2] = P(W1.ARENA.x, W1.ARENA.z), rr2 = W1.ARENA.r * sc;
      const ga = c.createRadialGradient(ax2, az2, rr2 * 0.2, ax2, az2, rr2 * 1.05); ga.addColorStop(0, 'rgba(90,60,70,0.55)'); ga.addColorStop(0.92, 'rgba(110,70,80,0.5)'); ga.addColorStop(1, 'rgba(110,70,80,0)'); c.fillStyle = ga; c.beginPath(); c.arc(ax2, az2, rr2 * 1.05, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,120,200,0.35)'; c.lineWidth = 1.2 * sc; c.beginPath(); c.arc(ax2, az2, rr2 * 0.97, 0, TAU); c.stroke();
      // greeter station "roll in the dust" patch
      const [gx, gz] = P(-40, -152), gg = c.createRadialGradient(gx, gz, 0, gx, gz, 11 * sc); gg.addColorStop(0, 'rgba(240,215,185,0.7)'); gg.addColorStop(1, 'rgba(240,215,185,0)'); c.fillStyle = gg; c.fillRect(gx - 11 * sc, gz - 11 * sc, 22 * sc, 22 * sc);
    });
    /* ---------------- the line: four lanes of crawling vehicles ---------------- */
    const ticketKinds = ['rv', 'boxtruck', 'rv', 'bus', 'rv', 'trailer', 'boxtruck', 'rv', 'van'];
    const T = api.traffic({ seed: 11, lanes: [
      { id: 'L1', points: [[L[0], W1.BACK], [L[0], W1.FRONT]], vehicles: 58, gap: [1.6, 3.6], speed: 0.7, waveRate: 0.31 },
      { id: 'L2', points: [[L[1], W1.BACK], [L[1], W1.FRONT]], vehicles: 58, gap: [1.5, 3.2], speed: 0.8, waveRate: 0.27 },
      { id: 'L3', points: [[L[2], W1.BACK], [L[2], W1.FRONT]], vehicles: 58, gap: [1.6, 3.8], speed: 0.75, waveRate: 0.36 },
      { id: 'L4', points: [[L[3], W1.BACK], [L[3], W1.FRONT]], vehicles: 52, gap: [1.8, 3.0], speed: 0.9, waveRate: 0.3, kindAt: i => ticketKinds[i % ticketKinds.length] }
    ] });
    S.traffic = T;
    // the stalled cars in lane 2 (their drivers dozed off)
    const lane2 = T.lanes[1];
    S.sleepers = [];
    const driversDone = BurnsSave.hasToken(1, 'drivers');
    if (!driversDone) for (const z of [168, 190, 214, 238]) {
      let best = null, bd = 1e9;
      for (const c of lane2.cars) { const d = Math.abs(c.mv.z - z); if (d < bd && !c.sleep) { bd = d; best = c; } }
      best.sleep = true; S.sleepers.push(best);
    }
    /* ---------------- gate road furniture ---------------- */
    for (let z = 300; z > W1.FRONT + 10; z -= 70) {
      const side = (Math.round(z / 70) % 2) ? 1 : -1;
      api.prop('lightTower', { x: side * 18.5, z, yaw: side > 0 ? -Math.PI / 2 : Math.PI / 2, aim: 0 });
    }
    for (let z = 320; z > W1.FRONT + 20; z -= 34) for (const x of [-7, 0, 7]) if (R() < 0.6) api.prop('cone', { x: x + R.range(-0.4, 0.4), z: z + R.range(-4, 4) });
    for (let z = 330; z > W1.FRONT + 40; z -= 46) for (const sx of [-1, 1]) api.prop('pennants', { x: 0, z: 0, x0: sx * 15, y0: 4.6, z0: z, x1: sx * 15, y1: 4.6, z1: z - 46, n: 44, sag: 0.7, drop: 0.3 });
    for (let z = 330; z > W1.FRONT + 40; z -= 46) for (const sx of [-1, 1]) api.box(sx * 15, 0, z, 0.12, 4.7, 0.12, '#6a6a72', { col: { camPass: true, walk: false } });
    // humorous road signs on the shoulders
    const signs = [
      ['GATE ROAD\n← 6 HOURS', -16.5, 318], ['SLOW\n10 MPH', 16.5, 262], ['HYDRATE OR\nDIE-DRATE', -16.5, 196], ['IF YOU CAN READ THIS\nYOU ARE IN LINE', 16.5, 150],
      ['ARE WE THERE YET?\nNO.', -16.5, 40], ['NO SPECTATORS', 16.5, -20], ['6 DAYS DRIVING\n6 HOURS OF LINE\nWORTH IT', -16.5, -90], ['GREETERS\nAHEAD ←', -16.5, -118], ['WELCOME HOME\n↑ GATE ↑', 16.5, -180]
    ];
    for (const [t, x, z] of signs) api.sign(t, x, z, { yaw: x < 0 ? Math.PI / 2 : -Math.PI / 2, h: t.split('\n').length > 2 ? 1.5 : 1.1, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 40, border: '#3a1a10' } });
    // trash fence along the far edges + the gate line
    for (let z = 330; z > -236; z -= 20) { api.prop('fence', { x: -112, z, yaw: Math.PI / 2, len: 20 }); api.prop('fence', { x: 112, z, yaw: Math.PI / 2, len: 20 }); }
    for (let x = -110; x < -18; x += 20) api.prop('fence', { x: x + 10, z: W1.GATE_Z, len: 20 });
    for (let x = 18; x < 110; x += 20) api.prop('fence', { x: x + 10, z: W1.GATE_Z, len: 20 });
    api.collider({ t: 'box', x: -65, z: W1.GATE_Z, hx: 47, hz: 0.3, y0: 0, y1: 1.3, walk: false });
    api.collider({ t: 'box', x: 65, z: W1.GATE_Z, hx: 47, hz: 0.3, y0: 0, y1: 1.3, walk: false });
    /* ---------------- roadside camps ---------------- */
    const camp = (x, z, side, seed, o) => {
      o = o || {};
      const r = mulberry32(seed);
      const yaw = side > 0 ? Math.PI : 0;
      const v = api.prop(o.vehicle || r.pick(['rv', 'van', 'camper', 'rv', 'boxtruck']), { x, z, yaw: yaw + r.range(-0.2, 0.2), seed });
      api.prop('shade', { x: x - side * 6, z: z + r.range(-2, 2), w: 5 + r() * 2, d: 5, col: r.pick(['#d8c8a8', '#c8b8e8', '#e8c8a8', '#a8d8c8']) });
      api.prop('couch', { x: x - side * 6, z: z - 1.5, yaw: side > 0 ? Math.PI / 2 : -Math.PI / 2, col: r.pick(['#8a2a5a', '#2a5a8a', '#6a4a2a', '#5a2a8a']) });
      for (let i = 0; i < 3; i++) api.prop('chair', { x: x - side * (5 + r() * 3), z: z + 2 + r() * 2, yaw: r() * TAU, col: r.pick(BURNS_NEON) });
      api.prop('cooler', { x: x - side * 4, z: z + 3.5, yaw: r() * 3, col: r.pick(['#2a8ac8', '#c83a2a', '#e8e8e8']) });
      if (o.barrel !== false) api.prop('barrel', { x: x - side * 9, z: z + 3 });
      if (o.dome) api.prop('dome', { x: x - side * 16, z: z + 2, r: 5, col: r.pick(['#e8e0d0', '#d8c0e8']), lights: true });
      if (o.crowd !== false) api.crowd(x - side * 6.5, z + 1, 3.2, o.n || 3, { behaviors: ['dance', 'idle', 'dance', 'sit'] });
      return v;
    };
    camp(32, 306, 1, 101, { n: 4 });
    camp(-30, 290, -1, 102, { vehicle: 'trailer' });
    camp(30, 236, 1, 103, { dome: true });
    camp(-34, 160, -1, 104);
    camp(31, 160, 1, 105, { vehicle: 'boxtruck' });
    camp(30, 30, 1, 106, { vehicle: 'van', n: 2 });
    camp(-30, -40, -1, 107, { dome: true });
    camp(32, -60, 1, 108, { vehicle: 'rv' });
    camp(-34, -95, -1, 109, { vehicle: 'camper' });
    camp(30, -150, 1, 110, { vehicle: 'trailer' });
    // people dancing on top of parked RVs
    const roofParty = (x, z, seed) => { const v = api.prop('rv', { x, z, yaw: 0.1, seed }); for (let i = 0; i < 2; i++) api.npc({ type: R.pick(['burner', 'tutu', 'furcoat', 'ledsuit']), seed: seed * 10 + i, x: x + (i - 0.5) * 0.9, z: z - 1 + i * 1.6, y: v.top, fixedY: true, behavior: 'dance', style: i * 2 }); };
    roofParty(-24, 252, 201); roofParty(24, 112, 202); roofParty(-26, -10, 203);
    /* ---------------- start: the Red Light District's pink RV at the back of the line ----------------
       Brady and Chinka rode six hundred miles on its roof deck; the burlesque crew hangs out beside it. */
    S.redLight = api.redLightCamp(W1.CAR.x, W1.CAR.z, Math.PI, {
      spots: [[3.9, 7.5], [5.3, 5.0], [3.1, 10.2], [5.9, 9.0], [4.5, 2.2]],
      lines: {
        rlVelvet: ['Sugar, he took your wife AND your ticket? Oh, this is SUCH a Sunday.', 'Lucky, up at the pre-gate party, always has a spare. Go on. Mama will watch the RV.'],
        rlCandi: ['First Burn, cutie? Rule one: hydrate. Rule two: glitter. Rule three: get your girl back.', 'Here, take some sparkle for the road.'],
        rlRoxie: ['If that big wooden creep comes back, he answers to the corset.', 'The greeters at the gate are INTENSE. Hug back harder.']
      },
      gifts: { rlCandi: { kind: 'glowstick', n: 10 } }
    });
    api.checkpoint('cp_start', 23, 289, { yaw: Math.PI, name: 'Back of the Line' });
    api.npc({ id: 'sunny', name: 'SUNNY', type: 'tutu', seed: 5, x: 11.2, z: 285.6, yaw: 0.4,
      lines: [
        'Whoa. Did a giant wooden guy just steal your wife? Classic first night.',
        'Burner basics: JUMP twice to flip. SPIN to say hi to rude people. In the air, hit ACTION to slam down.',
        'Those water drops up top? Your hydration. Water bottles refill it. Hydrate or die-drate!',
        'No ticket? Lucky always has a spare. He\'s at the pre-gate party up the line, on a couch.'
      ], gift: { kind: 'glowstick', n: 10 } });
    api.npc({ id: 'chinkaIntro', type: 'chinka', x: W1.CAR.x - 0.36, z: W1.CAR.z + 2.4, y: 3.36, fixedY: true, yaw: 0.3, behavior: 'sit', noTalk: true, chatter: false });
    api.pickup('water', 13.5, 0.9, 282);
    api.glowLine(14.5, 286, 14.5, 236, 11);
    api.glowArc(19.5, 1.6, 270, 19.5, 1.6, 250, 3.2, 6);
    /* ---------------- Zip & Zen camp (zip-tie mission) ---------------- */
    api.prop('shade', { x: -34, z: 236, w: 7, d: 6, col: '#c8b8e8' });
    api.prop('shade', { x: -44, z: 232, w: 6, d: 5, h: 2.4, col: '#e8c8a8', lights: false });
    api.box(-46, 0, 244, 3, 1.4, 2, '#7a5a3a', { bevel: 0.1 });
    api.sign('ZIP & ZEN\nTHEME CAMP', -28, 246, { yaw: Math.PI / 2, h: 1.2, style: { bg: '#2a0a2a', fg: '#ff9ad8', glow: '#ff4fd8', size: 40, border: '#ff4fd8' }, glow: '#ff4fd8' });
    api.npc({ id: 'dex', name: 'DEX, CAMP LEAD', type: 'campLead', seed: 3, x: -30, z: 228, yaw: Math.PI / 2,
      talk(g, a) {
        const st = g.missions.state('zipties');
        if (st === 'available') g.say(a, ['Do you know what holds a theme camp together? ZIP TIES. Do you know what we have? NONE.', 'Find me eight bundles. They blew all over the line. The other camp leads are also stressed. They yell. Jump over the yelling.'], () => g.missions.start('zipties'));
        else if (st === 'active') g.say(a, [`${g.missions.get('zipties').n} of 8. EIGHT. I am breathing. I am calm. I AM CALM.`]);
        else g.say(a, ['Our shade is UP. It\'s crooked, but it\'s UP. You\'re a legend.']);
      } });
    const zip = [[-34, 0.9, 236.5], [-47, 0.9, 205], [-25, 0.9, 168], [-7, 0.9, 190], [-40, 4.3, 186], [7, 0.9, 230], [26, 3.9, 236], [-58, 0.9, 252]];
    api.prop('rv', { x: -40, z: 186, yaw: -0.15, seed: 31 });
    zip.forEach((p, i) => api.pickup('item:ziptie', p[0], p[1], p[2], { mission: 'zipties', gate: true, label: 'ZIP TIES', icon: 'ziptie', id: 'zip' + i }));
    for (const [x, z, s] of [[-44, 214, 1], [-22, 176, 2], [24, 196, 3], [0, 243, 4]]) api.enemy({ type: 'campLead', seed: 40 + s, x, z, behavior: 'shouter', hp: 2, tag: 'campLead', aggro: 11 });
    api.pickup('bag:liquor', -38, 0.9, 252);
    api.pickup('water', -30, 0.9, 150);
    /* ---------------- Wake the Line ---------------- */
    const wakeLines = ['WHA— I\'m awake! I\'ve been driving for six days!', 'Who— what day is it? Is this Nevada?', 'I can see sounds. Okay. Driving now.', 'COFFEE! No. Driving. DRIVING!'];
    S.sleepers.forEach((car, i) => {
      api.prop('chair', { x: L[1] - 2.6, z: car.mv.z + 1.2, yaw: Math.PI / 2, col: '#3a6a8a' });
      api.npc({ id: 'sleeper' + i, type: 'driver', seed: 70 + i, x: L[1] - 2.6, z: car.mv.z + 1.2, yaw: -Math.PI / 2, behavior: 'sleep', chatter: false, name: '6-DAY DRIVER',
        marker: (g, a) => g.missions.state('drivers') === 'active' && a.behName === 'sleep' ? '?' : null,
        onWake(g, a) {
          if (g.missions.state('drivers') !== 'active') { a.say('Zzz... five more... states...', 1.6); return; }
          if (a.data.woke) return; a.data.woke = true;
          a.setBehavior('idle'); a.ch.play('cheer'); a.say(wakeLines[i], 2.2); burnsSfx('artcarHorn', { pitch: 1.4, vol: 0.5 });
          g.fx.burst(a.x, a.y + 2, a.z, 'star', 10, '#ffe24a');
          const m = g.missions.get('drivers'); m.n++;
          g.toast(`Drivers awake: ${m.n}/4`);
          burnsW1Timer(g, 1.6, () => { car.sleep = false; g.fx.dust(a.x, a.y, a.z, 8); g.removeActor(a); });
          if (m.n >= 4) g.missions.complete('drivers', { x: a.x, y: a.y + 1.4, z: a.z + 1.5 });
        } });
    });
    const gz = S.sleepers.length ? Math.max(...S.sleepers.map(c => c.mv.z)) + 16 : 254;
    api.npc({ id: 'gus', name: 'GUS', type: 'crusty', seed: 9, x: -7, z: gz, yaw: Math.PI,
      talk(g, a) {
        const st = g.missions.state('drivers');
        if (st === 'available') g.say(a, ['Lane two hasn\'t moved since Tuesday. The six-day drivers up front fell asleep at the wheel.', 'Wake \'em up! Talk to \'em, spin \'em, whatever. Just keep \'em away from the coffee.'], () => g.missions.start('drivers'));
        else if (st === 'active') g.say(a, ['Still parked. I\'ve aged a year. Wake. Them. Up.']);
        else g.say(a, ['We\'re moving! I can feel the wind in my... beard. It\'s dust. It\'s fine.']);
      } });
    /* ---------------- Pre-Gate Party (plaza) ---------------- */
    api.prop('dome', { x: -36, z: 96, r: 8, col: '#e8d8f8', alt: '#b8a8d8', lights: true, glow: '#ff4fd8' });
    for (const [x, z] of [[-27.5, 92], [-27.5, 100]]) { api.box(x, 0, z, 1.6, 2.6, 1.6, '#1a1a22', { bevel: 0.08 }); api.glow(x, 2.2, z + 0.85, 0.8, '#ff4fd8', { blink: 6 }); }
    api.sign('PRE-GATE\nPARTY', -27, 108, { yaw: Math.PI / 2, h: 1.3, style: { bg: '#1a0a2a', fg: '#ffe24a', glow: '#ff9a2a', size: 44, border: '#ffe24a' }, glow: '#ffe24a' });
    api.crowd(-30, 84, 7, 14, { behaviors: ['dance'] });
    api.light(-34, 88, 18, '#ff6ad0', 0.5);
    api.prop('shade', { x: -18, z: 70, w: 8, d: 6, col: '#a8d8c8' });
    api.prop('couch', { x: -18, z: 68, yaw: 0, col: '#5a2a8a' }); api.prop('couch', { x: -21, z: 72, yaw: Math.PI / 2, col: '#8a2a5a' });
    api.prop('scaffold', { x: -12, z: 50, levels: 5, lh: 2.0, w: 3, d: 3 });
    api.pickup('bag:bufo', -12, 11.0, 50);
    api.pickup('bag:molly', -26, 0.9, 80);
    api.checkpoint('cp_plaza', -18, 104, { yaw: 0, name: 'Pre-Gate Party' });
    // fire poofer art: flame jets on a timer
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; api.flameJet(-22 + Math.sin(a) * 4, 0, 58 + Math.cos(a) * 4, { h: 4.5, period: 3.2, on: 1.1, phase: i * 0.45 }); api.box(-22 + Math.sin(a) * 4, 0, 58 + Math.cos(a) * 4, 0.5, 0.4, 0.5, '#4a4a52', { noCol: true }); }
    api.sign('FIRE POOFERS\nDON\'T TOUCH', -16, 58, { yaw: -Math.PI / 2 + 0.3, h: 1.1, style: { bg: '#2a0a0a', fg: '#ff8a2a', size: 40, border: '#ff4a1a' } });
    api.glowRing(-22, 58, 7.5, 12);
    // Lucky + the ticket
    api.prop('couch', { x: 16.5, z: 74, yaw: -Math.PI / 2, col: '#6a4a2a' });
    api.npc({ id: 'lucky', name: 'LUCKY', type: 'crusty', seed: 12, x: 16.6, z: 74, yaw: -Math.PI / 2, behavior: 'sit',
      talk(g, a) {
        const st = g.missions.state('ticket');
        if (st === 'available') g.say(a, ['A man bun AND a broken heart? Kid, today\'s your lucky day.', 'Some lady told me to gift my spare ticket to the first sad guy with a man bun. That\'s you!', 'Here you go—'], () => BURNS_W1.gust(g));
        else if (st === 'active') g.say(a, ['It\'s on the RV roofs! Jump on a hood, then up top. Go go go!']);
        else g.say(a, ['The playa giveth. The playa blow-eth away. The playa giveth back.']);
      } });
    S.ticketPick = api.pickup('item:ticket', 16, 2, 70, { mission: 'ticket', gate: true, label: 'TICKET!', icon: 'ticket', id: 'ticketItem', persist: false });
    // tech bros + influencers near the party
    api.enemy({ type: 'techbro', seed: 1, x: 26, z: 112, behavior: 'pitcher', hp: 2 });
    api.enemy({ type: 'techbro', seed: 2, x: -24, z: 18, behavior: 'pitcher', hp: 2 });
    api.enemy({ type: 'techbro', seed: 3, x: 22, z: -62, behavior: 'pitcher', hp: 2 });
    api.enemy({ type: 'influencer', seed: 1, x: -21, z: 130, behavior: 'flasher', hp: 2 });
    api.enemy({ type: 'influencer', seed: 2, x: 28, z: -118, behavior: 'flasher', hp: 2 });
    for (const [x, z, s] of [[7, 122, 1], [-7, 62, 2], [0, -40, 3], [14, -92, 4]]) api.enemy({ type: 'driver', seed: 90 + s, x, z, behavior: 'zombie', hp: 1, afterDefeat: 'sleep' });
    // the broken-down skoolie, the Playa Map in the dust, and a thief
    api.prop('bus', { x: -62, z: 120, yaw: 0.4, seed: 44, col: '#9a6bff' });
    api.pickup('item:map', -58.5, 0.8, 112.5, { label: 'PLAYA MAP' });
    api.enemy({ type: 'burner', seed: 66, x: -56, z: 110, behavior: 'thief', hp: 1, name: 'GLOW STICK THIEF', steal: 6 });
    api.npc({ type: 'sparklepony', seed: 4, x: -52, z: 126, name: 'GLITTER', lines: ['Can I borrow some water? And food? And a tent? And maybe your bike?', 'I\'m, like, SO dehydrated. Is that a thing?', 'That bus? Broke down in 2019. It lives here now.'] });
    api.pickup('photo', -36, 9.2, 96, { id: 'p1' });
    api.glowArc(-27.5, 2.8, 96, -32, 6.2, 96, 1.2, 5);
    api.pickup('water', 20, 0.9, 40);
    /* ---------------- Camp Overkill: the junk-car tower (hidden challenge) ---------------- */
    {
      const x = -64, z = 31;
      const T = api.prop('junktower', { x, z, seed: 31, levels: 8 });
      // the climb target sits on the top car (prop-local coords, no yaw)
      const tp = T.topPos || [0, T.top, 0], M = g.def.missions.find(q => q.id === 'stack');
      M.target = { x: x + tp[0], z: z + tp[2], r: 2.2, y: tp[1] - 0.5 }; M.tokenAt = { x: x + tp[0], y: tp[1] + 1.4, z: z + tp[2] };
      api.prop('trunk', { x: x + 6.5, z: z + 2.5, yaw: 0.4 });
      api.sign('CAMP OVERKILL\n"IT\'S ART"', x + 8, z - 6, { yaw: -0.6, h: 1.2, style: { bg: '#1a1a2a', fg: '#38f2ff', glow: '#38f2ff', size: 40, border: '#38f2ff' }, glow: '#38f2ff' });
      api.pickup('bag:khole', x + 2.2, 3.6, z - 1.2);
      api.npc({ id: 'dare', name: 'DANNY BAD IDEA', type: 'badideaguy', seed: 5, x: x + 5.5, z: z - 3.5, yaw: -2.2,
        talk(g, a) {
          const st = g.missions.state('stack');
          if (st === 'available') g.say(a, ['Hear me out. Eight cars. Stacked. By hand. Mostly mine.', 'I dare you to climb it. I did it last night. That\'s why the cast.', 'Hop car to car. Use the planks. Don\'t look down. Or up. Or anywhere.'], () => { g.missions.start('stack'); g.banner('HIDDEN CHALLENGE', 'Top of the Stack: climb the junk-car tower!', { col: '#38f2ff' }); });
          else if (st === 'active') g.say(a, ['Car to car! Mantle the roofs! Physics is a suggestion!']);
          else g.say(a, ['LEGEND. Next we\'re jumping an art car off a dune. Kidding. Unless...']);
        } });
      api.light(x, z, 14, '#38c8ff', 0.4);
    }
    /* ---------------- LSD-only path to a hidden photo (east, over the fence) ---------------- */
    api.pickup('bag:lsd', 52, 0.9, 2);
    api.sign('NOTHING TO SEE HERE', 58, 8, { yaw: -Math.PI / 2, h: 0.9, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 36 } });
    api.hidden(() => {
      const steps = [[63, 1.5, 4], [67, 3.0, 6], [71, 4.5, 4], [75, 6.0, 7], [79, 7.4, 5], [83.5, 8.8, 6]];
      steps.forEach(([x, y, z], i) => api.box(x, y - 0.3, z, 2.6, 0.3, 2.6, burnsHSL(i * 55, 0.9, 0.6), { e: 0.6, bevel: 0.05 }));
      api.glow(83.5, 9.5, 6, 2.5, '#ff4fd8');
    });
    api.pickup('photo', 83.5, 9.8, 6, { id: 'p3', hidden: true });
    /* ---------------- more of the line: hangouts, rangers, DPW ---------------- */
    const hang = (x, z, n, types) => api.crowd(x, z, 2.2, n, { types: types || ['burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'crusty'], behaviors: ['dance', 'idle', 'idle', 'dance', 'wander'] });
    hang(-7, 282, 3); hang(7, 270, 2); hang(0, 130, 3); hang(-7, 30, 2); hang(7, -20, 3); hang(0, -70, 2); hang(-7, -110, 3); hang(7, 180, 2);
    api.npc({ type: 'ranger', seed: 1, name: 'RANGER RICK', x: 16, z: 200, behavior: 'walk', path: [[16, 200], [16, 120], [16, 200]], speed: 1.3, lines: ['I\'m not a cop. I\'m a Ranger. Totally different hat.', 'Saw a giant wooden guy carry a lady toward the gate. Didn\'t have the paperwork for that.'], gift: { kind: 'water' } });
    api.npc({ type: 'crusty', seed: 22, name: 'OLD PETE', x: -48, z: 272, behavior: 'sit', lines: ['It was better in the old days.', 'Back then the Man was twelve feet tall and didn\'t steal anybody\'s wife.', 'Grab that baggie by my chair. Ground score. Don\'t tell anyone.'] });
    api.prop('chair', { x: -48, z: 272, yaw: Math.PI, col: '#8a6a3a' });
    api.pickup('bag:weed', -46.5, 0.9, 270);
    api.pickup('bag:powder', 34, 0.9, 150);
    api.glowLine(-7, 140, -7, 100, 8); api.glowLine(7, 20, 7, -30, 9); api.glowLine(0, -60, 0, -100, 7);
    api.glowLine(-16, 160, -16, 120, 8); api.glowLine(16, -100, 16, -140, 8);
    api.glowRing(30, 236, 5, 10); api.glowRing(-30, -40, 6, 10);
    /* ---------------- Greeter Station + Gauntlet ---------------- */
    api.prop('shade', { x: -24, z: -170, w: 12, d: 9, h: 3.2, col: '#ffd0a0' });
    api.sign('GREETER\nSTATION', -18, -160, { yaw: Math.PI / 2, h: 1.3, style: { bg: '#ff8a3a', fg: '#ffffff', size: 46, border: '#ffffff' }, glow: '#ff9a4a' });
    api.mesh(-24, -140, m => { m.color('#6a4a2a'); m.box(0, 1.5, 0, 0.2, 3, 0.2); m.box(0, 3.0, 0, 1.2, 0.15, 0.2); m.color('#ffd84a', 0.4); m.cyl(0, 2.1, 0, 0.45, 0.2, 0.7, 10, {}); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.25, y0: 0, y1: 3, camPass: true }] }; });
    api.sign('RING THE BELL\nIF IT\'S YOUR\nFIRST BURN', -22.5, -141, { yaw: Math.PI / 2, h: 1.2, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 32 } });
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; api.box(-40 + Math.sin(a) * 10.5, 0, -152 + Math.cos(a) * 10.5, 1.4, 0.7, 0.8, '#d8b060', { yaw: a, bevel: 0.08 }); }
    api.light(-40, -152, 14, '#ffd0a0', 0.45);
    api.npc({ id: 'dusty', name: 'MAMA DUSTY', type: 'greeter', seed: 7, x: -27.5, z: -147, yaw: -Math.PI / 2,
      talk(g, a) {
        const st = g.missions.state('greeters');
        if (st === 'available') g.say(a, ['Welcome hooome! Ooh, a first-timer! Nobody passes the gate without a proper greeting.', 'And our greetings are... intense. Survive my three best greeters and you\'re officially welcomed.'], () => BURNS_W1.gauntlet(g));
        else if (st === 'active') g.say(a, ['Keep going, sugar! Greeting is a contact sport!']);
        else g.say(a, ['You\'ve been GREETED. Go get your lady!']);
      } });
    for (const [x, z, s] of [[-7, -150, 1], [0, -158, 2], [7, -146, 3], [-7, -178, 4], [7, -186, 5]]) api.npc({ type: 'greeter', seed: 20 + s, x, z, behavior: 'wander', radius: 4, chat: ['Anyone hiding in the bathroom?', 'Ticket and ID, please!', 'Is that a stowaway in your cooler?', 'Welcome home!', 'First burn? Roll in the dust!'] });
    for (let i = 0; i < 3; i++) api.prop('portapotty', { x: -58, z: -158 + i * 1.35, yaw: Math.PI / 2, col: ['#2a6ac8', '#3a8a3a', '#2a6ac8'][i] });
    api.pickup('photo', -60.2, 1.1, -156.6, { id: 'p2' });
    api.pickup('bag:shrooms', -50, 0.9, -128);
    api.checkpoint('cp_greeters', -18, -128, { yaw: Math.PI, name: 'Greeter Station' });
    api.pickup('water', -20, 0.9, -100); api.pickup('water', -30, 0.9, -190);
    /* ---------------- the gate ---------------- */
    api.prop('shade', { x: 0, z: -221, w: 34, d: 28, h: 5.2, col: '#3a2a4a', lights: true });
    api.prop('gateArch', { x: 0, z: -236.5, w: 30, h: 9, text: 'WELCOME HOME' });
    api.prop('booth', { x: -19.5, z: -214, roof: '#ff4fd8' }); api.prop('booth', { x: 19.5, z: -214, roof: '#38f2ff' });
    api.npc({ id: 'moe', name: 'GATE CREW MOE', type: 'gate', seed: 1, x: -17.2, z: -221, yaw: Math.PI / 2,
      talk(g, a) {
        const hasT = g.hasItem('ticket'), gr = g.missions.isDone('greeters');
        if (BURNS_W1.state.gateOpen) { g.say(a, ['Go! Get her back! I\'ll hold your spot in the... well, you\'re through.']); return; }
        if (!hasT) g.say(a, ['Ticket and ID, please. ...No ticket? No entry. Rules are rules, even out here.']);
        else if (!gr) g.say(a, ['Ticket\'s legit! But you haven\'t been greeted. Greeter Station\'s back on the left. You\'ll know it when you get hugged.']);
        else g.say(a, ['Ticket? Check. Greeted? VERY. Welcome home, Br— uh. Why is a giant effigy blocking my gate?'], () => BURNS_W1.openGate(g));
      } });
    api.npc({ type: 'gate', seed: 2, x: 17.2, z: -221, yaw: -Math.PI / 2, chat: ['Ticket and ID!', 'Pop the trunk, please.', 'Anyone in the bathroom?'] });
    api.npc({ type: 'dpw', seed: 1, name: 'HAMMER (DPW)', x: 22, z: -200, yaw: Math.PI, lines: ['Outta the way, sparkle pony. Oh, you\'re the guy whose wife got effigy\'d.', 'The Man\'s been weird all week. Kept asking if the playa has a florist.'] });
    api.npc({ type: 'dpw', seed: 2, x: 25, z: -206, behavior: 'wander', radius: 3 });
    api.checkpoint('cp_gate', -24, -203, { yaw: Math.PI, name: 'The Gate' });
    api.pickup('water', 24, 0.9, -196);
    // barrier arms (raise when the gate opens) + the blocking collider
    S.barrier = api.collider({ t: 'box', x: 0, z: W1.GATE_Z, hx: 18, hz: 0.35, y0: 0, y1: 3, walk: false, cover: false });
    S.arms = [];
    for (let i = 0; i < 4; i++) {
      const px = -16 + i * 8;
      const mv = api.mover(m => { m.color('#2a2a30'); m.box(0, -0.55, 0, 0.4, 1.1, 0.4); m.color('#f4f4f0'); m.box(4, 0, 0, 8, 0.22, 0.18); m.color('#e82a2a'); for (let k = 0; k < 4; k++) m.box(1 + k * 2, 0, 0, 1, 0.24, 0.2); m.color('#ff3030', 1); m.box(7.8, 0.15, 0, 0.18, 0.18, 0.22); m.emissive(0); return { cols: [] }; });
      mv.x = px; mv.y = 1.1; mv.z = W1.GATE_Z; mv.yaw = 0; S.arms.push(mv);
    }
    /* ---------------- the arena + the Man ---------------- */
    const A = W1.ARENA;
    for (let i = 0; i < 28; i++) {
      const a = i / 28 * TAU; if (Math.cos(a) > 0.86) continue;
      const x = A.x + Math.sin(a) * (A.r + 2), z = A.z + Math.cos(a) * (A.r + 2);
      api.box(x, 0, z, 0.25, 2.6, 0.25, '#3a2a3a', { col: { camPass: true } }); api.glow(x, 2.8, z, 0.9, i % 2 ? '#ff4fd8' : '#38f2ff', { blink: 2 });
    }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; api.light(A.x + Math.sin(a) * A.r * 0.9, A.z + Math.cos(a) * A.r * 0.9, 9, i % 2 ? '#ff4fd8' : '#38c8ff', 0.4); }
    api.prop('booth', { x: -15, z: -260, roof: '#ffe24a' }); api.prop('booth', { x: 15, z: -262, roof: '#7aff5a' });
    for (let i = 0; i < 3; i++) { api.prop('portapotty', { x: -23 + i * 1.35, z: -283, col: '#2a6ac8' }); api.prop('portapotty', { x: 20.5 + i * 1.35, z: -281, col: '#3a8a3a' }); }
    api.prop('crate', { x: -1.2, z: -272, s: 1.6, cover: true }); api.prop('crate', { x: 0.6, z: -272.2, s: 1.6, cover: true }); api.prop('crate', { x: -0.3, z: -272, y: 1.6, s: 1.4, cover: true });
    api.prop('boxtruck', { x: -27, z: -266, yaw: 1.2, seed: 77 });
    api.prop('van', { x: 27, z: -296, yaw: -0.9, seed: 78 });
    api.pickup('water', -20, 0.9, -266); api.pickup('water', 20, 0.9, -266);
    api.glowRing(0, -262, 6, 10);
    const man = new BurnsManBoss(g, { x: W1.MAN.x, z: W1.MAN.z, yaw: 0, scale: 0.85, hp: 3, name: 'THE MAN', title: 'Lovesick Effigy',
      attacks: ['stomp', 'swipe', 'flash'], stun: 5.5, arena: A,
      phases: [{ hp: 1, attacks: ['stomp', 'swipe'], combo: 2, rate: 1 }, { hp: 0.67, attacks: ['stomp', 'swipe', 'flash'], combo: 3, rate: 1.1 }, { hp: 0.34, attacks: ['flash', 'swipe', 'stomp'], combo: 3, rate: 1.25 }],
      onPhase(g2, b, i) { g2.banner(i === 1 ? 'HE\'S GETTING MAD' : 'HE\'S FURIOUS', i === 1 ? 'Watch for the NEON FLASH: hide behind something!' : 'Faster attacks. Stay behind cover!', { col: '#ff4fd8' }); },
      onDefeat(g2) { BURNS_W1.bossDefeated(g2); } });
    g.addBoss(man);
    S.man = man;
    if (!S.introDone) { man.x = 34; man.z = 210; man.showChinka = false; man.hidden = true; }
    api.marker('gate', 0, W1.GATE_Z, 'Gate', { col: '#ffe24a' });
    api.marker('greeters', -40, -152, 'Greeters', { col: '#ff9a4a' });
    api.marker('party', -30, 90, 'Party', { col: '#ff4fd8' });
    api.region('gate', 0, -220, 20);
    // the boss starts when you walk into the arena with the gate open
    api.trigger({ x: 0, z: -252, r: 10, when: g2 => BURNS_W1.state.gateOpen && !BURNS_W1.state.bossStarted && !g2.missions.isDone('boss'), onEnter: g2 => BURNS_W1.bossIntro(g2) });
  },
  onStart(g) {
    const S = BURNS_W1.state;
    const ci = g.actor('chinkaIntro'); if (ci && S.introDone) { ci.hidden = true; }
    S.ticketPick = g.pickups.items.find(P => P.id === 'ticketItem') || null;
    if (g.missions.isDone('boss')) { S.man.hidden = true; S.gateOpen = true; S.barrier.off = true; S.bossStarted = true; }
    else if (g.missions.isDone('greeters') && g.hasItem('ticket') && BurnsSave.flag(1, 'gate')) { S.gateOpen = true; S.barrier.off = true; }
    // dusk -> night as tokens come in
    g.tod = Math.min(0.9, BurnsSave.tokenCount(1) * 0.18);
    if (BurnsSave.hasItem('ticket') || g.missions.isDone('ticket')) S.ticket = { done: true };
    if (!S.introDone) BURNS_W1.intro(g);
    else { g.dayCard(); g.banner('THE LINE', 'Get a ticket. Get through the gate. Get Chinka back.', { col: '#ff9a4a' }); }
  },
  onRespawn(g) {
    const m = g.missions.get('greeters');
    if (m && m.state === 'available' && BURNS_W1.state.round) BURNS_W1.resetGauntlet(g);
  },
  env(g, env) {
    const S = BURNS_W1.state;
    if (S.gust > 0) { env.fogD += S.gust * 0.012; env.haze = Math.min(1, env.haze + S.gust * 0.2); }
  },
  update(g, dt) {
    const S = BURNS_W1.state, p = g.player;
    if (S.gust > 0) {
      S.gust = Math.max(0, S.gust - dt * 0.6);
      for (let i = 0; i < 3; i++) { const a = Math.random() * TAU, d = 2 + Math.random() * 14; g.fx.add(p.x + Math.cos(a) * d, p.y + Math.random() * 3, p.z + Math.sin(a) * d, 7 + Math.random() * 4, 0.3, -2 + Math.random(), 1.2, 1.5, 4, [0.85, 0.72, 0.6], 0.3, 'puff', 0); }
    }
    BURNS_W1.updateTicket(g, dt);
    // raise the barrier arms
    if (S.arms) for (let i = 0; i < S.arms.length; i++) { const a = S.arms[i]; a.roll = BurnsM.damp(a.roll || 0, S.gateOpen ? 1.35 : 0, 2, dt); }
    for (const t of S.timers || []) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; t.fn(); } }
    if (S.timers) S.timers = S.timers.filter(t => !t.done);
    // tokens push dusk toward night
    const want = Math.min(1, BurnsSave.tokenCount(1) * 0.18 + (g.missions.state('boss') === 'active' ? 1 : 0));
    if (g.tod < want && g.todTarget === null) g.setTod(want, 0.03);
  }
});

/* small game-time timer helper used by World 1 (paused with the game) */
function burnsW1Timer(g, sec, fn) { const S = BURNS_W1.state; (S.timers || (S.timers = [])).push({ t: sec, fn }); }

/* ---------------- intro cutscene: the Man takes Chinka ---------------- */
BURNS_W1.intro = function (g) {
  const S = BURNS_W1.state, man = S.man, C = BURNS_W1.CAR, p = g.player;
  p.teleport(C.x + 0.36, 3.36, C.z + 2.4, 0.3); p.locked = true; p.animOverride = 'sit';
  man.hidden = true;
  const velvet = g.actor('rlVelvet'), candi = g.actor('rlCandi');
  g.cutscene([
    { music: 'burns_intro' },
    { cam: { x: 46, y: 26, z: 380, tx: 0, ty: 0, tz: 180, fov: 0.85 } },
    { do: g2 => g2.dayCard() },
    { cam: { from: { x: 46, y: 26, z: 380, tx: 0, ty: 0, tz: 180, fov: 0.85 }, to: { x: 8.5, y: 3.2, z: 284, tx: 15.5, ty: 2.0, tz: 296, fov: 0.85 }, dur: 4 } },
    { say: [velvet || 'MAMA VELVET', ['Wakey wakey, roof babies! Six hundred miles and you two snored through Nevada.']] },
    { say: [candi || 'CANDI', ['Welcome to the line, cuties! Only six more hours!']] },
    { cam: { from: { x: 8.5, y: 3.2, z: 284, tx: 15.5, ty: 2.0, tz: 296, fov: 0.85 }, to: { x: 24, y: 6.6, z: 309, tx: C.x, ty: 3.9, tz: C.z + 2.4, fov: 0.8 }, dur: 2.6 } },
    { say: [g.actor('chinkaIntro'), ['Babe. We made it. Our first Burn! Look at all these beautiful weirdos.']] },
    { say: ['brady', ['So... what do people actually DO here? Is there a schedule? Do I need a camp?']] },
    { do: g2 => { g2.shake(0.6); burnsSfx('man_stomp'); man.hidden = false; man.x = 34; man.z = 236; man.yaw = Math.atan2(C.x - 34, C.z - 236); man.setState('walk'); } },
    { cam: { from: { x: 24, y: 6.6, z: 309, tx: C.x, ty: 3.9, tz: C.z + 2.4, fov: 0.8 }, to: { x: 14, y: 5, z: 314, tx: 30, ty: 9, tz: 250, fov: 0.9 }, dur: 1.4 } },
    { do: g2 => { S.walkT = 0; } },
    { until: g2 => { S.walkT += 1 / 120; const k = Math.min(1, S.walkT / 3.2); man.x = lerp(34, C.x + 7, k); man.z = lerp(236, C.z - 9, k); if (Math.floor(S.walkT * 1.4) !== Math.floor((S.walkT - 1 / 120) * 1.4)) { g2.shake(0.35); burnsSfx('man_stomp', { vol: 0.6 }); g2.fx.dust(man.x, 0.2, man.z, 10); } return k >= 1; } },
    { do: g2 => { man.setState('idle'); man.yaw = Math.atan2(C.x - man.x, C.z - man.z); g2.fx.hearts(man.x, 11, man.z, 20); } },
    { cam: { x: C.x - 6, y: 4.6, z: C.z + 9, tx: man.x, ty: 9, tz: man.z, fov: 0.95 } },
    { say: ['man', ['WHO... IS... SHE?']] },
    { say: [g.actor('chinkaIntro'), ['Uh. Brady? The giant wooden guy is looking at me.']] },
    { do: g2 => { man.setState('grab'); burnsSfx('man_roar', { pitch: 1.3, vol: 0.6 }); } },
    { wait: 0.9 },
    { do: g2 => { const ci = g2.actor('chinkaIntro'); if (ci) ci.hidden = true; man.showChinka = true; g2.fx.hearts(C.x, 4.4, C.z + 2.4, 16); burnsSfx('chinka', null, 'secret'); } },
    { wait: 1.3 },
    { say: ['man', ['I AM THE MAN. AND I AM IN LOVE.']] },
    { do: g2 => { p.locked = false; p.teleport(C.x - 2.2, 0, C.z + 1.5, Math.PI + 0.4); p.locked = true; p.animOverride = 'yell'; } },
    { say: ['brady', ['HEY! That\'s my wife, you overgrown campfire!']] },
    { do: g2 => { man.setState('walk'); man.yaw = Math.PI + 0.25; S.walkT = 0; } },
    { cam: { from: { x: C.x - 6, y: 4.6, z: C.z + 9, tx: man.x, ty: 9, tz: man.z, fov: 0.95 }, to: { x: C.x - 3, y: 3, z: C.z + 8, tx: man.x - 6, ty: 8, tz: man.z - 60, fov: 0.9 }, dur: 3 } },
    { until: g2 => { S.walkT += 1 / 120; man.x -= Math.sin(0.25) * 9 / 120; man.z -= 9 / 120; if (Math.floor(S.walkT * 1.6) !== Math.floor((S.walkT - 1 / 120) * 1.6)) { g2.shake(0.25); burnsSfx('man_stomp', { vol: 0.4 }); g2.fx.dust(man.x, 0.2, man.z, 8); } return S.walkT > 2.2; } },
    { say: ['brady', ['CHINKA!', '...Wait. She had both tickets.']] },
    { say: [velvet || 'MAMA VELVET', ['Honey. Go get your girl. We\'ll keep the RV running.']] },
    { fade: 'out', dur: 0.5 },
    { do: g2 => { man.hidden = false; man.showChinka = true; const ci = g2.actor('chinkaIntro'); if (ci) ci.hidden = true; man.x = BURNS_W1.MAN.x; man.z = BURNS_W1.MAN.z; man.y = 0; man.yaw = 0; man.setState('idle'); BurnsSave.flag(1, 'intro', true); S.introDone = true; p.locked = false; p.animOverride = null; p.teleport(17.2, 0, 296, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; burnsMusic('burns_w1'); } },
    { fade: 'in', dur: 0.6 },
    { banner: ['GET A TICKET', 'Then get through the gate. Then get Chinka back.', { col: '#ffd84a' }] }
  ], null);
};

/* ---------------- ticket chase across the RV roofs ---------------- */
BURNS_W1.gust = function (g) {
  const S = BURNS_W1.state, lane = S.traffic.lanes[3];
  let best = null, bd = 1e9;
  for (const c of lane.cars) { const d = Math.abs(c.mv.z - 66); if (d < bd) { bd = d; best = c; } }
  S.ticket = { car: best, hops: 0, state: 'fly', t: 0, from: { x: 16, y: 2, z: 72 } };
  S.gust = 3.2; burnsSfx('wind', null, 'dust'); g.shake(0.3);
  g.missions.start('ticket');
  const lk = g.actor('lucky'); if (lk) lk.say('...the playa giveth, the playa blow-eth away. ON THE ROOFS! GO!', 3.5);
  g.toast('THE TICKET BLEW ONTO THE RV ROOFS!');
};
BURNS_W1.ticketSpot = function (car, out) { out = out || {}; out.x = car.mv.x; out.y = car.mv.y + (car.mv.info.top || 3) + 0.9; out.z = car.mv.z + 0.5; return out; };
BURNS_W1.updateTicket = function (g, dt) {
  const S = BURNS_W1.state, T = S.ticket, P = S.ticketPick;
  if (!T || T.done || !P || g.missions.state('ticket') !== 'active') { if (T && T.car && T.final && g.missions.isDone('ticket')) T.car.sleep = false; return; }
  const p = g.player, spot = BURNS_W1.ticketSpot(T.car, {});
  if (T.state === 'fly') {
    T.t += dt / 0.9; const k = Math.min(1, T.t);
    P.x = lerp(T.from.x, spot.x, k); P.z = lerp(T.from.z, spot.z, k); P.y0 = lerp(T.from.y, spot.y, k) + Math.sin(k * Math.PI) * 4;
    if (Math.random() < 0.6) g.fx.dust(P.x, P.y0, P.z, 1, '#f4e0c0');
    if (k >= 1) { T.state = 'rest'; T.t = 0; }
  } else {
    P.x = spot.x; P.z = spot.z; P.y0 = spot.y;
    if (T.hops >= 5) { if (!T.final) { T.final = true; T.car.sleep = true; g.toast('IT\'S STUCK ON THIS ROOF! GRAB IT!'); } return; }
    const d = Math.hypot(p.x - P.x, p.z - P.z);
    if (d < 5 && p.y > 1.2) {
      const lane = T.car.lane, i = lane.cars.indexOf(T.car);
      const next = i > 0 ? lane.cars[i - 1] : null;
      if (next) { T.from = { x: P.x, y: P.y0, z: P.z }; T.car = next; T.state = 'fly'; T.t = 0; T.hops++; burnsSfx('wind', { vol: 0.5 }, 'dust'); S.gust = Math.max(S.gust, 0.8); g.toast(['WHOOSH!', 'NOPE! NEXT ROOF!', 'SO CLOSE!', 'THE PLAYA LAUGHS!', 'ONE MORE!'][T.hops - 1] || 'WHOOSH!'); }
    }
  }
};

/* ---------------- greeter gauntlet ---------------- */
BURNS_W1.gauntlet = function (g) {
  g.missions.start('greeters');
  BURNS_W1.state.round = 0;
  BURNS_W1.nextGreeter(g);
};
BURNS_W1.GREETERS = [
  { name: 'BIG HUG BARB', behavior: 'greeterHug', seed: 31, intro: 'Round 1: she hugs. Hard. Make her miss, then hit her while she\'s dizzy!' },
  { name: 'DUST ANGEL DEV', behavior: 'greeterSlam', seed: 32, intro: 'Round 2: jump the dust wave, then bonk him while he makes dust angels!' },
  { name: 'DING-DONG DORIS', behavior: 'greeterBell', seed: 33, prop: 'bell', intro: 'Round 3: jump the bell rings, then hit her while her ears ring!' }
];
BURNS_W1.nextGreeter = function (g) {
  const S = BURNS_W1.state, i = S.round, G = BURNS_W1.GREETERS[i];
  if (!G) {
    g.boss = null;
    const d = g.actor('dusty');
    g.say(d, ['You\'ve been GREETED! Officially. Thoroughly. Possibly bruised.', 'Here\'s the What Where When guide: every mission and party out here, marked on your map. And a token, because we love you.'], () => g.missions.complete('greeters', { x: -36, y: 1.4, z: -150 }));
    return;
  }
  const a = g.spawnActor({ type: 'greeter', seed: G.seed, prop: G.prop, name: G.name, x: -40 + (i - 1) * 3, z: -158, yaw: Math.PI, behavior: G.behavior, hp: 3, friendly: false, boss: true, drop: 4, defeatLine: 'Welcome... home...', afterDefeat: 'dance',
    onDefeat(g2) { burnsSfx('crowd_cheer'); S.round++; burnsW1Timer(g2, 1.6, () => BURNS_W1.nextGreeter(g2)); } });
  a.home = { x: -40, z: -152 };
  S.greeter = a;
  g.boss = { name: G.name, get hp() { return a.hp; }, maxHp: 3, active: true, get defeated() { return a.defeated; }, st: '', head() { return [a.x, a.y + 2.2, a.z]; }, update() {} };
  g.banner(`ROUND ${i + 1}: ${G.name}`, G.intro, { col: '#ff9a4a' });
  burnsSfx('greeter_bell');
};
BURNS_W1.resetGauntlet = function (g) {
  const S = BURNS_W1.state;
  for (const a of g.actors.slice()) if (a.def.boss && !a.defeated) g.removeActor(a);
  S.round = 0; g.boss = null;
};

/* ---------------- the gate opens ---------------- */
BURNS_W1.openGate = function (g) {
  const S = BURNS_W1.state;
  if (S.gateOpen) return;
  S.gateOpen = true; S.barrier.off = true; BurnsSave.flag(1, 'gate', true);
  burnsSfx('crowd_cheer');
  g.banner('THE GATE IS OPEN', 'Walk in. He\'s waiting.', { col: '#ffe24a' });
};

/* ---------------- boss intro + defeat ---------------- */
BURNS_W1.bossIntro = function (g) {
  const S = BURNS_W1.state, man = S.man, p = g.player, A = BURNS_W1.ARENA;
  if (S.bossStarted) return; S.bossStarted = true;
  g.missions.start('boss', true);
  g.cutscene([
    { music: 'man_boss' },
    { cam: { x: 8, y: 2.5, z: -248, tx: man.x, ty: 6, tz: man.z, fov: 0.9 } },
    { do: g2 => { g2.shake(0.4); burnsSfx('man_roar'); } },
    { cam: { from: { x: 8, y: 2.5, z: -248, tx: man.x, ty: 6, tz: man.z, fov: 0.9 }, to: { x: 4, y: 7, z: -282, tx: man.x, ty: 10.5, tz: man.z, fov: 0.8 }, dur: 2.6 } },
    { banner: ['THE MAN', 'Lovesick Effigy · Boss', { col: '#ff4fd8', big: true, dur: 3 }] },
    { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['BRADY! He keeps writing me poems! Everything rhymes with "wood"!']] },
    { say: ['man', ['SMALL MAN WITH A BUN. SHE IS MINE NOW. WE ARE... SOULMATES.']] },
    { say: ['brady', ['You\'ve known her for twenty minutes!']] },
    { say: ['man', ['THE BEST TWENTY MINUTES OF MY LIFE!']] },
    { do: g2 => { p.teleport(0, 0, -250, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; g2.boss = man; man.start(); g2.banner('FIGHT!', 'Jump his shockwaves · hide from the NEON FLASH · bonk his head when he collapses', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W1.bossDefeated = function (g) {
  const S = BURNS_W1.state, man = S.man, p = g.player;
  g.missions.complete('boss');
  burnsW1Timer(g, 1.4, () => {
    g.cutscene([
      { music: 'burns_victory' },
      { cam: { x: 10, y: 4, z: -280, tx: man.x, ty: 6, tz: man.z, fov: 0.9 } },
      { say: ['man', ['MY HEART... IS TOO BIG... FOR THIS GATE...']] },
      { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['Brady! Find our camp! I\'ll leave you clues!']] },
      { do: g2 => { man.defeated = false; man.active = false; man.setState('flee'); burnsSfx('man_roar'); g2.shake(0.5); } },
      { say: ['man', ['THIS ISN\'T OVER, BUN BOY! I WILL BUILD HER A PAVILION!']] },
      { do: g2 => { S.fleeT = 0; } },
      { cam: { from: { x: 10, y: 4, z: -280, tx: man.x, ty: 6, tz: man.z, fov: 0.9 }, to: { x: 14, y: 6, z: -262, tx: man.x, ty: 30, tz: man.z - 60, fov: 0.95 }, dur: 3.2 } },
      { until: g2 => { S.fleeT += 1 / 120; man.y += (4 + S.fleeT * 10) / 120; man.z -= (6 + S.fleeT * 14) / 120; for (let i = 0; i < 2; i++) { const f = man.foot(i ? 1 : -1); g2.fx.fire(f[0], f[1] - 0.5, f[2], 2.4); } if (Math.random() < 0.1) burnsSfx('flame_jet', { vol: 0.6 }); return S.fleeT > 3.4; } },
      { do: g2 => { man.hidden = true; man.y = 0; } },
      { cam: { x: -14, y: 2.2, z: -226, tx: -17.2, ty: 1.6, tz: -221, fov: 0.8 } },
      { say: [g.actor('moe') || 'moe', ['Uh. Ticket? ...You know what. Welcome home, Brady.']] },
      { say: ['brady', ['Hold on, Chinka. I\'m coming.']] },
      { do: g2 => { burnsSfx('greeter_bell'); p.victoryT = 3; } },
      { wait: 1.0 }
    ], g2 => g2.finishWorld());
  });
};
