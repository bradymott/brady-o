/* ============================================================
   BRADY-O BURNS — World 3: COSTUME CULT & THE YELLOW BIKE (day)
   The Man knows Brady's face now. Brady needs a disguise and wheels.
   South: a sunny grid of camps. North: open playa, yellow bikes.
   Missions (Burn Tokens):
     dress   Dress the Part        choose a costume at the Costume Cult, strut the catwalk
     vibe    Vibe Check            sneak past the Man's lookouts to the bike clinic (stealth)
     hunt    Yellow Bike Hunt      follow the yellow ribbons to the Bike Henge
     flat    Fix a Flat            patch kit + pump for the chained yellow bike
     thief   The Bike Thief        a thief rides off on it: catch him (gives the YELLOW BIKE)
     ride    First Ride            timed bike course through the Knotted Semi (loop + launch)
     boss    The Tallbike Baron    boss of the Bike Graveyard (needs costume + bike)
   Side quests: Good Vibes Only (sparkle ponies hogging the racks), Hot Dog (an
   overheating furry), Burney's photo shoot.
   World 3 leaves the player owning a chosen costume and the yellow bike.
   ============================================================ */

const BURNS_W3 = {
  CULT: { x: -62, z: 46 }, CLINIC: { x: 52, z: 40 }, HENGE: { x: 0, z: -40 }, SEMI: { x: 66, z: -72 }, GRAVE: { x: -62, z: -78 },
  MANNEQ: ['furcoat', 'tutu', 'spaceman', 'unicorn', 'pirate', 'disco'],
  HOGGED: ['spaceman', 'unicorn', 'disco'],
  state: null
};

BurnsWorlds.register({
  id: 3, name: 'Costume Cult & the Yellow Bike', sub: 'Pick a look. Find a ride.',
  sky: Object.assign({}, BURNS_PALETTES.day, { zen: '#2f78e0', hor: '#f0d2aa', mid: '#78b4ec', midK: 0.42, fog: '#dcc0a0', fogD: 0.006, haze: 0.5, sun: [150, 58], clouds: 0.62, cloudCol: '#fffaf2', sky: '#b0c4e0', gnd: '#a88868', key: '#fff0d8', keyK: 0.78, emB: 1.1 }),
  sky2: Object.assign({}, BURNS_PALETTES.day, { zen: '#3a6ac8', hor: '#ffc08a', mid: '#e8a080', midK: 0.45, fog: '#e0b490', fogD: 0.0066, haze: 0.55, sun: [235, 22], sunCol: '#ffd8a0', clouds: 0.5, cloudCol: '#ffe0c8', sky: '#c0a8c0', gnd: '#a07a60', key: '#ffd0a0', keyK: 0.8, rim: '#ffe0c0', emB: 1.2 }),
  tod: 0,
  music: 'burns_w3',
  bounds: [-130, -124, 130, 118],
  spawn: { x: -18, y: 0, z: 100, yaw: Math.PI },
  ground: { base: '#c49a74', crack: 0.32, mottle: 0.45, res: 0.5 },
  dust: 1.4,
  missions: [
    { id: 'dress', name: 'Dress the Part', type: 'custom', giver: 'sequin', start: 'manual', short: 'Try on a costume, then strut the catwalk', marker: { x: -60, z: 44 },
      desc: 'The Costume Cult will make you unrecognizable. Try on a costume at the fitting room, then strut the catwalk and POSE for the judges.', hint: 'The Costume Cult, west end of the city' },
    { id: 'vibe', name: 'Vibe Check', type: 'stealth', requires: ['dress'], giver: 'coach', start: 'manual', short: 'Sneak past the lookouts to the bike clinic', marker: { x: -36, z: 40 },
      target: { x: 40, z: 40, r: 4.5 }, desc: 'The Man\'s lookouts patrol the street to the bike clinic. Stay out of their sight cones. Duck behind shade, cars and crowds.', hint: 'The Lookout Line, the street east of the Cult',
      onStart(g) { BURNS_W3.vibeStart(g); }, onFail(g) { BURNS_W3.vibeReset(g); } },
    { id: 'hunt', name: 'Yellow Bike Hunt', type: 'custom', requires: ['vibe'], giver: 'wanda', start: 'manual', short: 'Follow the yellow ribbons', marker: { x: 0, z: -40 },
      desc: 'Community bikes are yellow. Wrench Wanda tied yellow ribbons from her clinic out to where she last saw one.', hint: 'From the bike clinic, out onto the open playa',
      onStart(g) { BURNS_W3.ribbon(g, 0); } },
    { id: 'flat', name: 'Fix a Flat', type: 'custom', requires: ['hunt'], giver: 'wanda', start: 'manual', count: 2, progressLabel: 'Bike parts', short: 'Find a patch kit and a pump', marker: { x: -30, z: 0 },
      desc: 'The yellow bike has a flat. Find a patch kit (the Free Store) and a pump (somebody stacked bike crates way up high), then fix it at the Bike Henge.', hint: 'Free Store west of the Henge; the crate tower to the east',
      onStart(g) { BURNS_W3.labels(g, 'flat', null); },
      onEvent(g, m, name, P) { if (name === 'pickup' && P.mission === 'flat') { m.n++; g.toast(m.n >= 2 ? 'GOT BOTH! FIX THE BIKE AT THE HENGE' : `Bike parts: ${m.n}/2`); return true; } } },
    { id: 'thief', name: 'The Bike Thief', type: 'custom', requires: ['flat'], start: 'manual', short: 'Catch the bike thief! Spin or stomp him', marker: { x: 0, z: -40 },
      desc: 'Somebody just rode off on YOUR yellow bike. Chase him down and spin or stomp him off it.', hint: 'He loops around the open playa', failOnFaint: false },
    { id: 'ride', name: 'First Ride', type: 'custom', requires: ['thief'], giver: 'spokes', start: 'manual', time: 60, short: 'Ride the gates: loop the semi, launch the trailer!', marker: { x: 40, z: -44 },
      desc: 'Coach Spokes\' First Ride course runs through the Knotted Semi. Ride through every gate in order: the loop-de-loop, then launch off the trailer.', hint: 'The Knotted Semi, open playa east',
      onStart(g) { BURNS_W3.rideStart(g); }, onFail(g) { BURNS_W3.rideReset(g); },
      onEvent(g, m, name) { const R = BURNS_W3.state.ride; if (!R) return; if (name === 'bbaLoopStart') { R.looped = true; g.banner('LOOP-DE-LOOP!', '', { col: '#ff4fd8', small: true }); } if (name === 'bbaLaunch') { R.launched = true; } } },
    { id: 'boss', name: 'The Tallbike Baron', type: 'boss', requires: ['dress', 'ride'], start: 'manual', tokenDirect: true, short: 'Defeat the Tallbike Baron!', marker: { x: -62, z: -78 },
      desc: 'The bike thief works for the Baron, who hoards stolen community bikes in his Bike Graveyard. Knock him off his tall bike.', hint: 'The Bike Graveyard, open playa west', lockedDesc: 'Get a costume and finish your First Ride.' },
    { id: 'vibes', name: 'Good Vibes Only', token: false, type: 'find', giver: 'glimmer', start: 'manual', short: 'Find Glimmer\'s platform boot', marker: { x: -36, z: 6 },
      desc: 'Sparkle ponies are hogging half the costume racks. Glimmer will clear them out if you find her lost platform boot.', hint: 'She last saw it near the Free Store',
      onComplete(g) { BURNS_W3.vibesDone(g); } },
    { id: 'furry', name: 'Hot Dog', token: false, type: 'custom', giver: 'fuzz', start: 'manual', short: 'Walk Fuzz to the misting station', marker: { x: 58, z: 52 },
      desc: 'Fuzz is wearing a full fursuit in the midday sun. Walk them to the misting station at the bike clinic before they melt.', hint: 'Fuzz sits by the Costume Cult tent' }
  ],
  build(api, g) {
    const W3 = BURNS_W3, R = api.rng, BW = BURNS_W234;
    BW.reset(g);
    W3.state = { introDone: !!BurnsSave.flag(3, 'intro'), ribbons: [], gates: [], wheels: [], lookouts: [] };
    const S = W3.state;
    /* ---------------- ground ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 240; i++) { const x = R.range(-135, 135), z = R.range(-130, 125), [px, pz] = P(x, z), r = R.range(2, 11) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.45; gg.addColorStop(0, dark ? 'rgba(170,130,100,0.22)' : 'rgba(250,232,205,0.25)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      c.strokeStyle = 'rgba(140,105,80,0.2)'; c.lineWidth = 0.3 * sc;
      for (let i = 0; i < 40; i++) { const [ax, az] = P(R.range(-130, 130), R.range(-124, 0)), ang = R() * TAU, len = R.range(20, 80) * sc; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.6) * len * 0.5, az + Math.sin(ang + 0.6) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
      const [hx, hz] = P(W3.HENGE.x, W3.HENGE.z); c.strokeStyle = 'rgba(255,210,30,0.35)'; c.lineWidth = 1.2 * sc; c.beginPath(); c.arc(hx, hz, 11 * sc, 0, TAU); c.stroke();
      const [gx, gz] = P(W3.GRAVE.x, W3.GRAVE.z), gr = c.createRadialGradient(gx, gz, 0, gx, gz, 24 * sc); gr.addColorStop(0, 'rgba(150,110,90,0.5)'); gr.addColorStop(1, 'rgba(150,110,90,0)'); c.fillStyle = gr; c.beginPath(); c.arc(gx, gz, 24 * sc, 0, TAU); c.fill();
    });
    for (const z of [40, 84]) api.road([[-135, z], [135, z]], 10, { tracks: [-1.6, 1.6] });
    for (const x of [-36, 4, 40, 92]) api.road([[x, 118], [x, 12]], 9, { tracks: [-1.4, 1.4] });
    api.road([[4, 12], [0, -40]], 6, { col: 'rgba(150,115,90,0.3)' });
    /* ---------------- the day city: camps along the streets ---------------- */
    const reserved = [[W3.CULT.x, W3.CULT.z, 34], [W3.CLINIC.x, W3.CLINIC.z, 15], [-18, 100, 8], [-22, 62, 6]];
    let npcN = 0;
    for (const sz of [40, 84]) for (const side of [-1, 1]) for (let x = -124; x <= 124; x += 15) {
      const z = sz + side * 8.5;
      if (z > 112 || reserved.some(q => Math.hypot(x - q[0], z - q[1]) < q[2]) || [-36, 4, 40, 92].some(sx => Math.abs(x - sx) < 7)) continue;
      npcN += W3.lot(api, x + R.range(-1.5, 1.5), z, side > 0 ? Math.PI : 0, 3000 + Math.round(x * 3 + z), npcN < 40);
    }
    /* ---------------- the Costume Cult ---------------- */
    W3.buildCult(api, g);
    /* ---------------- the Lookout Line (stealth street) ---------------- */
    {
      api.npc({ id: 'coach', name: 'VIBE COACH VALENTINA', type: 'tutu', seed: 33, x: -36, z: 44, yaw: Math.PI / 2,
        talk(g2, a) {
          const st = g2.missions.state('vibe');
          if (st === 'locked') g2.say(a, ['The Man\'s lookouts are watching this street for a guy with a bun. You ARE a guy with a bun. Get a costume first, sweetie.']);
          else if (st === 'available') g2.say(a, ['Ooh, the look is WORKING. Now: the Man\'s lookouts patrol this street all the way to the bike clinic.', 'They wear little wooden Man masks. They see in cones. Stay out of the cones, hide behind stuff, keep your vibe low and slow.'], () => g2.missions.start('vibe'));
          else if (st === 'active') g2.say(a, ['Cones! Avoid the cones! Low vibe, honey, LOW vibe.']);
          else g2.say(a, ['You passed the vibe check. Nobody passes the vibe check. I\'m so proud.']);
        } });
      api.sign('THE LOOKOUT LINE\nSTAY OUT OF THE CONES', -34, 34, { h: 1.0, yaw: Math.PI / 2, style: { bg: '#2a1a2a', fg: '#ff9ad8', size: 22, border: '#ff4fd8' } });
      // cover: shade islands, parked cars and a big inflatable duckling (art)
      for (const [x, z, k] of [[-24, 36, 'shade'], [-10, 44, 'car'], [8, 36, 'shade'], [20, 45, 'van'], [30, 35, 'shade'], [-16, 33, 'crate'], [14, 41, 'crate']]) {
        if (k === 'shade') { api.prop('shade', { x, z, w: 4.5, d: 3.5, col: R.pick(['#e8c8a8', '#a8d8c8', '#e8a8c8']) }); api.roundBox(x, 0, z, 3.2, 1.3, 1.0, '#6a4a3a', { r: 0.25 }); }
        else if (k === 'crate') api.roundBox(x, 0, z, 1.8, 1.5, 1.8, '#c8a060', { r: 0.2 });
        else api.prop(k, { x, z, yaw: Math.PI / 2, seed: Math.round(x) + 900 });
      }
      const LO = [[[-20, 46], [-20, 34]], [[-4, 34], [-4, 46]], [[12, 46], [12, 34]], [[26, 34], [26, 46]]];
      const lookSpec = i => Object.assign(BurnsRig.npcSpec('burner', 60 + i), { top: { kind: 'hoodie', col: ['#6a4a2e', '#4a3a2a', '#5a3a30', '#3a2a22'][i] }, bottom: { kind: 'cargo', col: '#3a3028' }, shoes: { kind: 'boots', col: '#2a1a12' }, hat: null, goggles: false, glasses: null, beard: null, acc: [], led: null, paint: null, coat: null, prop: 'radio', key: 'w3:lookout:' + i });
      LO.forEach((path, i) => S.lookouts.push(api.enemy({ id: 'look' + i, name: 'LOOKOUT', type: 'burner', spec: lookSpec(i), seed: 60 + i, x: path[0][0], z: path[0][1], behavior: 'patrol', path, speed: 1.25 + i * 0.1, view: 9, fov: 0.5, spotLine: 'THAT\'S THE BUN GUY!', hp: 2, chaseSpeed: 4.6, damage: 1, w3mask: true })));
    }
    /* ---------------- the bike clinic ---------------- */
    W3.buildClinic(api, g);
    /* ---------------- open playa: the Bike Henge + the yellow bike ---------------- */
    {
      const { x: hx, z: hz } = W3.HENGE;
      for (let i = 0; i < 10; i++) {
        const a = i / 10 * TAU, x = hx + Math.sin(a) * 10, z = hz + Math.cos(a) * 10;
        api.mesh(x, z, m => {
          // an arch of welded bikes: two wheels stacked on a frame, painted the colours of the city
          const col = BURNS_NEON[i % 7];
          m.color('#2a2a30'); for (const y of [0.42, 1.25, 2.08]) BW.ring(m, 0, y, 0, 0.36, 0.045, { roll: Math.PI / 2, seg: 14, tseg: 5 });
          m.color(col).shine(2); BW.limb(m, 0, 0.42, -0.6, 0, 2.5, -0.1, 0.05); BW.limb(m, 0, 0.42, 0.6, 0, 2.5, 0.1, 0.05); BW.limb(m, 0, 2.5, -0.1, 0, 2.5, 0.1, 0.05); m.shine(0);
          m.color('#ffd21a'); BW.ring(m, 0, 2.95, 0, 0.42, 0.05, { roll: Math.PI / 2, seg: 14, tseg: 5 });
          return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.15, hz: 0.7, y0: 0, y1: 2.6 }], lights: [] };
        }, { yaw: a + Math.PI / 2 });
      }
      api.roundBox(hx, 0, hz + 1.6, 0.5, 1.4, 0.5, '#5a5a62', { r: 0.12 });
      api.sign('BIKE HENGE\nRIDE IT. RETURN IT.', hx + 12.5, hz + 6, { h: 1.0, yaw: -0.8, style: { bg: '#ffd21a', fg: '#1a1a10', size: 22, border: '#1a1a10' } });
      S.bikeMv = BW.bikeMover(api, '#ffd21a', { basket: true });
      S.bikeMv.x = hx + 0.6; S.bikeMv.z = hz + 1.4; S.bikeMv.yaw = 1.2; S.bikeMv.roll = 0.32;
      api.light(hx, hz, 13, '#ffe28a', 0.25);
      api.checkpoint('cp_henge', hx - 6, hz + 14, { yaw: Math.PI, name: 'Bike Henge' });
      // ribbon trail (appears during the hunt)
      const RB = [[44, 26], [30, 10], [18, -6], [8, -22], [hx + 1, hz + 2]];
      RB.forEach(([x, z], i) => { S.ribbons.push({ x, z, i }); api.mesh(x, z, m => { m.color('#8a6a3a'); BW.post(m, 0, 0, 0, 0.06, 2.0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.08, y0: 0, y1: 2.0, camPass: true }] }; }); });
      api.pickup('photo', hx, 3.5, hz, { id: 'p1' });
      api.glowArc(hx - 10, 2.7, hz, hx, 3.4, hz, 1.2, 5);
    }
    /* ---------------- Free Store (patch kit) + crate tower (pump) ---------------- */
    {
      const fx = -30, fz = 0;
      api.prop('shade', { x: fx, z: fz, w: 8, d: 6, col: '#f4e2c0' });
      for (let i = 0; i < 3; i++) api.roundBox(fx - 3 + i * 3, 0, fz - 2.2, 2.4, 1.0 + i * 0.2, 0.9, ['#8a6a4a', '#6a8a9a', '#9a6a8a'][i], { r: 0.15 });
      api.sign('FREE STORE\nTAKE WHAT YOU NEED', fx, fz + 4.5, { h: 1.0, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 22, border: '#3a1a10' } });
      api.pickup('item:patchkit', fx, 1.9, fz - 2.2, { mission: 'flat', gate: true, label: 'PATCH KIT', id: 'patchkit' });
      api.npc({ type: 'crusty', seed: 91, name: 'FREE STORE FRANK', x: fx + 3.5, z: fz + 1, yaw: -1.2, lines: ['Free Store! Take what you need, leave what you don\'t.', 'Somebody left forty left shoes. Who has forty left feet?'], gift: { kind: 'water' } });
      api.pickup('item:boot', fx - 6, 0.7, fz + 6, { mission: 'vibes', gate: true, label: 'PLATFORM BOOT', id: 'boot' });
      const tx = 30, tz = -18;
      for (let i = 0; i < 6; i++) api.roundBox(tx + (i % 2 ? 0.6 : -0.4), i * 1.25, tz + (i % 3 - 1) * 0.5, 2.0, 1.25, 1.6, ['#c8a060', '#a08050'][i % 2], { r: 0.15, yaw: i * 0.4 });
      api.roundBox(tx + 3, 0, tz + 1, 1.6, 1.2, 1.6, '#c8a060', { r: 0.15 });
      api.pickup('item:pump', tx + 0.2, 8.4, tz, { mission: 'flat', gate: true, label: 'PUMP', id: 'pump' });
      api.sign('BIKE BOXES\nDO NOT STACK', tx - 3.5, tz + 2.5, { h: 0.8, yaw: 0.4, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 22 } });
    }
    /* ---------------- First Ride: the Knotted Semi ---------------- */
    W3.buildSemi(api, g);
    /* ---------------- the Bike Graveyard + the Tallbike Baron ---------------- */
    W3.buildGrave(api, g);
    /* ---------------- yellow bikes everywhere: parked + riders ---------------- */
    {
      for (let i = 0; i < 16; i++) { const a = R() * TAU, d = R.range(14, 60), x = W3.HENGE.x + Math.sin(a) * d * 1.4, z = W3.HENGE.z + Math.cos(a) * d; if (Math.hypot(x - W3.GRAVE.x, z - W3.GRAVE.z) < 26 || Math.hypot(x - W3.SEMI.x, z - W3.SEMI.z) < 22) continue; api.mesh(x, z, m => { m.push(); m.tf(0, 0, 0, 0, 0, 1.35); BW.bike(m, '#ffd21a', { lo: true }); m.pop(); return {}; }, { yaw: R() * TAU }); }
      const loops = [[[-20, -10], [20, -12], [28, -40], [10, -70], [-24, -60], [-34, -30]], [[-60, 10], [-10, 12], [20, 2], [0, -20], [-40, -20]]];
      loops.forEach((path, k) => { for (let i = 0; i < 3; i++) { const mv = BW.bikeMover(api, '#ffd21a', { basket: i % 2 === 0 }); api.npc({ type: R.pick(['burner', 'tutu', 'furcoat', 'sparklepony']), seed: 800 + k * 10 + i, behavior: 'w234Cyclist', path, startIndex: (i * 2) % path.length, speed: 4.6 + i * 0.4, bikeMv: mv, x: path[(i * 2) % path.length][0], z: path[(i * 2) % path.length][1], collide: false, always: true, chat: ['Yellow bikes! Ride it, then leave it for the next person!', 'Ding ding! Community vibes!', 'Mine has no brakes. It\'s fine.'] }); } });
    }
    /* ---------------- enemies: fashion police + thieves ---------------- */
    for (const [x, z, i] of [[-40, 62, 1], [-6, 76, 2], [18, 52, 3], [-52, 22, 4]]) api.enemy({ type: 'influencer', seed: 140 + i, name: 'FASHION POLICE', x, z, behavior: 'w3FashionCop', hp: 2, drop: 3, spec: Object.assign(BurnsRig.npcSpec('influencer', 140 + i), { coat: { kind: 'duster', col: '#1a1a2a', trim: '#ffd84a' }, hat: { kind: 'cap', col: '#1a1a2a' }, glasses: 'shades', prop: 'clipboard', key: 'w3:fashioncop' }) });
    for (const [x, z, i] of [[-20, -70, 1], [44, -2, 2]]) api.enemy({ type: 'burner', seed: 150 + i, name: 'GLOW STICK THIEF', x, z, behavior: 'thief', hp: 1, steal: 6 });
    /* ---------------- start area, checkpoints, ground score ---------------- */
    api.checkpoint('cp_start', -14, 94, { yaw: Math.PI, name: 'Hammock Camp' });
    api.mesh(-24, 104, m => { m.color('#5a4a3a'); BW.post(m, -2.4, 0, 0, 0.1, 2.0); BW.post(m, 2.4, 0, 0, 0.1, 2.0); m.color('#ff9a3a'); BW.tube(m, [[-2.3, 1.7, 0], [-1.2, 1.0, 0], [0, 0.85, 0], [1.2, 1.0, 0], [2.3, 1.7, 0]], 0.18); return { cols: [] }; });
    api.npc({ id: 'gina', name: 'GREETER GINA', type: 'greeter', seed: 77, x: -16, z: 98, yaw: Math.PI,
      lines: ['Morning, sunshine! You slept in our hammock. That makes you family.', 'Word on the playa: a giant wooden guy is looking for a dude with a man bun. That\'s... you, huh?', 'You need a disguise, honey. The Costume Cult is west. They\'ll make you unrecognizable.'], gift: { kind: 'glowstick', n: 10 } });
    // someone brought their mom (she is having the best week of anyone here)
    api.npc({ id: 'mom', name: 'BURNER MOM', type: 'burnermom', seed: 2, x: -6, z: 96, yaw: -2.4, behavior: 'idle', anim: 'cheer', chatter: true,
      talk(g2, a) {
        if (a.w3photo) { g2.say(a, ['Best! Week! Ever! I\'m doing the sunrise set AND a sound bath tomorrow!']); return; }
        g2.say(a, ['OH MY GOSH, a real burner with a BUN! Can I get a photo with you? Two cameras! For backup!', 'Okay, say BURN! ...Perfect. Now one where you look mysterious. PERFECT.', 'Here, honey: water, glow sticks, and a granola bar I made. You can\'t see the granola bar. It\'s in my heart.'], () => { a.w3photo = true; g2.screenFlash('#ffffff', 0.5); burnsSfx('camera_flash'); g2.glow += 10; g2.player.givePower('water'); g2.toast('+10 GLOW STICKS · MOM APPROVED'); const k = g2.actor('kid'); if (k) k.say('MOM. Please. Stop. Photographing. Strangers.', 2.6); });
      } });
    api.npc({ id: 'kid', name: 'BURNER KID', type: 'burnerkid', seed: 2, x: -4.6, z: 97.6, yaw: -2.0, behavior: 'idle', chatter: true, lines: ['I brought my mom. To the Burn. Please don\'t make it weird.', 'She has two cameras. TWO. She\'s out-partying all of us.'] });
    api.glowLine(-20, 90, -50, 72, 10); api.glowLine(-36, 70, -36, 50, 6); api.glowLine(-30, 40, 30, 40, 14, 0.9); api.glowLine(44, 30, 4, -20, 10);
    api.glowRing(W3.HENGE.x, W3.HENGE.z, 6, 12); api.glowLine(20, -40, 40, -44, 6); api.glowRing(W3.GRAVE.x, W3.GRAVE.z, 16, 16);
    api.glowsticks([[60, 70], [70, 70], [80, 70], [-100, 70], [-110, 70], [100, 96], [110, 96], [-90, 96], [60, 10], [70, 0], [80, -10], [-90, -20], [-100, -30], [-110, -40]]);
    // the First Ride line: glow sticks through the gates, over the loop and off the trailer
    api.glowLine(36, -56, 44, -68, 6); if (S.loop) { api.glowArc(S.loop.x - 4, 1.2, S.loop.z, S.loop.x + 4, 1.2, S.loop.z, 9.5, 9); api.glowArc(S.ramp.x + 1, 3.4, S.ramp.z, S.ramp.x + 11, 1.2, S.ramp.z, 3.5, 7); }
    api.glowLine(90, -96, 54, -105, 9); api.glowLine(48, -100, 37, -80, 5);
    api.glowLine(-80, 84, -45, 84, 7, 0.9); api.glowLine(10, 84, 60, 84, 9, 0.9); api.glowRing(W3.CLINIC.x, W3.CLINIC.z, 7, 10); api.glowArc(28.4, 1.4, -17, 30.2, 8.2, -18, 2.4, 6);
    api.pickup('bag:powder', 86, 0.9, 30); api.pickup('bag:weed', -96, 0.9, 60); api.pickup('bag:shrooms', -40, 0.9, -40); api.pickup('bag:molly', 60, 0.9, 96); api.pickup('bag:liquor', 100, 0.9, -40);
    api.pickup('bag:lsd', -84, 0.9, -8);
    for (const [x, z] of [[-28, 70], [10, 60], [60, -30], [-50, -40], [20, -90], [-90, 30]]) api.pickup('water', x, 0.9, z);
    // LSD-only: a stair of floating rainbow tutus to a photo above the city
    api.hidden(() => { for (let i = 0; i < 7; i++) api.mesh(-92 + i * 2.6, -14 - i * 1.8, m => { m.color(burnsHSL(i * 50, 0.9, 0.62), 0.6); BW.lathe(m, 0, 0, 0, [[0, 0.1], [1.2, 0], [1.3, 0.1], [0.4, 0.3], [0, 0.32]], { seg: 14 }); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.1, y0: 0, y1: 0.3 }] }; }, { y: 1.2 + i * 1.3 }); });
    api.pickup('photo', -92 + 6 * 2.6, 10.4, -14 - 6 * 1.8, { id: 'p3', hidden: true });
    api.marker('cult', W3.CULT.x, W3.CULT.z, 'Costume Cult', { col: '#ff4fd8' });
    api.marker('clinic', W3.CLINIC.x, W3.CLINIC.z, 'Bike Clinic', { col: '#ffd21a' });
    api.marker('semi', W3.SEMI.x, W3.SEMI.z, 'Knotted Semi', { col: '#38f2ff' });
    // a controller that runs after Brady each step (stunt loop + thief catch)
    api.npc({ id: 'w3ctl', name: '', type: 'burner', seed: 1, x: 0, z: 0, y: -60, fixedY: true, behavior: 'w3Ctl', always: true, noTalk: true, chatter: false, collide: false, scale: 0.01 });
  },
  onStart(g) {
    const S = BURNS_W3.state, BW = BURNS_W234;
    BW.wireGear(g);
    BURNS_W3.wire(g);
    g.tod = Math.min(0.85, BurnsSave.tokenCount(3) * 0.13);
    if (!S.introDone) BURNS_W3.intro(g);
    else g.banner('COSTUME CULT', BURNS_W234.costumeOn() ? 'Looking good. Now find some wheels.' : 'Get a disguise. Get a bike.', { col: '#ffe24a' });
  },
  onRespawn(g) { const S = BURNS_W3.state; if (S.stunt) BURNS_W3.stuntEnd(g, true); },
  env(g, env) { const S = BURNS_W3.state; if (S.stunt) env.fogD *= 0.8; },
  update(g, dt) {
    const S = BURNS_W3.state, W3 = BURNS_W3, p = g.player;
    BURNS_W234.update(g, dt);
    W3.cultStep(g, dt);
    W3.huntStep(g, dt);
    W3.furryStep(g, dt);
    if (S.ride) W3.rideStep(g, dt);
    if (S.baron) W3.baronStep(g, dt);
    W3.wheelStep(g, dt);
    const want = Math.min(1, BurnsSave.tokenCount(3) * 0.13);
    if (g.tod < want && g.todTarget === null) g.setTod(want, 0.03);
  },
  drawSkinned(g, R) { BURNS_W234.drawSkinned(g, R); BURNS_W3.drawStunt(g, R); },
  drawSprites(g, R) {
    const S = BURNS_W3.state, SP = BURNS_SPRITES.R, cam = g.cam, t = g.time;
    // the lookouts' sight cones
    for (const a of S.lookoutActors || []) {
      if (a.defeated || a.hidden) continue;
      const d2 = (a.x - cam.x) * (a.x - cam.x) + (a.z - cam.z) * (a.z - cam.z); if (d2 > 60 * 60) continue;
      const L = a.def.view || 9, w = 2 * L * Math.tan(a.def.fov || 0.5), al = a.data.alert || 0;
      R.flat.flat(a.x + Math.sin(a.yaw) * L / 2, a.y + 0.06, a.z + Math.cos(a.yaw) * L / 2, w, L, a.yaw + Math.PI, SP.beam, al > 0.05 ? [1, 0.25, 0.25] : [1, 0.85, 0.3], 0.35 + al * 0.4, true);
    }
    // ribbons flutter
    for (const r of S.ribbons) if (r.on) { for (let k = 0; k < 4; k++) R.bbs.bb(r.x + Math.sin(t * 3 + k) * 0.25, 1.95 - k * 0.22, r.z + Math.cos(t * 2.6 + k) * 0.25, 0.5, 0.18, SP.square, [1, 0.85, 0.1], 1, false, t * 2 + k); R.bbs.bb(r.x, 2.1, r.z, 2.4, 2.4, SP.glow, [1, 0.85, 0.2], 0.6, true); }
    // course gates: the next one pulses
    if (S.ride) { const G = S.gates[S.ride.i]; if (G) R.bbs.bb(G.x, G.y + 2.2, G.z, 6 + Math.sin(t * 6) * 0.6, 6 + Math.sin(t * 6) * 0.6, SP.glow, [0.2, 0.95, 1], 0.55, true); }
    // mister spray at the clinic
    if (S.mister && Math.random() < 0.6) g.fx.add(S.mister.x + (Math.random() - 0.5) * 2.4, 2.6, S.mister.z + (Math.random() - 0.5) * 0.6, (Math.random() - 0.5) * 0.4, -1.2, (Math.random() - 0.5) * 0.4, 0.9, 0.3, 1.4, [0.85, 0.95, 1], 0.35, 'puff', 4);
    // rolling wheels (Baron's projectiles) get a dust trail
    for (const w of S.wheels) if (w.live && Math.random() < 0.5) g.fx.dust(w.x, 0.1, w.z, 1);
  }
});

/* ---------------- the Costume Cult ---------------- */
BURNS_W3.buildCult = function (api, g) {
  const W3 = BURNS_W3, S = W3.state, BW = BURNS_W234, { x: cx, z: cz } = W3.CULT;
  // the Wardrobe: a huge striped tent
  const prof = [[10.6, 0], [10.6, 3.4], [10.6, 3.4]]; for (let k = 1; k <= 8; k++) { const t = k / 8; prof.push([lerp(10.6, 0.35, Math.pow(t, 0.8)), 3.4 + 6.2 * t + Math.sin(t * Math.PI) * 0.7]); }
  api.mesh(cx - 16, cz - 6, m => {
    const reg = BURNS_ATLAS.pattern('rainbow');
    m.color('#ffffff'); m.lathe(prof, { seg: 28, uv: reg, uvRepeat: 6 });
    m.color('#ffd84a').shine(3); BW.ball(m, 0, 10.4, 0, 0.5); BW.limb(m, 0, 9.6, 0, 0, 11.8, 0, 0.06); m.shine(0);
    m.color('#ff4fd8'); m.push(); m.tf(0, 12.0, 0.2); m.extrude([[0, 0], [1.4, 0.35], [0, 0.7]], 0.04); m.pop();
    m.color('#2a1a2a'); BW.rb(m, 10.2, 1.6, 0, 1.2, 3.2, 3.4, 0.3);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 10.4, y0: 0, y1: 4 }, { t: 'cyl', x: 0, z: 0, r: 6, y0: 4, y1: 9 }], lights: [{ x: 0, y: 10.4, z: 0, s: 1.6, c: '#ffd84a' }] };
  }, { yaw: 0 });
  api.sign('THE COSTUME CULT\nALL ARE WELCOME · ALL MUST CHANGE', cx - 4, cz + 12, { h: 1.3, y: 2.4, style: { bg: '#2a0a2a', fg: '#ffe0f4', glow: '#ff4fd8', size: 26, border: '#ffd84a' }, glow: '#ff4fd8' });
  // the fitting room: six costumed mannequins on pedestals (three hogged by sparkle ponies)
  S.manneq = [];
  W3.MANNEQ.forEach((cid, i) => {
    const a = -1.05 + i * 0.42, x = cx + Math.sin(a) * 9, z = cz + 4 + Math.cos(a) * 9, yaw = Math.atan2(cx - x, cz + 4 - z);
    api.cylinder(x, 0, z, 0.9, 0.5, '#f4e8f8', { round: 0.12, gloss: 2 });
    const spec = Object.assign(BurnsRig.bradySpec(cid), { skin: '#ece2d6', skinSh: '#d4c6b6', face: 'kid', hair: { style: 'bald', col: '#ece2d6', hi: '#ece2d6' }, glasses: null, tattoos: false, key: 'w3:mannequin:' + cid });
    api.npc({ id: 'mq_' + cid, name: 'MANNEQUIN', spec, x, z, y: 0.5, fixedY: true, yaw, behavior: 'idle', anim: 'w234pose', lookAt: false, noTalk: true, chatter: false, collide: false, w3pose: i % 3 });
    // a rolling rack behind each mannequin
    const rx = cx + Math.sin(a) * 11.6, rz = cz + 4 + Math.cos(a) * 11.6;
    api.mesh(rx, rz, m => W3.rack(m, i), { yaw: yaw + Math.PI / 2 });
    S.manneq.push({ cid, x, z, yaw });
  });
  // mirrors
  for (let i = 0; i < 4; i++) { const a = -1.3 + i * 0.86, x = cx + Math.sin(a) * 4.2, z = cz + 4 + Math.cos(a) * 4.2; api.mesh(x, z, m => { m.color('#c8a040').shine(3); m.push(); m.tf(0, 1.25, 0, 0, Math.PI / 2, 0, 1, 1, 1.55); m.torus(0, 0, 0, 0.5, 0.06, { seg: 18, tseg: 5 }); m.pop(); m.color('#b8d8f0', 0.35).shine(3); BW.egg(m, 0, 1.25, 0, 0.47, 0.73, 0.03, { seg: 14, rings: 8 }); m.shine(0).emissive(0); m.color('#5a4a3a'); BW.limb(m, 0, 0, -0.2, 0, 0.6, 0, 0.04); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.55, hz: 0.15, y0: 0, y1: 2.0 }] }; }, { yaw: Math.atan2(cx - x, cz + 4 - z) }); }
  // Mother Sequin, cult leader of fabulousness
  api.npc({ id: 'sequin', name: 'MOTHER SEQUIN', type: 'tutu', seed: 5, x: cx, z: cz + 2.4, yaw: 0,
    spec: Object.assign(BurnsRig.npcSpec('tutu', 5), { top: { kind: 'crop', col: '#d8e4ff', pattern: 'disco' }, bottom: { kind: 'tutu', col: '#ff4fd8' }, coat: { kind: 'kimono', col: '#ffd84a', trim: '#ff4fd8' }, hair: { style: 'afro', col: '#ff9ad8', hi: '#ffffff' }, glasses: 'heart', hat: { kind: 'tophat', col: '#ffd84a' }, acc: ['ledNecklace', 'bracelets'], key: 'w3:sequin' }),
    talk(g2, a) {
      const st = g2.missions.state('dress');
      if (st === 'available') g2.say(a, ['Welcome, lost lamb, to the Costume Cult. All are welcome. All must change.', 'A giant wooden man knows your face? Darling, after us, your own MOTHER won\'t know your face.', 'Walk up to any mannequin and TRY ON. Then strut my catwalk and POSE for the judges. Go. Become.'], () => g2.missions.start('dress'));
      else if (st === 'active') g2.say(a, [BURNS_W234.costumeOn() ? 'Yes. YES. Now the catwalk, darling. Strut to the end and POSE.' : 'Darling, that is a black t-shirt. Try on a mannequin\'s look. Any of them. Please.']);
      else g2.say(a, ['You came here a man with a bun. You leave here an EVENT.']);
    } });
  // the catwalk: a raised runway with footlights, an arch, judges, fog machines
  const kx0 = cx - 6, kx1 = cx + 12, kz = cz - 14;
  api.roundBox((kx0 + kx1) / 2, 0, kz, kx1 - kx0, 0.55, 2.6, '#f4f0ff', { r: 0.1, gloss: 2, col: { y1: 0.55 } });
  api.mesh((kx0 + kx1) / 2, kz, m => { const L = kx1 - kx0; m.color('#ff4fd8', 1); for (const s of [-1, 1]) BW.limb(m, -L / 2 + 0.2, 0.42, s * 1.32, L / 2 - 0.2, 0.42, s * 1.32, 0.04); m.color('#ffe24a', 1); for (let i = 0; i < 12; i++) for (const s of [-1, 1]) BW.ball(m, -L / 2 + 0.8 + i * (L - 1.6) / 11, 0.62, s * 1.1, 0.07, { seg: 6, rings: 4 }); m.emissive(0); const lights = []; for (let i = 0; i < 12; i += 2) lights.push({ x: -L / 2 + 0.8 + i * (L - 1.6) / 11, y: 0.65, z: 1.1, s: 0.4, c: '#ffe24a' }); return { lights }; });
  api.mesh(kx0 - 0.4, kz, m => { m.color('#ff4fd8').shine(2); BW.ring(m, 0, 0.55, 0, 2.6, 0.14, { pitch: Math.PI / 2, yaw: Math.PI / 2, seg: 22, tseg: 6 }); m.shine(0); return {}; });
  api.sign('THE RUNWAY', kx0 - 0.5, kz, { h: 0.7, y: 3.3, post: false, yaw: -Math.PI / 2, style: { bg: '#2a0a2a', fg: '#ffd84a', size: 24, border: '#ff4fd8' } });
  S.catwalk = { x0: kx0, x1: kx1, z: kz };
  api.roundBox(kx1 + 4, 0, kz + 3.2, 4.2, 0.95, 1.1, '#2a2a3a', { r: 0.2 });
  ['10', '10', '11'].forEach((n, i) => api.npc({ id: 'judge' + i, name: ['JUDGE GLAMOROUS', 'JUDGE FIERCE', 'JUDGE EXTRA'][i], type: ['influencer', 'furcoat', 'sparklepony'][i], seed: 40 + i, x: kx1 + 2.8 + i * 1.2, z: kz + 4.4, yaw: Math.PI, behavior: 'sit', chatter: false, lines: ['Walk it out. Then come back and walk it out again.', 'I give everything a ten. Except beige. Beige gets a two.'], w3card: n }));
  for (let i = 0; i < 2; i++) for (const s of [-1, 1]) { const x = kx0 + 3 + i * 9, z = kz + s * 2.6; api.roundBox(x, 0, z, 0.8, 0.7, 0.8, '#2a2a30', { r: 0.15 }); }
  S.fog = [[kx0 + 3, kz + 2.6], [kx0 + 12, kz - 2.6], [cx, cz + 4]];
  api.crowd((kx0 + kx1) / 2, kz + 5.5, 2.6, 5, { behaviors: ['dance', 'idle', 'dance'], types: ['burner', 'tutu', 'furcoat', 'sparklepony'] });
  api.crowd((kx0 + kx1) / 2 - 3, kz - 5.5, 2.4, 4, { behaviors: ['dance', 'idle'], types: ['burner', 'tutu', 'ledsuit'] });
  api.light(cx, cz, 26, '#ffb0e0', 0.3);
  api.checkpoint('cp_cult', cx + 14, cz + 6, { yaw: -Math.PI / 2, name: 'Costume Cult' });
  // sparkle ponies hogging racks, Glimmer (good vibes), the greeter pair, Burney, Fuzz the furry
  W3.HOGGED.forEach((cid, i) => { const M = S.manneq.find(q => q.cid === cid); api.npc({ id: 'hog' + i, name: 'SPARKLE PONY', type: 'sparklepony', seed: 20 + i, x: M.x - Math.sin(M.yaw) * 1.4, z: M.z - Math.cos(M.yaw) * 1.4, yaw: M.yaw + Math.PI, behavior: 'idle', anim: 'phone', chat: ['Ugh, we\'re USING this rack.', 'Do you have water? No? Then shoo.', 'I\'m not hogging, I\'m CURATING.'], lines: ['We\'re using this rack. All day. Maybe all week.', 'Talk to Glimmer. She\'s the nice one. She lost a boot.'] }); });
  api.npc({ id: 'glimmer', name: 'GLIMMER', type: 'sparklepony', seed: 29, x: cx + 8, z: cz - 2, yaw: -0.8,
    talk(g2, a) {
      const st = g2.missions.state('vibes');
      if (st === 'available') g2.say(a, ['Hi! I\'m Glimmer! I trade in good vibes. It\'s like money, but sparklier and worth nothing.', 'I lost one of my platform boots. Without it I walk in circles. Literally.', 'Find it and I\'ll get my girls off the racks. And I\'ll give you SO many good vibes.'], () => g2.missions.start('vibes'));
      else if (st === 'active') g2.say(a, ['It\'s silver. And huge. Last time I saw it, I was near the Free Store. Or Narnia.']);
      else g2.say(a, ['Good vibes, transferred! Your aura is at least forty percent shinier.']);
    } });
  const gW = BW.castDef('greeterW', 51, { id: 'grf', name: 'GREETER GLORIA', x: cx - 4, z: cz - 6, yaw: 0.6, chat: ['WELCOME HOME!', 'New look, new you!', 'Twirl for us!'], lines: ['Every time you change, we cheer. That\'s the rule. We made the rule.', 'Welcome home! Again! You look like a whole new person!'] });
  const gM = BW.castDef('greeterM', 52, { id: 'grm', name: 'GREETER GARY', x: cx - 2.6, z: cz - 7, yaw: 0.4, chat: ['WELCOME HOME, NEW YOU!', 'Roll in the dust! In the costume!', 'Look at THIS person!'], lines: ['Brother! Changing costumes is just being born, but with sequins.'] });
  api.npc(gW); api.npc(gM);
  api.npc(Object.assign({ id: 'burney', name: 'BURNEY', type: 'burney', seed: 3, x: cx + 4, z: cz - 9, behavior: 'wander', radius: 5, speed: 1.0, chat: ['Say BURN!', 'Ooh, hold that pose!', 'Got it! Got it! One more!'],
    talk(g2, a) {
      if (a.w3shot) { g2.say(a, ['I\'ve got four thousand photos of today. You\'re in nine hundred of them.']); return; }
      g2.say(a, ['Burney\'s the name, photos are the game! Strike a pose for me, partner!', 'Say BURN!'], () => { a.w3shot = true; g2.screenFlash('#ffffff', 0.55); burnsSfx('camera_flash'); g2.glow += 12; g2.toast('+12 GLOW STICKS · NICE POSE'); g2.player.victoryT = 1.6; });
    } }, BW.engineType('burney') ? {} : { spec: Object.assign(BurnsRig.npcSpec('crusty', 3), { top: { kind: 'button', col: '#2ac8b8', pattern: 'tiedye' }, vest: 'patches', bottom: { kind: 'cargo', col: '#c8b48a' }, shoes: { kind: 'boots', col: '#2a1a12' }, hair: { style: 'bald', col: '#4a8af0', hi: '#4a8af0' }, face: 'beard', glasses: null, goggles: false, hat: { kind: 'cowboy', col: '#e8d49a' }, prop: 'phone', acc: ['bracelets'], key: 'w3:burney' }), w234gear: [['bunnyears', BURNS_BONES.HEAD]] }));
  api.npc(BW.castDef('furry', 4, { id: 'fuzz', name: 'FUZZ', x: cx - 10, z: cz + 13, yaw: -0.5, behavior: 'sit', followDist: 2.6, chat: ['So... hot... in here...', 'Is it hot or is it just my entire body?', 'Hugs! Sweaty hugs!'],
    talk(g2, a) {
      const st = g2.missions.state('furry');
      if (a.w3cool || st === 'done') { g2.say(a, ['I am COOL. I am a cool dog. Thank you, friend. Have a hug. A damp hug.']); return; }
      if (st === 'available') g2.say(a, ['Hiiii. I\'m Fuzz. I\'m a desert fox-hyena. I\'m also about to pass out.', 'Full fursuit. Midday. Nobody warned me. Everybody warned me.', 'There\'s a misting station at the bike clinic. Walk me there? I\'ll follow your shiny shoes.'], () => { g2.missions.start('furry'); a.setBehavior('follow'); });
      else g2.say(a, ['Keep going... I can smell the mist... it smells like hope...']);
    } }));
};
// a rolling costume rack with garments (rounded)
BURNS_W3.rack = function (m, i) {
  const BW = BURNS_W234;
  m.color('#c8c8d0').shine(2); for (const s of [-1, 1]) { BW.limb(m, s * 1.3, 0.15, 0, s * 1.3, 2.0, 0, 0.035); BW.limb(m, s * 1.3, 0.15, -0.3, s * 1.3, 0.15, 0.3, 0.03); } BW.limb(m, -1.35, 2.0, 0, 1.35, 2.0, 0, 0.03); m.shine(0);
  m.color('#1a1a1e'); for (const s of [-1, 1]) for (const t of [-0.3, 0.3]) BW.ball(m, s * 1.3, 0.07, t, 0.07, { seg: 6, rings: 4 });
  const pats = ['fur', 'sequin', 'leopard', 'tiedye', 'disco', 'rainbow', 'flames', 'plaid'];
  for (let k = 0; k < 6; k++) { const x = -1.05 + k * 0.42; m.color(BURNS_NEON[(k + i) % 7]); BW.rb(m, x, 1.35, 0, 0.12, 1.1, 0.5, 0.05, { uv: BURNS_ATLAS.pattern(pats[(k + i) % 8]) }); m.color('#8a8a92'); BW.limb(m, x, 1.92, 0, x, 2.0, 0, 0.012); }
  return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.35, hz: 0.3, y0: 0, y1: 2.0 }] };
};

/* ---------------- bike clinic (Wrench Wanda) + misting station ---------------- */
BURNS_W3.buildClinic = function (api, g) {
  const W3 = BURNS_W3, S = W3.state, BW = BURNS_W234, { x: cx, z: cz } = W3.CLINIC;
  api.prop('shade', { x: cx, z: cz, w: 9, d: 7, col: '#ffd21a', lights: false });
  api.mesh(cx, cz - 3.2, m => {
    m.color('#5a4a3a'); BW.rb(m, 0, 1.2, 0, 7, 2.4, 0.3, 0.06, { uv: BURNS_ATLAS.pattern('wood') });
    m.color('#3a3a40'); for (let i = 0; i < 9; i++) { const x = -3 + (i % 5) * 1.5, y = 0.8 + Math.floor(i / 5) * 1.0; BW.limb(m, x, y, 0.2, x + 0.2, y + 0.45, 0.2, 0.025); }
    for (let i = 0; i < 4; i++) { m.color('#1a1a1e'); BW.ring(m, -2.6 + i * 1.7, 2.2, 0.32, 0.34, 0.04, { pitch: Math.PI / 2, seg: 14, tseg: 4 }); m.color('#c8c8d0'); BW.ball(m, -2.6 + i * 1.7, 2.2, 0.32, 0.05, { seg: 6, rings: 4 }); }
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 3.5, hz: 0.2, y0: 0, y1: 2.4 }] };
  });
  for (let i = 0; i < 3; i++) api.mesh(cx - 3 + i * 3, cz + 0.6, m => { m.color('#3a3a40'); BW.limb(m, 0, 0, 0, 0, 1.1, 0, 0.04); BW.limb(m, -0.3, 0, 0, 0.3, 0, 0, 0.04); m.push(); m.tf(0, 0.35, 0); BW.bike(m, BURNS_NEON[i * 2], { lo: true }); m.pop(); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.2, hz: 0.9, y0: 0, y1: 1.4 }] }; }, { yaw: Math.PI / 2 });
  api.sign('THE SPOKE-N-WORD\nBIKE CLINIC', cx + 5.5, cz + 4.2, { h: 1.1, yaw: -0.5, style: { bg: '#ffd21a', fg: '#1a1a10', size: 24, border: '#1a1a10' } });
  // misting station arch
  const mx = cx + 6, mz = cz + 10; S.mister = { x: mx, z: mz };
  api.mesh(mx, mz, m => { m.color('#c8c8d0').shine(2); BW.ring(m, 0, 0, 0, 1.6, 0.08, { pitch: Math.PI / 2, seg: 18, tseg: 5 }); m.shine(0); m.color('#7ad8ff', 0.5); for (let i = 0; i < 6; i++) BW.ball(m, -1.2 + i * 0.48, 1.5, 0, 0.06, { seg: 6, rings: 4 }); m.emissive(0); return { lights: [] }; });
  api.sign('MISTING\nSTATION', mx + 2.4, mz, { h: 0.8, yaw: -Math.PI / 2, style: { bg: '#7ad8ff', fg: '#0a2a3a', size: 22 } });
  api.npc({ id: 'wanda', name: 'WRENCH WANDA', type: 'dpw', seed: 12, x: cx - 1, z: cz - 1, yaw: Math.PI,
    spec: Object.assign(BurnsRig.npcSpec('burner', 12), { top: { kind: 'tank', col: '#ffd21a' }, bottom: { kind: 'cargo', col: '#4a4a3a' }, shoes: { kind: 'boots', col: '#2a1a12' }, vest: null, coat: null, hat: { kind: 'bandana', col: '#3a6ad8' }, hair: { style: 'pony', col: '#2a1a12', hi: '#5a3a2a' }, face: 'friendly', goggles: false, glasses: null, beard: null, led: null, paint: null, acc: ['toolbelt', 'bracelets'], prop: null, body: { h: 0.96, w: 1.0 }, key: 'w3:wanda' }),
    talk(g2, a) {
      const h = g2.missions.state('hunt'), f = g2.missions.state('flat');
      if (g2.missions.state('vibe') !== 'done') g2.say(a, ['Can\'t talk, honey, those lookouts have been sniffing around my clinic all day. Lose them first.']);
      else if (h === 'available') g2.say(a, ['You snuck past those wooden-mask weirdos? Respect.', 'You need wheels. Yellow bikes are community bikes: ride one, leave it for the next burner.', 'I tied yellow ribbons out to where I saw one this morning. Follow the ribbons.'], () => g2.missions.start('hunt'));
      else if (h === 'active') g2.say(a, ['Follow the yellow ribbons, sugar. Out past the clinic, onto the open playa.']);
      else if (f === 'available') g2.say(a, ['A flat? Classic yellow bike. Patch kits live at the Free Store, and the last pump went up a stack of bike boxes. Don\'t ask.', 'Bring both to the bike and patch it right there. I believe in you. I\'ve seen you sneak.'], () => g2.missions.start('flat'));
      else if (f === 'active') g2.say(a, ['Patch kit from the Free Store, pump from the box tower. Then fix it at the Henge.']);
      else g2.say(a, ['Ride safe. Ring your bell. Lock nothing. Love everything.']);
    } });
  api.checkpoint('cp_clinic', cx - 7, cz + 6, { yaw: Math.PI, name: 'Bike Clinic' });
  api.pickup('water', cx + 3, 0.9, cz + 4);
};

/* ---------------- the Knotted Semi + First Ride course ----------------
   Uses the shared big-art module when present (BurnsBigArt.place, docs/BURNS_BIGART.md);
   otherwise an original stand-in: a semi cab with its trailer twisted up into a loop,
   then a straight trailer ramp. S.loop / S.ramp describe the stunt geometry. */
BURNS_W3.buildSemi = function (api, g) {
  const W3 = BURNS_W3, S = W3.state, BW = BURNS_W234, { x: sx, z: sz } = W3.SEMI;
  let gates;
  if (typeof BurnsBigArt !== 'undefined' && BurnsBigArt.kinds && BurnsBigArt.kinds.knottedSemi) {
    // the big-art Knotted Semi: its own loop-de-loop ride, launch kicker, ring of fire and summit.
    // Travel runs west -> east (+X): rotY = PI/2 maps the piece's +Z onto +X.
    const P = BurnsBigArt.place(api, g, 'knottedSemi', sx, sz, { rotY: Math.PI / 2 });
    S.semiP = P; S.loop = null; S.ramp = null;
    // workaround: the piece's swung-open rear-door panels poke into the bike entry lane; switch those two thin colliders off
    for (const c of P.cols || []) { const q = P.toLocal(c.x, c.z); if (c.t === 'box' && c.hx < 0.1 && c.hz < 0.8 && Math.abs(q[1] + 21) < 1.2 && Math.abs(q[0] + 2.4) < 1.6) c.off = true; }
    const sp = P.spots, w = (lx, lz) => P.toWorld(lx, 0, lz);
    const doors = w(-2.4, -24), exit = w(2.4, 6), back = w(0, 46);
    gates = [[36, -56], [doors[0], doors[2]], [exit[0], exit[2]], [sp.hoop[0], sp.hoop[2]], [sp.landing[0], sp.landing[2]], [back[0], back[2]], [40, -62]];
    S.gateNeeds = { 2: 'looped', 3: 'launched' };
    api.pickup('photo', sp.cabRoof[0], sp.cabRoof[1] + 0.9, sp.cabRoof[2], { id: 'p2' });
  } else {
    BURNS_W3.buildSemiStandIn(api, g);
    gates = [[40, -50], [S.loop.x - 7, S.loop.z], [S.loop.x + 7, S.loop.z], [S.ramp.x + 12, S.ramp.z], [90, -100], [50, -106], [36, -76]];
    S.gateNeeds = { 2: 'looped' };
  }
  // course gates (rounded arches): start -> loop -> launch -> around and home
  gates.forEach(([x, z], i) => {
    const nx = gates[(i + 1) % gates.length], yaw = Math.atan2(nx[0] - x, nx[1] - z) + Math.PI / 2;
    if (S.semiP && i === 3) { S.gates.push({ x, z, y: 0, i }); return; }   // the ring of fire is the gate
    api.mesh(x, z, m => { m.color(i === gates.length - 1 ? '#ffd84a' : '#38f2ff', 0.55); BW.ring(m, 0, 0, 0, 3.0, 0.16, { pitch: Math.PI / 2, seg: 22, tseg: 6 }); m.emissive(0); m.color('#3a3a40'); BW.post(m, -3.0, 0, 0, 0.14, 0.5); BW.post(m, 3.0, 0, 0, 0.14, 0.5); return { lights: [{ x: 0, y: 3.0, z: 0, s: 1.2, c: '#38f2ff' }] }; }, { yaw });
    S.gates.push({ x, z, y: 0, i });
  });
  api.npc({ id: 'spokes', name: 'COACH SPOKES', type: 'burner', seed: 66, x: 33, z: -52, yaw: 1.2,
    spec: Object.assign(BurnsRig.npcSpec('burner', 66), { top: { kind: 'tank', col: '#38f2ff' }, bottom: { kind: 'shorts', col: '#1a1a24' }, hat: { kind: 'cap', col: '#ffd21a' }, glasses: 'visor', goggles: false, beard: null, coat: null, led: null, paint: null, acc: ['bracelets'], prop: 'bell', key: 'w3:spokes' }),
    talk(g2, a) {
      const st = g2.missions.state('ride');
      if (st === 'locked') g2.say(a, ['No bike, no course, friend. Rules of the road. Well. Rules of the dirt.']);
      else if (st === 'available') { if (!g2.hasItem('bike')) { g2.say(a, ['You need a bike first.']); return; } g2.say(a, ['First Ride! Seven gates. In the back of the Knotted Semi, round the loop-de-loop, up the trailer and through the ring of fire.', 'Hit the BIKE button to hop on. Go FAST into the loop. Sixty seconds. DING DING!'], () => g2.missions.start('ride')); }
      else if (st === 'active') g2.say(a, ['Pedal, pedal, PEDAL!']);
      else g2.say(a, ['Best first ride I\'ve seen since the guy who rode a unicycle into a dome.']);
    } });
  api.checkpoint('cp_semi', 30, -46, { yaw: Math.PI / 2, name: 'The Knotted Semi' });
  api.light(sx, sz, 24, '#ffe0b0', 0.3);
};
// stand-in Knotted Semi (only used when the big-art module is missing)
BURNS_W3.buildSemiStandIn = function (api, g) {
  const W3 = BURNS_W3, S = W3.state, BW = BURNS_W234, { x: sx, z: sz } = W3.SEMI;
  const yaw0 = Math.PI / 2;
  api.mesh(sx - 4, sz - 8.5, m => {
    m.color('#c8202a').shine(2); BW.rb(m, 0, 1.9, 0.6, 2.6, 2.6, 3.0, 0.45); BW.rb(m, 0, 1.4, 2.4, 2.5, 1.6, 1.4, 0.4); m.shine(0);
    m.color('#d8dce8').shine(3); BW.rb(m, 0, 1.3, 3.15, 1.8, 1.0, 0.12, 0.05); for (const s of [-1, 1]) { BW.limb(m, s * 1.25, 1.2, -0.6, s * 1.25, 4.4, -0.6, 0.12); } m.shine(0);
    m.color('#101014'); for (const zz of [2.1, -0.6]) for (const s of [-1, 1]) { m.push(); m.tf(s * 1.25, 0.55, zz, 0, 0, Math.PI / 2); m.roundCyl(0, -0.25, 0, 0.55, 0.5, 0.12, { seg: 14 }); m.pop(); }
    return { cols: [{ t: 'box', x: 0, z: 1.2, hx: 1.3, hz: 2.1, y0: 0, y1: 3.2, cover: true }] };
  }, { yaw: Math.PI });
  const lx = sx - 4, lr = 5.2;
  api.mesh(lx, sz, m => {
    m.color('#e8e8f0').shine(2); m.push(); m.tf(0, lr + 0.6, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, lr + 0.5, 0.55, { seg: 32, tseg: 8 }); m.pop(); m.shine(0);
    m.color('#ff4fd8', 1); m.push(); m.tf(0, lr + 0.6, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, lr + 0.05, 0.08, { seg: 32, tseg: 4 }); m.pop(); m.emissive(0);
    return { cols: [], lights: [{ x: 0, y: lr * 2 + 1.1, z: 0, s: 1.6, c: '#ff4fd8' }] };
  });
  const rx = sx + 7;
  api.mesh(rx, sz, m => { m.color('#e8e8f0').shine(1); m.push(); m.tf(0, 1.3, 0, 0, -0.27, 0); BW.rb(m, 0, 0, 0, 2.6, 0.3, 9.0, 0.1, { uv: BURNS_ATLAS.pattern('swoosh') }); m.pop(); m.shine(0); return { cols: [{ t: 'ramp', x: 0, z: 0, hx: 1.3, hz: 4.5, y0: 0, ya: 0.1, yb: 2.6 }] }; }, { yaw: yaw0 });
  S.loop = { x: lx, y: lr + 0.6, z: sz, r: lr, yaw: yaw0 }; S.ramp = { x: rx + 4.3, z: sz, yaw: yaw0, y: 2.6 };
  api.pickup('photo', S.loop.x + 0.3, S.loop.y + S.loop.r - 1.1, S.loop.z, { id: 'p2' });
};

/* ---------------- the Bike Graveyard (boss arena) ---------------- */
BURNS_W3.buildGrave = function (api, g) {
  const W3 = BURNS_W3, S = W3.state, BW = BURNS_W234, { x: gx, z: gz } = W3.GRAVE, R = api.rng;
  // heaps of stolen bikes around the edge (cover for wheel throws)
  for (let i = 0; i < 9; i++) {
    const a = i / 9 * TAU + 0.2, x = gx + Math.sin(a) * 19, z = gz + Math.cos(a) * 19;
    api.mesh(x, z, m => { for (let k = 0; k < 5; k++) { m.push(); m.tf(R.range(-1.2, 1.2), 0.3 + k * 0.32, R.range(-1, 1), R() * TAU, 0, 1.2 + R.range(-0.2, 0.2)); BW.bike(m, R() < 0.6 ? '#ffd21a' : R.pick(BURNS_NEON), { lo: true }); m.pop(); } return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.6, y0: 0, y1: 1.8, cover: true }] }; }, { yaw: a });
  }
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.8, x = gx + Math.sin(a) * 9, z = gz + Math.cos(a) * 9; api.mesh(x, z, m => { m.color('#9a9aa2').shine(2); for (let k = 0; k < 4; k++) m.torus(-1.2 + k * 0.8, 0.5, 0, 0.45, 0.04, { seg: 12, tseg: 4 }); BW.limb(m, -1.7, 0.1, 0, 1.7, 0.1, 0, 0.05); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.7, hz: 0.25, y0: 0, y1: 0.95 }] }; }, { yaw: a + Math.PI / 2 }); }
  api.sign('BIKE GRAVEYARD\nNO RETURNS', gx + 4, gz + 23, { h: 1.1, yaw: 0.2, style: { bg: '#1a1a1a', fg: '#ffd21a', size: 24, border: '#ffd21a' } });
  api.checkpoint('cp_grave', gx + 10, gz + 22, { yaw: Math.PI, name: 'Bike Graveyard' });
  api.pickup('water', gx - 12, 0.9, gz + 8); api.pickup('water', gx + 12, 0.9, gz - 8);
  // the Baron's tall bike (mover) + the Baron (actor positioned by baronStep)
  S.tallMv = api.mover(m => W3.tallBike(m), {}); S.tallMv.noCollide = true; S.tallMv.x = gx; S.tallMv.z = gz - 10;
  api.enemy({ id: 'baron', name: 'BARON VON SPOKES', type: 'crusty', seed: 70, x: gx, z: gz - 10, y: 3.2, fixedY: true, behavior: 'w3Baron', hp: 3, boss: true, collide: false, chatter: false, always: true,
    spec: Object.assign(BurnsRig.npcSpec('burner', 70), { top: { kind: 'button', col: '#f4f0e8' }, bottom: { kind: 'chinos', col: '#3a2a3a' }, shoes: { kind: 'boots', col: '#1a1a1a' }, coat: { kind: 'pirate', col: '#3a1a3a', trim: '#ffd21a' }, hat: { kind: 'tophat', col: '#1a1a1a' }, goggles: true, glasses: null, face: 'smug', hair: { style: 'long', col: '#e8e8e8', hi: '#ffffff' }, beard: { col: '#f0f0f0', len: 0.08 }, led: null, paint: null, acc: ['ledNecklace'], key: 'w3:baron' }) });
  // wheel projectiles (a small pool of movers)
  for (let i = 0; i < 6; i++) { const mv = api.mover(m => { m.color('#18181c'); BW.ring(m, 0, 0, 0, 0.42, 0.06, { roll: Math.PI / 2, seg: 16, tseg: 5 }); m.color('#ffd21a'); BW.ring(m, 0, 0, 0, 0.3, 0.025, { roll: Math.PI / 2, seg: 14, tseg: 3 }); m.color('#c8c8d0'); BW.ball(m, 0, 0, 0, 0.06); return {}; }, {}); mv.noCollide = true; mv.visible = false; S.wheels.push({ mv, live: false, x: 0, z: 0 }); }
  api.trigger({ x: gx, z: gz, r: 17, onEnter: g2 => BURNS_W3.bossIntro(g2) });
};
BURNS_W3.tallBike = function (m) {
  const BW = BURNS_W234, wr = 0.38;
  for (const z of [0.62, -0.6]) { m.color('#18181c'); BW.ring(m, 0, wr, z, wr - 0.03, 0.04, { roll: Math.PI / 2, seg: 16, tseg: 5 }); }
  m.color('#ff4fd8').shine(2);
  BW.limb(m, 0, wr, -0.6, 0, 1.6, -0.1, 0.05); BW.limb(m, 0, wr, 0.62, 0, 1.7, 0.3, 0.05); BW.limb(m, 0, 1.6, -0.1, 0, 1.7, 0.3, 0.05);
  BW.limb(m, 0, 1.6, -0.1, 0, 2.9, -0.15, 0.05); BW.limb(m, 0, 1.7, 0.3, 0, 3.1, 0.38, 0.05); BW.limb(m, 0, 2.9, -0.15, 0, 3.1, 0.38, 0.045);
  m.color('#ffd21a'); BW.limb(m, 0, wr, -0.6, 0, 2.9, -0.15, 0.03);
  m.shine(0); m.color('#26262a'); BW.egg(m, 0, 3.0, -0.18, 0.09, 0.04, 0.15);
  m.color('#c8c8d0').shine(2); BW.limb(m, -0.3, 3.25, 0.4, 0.3, 3.25, 0.4, 0.02); m.shine(0);
  m.color('#ffd21a'); m.push(); m.tf(0, 3.0, -0.3); m.extrude([[0, 0], [0, 1.4], [0.7, 1.1]], 0.02); m.pop();
  m.color('#ff3b5c', 1); BW.ball(m, 0, 3.6, -0.3, 0.08); m.emissive(0);
  return { cols: [], lights: [{ x: 0, y: 3.6, z: -0.3, s: 0.8, c: '#ff3b5c', blink: 4 }] };
};

/* ---------------- day-city lot ---------------- */
BURNS_W3.lot = function (api, x, z, yaw, seed, allowNpc) {
  const r = mulberry32(seed), BW = BURNS_W234, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const L = (a, b) => [x + rx * a + fx * b, z + rz * a + fz * b];
  const kind = r.weighted([['rv', 3], ['dome', 2], ['tents', 1.5], ['lounge', 1.6], ['art', 0.8]]);
  let n = 0;
  const crowd = (a, b, k, beh) => { if (!allowNpc || r() > 0.5) return; const [cx, cz] = L(a, b); for (let i = 0; i < k; i++) { api.npc({ type: r.pick(['burner', 'tutu', 'furcoat', 'sparklepony', 'ledsuit', 'burner']), seed: Math.floor(r() * 1e6), x: cx + r.range(-1.5, 1.5), z: cz + r.range(-1.5, 1.5), yaw: r() * TAU, behavior: beh || r.pick(['idle', 'dance', 'sit', 'wander']), style: Math.floor(r() * 6), radius: 3, ambient: true }); n++; } };
  if (kind === 'rv') {
    const [vx, vz] = L(r.range(-1.5, 1.5), -2.8); api.prop(r.pick(['rv', 'van', 'camper', 'boxtruck', 'bus']), { x: vx, z: vz, yaw: yaw + Math.PI / 2, seed });
    const [sx, sz] = L(0, 1.6); api.prop('shade', { x: sx, z: sz, w: 5, d: 3.6, col: r.pick(['#f4e2c0', '#c8e0f0', '#f0c8d8', '#d8f0c8']), lights: false });
    const [cx, cz] = L(r.range(-1.2, 1.2), 1.2); api.prop('couch', { x: cx, z: cz, yaw: yaw + Math.PI, col: r.pick(['#8a2a5a', '#2a5a8a', '#6a4a2a']) });
    crowd(0, 2.2, 2);
  } else if (kind === 'dome') {
    const rr = 3.6 + r() * 1.6, [dx, dz] = L(0, -1); api.prop('dome', { x: dx, z: dz, r: rr, col: r.pick(['#f4f0e8', '#e8d8f0', '#d8e8f0']) });
    crowd(0, 3.4, 2, 'dance');
  } else if (kind === 'tents') {
    for (let i = 0; i < 3; i++) { const [tx, tz] = L(-3.5 + i * 3.5, r.range(-2.4, 0.4)); api.mesh(tx, tz, m => BW.tent(m, { r: 1.1 + r() * 0.4, col: r.pick(['#3a8a6a', '#3a6aaa', '#aa5a3a', '#c8a03a', '#d84a8a']) }), { yaw: yaw + r.range(-0.5, 0.5) }); }
  } else if (kind === 'lounge') {
    const [cx, cz] = L(0, 0), c = r.pick(['#ff9ad8', '#9adcff', '#ffe28a', '#c8a0ff']);
    api.mesh(cx, cz, m => { m.color('#4a3a3a'); BW.post(m, 0, 0, 0, 0.09, 3.1); m.color(c); BW.lathe(m, 0, 2.5, 0, [[0.1, 0.9], [3.0, 0], [3.0, 0], [2.8, 0.08], [0.2, 0.95], [0, 1.0]], { seg: 16 }); const cols = [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: 3.4, camPass: true }]; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.4, bx = Math.sin(a) * 1.8, bz = Math.cos(a) * 1.8; m.color(r.pick(BURNS_NEON)); BW.egg(m, bx, 0.32, bz, 0.62, 0.36, 0.62, { seg: 10, rings: 6 }); cols.push({ t: 'cyl', x: bx, z: bz, r: 0.55, y0: 0, y1: 0.55 }); } return { cols }; }, { yaw });
    crowd(0, 0.4, 2, 'sit');
  } else {
    const [ax, az] = L(0, 0), c = r.pick(BURNS_NEON);
    api.mesh(ax, az, m => { m.color(c).shine(2); BW.ring(m, 0, 2.2, 0, 1.8, 0.2, { pitch: Math.PI / 2, seg: 22, tseg: 7 }); m.shine(0); m.color('#3a3a40'); BW.post(m, -1.8, 0, 0, 0.14, 0.9); BW.post(m, 1.8, 0, 0, 0.14, 0.9); return {}; }, { yaw });
  }
  return n;
};

/* ---------------- runtime wiring ---------------- */
BURNS_W3.labels = function (g, mission, label) { for (const P of g.pickups.items) if (P.mission === mission && label) P.label = label; };
BURNS_W3.wire = function (g) {
  const S = BURNS_W3.state, BW = BURNS_W234, W3 = BURNS_W3;
  S.lookoutActors = g.actors.filter(a => a.def.w3mask);
  const mask = BW.attModel('manmask', m => { m.color('#c89a6a'); BW.lathe(m, 0, 0.0, 0.03, [[0, 0], [0.2, 0.2], [0, 0.42]], { seg: 4 }); m.color('#ff6ad0', 0.8); BW.lathe(m, 0, 0.12, 0.2, [[0, 0], [0.05, 0.06], [0, 0.12]], { seg: 4 }); m.emissive(0); });
  for (const a of S.lookoutActors) BW.attach(a, mask, BURNS_BONES.HEAD);
  if (!BW.engineType('burney')) { const b = g.actor('burney'); if (b) BW.attach(b, BW.attModel('bunnyears', m => { m.color('#e8d49a'); for (const s of [-1, 1]) { m.push(); m.tf(s * 0.08, 0.5, -0.02, 0, 0, -s * 0.18); BW.egg(m, 0, 0.18, 0, 0.055, 0.2, 0.03); m.color('#ff9ad0'); BW.egg(m, 0, 0.18, 0.02, 0.03, 0.14, 0.015); m.color('#e8d49a'); m.pop(); } m.color('#4a8af0'); BW.egg(m, 0, 0.1, 0.19, 0.12, 0.035, 0.03); }), BURNS_BONES.HEAD); }
  // judges' score cards
  for (let i = 0; i < 3; i++) { const a = g.actor('judge' + i); if (a) BW.attach(a, BW.attModel('sign:card' + a.def.w3card, m => { const reg = BURNS_ATLAS.sign(a.def.w3card, { bg: '#ffffff', fg: '#1a1a1a', size: 30, pad: 6 }); m.color('#8a6a3a'); BW.limb(m, 0, -0.05, 0.03, 0, 0.35, 0.03, 0.012); m.color('#ffffff'); BW.rb(m, 0, 0.45, 0.03, 0.3, 0.24, 0.02, 0.01); m.decal(0, 0.45, 0.045, 0.26, 0.2, reg); m.push(); m.tf(0, 0, 0.06, Math.PI); m.decal(0, 0.45, 0.045, 0.26, 0.2, reg); m.pop(); }), BURNS_BONES.PROP, () => S.scoreT > 0); }
  // mannequin poses
  for (const q of S.manneq) { const a = g.actor('mq_' + q.cid); if (a) { a.ch.play('w234pose', { style: a.def.w3pose }); a.def.anim = 'w234pose'; } }
  // interactables: try-on at every mannequin, pose at the end of the catwalk, fix the bike
  g.interactables = g.interactables || [];
  for (const q of S.manneq) g.interactables.push({ x: q.x - Math.sin(q.yaw) * 1.0, z: q.z - Math.cos(q.yaw) * 1.0, r: 2.0, label: 'TRY ON', when: () => true, fn: g2 => W3.tryOn(g2, q.cid) });
  g.interactables.push({ x: S.catwalk.x1 - 0.8, z: S.catwalk.z, y: 0.55, r: 1.8, label: 'POSE', when: g2 => g2.missions.state('dress') === 'active' && g2.player.y > 0.4, fn: g2 => W3.pose(g2) });
  g.interactables.push({ x: W3.HENGE.x + 0.6, z: W3.HENGE.z + 1.4, r: 2.4, label: 'FIX', when: g2 => g2.missions.state('flat') === 'active' && g2.missions.get('flat').n >= 2, fn: g2 => W3.fixBike(g2) });
  // story state on revisit
  if (g.missions.isDone('vibes')) W3.clearRacks(g, true);
  if (g.missions.isDone('furry')) { const f = g.actor('fuzz'); if (f) { f.w3cool = true; f.x = S.mister.x - 2; f.z = S.mister.z; f.setBehavior('dance'); } }
  if (g.hasItem('bike')) { S.bikeMv.visible = false; }
  else if (g.missions.isDone('flat')) { S.bikeMv.roll = 0; }
  if (g.missions.isDone('hunt')) for (const r of S.ribbons) r.on = false;
  const baron = g.actor('baron'); if (baron && g.missions.isDone('boss')) { baron.hidden = true; S.tallMv.visible = false; }
  const thief = g.actor('thief'); void thief;
};

/* ---------------- costume chooser + catwalk ---------------- */
BURNS_W3.tryOn = function (g, cid) {
  const S = BURNS_W3.state;
  if (BURNS_W3.HOGGED.indexOf(cid) >= 0 && !S.racksFree) { const h = g.actors.find(a => a.id && a.id.indexOf('hog') === 0 && Math.hypot(a.x - g.player.x, a.z - g.player.z) < 4); if (h) h.say(['Ugh! We\'re USING this one.', 'Curating! We\'re CURATING!', 'Talk to Glimmer. She\'s the nice one.'][Math.floor(Math.random() * 3)], 2); else g.toast('A SPARKLE PONY IS HOGGING THIS LOOK'); burnsSfx('bump'); return; }
  const c = BURNS_COSTUMES.find(k => k.id === cid);
  BurnsSave.setCostume(cid); g.player.rebuildModel();
  g.giveItem('costumes', true);
  const p = g.player; g.fx.smoke(p.x, p.y + 0.5, p.z, 14, '#ffe0f4'); g.fx.confetti(p.x, p.y + 2, p.z, 30); burnsSfx('costume');
  g.banner(c ? c.name.toUpperCase() : 'NEW LOOK', (c ? c.desc : '') + ' (Wardrobe unlocked)', { col: c ? c.col : '#ff4fd8' });
  for (const id of ['grf', 'grm']) { const a = g.actor(id); if (a) { a.say(['WELCOME HOME, NEW YOU!', 'LOOK AT THIS PERSON!', 'TWIRL! TWIRL!'][Math.floor(Math.random() * 3)], 2); a.ch.play('cheer'); } }
  const b = g.actor('burney'); if (b && Math.hypot(b.x - p.x, b.z - p.z) < 18) { b.say('Say BURN! *click*', 1.6); g.screenFlash('#ffffff', 0.35); burnsSfx('camera_flash', { vol: 0.5 }); }
  if (g.missions.state('dress') === 'active') g.toast('NOW STRUT THE CATWALK AND POSE!');
};
BURNS_W3.cultStep = function (g, dt) {
  const S = BURNS_W3.state, p = g.player;
  if (S.scoreT > 0) S.scoreT -= dt;
  // fog machines puff when Brady is nearby
  if (Math.hypot(p.x - BURNS_W3.CULT.x, p.z - BURNS_W3.CULT.z) < 45) { S.fogT = (S.fogT || 0) - dt; if (S.fogT <= 0) { S.fogT = 0.18; const f = S.fog[Math.floor(Math.random() * S.fog.length)]; g.fx.smoke(f[0], 0.7, f[1], 2, '#f4e8ff'); } }
  // strutting the catwalk: the strut animation while up on the runway
  const C = S.catwalk, onRunway = p.y > 0.45 && p.y < 0.9 && p.x > C.x0 && p.x < C.x1 && Math.abs(p.z - C.z) < 1.4;
  if (onRunway && !S.posing && Math.hypot(p.vx, p.vz) > 1.5 && p.grounded) p.animOverride = 'w234strut'; else if (p.animOverride === 'w234strut') p.animOverride = null;
  if (S.posing) { S.posing -= dt; if (S.posing <= 0) { S.posing = 0; p.animOverride = null; p.locked = false; } }
};
BURNS_W3.pose = function (g) {
  const S = BURNS_W3.state, p = g.player;
  if (!BURNS_W234.costumeOn()) { const j = g.actor('judge0'); g.say(j || 'brady', ['Darling. That is a black t-shirt and black jeans. On a RUNWAY.', 'Come back when you are wearing an IDEA.']); return; }
  S.posing = 2.6; p.locked = true; p.animOverride = 'w234pose'; p.ch.play('w234pose', { style: Math.floor(Math.random() * 3) }); S.scoreT = 4;
  g.screenFlash('#ffffff', 0.5); burnsSfx('camera_flash'); burnsSfx('crowd_cheer'); g.fx.confetti(p.x, p.y + 2.2, p.z, 40);
  g.banner('10 · 10 · 11', 'The judges have spoken. You are unrecognizable!', { col: '#ff4fd8', big: true });
  BURNS_W234.timer(1.8, g2 => { if (g2.missions.state('dress') === 'active') g2.missions.complete('dress', { x: p.x - 1.5, y: 1.6, z: p.z }); });
};
BURNS_W3.clearRacks = function (g, quiet) {
  const S = BURNS_W3.state; S.racksFree = true;
  for (let i = 0; i < 3; i++) { const a = g.actor('hog' + i); if (a) { if (!quiet) g.fx.smoke(a.x, 1, a.z, 8, '#ffe0f4'); a.setBehavior('dance'); a.home = { x: BURNS_W3.CULT.x + 14 + i * 1.5, z: BURNS_W3.CULT.z + 12, y: 0, yaw: 0 }; a.x = a.home.x; a.z = a.home.z; a.def.lines = ['Good vibes only! The racks are all yours, bun-man.']; if (!quiet) a.say('Fiiine. The racks are yours. Good vibes!', 2.4); } }
};

BURNS_W3.vibeStart = function (g) {
  const p = g.player; p.teleport(-34, 0, 42, Math.PI / 2); g.camYaw = Math.PI / 2; g.snapCam = true;
  BURNS_W3.resetLookouts(g);
  g.banner('VIBE CHECK', 'Reach the bike clinic without being seen.', { col: '#ff9ad8' });
};
BURNS_W3.vibeReset = function (g) { BURNS_W3.resetLookouts(g); const p = g.player; p.teleport(-38, 0, 46, Math.PI / 2); g.toast('BACK TO THE START OF THE LINE'); };
BURNS_W3.resetLookouts = function (g) { for (const a of BURNS_W3.state.lookoutActors || []) { a.data.chasing = false; a.data.alert = 0; a.data.i = 0; const P0 = a.def.path[0]; a.x = P0[0]; a.z = P0[1]; a.vx = a.vz = 0; } };
BURNS_W3.vibesDone = function (g) {
  BURNS_W3.clearRacks(g, false);
  const a = g.actor('glimmer');
  g.say(a || 'brady', ['MY BOOT! My beautiful, impractical boot! I can walk in straight lines again!', 'Girls! Off the racks! This bun-man has GOOD VIBES. And here, take some of mine.'], () => { g.player.givePower('molly'); g.glow += 15; g.toast('+15 GLOW STICKS · ALL COSTUME RACKS OPEN'); });
};
BURNS_W3.loopCheck = function (g) {
  const S = BURNS_W3.state, L = S.loop, p = g.player, b = g.bike;
  if (S.stunt || !b || p.vehicle !== b || !L || g.cine) return;
  const fx = Math.sin(L.yaw), fz = Math.cos(L.yaw), ex = L.x - fx * 5.2, ez = L.z - fz * 5.2;
  if (Math.hypot(p.x - ex, p.z - ez) < 2.2 && b.speed > 6.5 && Math.cos(BurnsM.wrap(b.yaw - L.yaw)) > 0.6) BURNS_W3.stuntStart(g);
  else if (Math.hypot(p.x - ex, p.z - ez) < 2.2 && b.speed <= 6.5 && !S.slowWarn) { S.slowWarn = true; g.toast('FASTER! You need speed for the loop'); BURNS_W234.timer(3, () => { S.slowWarn = false; }); }
};

/* ---------------- ribbons, the yellow bike, the thief ---------------- */
BURNS_W3.ribbon = function (g, i) {
  const S = BURNS_W3.state; S.ribbon = i;
  for (const r of S.ribbons) r.on = r.i === i;
  const r = S.ribbons[i]; if (r) { const m = g.missions.get('hunt'); if (m) m.data.marker = null; g.missions.get('hunt').def.marker = { x: r.x, z: r.z }; }
};
BURNS_W3.huntStep = function (g, dt) {
  const S = BURNS_W3.state, p = g.player;
  if (g.missions.state('hunt') === 'active' && S.ribbon !== undefined) {
    const r = S.ribbons[S.ribbon];
    if (r && Math.hypot(p.x - r.x, p.z - r.z) < 3.2) {
      g.fx.burst(r.x, 2, r.z, 'star', 10, '#ffd21a'); burnsSfx('pick');
      if (S.ribbon < S.ribbons.length - 1) { BURNS_W3.ribbon(g, S.ribbon + 1); g.toast(['A YELLOW RIBBON! THERE\'S ANOTHER ONE OUT THERE', 'ANOTHER RIBBON! KEEP GOING', 'RIBBON! THE PLAYA IS SPEAKING', 'ONE MORE RIBBON...'][S.ribbon - 1] || 'RIBBON!'); }
      else { for (const q of S.ribbons) q.on = false; BURNS_W3.foundBike(g); }
    }
  }
  if (S.thiefRun) BURNS_W3.thiefStep(g, dt);
};
BURNS_W3.foundBike = function (g) {
  const { x: hx, z: hz } = BURNS_W3.HENGE;
  g.cutscene([
    { cam: { x: hx + 4, y: 2.2, z: hz + 6, tx: hx + 0.6, ty: 0.6, tz: hz + 1.4, fov: 0.75 } },
    { say: ['brady', ['A yellow bike! Chained to the Henge with a sign: FREE BIKE. NOT FREE AIR.', '...The back tire is flat as a pancake. A dusty pancake.']] },
    { do: g2 => { g2.missions.complete('hunt', { x: hx - 1.5, y: 1.4, z: hz + 3 }); } }
  ]);
};
BURNS_W3.fixBike = function (g) {
  const S = BURNS_W3.state, { x: hx, z: hz } = BURNS_W3.HENGE;
  g.cutscene([
    { cam: { x: hx + 3.5, y: 1.9, z: hz + 5, tx: hx + 0.6, ty: 0.6, tz: hz + 1.4, fov: 0.75 } },
    { do: g2 => { g2.player.animOverride = 'clipboard'; S.bikeMv.roll = 0; g2.fx.burst(hx + 0.6, 0.5, hz + 1.4, 'star', 16, '#ffd21a'); burnsSfx('powerup'); } },
    { wait: 0.8 },
    { say: ['brady', ['Patch. Pump. Pump. Pump. Pump...', 'GOOD AS NEW! Hello, beautiful.']] },
    { do: g2 => { g2.player.animOverride = null; g2.missions.complete('flat', { x: hx - 1.5, y: 1.4, z: hz + 3 }); } },
    { wait: 0.4 },
    { do: g2 => { BURNS_W234.timer(0.05, g3 => BURNS_W3.thiefAppears(g3)); } }
  ]);
};
BURNS_W3.thiefAppears = function (g) {
  const S = BURNS_W3.state, { x: hx, z: hz } = BURNS_W3.HENGE;
  if (S.thief || g.missions.state('thief') === 'done') return;
  const th = g.spawnActor({ id: 'thief', name: 'SPOKE SNATCHER', type: 'burner', seed: 444, x: hx + 8, z: hz + 6, behavior: 'w234Puppet', friendly: false, hp: 1, collide: false,
    spec: Object.assign(BurnsRig.npcSpec('burner', 444), { top: { kind: 'hoodie', col: '#2a2a30' }, bottom: { kind: 'cargo', col: '#2a2a30' }, hat: { kind: 'bandana', col: '#c8202a' }, glasses: 'shades', goggles: false, acc: [], key: 'w3:thief' }) });
  S.thief = th;
  g.cutscene([
    { cam: { x: hx - 6, y: 3, z: hz + 9, tx: hx + 2, ty: 1, tz: hz + 2, fov: 0.85 } },
    { do: g2 => { th.x = hx + 0.9; th.z = hz + 1.9; th.yaw = 1.2; th.y = 0.42; th.ch.play('bike'); g2.missions.start('thief', true); } },
    { say: [th, ['Ooh, a FIXED yellow bike? Finders keepers! Ding ding, sucker!']] },
    { say: ['brady', ['HEY! That\'s a COMMUNITY bike! I\'m the community!']] },
    { do: g2 => { S.thiefRun = { i: 0, stop: 1.2, sp: 0 }; g2.banner('THE BIKE THIEF', 'Catch him! Spin or stomp him off the bike!', { col: '#ff4a4a' }); } }
  ]);
};
BURNS_W3.THIEF_PATH = [[10, -50], [30, -70], [10, -96], [-20, -100], [-36, -70], [-30, -40], [-14, -22], [8, -24]];
BURNS_W3.thiefStep = function (g, dt) {
  const S = BURNS_W3.state, T = S.thiefRun, a = S.thief, P = BURNS_W3.THIEF_PATH, p = g.player;
  if (!a || g.missions.state('thief') !== 'active') return;
  if (T.stop > 0) { T.stop -= dt; T.sp = approach(T.sp, 0, dt * 8); a.ch.play(T.stop > 1.2 ? 'photo' : 'bike', { rate: 2 }); if (Math.random() < dt * 0.6) a.say(['Selfie with the art! Hold on!', 'Brb, posting this.', 'Ding ding!'][Math.floor(Math.random() * 3)], 1.4); }
  else {
    const t = P[T.i % P.length], dx = t[0] - a.x, dz = t[1] - a.z, d = Math.hypot(dx, dz);
    if (d < 2.5) { T.i++; if (T.i % 3 === 0) T.stop = 2.6; }
    a.yaw = BurnsM.dampAngle(a.yaw, Math.atan2(dx, dz), 3, dt);
    const near = Math.hypot(p.x - a.x, p.z - a.z);
    T.sp = approach(T.sp, near < 6 ? 7.0 : near > 30 ? 4.0 : 6.2, dt * 4);
    a.ch.play('bike', { rate: 4 + T.sp * 0.9 });
  }
  a.x += Math.sin(a.yaw) * T.sp * dt; a.z += Math.cos(a.yaw) * T.sp * dt; a.y = 0.42;
  const mv = S.bikeMv; mv.x = a.x; mv.z = a.z; mv.y = 0; mv.yaw = a.yaw; mv.roll = 0; mv.visible = true;
};
BURNS_W3.thiefCaught = function (g) {
  const S = BURNS_W3.state, a = S.thief; if (!a || S.thiefCaught) return; S.thiefCaught = true; S.thiefRun = null;
  a.ch.play('knocked'); a.y = 0; a.say('Okay okay! It\'s yours! Community vibes!', 2.5); g.fx.dust(a.x, 0.2, a.z, 14); burnsSfx('stomp');
  g.cutscene([
    { cam: { x: a.x + 4, y: 2.4, z: a.z + 4, tx: a.x, ty: 0.8, tz: a.z, fov: 0.8 } },
    { say: [a, ['I work for the BARON, man. He collects bikes. ALL the bikes. He\'s gonna be so mad.']] },
    { say: ['brady', ['Tell your Baron the yellow bike is MINE now. Well. Ours. Mine for a while.']] },
    { do: g2 => { S.bikeMv.visible = false; g2.giveItem('bike'); g2.missions.complete('thief', { x: a.x + 1.4, y: 1.4, z: a.z + 1.4 }); a.setBehavior('chill'); a.friendly = true; } },
    { banner: ['YELLOW BIKE!', 'Tap BIKE (or press B) to ride. Ring the bell with ACTION.', { col: '#ffd21a' }] }
  ]);
};

/* ---------------- First Ride: gates, the loop-de-loop, the trailer launch ---------------- */
BURNS_W3.rideStart = function (g) {
  const S = BURNS_W3.state; S.ride = { i: 0 };
  if (g.bike && !g.player.vehicle) { const p = g.player; g.bike.x = p.x; g.bike.z = p.z; g.bike.y = p.y; g.bike.yaw = p.yaw; g.bike.mount(p); }
  g.banner('FIRST RIDE', 'Through the gates in order. Loop the semi. Launch the trailer!', { col: '#38f2ff' });
};
BURNS_W3.rideReset = function (g) { const S = BURNS_W3.state; S.ride = null; if (S.stunt) BURNS_W3.stuntEnd(g, true); };
BURNS_W3.rideStep = function (g, dt) {
  const S = BURNS_W3.state, R = S.ride, p = g.player;
  if (g.missions.state('ride') !== 'active') { S.ride = null; return; }
  if (S.stunt) return;
  const G = S.gates[R.i]; if (!G) return;
  const need = S.gateNeeds && S.gateNeeds[R.i]; if (need && !R[need]) return; // the loop / launch gates only count if you did it
  // the loop gate: hitting it fast on the bike starts the stunt
  if (Math.hypot(p.x - G.x, p.z - G.z) < 3.4) {
    if (!p.vehicle) { if (!R.warned) { R.warned = true; g.toast('GET ON YOUR BIKE! (BIKE button)'); } return; }
    R.warned = false;
    g.fx.ring(G.x, 1.4, G.z, 3, '#38f2ff', 0.5); burnsSfx('bike_bell');
    R.i++;
    if (R.i >= S.gates.length) { g.missions.complete('ride', { x: p.x + 2, y: 1.4, z: p.z }); S.ride = null; return; }
    g.toast(`GATE ${R.i}/${S.gates.length}`);
  }
  // trailer launch (stand-in semi only; the big-art semi has its own kicker)
  const RP = S.ramp, b = g.bike;
  if (RP && b && p.vehicle === b && b.grounded && Math.hypot(p.x - RP.x, p.z - RP.z) < 1.6 && b.y > RP.y - 0.6 && b.speed > 5) { b.vy = 10.5; b.grounded = false; g.banner('AIR TIME!', '', { col: '#ffe24a', small: true }); burnsSfx('crowd_cheer'); g.fx.confetti(p.x, p.y + 1, p.z, 24); }
};
// the stunt double: Brady + bike drawn pitched around the loop while the real Brady waits underground
BURNS_W3.stuntStart = function (g) {
  const S = BURNS_W3.state, L = S.loop, p = g.player, b = g.bike;
  const sp = Math.max(9, b ? b.speed : 9);
  if (S.ride) S.ride.looped = true;
  if (b && p.vehicle) b.dismount(p);
  S.stunt = { t: 0, dur: 1.5, sp };
  if (!S.dbl) { S.dbl = new BurnsChar(p.model); S.dbl.rim = 0.5; }
  if (S.dbl.model !== p.model) S.dbl.setModel(p.model);
  S.dbl.play('bike', { rate: 14 });
  const fx = Math.sin(L.yaw), fz = Math.cos(L.yaw);
  g.cutscene([
    { cam: { x: L.x - fz * 15, y: L.y + 1, z: L.z + fx * 15, tx: L.x, ty: L.y, tz: L.z, fov: 0.9 } },
    { until: () => !S.stunt },
    { banner: ['LOOP-DE-LOOP!', '', { col: '#ff4fd8', small: true }] }
  ], null, { letterbox: false });
};
BURNS_W3.stuntStep = function (g, dt) {
  const S = BURNS_W3.state, T = S.stunt; if (!T) return;
  const L = S.loop, p = g.player, fx = Math.sin(L.yaw), fz = Math.cos(L.yaw);
  T.t += dt; const u = Math.min(1, T.t / T.dur), th = u * TAU;
  const base = L.y - L.r, px = L.x - fx * 0.5 + fx * L.r * Math.sin(th) + fx * u * 1.0, pz = L.z - fz * 0.5 + fz * L.r * Math.sin(th) + fz * u * 1.0, py = L.y - L.r * Math.cos(th);
  T.x = px; T.y = py; T.z = pz; T.th = th;
  if (Math.random() < 0.8) g.fx.add(px, py + 0.5, pz, 0, 0, 0, 0.5, 0.7, 0.1, burnsRGBf(BURNS_NEON[Math.floor(Math.random() * 7)]), 1, 'glow', 1);
  // grab whatever floats inside the loop (a photo of Chinka hangs at the top)
  const cx = px - fx * Math.sin(th) * 0.9, cy = py + Math.cos(th) * 0.9, cz = pz - fz * Math.sin(th) * 0.9;
  for (const P of g.pickups.items) if (!P.taken && !P.spare && Math.hypot(P.x - cx, P.z - cz) < 1.3 && Math.abs(P.y0 - cy) < 1.4) { P.taken = true; P.obj.visible = false; g.onPickup(P); }
  p.x = L.x; p.z = L.z; p.y = -3; p.vx = p.vz = p.vy = 0; void base;
  if (u >= 1) BURNS_W3.stuntEnd(g, false);
};
BURNS_W3.stuntEnd = function (g, abort) {
  const S = BURNS_W3.state, T = S.stunt, L = S.loop, p = g.player, b = g.bike; if (!T) return;
  S.stunt = null;
  const fx = Math.sin(L.yaw), fz = Math.cos(L.yaw);
  p.teleport(L.x + fx * 1.6, 0, L.z + fz * 1.6, L.yaw); g.camYaw = L.yaw; g.snapCam = true;
  if (b && !abort) { b.x = p.x; b.z = p.z; b.y = 0; b.yaw = L.yaw; b.mount(p); b.speed = T.sp; }
};
BURNS_W3.drawStunt = function (g, R) {
  const S = BURNS_W3.state, T = S.stunt; if (!T || !S.dbl || T.x === undefined) return;
  const L = S.loop, ch = S.dbl, mv = S.bikeMv;
  // the bike: the yellow bike mover pitched around the loop
  mv.visible = true; mv.x = T.x; mv.y = T.y; mv.z = T.z; mv.yaw = L.yaw; mv.pitch = -T.th; mv.roll = 0;
  ch.x = T.x; ch.y = T.y + 0.42; ch.z = T.z; ch.yaw = L.yaw;
  ch.poseFn = (P, t) => { BURNS_ANIMS.bike(P, t, { rate: 14 }); P.pitch = -T.th; P.pivot = -0.42; };
  ch.update(1 / 60); ch.compute();
  R.skin(ch.model.geo, ch.bones, ch.nb, null, 0, 0.5);
};

/* ---------------- Hot Dog: walk Fuzz to the misting station ---------------- */
BURNS_W3.furryStep = function (g, dt) {
  const S = BURNS_W3.state, a = g.actor('fuzz'), p = g.player;
  if (!a || a.w3cool) return;
  if (Math.random() < dt * 3) g.fx.add(a.x + (Math.random() - 0.5) * 0.5, a.y + 1.9, a.z + (Math.random() - 0.5) * 0.5, 0, -1, 0, 0.6, 0.12, 0.06, [0.5, 0.8, 1], 0.9, 'drop', 2);
  if (a.behName !== 'follow') return;
  if (Math.hypot(a.x - p.x, a.z - p.z) > 14 && !g.cine) { a.x = p.x - Math.sin(p.yaw) * 2.4; a.z = p.z - Math.cos(p.yaw) * 2.4; a.y = p.y; }
  if (Math.hypot(a.x - S.mister.x, a.z - S.mister.z) < 3.5) {
    a.w3cool = true; a.setBehavior('dance'); a.home = { x: a.x, z: a.z, y: a.y, yaw: 0 };
    a.say('MIST! SWEET, SWEET MIST! I AM REBORN AS A COOL DOG!', 3); g.fx.hearts(a.x, a.y + 2, a.z, 16); burnsSfx('crowd_cheer', { vol: 0.5 });
    g.player.heal(2); g.glow += 15; g.toast('+15 GLOW STICKS · A DAMP HUG (+2 HYDRATION)');
    if (g.missions.state('furry') === 'active') g.missions.complete('furry');
  }
};

/* ---------------- wheels thrown by the Baron (rolling projectiles) ---------------- */
BURNS_W3.throwWheel = function (g, from, ang) {
  const S = BURNS_W3.state, w = S.wheels.find(q => !q.live); if (!w) return;
  Object.assign(w, { live: true, x: from.x, z: from.z, vx: Math.sin(ang) * 9.5, vz: Math.cos(ang) * 9.5, t: 0, spin: 0 });
  w.mv.visible = true; burnsSfx('throw', null, 'jump');
};
BURNS_W3.wheelStep = function (g, dt) {
  const S = BURNS_W3.state, p = g.player;
  for (const w of S.wheels) {
    if (!w.live) continue;
    w.t += dt; w.x += w.vx * dt; w.z += w.vz * dt; w.spin += dt * 22;
    w.mv.x = w.x; w.mv.y = 0.42; w.mv.z = w.z; w.mv.yaw = Math.atan2(w.vx, w.vz); w.mv.pitch = w.spin;
    if (w.t > 4.5 || Math.hypot(w.x - BURNS_W3.GRAVE.x, w.z - BURNS_W3.GRAVE.z) > 26) { w.live = false; w.mv.visible = false; continue; }
    if (!p.dead && p.invT <= 0 && Math.hypot(p.x - w.x, p.z - w.z) < 0.8 && p.y < 0.8) { p.hurt(1, w.x, w.z, 7); w.live = false; w.mv.visible = false; g.fx.burst(w.x, 0.6, w.z, 'spark', 10, '#ffd21a'); }
  }
};

/* ---------------- the Tallbike Baron (boss) ---------------- */
BURNS_W3.bossIntro = function (g) {
  const S = BURNS_W3.state, a = g.actor('baron'), p = g.player, { x: gx, z: gz } = BURNS_W3.GRAVE;
  if (S.bossStarted || g.missions.isDone('boss') || g.missions.state('boss') !== 'available' || !a) { if (!g.missions.isDone('boss') && g.missions.state('boss') === 'locked' && !S.graveWarned) { S.graveWarned = true; g.playerBubble('A graveyard of stolen bikes... I should come back with my own bike. And my look.', 3); } return; }
  S.bossStarted = true;
  g.missions.start('boss', true);
  const c1 = { x: gx + 6, y: 3, z: gz + 8, tx: a.x, ty: 3.2, tz: a.z, fov: 0.85 };
  g.cutscene([
    { music: 'boss' },
    { cam: c1 },
    { banner: ['BARON VON SPOKES', 'The Tallbike Baron · Boss', { col: '#ffd21a', big: true, dur: 3 }] },
    { say: [a, ['WELCOME to my Bike Graveyard, little bun. Every yellow bike on the playa ends up HERE. With ME.', 'You took one back? From MY thief? On MY playa? Nobody rides away from the Baron.']] },
    { say: ['brady', ['They\'re COMMUNITY bikes! You\'re literally the opposite of community!']] },
    { say: [a, ['I am a community of ONE. And my bike is TALLER than yours.']] },
    { do: g2 => { p.teleport(gx, 0, gz + 12, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; S.baron = { mode: 'circle', t: 2, ang: 0, hpShown: 3 }; g2.boss = { name: 'BARON VON SPOKES', get hp() { return a.hp; }, maxHp: 3, active: true, get defeated() { return a.defeated; }, st: '', head() { return [a.x, a.y + 2, a.z]; }, update() {} }; g2.banner('FIGHT!', 'Jump his rolling wheels · when he charges, dodge so he crashes · hit him while he\'s down!', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W3.baronStep = function (g, dt) {
  const S = BURNS_W3.state, B = S.baron, a = g.actor('baron'), p = g.player, { x: gx, z: gz } = BURNS_W3.GRAVE, mv = S.tallMv;
  if (!a || a.defeated || g.cine) return;
  B.t -= dt;
  const ph = 3 - a.hp, fast = 1 + ph * 0.2;
  if (B.mode === 'circle') {
    B.ang += dt * 0.42 * fast; const tx = gx + Math.sin(B.ang) * 13, tz = gz + Math.cos(B.ang) * 13;
    a.yaw = BurnsM.dampAngle(a.yaw, Math.atan2(tx - a.x, tz - a.z), 4, dt); a.x = BurnsM.damp(a.x, tx, 2, dt); a.z = BurnsM.damp(a.z, tz, 2, dt);
    a.ch.play('bike', { rate: 9 });
    if (B.t <= 0) {
      B.throws = (B.throws || 0) + 1;
      if (B.throws % (3 - Math.min(1, ph)) === 0) { B.mode = 'wind'; B.t = 1.1; a.say('DING DING! OUT OF MY WAY!', 1.2); burnsSfx('bike_bell'); B.tx = p.x; B.tz = p.z; }
      else { B.t = 1.6 / fast; const n = 1 + Math.min(2, ph); for (let k = 0; k < n; k++) BURNS_W3.throwWheel(g, { x: a.x, z: a.z }, Math.atan2(p.x - a.x, p.z - a.z) + (k - (n - 1) / 2) * 0.35); a.say(['Catch!', 'Wheelie good throw!', 'Spare tire? Spare TIRES!'][Math.floor(Math.random() * 3)], 1); }
    }
  } else if (B.mode === 'wind') {
    a.yaw = BurnsM.dampAngle(a.yaw, Math.atan2(B.tx - a.x, B.tz - a.z), 8, dt); a.ch.play('bike', { rate: 20 });
    if (B.t <= 0) { B.mode = 'charge'; B.t = 1.5; B.dx = Math.sin(a.yaw); B.dz = Math.cos(a.yaw); }
  } else if (B.mode === 'charge') {
    a.x += B.dx * 12.5 * dt; a.z += B.dz * 12.5 * dt; a.ch.play('bike', { rate: 24 });
    if (Math.random() < dt * 20) g.fx.dust(a.x, 0.1, a.z, 2);
    if (!p.dead && p.invT <= 0 && Math.hypot(p.x - a.x, p.z - a.z) < 1.2) { p.hurt(1, a.x, a.z, 10); a.say('OUT OF THE BIKE LANE!', 1.2); }
    if (B.t <= 0 || Math.hypot(a.x - gx, a.z - gz) > 17) { B.mode = 'down'; B.t = 4.2 - ph * 0.5; a.say(['WHOA-OA-OA!', 'My tall bike! My beautiful tall bike!', 'Gravity is so... bourgeois...'][Math.floor(Math.random() * 3)], 2); g.fx.dust(a.x, 0.2, a.z, 24); g.shake(0.4); burnsSfx('groundpound'); if (ph >= 2) g.shockwave({ x: a.x, z: a.z, y: 0, speed: 8, max: 10, h: 0.6, dmg: 1, col: '#ffd21a', dust: true }); }
  } else if (B.mode === 'down') {
    a.ch.play('knocked'); if (Math.random() < dt * 5) g.fx.burst(a.x, 1.2, a.z, 'star', 1, '#ffe24a');
    if (B.t <= 0) { B.mode = 'circle'; B.t = 1.4; a.say('Back in the saddle! WAY up here!', 1.6); }
  }
  // tall bike + rider placement
  const down = B.mode === 'down';
  a.x = clamp(a.x, gx - 18, gx + 18); a.z = clamp(a.z, gz - 18, gz + 18);
  mv.x = down ? a.x + Math.cos(a.yaw) * 1.2 : a.x; mv.z = down ? a.z - Math.sin(a.yaw) * 1.2 : a.z; mv.y = 0; mv.yaw = a.yaw; mv.roll = BurnsM.damp(mv.roll || 0, down ? 1.45 : 0, 6, dt); mv.visible = true;
  a.y = down ? 0.05 : 3.0;
};
BURNS_W3.bossDefeated = function (g) {
  const S = BURNS_W3.state, a = g.actor('baron'), p = g.player, { x: gx, z: gz } = BURNS_W3.GRAVE;
  S.baron = null; g.boss = null;
  for (const w of S.wheels) { w.live = false; w.mv.visible = false; }
  // the world can't finish without the essentials: make sure the costume + bike are owned
  if (!g.hasItem('bike')) g.giveItem('bike', true);
  if (!BURNS_W234.costumeOn()) { BurnsSave.setCostume('furcoat'); p.rebuildModel(); }
  g.giveItem('costumes', true);
  g.missions.complete('boss');
  BURNS_W234.timer(1.2, () => {
    g.cutscene([
      { music: 'burns_victory' },
      { cam: { x: gx + 7, y: 2.6, z: gz + 7, tx: a.x, ty: 0.8, tz: a.z, fov: 0.85 } },
      { say: [a, ['Fine! FINE! Take them! Take ALL the bikes! Ride them! Share them! Ugh, community.']] },
      { do: g2 => { g2.fx.confetti(gx, 3, gz, 80); burnsSfx('crowd_cheer'); for (let i = 0; i < 6; i++) g2.fx.firework(gx + (Math.random() - 0.5) * 30, 12 + Math.random() * 6, gz + (Math.random() - 0.5) * 30, '#ffd21a'); } },
      { cam: { x: p.x + 3, y: 1.8, z: p.z + 4, tx: p.x, ty: 1.3, tz: p.z, fov: 0.8 } },
      { say: ['brady', ['A disguise AND a yellow bike. The Man won\'t know me. And he won\'t outrun me.']] },
      { say: [{ name: 'A WHISPER FROM THE CROWD', model: BurnsRig.model(BurnsRig.npcSpec('furcoat', 9)) }, ['Psst. Bun-guy-in-disguise. You want to know where the big wooden fella took your lady?', 'Come to the Dome district tonight. Ask for Velour. Come alone. Wear something... cozy.']] },
      { say: ['brady', ['...The DOME district? Oh no.']] },
      { do: g2 => { p.victoryT = 3; } },
      { wait: 0.8 }
    ], g2 => g2.finishWorld());
  });
};

/* ---------------- intro ---------------- */
BURNS_W3.intro = function (g) {
  const S = BURNS_W3.state, p = g.player;
  p.locked = true; p.animOverride = 'sleep'; p.teleport(-24, 0.9, 104, 0);
  g.cutscene([
    { cam: { x: 20, y: 30, z: 140, tx: -30, ty: 0, tz: 40, fov: 0.9 } },
    { banner: [BurnsWorlds.label ? BurnsWorlds.label(3) : 'WORLD 3', 'COSTUME CULT & THE YELLOW BIKE', { col: '#ffe24a', big: true, dur: 3 }] },
    { cam: { from: { x: 20, y: 30, z: 140, tx: -30, ty: 0, tz: 40, fov: 0.9 }, to: { x: -21, y: 2.4, z: 108, tx: -24, ty: 1.2, tz: 104, fov: 0.8 }, dur: 4 } },
    { say: ['brady', ['...Morning? Morning. I fell asleep in a stranger\'s hammock. Very playa.', 'The Man saw my face. He knows my bun. I need a disguise. And wheels. Real wheels.']] },
    { do: g2 => { p.locked = false; p.animOverride = null; p.teleport(-18, 0, 100, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; BurnsSave.flag(3, 'intro', true); S.introDone = true; } },
    { banner: ['GET A DISGUISE', 'The Costume Cult is west. Then find a yellow bike.', { col: '#ffd84a' }] }
  ], null);
};

/* ---------------- behaviours ---------------- */
// fashion police: cite black t-shirts, swoon over costumes
BurnsBehaviors.register('w3FashionCop', {
  init(a) { a.data.cd = 1 + Math.random() * 2; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP(), plain = !BURNS_W234.costumeOn();
    D.cd -= dt;
    if (plain && d < 10) {
      a.moveTo(p.x, p.z, 3.3, dt, 0.6); a.ch.play('run', { rate: 0.8 });
      if (D.cd <= 0) { D.cd = 2.5; a.say(['CITATION! A BLACK T-SHIRT? AT THE BURN?', 'SIR, THOSE ARE JEANS.', 'FASHION EMERGENCY ON 40TH STREET!', 'WHERE IS YOUR SPARKLE, CITIZEN?'][Math.floor(Math.random() * 4)], 1.6); }
      BurnsBehaviors.contact(a, g, 1, 5);
    } else {
      if (!D.tx || Math.random() < dt * 0.2) { const t = Math.random() * TAU; D.tx = a.home.x + Math.cos(t) * 4; D.tz = a.home.z + Math.sin(t) * 4; }
      const dd = a.moveTo(D.tx, D.tz, 1.1, dt, 0.5);
      if (!plain && d < 7) { a.face(p.x, p.z, dt, 4); a.ch.play('photo'); if (D.cd <= 0) { D.cd = 4; a.say(['Werk.', 'Ten out of ten. Eleven.', 'The fit? FIT.', 'I have no notes. NONE.'][Math.floor(Math.random() * 4)], 1.6); } }
      else a.ch.play(dd > 0.5 ? 'walk' : 'clipboard');
    }
    a.physics(dt);
  }
});
// the Baron: positioned by BURNS_W3.baronStep; only hittable while down
BurnsBehaviors.register('w3Baron', {
  update(a, g, dt) { if (!BURNS_W3.state.baron) { a.ch.play('bike', { rate: 3 }); const mv = BURNS_W3.state.tallMv; if (mv && !a.defeated && !a.hidden) { mv.x = a.x; mv.z = a.z; mv.yaw = a.yaw; } } },
  hit(a, g, kind) {
    const B = BURNS_W3.state.baron;
    if (!B || B.mode !== 'down') { if (B) a.say('Can\'t reach me up here!', 1); return false; }
    a.hp -= 1; a.invT = 0.6; a.hurtT = 0.35; g.fx.burst(a.x, 1.2, a.z, 'star', 16, '#ffe24a'); burnsSfx('bossHit'); g.shake(0.3);
    const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 8, 8, dz / d * 8);
    if (a.hp <= 0) { a.defeated = true; a.hp = 0; a.ch.play('sit'); BURNS_W3.bossDefeated(g); }
    else { B.mode = 'circle'; B.t = 1.5; a.say(['MY MONOCLE! I don\'t even HAVE a monocle!', 'You\'ll pay for that! In bikes!'][a.hp % 2], 2); g.banner(a.hp === 2 ? 'HE\'S THROWING MORE WHEELS' : 'HE\'S FURIOUS', a.hp === 2 ? 'Two wheels at a time: jump!' : 'Three wheels and a crash shockwave!', { col: '#ffd21a' }); }
    return 'handled';
  }
});
// a hidden controller that runs after Brady's update each step
BurnsBehaviors.register('w3Ctl', {
  update(a, g, dt) {
    const S = BURNS_W3.state; if (!S) return;
    if (S.stunt) BURNS_W3.stuntStep(g, dt); else if (S.loop) BURNS_W3.loopCheck(g);
    // catching the thief: touching him (spin, stomp, or just tackling) on foot
    if (S.thiefRun && S.thief && !S.thiefCaught) { const p = g.player, t = S.thief; if (Math.hypot(p.x - t.x, p.z - t.z) < (p.spinT > 0 ? 2.0 : 1.0) && Math.abs(p.y - 0) < 2.5) BURNS_W3.thiefCaught(g); }
    a.y = -60;
  }
});

/* test/debug access (the bundle is one IIFE) */
try { (window.BRADY_W234 = window.BRADY_W234 || {}).w3 = BURNS_W3; } catch (e) { /* no window */ }
