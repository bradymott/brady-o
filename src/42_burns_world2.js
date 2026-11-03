/* ============================================================
   BRADY-O BURNS — World 2: NO CAMP (Sunday night → Monday)
   Brady is a first-timer with no camp. The Red Light District crew
   (the pink RV he rode in on) babysits his gear while he asks every
   camp in the city to take him in. Five rejections later he crashes
   on a Center Camp couch, wakes up to slam poetry, accepts a tent
   from a nice guy named Kevin, hauls his stuff across the city...
   and wakes up at 4 AM to Kevin reading his aura through his soles.
   Clock streets run out from the Man's (empty) pavilion; lettered
   streets ring it.
   Missions (Burn Tokens):
     search    Camp Shopping            get rejected by five camps
     conclave  The Fire Conclave        cross two rings of fire spinners to Fire Mama Ember
     alley     Flame Alley              Camp Combustion's poofer-alley "audition"
     lights    Bike Light Roundup       8 LED bike lights scattered between bike swarms
     rocket    Launch the Retro Rocket  climb the big-art gantry, push the button
     haul      Haul Your Stuff          carry everything from the pink RV to Kevin's tent
     escape    Sole Survivor            (finale) flee Kevin and his Sole Circle back to the RV
   Story missions without a token: stash, ranger, couch.
   Side quests: lost, moop, darkwads, lanterns.
   Set pieces: Center Camp, the never-ending art car parade around
   Kevin's block, the Fire Conclave rings, Flame Alley, the Retro Rocket.
   ============================================================ */

const BURNS_W2 = {
  C: { x: 80, z: -150 },                       // city centre: the Man's (empty) pavilion, north of the map
  R: [100, 126, 152, 178, 204, 230, 256],     // Esplanade, A..F
  LET: ['ESPLANADE', 'A', 'B', 'C', 'D', 'E', 'F'],
  CLOCK: [['5:00', -30], ['5:30', -15], ['6:00', 0], ['6:30', 15], ['7:00', 30], ['7:30', 45], ['8:00', 60], ['8:30', 75]],
  REJECT: ['dues', 'waitlist', 'full', 'interview', 'conclave', 'alley', 'lights'],
  state: null,
  at(th, r) { const a = th * Math.PI / 180; return [this.C.x - r * Math.sin(a), this.C.z + r * Math.cos(a)]; },
  polar(x, z) { const dx = x - this.C.x, dz = z - this.C.z; return [Math.atan2(-dx, dz) * 180 / Math.PI, Math.hypot(dx, dz)]; },
  outYaw(th) { const a = th * Math.PI / 180; return Math.atan2(-Math.sin(a), Math.cos(a)); },
  // rejections so far (saved as flags, so they count even before Camp Shopping starts)
  rejections() { let n = 0; for (const id of this.REJECT) if (BurnsSave.flag(2, 'rej:' + id)) n++; return n; }
};
// CAMP: Kevin's camp (7:30 & E, inside the parade loop) · RLD: the Red Light District RV (5:15 & Esplanade)
// CC: Center Camp (6:00 & Esplanade) · MANSPOT: where the Man taunts from, out on the open playa
(() => { const W = BURNS_W2; W.CAMP = W.at(45, 230); W.RLD = W.at(-22.5, 113); W.CC = W.at(0, 113); W.MANSPOT = W.at(4, 54); })();

BurnsWorlds.register({
  id: 2, name: 'No Camp', sub: 'Sunday night. Nowhere to sleep.', day: 'Sunday night → Monday',
  sky: Object.assign({}, BURNS_PALETTES.night, { zen: '#05061c', hor: '#3a1446', fog: '#24183a', fogD: 0.0105, haze: 0.55, moon: [215, 38], moonK: 1.1, stars: 1, mtnCol: '#120a24', city: [20, 0], cityCol: '#ff7a3a', cityK: 0.7, sky: '#4a4a8a', gnd: '#3a2a46', key: '#9aa8e8', keyK: 0.5, emB: 1.75, rim: '#b08aff' }),
  // the finale runs into Monday's dawn
  sky2: Object.assign({}, BURNS_PALETTES.dawn, { fogD: 0.0085, city: [20, 0], cityCol: '#ff9a5a', cityK: 0.45, emB: 1.3 }),
  tod: 0,
  music: 'burns_w2',
  bounds: [-155, -112, 155, 112],
  spawn: (() => { const [x, z] = BURNS_W2.at(-22.5, 104); return { x, y: 0, z, yaw: BURNS_W2.outYaw(-22.5) }; })(),
  ground: { base: '#b8967c', crack: 0.22, mottle: 0.4, res: 0.5 },
  dust: 0.8,
  missions: [
    { id: 'stash', name: 'Honey, You Have NO Camp?', token: false, type: 'custom', count: 3, start: 'auto', progressLabel: 'Gear stashed', short: 'Carry your gear into the pink RV', marker: { x: BURNS_W2.RLD[0], z: BURNS_W2.RLD[1] },
      desc: 'You came with Chinka, three bags and zero plans. The Red Light District crew will babysit your stuff. Carry it into their pink RV, one load at a time.', hint: 'The pink RV where you started. Heavy stuff: no jumping.',
      onStart(g) { BURNS_W2.stashStart(g); }, onComplete(g) { BURNS_W2.stashDone(g); } },
    { id: 'search', name: 'Camp Shopping', type: 'custom', count: 5, start: 'auto', requires: ['stash'], progressLabel: 'Rejections', short: 'Ask camps to take you in (get rejected 5 times)', marker: { x: 62, z: -17 },
      desc: 'One question for every camp in the city: "Can I camp with you?" Talk to camp leads (look for the ?), or audition at the Fire Conclave, Flame Alley and Camp Blinky. Collect five rejections. Character building!', hint: 'Camp leads with a ? over their heads, all over the city',
      onStart(g) { BURNS_W234.timer(0.05, g2 => BURNS_W2.searchSync(g2)); },
      onComplete(g) { BURNS_W2.searchDone(g); } },
    { id: 'ranger', name: 'Ask a Ranger', token: false, type: 'reach', giver: 'sage', start: 'manual', short: 'Stand under the 6:30 & A sign', marker: { x: 86, z: -60 },
      target: { x: 0, z: 0, r: 3.2 }, desc: 'Ranger Sagebrush will teach you the street signs. Clock streets go out from the Man, letter streets go around. Then he\'ll tell you where a first-timer can sleep.', hint: 'Ranger Outpost, 6:00 & Esplanade, across from Center Camp',
      onComplete(g) { BURNS_W2.rangerDone(g); } },
    { id: 'conclave', name: 'The Fire Conclave', type: 'reach', giver: 'flint', start: 'manual', short: 'Cross the fire circle to Fire Mama Ember', marker: { x: 56, z: -84 },
      target: { x: 0, z: 0, r: 2.6 }, desc: 'Fire Mama Ember runs the conclave camp. Walk through two rings of fire spinners and ask her if you can join. Don\'t touch the poi.', hint: 'Open playa, between 6:00 and 7:00, inside Esplanade',
      onComplete(g) { BURNS_W2.reject(g, 'conclave', 'ember', ['You walked through FIRE to ask me something? I respect that, baby.', 'Join the conclave? Oh, sugar. Fire takes YEARS. Go practice with a sock on a string.']); } },
    { id: 'alley', name: 'Flame Alley', type: 'race', time: 20, giver: 'sparky', start: 'manual', short: 'Run Flame Alley! Ring the bell', marker: { x: 59, z: 6 },
      target: { x: 0, z: 0, r: 2.2 }, desc: 'Camp Combustion\'s "audition": run their poofer alley and ring the bell at the far end before the clock runs out.', hint: 'Camp Combustion, between 6:00 and 6:30, B to C',
      onStart(g) { BURNS_W2.alleyStart(g); }, onFail(g) { BURNS_W2.alleyReset(g); },
      onComplete(g) { BURNS_W2.alleyDone(g); } },
    { id: 'lights', name: 'Bike Light Roundup', type: 'collect', count: 8, giver: 'lumen', start: 'manual', progressLabel: 'Bike lights', short: 'Collect lost bike lights', marker: { x: 34, z: 22 },
      desc: 'A bike swarm blew through Camp Blinky and scattered 8 LED bike lights. Bring them all back and Lumen might let you join. Don\'t stand in the bike lane.', hint: 'Camp Blinky, 6:30 & C',
      onStart(g) { BURNS_W2.labels(g, 'lights', 'BIKE LIGHT'); },
      onComplete(g) { BURNS_W2.reject(g, 'lights', 'lumen', ['MY BABIES! All eight! The playa is bright again!', 'Join Camp Blinky? Oh, sweetie. We\'re full of LIGHTS. There\'s no room for people.']); } },
    { id: 'rocket', name: 'Launch the Retro Rocket', type: 'custom', start: 'trigger', short: 'Climb the gantry, hit LAUNCH', marker: { x: 130, z: -68 },
      desc: 'A giant retro rocket on the open playa. Climb its gantry for a view of the whole city, then hit the big red button.', hint: 'Open playa, east of Center Camp' },
    { id: 'lost', name: 'Lost & Found Burners', token: false, type: 'custom', count: 3, giver: 'lost1', start: 'manual', progressLabel: 'Burners home', short: 'Walk the lost burners home', marker: { x: 107, z: -32 },
      desc: 'Three burners asked you where 4:30 is. It is not here. You don\'t have a home, but you can find everybody else\'s: walk each of them to the address they actually remember.', hint: 'Lost burners wander near Esplanade and 6:00',
      onComplete(g) { g.banner('ADDRESS MASTER', 'No camp, but you know this city better than the people who live here.', { col: '#7aff5a', small: true }); } },
    { id: 'moop', name: 'MOOP Sweep', token: false, type: 'collect', count: 10, giver: 'captain', start: 'manual', progressLabel: 'MOOP', short: 'MOOP sweep: pick up 10 bits of litter', marker: { x: 40, z: -46 },
      desc: 'Captain Safety Third says your illumination is five lumens too dim. Sweep up 10 bits of MOOP (Matter Out Of Place) and earn a regulation headlamp.', hint: 'Safety Camp, Esplanade between 6:30 and 7:00',
      onStart(g) { BURNS_W2.labels(g, 'moop', 'MOOP'); }, onComplete(g) { BURNS_W2.moopDone(g); } },
    { id: 'darkwads', name: 'Light Up the Darkwads', token: false, type: 'custom', count: 4, giver: 'captain', start: 'manual', requires: ['moop'], progressLabel: 'Darkwads lit', short: 'Spin or stomp 4 darkwads to light them up', marker: { x: -40, z: 40 },
      desc: 'Unlit pedestrians lurk on the outer streets. They\'re nearly invisible until you bump into them. Spin or stomp them to stick glow on them.', hint: 'Outer streets, C to E, between 5:30 and 7:00',
      onEvent(g, m, name) { if (name === 'w234lit') { g.missions.progress('darkwads'); return true; } },
      onComplete(g) { g.glow += 20; g.toast('+20 GLOW STICKS · THE STREETS ARE SAFER'); const a = g.actor('captain'); if (a) a.say('Four darkwads, illuminated. I\'m not crying. It\'s dust.', 3); } },
    { id: 'lanterns', name: 'Light the Way', token: false, type: 'custom', giver: 'wick', start: 'manual', short: 'Walk with the lamplighters (stay in their light)', marker: { x: -6, z: -90 },
      desc: 'Every night the lamplighters carry lanterns out along 7:00. Walk with them and stay inside their light while they light the way.', hint: 'Lamplighters gather at 7:00 & Esplanade',
      onStart(g) { BURNS_W2.lampStart(g); }, onFail(g) { BURNS_W2.lampReset(g); }, onComplete(g) { BURNS_W2.lampDone(g); } },
    { id: 'couch', name: 'Couch Surfing', token: false, type: 'custom', start: 'auto', requires: ['search'], short: 'Crash on a couch at Center Camp', marker: { x: BURNS_W2.CC[0], z: BURNS_W2.CC[1] },
      desc: 'Nobody will take you. But Center Camp is open to everyone, all night, and it has couches. Go lie down on one.', hint: 'Center Camp, 6:00 & Esplanade' },
    { id: 'haul', name: 'Haul Your Stuff', type: 'custom', start: 'auto', requires: ['couch'], short: 'Carry your stuff from the pink RV to Kevin\'s tent', marker: { x: BURNS_W2.RLD[0], z: BURNS_W2.RLD[1] },
      desc: 'Kevin has room in his tent at 7:30 & E. Get your stuff from the pink RV and carry it across the city. It\'s heavy: no jumping, and anything that knocks you over makes you drop it. Mind the bike swarms, the art cars and some very nosy "burners".', hint: 'Pink RV (Esplanade) → Kevin\'s tent (7:30 & E, inside the art car parade)',
      onStart(g) { BURNS_W2.haulStart(g); } },
    { id: 'escape', name: 'Sole Survivor', type: 'custom', start: 'manual', requires: ['haul'], tokenDirect: true, failOnFaint: true, short: 'RUN! Get back to the pink RV', marker: { x: BURNS_W2.RLD[0], z: BURNS_W2.RLD[1] },
      desc: '4 AM. Kevin is "reading your aura through your soles". Grab your stuff and run back to the pink RV. Dodge Kevin and his barefoot Sole Circle; mash JUMP or ACTION to break free if they grab you.', hint: 'The pink RV, Esplanade near 5:00',
      onStart(g) { BURNS_W2.escapeStart(g); }, onFail(g) { BURNS_W2.escapeFail(g); } }
  ],
  build(api, g) {
    const W2 = BURNS_W2, R = api.rng, BW = BURNS_W234, RR = W2.R;
    BW.reset(g);
    W2.state = { introDone: !!BurnsSave.flag(2, 'intro'), followers: [], swarms: [], spinners: [], jets: [], warned: 0, sole: [], trail: [] };
    const S = W2.state, at = (th, r) => W2.at(th, r);
    const CAMP = W2.CAMP;
    // fix mission targets now that the geometry is known
    const M = id => this.missions.find(m => m.id === id);
    { const [x, z] = at(15, 126); const t = M('ranger').target; t.x = x + 3.5; t.z = z + 3.5; }
    S.conclave = { x: 56, z: -84 }; Object.assign(M('conclave').target, S.conclave);
    S.tower = { x: 18, z: -96 };
    // the four talk-only camps that turn Brady away (lots, each with a camp lead under a big sign)
    S.rejectCamps = [
      { id: 'dues', th: 7.5, r: 134.2 }, { id: 'waitlist', th: 37.5, r: 160.2 }, { id: 'full', th: -7.5, r: 186.2 }, { id: 'interview', th: 22.5, r: 212.2 }
    ].map(q => { const [x, z] = at(q.th, q.r); return Object.assign(q, { x, z }); });
    // areas kept free of random camps
    S.capCamp = W2.at(21, 111);
    const reserved = [[CAMP[0], CAMP[1], 27], [59, 13, 17], [34, 22, 13], [107, -32, 9], [66, -38, 7], [S.capCamp[0], S.capCamp[1], 11], [W2.CC[0], W2.CC[1], 17.5], [W2.RLD[0], W2.RLD[1], 13]].concat(S.rejectCamps.map(q => [q.x, q.z, 9]));
    const isReserved = (x, z) => reserved.some(q => Math.hypot(x - q[0], z - q[1]) < q[2]);
    /* ---------------- ground: streets, tyre tracks, open playa ---------------- */
    api.paint((c, P, sc) => {
      // dust blotches
      for (let i = 0; i < 220; i++) { const x = R.range(-160, 160), z = R.range(-120, 120), [px, pz] = P(x, z), r = R.range(2, 10) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gg.addColorStop(0, dark ? 'rgba(110,80,70,0.22)' : 'rgba(225,200,170,0.2)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      const road = (pts, w, a) => { c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); pts.forEach((q, i) => { const [x, z] = P(q[0], q[1]); i ? c.lineTo(x, z) : c.moveTo(x, z); }); c.strokeStyle = `rgba(120,88,72,${a * 0.6})`; c.lineWidth = (w + 2) * sc; c.stroke(); c.strokeStyle = `rgba(150,112,92,${a})`; c.lineWidth = w * sc; c.stroke(); };
      for (let j = 0; j < RR.length; j++) { const pts = []; for (let th = -40; th <= 85; th += 2.5) pts.push(at(th, RR[j])); road(pts, j === 0 ? 11 : 9, 0.55); }
      for (const [, th] of W2.CLOCK) road([at(th, RR[0]), at(th, 300)], th === 0 ? 11 : 9, 0.55);
      // tyre tracks along the streets
      c.strokeStyle = 'rgba(90,64,52,0.22)'; c.lineWidth = 0.3 * sc;
      for (let j = 0; j < RR.length; j++) for (const off of [-1.6, 1.4]) { c.beginPath(); for (let th = -40; th <= 85; th += 2.5) { const [x, z] = P(...at(th, RR[j] + off)); th === -40 ? c.moveTo(x, z) : c.lineTo(x, z); } c.stroke(); }
      // the fire conclave: scorched sand disc + ring
      const [cx, cz] = P(S.conclave.x, S.conclave.z), cr = 15 * sc;
      const g1 = c.createRadialGradient(cx, cz, 0, cx, cz, cr); g1.addColorStop(0, 'rgba(70,40,40,0.75)'); g1.addColorStop(0.85, 'rgba(90,55,50,0.6)'); g1.addColorStop(1, 'rgba(90,55,50,0)'); c.fillStyle = g1; c.beginPath(); c.arc(cx, cz, cr, 0, TAU); c.fill();
      c.strokeStyle = 'rgba(255,140,60,0.35)'; c.lineWidth = 0.5 * sc; for (const rr of [7, 12]) { c.beginPath(); c.arc(cx, cz, rr * sc, 0, TAU); c.stroke(); }
      // home arena: soft dark disc
      const [hx, hz] = P(CAMP[0], CAMP[1]), hr = 22 * sc;
      const g2 = c.createRadialGradient(hx, hz, hr * 0.2, hx, hz, hr); g2.addColorStop(0, 'rgba(90,60,80,0.4)'); g2.addColorStop(1, 'rgba(90,60,80,0)'); c.fillStyle = g2; c.beginPath(); c.arc(hx, hz, hr, 0, TAU); c.fill();
      // Center Camp plaza: a pale disc and a ring road around it
      const [ccx, ccz] = P(W2.CC[0], W2.CC[1]); c.fillStyle = 'rgba(232,212,186,0.35)'; c.beginPath(); c.arc(ccx, ccz, 14 * sc, 0, TAU); c.fill(); c.strokeStyle = 'rgba(150,112,92,0.5)'; c.lineWidth = 3.5 * sc; c.beginPath(); c.arc(ccx, ccz, 16.5 * sc, 0, TAU); c.stroke();
    });
    /* ---------------- streets: signposts + lamps at every intersection ---------------- */
    const bounds = (x, z, m) => x > -155 + m && x < 155 - m && z > -112 + m && z < 112 - m;
    for (const [name, th] of W2.CLOCK) for (let j = 0; j < RR.length; j++) {
      const r = RR[j] - 5.6, d = 5.6 / r * 180 / Math.PI, [x, z] = at(th + d, r);
      if (!bounds(x, z, 3) || isReserved(x, z)) continue;
      const a = th * Math.PI / 180;
      api.mesh(x, z, m => BW.signpost(m, { a: name, b: W2.LET[j], yawA: Math.atan2(-Math.cos(a), -Math.sin(a)), yawB: Math.atan2(Math.sin(a), -Math.cos(a)) }));
      api.light(x, z, 6, '#ff9ad8', 0.22);
      if ((j + Math.round(th / 15)) % 2 === 0) { const [lx, lz] = at(th - d, r); if (bounds(lx, lz, 3) && !isReserved(lx, lz)) api.mesh(lx, lz, m => BW.lamp(m, { pool: 10 }), { yaw: W2.outYaw(th) + Math.PI / 2 }); }
    }
    // the 6:00 promenade: double row of lamps out to the pavilion
    for (let r = 20; r < 98; r += 13) for (const s of [-1, 1]) { const [x, z] = at(s * 4.2 * 180 / Math.PI / r, r); if (bounds(x, z, 2) && !isReserved(x, z)) api.mesh(x, z, m => BW.lamp(m, { pool: 8, col: '#ffd890' }), { yaw: s > 0 ? Math.PI / 2 : -Math.PI / 2 }); }
    /* ---------------- the city: camps on every block ---------------- */
    let lotN = 0, npcN = 0;
    for (let j = 0; j < RR.length; j++) for (const side of [1, -1]) {
      if (j === 0 && side < 0) continue;            // inside Esplanade: open playa
      const r = RR[j] + side * 8.2;
      for (let k = 0; k < W2.CLOCK.length - 1; k++) {
        const th0 = W2.CLOCK[k][1], th1 = W2.CLOCK[k + 1][1], arc = r * (th1 - th0) * Math.PI / 180, use = arc - 15, n = Math.max(1, Math.floor(use / 13));
        for (let i = 0; i < n; i++) {
          const th = th0 + ((7.5 + (i + 0.5) * use / n) / r) * 180 / Math.PI, [x, z] = at(th, r);
          if (!bounds(x, z, 5) || isReserved(x, z)) continue;
          const face = side > 0 ? Math.atan2(W2.C.x - x, W2.C.z - z) : Math.atan2(x - W2.C.x, z - W2.C.z);
          const seed = 1000 + lotN++;
          const outer = j === RR.length - 1 && side > 0;
          npcN += W2.lot(api, x, z, face, seed, outer ? 'tents' : null, npcN < 64);
        }
      }
    }
    S.lots = lotN;
    // the Man's empty pavilion at the city centre (a beacon to the north)
    api.mesh(W2.C.x, W2.C.z, m => {
      m.color('#4a3a3a'); BW.lathe(m, 0, 0, 0, [[0, 0], [9, 0], [9, 0], [8, 2.2], [8, 2.2], [5, 2.6], [0, 2.6]], { seg: 24 });
      m.color('#ffb860', 1); BW.ring(m, 0, 2.3, 0, 8.4, 0.12, { seg: 32, tseg: 4 }); m.emissive(0);
      m.color('#6a5040'); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; BW.limb(m, Math.sin(a) * 5, 2.6, Math.cos(a) * 5, Math.sin(a) * 2.5, 9, Math.cos(a) * 2.5, 0.25); }
      m.color('#ff4fd8', 1); BW.ball(m, 0, 9.4, 0, 0.8); m.emissive(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 9, y0: 0, y1: 2.6 }], lights: [{ x: 0, y: 9.4, z: 0, s: 6, c: '#ff4fd8' }, { x: 0, y: 0, z: 0, s: 0, c: '#ffb860', pool: 18 }] };
    });
    api.sign('OUT TO LUNCH\n— THE MAN', W2.C.x, W2.C.z + 10.5, { h: 1.2, y: 2.7, style: { bg: '#1a0a1a', fg: '#ffd84a', glow: '#ff9a2a', size: 28, border: '#ffd84a' }, glow: '#ffd84a' });
    /* ---------------- 6:00 & Esplanade: Ranger Outpost (across from Center Camp) ---------------- */
    {
      const [ox, oz] = [86, -60];
      api.prop('shade', { x: ox + 4, z: oz + 2, w: 6, d: 5, col: '#c8b088' });
      api.roundBox(ox + 4.5, 0, oz + 3.6, 2.6, 1.0, 0.9, '#6a4a32', { r: 0.12 });
      api.sign('RANGER\nOUTPOST', ox + 4.5, oz + 6, { h: 1.0, style: { bg: '#3a2a1a', fg: '#f4e2b0', size: 27, border: '#f4e2b0' } });
      api.cylinder(ox + 1.2, 0, oz + 5.5, 0.45, 0.9, '#2a6aa8', { gloss: 2 });
      api.pickup('water', ox + 1.2, 1.4, oz + 5.5);
      api.light(ox + 4, oz + 2, 9, '#ffcf90', 0.5);
      api.npc({ id: 'sage', name: 'RANGER SAGEBRUSH', type: 'ranger', seed: 4, x: ox + 3.5, z: oz + 1.6, yaw: Math.PI,
        talk(g2, a) {
          const st = g2.missions.state('ranger');
          if (st === 'available') g2.say(a, ['First night? No camp? I\'m a Ranger. Not a cop. Totally different hat. The hat is VERY different. Let me explain the hat.', 'Okay, no time for the hat. The city is a clock. The Man sits in the middle. CLOCK streets go OUT like hands: 6:00, 6:30, 7:00...', 'LETTER streets go AROUND: Esplanade on the inside, then A, B, C, all the way out. Principle Number Three applies. Also Principle Seven. I\'ll summarize all ten.', '...And that is Principle Ten. Also, I\'m writing you up. Citation: one bike light, insufficiently bright. You don\'t have a bike? I\'m citing the bike you WILL have.', 'Quiz time! Go stand under the 6:30 and A sign. Then we\'ll talk about where you\'re sleeping tonight.'], () => { g2.toast('CITATION: DIM BIKE LIGHT (FUTURE)'); g2.missions.start('ranger'); });
          else if (st === 'active') g2.say(a, ['6:30 is one street over toward 7. A is the first ring past Esplanade. Look up at the signs, friend.']);
          else g2.say(a, ['Ask the camp leads with the question marks. And Center Camp has couches. Drink water. That\'s an order. I\'m not a cop, it\'s a suggestion.']);
        } });
      api.npc({ type: 'ranger', seed: 9, name: 'RANGER BUTTONS', x: 100, z: -48, behavior: 'walk', path: [[100, -48], [60, -96], [100, -48]], speed: 1.2,
        lines: ['Sign says 6:00 and Esplanade. That means you\'re at 6:00 and Esplanade. I love this job.', 'Saw a forty-foot wooden fella stomping around the open playa. Hard to miss. Easy to lose.'], gift: { kind: 'water' } });
      api.checkpoint('cp_esp', ox - 4, oz + 2, { yaw: 0, name: 'Ranger Outpost' });
      api.sign('WELCOME TO\nTHE CITY', 72, -66, { h: 1.2, style: { bg: '#24102e', fg: '#ffe0f4', glow: '#ff4fd8', size: 28, border: '#ff4fd8' }, glow: '#ff4fd8' });
      api.sign('YOU ARE HERE\n(PROBABLY)', 92, -70, { h: 0.9, yaw: -0.3, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 24, border: '#3a1a10' } });
    }
    /* ---------------- the Fire Conclave (open playa) ---------------- */
    {
      const { x: cx, z: cz } = S.conclave;
      api.cylinder(cx, 0, cz, 2.4, 0.45, '#3a2a2a', { round: 0.12, col: { y1: 0.45 } });
      api.mesh(cx, cz, m => { m.color('#ff7a2a', 1); BW.ring(m, 0, 0.47, 0, 2.2, 0.06, { seg: 28, tseg: 4 }); m.emissive(0); return {}; });
      for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; api.mesh(cx + Math.sin(a) * 15.5, cz + Math.cos(a) * 15.5, m => { m.color('#5a4030'); BW.post(m, 0, 0, 0, 0.08, 0.9); m.color('#ff9a3a', 1); BW.ball(m, 0, 0.95, 0, 0.1); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 0.9, camPass: true }], lights: [{ x: 0, y: 0.95, z: 0, s: 0.45, c: '#ff9a3a' }] }; }); }
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.26; api.prop('barrel', { x: cx + Math.sin(a) * 17.5, z: cz + Math.cos(a) * 17.5 }); }
      api.light(cx, cz, 18, '#ff8a3a', 0.45);
      api.sign('FIRE\nCONCLAVE', cx + 2, cz + 19.5, { h: 1.1, yaw: 0.1, style: { bg: '#2a0a0a', fg: '#ffb04a', glow: '#ff6a1a', size: 28, border: '#ff7a2a' }, glow: '#ff7a2a' });
      api.npc({ id: 'flint', name: 'FIRE MARSHAL FLINT', type: 'burner', seed: 31, x: cx + 1.5, z: cz + 17.2, yaw: Math.PI,
        spec: Object.assign(BurnsRig.npcSpec('burner', 31), { top: { kind: 'tee', col: '#c83a1a' }, vest: 'hivis', hat: { kind: 'hardhat', col: '#ffd84a' }, prop: 'radio', key: 'w2:flint' }),
        talk(g2, a) {
          const st = g2.missions.state('conclave');
          if (st === 'available') g2.say(a, ['Looking for a camp? Fire Mama Ember runs the conclave. She\'s in the middle of the circle.', 'Two rings of spinners, both going round. Wait for a gap. Walk, don\'t dawdle. Never hug a poi.'], () => g2.missions.start('conclave'));
          else if (st === 'active') g2.say(a, ['Inner ring and outer ring turn opposite ways. Stand between them if you need a breather.']);
          else g2.say(a, ['Still got your eyebrows? Proud of you.']);
        } });
      api.npc({ id: 'ember', name: 'FIRE MAMA EMBER', type: 'burner', seed: 32, x: cx, z: cz - 0.8, y: 0.45, fixedY: true, behavior: 'dance', style: 1,
        spec: Object.assign(BurnsRig.npcSpec('burner', 32), { top: { kind: 'crop', col: '#ff6a1a' }, bottom: { kind: 'tutu', col: '#ff3b1a' }, coat: { kind: 'kimono', col: '#ffb02a', trim: '#ff3b1a' }, hair: { style: 'afro', col: '#ff5a1a', hi: '#ffd84a' }, face: 'lashes', acc: ['ledNecklace', 'bracelets'], key: 'w2:ember' }),
        lines: ['Fire is just light that got excited.', 'Practice with a sock on a string, baby. Then we\'ll talk.'] });
      // the spinners: two rings turning opposite ways
      const rings = [{ r: 6.6, n: 7, om: 0.32 }, { r: 11.6, n: 10, om: -0.22 }];
      let si = 0;
      for (const rg of rings) for (let i = 0; i < rg.n; i++) {
        const kind = ['poi', 'staff', 'poi', 'fans'][si % 4];
        S.spinners.push(api.npc(BW.castDef('firespinner', 300 + si, { behavior: 'w2Spinner', name: 'FIRE SPINNER', cx, cz, ring: rg.r, omega: rg.om, phase: i / rg.n * TAU, kind, collide: false, chatter: true,
          chat: ['Spin it to win it!', 'Mind the poi, honey!', 'Fire is a love language.', 'I can\'t stop. I don\'t know how to stop.', 'Smells like eyebrows!'], x: cx + rg.r, z: cz, tool: kind === 'fans' ? 'fans' : kind === 'staff' ? 'staff' : 'poi' })));
        si++;
      }
      // fire dancers ringing the edge (ambient)
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.6; api.npc(i % 2 ? { type: R.pick(['burner', 'tutu', 'sparklepony']), seed: 340 + i, x: cx + Math.sin(a) * 19.5, z: cz + Math.cos(a) * 19.5, behavior: 'dance', style: i % 6, yaw: a + Math.PI } : BW.castDef('firespinner', 340 + i, { name: 'FIRE DANCER', x: cx + Math.sin(a) * 19.5, z: cz + Math.cos(a) * 19.5, behavior: 'dance', style: 5, yaw: a + Math.PI, lines: ['The conclave is family. Hot, slightly singed family.', 'Wear natural fibers near fire. Polyester is a choice. A melty choice.'] })); }
      api.checkpoint('cp_conclave', cx - 5, cz + 19, { yaw: Math.PI, name: 'Fire Conclave' });
      api.glowRing(cx, cz, 9.1, 14); api.glowRing(cx, cz, 14.2, 18);
      api.pickup('water', cx + 8, 0.9, cz + 17);
      api.marker('conclave', cx, cz, 'Conclave', { col: '#ff7a2a' });
    }
    /* ---------------- Lighthouse of Lost Souls (secret climb) ---------------- */
    {
      const { x: tx, z: tz } = S.tower;
      const prof = []; const bands = ['#e8e0d8', '#c8202a'];
      for (let k = 0; k < 7; k++) { const y0 = k * 1.9, y1 = y0 + 1.9, r0 = 2.1 - y0 * 0.045, r1 = 2.1 - y1 * 0.045, c = bands[k % 2]; prof.push([r0, y0, c], [r1, y1, c]); }
      prof.push([2.6, 13.3, '#3a3a40'], [2.6, 13.6, '#3a3a40'], [0, 13.6, '#3a3a40']);
      api.mesh(tx, tz, m => {
        m.color('#e8e0d8'); m.lathe(prof, { seg: 22 });
        m.color('#2a2a30'); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; BW.limb(m, Math.sin(a) * 2.45, 13.6, Math.cos(a) * 2.45, Math.sin(a) * 2.45, 14.6, Math.cos(a) * 2.45, 0.04); }
        BW.ring(m, 0, 14.6, 0, 2.45, 0.05, { seg: 28, tseg: 4 });
        m.color('#fff4c8', 1); BW.egg(m, 0, 15.0, 0, 0.9, 1.0, 0.9); m.emissive(0);
        m.color('#2a2a30'); BW.cone(m, 0, 15.8, 0, 1.2, 1.1, { seg: 16 });
        return { cols: [{ t: 'cyl', x: 0, z: 0, r: 2.1, y0: 0, y1: 13.3 }, { t: 'cyl', x: 0, z: 0, r: 2.62, y0: 13.0, y1: 13.6 }, { t: 'cyl', x: 0, z: 0, r: 1.0, y0: 13.6, y1: 16.9 }], lights: [{ x: 0, y: 15, z: 0, s: 7, c: '#fff4c8' }] };
      });
      // spiral of floating steps
      for (let i = 0; i < 13; i++) { const a = i * 0.72 + 0.3, y = 1.0 + i * 0.98, rr = 3.25; api.roundBox(tx + Math.sin(a) * rr, y - 0.28, tz + Math.cos(a) * rr, 1.5, 0.28, 1.3, BURNS_NEON[i % 7], { yaw: a, r: 0.1, e: 0.35 }); }
      api.glowArc(tx + 3.3, 1.6, tz, tx + 1.3, 14.4, tz, 2.5, 9);
      api.light(tx, tz, 14, '#fff0c0', 0.45);
      api.sign('LIGHTHOUSE\nOF LOST SOULS', tx + 5.5, tz + 5, { h: 1.0, yaw: 0.6, style: { bg: '#0a1a2a', fg: '#c8f0ff', glow: '#38f2ff', size: 26, border: '#38f2ff' }, glow: '#38f2ff' });
      api.pickup('photo', tx - 1.7, 14.5, tz + 0.6, { id: 'p1' });
    }
    /* ---------------- the Retro Rocket (big art; gantry climb + launch button) ---------------- */
    W2.placeRocket(api, g, 130, -68);
    /* ---------------- LSD-only: floating jellyfish over the open playa ---------------- */
    {
      api.pickup('bag:lsd', 112, 0.9, -78);
      api.sign('JELLYFISH\nSIGHTINGS: 0', 118, -84, { h: 0.9, yaw: -0.8, style: { bg: '#0a1a2a', fg: '#c8f0ff', size: 23, border: '#38f2ff' } });
      const J = [[120, 1.4, -92], [124, 2.9, -98], [121, 4.4, -104.5], [114.5, 5.9, -106], [108, 7.3, -103], [104, 8.6, -97]];
      api.hidden(() => {
        J.forEach(([x, y, z], i) => api.mesh(x, z, m => {
          m.color(burnsHSL(290 + i * 22, 0.9, 0.62), 0.55); BW.egg(m, 0, -0.05, 0, 1.4, 0.75, 1.4, { phi1: Math.PI / 2 + 0.25, seg: 14, rings: 6 });
          m.color('#7af2ff', 0.8); for (let k = 0; k < 5; k++) { const a = k / 5 * TAU; BW.tube(m, [[Math.sin(a) * 0.8, -0.1, Math.cos(a) * 0.8], [Math.sin(a + 0.3) * 0.9, -1.0, Math.cos(a + 0.3) * 0.9], [Math.sin(a) * 0.7, -1.8, Math.cos(a) * 0.7]], 0.05); }
          m.emissive(0);
          return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.35, y0: -0.3, y1: 0.05 }], lights: [{ x: 0, y: 0.2, z: 0, s: 2.2, c: '#ff8ad8' }] };
        }, { y: y }));
      });
      api.glowsticks([[104, 9.8, -97], [108, 8.6, -103], [114.5, 7.2, -106]], { hidden: true });   // LSD-only bonus up on the jellies
    }
    /* ---------------- Camp Combustion: Flame Alley ---------------- */
    {
      // alley along the 7.5° radial between B and C (r 154 -> 176), walled, dead end with the bell
      const th = 7.5, a = th * Math.PI / 180, dirX = -Math.sin(a), dirZ = Math.cos(a), sideX = Math.cos(a), sideZ = Math.sin(a), yaw = Math.atan2(dirX, dirZ);
      const [sx, sz] = at(th, 156), [ex, ez] = at(th, 176.5);
      S.alley = { sx, sz, ex, ez, yaw };
      const len = Math.hypot(ex - sx, ez - sz), mx = (sx + ex) / 2, mz = (sz + ez) / 2;
      for (const s of [-1, 1]) api.roundBox(mx + sideX * s * 2.7, 0, mz + sideZ * s * 2.7, 1.2, 4.6, len + 1.5, '#4a3a3e', { yaw, r: 0.3, col: { walk: false } });
      api.roundBox(ex + dirX * 1.6, 0, ez + dirZ * 1.6, 6.6, 4.6, 1.0, '#4a3a3e', { yaw, r: 0.3, col: { walk: false } });
      // steel arches with poofer heads
      for (let k = 0; k <= 4; k++) { const t = k / 4, x = lerp(sx, ex, t), z = lerp(sz, ez, t); api.mesh(x, z, m => { m.color('#6a6a72').shine(2); BW.ring(m, 0, 0, 0, 2.7, 0.14, { pitch: Math.PI / 2, seg: 20, tseg: 6 }); m.shine(0); m.color('#ff6a1a', 1); BW.ball(m, 0, 2.75, 0, 0.22); m.emissive(0); return { lights: [{ x: 0, y: 2.75, z: 0, s: 0.8, c: '#ff6a1a' }] }; }, { yaw }); }
      // floor jets: 6 stations x 3 lanes, a wave of fire chasing the runner
      for (let k = 0; k < 6; k++) for (let l = -1; l <= 1; l++) {
        const t = (k + 0.7) / 6.4, x = lerp(sx, ex, t) + sideX * l * 1.35, z = lerp(sz, ez, t) + sideZ * l * 1.35;
        S.jets.push(api.flameJet(x, 0, z, { h: 3.6, period: 2.6, on: 1.0, phase: (k * 0.42 + (l === 0 ? 0.65 : 0)) % 2.6, r: 0.62 }));
        api.cylinder(x, 0, z, 0.32, 0.12, '#3a3a40', { noCol: true });
      }
      // the finish bell
      api.mesh(ex, ez, m => { m.color('#5a4030'); BW.post(m, 0, 0, 0, 0.08, 2.6); m.color('#ffd84a', 0.4).shine(3); BW.lathe(m, 0, 1.7, 0, [[0.42, 0], [0.4, 0.06], [0.25, 0.35], [0.2, 0.62], [0, 0.66]], { seg: 14 }); m.shine(0).emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: 2.6, camPass: true }], lights: [{ x: 0, y: 2.0, z: 0, s: 1.2, c: '#ffd84a' }] }; });
      M('alley').target.x = ex - dirX * 1.0; M('alley').target.z = ez - dirZ * 1.0;
      // exit door (opens after the run)
      S.alleyDoor = api.collider({ t: 'box', x: ex + dirX * 0.4, z: ez + dirZ * 0.4, hx: 2.2, hz: 0.3, y0: 0, y1: 4.6, yaw, walk: false });
      api.sign('FLAME ALLEY\nDON\'T DAWDLE', sx - dirX * 2 + sideX * 4.2, sz - dirZ * 2 + sideZ * 4.2, { h: 1.1, yaw: yaw + Math.PI, style: { bg: '#2a0a0a', fg: '#ff9a3a', glow: '#ff4a1a', size: 28, border: '#ff9a3a' }, glow: '#ff7a2a' });
      api.npc({ id: 'sparky', name: 'SPARKY', type: 'burner', seed: 51, x: sx - dirX * 2.6 - sideX * 3.6, z: sz - dirZ * 2.6 - sideZ * 3.6, yaw: yaw + Math.PI,
        spec: Object.assign(BurnsRig.npcSpec('burner', 51), { top: { kind: 'tank', col: '#2a2a2a' }, goggles: true, hat: null, glasses: null, acc: ['toolbelt'], hair: { style: 'mohawk', col: '#ff6a1a', hi: '#ffd84a' }, key: 'w2:sparky' }),
        talk(g2, a) {
          const st = g2.missions.state('alley');
          if (st === 'available') g2.say(a, ['Wanna join Camp Combustion? Everybody auditions! This is Flame Alley. Eighteen poofers, one bell, twenty seconds.', 'The fire comes in waves. Run in the gaps. Ring the bell at the end. GO GO GO!'], () => g2.missions.start('alley'));
          else if (st === 'active') g2.say(a, ['Why are you talking to me?! RUN!']);
          else g2.say(a, ['You smell like a campfire and victory. Still full, though. Fire code.']);
        } });
      api.light(mx, mz, 14, '#ff6a2a', 0.5);
      api.checkpoint('cp_alley', sx - dirX * 4 + sideX * 4, sz - dirZ * 4 + sideZ * 4, { yaw: yaw, name: 'Camp Combustion' });
      api.glowLine(sx + dirX * 1.5, sz + dirZ * 1.5, ex - dirX * 2, ez - dirZ * 2, 10, 1.6);
    }
    /* ---------------- Camp Blinky (bike lights) + bike swarms ---------------- */
    {
      const [bx, bz] = [34, 22];
      api.prop('shade', { x: bx, z: bz, w: 8, d: 6, col: '#2a2a3a' });
      api.roundBox(bx, 0, bz - 2, 3.6, 0.95, 1.0, '#3a3a48', { r: 0.12 });
      for (let i = 0; i < 6; i++) api.mesh(bx - 3 + i * 1.2, bz + 3.6, m => BW.bike(m, BURNS_NEON[i % 7], { led: BURNS_NEON[(i + 3) % 7], lo: true }), { yaw: Math.PI / 2 });
      api.sign('CAMP BLINKY\nBIKE LIGHT REPAIR', bx + 4.5, bz + 4.5, { h: 1.1, yaw: -0.5, style: { bg: '#0a0a1a', fg: '#7af2ff', glow: '#38f2ff', size: 26, border: '#38f2ff' }, glow: '#38f2ff' });
      for (let i = 0; i < 14; i++) api.glow(bx - 4 + (i % 7) * 1.3, 2.7 + Math.floor(i / 7) * 0.12, bz + (i < 7 ? 3 : -3), 0.4, BURNS_NEON[i % 7], { blink: 4 });
      api.light(bx, bz, 11, '#38c8ff', 0.5);
      api.npc({ id: 'lumen', name: 'LUMEN', type: 'ledsuit', seed: 6, x: bx + 1.4, z: bz - 1.0, yaw: 0.6,
        talk(g2, a) {
          const st = g2.missions.state('lights');
          if (st === 'available') g2.say(a, ['A bike swarm came through. Forty bikes, zero brakes. My lights went EVERYWHERE.', 'Eight LED bike lights. Bring them all back and we\'ll talk about you joining Camp Blinky.', 'Swarms ride the B and C streets. If you hear bells, get off the road!'], () => g2.missions.start('lights'));
          else if (st === 'active') g2.say(a, [`${g2.missions.get('lights').n} of 8! Little blinky babies, come home!`]);
          else g2.say(a, ['Center Camp has couches, sparkle. Everybody fits on a couch.']);
        } });
      api.checkpoint('cp_blinky', bx - 5.5, bz - 1, { yaw: Math.PI / 2, name: 'Camp Blinky' });
      // the lights: on the swarm streets (B = 152 and C = 178)
      const LP = [[3, 152], [22, 152], [-8, 178], [12, 178], [30, 178], [52, 152.5], [-22, 152], [40, 180]];
      LP.forEach(([th, r], i) => { const [x, z] = at(th, r + (i % 2 ? 2 : -2)); api.pickup('item:bikelight', x, 0.8, z, { mission: 'lights', gate: true, id: 'bl' + i, col: '#38f2ff' }); });
      // two swarms (enemy cyclists who knock you over)
      const swarmPath = (rA, rB, th0, th1) => { const p = []; for (let th = th0; th <= th1; th += 5) p.push(at(th, rA)); p.push(at(th1, (rA + rB) / 2)); for (let th = th1; th >= th0; th -= 5) p.push(at(th, rB)); p.push(at(th0, (rA + rB) / 2)); return p; };
      const routes = [swarmPath(152, 178, -28, 55), swarmPath(178, 152, -20, 58)];
      routes.forEach((path, sw) => {
        for (let i = 0; i < 5; i++) {
          const col = BURNS_NEON[(i + sw * 2) % 7], mv = BW.bikeMover(api, col, { led: BURNS_NEON[(i + 3) % 7] });
          const d = api.enemy({ type: R.pick(['burner', 'ledsuit', 'tutu', 'furcoat']), seed: 400 + sw * 10 + i, name: 'BIKE SWARM', behavior: 'w234Cyclist', path, startIndex: Math.floor(i * 0.6) + sw * 9, speed: 7.4 + (i % 3) * 0.3, bikeMv: mv, hazard: true, hp: 1, x: path[0][0] + i * 1.5, z: path[0][1] + (i % 2) * 1.2, collide: false,
            taunts: ['BIKE LAAANE!', 'ON YOUR LEFT! AND RIGHT!', 'DING DING DING!'], always: true });
          S.swarms.push(d);
        }
      });
      api.sign('BIKE SWARM\nCROSSING', ...at(10, 165), { h: 0.9, yaw: W2.outYaw(10) + Math.PI / 2, style: { bg: '#ffe24a', fg: '#2a1a10', size: 24, border: '#2a1a10' } });
    }
    /* ---------------- lost burners (want 4:30) ---------------- */
    {
      const LOST = [
        { id: 'lost1', name: 'LOST LARRY', type: 'burner', seed: 71, x: 107, z: -32, dest: [0, 178], addr: '6:00 & C', lines: ['Excuse me. Where\'s 4:30? I\'ve been walking toward 4:30 since Tuesday.', 'Wait. I wrote my address on my arm. It says... 6:00 & C. Is that close?'] },
        { id: 'lost2', name: 'DIZZY DAISY', type: 'tutu', seed: 72, x: 66, z: -38, dest: [15, 126], addr: '6:30 & A', lines: ['Is this 4:30? It feels like 4:30.', 'My camp has a giant inflatable avocado. 6:30 and A? Take me there and I\'ll love you forever. Or until sunrise.'] },
        { id: 'lost3', name: 'MOONBEAM', type: 'furcoat', seed: 73, x: 21, z: -80, dest: [30, 152], addr: '7:00 & B', lines: ['Brother. Where is 4:30? I need to be at 4:30 at... 4:30.', 'Oh. Oh no. My camp is 7:00 & B. It always was. Walk me?'] }
      ];
      for (const L of LOST) {
        const [dx, dz] = at(L.dest[0], L.dest[1] - 5);
        L.dx = dx; L.dz = dz;
        api.npc({ id: L.id, name: L.name, type: L.type, seed: L.seed, x: L.x, z: L.z, behavior: 'wander', radius: 3, followDist: 2.2 + LOST.indexOf(L) * 0.9, lost: L,
          chat: ['Where\'s 4:30?', 'Is it 4:30 yet?', 'Has anyone seen 4:30?'],
          marker: (g2, a) => a.w2home ? null : a.behName === 'follow' ? '?' : (g2.missions.state('lost') !== 'done' ? '!' : null),
          talk(g2, a) {
            const st = g2.missions.state('lost');
            if (a.w2home || st === 'done') { g2.say(a, ['Home sweet dusty home. You\'re a legend.']); return; }
            if (a.behName === 'follow') { g2.say(a, [`${L.addr}! ${L.addr}! Lead the way, captain.`]); return; }
            g2.say(a, L.lines.concat([`(${L.name} is following you. Walk them to ${L.addr}.)`]), () => { if (st === 'available') g2.missions.start('lost'); a.setBehavior('follow'); a.say('Lead on!', 1.4); });
          } });
        api.marker(L.id + 'home', dx, dz, L.addr, { col: '#7aff5a' });
      }
      S.lost = LOST;
    }
    /* ---------------- Safety Camp: Captain Safety Third (MOOP sweep, lecture waves) ---------------- */
    {
      const [qx, qz] = S.capCamp, yaw = Math.atan2(W2.C.x - qx, W2.C.z - qz), fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const L = (a, b) => [qx + rx * a + fx * b, qz + rz * a + fz * b];
      M('moop').marker = { x: qx, z: qz };
      api.mesh(qx, qz, m => {
        const cols = [];
        // impeccable shade with reflective tape on every pole
        m.color('#c8c8c0'); BW.rb(m, 0, 3.0, -1, 7.4, 0.12, 5.4, 0.05);
        for (const [a, b] of [[-3.5, -3.5], [3.5, -3.5], [-3.5, 1.5], [3.5, 1.5]]) { m.color('#5a5a62'); BW.post(m, a, 0, b, 0.08, 3.0); m.color('#e8ff5a', 0.9); for (let k = 0; k < 3; k++) BW.ring(m, a, 0.6 + k * 0.9, b, 0.085, 0.022, { seg: 10, tseg: 3 }); m.emissive(0); cols.push({ t: 'cyl', x: a, z: b, r: 0.1, y0: 0, y1: 3.0, camPass: true }); }
        cols.push({ t: 'box', x: 0, z: -1, hx: 3.7, hz: 2.7, y0: 2.94, y1: 3.06 });
        // labelled bins in a perfect row
        ['#2a6ad8', '#2a9a4a', '#8a8a92', '#d8a020'].forEach((c, i) => { const bx = -2.7 + i * 1.8; m.color(c); BW.rb(m, bx, 0.5, -3.0, 1.2, 1.0, 0.9, 0.16); m.color('#e8ff5a', 0.9); BW.rb(m, bx, 0.85, -2.54, 1.0, 0.07, 0.02, 0.01); m.emissive(0); cols.push({ t: 'box', x: bx, z: -3.0, hx: 0.6, hz: 0.45, y0: 0, y1: 1.0 }); });
        // gray-water evaporation pond
        m.color('#3a3a44'); BW.rb(m, 3.2, 0.12, 3.2, 3.0, 0.24, 2.0, 0.1); m.color('#6a8aa8', 0.25).shine(3); BW.rb(m, 3.2, 0.25, 3.2, 2.7, 0.04, 1.7, 0.02); m.shine(0).emissive(0);
        cols.push({ t: 'box', x: 3.2, z: 3.2, hx: 1.5, hz: 1.0, y0: 0, y1: 0.28 });
        // the laminated chore wheel
        m.color('#5a5a62'); BW.post(m, -3.4, 0, 2.6, 0.06, 1.4); m.push(); m.tf(-3.4, 1.9, 2.6, 0.4, Math.PI / 2, 0);
        ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a', '#9a6bff'].forEach((c, i) => { m.color(c); m.lathe([[0, 0], [0.6, 0], [0.6, 0.04], [0, 0.04]], { seg: 6, theta0: i / 6 * TAU, theta1: (i + 1) / 6 * TAU }); });
        m.pop(); m.color('#e8e8f0').shine(3); BW.ring(m, -3.4, 1.9, 2.6, 0.62, 0.03, { pitch: Math.PI / 2, yaw: 0.4, seg: 18, tseg: 4 }); m.shine(0);
        // a fire extinguisher and a first-aid kit (obviously)
        m.color('#d82a2a').shine(2); BW.post(m, 1.6, 0, -2.2, 0.16, 0.7); m.shine(0); m.color('#f4f4f0'); BW.rb(m, -0.6, 0.2, -2.0, 0.6, 0.4, 0.4, 0.08); m.color('#d82a2a'); BW.rb(m, -0.6, 0.25, -1.79, 0.1, 0.24, 0.02, 0.01); BW.rb(m, -0.6, 0.25, -1.79, 0.24, 0.1, 0.02, 0.01);
        return { cols, lights: [{ x: 0, y: 2.8, z: -1, s: 2.4, c: '#f4f8ff', pool: 10 }, { x: -3.4, y: 1.9, z: 2.6, s: 0.6, c: '#e8ff5a' }] };
      }, { yaw });
      for (let i = 0; i < 6; i++) { const [cx, cz] = L(-4 + i * 1.6, 4.6); api.prop('cone', { x: cx, z: cz }); }
      { const [sx, sz] = L(4.6, -1.2); api.sign('SAFETY CAMP\nSAFETY THIRD\n(BUT STILL)', sx, sz, { h: 1.3, yaw, style: { bg: '#e8ff5a', fg: '#1a1a10', size: 24, border: '#1a1a10' } }); }
      { const [sx, sz] = L(-3.4, 2.62); api.sign('CHORE WHEEL\n(LAMINATED)', sx + rx * 0.01, sz + rz * 0.01, { h: 0.5, y: 0.9, post: false, yaw: yaw + 0.4, style: { bg: '#f4f4f0', fg: '#1a1a10', size: 21 } }); }
      const capLook = BW.engineType('safetycaptain') ? { type: 'safetycaptain', seed: 61 } : { spec: Object.assign(BurnsRig.npcSpec('burner', 61), { top: { kind: 'button', col: '#4a5a3a' }, vest: 'hivis', led: '#e8ff5a', bottom: { kind: 'cargo', col: '#3a3a30' }, shoes: { kind: 'boots', col: '#1a1a14' }, hat: { kind: 'hardhat', col: '#ffd21a' }, glasses: 'clear', face: 'stern', acc: ['headset', 'toolbelt'], prop: 'clipboard', beard: null, goggles: false, key: 'w2:captain' }) };
      const [cx, cz] = L(0.6, 1.8);
      S.captainDef = api.npc(Object.assign(capLook, { id: 'captain', name: 'CAPTAIN SAFETY THIRD', x: cx, z: cz, yaw, behavior: 'w2Captain', chatter: false,
        talk(g2, a) {
          const st = g2.missions.state('moop');
          const st2 = g2.missions.state('darkwads');
          if (st === 'available') BURNS_W2.captainLecture(g2, a);
          else if (st === 'active') g2.say(a, [`${g2.missions.get('moop').n} of 10 MOOP items. I counted. Twice. Then I laminated the count.`]);
          else if (st2 === 'available') g2.say(a, ['New assignment. DARKWADS. Unlit pedestrians. Zero lumens. Out on the far streets, walking around in BLACK.', 'You won\'t see them until you\'re face-first in one. Spin or stomp them and stick some glow on them. Four of them. Move out.'], () => g2.missions.start('darkwads'));
          else if (st2 === 'active') g2.say(a, [`${g2.missions.get('darkwads').n} of 4 darkwads illuminated. Your headlamp helps. You\'re welcome.`]);
          else g2.say(a, ['Headlamp: on. Hydration: up. Fun: ...I\'ll schedule some fun. Tuesday. Fourteen hundred hours.']);
        } }));
      api.trigger({ x: qx, z: qz, r: 10, onEnter: g2 => { if (g2.missions.state('moop') === 'available' && !S.capMet && !g2.cine) BURNS_W2.captainLecture(g2, g2.actor('captain')); } });
      // MOOP: litter scattered around the Esplanade
      const MP = [[18, 104], [24, 106], [27, 118], [14, 117], [31, 108], [36, 118], [9, 106], [40, 112], [22, 128], [33, 130]];
      MP.forEach(([th, r], i) => { const [x, z] = W2.at(th, r); api.pickup('item:moop', x, 0.7, z, { mission: 'moop', gate: true, id: 'moop' + i }); });
      api.light(qx, qz, 12, '#f4f8ff', 0.4);
    }
    /* ---------------- a sparkle pony asking strangers for water ---------------- */
    {
      const [x, z] = at(-5, 112);
      api.npc({ id: 'pony', name: 'GLITTERBOMB', type: 'sparklepony', seed: 7, x, z, yaw: Math.PI * 0.9, behavior: 'wander', radius: 2.5,
        chat: ['Water? Anyone? I take payment in good vibes.', 'I brought three suitcases of costumes. And zero cups.', 'Is that a water bottle or are you just happy to see me?', 'Hydration is a social construct. Kidding. Please. Water.'],
        talk(g2, a) {
          if (a.w2paid) { g2.say(a, ['You\'re my favorite stranger. Today. So far.']); return; }
          if (g2.player.hydration < 3) { g2.say(a, ['Oh no, honey. You\'re thirstier than me. And I\'m a sparkle pony. Go to the pickle juice bar.']); return; }
          g2.say(a, ['Hi! I love your bun. Can I have some water? I brought three suitcases of faux fur and no cup.', '(You pour her a little of your water.)', 'Bless. Good vibes, transferred! Here: glow sticks. I found them in my fur coat. I don\'t know whose they are. Now they\'re yours.'], () => {
            a.w2paid = true; g2.player.hydration = Math.max(1, g2.player.hydration - 1); g2.toast('-1 HYDRATION · +GOOD VIBES'); g2.fx.hearts(a.x, a.y + 2, a.z, 12);
            if (g2.grant) g2.grant({ glow: 10 }); else { g2.glow += 10; g2.toast('+10 GLOW STICKS'); } burnsSfx('gift', null, 'pick');
          });
        } });
    }
    /* ---------------- gifting camps, drunks and camp leads ---------------- */
    {
      const bar = (x, z, yaw, title, col, npc) => {
        api.mesh(x, z, m => { m.color(col); BW.rb(m, 0, 0.55, 0, 3.2, 1.1, 0.9, 0.3); m.color('#f4e8d8'); BW.rb(m, 0, 1.12, 0, 3.4, 0.1, 1.1, 0.04); m.color('#3a2a2a'); for (const sx of [-1, 0, 1]) { BW.post(m, sx * 1.1, 0, 1.0, 0.05, 0.75); BW.egg(m, sx * 1.1, 0.8, 1.0, 0.25, 0.08, 0.25); } return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 0.45, y0: 0, y1: 1.15 }], lights: [{ x: 0, y: 1.6, z: 0, s: 1.6, c: '#ffd890', pool: 8 }] }; }, { yaw });
        api.sign(title, x - Math.sin(yaw) * 1.6, z - Math.cos(yaw) * 1.6, { yaw, h: 0.9, y: 2.2, style: { bg: '#1a0a1a', fg: '#ffe7a0', glow: '#ff9a3a', size: 24, border: '#ff9a3a' }, glow: '#ff9a3a' });
        npc.x = x - Math.sin(yaw) * 0.9; npc.z = z - Math.cos(yaw) * 0.9; npc.yaw = yaw; api.npc(npc);
      };
      { const [x, z] = at(-8, 113); bar(x, z, Math.atan2(W2.C.x - x, W2.C.z - z), 'PICKLE JUICE\nBAR', '#3a7a3a', { id: 'pete', name: 'PICKLE PETE', type: 'crusty', seed: 81, lines: ['Pickle juice! Electrolytes! Gifted, not bartered!', 'Your hydration looks low. Your vibe looks high. Drink up.'], gift: { kind: 'water' } }); }
      { const [x, z] = at(22, 139); bar(x, z, Math.atan2(W2.C.x - x, W2.C.z - z), 'GRILLED\nCHEESUS', '#d89a2a', { id: 'cheesus', name: 'GRILLED CHEESUS', type: 'burner', seed: 82, lines: ['Grilled cheese at 2 AM is a human right.', 'Take these glow sticks. And this sandwich. You can\'t see the sandwich. It\'s spiritual.'], gift: { kind: 'glowstick', n: 10 } }); }
      { const [x, z] = at(38, 165); bar(x, z, Math.atan2(x - W2.C.x, z - W2.C.z), 'CAMP SIZZLE\nFREE BACON 2 AM', '#a83a2a', { id: 'sizzle', name: 'BACON BRO', type: 'crusty', seed: 83, lines: ['Bacon! It\'s 2 AM! The two best things!', 'Lost? Bacon helps. Bacon always helps. Here, have some glow sticks too.'], gift: { kind: 'glowstick', n: 8 } }); }
      const DRUNK = [[at(5, 138), 1], [at(27, 192), 2], [at(-12, 166), 3], [at(48, 140), 4], [at(19, 216), 5], [at(-20, 140), 6]];
      for (const [[x, z], i] of DRUNK) api.enemy({ type: i % 2 && BW.engineType('partiedtoohard') ? 'partiedtoohard' : R.pick(['burner', 'furcoat']), seed: 500 + i, name: 'CAMP NEIGHBOR', x, z, behavior: 'w2Drunk', hp: 1, drop: 3, afterDefeat: 'sleep', defeatLine: 'I love you, man... zzz', damage: 1 });
      for (const [[x, z], i] of [[at(-5, 196), 1], [at(52, 166), 2]]) api.enemy({ type: 'campLead', seed: 520 + i, x, z, behavior: 'shouter', hp: 2, aggro: 10, taunts: ['WHO TOOK MY GENERATOR?!', 'QUIET HOURS ARE A MYTH!', 'IS THAT YOUR TENT ON MY TENT?!'] });
      api.enemy({ type: 'burner', seed: 530, name: 'GLOW STICK THIEF', x: -40, z: -14, behavior: 'thief', hp: 1, steal: 6 });
    }
    /* ---------------- the lamplighters: a procession that lights 7:00 every night ---------------- */
    {
      S.lamps = [];
      for (let r = 106; r <= 198; r += 11.5) for (const sd of [-1, 1]) {
        const d = 4.6 * sd / r * 180 / Math.PI, [x, z] = at(30 + d, r);
        api.mesh(x, z, m => { m.color('#3a2e2a'); BW.post(m, 0, 0, 0, 0.07, 2.9); m.color('#d8d0c0'); BW.egg(m, 0, 3.05, 0, 0.16, 0.2, 0.16, { seg: 10, rings: 6 }); m.color('#2a2224'); BW.lathe(m, 0, 3.2, 0, [[0.18, 0], [0.1, 0.1], [0, 0.14]], { seg: 10 }); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 2.9, camPass: true, walk: false }] }; });
        api.glow(x, 3.05, z, 1.4, '#ffcf7a'); const gl = api.world.glows[api.world.glows.length - 1];
        gl.c0 = gl.c; gl.c = [0, 0, 0]; S.lamps.push({ x, z, gl, lit: false, r });
      }
      const route = []; for (let r = 104; r <= 200; r += 8) route.push(at(30, r));
      S.lampRoute = route;
      const [wx, wz] = at(30.5, 96);
      ['ELDER WICK', 'LAMPLIGHTER', 'LAMPLIGHTER'].forEach((nm, i) => {
        api.npc(BW.castDef('lamplighter', 700 + i, { id: i ? 'lamp' + i : 'wick', name: nm, x: wx + i * 1.4, z: wz - i * 1.6, yaw: W2.outYaw(30), behavior: 'idle', chatter: !!i,
          chat: ['Light is a gift you give the dark.', 'Mind the hem of my robe, friend.', 'Every lantern is somebody\'s way home.'],
          talk: i ? null : (g2, a) => {
            const st = g2.missions.state('lanterns');
            if (st === 'available') g2.say(a, ['Good evening, traveler. Every night we carry the lanterns out along 7:00, so the lost can find their way home.', 'Walk with us. Stay inside our light. The darkwads won\'t trouble you there, and the street will remember the way.'], () => g2.missions.start('lanterns'));
            else if (st === 'active') g2.say(a, ['Stay close, child. The light only reaches so far.']);
            else g2.say(a, ['The 7:00 lanterns burn for you tonight. Even without a home. Especially then.']);
          } }));
      });
      api.sign('LAMPLIGHTERS\nGATHER HERE', ...at(28.5, 92), { h: 0.9, yaw: W2.outYaw(30) + Math.PI, style: { bg: '#f4ecd8', fg: '#5a3a1a', size: 22, border: '#c8a060' } });
    }
    /* ---------------- darkwads (no lights, nearly invisible) + the undercover cop ---------------- */
    {
      const DW = [[[-8, 186], [14, 186]], [[-22, 214], [-2, 214]], [[2, 162], [2, 196]], [[20, 222], [20, 240], [8, 240]], [[-28, 168], [-28, 194]]];
      DW.forEach((pts, i) => { const path = pts.map(([th, r]) => at(th, r)); api.npc(BW.castDef('darkwad', 600 + i, { name: 'DARKWAD', behavior: 'w234Darkwad', path, speed: 1.0 + i * 0.1, x: path[0][0], z: path[0][1], chatter: true, hittable: true, chat: ['Lights are for people who want to be seen.', 'Shh. I\'m blending in. With the night.'] })); });
      const [cx, cz] = at(2, 60);
      api.npc(BW.castDef('cop', 7, { id: 'cop', name: 'TOTALLY NORMAL BURNER', behavior: 'w234Cop', suspect: g2 => !!(BURNS_W234.S && BURNS_W234.S.carry), spotLine: 'FREEZE! I mean... HEY BRO. WHAT\'S IN THE BIG BAG?', spotToast: 'UNDERCOVER COP! He wants to search your bag', chaseLines: ['RANDOM BAG CHECK! I mean... random bag... HUG?', 'SIR! IS THAT BAG... GROOVY?', 'STOP! IN THE NAME OF... THE VIBE!'], onCatch: (g2, a) => BURNS_W2.bagSearch(g2, a), x: cx, z: cz, view: 15, fov: 1.0, chaseSpeed: 5.4, friendly: false, chatter: false }));
      api.npc(BW.castDef('cop', 8, { name: 'ALSO A NORMAL BURNER', behavior: 'w234Cop', suspect: g2 => !!(BURNS_W234.S && BURNS_W234.S.carry), spotLine: 'FREEZE! I mean... HEY BRO. WHAT\'S IN THE BIG BAG?', spotToast: 'UNDERCOVER COP! He wants to search your bag', chaseLines: ['RANDOM BAG CHECK! I mean... random bag... HUG?', 'SIR! IS THAT BAG... GROOVY?', 'STOP! IN THE NAME OF... THE VIBE!'], onCatch: (g2, a) => BURNS_W2.bagSearch(g2, a), x: at(24, 176)[0], z: at(24, 176)[1], view: 13, chaseSpeed: 5.2, friendly: false, chatter: false }));
    }
    /* ---------------- the art car parade (a loop around Kevin's block) ---------------- */
    {
      const path = [];
      for (let th = 30; th <= 60; th += 3) path.push(at(th, 204));
      path.push(at(62, 212), at(63, 230), at(62, 248));
      for (let th = 60; th >= 30; th -= 2.5) path.push(at(th, 256));
      path.push(at(28, 248), at(27, 230), at(28, 212));
      const builds = [W2.carSnail, W2.carTeapot, W2.carCupcake, W2.carWhale, W2.carJelly, W2.carDisco];
      S.parade = BW.parade(api, { path, builds: builds.map(b => (m, i) => b.call(W2, m, i)), n: 24, speed: 2.4 });
      S.parade.onHit = (g2) => { g2.toast('ART CARS HAVE THE RIGHT OF WAY!'); };
      // a photo riding on top of the whale
      const car = S.parade.cars[3];
      api.pickup('photo', 0, 2.6, 0, { id: 'p2', follow: (g2, P) => { P.x = car.mv.x; P.z = car.mv.z; P.y0 = car.mv.y + 4.6; } });
      api.sign('ART CAR\nCROSSING', ...at(41.5, 196), { h: 1.0, yaw: W2.outYaw(41.5) + Math.PI, style: { bg: '#ffe24a', fg: '#2a1a10', size: 26, border: '#2a1a10' } });
      api.sign('THE PARADE\nNEVER ENDS', ...at(51, 196), { h: 0.9, yaw: W2.outYaw(51) + Math.PI, style: { bg: '#24102e', fg: '#ffd0f4', glow: '#ff4fd8', size: 23, border: '#ff4fd8' }, glow: '#ff4fd8' });
      { const [x, z] = at(38, 186); api.checkpoint('cp_parade', x, z, { yaw: W2.outYaw(38), name: 'Parade Route' }); }
      api.glowArc(...(() => { const a = at(45, 198), b = at(45, 210); return [a[0], 1.2, a[1], b[0], 1.2, b[1]]; })(), 3.2, 6);
    }
    /* ---------------- 7:30 & E: Kevin's camp (inside the parade loop) ---------------- */
    {
      const [hx, hz] = CAMP, oy = W2.outYaw(45), fx = Math.sin(oy), fz = Math.cos(oy), rx = Math.cos(oy), rz = -Math.sin(oy);
      const L = (a, b) => [hx + rx * a + fx * b, hz + rz * a + fz * b];
      // an RV, a dome, porta-potties, a shade, a couch and the tent with Brady's name on it
      { const [x, z] = L(-13, 4); api.prop('rv', { x, z, yaw: oy + Math.PI / 2 + 0.1, seed: 902, col: '#f0e6d4' }); }
      { const [x, z] = L(13, 6); api.prop('dome', { x, z, r: 5, col: '#e8d8f8', alt: '#c0a8e8', lights: true, glow: '#7ad8ff' }); }
      { const [x, z] = L(-6, -9); api.prop('portapotty', { x, z, yaw: oy, col: '#2a6ac8' }); const [x2, z2] = L(-4.7, -9); api.prop('portapotty', { x: x2, z: z2, yaw: oy, col: '#3a8a3a' }); }
      { const [x, z] = L(-1, 13); api.prop('shade', { x, z, w: 7, d: 5, col: '#cfe8c0' }); }
      { const [x, z] = L(1, 11); api.prop('couch', { x, z, yaw: oy + Math.PI, col: '#5a8a5a' }); }
      // the guest tent: roomy, cosy, suspiciously far from everyone else's
      const [tx, tz] = L(5, 1.5), tyaw = oy + Math.PI;
      api.mesh(tx, tz, m => { BW.tent(m, { r: 1.9, col: '#e8a040' }); m.color('#3a2a1a'); BW.rb(m, 0, 0.06, 1.7, 1.2, 0.1, 0.9, 0.04); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.5, y0: 0, y1: 1.6 }] }; }, { yaw: tyaw });
      S.tent = { x: tx + Math.sin(tyaw) * 2.6, z: tz + Math.cos(tyaw) * 2.6, yaw: tyaw, cx: tx, cz: tz };
      { const [x, z] = L(-14, -4); api.sign('CAMP NICE GUY\nFREE SHADE', x, z, { h: 1.3, yaw: oy + Math.PI, style: { bg: '#1a2a1a', fg: '#e8ffd0', glow: '#7aff5a', size: 28, border: '#7aff5a' }, glow: '#7aff5a' }); }
      { const [x, z] = L(8.5, -1.5); api.sign('FREE AURA\nREADINGS', x, z, { h: 0.7, yaw: oy + Math.PI + 0.3, style: { bg: '#f4ecd8', fg: '#5a3a6a', size: 21, border: '#9a6bff' } }); }
      { const [x, z] = L(9.6, 0.2); api.mesh(x, z, m => { m.color('#f4ecd8'); BW.rb(m, 0, 1.0, 0, 0.9, 1.2, 0.06, 0.03); m.color('#c87a5a'); for (const s of [-1, 1]) BW.egg(m, s * 0.18, 1.05, 0.04, 0.12, 0.34, 0.02, { seg: 10, rings: 6 }); m.color('#5a3a2a'); BW.post(m, 0, 0, -0.05, 0.03, 0.6); return {}; }, { yaw: oy + Math.PI + 0.3 }); }
      api.light(hx, hz, 22, '#9a7aff', 0.32); api.light(tx, tz, 8, '#ffcf8a', 0.45);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; api.glow(hx + Math.sin(a) * 20, 2.6, hz + Math.cos(a) * 20, 0.7, BURNS_NEON[i % 7], { blink: 2 }); }
      { const [x, z] = L(0, -16); api.checkpoint('cp_camp', x, z, { yaw: oy + Math.PI, name: 'Camp Nice Guy' }); }
      for (const [a, b] of [[-9, 2], [9, 2]]) { const [x, z] = L(a, b); api.pickup('water', x, 0.9, z); }
      api.marker('kevin', hx, hz, 'Kevin\'s', { col: '#7aff5a' });
      // Kevin: barefoot, gentle, very interested in feet
      const [kx, kz] = L(2, 6);
      S.kevinHome = { x: kx, z: kz, yaw: oy + Math.PI };
      api.npc({ id: 'kevin', name: 'KEVIN', type: 'burner', seed: 909, x: kx, z: kz, yaw: oy + Math.PI, behavior: 'w2Kevin', chatter: false,
        spec: Object.assign(BurnsRig.npcSpec('burner', 909), { top: { kind: 'tee', col: '#7ab8a0', pattern: 'tiedye' }, bottom: { kind: 'cargo', col: '#8a7a5a' }, shoes: { kind: 'barefoot' }, socks: null, hat: { kind: 'bandana', col: '#9a6bff' }, hair: { style: 'short', col: '#8a6a4a' }, glasses: 'round', goggles: false, coat: null, vest: null, led: null, paint: null, beard: { col: '#8a6a4a', len: 0.04, trim: true }, face: 'serene', acc: ['beads', 'crossbag'], prop: null, key: 'w2:kevin' }),
        talk(g2, a) { BURNS_W2.kevinTalk(g2, a); } });
      // his "Sole Circle": barefoot friends who turn up at the street corners when Brady runs
      const POSTS = [[30, 204, 2.5], [15, 152, -2], [0, 204, -2.5], [0, 152, 2.5], [-15, 126, -2]];
      POSTS.forEach(([th, r, off], i) => {
        const [x, z] = at(th + off * 180 / Math.PI / r, r);
        api.npc({ id: 'sole' + i, name: ['SOLE SISTER SAGE', 'BROTHER ARCH', 'HEEL-ER HOLLY', 'TOE-BIAS', 'SISTER INSTEP'][i], type: 'burner', seed: 920 + i, x, z, yaw: Math.atan2(W2.C.x - x, W2.C.z - z), behavior: 'w2Sole', post: { x, z }, chatter: false, friendly: true,
          spec: Object.assign(BurnsRig.npcSpec('burner', 920 + i), { top: { kind: 'tee', col: '#f4ecd8' }, coat: { kind: 'robe', col: ['#f4ecd8', '#e8dcc0', '#f0e0f0', '#dcecd8', '#f4e4c8'][i] }, bottom: { kind: 'pants', col: '#e8e0d0' }, shoes: { kind: 'barefoot' }, socks: null, hat: { kind: 'bandana', col: ['#9a6bff', '#7ad8a0', '#ff9ad8', '#ffd84a', '#7ab8ff'][i] }, glasses: null, goggles: false, vest: null, led: null, paint: null, beard: null, face: 'serene', acc: ['beads'], prop: null, key: 'w2:sole' + i }) });
      });
    }
    /* ---------------- 5:15 & Esplanade: the Red Light District's pink RV (start, gear stash, finale) ---------------- */
    {
      const [rx, rz] = W2.RLD, toC = Math.atan2(W2.C.x - rx, W2.C.z - rz), yaw = toC - Math.PI / 2;   // the door (+X side) faces the Esplanade
      const talk = { rlVelvet: (g2, a) => BURNS_W2.velvetTalk(g2, a) };
      const lines = {
        rlCandi: ['Welcome to the Red Light District! Cabaret at midnight, brunch at three PM.', 'You rode in with US, so you\'re family. Weird, homeless family.'],
        rlRoxie: ['House rule: no glitter in the fridge. That\'s the only rule.', 'Your stuff is safe with us, sugar. Mostly from you.'],
        rlPeachy: ['*fans you* You look overheated, sweetie. Emotionally.', 'Ask the camps nicely. Then ask them again, with jazz hands.'],
        rlBlush: ['Darling, the playa is a stage. And you are... in the wings. WAY in the wings.', 'A first-timer with no camp! That\'s a whole cabaret number.']
      };
      let door = null;
      if (typeof api.redLightCamp === 'function') {
        try {
          const RL = api.redLightCamp(rx, rz, yaw, { crew: true, talk, lines });
          const d = RL && RL.rv && RL.rv.door;
          if (d) door = [rx + d[0] * Math.cos(yaw) + d[1] * Math.sin(yaw), rz - d[0] * Math.sin(yaw) + d[1] * Math.cos(yaw)];
          S.rlEngine = true;
        } catch (e) { door = null; }
      }
      if (!door) {
        // stand-in: a pink RV with marquee bulbs + the crew (until the engine's api.redLightCamp exists)
        api.prop('rv', { x: rx, z: rz, yaw, seed: 77, col: '#ff6fb0', cabCol: '#ffd0e4', bikes: false });
        const L = (a, b) => [rx + a * Math.cos(yaw) + b * Math.sin(yaw), rz - a * Math.sin(yaw) + b * Math.cos(yaw)];
        for (let k = 0; k < 12; k++) { const [x, z] = L(1.32, -4.2 + k * 0.76); api.glow(x, 3.15, z, 0.32, k % 2 ? '#ffd84a' : '#ff4f7a', { blink: 3 }); }
        for (const b of [-2.6, 2.6]) { const [x, z] = L(2.6, b); api.mesh(x, z, m => { m.color('#3a1a24'); BW.post(m, 0, 0, 0, 0.05, 2.2); m.color('#ff2a3a', 0.9); BW.egg(m, 0, 2.35, 0, 0.22, 0.3, 0.22, { seg: 10, rings: 6 }); m.emissive(0); return { lights: [{ x: 0, y: 2.35, z: 0, s: 1.2, c: '#ff2a3a' }] }; }); }
        { const [x, z] = L(3.4, 4.4); api.sign('RED LIGHT\nDISTRICT', x, z, { h: 1.1, yaw: yaw + Math.PI / 2, style: { bg: '#2a0a14', fg: '#ff9ac8', glow: '#ff2a5a', size: 28, border: '#ff4f7a' }, glow: '#ff2a5a' }); }
        door = L(2.3, 0.6);
        const CREW = [['rlVelvet', 'MAMA VELVET', 'madame'], ['rlCandi', 'CANDI', 'bikini'], ['rlRoxie', 'ROXIE', 'corset'], ['rlPeachy', 'PEACHY', 'fan'], ['rlBlush', 'BLUSH', 'showgirl']];
        CREW.forEach(([id, name, variant], i) => {
          const [x, z] = L(3.6 + (i % 2) * 1.4, -3.4 + i * 1.7), base = { id, name, x, z, yaw: yaw + Math.PI / 2, behavior: i ? 'dance' : 'idle', style: i % 6, chatter: true, lines: lines[id], talk: talk[id] };
          if (BW.engineType('redlight')) api.npc(Object.assign(base, { type: 'redlight', variant, seed: 60 + i }));
          else api.npc(Object.assign(base, { type: 'burner', seed: 60 + i, rlLook: true, spec: Object.assign(BurnsRig.npcSpec('burner', 60 + i), {
            body: { fem: true, h: i ? 1.0 : 1.06 }, face: 'lashes', hair: { style: ['wig', 'wavy', 'curly', 'bob', 'wavy'][i], col: '#ffe08a', hi: '#fff4c8' },
            top: { kind: i === 2 || i === 4 ? 'tank' : 'halter', col: ['#c8102a', '#ff6fb0', '#d8203a', '#ff9ad8', '#c8102a'][i] }, bottom: { kind: i === 0 ? 'pants' : i === 3 ? 'tutu' : 'shorts', col: ['#c8102a', '#ff6fb0', '#2a0a14', '#ff9ad8', '#ff6fb0'][i] },
            shoes: { kind: 'boots', col: i % 2 ? '#ffffff' : '#c8102a' }, glasses: i === 0 ? 'round' : 'heart', hat: i === 4 ? { kind: 'tophat', col: '#1a0a10' } : null, goggles: false, coat: null, vest: null, led: null, paint: null, beard: null, acc: ['beads', 'bracelets'], prop: null, key: 'w2:rl' + i }) }));
        });
      }
      S.rvDoor = { x: door[0], z: door[1] };
      api.trigger({ x: rx, z: rz, r: 9, onEnter: g2 => BURNS_W2.rvEnter(g2) });
      api.checkpoint('cp_rv', rx + Math.sin(toC) * 9, rz + Math.cos(toC) * 9, { yaw: toC + Math.PI, name: 'The Pink RV' });
      api.light(rx, rz, 14, '#ff4f9a', 0.5);
      api.marker('rv', rx, rz, 'Pink RV', { col: '#ff6fb0' });
    }
    /* ---------------- Center Camp (6:00 & Esplanade): the big round shade, couches, cafe, slam poetry ---------------- */
    {
      const [cx, cz] = W2.CC, R0 = 12.5, face = Math.atan2(W2.C.x - cx, W2.C.z - cz);   // the stage side faces the Man
      const prof = [[R0, 5.0, '#e8dcc8'], [R0 - 0.3, 5.35, '#e8dcc8'], [9.5, 6.3, '#f0e4d0'], [6.0, 7.6, '#e8dcc8'], [3.0, 8.8, '#f0e4d0'], [1.1, 9.6, '#e8dcc8'], [0, 9.8, '#e8dcc8']];
      api.mesh(cx, cz, m => {
        const cols = [], lights = [];
        m.lathe(prof, { seg: m.segs(36, 18) });
        BW.innerShell(m, prof.map(q => [q[0], q[1] - 0.04, '#c8b8a0']), { seg: m.lo ? 18 : 36 });
        // a scalloped valance of bright fabric around the rim
        for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; m.color(BURNS_NEON[i % 7]); BW.egg(m, Math.sin(a) * (R0 - 0.1), 4.75, Math.cos(a) * (R0 - 0.1), 0.85, 0.42, 0.08, { seg: 8, rings: 4 }); }
        // poles: an outer ring and the centre mast with a beacon
        m.color('#6a5a4a');
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + 0.13, px = Math.sin(a) * (R0 - 0.6), pz = Math.cos(a) * (R0 - 0.6); BW.post(m, px, 0, pz, 0.12, 5.1); cols.push({ t: 'cyl', x: px, z: pz, r: 0.16, y0: 0, y1: 5.1, camPass: true }); }
        BW.post(m, 0, 0, 0, 0.22, 11.2); cols.push({ t: 'cyl', x: 0, z: 0, r: 0.28, y0: 0, y1: 11, camPass: true });
        m.color('#ffd890', 1); BW.ball(m, 0, 11.4, 0, 0.5); m.emissive(0);
        lights.push({ x: 0, y: 11.4, z: 0, s: 4.5, c: '#ffd890' }, { x: 0, y: 4.6, z: 0, s: 0, c: '#ffcf90', pool: 15 });
        return { cols, lights };
      });
      // couches in a ring, facing the stage
      S.couches = [];
      for (let i = 0; i < 7; i++) {
        const a = face + Math.PI + (i - 3) * 0.42, rr = 6.6, x = cx + Math.sin(a) * rr, z = cz + Math.cos(a) * rr, yaw = Math.atan2(cx + Math.sin(face) * 7 - x, cz + Math.cos(face) * 7 - z);
        api.prop('couch', { x, z, yaw, col: ['#8a2a5a', '#2a5a8a', '#6a4a2a', '#5a2a8a', '#2a6a4a', '#8a5a2a', '#3a3a6a'][i] });
        S.couches.push({ x, z, yaw });
      }
      S.ccCouch = S.couches[3];
      // the stage + mic, a speaker stack and the lighting truss (photo up top)
      const sx = cx + Math.sin(face) * 7.4, sz = cz + Math.cos(face) * 7.4;
      api.cylinder(sx, 0, sz, 2.6, 0.5, '#3a2a3a', { round: 0.12, col: { y1: 0.5 } });
      api.mesh(sx, sz, m => { m.color('#2a2a30').shine(2); BW.limb(m, 0, 0.5, 0, 0, 1.95, 0, 0.025); BW.ball(m, 0, 2.0, 0, 0.07); m.shine(0); return { lights: [{ x: 0, y: 3.2, z: 0, s: 0, c: '#ff9ad8', pool: 5 }] }; });
      S.stage = { x: sx, z: sz, yaw: face + Math.PI };
      const rxx = Math.cos(face), rzz = -Math.sin(face);
      const tw = (k, h) => [sx + rxx * (3.6 + k * 0.1), sz + rzz * (3.6 + k * 0.1), h];
      [[0, 0.9], [1, 1.8]].forEach(([k, h], i) => { const [x, z] = tw(k, h); api.roundBox(x + Math.sin(face) * (i ? -1.2 : 0.2), 0, z + Math.cos(face) * (i ? -1.2 : 0.2), 1.3, h, 1.3, '#1a1a20', { r: 0.12 }); });
      { const [x, z] = tw(2, 3.0); api.mesh(x - Math.sin(face) * 2.6, z - Math.cos(face) * 2.6, m => { m.color('#9a9aa2').shine(2); for (const [a, b] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) BW.limb(m, a, 0, b, a, 3.0, b, 0.05); m.shine(0); m.color('#3a3a44'); BW.rb(m, 0, 3.0, 0, 2.0, 0.14, 2.0, 0.05); m.color('#ff4fd8', 1); BW.ball(m, 0.7, 2.75, 0.7, 0.12); m.color('#38f2ff', 1); BW.ball(m, -0.7, 2.75, -0.7, 0.12); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.0, hz: 1.0, y0: 2.92, y1: 3.08 }], lights: [{ x: 0.7, y: 2.75, z: 0.7, s: 1.2, c: '#ff4fd8' }, { x: -0.7, y: 2.75, z: -0.7, s: 1.2, c: '#38f2ff' }] }; });
        api.roundBox(x - Math.sin(face) * 1.2, 0, z - Math.cos(face) * 1.2, 1.2, 2.5, 1.2, '#2a2a30', { r: 0.12 });
        api.pickup('photo', x - Math.sin(face) * 2.6, 3.9, z - Math.cos(face) * 2.6, { id: 'p3' }); }
      // the cafe counter
      const kx = cx - Math.sin(face) * 9.8, kz = cz - Math.cos(face) * 9.8;
      api.mesh(kx, kz, m => { m.color('#6a4a32'); BW.rb(m, 0, 0.55, 0, 4.4, 1.1, 0.9, 0.2, { uv: BURNS_ATLAS.pattern('wood') }); m.color('#e8dcc8'); BW.rb(m, 0, 1.12, 0, 4.6, 0.1, 1.1, 0.04); m.color('#c8ccd4').shine(3); BW.post(m, -1.4, 1.17, 0, 0.22, 0.55); BW.post(m, 1.4, 1.17, 0, 0.22, 0.55); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.2, hz: 0.45, y0: 0, y1: 1.15 }], lights: [{ x: 0, y: 1.8, z: 0, s: 1.4, c: '#ffd890' }] }; }, { yaw: face });
      api.sign('CENTER CAMP CAFE\nCOFFEE · CHAI · OPINIONS', kx - Math.sin(face) * 1.0, kz - Math.cos(face) * 1.0, { h: 0.9, y: 2.2, yaw: face + Math.PI, style: { bg: '#2a1a10', fg: '#ffe7b0', glow: '#ff9a3a', size: 21, border: '#ffcf7a' }, glow: '#ff9a3a' });
      api.npc({ id: 'barista', name: 'CHAI GUY', type: 'crusty', seed: 131, x: kx + Math.sin(face) * 0.9, z: kz + Math.cos(face) * 0.9, yaw: face + Math.PI, lines: ['Chai\'s free. Opinions are free. My opinion on your bun: free.', 'Center Camp never closes. Neither does my mouth.'], gift: { kind: 'water' } });
      api.sign('CENTER\nCAMP', cx - Math.sin(face) * 13.6, cz - Math.cos(face) * 13.6, { h: 1.3, yaw: face, style: { bg: '#1a1020', fg: '#ffe7c8', glow: '#ffb860', size: 30, border: '#ffcf7a' }, glow: '#ffb860' });
      // a few regulars + the slam poet (she has the mic at 3 AM)
      api.npc({ id: 'poet', name: 'STARDUST, SLAM POET', type: 'burner', seed: 133, x: sx, z: sz, y: 0.5, fixedY: true, yaw: face + Math.PI, behavior: 'idle', anim: 'talk',
        spec: Object.assign(BurnsRig.npcSpec('burner', 133), { body: { fem: true }, top: { kind: 'long', col: '#1a1a20' }, bottom: { kind: 'pants', col: '#1a1a20' }, hat: { kind: 'fedora', col: '#1a1a20' }, glasses: 'round', hair: { style: 'down', col: '#2a1a12' }, goggles: false, coat: null, vest: null, led: null, paint: null, beard: null, acc: ['bracelets'], prop: null, face: 'intense', key: 'w2:poet' }),
        lines: ['The playa... is a dusty... MIRROR. *snap snap*', 'This next poem is called "Hydrate". It\'s just me drinking water for nine minutes.'] });
      for (let i = 0; i < 5; i++) { const c = S.couches[i < 3 ? i : i + 1]; api.npc({ type: ['burner', 'furcoat', 'tutu', 'ledsuit', 'burner'][i], seed: 140 + i, x: c.x, z: c.z, yaw: c.yaw, behavior: 'sit', ambient: true, chat: ['*snap snap snap*', 'Deep.', 'Mmm. Yes. Words.', 'Is this the line for chai?', 'I came for the couch. I stayed for the couch.'] }); }
      g.interactables = g.interactables || [];
      api.checkpoint('cp_center', cx - Math.sin(face) * 15.5, cz - Math.cos(face) * 15.5, { yaw: face, name: 'Center Camp' });
      api.marker('center', cx, cz, 'Center Camp', { col: '#ffcf7a' });
    }
    /* ---------------- camps that turn Brady away (the talk-only rejections) ---------------- */
    {
      const CAMPS = {
        dues: { name: 'DUES PROCESS', who: 'TREASURER TIFFANY', type: 'burner', col: '#3a8a6a', lines: ['A spot? Sure! Dues are fourteen hundred dollars.', 'Plus a shift. Plus a shift to cover your shift. Plus a shift-cover cover shift.', 'No? Then no. Next!'] },
        waitlist: { name: 'THE ETERNAL\nWAITLIST', who: 'GATEKEEPER GARY', type: 'crusty', col: '#8a5a2a', lines: ['Take a number! You are number four thousand, eight hundred and twelve.', 'We are currently serving number twelve. Since 2009.', 'Check back in a decade, buddy.'] },
        full: { name: 'CAMP FULLY\nBOOKED', who: 'CAMP LEAD LUNA', type: 'tutu', col: '#8a3a8a', lines: ['Oh, we\'re full. Full of love. And people.', 'Mostly people. Okay, it\'s just people. Sorry, hon!'] },
        interview: { name: 'CAMP\nINTERVIEW', who: 'HIRING MANAGER HAL', type: 'campLead', col: '#3a6aaa', lines: ['Welcome to your camp interview! Where do you see yourself in five Burns?', '..."Asleep somewhere" is not a five-year plan.', 'We\'ll circle back. We will not circle back.'] }
      };
      for (const q of S.rejectCamps) {
        const C = CAMPS[q.id], face = Math.atan2(W2.C.x - q.x, W2.C.z - q.z), fx = Math.sin(face), fz = Math.cos(face);
        api.prop('shade', { x: q.x - fx * 1.6, z: q.z - fz * 1.6, w: 6, d: 4.4, col: '#d8c8b0', yaw: face });
        api.prop('dome', { x: q.x - fx * 6, z: q.z - fz * 6, r: 3.4, col: '#e8e0d0', lights: true, glow: C.col });
        api.sign(C.name, q.x + fx * 1.4 + Math.cos(face) * 3, q.z + fz * 1.4 - Math.sin(face) * 3, { h: 1.1, yaw: face, style: { bg: '#1a1020', fg: '#ffffff', glow: C.col, size: 24, border: C.col }, glow: C.col });
        api.light(q.x, q.z, 9, C.col, 0.45);
        api.npc({ id: 'rej_' + q.id, name: C.who, type: C.type, seed: 160 + S.rejectCamps.indexOf(q), x: q.x + fx * 0.6, z: q.z + fz * 0.6, yaw: face, prop: q.id === 'dues' || q.id === 'interview' ? 'clipboard' : null,
          marker: g2 => BurnsSave.flag(2, 'rej:' + q.id) ? null : '?',
          talk(g2, a) { BURNS_W2.reject(g2, q.id, a, C.lines); } });
      }
    }
    /* ---------------- the Man, out on the open playa (he only shows up to gloat) ---------------- */
    {
      const [mx, mz] = W2.MANSPOT;
      const man = new BurnsManBoss(g, { x: mx, z: mz, yaw: Math.atan2(W2.CC[0] - mx, W2.CC[1] - mz), scale: 0.9, hp: 4, attacks: [], name: 'THE MAN', title: 'Lovesick Effigy' });
      man.hidden = true; man.showChinka = true;
      g.addBoss(man); S.man = man;
    }
    /* ---------------- glow sticks + ground score ---------------- */
    {
      const line = (th0, r0, th1, r1, n) => { const a = at(th0, r0), b = at(th1, r1); api.glowLine(a[0], a[1], b[0], b[1], n); };
      line(0, 96, 0, 30, 10);           // the promenade toward the pavilion
      line(4, 104, 4, 172, 10);         // 6:00 outward
      line(15, 130, 15, 200, 9);        // 6:30 outward
      line(30, 104, 30, 196, 10);       // 7:00 outward
      line(45, 104, 45, 194, 10);       // 7:30 outward (toward home)
      for (const r of [126, 152, 178]) { const pts = []; for (let th = -24; th <= 56; th += 8) pts.push(at(th, r + 1.6)); api.glowsticks(pts); }
      api.glowRing(S.tower.x, S.tower.z, 5, 10);
      api.glowArc(66, 0.9, -48, 66, 0.9, -40, 2.4, 5);
      api.glowsticks([[120, -60], [126, -50], [132, -40], [-60, -60], [-70, -52], [-80, -44], [-120, 60], [-128, 70], [-136, 80]]);
      api.pickup('bag:molly', ...(() => { const [x, z] = at(35, 140); return [x, 0.9, z]; })());
      api.pickup('bag:powder', ...(() => { const [x, z] = at(-25, 186); return [x, 0.9, z]; })());
      api.pickup('bag:weed', ...(() => { const [x, z] = at(56, 120); return [x, 0.9, z]; })());
      api.pickup('bag:shrooms', ...(() => { const [x, z] = at(10, 214); return [x, 0.9, z]; })());
      api.pickup('bag:liquor', ...(() => { const [x, z] = at(-14, 113); return [x, 0.9, z]; })());
      api.pickup('bag:khole', ...(() => { const [x, z] = at(66, 185); return [x, 0.9, z]; })());
      for (const [th, r] of [[10, 160], [36, 120], [-18, 150], [22, 196], [52, 174]]) { const [x, z] = at(th, r); api.pickup('water', x, 0.9, z); }
      api.marker('blinky', 34, 22, 'Blinky', { col: '#38f2ff' });
      api.marker('alley', 59, 13, 'Flame Alley', { col: '#ff7a2a' });
      api.marker('outpost', 86, -60, 'Rangers', { col: '#f4e2b0' });
    }
  },
  onStart(g) {
    const S = BURNS_W2.state, BW = BURNS_W234, W2 = BURNS_W2, M = g.missions;
    if (M.isDone('lost')) for (const L of S.lost) { const a = g.actor(L.id); if (a) { a.w2home = true; a.x = L.dx; a.z = L.dz; a.setBehavior('dance'); a.home = { x: a.x, z: a.z, y: 0, yaw: 0 }; } }
    BW.wireGear(g);
    if (M.isDone('darkwads')) for (const a of g.actors) if (a.behName === 'w234Darkwad') a.w234lit = true;
    const cap = g.actor('captain'); if (cap && !BW.engineType('safetycaptain')) BW.attach(cap, BW.attModel('respirator', m => BW.gear.respirator(m)), BURNS_BONES.HEAD);
    BW.attach(g.player, BW.attModel('headlamp', m => BW.gear.headlamp(m)), BURNS_BONES.HEAD, () => S.headlamp);
    S.headlamp = M.isDone('moop');
    if (M.isDone('lanterns')) for (const L of S.lamps) { L.lit = true; L.gl.c = L.gl.c0; }
    if (M.isDone('alley')) { S.alleyDoor.off = true; }
    // stand-in Red Light District crew: feather boas
    const boa = BW.attModel('rlboa', m => { m.color('#ff8ad0'); for (let k = 0; k <= 12; k++) { const a = -2.4 + k / 12 * 4.8; BW.egg(m, Math.sin(a) * 0.19, 0.4 - Math.cos(a) * 0.05 - (Math.abs(a) > 1.8 ? (Math.abs(a) - 1.8) * 0.5 : 0), Math.cos(a) * 0.13 + 0.02, 0.07, 0.06, 0.07, { seg: 7, rings: 4 }); } });
    for (const a of g.actors) if (a.def.rlLook) BW.attach(a, boa, BURNS_BONES.CHEST);
    // the interactive spots: crash on the couch, sleep in Kevin's tent
    g.interactables = g.interactables || [];
    g.interactables.push({ x: S.ccCouch.x, z: S.ccCouch.z, r: 2.3, label: 'CRASH', when: g2 => g2.missions.state('couch') === 'active' && !BW.S.carry, fn: g2 => W2.couchSleep(g2) });
    g.interactables.push({ x: S.tent.x, z: S.tent.z, r: 2.6, label: 'SLEEP', when: g2 => g2.missions.state('escape') === 'available' && !S.esc && !BW.S.carry, fn: g2 => W2.tentSleep(g2) });
    // story state on (re)visits
    if (M.state('stash') === 'active') W2.stashStart(g);
    if (M.state('haul') === 'active') W2.haulStart(g);
    W2.markHaul(g);
    W2.searchSync(g);
    if (M.isDone('escape')) { const k = g.actor('kevin'); if (k) k.data.mode = 'done'; S.bass = 1; }
    g.tod = M.isDone('escape') ? 0.85 : 0;
    if (!S.introDone) W2.intro(g);
    else g.banner('NO CAMP', M.isDone('escape') ? 'Monday morning. Bamboo bass from 4:30...' : M.isDone('search') ? 'Five rejections. One couch. Zero socks.' : 'Find a camp that will take you in.', { col: '#ff4fd8' });
  },
  onRespawn(g) {
    const S = BURNS_W2.state;
    for (const a of S.followers || []) { const ac = g.actor(a); if (ac && ac.behName === 'follow') { ac.x = g.player.x + 1.5; ac.z = g.player.z + 1; } }
    // fainted during the escape: back to the tent, run again
    if (S.escRetry && g.missions.state('escape') === 'available') {
      S.escRetry = false; const T = S.tent;
      g.player.teleport(T.x + Math.sin(T.yaw) * 1.5, 0, T.z + Math.cos(T.yaw) * 1.5, T.yaw); g.camYaw = T.yaw; g.snapCam = true;
      BURNS_W234.timer(0.4, g2 => { if (g2.missions.state('escape') === 'available') { g2.missions.start('escape', true); const k = g2.actor('kevin'); if (k) k.say('You came back! For your other sock?', 2.2); } });
    }
  },
  env(g, env) {
    const S = BURNS_W2.state, p = g.player;
    // the two nearest fire spinners light up the night
    if (S.spinnerActors) {
      let a1 = null, d1 = 30, a2 = null, d2 = 30;
      for (const a of S.spinnerActors) { const d = Math.hypot(a.x - p.x, a.z - p.z); if (d < d1) { a2 = a1; d2 = d1; a1 = a; d1 = d; } else if (d < d2) { a2 = a; d2 = d; } }
      for (const a of [a1, a2]) if (a) g.pointLight(a.x, 1.8, a.z, 7.5, [1, 0.55, 0.2], 1.3);
    }
    if (S.lampWalk) { const w = g.actor('wick'); if (w) g.pointLight(w.x, 2.2, w.z, 9, [1, 0.8, 0.45], 1.1); }
    if (S.headlamp && !p.dead && g.tod < 0.6) g.pointLight(p.x + Math.sin(p.yaw) * 2.2, p.y + 1.9, p.z + Math.cos(p.yaw) * 2.2, 9, [1, 0.95, 0.82], 1.0);
    void env;
  },
  update(g, dt) {
    const S = BURNS_W2.state, W2 = BURNS_W2, p = g.player;
    BURNS_W234.update(g, dt);
    g.w234lamp = !!S.headlamp;
    if (!S.spinnerActors) S.spinnerActors = g.actors.filter(a => a.behName === 'w2Spinner');
    W2.carryCheck(g);
    if (S.esc) W2.escapeStep(g, dt);
    // walking lost burners home (followers that get boxed in by camps catch up behind Brady)
    if (g.missions.state('lost') === 'active' || g.missions.state('lost') === 'available') {
      for (const L of S.lost) {
        const a = g.actor(L.id); if (!a || a.w2home || a.behName !== 'follow') continue;
        const d = Math.hypot(a.x - p.x, a.z - p.z);
        if (d > 12 && !g.cine) { const k = (S.lost.indexOf(L) + 1) * 1.4; a.x = p.x - Math.sin(p.yaw) * (1.6 + k); a.z = p.z - Math.cos(p.yaw) * (1.6 + k); a.y = p.y; a.vx = a.vz = 0; }
        if (Math.hypot(a.x - L.dx, a.z - L.dz) < 6 || Math.hypot(p.x - L.dx, p.z - L.dz) < 3.5) W2.lostHome(g, a, L);
      }
    }
    // Captain Safety Third's lecture waves: jump them or get frozen mid-step
    if (S.lectures && S.lectures.length) {
      for (const w of S.lectures) {
        const prev = w.r; w.r += 6.5 * dt; if (w.r > 11) { w.dead = true; continue; }
        const d = Math.hypot(p.x - w.x, p.z - w.z);
        if (!w.hit && d >= prev - 0.4 && d <= w.r + 0.4 && p.y < 0.55 && !p.dead && !g.cine && !g.dialog.open) { w.hit = true; S.frozenT = 1.5; p.locked = true; S.frozeByMe = true; p.vx = p.vz = 0; p.say(['...', 'Yes, Captain.', 'Sorry, Captain.'][Math.floor(Math.random() * 3)], 1.2); g.toast('LECTURED! Jump the lecture waves'); burnsSfx('pitch_blah', { vol: 0.6 }); }
      }
      S.lectures = S.lectures.filter(w => !w.dead);
    }
    if (S.frozenT > 0) { S.frozenT -= dt; if (!BURNS_W234.S.carry) p.animOverride = 'idle'; if (S.frozenT <= 0 && S.frozeByMe) { S.frozeByMe = false; p.locked = false; if (p.animOverride === 'idle') p.animOverride = null; } }
    if (S.searchT === undefined || (S.searchT -= dt) <= 0) { S.searchT = 1; W2.searchMarker(g); }
    if (S.lampWalk) BURNS_W2.lampStep(g, dt);
    if (S.bagSearchT > 0) { S.bagSearchT -= dt; if (S.bagSearchT <= 0) { p.locked = false; } }
    // lighthouse lamp + jelly bob are visual only
    S.beamA = (S.beamA || 0) + dt * 0.9;
  },
  drawSkinned(g, R) { BURNS_W234.drawSkinned(g, R); },
  drawSprites(g, R) {
    const S = BURNS_W2.state, SP = BURNS_SPRITES.R, cam = g.cam, t = g.time;
    // fire poi / staffs / fans
    if (S.spinnerActors) for (const a of S.spinnerActors) {
      if (!a._visP) { const d2 = (a.x - cam.x) * (a.x - cam.x) + (a.z - cam.z) * (a.z - cam.z); if (d2 > 70 * 70) continue; }
      const kind = a.def.kind, yaw = a.yaw, rx = Math.cos(yaw), rz = -Math.sin(yaw);
      const hands = [a.ch.bonePoint(BURNS_BONES.FARM_L, 0, -0.3, 0), a.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.3, 0)];
      if (kind === 'staff') {
        const cx = (hands[0][0] + hands[1][0]) / 2, cy = (hands[0][1] + hands[1][1]) / 2, cz = (hands[0][2] + hands[1][2]) / 2, ang = t * 8 + a.def.phase;
        for (const s of [-1, 1]) for (let k = 0; k < 6; k++) { const an = ang - k * 0.18, x = cx + rx * Math.cos(an) * 0.85 * s, y = cy + Math.sin(an) * 0.85 * s, z = cz + rz * Math.cos(an) * 0.85 * s; R.bbs.bb(x, y, z, 0.9 - k * 0.1, 1.1 - k * 0.12, k ? SP.glow : SP.flame, [1, 0.55 - k * 0.05, 0.15], 1 - k * 0.15, true); }
      } else {
        hands.forEach((h, hi) => {
          const n = kind === 'fans' ? 3 : 1;
          for (let f = 0; f < n; f++) for (let k = 0; k < (kind === 'fans' ? 2 : 7); k++) {
            const an = t * (kind === 'fans' ? 3 : 9) * (hi ? 1 : -1) + a.def.phase + f * 2.1 - k * 0.22, rr = kind === 'fans' ? 0.32 : 0.62;
            const x = h[0] + rx * Math.cos(an) * rr, y = h[1] + Math.sin(an) * rr, z = h[2] + rz * Math.cos(an) * rr;
            R.bbs.bb(x, y, z, 0.8 - k * 0.08, 1.0 - k * 0.1, k ? SP.glow : SP.flame, [1, 0.6 - k * 0.04, 0.18], 1 - k * 0.12, true);
          }
        });
      }
    }
    // lecture waves (hi-vis rings)
    if (S.lectures) for (const w of S.lectures) { const k = 1 - w.r / 11; R.flat.flat(w.x, 0.14, w.z, w.r * 2.15, w.r * 2.15, 0, SP.ring, [0.92, 1, 0.35], 0.9 * k + 0.1, true); R.flat.flat(w.x, 0.12, w.z, w.r * 2.0, w.r * 2.0, 0, SP.ring, [1, 1, 1], 0.4 * k, true); }
    // lighthouse beam sweeping the playa
    const T = S.tower;
    if (T) { const a = S.beamA || 0; for (let k = 1; k <= 7; k++) { const d = k * 3.2; R.bbs.bb(T.x + Math.sin(a) * d, 15 - k * 0.3, T.z + Math.cos(a) * d, 2.6 + k * 0.5, 2.6 + k * 0.5, SP.glow, [1, 0.95, 0.75], 0.32 - k * 0.03, true); } }
    // a dropped load: a bobbing beacon so you can find your stuff
    const BL = BURNS_W234.S && BURNS_W234.S.loads; if (BL) for (const L of BL) { if (L.air) continue; const b = Math.sin(t * 4) * 0.15; R.bbs.bb(L.x, L.y + 1.6 + b, L.z, 0.9, 0.9, SP.glow, [1, 0.45, 0.8], 0.8, true); R.bbs.bb(L.x, L.y + 1.6 + b, L.z, 0.32, 0.32, SP.square, [1, 1, 1], 0.9, false, t * 2); }
    // Rhythm Wave's bamboo bass, way out past 5:00: pulsing light on the horizon
    if (S.bass) { const pulse = Math.max(0, Math.sin(t * Math.PI * 2 * 2.05)), k = Math.min(1, S.bass); for (let i = 0; i < 5; i++) R.bbs.bb(205 + i * 6, 4 + i * 1.5 + pulse * 2, -10 + (i - 2) * 9, 26 + pulse * 10, 18 + pulse * 6, SP.glow, [1, 0.72 - i * 0.05, 0.3 + i * 0.08], (0.28 + pulse * 0.3) * k, true); }
    // teapot steam + jellyfish glow from the parade
    if (S.parade && Math.random() < 0.35) for (const c of S.parade.cars) { if (c.i % 6 === 1) { const d2 = (c.mv.x - cam.x) * (c.mv.x - cam.x) + (c.mv.z - cam.z) * (c.mv.z - cam.z); if (d2 < 60 * 60) g.fx.smoke(c.mv.x + Math.sin(c.mv.yaw) * 2.9, 3.4, c.mv.z + Math.cos(c.mv.yaw) * 2.9, 1, '#f4f0ff'); } }
    void t;
  }
});

/* ---------------- the Retro Rocket ----------------
   Uses the shared big-art module when present (BurnsBigArt.place, see docs/BURNS_BIGART.md);
   otherwise builds an original stand-in: a retro rocket on a pad with a climbable gantry.
   Either way the gantry top (S.rocketTop) gets the LAUNCH button and the city-view moment. */
BURNS_W2.placeRocket = function (api, g, x, z) {
  const S = BURNS_W2.state, BW = BURNS_W234;
  let info = null;
  if (typeof BurnsBigArt !== 'undefined' && BurnsBigArt.kinds && BurnsBigArt.kinds.retroRocket) {
    // the big-art Retro Rocket: ladders up the gantry, its own LAUNCH! button + countdown show.
    // We add the city-view moment at the top and award the token when it launches.
    try {
      const P = BurnsBigArt.place(api, g, 'retroRocket', x, z, { rotY: -0.6, vantage: false,
        onReach: g2 => BURNS_W2.rocketView(g2),
        onLaunch: g2 => { const T = S.rocket.top; if (g2.missions.state('rocket') === 'available') g2.missions.start('rocket', true); if (g2.missions.state('rocket') === 'active') g2.missions.complete('rocket', { x: T.x - 1.5, y: T.y + 1.3, z: T.z }); } });
      if (P && P.summit) { info = { top: { x: P.summit.x, y: P.summit.y, z: P.summit.z }, view: { x: P.summit.x, y: P.summit.y, z: P.summit.z }, big: P }; S.rocketP = P; }
    } catch (e) { info = null; }
  }
  if (!info || !info.top) {
    // stand-in rocket: chrome body with red stripes, round nose, three fins, portholes
    const prof = [[0, 0.6, '#c8ccd8'], [1.9, 0.6, '#c8ccd8'], [2.3, 2.0, '#d8dce8'], [2.3, 2.0, '#c8202a'], [2.3, 3.2, '#c8202a'], [2.3, 3.2, '#e8ecf4'], [2.25, 9.0, '#e8ecf4'], [2.25, 9.0, '#c8202a'], [2.15, 10.2, '#c8202a'], [2.15, 10.2, '#e8ecf4'], [1.9, 13.0, '#e8ecf4'], [1.2, 15.6, '#e8ecf4'], [0.5, 17.0, '#c8202a'], [0, 17.5, '#c8202a']];
    api.mesh(x, z, m => {
      m.color('#4a4a52'); BW.post(m, 0, 0, 0, 4.2, 0.6, { edge: 0.2 });
      m.color('#e8ecf4').shine(3); m.lathe(prof, { seg: 22 }); m.shine(0);
      m.color('#3a3a44'); BW.lathe(m, 0, 0.0, 0, [[1.0, 0.6], [1.5, 0.0], [1.5, 0.0]], { seg: 16 });
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; m.push(); m.tf(Math.sin(a) * 2.3, 2.4, Math.cos(a) * 2.3, a); m.color('#c8202a').shine(2); BW.egg(m, 0, 0, 0.9, 0.18, 2.2, 1.3, { seg: 10, rings: 8 }); m.shine(0); m.pop(); }
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5, y = 6 + k * 2.4; m.color('#9aa0b0').shine(3); BW.ring(m, Math.sin(a) * 2.22, y, Math.cos(a) * 2.22, 0.45, 0.08, { yaw: a, pitch: Math.PI / 2, seg: 14, tseg: 4 }); m.shine(0); m.color('#38f2ff', 0.8); BW.egg(m, Math.sin(a) * 2.2, y, Math.cos(a) * 2.2, 0.38, 0.38, 0.06, { seg: 10, rings: 5 }); m.emissive(0); }
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 4.2, y0: 0, y1: 0.6 }, { t: 'cyl', x: 0, z: 0, r: 2.3, y0: 0.6, y1: 15.5 }], lights: [{ x: 0, y: 17.6, z: 0, s: 2.2, c: '#ff3b5c', blink: 2 }, { x: 0, y: 0, z: 0, s: 0, c: '#ffd890', pool: 14 }] };
    });
    // the gantry: a steel frame beside the rocket with switchback platforms up to 15.5 m
    const gx = x + 7.8, gz = z;
    api.mesh(gx, gz, m => {
      m.color('#d8a020');
      for (const [a, b] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) BW.limb(m, a, 0, b, a, 16.4, b, 0.09, 0.09, { seg: 6 });
      for (let y = 2; y <= 16; y += 2.8) for (const [a0, b0, a1, b1] of [[-1.6, -1.6, 1.6, -1.6], [1.6, -1.6, 1.6, 1.6], [1.6, 1.6, -1.6, 1.6], [-1.6, 1.6, -1.6, -1.6]]) BW.limb(m, a0, y, b0, a1, y + 1.4, b1, 0.045, 0.045, { seg: 5 });
      m.color('#3a3a40'); BW.rb(m, 0, 15.5, 0, 4.2, 0.24, 4.2, 0.08); BW.limb(m, -2.1, 15.5, 0, -6.2, 15.5, 0, 0.12);
      m.color('#e8e8f0').shine(2); for (const [a, b] of [[-2, -2], [2, -2], [2, 2], [-2, 2]]) BW.limb(m, a, 15.6, b, a, 16.6, b, 0.04); BW.ring(m, 0, 16.6, 0, 2.85, 0.045, { seg: 4, tseg: 4, yaw: Math.PI / 4 }); m.shine(0);
      m.color('#2a2a30'); BW.post(m, 0.9, 15.62, 0.9, 0.22, 0.9); m.color('#ff2a2a', 0.8).shine(3); BW.egg(m, 0.9, 16.6, 0.9, 0.2, 0.12, 0.2, { seg: 12, rings: 6, phi1: Math.PI / 2 }); m.shine(0).emissive(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.1, hz: 2.1, y0: 15.38, y1: 15.62 }, ...[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([a, b]) => ({ t: 'cyl', x: a, z: b, r: 0.1, y0: 0, y1: 16.4, camPass: true })), { t: 'cyl', x: 0.9, z: 0.9, r: 0.24, y0: 15.6, y1: 16.5 }], lights: [{ x: 0.9, y: 16.7, z: 0.9, s: 1.2, c: '#ff2a2a', blink: 4 }, { x: 0, y: 16, z: 0, s: 2.5, c: '#ffe8a0' }] };
    });
    // switchback steps winding up the gantry (rise ~1.1 m each)
    for (let i = 0; i < 13; i++) { const side = Math.floor(i / 4) % 2, k = i % 4, a = (i * 0.5) + 0.2, rr = 3.3; api.roundBox(gx + Math.sin(a) * rr, 0.85 + i * 1.12, gz + Math.cos(a) * rr, 1.5, 0.26, 1.4, ['#d8a020', '#c8c8d0'][i % 2], { yaw: a, r: 0.08 }); void side; void k; }
    info = { top: { x: gx + 0.9, y: 15.62, z: gz + 0.9 }, view: { x: gx, y: 16.2, z: gz } };
    api.sign('THE RETRO\nROCKET', x - 5.2, z + 3.2, { h: 1.0, yaw: -0.9, style: { bg: '#1a1a2a', fg: '#ff4a4a', glow: '#ff2a2a', size: 24, border: '#e8ecf4' }, glow: '#ff2a2a' });
  }
  S.rocket = { x, z, top: info.top, view: info.view || info.top, big: !!info.big };
  if (!info.big) api.trigger({ x: info.top.x, z: info.top.z, r: 4.5, y0: info.top.y - 0.6, once: true, onEnter: g2 => BURNS_W2.rocketView(g2) });
  api.trigger({ x, z, r: info.big ? 21 : 14, once: true, onEnter: g2 => { if (g2.missions.state('rocket') === 'available') { g2.missions.start('rocket'); g2.banner('THE RETRO ROCKET', 'Climb the gantry. Push the big red button.', { col: '#ff4a4a' }); } } });
  api.light(x, z, 16, '#ffd8a0', 0.4);
  if (!info.big) api.glowArc(x + 11.5, 1.0, z, x + 7.8, 16.4, z, 2.2, 10);
};
BURNS_W2.rocketView = function (g) {
  const S = BURNS_W2.state, R = S.rocket, [hx, hz] = BURNS_W2.CAMP, p = g.player;
  const c0 = { x: R.view.x, y: R.view.y + 2.4, z: R.view.z, tx: R.x, ty: R.view.y - 2, tz: R.z, fov: 0.9 }, c1 = { x: R.view.x, y: R.view.y + 2.6, z: R.view.z, tx: hx, ty: 0, tz: hz, fov: 0.7 };
  g.cutscene([
    { cam: c0 }, { cam: { from: c0, to: c1, dur: 2.4 } },
    { say: ['brady', ['Whoa. You can see the whole city from up here. Thousands of camps.', 'And not one of them is mine.', '...Okay. Somebody down there has room for one more. I can feel it.']] },
    { do: g2 => { g2.camYaw = p.yaw; g2.snapCam = true; g2.banner('CITY VIEW', 'Every camp in the city. Now: the big red button.', { col: '#ffe24a' }); if (g2.missions.state('rocket') === 'available') g2.missions.start('rocket', true); } }
  ]);
  if (R.big) return;   // the big-art rocket has its own LAUNCH! button
  g.interactables = g.interactables || [];
  g.interactables.push({ x: R.top.x, z: R.top.z, y: R.top.y, r: 2.2, label: 'LAUNCH', when: g2 => g2.missions.state('rocket') === 'active', fn: g2 => BURNS_W2.rocketLaunch(g2) });
};
BURNS_W2.rocketLaunch = function (g) {
  const S = BURNS_W2.state, R = S.rocket;
  if (S.launching) return; S.launching = true;
  const c0 = { x: R.x + 22, y: 6, z: R.z + 16, tx: R.x, ty: 8, tz: R.z, fov: 0.9 };
  g.cutscene([
    { cam: c0 }, { sfx: 'select' },
    { banner: ['3', '', { col: '#ff4a4a', big: true, dur: 0.9 }] }, { wait: 0.9 },
    { banner: ['2', '', { col: '#ffb02a', big: true, dur: 0.9 }] }, { wait: 0.9 },
    { banner: ['1', '', { col: '#ffe24a', big: true, dur: 0.9 }] }, { wait: 0.9 },
    { do: g2 => { S.launchT = 0; burnsSfx('flame_jet'); burnsSfx('crowd_cheer'); } },
    { until: g2 => { S.launchT += 1 / 120; g2.shake(0.25); for (let i = 0; i < 4; i++) g2.fx.fire(R.x + (Math.random() - 0.5) * 2, 0.6, R.z + (Math.random() - 0.5) * 2, 3); if (Math.random() < 0.3) g2.fx.smoke(R.x + (Math.random() - 0.5) * 6, 0.5, R.z + (Math.random() - 0.5) * 6, 2, '#e8e0f0'); if (Math.random() < 0.06) { g2.fx.firework(R.x + (Math.random() - 0.5) * 10, 20 + Math.random() * 8, R.z + (Math.random() - 0.5) * 10, BURNS_NEON[Math.floor(Math.random() * 7)]); burnsSfx('firework_burst', { vol: 0.5 }); } return S.launchT > 3.2; } },
    { banner: ['LIFTOFF!', '(Emotionally. It\'s art. It stays here.)', { col: '#ffe24a', big: true }] },
    { do: g2 => { S.launching = false; g2.missions.complete('rocket', { x: R.top.x - 1.4, y: R.top.y + 1.2, z: R.top.z - 1.2 }); } }
  ]);
};

/* ---------------- the story: stash, rejections, Center Camp, the haul, the escape ---------------- */
// who's talking: an actor if it exists, otherwise a name card
BURNS_W2.who = function (g, id, name) { return g.actor(id) || { name, model: null }; };
// a camp says no. Rejections are saved as flags and count toward Camp Shopping whenever they happen.
BURNS_W2.reject = function (g, id, who, lines) {
  const W2 = BURNS_W2, first = !BurnsSave.flag(2, 'rej:' + id);
  const a = typeof who === 'string' ? (g.actor(who) || { name: who.toUpperCase(), model: null }) : who;
  if (!first) { g.say(a, [lines[lines.length - 1]]); return; }
  g.say(a, lines, () => {
    BurnsSave.flag(2, 'rej:' + id, true);
    const n = W2.rejections();
    g.banner('REJECTED!', n < 5 ? `${n} of 5. Character building!` : 'Five for five. Impressive, honestly.', { col: '#ff4a5a', big: true, dur: 2.4 });
    burnsSfx('bump', { pitch: 0.7 }); g.shake(0.15);
    BURNS_W2.searchSync(g);
  });
};
BURNS_W2.searchSync = function (g) {
  const m = g.missions.get('search'); if (!m || m.state !== 'active') return;
  m.n = BURNS_W2.rejections();
  if (m.n >= 5) g.missions.complete('search');
};
BURNS_W2.searchDone = function (g) {
  BURNS_W234.timer(1.2, g2 => g2.say('brady', ['Five camps. Five nos. Zero tents.', 'Fine. FINE. Center Camp is open to everybody. Everybody has couches. I am everybody.']));
};
BURNS_W2.rangerDone = function (g) {
  const a = g.actor('sage');
  g.say(a || { name: 'RANGER SAGEBRUSH', model: null }, ['Copy that, you found it! You\'re a natural.', 'Now: no camp. Here\'s the deal. Ask camp leads, the ones with the question marks. Most will say no. Say thank you anyway. Principle Number... all of them.', 'And if nobody takes you, Center Camp has couches. Open all night. Right across the street from my outpost.'], () => {
    g.glow += 10; g.toast('+10 GLOW STICKS · CITATION WAIVED'); g.spawnPickup('water', g.player.x + 1.4, 0.9, g.player.z, { pop: true });
  });
};
// Mama Velvet, the Red Light District's camp mom: the voice of the stash and the haul
BURNS_W2.velvetTalk = function (g, a) {
  const M = g.missions;
  if (M.state('stash') === 'active') g.say(a, ['Bags in the RV, honey. Through the door on the side. Lift with your legs!']);
  else if (M.state('search') === 'active') g.say(a, [`${BURNS_W2.rejections()} rejections? Baby, that's a warm-up. Go ask some more. Smile. Bring jazz hands.`]);
  else if (M.state('couch') === 'active') g.say(a, ['Nobody took you? Their loss, sugar. Center Camp has couches. Go get some sleep.']);
  else if (M.state('haul') === 'active') g.say(a, BURNS_W234.S.carry ? ['Your stuff\'s on your head, honey. Kevin\'s at 7:30 and E. Call us if he\'s weird.'] : ['A nice man named Kevin has a TENT for you? Your stuff is right there by the door. We packed it all into one bag.', 'It weighs about as much as a small Brady. Lift with your legs!']);
  else if (M.isDone('escape')) g.say(a, ['Go dance, honey. We\'ll keep your stuff warm. And Brady? Socks.']);
  else if (M.isDone('haul')) g.say(a, ['Sleep tight, honey. Text us if Kevin is weird. We don\'t have phones. Just yell.']);
  else g.say(a, ['Welcome to the city, sugar.']);
};
BURNS_W2.kevinTalk = function (g, a) {
  const M = g.missions;
  if (M.isDone('escape')) g.say(a, ['No hard feelings, man! Your aura is... a very sweaty orange. Namaste!']);
  else if (M.isDone('haul')) g.say(a, ['Your tent\'s ready, buddy! Get some sleep. Take your shoes off. You know. For comfort.']);
  else if (M.state('haul') === 'active') g.say(a, ['Bring it all in! The tent is right there. Shoes off inside, please. House rule. Tent rule.']);
  else g.say(a, ['Hey there! Beautiful night. Have you ever thought about how much your feet do for you?']);
};
// the stash: three bags by the curb, carried one at a time through the RV door
BURNS_W2.LOADS = {
  duffel(m) { m.color('#4a5a32'); BURNS_W234.rb(m, 0, 0.24, 0, 0.98, 0.46, 0.46, 0.2); m.color('#2a2a26'); for (const s of [-0.28, 0.28]) BURNS_W234.ring(m, s, 0.26, 0, 0.25, 0.025, { roll: Math.PI / 2, seg: 14, tseg: 3 }); m.color('#ff6fb0'); BURNS_W234.rb(m, 0.18, 0.4, 0.235, 0.18, 0.12, 0.01, 0.02); m.color('#38f2ff'); BURNS_W234.rb(m, -0.22, 0.3, 0.235, 0.14, 0.14, 0.01, 0.02); },
  sleepbag(m) { m.color('#2a8a9a').shine(1); m.push(); m.tf(0, 0.27, 0, 0, 0, Math.PI / 2); m.roundCyl(0, -0.45, 0, 0.27, 0.9, 0.12, { seg: 14 }); m.pop(); m.shine(0); m.color('#1a1a1e'); for (const s of [-0.25, 0.25]) BURNS_W234.ring(m, s, 0.27, 0, 0.28, 0.02, { roll: Math.PI / 2, seg: 14, tseg: 3 }); m.color('#e8f4ff', 0.15).shine(3); m.push(); m.tf(0, 0.27, 0, 0, 0, Math.PI / 2); m.roundCyl(0, -0.47, 0, 0.285, 0.94, 0.12, { seg: 14 }); m.pop(); m.shine(0).emissive(0); },
  brie(m) { m.color('#f4ecd0'); m.roundCyl(0, 0, 0, 0.48, 0.26, 0.08, { seg: 20 }); m.color('#fff8e4'); BURNS_W234.rb(m, 0, 0.27, 0, 0.5, 0.012, 0.5, 0.005); m.color('#d8c890'); BURNS_W234.rb(m, 0.2, 0.2, 0.2, 0.16, 0.1, 0.16, 0.04); },
  bundle(m) {
    const L = BURNS_W2.LOADS;
    m.push(); m.tf(0, 0, -0.05); L.duffel(m); m.pop();
    m.push(); m.tf(0, 0.44, 0.02); L.sleepbag(m); m.pop();
    m.push(); m.tf(0.05, 0.96, 0, 0.3); m.push(); m.tf(0, 0, 0); L.brie(m); m.pop(); m.pop();
    m.color('#ff7ac8'); for (let k = 0; k < 9; k++) { const a = k / 9 * TAU; BURNS_W234.egg(m, Math.sin(a) * 0.52, 0.5 + Math.sin(a * 2) * 0.06, Math.cos(a) * 0.3, 0.16, 0.12, 0.16, { seg: 8, rings: 5 }); }
  }
};
BURNS_W2.loadDef = function (kind, name, o) {
  const md = BURNS_W234.loadModels('w2' + kind, BURNS_W2.LOADS[kind]);
  return Object.assign({ hand: md.hand, ground: md.ground, name, kind, speed: 0.62 }, o || {});
};
BURNS_W2.stashStart = function (g) {
  const S = BURNS_W2.state; if (S.stashLoads) return;
  const [rx, rz] = BURNS_W2.RLD, sp = g.def.spawn, d = S.rvDoor;
  // between the spawn and the RV door
  const bx = lerp(sp.x, d.x, 0.45), bz = lerp(sp.z, d.z, 0.45);
  S.stashLoads = [['duffel', '40 IDENTICAL BLACK TEES'], ['sleepbag', 'SLEEPING BAG (STILL IN PLASTIC)'], ['brie', 'A WHOLE WHEEL OF BRIE']].map(([k, nm], i) => {
    const o = BURNS_W2.loadDef(k, nm, { stash: true, when: g2 => g2.missions.state('stash') === 'active', onPick(g2) { g2.toast(nm + ' · CARRY IT INTO THE RV'); BURNS_W2.markHaul(g2); } , onDrop(g2, L) { BURNS_W2.markHaul(g2, L); } });
    return BURNS_W234.loadPlace(g, o, bx + Math.cos(i * 2.1) * 1.6, bz + Math.sin(i * 2.1) * 1.6, i * 1.3);
  });
  void rx; void rz;
};
// what Brady carries in the haul and the escape: everything, strapped together, plus a gifted boa
BURNS_W2.haulStart = function (g) {
  const S = BURNS_W2.state; if (S.haulLoad || BURNS_W234.S.carry) return;
  const d = S.rvDoor;
  S.haulLoad = BURNS_W234.loadPlace(g, BURNS_W2.loadDef('bundle', 'ALL YOUR STUFF', { speed: 0.6, haul: true, when: g2 => g2.missions.state('haul') === 'active',
    onPick(g2) { if (!S.haulPicked) { S.haulPicked = true; const v = g2.actor('rlVelvet'); if (v) v.say('Bye, baby! Call us if he\'s weird!', 3); g2.banner('HAUL YOUR STUFF', 'Kevin\'s tent: 7:30 & E, inside the art car parade. Heavy: no jumping!', { col: '#ff6fb0' }); } BURNS_W2.markHaul(g2); },
    onDrop(g2, L) { BURNS_W2.markHaul(g2, L); } }), d.x + 0.4, d.z + 0.4, 0.5);
  BURNS_W2.markHaul(g);
  const k = g.actor('kevin'); if (k && S.kevinHome) { k.x = S.kevinHome.x; k.z = S.kevinHome.z; k.yaw = S.kevinHome.yaw; k.vx = k.vz = 0; }
};
// point the tracker at the right place: a dropped load, or the next destination
BURNS_W2.markHaul = function (g, dropped) {
  const S = BURNS_W2.state, BW = BURNS_W234;
  for (const id of ['stash', 'haul']) {
    const m = g.missions.get(id); if (!m || m.state !== 'active') continue;
    const ground = dropped || (BW.S.loads || []).find(L => L.o[id === 'haul' ? 'haul' : 'stash']);
    if (BW.S.carry) m.def.marker = id === 'stash' ? { x: S.rvDoor.x, z: S.rvDoor.z } : { x: S.tent.x, z: S.tent.z };
    else if (ground) m.def.marker = { x: ground.x, z: ground.z };
    m.def.short = id === 'stash' ? (BW.S.carry ? 'Carry it into the pink RV (side door)' : 'Pick up your gear by the pink RV') : (BW.S.carry ? 'Carry your stuff to Kevin\'s tent (7:30 & E)' : 'Pick your stuff back up!');
  }
};
BURNS_W2.rvEnter = function (g) {
  const S = BURNS_W2.state;
  if (S.esc && g.missions.state('escape') === 'active') BURNS_W2.escapeWin(g);
};
BURNS_W2.carryCheck = function (g) {
  const S = BURNS_W2.state, BW = BURNS_W234, c = BW.S.carry, p = g.player;
  if (!c) return;
  // stash: through the RV's side door
  if (c.o.stash && Math.hypot(p.x - S.rvDoor.x, p.z - S.rvDoor.z) < 2.4) {
    BW.carryEnd(g); g.fx.burst(S.rvDoor.x, 1.6, S.rvDoor.z, 'star', 12, '#ff6fb0'); burnsSfx('pick', { pitch: 1.2 });
    g.toast('STASHED: ' + c.o.name);
    const m = g.missions.get('stash'); const left = 3 - (m ? m.n + 1 : 3);
    const v = g.actor('rlVelvet'); if (v) v.say(c.o.kind === 'brie' ? 'Is that... a whole BRIE? Respect.' : left > 0 ? ['Into the RV it goes! Next!', 'Lift with your LEGS, honey!'][left % 2] : 'That\'s everything? Good boy.', 2.4);
    g.missions.progress('stash');
    BURNS_W2.markHaul(g);
    return;
  }
  // haul: into Kevin's tent
  if (c.o.haul && g.missions.state('haul') === 'active' && Math.hypot(p.x - S.tent.x, p.z - S.tent.z) < 3.2) {
    BW.carryEnd(g); S.haulLoad = null;
    g.fx.confetti(S.tent.cx, 2, S.tent.cz, 24); burnsSfx('crowd_cheer', { vol: 0.5 });
    g.missions.complete('haul', { x: S.tent.x + 1.2, y: 1.4, z: S.tent.z + 1.2 });
    const k = g.actor('kevin'); if (k) k.say('You made it! Make yourself at home. Shoes off! ...For the tent.', 3.5);
  }
};
BURNS_W2.stashDone = function (g) {
  const v = BURNS_W2.who(g, 'rlVelvet', 'MAMA VELVET');
  BURNS_W234.timer(0.6, g2 => g2.say(v, ['All three! Your stuff is safe with us, honey.', 'Now go find somewhere to SLEEP. Ask the camps. Somebody will take you in. Probably. Maybe.']));
};

/* ---------------- intro ---------------- */
BURNS_W2.intro = function (g) {
  const S = BURNS_W2.state, p = g.player, [rx, rz] = BURNS_W2.RLD, sp = g.def.spawn;
  const V = BURNS_W2.who(g, 'rlVelvet', 'MAMA VELVET'), X = BURNS_W2.who(g, 'rlRoxie', 'ROXIE');
  const c0 = { x: rx - 70, y: 46, z: rz + 80, tx: rx - 10, ty: 0, tz: rz + 10, fov: 0.95 }, c1 = { x: sp.x + Math.sin(sp.yaw) * -5 + 3, y: 2.6, z: sp.z + Math.cos(sp.yaw) * -5, tx: rx, ty: 1.6, tz: rz, fov: 0.8 };
  p.locked = true;
  g.cutscene([
    { cam: c0 },
    { cam: { from: c0, to: c1, dur: 4.2 } },
    { say: [V, ['Welcome to the city, sugar! So. Where\'s your camp?']] },
    { say: ['brady', ['My... camp? I thought you just... show up? Chinka handled the... everything.']] },
    { say: [V, ['Honey. You have NO camp?', 'Oh, baby. Okay. Put your stuff in our RV. We\'ll babysit it while you find somewhere to sleep.']] },
    { say: [X, ['No glitter in the fridge. That\'s the only rule.']] },
    { do: g2 => { BurnsSave.flag(2, 'intro', true); S.introDone = true; p.locked = false; p.teleport(sp.x, 0, sp.z, sp.yaw); g2.camYaw = sp.yaw; g2.snapCam = true; } },
    { banner: ['STASH YOUR GEAR', 'Carry your three bags into the pink RV. Heavy stuff: no jumping!', { col: '#ff6fb0' }] }
  ], null);
};

/* ---------------- Center Camp: crash on a couch, wake up to slam poetry, the Man gloats, Kevin offers a tent ---------------- */
BURNS_W2.couchSleep = function (g) {
  const S = BURNS_W2.state, p = g.player, c = S.ccCouch, man = S.man, k = g.actor('kevin'), poet = BURNS_W2.who(g, 'poet', 'STARDUST, SLAM POET');
  if (S.sleeping || g.missions.state('couch') !== 'active') return; S.sleeping = true;
  const fx = Math.sin(c.yaw), fz = Math.cos(c.yaw);
  const c0 = { x: c.x + fx * 3.2 + fz * 1.6, y: 2.0, z: c.z + fz * 3.2 - fx * 1.6, tx: c.x, ty: 0.8, tz: c.z, fov: 0.8 };
  const st = S.stage, c1 = { x: c.x + fx * 1.0 - fz * 1.6, y: 1.8, z: c.z + fz * 1.0 + fx * 1.6, tx: st.x, ty: 1.9, tz: st.z, fov: 0.75 };
  const [mx, mz] = BURNS_W2.MANSPOT, cm = { x: BURNS_W2.CC[0] + Math.sin(c.yaw + Math.PI) * 0, y: 3.2, z: BURNS_W2.CC[1] - 11, tx: mx, ty: 7, tz: mz, fov: 0.7 };
  g.cutscene([
    { do: g2 => { p.teleport(c.x - fx * 0.15, 0.42, c.z - fz * 0.15, c.yaw); p.locked = true; p.animOverride = 'sleep'; } },
    { cam: c0 },
    { say: ['brady', ['Five rejections. Zero camps. One couch.', 'Goodnight, playa. ...Goodnight, mystery couch stain.']] },
    { do: g2 => g2.fadeTo(1, 0.6) }, { wait: 0.9 },
    { banner: ['3:12 AM', 'Center Camp never sleeps. Brady does.', { col: '#ffcf7a', dur: 2 }] }, { wait: 1.4 },
    { do: g2 => g2.fadeTo(0, 0.6) },
    { cam: c1 },
    { say: [poet, ['THE PLAYA...', '...is a DUSTY... MIRROR.', 'And in that mirror... I see... a MAN... on a COUCH. *snap snap*']] },
    { do: g2 => { p.animOverride = 'hurt'; g2.shake(0.25); burnsSfx('bump'); } },
    { say: ['brady', ['GAH! I\'m awake! I\'m awake! Is this poem about ME?']] },
    { say: [poet, ['Everything is about you, man. That\'s the poem. *snap*']] },
    { do: g2 => { p.animOverride = 'idle'; man.hidden = false; man.showChinka = true; man.x = mx; man.z = mz; man.y = 0; man.setState('idle'); g2.shake(0.4); burnsSfx('man_stomp'); } },
    { cam: cm },
    { say: ['man', ['SLEEP WELL, BUN BOY?', 'SHE IS WITH ME. YOU HAVE... A COUCH. HA. HA. HAAA.']] },
    { do: g2 => { S.manT = 0; burnsSfx('man_roar', { pitch: 0.8 }); } },
    { until: g2 => { S.manT += 1 / 120; man.z -= 7 / 120; man.yaw = Math.PI; return S.manT > 2.4; } },
    { do: g2 => { man.hidden = true; if (k) { k.x = c.x + Math.cos(c.yaw) * 1.6 + fx * 1.2; k.z = c.z - Math.sin(c.yaw) * 1.6 + fz * 1.2; k.yaw = Math.atan2(p.x - k.x, p.z - k.z); k.vx = k.vz = 0; } } },
    { cam: c0 },
    { say: [k || { name: 'KEVIN', model: null }, ['Hey. Hey, man. I couldn\'t help noticing you sleeping on a public couch. During a poetry slam.', 'I feel bad for you. I\'ve got room in my tent. 7:30 and E, inside the parade loop. Grab your stuff and come on over!']] },
    { say: ['brady', ['A TENT? With WALLS? Kevin, you\'re my hero.']] },
    { say: [k || { name: 'KEVIN', model: null }, ['Ha! Just Kevin. Just a nice guy. Bring socks. ...Or don\'t. Either way.']] },
    { do: g2 => { p.locked = false; p.animOverride = null; S.sleeping = false; p.teleport(c.x + fx * 1.4, 0, c.z + fz * 1.4, c.yaw); g2.missions.complete('couch'); } }
  ]);
};

/* ---------------- the escape: 4 AM, Kevin and the Sole Circle ---------------- */
BURNS_W2.tentSleep = function (g) {
  const S = BURNS_W2.state, p = g.player, T = S.tent, k = g.actor('kevin');
  if (S.esc || g.missions.state('escape') !== 'available') return;
  const fx = Math.sin(T.yaw), fz = Math.cos(T.yaw);
  const c0 = { x: T.x + fx * 4 + fz * 2, y: 2.2, z: T.z + fz * 4 - fx * 2, tx: T.cx, ty: 0.8, tz: T.cz, fov: 0.8 };
  g.cutscene([
    { do: g2 => { p.locked = true; p.teleport(T.cx + fx * 0.6, 0.05, T.cz + fz * 0.6, T.yaw + Math.PI); p.animOverride = 'sleep'; if (k) { k.x = T.x + fz * 1.2; k.z = T.z - fx * 1.2; k.vx = k.vz = 0; } } },
    { cam: c0 },
    { say: ['brady', ['A real tent. With a real zipper. Goodnight, Kevin!']] },
    { say: [k || { name: 'KEVIN', model: null }, ['Goodnight, buddy. Sweet dreams. Sweet... feet.']] },
    { say: ['brady', ['What?']] },
    { say: [k || { name: 'KEVIN', model: null }, ['What?']] },
    { do: g2 => g2.fadeTo(1, 0.7) }, { wait: 0.9 },
    { banner: ['4:47 AM', '*sniff sniff*', { col: '#9a6bff', dur: 2 }] }, { wait: 1.4 },
    { do: g2 => { if (k) { k.x = T.cx + fx * 1.6; k.z = T.cz + fz * 1.6; k.yaw = T.yaw + Math.PI; k.ch.play('sit'); } g2.fadeTo(0, 0.5); } },
    { cam: { x: T.cx + fx * 3.4 - fz * 1.5, y: 1.4, z: T.cz + fz * 3.4 + fx * 1.5, tx: T.cx + fx * 1.2, ty: 0.4, tz: T.cz + fz * 1.2, fov: 0.75 } },
    { say: [k || { name: 'KEVIN', model: null }, ['Shhh. Shhh. Don\'t wake up. I\'m just reading your aura.', 'Through your soles. Your left heel is VERY anxious.']] },
    { do: g2 => { p.animOverride = 'hurt'; g2.shake(0.3); burnsSfx('bump'); } },
    { say: ['brady', ['WHY ARE YOU SMELLING MY FEET?!']] },
    { say: [k || { name: 'KEVIN', model: null }, ['My playa name is SOLEMATE.', 'Wait. Come back. I haven\'t done your toes!']] },
    { do: g2 => { p.animOverride = null; p.locked = false; p.teleport(T.x + fx * 1.5, 0, T.z + fz * 1.5, T.yaw); g2.camYaw = T.yaw; g2.snapCam = true; g2.missions.start('escape', true); } }
  ]);
};
BURNS_W2.escapeStart = function (g) {
  const S = BURNS_W2.state, BW = BURNS_W234, p = g.player, k = g.actor('kevin');
  S.esc = { t: 0 }; S.trail = [];
  if (!BW.S.carry) BW.carryStart(g, BURNS_W2.loadDef('bundle', 'ALL YOUR STUFF', { speed: 0.88, jump: true, dropOnHurt: false }));
  if (k) { k.x = S.tent.cx + Math.sin(S.tent.yaw) * 1.4; k.z = S.tent.cz + Math.cos(S.tent.yaw) * 1.4; k.vx = k.vz = 0; k.data.mode = 'wait'; k.data.t = 1.3; }
  for (const a of g.actors) if (a.behName === 'w2Sole') { a.hidden = false; a.data.mode = 'post'; a.x = a.def.post.x; a.z = a.def.post.z; }
  g.banner('RUN!', 'Back to the pink RV! Mash JUMP or ACTION if they grab you.', { col: '#ff4a5a', big: true });
  burnsSfx('yell');
  void p;
};
BURNS_W2.escapeFail = function (g) {
  const S = BURNS_W2.state; S.esc = null; S.escRetry = true;
  BURNS_W2.soleReset(g);
};
BURNS_W2.soleReset = function (g) {
  const S = BURNS_W2.state, k = g.actor('kevin');
  if (k) { k.data.mode = 'host'; k.x = S.kevinHome.x; k.z = S.kevinHome.z; k.yaw = S.kevinHome.yaw; k.vx = k.vz = 0; }
  for (const a of g.actors) if (a.behName === 'w2Sole') { a.hidden = true; a.data.mode = 'off'; a.x = a.def.post.x; a.z = a.def.post.z; }
};
// a breadcrumb trail of where Brady ran: Kevin catches up along it when he falls behind
BURNS_W2.escapeStep = function (g, dt) {
  const S = BURNS_W2.state, E = S.esc, p = g.player;
  if (!E || g.missions.state('escape') !== 'active') return;
  E.t += dt;
  const last = S.trail[S.trail.length - 1];
  if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 1.5) { S.trail.push({ x: p.x, z: p.z }); if (S.trail.length > 120) S.trail.shift(); }
  // dawn creeps in while you run
  const want = Math.min(0.55, E.t / 90);
  if (g.tod < want - 0.02 && g.todTarget === null) g.setTod(want, 0.02);
  const [rx, rz] = BURNS_W2.RLD;
  if (Math.hypot(p.x - rx, p.z - rz) < 9) BURNS_W2.escapeWin(g);
};
BURNS_W2.escapeWin = function (g) {
  const S = BURNS_W2.state, BW = BURNS_W234, p = g.player, [rx, rz] = BURNS_W2.RLD, k = g.actor('kevin');
  if (!S.esc || S.escWon) return; S.escWon = true; S.esc = null;
  BW.carryEnd(g);
  if (k) { k.data.mode = 'done'; k.x = S.kevinHome.x; k.z = S.kevinHome.z; k.vx = k.vz = 0; }
  for (const a of g.actors) if (a.behName === 'w2Sole') { a.hidden = true; a.data.mode = 'off'; }
  g.missions.complete('escape');
  S.bass = 0.01;
  const V = BURNS_W2.who(g, 'rlVelvet', 'MAMA VELVET'), C = BURNS_W2.who(g, 'rlCandi', 'CANDI');
  const toC = Math.atan2(BURNS_W2.C.x - rx, BURNS_W2.C.z - rz), ex = rx + Math.sin(toC) * 7, ez = rz + Math.cos(toC) * 7;
  const c0 = { x: ex + Math.cos(toC) * 6, y: 2.4, z: ez - Math.sin(toC) * 6, tx: rx, ty: 1.6, tz: rz, fov: 0.85 };
  const c1 = { x: ex, y: 3.2, z: ez, tx: ex + 120, ty: 6, tz: ez + 10, fov: 0.8 };
  g.cutscene([
    { music: 'burns_victory' },
    { do: g2 => { p.teleport(ex, 0, ez, toC + Math.PI); g2.setTod(1, 0.35); } },
    { cam: c0 },
    { say: ['brady', ['MAMA VELVET! Kevin... Kevin was SMELLING MY FEET!']] },
    { say: [V, ['Oh, honey. We told you to call us if he was weird.', 'Everybody knows Kevin. He\'s harmless. He\'s just... thorough.']] },
    { do: g2 => { S.bass = 1; g2.shake(0.12); burnsSfx('stomp', { vol: 0.5, pitch: 0.6 }); } },
    { cam: c1 },
    { say: ['brady', ['Wait. Do you hear that? Boom... tss... boom...', 'That sounds like... BAMBOO?']] },
    { say: [C, ['That\'s Rhythm Wave, baby. A bamboo dance floor. Sunrise sets every morning.', 'Way out past 5:00. Some people swear it\'s at 4:30.']] },
    { say: ['brady', ['4:30 is REAL?!']] },
    { cam: c0 },
    { say: [V, ['Go on. Leave your stuff with us. Go dance it off.', 'And Brady? Wear socks.']] },
    { do: g2 => { p.victoryT = 3; burnsSfx('crowd_cheer'); } },
    { wait: 1.0 }
  ], g2 => g2.finishWorld());
};

// the tracker points Camp Shopping at the nearest camp that hasn't said no yet
BURNS_W2.searchMarker = function (g) {
  const m = g.missions.get('search'); if (!m || m.state !== 'active') return;
  const S = BURNS_W2.state, p = g.player, opts = [];
  for (const q of S.rejectCamps) if (!BurnsSave.flag(2, 'rej:' + q.id)) opts.push([q.x, q.z]);
  if (!BurnsSave.flag(2, 'rej:conclave')) opts.push([S.conclave.x, S.conclave.z + 17]);
  if (!BurnsSave.flag(2, 'rej:alley')) opts.push([S.alley.sx, S.alley.sz]);
  if (!BurnsSave.flag(2, 'rej:lights')) opts.push([34, 22]);
  let best = null, bd = 1e9; for (const o of opts) { const d = Math.hypot(o[0] - p.x, o[1] - p.z); if (d < bd) { bd = d; best = o; } }
  if (best) m.def.marker = { x: best[0], z: best[1] };
};
// the undercover cops want to see what's in the big bag
BURNS_W2.bagSearch = function (g, a) {
  const S = BURNS_W2.state, p = g.player;
  a.data.cd = 14; S.bagSearchT = 2.2; p.locked = true; p.vx = p.vz = 0;
  a.say('Forty black t-shirts... one wheel of brie... a feather boa?! ...Groovy. Carry on, citizen.', 3);
  g.toast('BAG SEARCHED: 40 BLACK TEES, 1 BRIE, 1 BOA. CARRY ON.'); burnsSfx('pitch_blah', { vol: 0.5 });
};

BURNS_W2.lampStart = function (g) {
  const S = BURNS_W2.state; S.lampWalk = { i: 0, far: 0 };
  ['wick', 'lamp1', 'lamp2'].forEach(id => { const a = g.actor(id); if (a) { a.w2start = a.w2start || { x: a.x, z: a.z }; a.setBehavior('w234Puppet'); } });
  g.banner('LIGHT THE WAY', 'Walk with the lamplighters. Stay in their light.', { col: '#ffcf7a' });
};
BURNS_W2.lampStep = function (g, dt) {
  const S = BURNS_W2.state, W = S.lampWalk, R = S.lampRoute, p = g.player, lead = g.actor('wick');
  if (!lead) return;
  const t = R[Math.min(W.i, R.length - 1)], d = lead.moveTo(t[0], t[1], 1.7, dt, 0.4);
  lead.ch.play('walk', { rate: 0.9 });
  if (d < 0.6 && W.i < R.length - 1) W.i++;
  ['lamp1', 'lamp2'].forEach((id, k) => { const a = g.actor(id); if (!a) return; const bx = lead.x - Math.sin(lead.yaw) * (2 + k * 1.8) + Math.cos(lead.yaw) * (k ? 1 : -1), bz = lead.z - Math.cos(lead.yaw) * (2 + k * 1.8) - Math.sin(lead.yaw) * (k ? 1 : -1); const dd = a.moveTo(bx, bz, 2.1, dt, 0.3); a.ch.play(dd > 0.5 ? 'walk' : 'idle', { rate: 0.75 }); });
  for (const L of S.lamps) if (!L.lit && Math.hypot(L.x - lead.x, L.z - lead.z) < 5.5) { L.lit = true; L.gl.c = L.gl.c0; g.fx.burst(L.x, 3.1, L.z, 'spark', 8, '#ffcf7a'); burnsSfx('pick', { vol: 0.35, pitch: 1.4 }); }
  const dp = Math.hypot(p.x - lead.x, p.z - lead.z);
  W.far = dp > 11 ? W.far + dt : 0;
  if (W.far > 0.05 && W.far < dt * 1.5) g.warn('STAY IN THE LIGHT!', 2.5);
  if (W.far > 3) { g.missions.fail('lanterns', 'You wandered out of the light.'); return; }
  if (W.i >= R.length - 1 && d < 0.8) g.missions.complete('lanterns');
};
BURNS_W2.lampReset = function (g) {
  const S = BURNS_W2.state; S.lampWalk = null;
  for (const L of S.lamps) { L.lit = false; L.gl.c = [0, 0, 0]; }
  ['wick', 'lamp1', 'lamp2'].forEach(id => { const a = g.actor(id); if (a && a.w2start) { a.x = a.w2start.x; a.z = a.w2start.z; a.vx = a.vz = 0; a.setBehavior('idle'); } });
};
BURNS_W2.lampDone = function (g) {
  const S = BURNS_W2.state; S.lampWalk = null;
  for (const L of S.lamps) { L.lit = true; L.gl.c = L.gl.c0; }
  ['wick', 'lamp1', 'lamp2'].forEach(id => { const a = g.actor(id); if (a) { a.setBehavior('idle'); a.vx = a.vz = 0; a.home = { x: a.x, z: a.z, y: a.y, yaw: a.yaw }; } });
  g.glow += 25; g.toast('+25 GLOW STICKS · 7:00 IS LIT');
  const a = g.actor('wick'); if (a) a.say('The way is lit. It always was. We just reminded it.', 3.5);
  g.spawnPickup('water', g.player.x + 1.5, 0.9, g.player.z, { pop: true });
};
BURNS_W2.labels = function (g, mission, label) { for (const P of g.pickups.items) if (P.mission === mission) P.label = label; };
BURNS_W2.captainLecture = function (g, a) {
  const S = BURNS_W2.state; S.capMet = true;
  g.say(a, ['HALT. Citizen. Your illumination is FIVE LUMENS too dim.', 'No bike? Then your PERSONAL lumens are too dim! You are a dark spot! Dark spots get run over by art cars!', 'Also: there is MOOP on my Esplanade. Matter. Out. Of. Place. Ten pieces. I can SEE them.', 'Sweep them up and I will issue you one regulation headlamp. And stay out of my lecture radius.'], () => { if (g.missions.state('moop') === 'available') g.missions.start('moop'); });
};
BURNS_W2.moopDone = function (g) {
  const S = BURNS_W2.state, a = g.actor('captain');
  g.say(a || 'brady', ['Ten pieces of MOOP. Bagged, tagged, logged. Outstanding.', 'One regulation headlamp, issued. Wear it at all times. Yes, in the shower. There is no shower. Wear it anyway.'], () => {
    S.headlamp = true; g.glow += 15; g.banner('REGULATION HEADLAMP', 'Your personal lumens are now acceptable. +15 glow sticks', { col: '#e8ff5a', big: true }); burnsSfx('map_open', null, 'secret');
  });
};

/* ---------------- lot builder: one camp on a city block (night) ---------------- */
BURNS_W2.lot = function (api, x, z, yaw, seed, force, allowNpc) {
  const r = mulberry32(seed), BW = BURNS_W234, fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const L = (a, b) => [x + rx * a + fx * b, z + rz * a + fz * b];
  const kind = force || r.weighted([['rv', 3], ['dome', 2], ['tents', 1.6], ['lounge', 1.6], ['art', 1], ['sound', 0.6], ['flags', 0.8]]);
  let npcs = 0;
  const crowd = (a, b, n, beh) => { if (!allowNpc || r() > 0.55) return; const [cx, cz] = L(a, b); for (let i = 0; i < n; i++) { const t = r() * TAU, d = r() * 1.8; api.npc({ type: r.pick(['burner', 'burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'burner']), seed: Math.floor(r() * 1e6), x: cx + Math.cos(t) * d, z: cz + Math.sin(t) * d, yaw: r() * TAU, behavior: beh || r.pick(['dance', 'idle', 'dance', 'sit', 'wander']), style: Math.floor(r() * 6), radius: 3, ambient: true }); npcs++; } };
  const neon = () => r.pick(BURNS_NEON);
  if (kind === 'rv') {
    const [vx, vz] = L(r.range(-1.5, 1.5), -2.6);
    api.prop(r.pick(['rv', 'rv', 'van', 'camper', 'boxtruck', 'bus', 'trailer']), { x: vx, z: vz, yaw: yaw + Math.PI / 2 + r.range(-0.08, 0.08), seed });
    const [sx, sz] = L(r.range(-2, 2), 1.6);
    api.prop('shade', { x: sx, z: sz, w: 4.5 + r() * 2, d: 3.4, col: r.pick(['#d8c8a8', '#c8b8e8', '#e8c8a8', '#a8d8c8', '#e8a8c8']), yaw });
    if (r() < 0.6) { const [cx, cz] = L(r.range(-1.5, 1.5), 1.4); api.prop('couch', { x: cx, z: cz, yaw: yaw + Math.PI, col: r.pick(['#8a2a5a', '#2a5a8a', '#6a4a2a', '#5a2a8a']) }); }
    if (r() < 0.35) { const [bx, bz] = L(r.pick([-3.2, 3.2]), 3.4); api.prop('barrel', { x: bx, z: bz }); }
    const [lx, lz] = L(0, 1.6); api.light(lx, lz, 7, r.pick(['#ffb070', '#ff70c0', '#70c0ff', '#c070ff']), 0.42);
    crowd(0, 2.2, 1 + Math.floor(r() * 2));
  } else if (kind === 'dome') {
    const rr = 3.6 + r() * 1.8, [dx, dz] = L(r.range(-1, 1), -0.8 - (rr - 3.6) * 0.5), c = neon();
    api.prop('dome', { x: dx, z: dz, r: rr, col: r.pick(['#e8e0d0', '#d8c0e8', '#c8e0e8', '#f0d8c8']), lights: true, glow: c });
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; api.glow(dx + Math.sin(a) * (rr + 0.2), 0.3, dz + Math.cos(a) * (rr + 0.2), 0.45, c, { blink: 3 }); }
    api.light(dx, dz, rr * 2.2, c, 0.45);
    crowd(0, 3.2, 2, 'dance');
  } else if (kind === 'tents') {
    const n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) { const [tx, tz] = L(-4 + i * (8 / Math.max(1, n - 1)) + r.range(-0.5, 0.5), r.range(-2.5, 0.5)); api.mesh(tx, tz, m => BW.tent(m, { r: 1.1 + r() * 0.5, col: r.pick(['#3a8a6a', '#3a6aaa', '#aa5a3a', '#8a3a8a', '#c8a03a', '#3a9aa8']) }), { yaw: yaw + r.range(-0.6, 0.6) }); }
    const [lx, lz] = L(r.range(-2, 2), 2.4);
    api.mesh(lx, lz, m => BW.lamp(m, { h: 2.4, pool: 7, col: neon() }), { yaw: yaw + Math.PI / 2 });
  } else if (kind === 'lounge') {
    const [cx, cz] = L(0, 0), c = r.pick(['#ff9ad8', '#9adcff', '#ffe28a', '#c8a0ff', '#a0ffd0']);
    api.mesh(cx, cz, m => {
      // a big parasol canopy (lathe) on a pole, beanbags, glowing orbs
      m.color('#4a3a3a'); BW.post(m, 0, 0, 0, 0.09, 3.1);
      m.color(c); BW.lathe(m, 0, 2.5, 0, [[0.1, 0.9], [3.2, 0], [3.2, 0], [3.0, 0.08], [0.2, 0.95], [0, 1.0]], { seg: 16 });
      const cols = [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: 3.4, camPass: true }];
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4, bx = Math.sin(a) * 1.8, bz = Math.cos(a) * 1.8; m.color(r.pick(BURNS_NEON)); BW.egg(m, bx, 0.32, bz, 0.62, 0.36, 0.62, { seg: 10, rings: 6 }); cols.push({ t: 'cyl', x: bx, z: bz, r: 0.55, y0: 0, y1: 0.55 }); }
      m.color(r.pick(BURNS_NEON), 1); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; BW.ball(m, Math.sin(a) * 2.7, 2.3, Math.cos(a) * 2.7, 0.16, { seg: 8, rings: 5 }); } m.emissive(0);
      const lights = [{ x: 0, y: 0, z: 0, s: 0, c, pool: 7 }]; for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; lights.push({ x: Math.sin(a) * 2.7, y: 2.3, z: Math.cos(a) * 2.7, s: 0.5, c: '#ffffff' }); }
      return { cols, lights };
    }, { yaw });
    crowd(0, 0.5, 2, 'sit');
  } else if (kind === 'art') {
    const [ax, az] = L(0, 0), c = neon(), t = r.pick(['mushroom', 'ring', 'orb', 'heart']);
    api.mesh(ax, az, m => {
      const lights = [{ x: 0, y: 0, z: 0, s: 0, c, pool: 8 }], cols = [];
      if (t === 'mushroom') { m.color('#e8e0d0'); BW.lathe(m, 0, 0, 0, [[0.5, 0], [0.35, 1.2], [0.42, 2.4]], { seg: 12 }); m.color(c, 0.6); BW.lathe(m, 0, 2.3, 0, [[0.3, 0], [2.0, 0.2], [2.1, 0.45], [1.4, 1.1], [0, 1.35]], { seg: 16 }); m.emissive(0); lights.push({ x: 0, y: 3, z: 0, s: 2.6, c }); cols.push({ t: 'cyl', x: 0, z: 0, r: 0.5, y0: 0, y1: 2.4 }, { t: 'cyl', x: 0, z: 0, r: 2.0, y0: 2.3, y1: 3.5 }); }
      else if (t === 'ring') { m.color(c, 0.85); BW.ring(m, 0, 2.6, 0, 2.3, 0.22, { pitch: Math.PI / 2, seg: 24, tseg: 8 }); m.emissive(0); m.color('#3a3a40'); BW.post(m, -2.3, 0, 0, 0.14, 1.2); BW.post(m, 2.3, 0, 0, 0.14, 1.2); lights.push({ x: 0, y: 2.6, z: 0, s: 3.2, c }); }
      else if (t === 'orb') { m.color('#2a2a30'); BW.lathe(m, 0, 0, 0, [[0.8, 0], [0.5, 0.6], [0.35, 1.3], [0.6, 1.5]], { seg: 12 }); m.color(c, 0.9); BW.ball(m, 0, 2.3, 0, 0.9); m.emissive(0); lights.push({ x: 0, y: 2.3, z: 0, s: 3.4, c }); cols.push({ t: 'cyl', x: 0, z: 0, r: 0.8, y0: 0, y1: 1.6 }); }
      else { m.color(c, 0.75); BW.heart(m, 0, 2.2, 0, 2.2, { depth: 0.45 }); m.emissive(0); m.color('#2a2a30'); BW.post(m, 0, 0, 0, 0.12, 1.4); lights.push({ x: 0, y: 2.2, z: 0.4, s: 3, c }); }
      return { cols, lights };
    }, { yaw });
  } else if (kind === 'sound') {
    const [sx, sz] = L(0, -1.5), c = neon();
    api.mesh(sx, sz, m => {
      const cols = [];
      for (const side of [-1, 1]) for (let k = 0; k < 2; k++) {
        const bx = side * 2.2; m.color('#1a1a20'); BW.rb(m, bx, 0.7 + k * 1.4, 0, 1.4, 1.36, 1.0, 0.12);
        m.color('#3a3a44'); BW.ring(m, bx, 0.7 + k * 1.4, 0.5, 0.42, 0.07, { pitch: Math.PI / 2, seg: 14, tseg: 4 }); m.color(c, 0.7); BW.egg(m, bx, 0.7 + k * 1.4, 0.48, 0.3, 0.3, 0.05, { seg: 10, rings: 4 }); m.emissive(0);
        cols.push({ t: 'box', x: bx, z: 0, hx: 0.7, hz: 0.5, y0: 0, y1: 2.8, cover: true });
      }
      m.color('#2a2a30'); BW.rb(m, 0, 0.55, 0.3, 1.8, 1.1, 0.8, 0.12); m.color(c, 1); BW.rb(m, 0, 1.12, 0.3, 1.6, 0.06, 0.6, 0.03); m.emissive(0);
      cols.push({ t: 'box', x: 0, z: 0.3, hx: 0.9, hz: 0.4, y0: 0, y1: 1.15 });
      return { cols, lights: [{ x: 0, y: 1.2, z: 0.3, s: 1.2, c }, { x: 0, y: 0, z: 3, s: 0, c, pool: 9 }, { x: -2.2, y: 3, z: 0, s: 0.8, c: '#ffffff', blink: 6 }, { x: 2.2, y: 3, z: 0, s: 0.8, c: '#ffffff' }] };
    }, { yaw });
    if (allowNpc) { const [dx, dz] = L(0, -1.0); api.npc({ type: 'ledsuit', seed: seed, x: dx, z: dz, yaw, behavior: 'dance', style: 3, ambient: true, chat: ['This next one is a deep cut.', 'Can you feel the bass? The bass can feel you.'] }); npcs++; }
    crowd(0, 3.2, 3, 'dance');
  } else if (kind === 'flags') {
    const c1 = neon(), c2 = neon();
    for (const s of [-1, 1]) { const [px, pz] = L(s * 4, 0); api.mesh(px, pz, m => { m.color('#4a4a52'); BW.post(m, 0, 0, 0, 0.07, 5.2); m.color(s > 0 ? c1 : c2, 0.5); BW.ball(m, 0, 5.3, 0, 0.16); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.1, y0: 0, y1: 5.2, camPass: true }], lights: [{ x: 0, y: 5.3, z: 0, s: 0.7, c: s > 0 ? c1 : c2 }] }; }); }
    const [a0, b0] = L(-4, 0), [a1, b1] = L(4, 0);
    api.prop('pennants', { x: 0, z: 0, x0: a0, y0: 5.0, z0: b0, x1: a1, y1: 5.0, z1: b1, n: 14, sag: 0.9 });
    const [tx, tz] = L(r.range(-2, 2), -1.5); api.mesh(tx, tz, m => BW.tent(m, { r: 1.5, col: r.pick(['#3a8a6a', '#aa5a3a', '#8a3a8a']) }), { yaw });
    const [lx, lz] = L(0, 0); api.light(lx, lz, 7, c1, 0.35);
  }
  return npcs;
};

/* ---------------- art cars for the parade (built at the origin, front = +Z) ---------------- */
BURNS_W2.chassis = function (m, len, w, col, led) {
  const BW = BURNS_W234;
  m.color('#1a1a20'); BW.rb(m, 0, 0.62, 0, w, 0.9, len, 0.32);
  m.color(col); BW.rb(m, 0, 1.18, 0, w + 0.16, 0.38, len + 0.16, 0.16);
  m.color('#7a5a3a'); BW.rb(m, 0, 1.4, 0, w - 0.1, 0.1, len - 0.2, 0.04, { uv: BURNS_ATLAS.pattern('wood') });
  m.color(led, 1); for (const s of [-1, 1]) BW.limb(m, s * (w / 2 + 0.09), 0.86, -len / 2 + 0.4, s * (w / 2 + 0.09), 0.86, len / 2 - 0.4, 0.05); m.emissive(0);
  m.color('#101014'); for (const zz of [len / 2 - 1.3, -len / 2 + 1.3]) for (const s of [-1, 1]) { m.push(); m.tf(s * (w / 2 - 0.15), 0.45, zz, 0, 0, Math.PI / 2); m.roundCyl(0, -0.2, 0, 0.45, 0.4, 0.1, { seg: 12 }); m.pop(); }
  m.color('#fff4d0', 1); for (const s of [-1, 1]) BW.ball(m, s * (w / 2 - 0.4), 0.9, len / 2 + 0.05, 0.14, { seg: 8, rings: 5 }); m.emissive(0);
  return [{ t: 'box', x: 0, z: 0, hx: w / 2, hz: len / 2, y0: 0, y1: 1.45, cover: true }];
};
BURNS_W2.carSnail = function (m, i) {
  const BW = BURNS_W234, len = 8.4, w = 3.6, cols = this.chassis(m, len, w, '#5a2a8a', BURNS_NEON[i % 7]);
  m.color('#7ad8a8'); BW.limb(m, 0, 1.75, -2.6, 0, 1.75, 3.0, 0.55, 0.6); BW.limb(m, 0, 1.9, 3.0, 0, 3.0, 3.7, 0.55, 0.45);
  m.color('#5ac898'); BW.limb(m, -0.25, 3.3, 3.8, -0.55, 4.5, 4.1, 0.07); BW.limb(m, 0.25, 3.3, 3.8, 0.55, 4.5, 4.1, 0.07);
  m.color('#ffe24a', 1); BW.ball(m, -0.55, 4.6, 4.1, 0.2); BW.ball(m, 0.55, 4.6, 4.1, 0.2); m.emissive(0);
  m.color('#c84ac8').shine(1); BW.egg(m, 0, 3.4, -0.8, 1.35, 2.0, 2.0); m.shine(0);
  m.color('#ff9ad8', 0.9); for (const s of [-1, 1]) for (const [rr, k] of [[1.55, 0], [1.0, 1], [0.5, 2]]) BW.ring(m, s * (1.3 - k * 0.04), 3.4 + k * 0.2, -0.8 + k * 0.15, rr, 0.07, { roll: Math.PI / 2, seg: 18, tseg: 4 }); m.emissive(0);
  cols.push({ t: 'cyl', x: 0, z: -0.8, r: 1.5, y0: 1.4, y1: 5.2 }, { t: 'cyl', x: 0, z: 3.2, r: 0.6, y0: 1.4, y1: 3.6 });
  return { cols, lights: [{ x: 0, y: 3.4, z: -0.8, s: 4.5, c: '#ff4fd8' }, { x: 0, y: 4.6, z: 4.1, s: 1.2, c: '#ffe24a' }], len, w };
};
BURNS_W2.carTeapot = function (m, i) {
  const BW = BURNS_W234, len = 7.6, w = 3.6, cols = this.chassis(m, len, w, '#1a6a6a', BURNS_NEON[(i + 2) % 7]);
  m.color('#2ab8a8').shine(2); BW.lathe(m, 0, 1.45, -0.4, [[0.9, 0], [1.75, 0.6], [1.95, 1.4], [1.7, 2.3], [1.0, 2.8], [1.0, 2.8], [0.6, 3.0], [0, 3.05]], { seg: 20 }); m.shine(0);
  m.color('#ffd84a').shine(3); BW.ring(m, 0, 2.9, -0.4, 1.35, 0.1, { seg: 20, tseg: 5 }); BW.ball(m, 0, 4.65, -0.4, 0.28); m.shine(0);
  m.color('#2ab8a8'); BW.tube(m, [[0, 2.4, 1.3], [0, 2.9, 2.3], [0, 3.8, 2.9]], 0.32);
  m.color('#2ab8a8'); BW.ring(m, 0, 3.0, -2.3, 0.75, 0.16, { roll: Math.PI / 2, seg: 16, tseg: 6 });
  m.color('#ff4fd8', 1); for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; BW.ball(m, Math.sin(a) * 1.92, 2.85, -0.4 + Math.cos(a) * 1.92, 0.12, { seg: 6, rings: 4 }); } m.emissive(0);
  cols.push({ t: 'cyl', x: 0, z: -0.4, r: 1.8, y0: 1.4, y1: 4.4 });
  return { cols, lights: [{ x: 0, y: 3.9, z: 2.9, s: 1.4, c: '#ffffff' }, { x: 0, y: 3.0, z: -0.4, s: 4, c: '#38f2ff' }], len, w };
};
BURNS_W2.carCupcake = function (m, i) {
  const BW = BURNS_W234, len = 7.8, w = 3.8, cols = this.chassis(m, len, w, '#c83a7a', BURNS_NEON[(i + 4) % 7]);
  const prof = []; for (let k = 0; k <= 6; k++) prof.push([1.35 + k * 0.07, 1.45 + k * 0.22, k % 2 ? '#ff7ab8' : '#ffb0d8']);
  m.color('#ff9ad0'); m.push(); m.tf(0, 0, -0.2); m.lathe(prof, { seg: 20 }); m.pop();
  m.color('#fff4fa'); for (let k = 0; k < 4; k++) BW.ring(m, 0, 2.95 + k * 0.42, -0.2, 1.55 - k * 0.36, 0.32 - k * 0.04, { seg: 20, tseg: 7 });
  m.color('#e8204a', 0.6).shine(3); BW.ball(m, 0, 4.7, -0.2, 0.36); m.shine(0).emissive(0);
  for (let k = 0; k < 14; k++) { const a = k * 2.4, y = 3.0 + (k % 4) * 0.4, rr = 1.5 - (k % 4) * 0.34; m.color(BURNS_NEON[k % 7], 1); BW.ball(m, Math.sin(a) * rr, y + 0.25, -0.2 + Math.cos(a) * rr, 0.07, { seg: 5, rings: 3 }); } m.emissive(0);
  cols.push({ t: 'cyl', x: 0, z: -0.2, r: 1.7, y0: 1.4, y1: 4.6 });
  return { cols, lights: [{ x: 0, y: 4.7, z: -0.2, s: 1.6, c: '#ff3b5c' }, { x: 0, y: 3.4, z: -0.2, s: 3.8, c: '#ff9ad0' }], len, w };
};
BURNS_W2.carWhale = function (m, i) {
  const BW = BURNS_W234, len = 9.2, w = 3.8, cols = this.chassis(m, len, w, '#1a3a6a', BURNS_NEON[(i + 1) % 7]);
  m.color('#4a78b8').shine(1); m.ellipsoid(0, 2.55, 0.4, 1.7, 1.15, 3.6, { colFn: (x, y) => y < -0.35 ? '#e8eef8' : null }); m.shine(0);
  m.color('#4a78b8'); BW.limb(m, 0, 2.7, -3.0, 0, 3.2, -4.4, 0.6, 0.25);
  for (const s of [-1, 1]) { m.push(); m.tf(s * 0.75, 3.35, -4.55, s * 0.5, 0, s * 0.35); m.ellipsoid(0, 0, 0, 0.85, 0.12, 0.45); m.pop(); }
  m.color('#ffffff'); for (const s of [-1, 1]) BW.ball(m, s * 1.45, 2.85, 2.55, 0.2, { seg: 8, rings: 5 }); m.color('#101018'); for (const s of [-1, 1]) BW.ball(m, s * 1.6, 2.86, 2.62, 0.1, { seg: 6, rings: 4 });
  m.color('#7af2ff', 1); BW.limb(m, 0, 3.6, 1.6, 0, 4.6, 1.6, 0.06); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; BW.ball(m, Math.sin(a) * 0.5, 4.7 - Math.abs(Math.sin(a)) * 0.2, 1.6 + Math.cos(a) * 0.5, 0.12, { seg: 6, rings: 4 }); } m.emissive(0);
  // a flat walkable spot on its back (the photo rides here)
  m.color('#3a5a8a'); BW.rb(m, 0, 3.6, -0.4, 1.6, 0.14, 2.0, 0.06);
  cols.push({ t: 'box', x: 0, z: 0.4, hx: 1.5, hz: 3.4, y0: 1.4, y1: 3.4 }, { t: 'box', x: 0, z: -0.4, hx: 0.8, hz: 1.0, y0: 3.4, y1: 3.67 });
  return { cols, lights: [{ x: 0, y: 4.7, z: 1.6, s: 1.8, c: '#7af2ff' }, { x: 0, y: 2.6, z: 0.4, s: 4.2, c: '#3a8aff' }], len, w };
};
BURNS_W2.carJelly = function (m, i) {
  const BW = BURNS_W234, len = 7.4, w = 3.6, cols = this.chassis(m, len, w, '#3a1a5a', BURNS_NEON[(i + 5) % 7]);
  m.color('#5a4a6a'); BW.post(m, 0, 1.45, 0, 0.18, 2.4);
  m.color('#ff8ad8', 0.55); BW.egg(m, 0, 3.6, 0, 2.1, 1.5, 2.1, { phi1: Math.PI / 2 + 0.2, seg: 18, rings: 7 }); m.emissive(0);
  m.color('#9af2ff', 0.8); for (let k = 0; k < 7; k++) { const a = k / 7 * TAU, rr = 1.6; BW.tube(m, [[Math.sin(a) * rr, 3.4, Math.cos(a) * rr], [Math.sin(a + 0.25) * (rr + 0.25), 2.6, Math.cos(a + 0.25) * (rr + 0.25)], [Math.sin(a) * (rr + 0.1), 1.8, Math.cos(a) * (rr + 0.1)]], 0.07); } m.emissive(0);
  cols.push({ t: 'cyl', x: 0, z: 0, r: 0.3, y0: 1.4, y1: 3.8 }, { t: 'cyl', x: 0, z: 0, r: 2.0, y0: 3.4, y1: 5.0 });
  return { cols, lights: [{ x: 0, y: 4.2, z: 0, s: 5, c: '#ff8ad8' }], len, w };
};
BURNS_W2.carDisco = function (m, i) {
  const BW = BURNS_W234, len = 7.8, w = 3.6, cols = this.chassis(m, len, w, '#2a2a3a', BURNS_NEON[(i + 3) % 7]);
  m.color('#3a3a48'); BW.lathe(m, 0, 1.45, 0.2, [[1.0, 0], [0.5, 0.5], [0.35, 1.2], [0.6, 1.4]], { seg: 14 });
  const reg = BURNS_ATLAS.pattern('disco');
  m.color('#d8e4ff', 0.25).shine(3); m.ellipsoid(0, 4.1, 0.2, 1.45, 1.45, 1.45, { seg: 18, rings: 12, uvFn: (x, y, z) => [lerp(reg.u0, reg.u1, (Math.atan2(x, z) / TAU + 0.5) * 3 % 1), lerp(reg.v0, reg.v1, (y / 1.45 * 0.5 + 0.5) * 2 % 1)] }); m.shine(0).emissive(0);
  cols.push({ t: 'cyl', x: 0, z: 0.2, r: 0.9, y0: 1.4, y1: 2.9 }, { t: 'dome', x: 0, z: 0.2, r: 1.45, y0: 4.1 }, { t: 'cyl', x: 0, z: 0.2, r: 1.4, y0: 2.7, y1: 4.1 });
  return { cols, lights: [{ x: 0, y: 4.1, z: 0.2, s: 4.5, c: '#ffffff', blink: 5 }, { x: 1.4, y: 4.4, z: 1.2, s: 0.8, c: '#ff4fd8' }, { x: -1.4, y: 3.8, z: -0.6, s: 0.8, c: '#38f2ff' }], len, w };
};

/* ---------------- behaviours ---------------- */
// fire spinners: walk a ring around the conclave centre, poi blazing (hazard)
BurnsBehaviors.register('w2Spinner', {
  init(a) { a.data.ph = a.def.phase || 0; },
  update(a, g, dt) {
    const d = a.def, D = a.data, p = g.player;
    D.ph += d.omega * dt;
    a.x = d.cx + Math.sin(D.ph) * d.ring; a.z = d.cz + Math.cos(D.ph) * d.ring; a.y = 0;
    a.yaw = D.ph + Math.PI / 2 * Math.sign(d.omega) + Math.sin(g.time * 0.7 + d.phase) * 0.5;
    a.ch.play(d.kind === 'fans' ? 'dance' : 'w234poi', d.kind === 'fans' ? { style: 1, bpm: 124 } : { rate: 7 });
    if (!p.dead && p.invT <= 0 && Math.hypot(p.x - a.x, p.z - a.z) < (d.kind === 'staff' ? 1.65 : 1.5) && p.y < 2.6) { p.hurt(1, a.x, a.z, 7); p.say('HOT HOT HOT!', 1); }
  }
});
// Captain Safety Third: clipboard, glare, and lecture waves while the MOOP sweep is unfinished
BurnsBehaviors.register('w2Captain', {
  init(a) { a.data.cd = 2.5; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP(), S = BURNS_W2.state;
    if (d < 12) a.face(p.x, p.z, dt, 3);
    a.vx = a.vz = 0; a.physics(dt);
    D.cd -= dt;
    if (D.yell > 0) { D.yell -= dt; a.ch.play('yell'); if (D.yell <= 0) { (S.lectures || (S.lectures = [])).push({ x: a.x, z: a.z, r: 0.6 }); g.fx.ring(a.x, 0.3, a.z, 1.4, '#e8ff5a', 0.4); } return; }
    if (S.capMet && !g.missions.isDone('moop') && d < 10 && d > 1.4 && D.cd <= 0 && !g.dialog.open && !g.cine) {
      D.cd = 4.2 + Math.random(); D.yell = 0.5;
      a.say(['IS THAT A CLOSED-TOE SHOE?!', 'HYDRATE! IN AN ORDERLY FASHION!', 'WHERE IS YOUR BUDDY?!', 'THAT IS NOT A SAFE DISTANCE!', 'FIVE LUMENS! TOO DIM!'][Math.floor(Math.random() * 5)], 1.5);
      burnsSfx('yell', { vol: 0.5 });
    } else a.ch.play(a.bubbleT > 0 && d < 10 ? 'talk' : 'clipboard');
  }
});
// drunk camp neighbours: wobble toward Brady, hug-bump, pass out when spun
BurnsBehaviors.register('w2Drunk', {
  init(a) { a.data.t = Math.random() * 4; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP();
    D.t += dt;
    const wob = Math.sin(D.t * 2.1) * 1.1;
    if (d < (a.def.aggro || 8)) { const ang = Math.atan2(p.x - a.x, p.z - a.z) + wob; a.moveTo(a.x + Math.sin(ang) * 3, a.z + Math.cos(ang) * 3, 1.7, dt, 0.1); }
    else { if (!D.tx || Math.random() < dt * 0.2) { const t = Math.random() * TAU; D.tx = a.home.x + Math.cos(t) * 3; D.tz = a.home.z + Math.sin(t) * 3; } a.moveTo(D.tx, D.tz, 0.8, dt, 0.4); }
    a.ch.play('shuffle', { rate: 0.9 }); a.roll = Math.sin(D.t * 2.1) * 0.1;
    if (Math.random() < dt * 0.14) a.say(['Brooo... you\'re my best friend.', 'Is this my tent? It\'s my tent now.', 'Have you seen my shoes? Either of them?', 'Water shots! WATER SHOTS!', 'I love this song. What song is this?'][Math.floor(Math.random() * 5)], 2);
    BurnsBehaviors.contact(a, g, a.def.damage === undefined ? 1 : a.def.damage, 5);
    a.physics(dt);
  }
});
// Kevin: a friendly host... until 4 AM. In the escape he chases Brady, lunges, and grabs ("reading your soles").
// If he falls far behind he catches up along Brady's trail (SOLEMATE NEVER SLEEPS).
BurnsBehaviors.register('w2Kevin', {
  init(a) { a.data.mode = 'host'; a.data.t = 0; a.data.cd = 0; a.data.far = 0; },
  hit(a, g) { if (a.data.mode === 'host' || a.data.mode === 'done') return false; a.data.mode = 'dizzy'; a.data.t = 1.6; a.say('Ow! My chakras!', 1.2); return 'handled'; },
  update(a, g, dt) {
    const D = a.data, p = g.player, S = BURNS_W2.state;
    D.t -= dt; if (D.cd > 0) D.cd -= dt;
    const chasing = !!(S && S.esc) && g.missions.state('escape') === 'active';
    if (!chasing && D.mode !== 'host' && D.mode !== 'done') D.mode = 'host';
    const d = Math.hypot(p.x - a.x, p.z - a.z);
    if (D.mode === 'host' || D.mode === 'done') {
      if (d < 6) a.face(p.x, p.z, dt, 3);
      a.vx = a.vz = 0; a.ch.play(a.bubbleT > 0 && d < 10 ? 'talk' : D.mode === 'done' ? 'wave' : 'idle');
      if (D.mode === 'host' && d < 9 && Math.random() < dt * 0.08) a.say(['Nice night for it.', 'Ever had your arches read?', 'Socks are a social construct, man.'][Math.floor(Math.random() * 3)], 2);
    } else if (D.mode === 'wait') { a.face(p.x, p.z, dt, 6); a.ch.play('wave'); a.vx = a.vz = 0; if (D.t <= 0) { D.mode = 'chase'; a.say('Come back! I haven\'t done your TOES!', 2); } }
    else if (D.mode === 'chase') {
      // speed rubber-bands so he stays scary but beatable
      const sp = clamp(4.9 + (d - 8) * 0.12, 4.6, 6.3);
      a.moveTo(p.x, p.z, sp, dt, 0.5); a.ch.play('run', { rate: 0.85 });
      if (Math.random() < dt * 0.35) a.say(['Your heels are SCREAMING, man!', 'Let me read your arches!', 'Barefoot is a LIFESTYLE!', 'SOLEMATE NEVER SLEEPS!', 'I just want to help your FEET!'][Math.floor(Math.random() * 5)], 1.5);
      if (d < 3.4 && D.cd <= 0 && !p.grabbedBy && p.invT <= 0) { D.mode = 'wind'; D.t = 0.38; a.say('HOLD STILL!', 0.8); }
      // fell way behind (or got stuck behind a camp): reappear on Brady's trail
      D.far = d > 26 ? D.far + dt : 0;
      if (D.far > 1.2 && S.trail.length > 12 && !g.cine) {
        const q = S.trail[Math.max(0, S.trail.length - 12)];
        a.x = q.x; a.z = q.z; a.vx = a.vz = 0; D.far = 0; g.fx.smoke(a.x, 0.5, a.z, 6, '#e8e0ff');
        a.say('SOLEMATE NEVER SLEEPS!', 1.8);
      }
    } else if (D.mode === 'wind') { a.face(p.x, p.z, dt, 10); a.ch.play('hug'); a.vx = a.vz = 0; if (D.t <= 0) { D.mode = 'lunge'; D.t = 0.42; D.dx = Math.sin(a.yaw); D.dz = Math.cos(a.yaw); } }
    else if (D.mode === 'lunge') {
      a.vx = D.dx * 9.5; a.vz = D.dz * 9.5; a.ch.play('charge');
      if (a.touching(0.25) && !p.grabbedBy && p.invT <= 0 && !p.dead) { D.mode = 'grab'; D.t = 1.9; p.grab(a, 1.9); a.say(['Ahh. A Capricorn heel.', 'Your left foot is SO anxious.', 'I\'m sensing... dust. Lots of dust.'][Math.floor(Math.random() * 3)], 1.8); burnsSfx('bump'); }
      else if (D.t <= 0) { D.mode = 'chase'; D.cd = 1.4; }
    } else if (D.mode === 'grab') {
      a.ch.play('hug'); a.vx = a.vz = 0;
      if (Math.random() < dt * 5) g.fx.burst(a.x, a.y + 0.6, a.z, 'star', 1, '#9a6bff');
      if (D.t <= 0) { if (p.grabbedBy === a) p.release(true); g.toast('AURA READ! (-1 HYDRATION) Mash JUMP to break free!'); D.mode = 'chase'; D.cd = 2.6; }
    } else if (D.mode === 'dizzy') {
      a.vx = BurnsM.damp(a.vx, 0, 4, dt); a.vz = BurnsM.damp(a.vz, 0, 4, dt); a.ch.play('hurt'); a.yaw += dt * 4;
      if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + a.h + 0.1, a.z, 'star', 1, '#ffe24a');
      if (D.t <= 0) { D.mode = 'chase'; D.cd = 1.0; }
    }
    a.physics(dt);
  }
});
// the Sole Circle: barefoot reflexologists posted at street corners. They rush Brady when he runs past.
BurnsBehaviors.register('w2Sole', {
  init(a) { a.data.mode = 'off'; a.data.t = 0; a.hidden = true; },
  hit(a, g) { if (a.data.mode === 'off') return false; a.data.mode = 'dizzy'; a.data.t = 2; return 'handled'; },
  update(a, g, dt) {
    const D = a.data, p = g.player, P = a.def.post;
    D.t -= dt;
    if (D.mode === 'off') { a.hidden = true; a.vx = a.vz = 0; return; }
    const d = Math.hypot(p.x - a.x, p.z - a.z);
    if (D.mode === 'post') {
      a.moveTo(P.x, P.z, 1.4, dt, 0.4); a.face(p.x, p.z, dt, 3); a.ch.play(d < 16 ? 'wave' : 'idle');
      if (d < 7.5 && !p.grabbedBy && p.invT <= 0) { D.mode = 'rush'; D.t = 2.0; a.say(['FREE FOOT RUB!', 'Your arches are CRYING!', 'Sole Circle, ASSEMBLE!', 'Let us read your heels!'][Math.floor(Math.random() * 4)], 1.4); }
    } else if (D.mode === 'rush') {
      a.moveTo(p.x, p.z, 4.9, dt, 0.4); a.ch.play('run', { rate: 0.8 });
      if (a.touching(0.2) && !p.grabbedBy && p.invT <= 0 && !p.dead) { D.mode = 'grab'; D.t = 1.5; p.grab(a, 1.5); a.say('Ooh, tense little toes!', 1.4); burnsSfx('bump'); }
      else if (D.t <= 0 || d > 14) { D.mode = 'tired'; D.t = 4; }
    } else if (D.mode === 'grab') { a.ch.play('hug'); a.vx = a.vz = 0; if (D.t <= 0) { if (p.grabbedBy === a) p.release(true); D.mode = 'tired'; D.t = 5; } }
    else if (D.mode === 'dizzy') { a.ch.play('hurt'); a.yaw += dt * 4; a.vx = BurnsM.damp(a.vx, 0, 4, dt); a.vz = BurnsM.damp(a.vz, 0, 4, dt); if (D.t <= 0) { D.mode = 'tired'; D.t = 4; } }
    else if (D.mode === 'tired') { a.ch.play('sit'); a.vx = a.vz = 0; if (D.t <= 0) D.mode = 'post'; }
    a.physics(dt);
  }
});

/* ---------------- mission helpers ---------------- */
BURNS_W2.alleyStart = function (g) {
  const S = BURNS_W2.state, A = S.alley;
  g.player.teleport(A.sx - Math.sin(A.yaw) * 0.6, 0, A.sz - Math.cos(A.yaw) * 0.6, A.yaw); g.camYaw = A.yaw; g.snapCam = true;
  for (const j of S.jets) j.t = 0;
  g.banner('FLAME ALLEY', 'Run the gaps! Ring the bell!', { col: '#ff7a2a' });
};
BURNS_W2.alleyReset = function (g) { const A = BURNS_W2.state.alley; g.toast('BACK TO THE START!'); g.player.teleport(A.sx - Math.sin(A.yaw) * 3.5, 0, A.sz - Math.cos(A.yaw) * 3.5, A.yaw + Math.PI); };
BURNS_W2.alleyDone = function (g) {
  const S = BURNS_W2.state; S.alleyDoor.off = true; burnsSfx('greeter_bell'); g.fx.confetti(g.player.x, g.player.y + 2, g.player.z, 30);
  BURNS_W2.reject(g, 'alley', 'sparky', ['DING DING! LEGEND! The back door\'s open!', 'Wait. You wanted to JOIN? Oh no, buddy. The bell is just for fun. We\'re full. Like, fire-code full.']);
};
BURNS_W2.lostHome = function (g, a, L) {
  if (a.w2home) return;
  a.w2home = true; a.x = L.dx; a.z = L.dz; a.setBehavior('dance'); a.home = { x: a.x, z: a.z, y: a.y, yaw: a.yaw };
  a.say(['HOME! It was here the whole time!', 'My avocado! I\'d know that inflatable anywhere!', 'This is it! I can feel it in my sequins!'][BURNS_W2.state.lost.indexOf(L) % 3], 3);
  g.fx.confetti(a.x, a.y + 2, a.z, 20); g.glow += 5; g.toast('+5 GLOW STICKS · ' + L.addr);
  burnsSfx('crowd_cheer', { vol: 0.5 });
  if (g.missions.state('lost') === 'active') g.missions.progress('lost', 1);
};

/* test/debug access (the bundle is one IIFE) */
BURNS_W2.lib = () => BURNS_W234;
try { (window.BRADY_W234 = window.BRADY_W234 || {}).w2 = BURNS_W2; } catch (e) { /* no window */ }
