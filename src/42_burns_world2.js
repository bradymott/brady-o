/* ============================================================
   BRADY-O BURNS — World 2: FINDING CAMP (the city at night)
   Brady is inside the city at last, with one clue: a crumpled note
   with the camp address, smudged by a gifted margarita ("?:?? & ?").
   Clock streets run out from the Man's (empty) pavilion; lettered
   streets ring it. Three clues fill in the note, then: go home.
   Missions (Burn Tokens):
     ranger    Ask a Ranger          learn the street signs, go stand under 6:30 & A
     conclave  The Fire Conclave     cross two rings of fire spinners to Fire Mama Ember
     alley     Flame Alley           timed run through Camp Combustion's poofer alley
     lights    Bike Light Roundup    8 LED bike lights scattered between bike swarms
     lost      Lost & Found Burners  walk three lost burners home (address practice)
     tower     Lighthouse of Lost Souls  hidden climb on the open playa
     camp      Home Is Where the Man Is  boss: the Man waits at 7:30 & E (needs all 3 clues)
   Set pieces: the never-ending art car parade circling Brady's block,
   the Fire Conclave rings, Flame Alley.
   ============================================================ */

const BURNS_W2 = {
  C: { x: 80, z: -150 },                       // city centre: the Man's (empty) pavilion, north of the map
  R: [100, 126, 152, 178, 204, 230, 256],     // Esplanade, A..F
  LET: ['ESPLANADE', 'A', 'B', 'C', 'D', 'E', 'F'],
  CLOCK: [['5:00', -30], ['5:30', -15], ['6:00', 0], ['6:30', 15], ['7:00', 30], ['7:30', 45], ['8:00', 60], ['8:30', 75]],
  NOTE: ['?:?? & ?', '7:?? & ?', '7:30 & ?', '7:30 & E'],
  state: null,
  at(th, r) { const a = th * Math.PI / 180; return [this.C.x - r * Math.sin(a), this.C.z + r * Math.cos(a)]; },
  polar(x, z) { const dx = x - this.C.x, dz = z - this.C.z; return [Math.atan2(-dx, dz) * 180 / Math.PI, Math.hypot(dx, dz)]; },
  outYaw(th) { const a = th * Math.PI / 180; return Math.atan2(-Math.sin(a), Math.cos(a)); },
  clues(g) { let n = 0; for (const id of ['ranger', 'conclave', 'lights']) if (g ? g.missions.isDone(id) : BurnsSave.hasToken(2, id)) n++; return n; }
};
(() => { const W = BURNS_W2; W.CAMP = W.at(45, 230); W.MAN = W.at(45, 245); })();

BurnsWorlds.register({
  id: 2, name: 'Finding Camp', sub: 'The city at night',
  sky: Object.assign({}, BURNS_PALETTES.night, { zen: '#05061c', hor: '#3a1446', fog: '#24183a', fogD: 0.0105, haze: 0.55, moon: [215, 38], moonK: 1.1, stars: 1, mtnCol: '#120a24', city: [20, 0], cityCol: '#ff7a3a', cityK: 0.7, sky: '#4a4a8a', gnd: '#3a2a46', key: '#9aa8e8', keyK: 0.5, emB: 1.75, rim: '#b08aff' }),
  sky2: Object.assign({}, BURNS_PALETTES.night, { zen: '#0a0414', hor: '#4a1a3a', fog: '#30203a', fogD: 0.0125, haze: 0.62, moon: [235, 22], moonK: 0.9, stars: 0.85, mtnCol: '#160a1e', city: [20, 0], cityCol: '#ff4fd8', cityK: 0.8, sky: '#54407a', gnd: '#3a2838', key: '#b09ad8', keyK: 0.45, emB: 1.85, rim: '#ff8ad8' }),
  tod: 0,
  music: 'burns_w2',
  bounds: [-155, -112, 155, 112],
  spawn: { x: 80, y: 0, z: -62, yaw: 0 },
  ground: { base: '#b8967c', crack: 0.22, mottle: 0.4, res: 0.5 },
  dust: 0.8,
  missions: [
    { id: 'note', name: 'The Crumpled Note', token: false, type: 'custom', start: 'auto', silent: true, short: 'Find camp: ?:?? & ?',
      desc: 'Your camp address, smudged by a gifted margarita. Three clues will fill it in: a Ranger, the Fire Conclave and Camp Blinky.', hint: 'Read the street signs: clock streets go out, letter streets go around' },
    { id: 'ranger', name: 'Ask a Ranger', type: 'reach', giver: 'sage', start: 'manual', short: 'Stand under the 6:30 & A sign', marker: { x: 86, z: -60 },
      target: { x: 0, z: 0, r: 3.2 }, desc: 'Ranger Sagebrush will teach you the street signs. Clock streets go out from the Man, letter streets go around.', hint: 'Ranger Outpost, 6:00 & Esplanade (where you start)',
      onComplete(g) { BURNS_W2.clue(g, 1, 'RANGER SAGEBRUSH', ['Copy that, you found it! You\'re a natural.', 'And that smudge on your note? That\'s a seven. Your camp\'s on a SEVEN-something street.']); } },
    { id: 'conclave', name: 'The Fire Conclave', type: 'reach', giver: 'flint', start: 'manual', short: 'Cross the fire circle to Fire Mama Ember', marker: { x: 56, z: -84 },
      target: { x: 0, z: 0, r: 2.6 }, desc: 'Fire Mama Ember can read any smudge. She\'s in the middle of the conclave. Don\'t touch the poi.', hint: 'Open playa, between 6:00 and 7:00, inside Esplanade',
      onComplete(g) { BURNS_W2.clue(g, 2, 'FIRE MAMA EMBER', ['You walked through fire for a napkin? I respect that.', 'Mm-hm. I\'m fluent in smudge, baby. That says SEVEN-THIRTY.']); } },
    { id: 'alley', name: 'Flame Alley', type: 'race', time: 20, giver: 'sparky', start: 'manual', short: 'Run Flame Alley! Ring the bell', marker: { x: 59, z: 6 },
      target: { x: 0, z: 0, r: 2.2 }, desc: 'Camp Combustion\'s poofer alley. Ring the bell at the far end before the clock runs out.', hint: 'Camp Combustion, between 6:00 and 6:30, B to C',
      onStart(g) { BURNS_W2.alleyStart(g); }, onFail(g) { BURNS_W2.alleyReset(g); },
      onComplete(g) { BURNS_W2.alleyDone(g); } },
    { id: 'lights', name: 'Bike Light Roundup', type: 'collect', count: 8, giver: 'lumen', start: 'manual', progressLabel: 'Bike lights', short: 'Collect lost bike lights', marker: { x: 34, z: 22 },
      desc: 'A bike swarm blew through Camp Blinky and scattered 8 LED bike lights. Grab them between swarms. Don\'t stand in the bike lane.', hint: 'Camp Blinky, 6:30 & C',
      onStart(g) { BURNS_W2.labels(g, 'lights', 'BIKE LIGHT'); },
      onComplete(g) { BURNS_W2.clue(g, 3, 'LUMEN', ['MY BABIES! All eight! The playa is bright again!', 'Your note? Ooh, that last bit is an E. Seven-thirty and E. Right where the parade goes round and round.']); } },
    { id: 'lost', name: 'Lost & Found Burners', type: 'custom', count: 3, giver: 'lost1', start: 'manual', progressLabel: 'Burners home', short: 'Walk the lost burners home', marker: { x: 107, z: -32 },
      desc: 'Three burners asked you where 4:30 is. It is not here. Walk each of them to the address they actually remember.', hint: 'Lost burners wander near Esplanade and 6:00',
      onComplete(g) { g.banner('ADDRESS MASTER', 'You know this city better than the people who live here.', { col: '#7aff5a', small: true }); } },
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
    { id: 'tower', name: 'Lighthouse of Lost Souls', type: 'climb', start: 'trigger', secret: true, short: 'Climb the lighthouse', target: { x: 0, z: 0, r: 3.2, y: 13.6 },
      desc: 'An art lighthouse on the open playa. Lost souls climb it to look for their camp.', hint: 'Open playa west of the conclave' },
    { id: 'camp', name: 'Home Is Where the Man Is', type: 'boss', start: 'auto', silent: true, requires: ['ranger', 'conclave', 'lights'], tokenDirect: true, short: 'Go home: 7:30 & E',
      desc: 'Your note says 7:30 & E. Cross the art car parade and get home.', hint: 'Inside the art car parade loop', lockedDesc: 'Find all three clues first.' }
  ],
  build(api, g) {
    const W2 = BURNS_W2, R = api.rng, BW = BURNS_W234, RR = W2.R;
    BW.reset(g);
    W2.state = { introDone: !!BurnsSave.flag(2, 'intro'), followers: [], swarms: [], spinners: [], jets: [], bossStarted: false, warned: 0 };
    const S = W2.state, at = (th, r) => W2.at(th, r);
    const CAMP = W2.CAMP;
    // fix mission targets now that the geometry is known
    const M = id => this.missions.find(m => m.id === id);
    { const [x, z] = at(15, 126); const t = M('ranger').target; t.x = x + 3.5; t.z = z + 3.5; }
    S.conclave = { x: 56, z: -84 }; Object.assign(M('conclave').target, S.conclave);
    S.tower = { x: 18, z: -96 }; Object.assign(M('tower').target, S.tower); M('tower').tokenAt = { x: S.tower.x + 1.6, y: 14.8, z: S.tower.z };
    M('camp').marker = { x: CAMP[0], z: CAMP[1] };
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
    });
    /* ---------------- streets: signposts + lamps at every intersection ---------------- */
    const bounds = (x, z, m) => x > -155 + m && x < 155 - m && z > -112 + m && z < 112 - m;
    for (const [name, th] of W2.CLOCK) for (let j = 0; j < RR.length; j++) {
      const r = RR[j] - 5.6, d = 5.6 / r * 180 / Math.PI, [x, z] = at(th + d, r);
      if (!bounds(x, z, 3)) continue;
      const a = th * Math.PI / 180;
      api.mesh(x, z, m => BW.signpost(m, { a: name, b: W2.LET[j], yawA: Math.atan2(-Math.cos(a), -Math.sin(a)), yawB: Math.atan2(Math.sin(a), -Math.cos(a)) }));
      api.light(x, z, 6, '#ff9ad8', 0.22);
      if ((j + Math.round(th / 15)) % 2 === 0) { const [lx, lz] = at(th - d, r); if (bounds(lx, lz, 3)) api.mesh(lx, lz, m => BW.lamp(m, { pool: 10 }), { yaw: W2.outYaw(th) + Math.PI / 2 }); }
    }
    // the 6:00 promenade: double row of lamps out to the pavilion
    for (let r = 20; r < 98; r += 13) for (const s of [-1, 1]) { const [x, z] = at(s * 4.2 * 180 / Math.PI / r, r); if (bounds(x, z, 2)) api.mesh(x, z, m => BW.lamp(m, { pool: 8, col: '#ffd890' }), { yaw: s > 0 ? Math.PI / 2 : -Math.PI / 2 }); }
    /* ---------------- the city: camps on every block ---------------- */
    S.capCamp = W2.at(21, 111);
    const reserved = [[CAMP[0], CAMP[1], 27], [59, 13, 17], [34, 22, 13], [107, -32, 9], [66, -38, 7], [30, -46, 7], [S.capCamp[0], S.capCamp[1], 11]];
    const isReserved = (x, z) => reserved.some(q => Math.hypot(x - q[0], z - q[1]) < q[2]);
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
    /* ---------------- 6:00 & Esplanade: Ranger Outpost (start) ---------------- */
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
          if (st === 'available') g2.say(a, ['First night? Lost? I\'m a Ranger. Not a cop. Totally different hat. The hat is VERY different. Let me explain the hat.', 'Okay, no time for the hat. The city is a clock. The Man sits in the middle. CLOCK streets go OUT like hands: 6:00, 6:30, 7:00...', 'LETTER streets go AROUND: Esplanade on the inside, then A, B, C, all the way out. Principle Number Three applies. Also Principle Seven. I\'ll summarize all ten.', '...And that is Principle Ten. Also, I\'m writing you up. Citation: one bike light, insufficiently bright. You don\'t have a bike? I\'m citing the bike you WILL have.', 'Quiz time! Go stand under the 6:30 and A sign. I\'ll wait. Rangers are great at waiting. And at paperwork.'], () => { g2.toast('CITATION: DIM BIKE LIGHT (FUTURE)'); g2.missions.start('ranger'); });
          else if (st === 'active') g2.say(a, ['6:30 is one street over toward 7. A is the first ring past Esplanade. Look up at the signs, friend.']);
          else g2.say(a, ['Seven-something, huh? Keep reading those signs. And drink water. That\'s an order. I\'m not a cop, it\'s a suggestion.']);
        } });
      api.npc({ type: 'ranger', seed: 9, name: 'RANGER BUTTONS', x: 100, z: -48, behavior: 'walk', path: [[100, -48], [60, -96], [100, -48]], speed: 1.2,
        lines: ['Sign says 6:00 and Esplanade. That means you\'re at 6:00 and Esplanade. I love this job.', 'Saw a forty-foot wooden fella sneak toward the 7s. Hard to miss. Easy to lose.'], gift: { kind: 'water' } });
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
          if (st === 'available') g2.say(a, ['Fire safety! Fire Mama Ember is in the middle of the circle. She reads smudges. It\'s a gift.', 'Two rings of spinners, both going round. Wait for a gap. Walk, don\'t dawdle. Never hug a poi.'], () => g2.missions.start('conclave'));
          else if (st === 'active') g2.say(a, ['Inner ring and outer ring turn opposite ways. Stand between them if you need a breather.']);
          else g2.say(a, ['Still got your eyebrows? Proud of you.']);
        } });
      api.npc({ id: 'ember', name: 'FIRE MAMA EMBER', type: 'burner', seed: 32, x: cx, z: cz - 0.8, y: 0.45, fixedY: true, behavior: 'dance', style: 1,
        spec: Object.assign(BurnsRig.npcSpec('burner', 32), { top: { kind: 'crop', col: '#ff6a1a' }, bottom: { kind: 'tutu', col: '#ff3b1a' }, coat: { kind: 'kimono', col: '#ffb02a', trim: '#ff3b1a' }, hair: { style: 'afro', col: '#ff5a1a', hi: '#ffd84a' }, face: 'lashes', acc: ['ledNecklace', 'bracelets'], key: 'w2:ember' }),
        lines: ['Fire is just light that got excited.', 'Come back when you need another smudge read, baby.'] });
      // the spinners: two rings turning opposite ways
      const rings = [{ r: 6.6, n: 7, om: 0.32 }, { r: 11.6, n: 10, om: -0.22 }];
      let si = 0;
      for (const rg of rings) for (let i = 0; i < rg.n; i++) {
        const kind = ['poi', 'staff', 'poi', 'fans'][si % 4];
        S.spinners.push(api.npc(BW.castDef('firespinner', 300 + si, { behavior: 'w2Spinner', name: 'FIRE SPINNER', cx, cz, ring: rg.r, omega: rg.om, phase: i / rg.n * TAU, kind, collide: false, chatter: true,
          chat: ['Spin it to win it!', 'Mind the poi, honey!', 'Fire is a love language.', 'I can\'t stop. I don\'t know how to stop.', 'Smells like eyebrows!'], x: cx + rg.r, z: cz })));
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
      api.trigger({ x: tx, z: tz, r: 9, once: true, onEnter: g2 => { if (g2.missions.state('tower') === 'available') { g2.missions.start('tower'); g2.banner('HIDDEN CHALLENGE', 'Lighthouse of Lost Souls: climb it!', { col: '#38f2ff' }); } } });
      api.pickup('photo', tx - 1.7, 14.5, tz + 0.6, { id: 'p1' });
    }
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
      api.pickup('photo', 104, 9.6, -97, { id: 'p3', hidden: true });
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
          if (st === 'available') g2.say(a, ['Welcome to Camp Combustion! This is Flame Alley. Eighteen poofers, one bell, twenty seconds.', 'The fire comes in waves. Run in the gaps. Ring the bell at the end. GO GO GO!'], () => g2.missions.start('alley'));
          else if (st === 'active') g2.say(a, ['Why are you talking to me?! RUN!']);
          else g2.say(a, ['You smell like a campfire and victory. Same thing out here.']);
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
          if (st === 'available') g2.say(a, ['A bike swarm came through. Forty bikes, zero brakes. My lights went EVERYWHERE.', 'Eight LED bike lights. Bring them back and I\'ll read anything you want. I read smudges in UV.', 'Swarms ride the B and C streets. If you hear bells, get off the road!'], () => g2.missions.start('lights'));
          else if (st === 'active') g2.say(a, [`${g2.missions.get('lights').n} of 8! Little blinky babies, come home!`]);
          else g2.say(a, ['Seven-thirty and E. Go home, sparkle. Go get your person.']);
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
        { id: 'lost3', name: 'MOONBEAM', type: 'furcoat', seed: 73, x: 30, z: -46, dest: [30, 152], addr: '7:00 & B', lines: ['Brother. Where is 4:30? I need to be at 4:30 at... 4:30.', 'Oh. Oh no. My camp is 7:00 & B. It always was. Walk me?'] }
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
      const capSpec = Object.assign(BurnsRig.npcSpec('dpw', 61), { top: { kind: 'button', col: '#4a5a3a' }, vest: 'hivis', led: '#e8ff5a', bottom: { kind: 'cargo', col: '#3a3a30' }, shoes: { kind: 'boots', col: '#1a1a14' }, hat: { kind: 'hardhat', col: '#ffd21a' }, glasses: 'clear', face: 'stern', acc: ['headset', 'toolbelt'], prop: 'clipboard', key: 'w2:captain' });
      const [cx, cz] = L(0.6, 1.8);
      S.captainDef = api.npc({ id: 'captain', name: 'CAPTAIN SAFETY THIRD', spec: capSpec, x: cx, z: cz, yaw, behavior: 'w2Captain', chatter: false,
        talk(g2, a) {
          const st = g2.missions.state('moop');
          const st2 = g2.missions.state('darkwads');
          if (st === 'available') BURNS_W2.captainLecture(g2, a);
          else if (st === 'active') g2.say(a, [`${g2.missions.get('moop').n} of 10 MOOP items. I counted. Twice. Then I laminated the count.`]);
          else if (st2 === 'available') g2.say(a, ['New assignment. DARKWADS. Unlit pedestrians. Zero lumens. Out on the far streets, walking around in BLACK.', 'You won\'t see them until you\'re face-first in one. Spin or stomp them and stick some glow on them. Four of them. Move out.'], () => g2.missions.start('darkwads'));
          else if (st2 === 'active') g2.say(a, [`${g2.missions.get('darkwads').n} of 4 darkwads illuminated. Your headlamp helps. You\'re welcome.`]);
          else g2.say(a, ['Headlamp: on. Hydration: up. Fun: ...I\'ll schedule some fun. Tuesday. Fourteen hundred hours.']);
        } });
      api.trigger({ x: qx, z: qz, r: 10, onEnter: g2 => { if (g2.missions.state('moop') === 'available' && !S.capMet && !g2.cine) BURNS_W2.captainLecture(g2, g2.actor('captain')); } });
      // MOOP: litter scattered around the Esplanade
      const MP = [[18, 104], [24, 106], [27, 118], [14, 117], [31, 108], [36, 118], [9, 106], [40, 112], [22, 128], [33, 130]];
      MP.forEach(([th, r], i) => { const [x, z] = W2.at(th, r); api.pickup('item:moop', x, 0.7, z, { mission: 'moop', gate: true, id: 'moop' + i }); });
      api.light(qx, qz, 12, '#f4f8ff', 0.4);
    }
    /* ---------------- a sparkle pony asking strangers for water ---------------- */
    {
      const [x, z] = at(-5, 112);
      const ponySpec = Object.assign(BurnsRig.npcSpec('sparklepony', 7), { coat: { kind: 'fur', col: '#ff3bd8', trim: '#7af2ff' }, top: { kind: 'crop', col: '#c8a0ff', pattern: 'sequin' }, bottom: { kind: 'shorts', col: '#1a1a24', pattern: 'sequin' }, shoes: { kind: 'furboots', col: '#ffffff' }, hair: { style: 'wig', col: '#7af2ff', hi: '#ffffff' }, glasses: 'heart', acc: ['wings', 'bracelets'], body: { h: 1.02, w: 0.86 }, key: 'w2:pony' });
      api.npc({ id: 'pony', name: 'GLITTERBOMB', spec: ponySpec, x, z, yaw: Math.PI * 0.9, behavior: 'wander', radius: 2.5,
        chat: ['Water? Anyone? I take payment in good vibes.', 'I brought three suitcases of costumes. And zero cups.', 'Is that a water bottle or are you just happy to see me?', 'Hydration is a social construct. Kidding. Please. Water.'],
        talk(g2, a) {
          if (a.w2paid) { g2.say(a, ['You\'re my favorite stranger. Today. So far.']); return; }
          if (g2.player.hydration < 3) { g2.say(a, ['Oh no, honey. You\'re thirstier than me. And I\'m a sparkle pony. Go to the pickle juice bar.']); return; }
          g2.say(a, ['Hi! I love your bun. Can I have some water? I brought three suitcases of faux fur and no cup.', '(You pour her a little of your water.)', 'Bless. Good vibes, transferred! Here, I found this in my fur coat. I don\'t know whose it is. Now it\'s yours.'], () => {
            a.w2paid = true; g2.player.hydration = Math.max(1, g2.player.hydration - 1); g2.toast('-1 HYDRATION · +GOOD VIBES'); g2.fx.hearts(a.x, a.y + 2, a.z, 12);
            g2.spawnPickup('water', a.x + 1, 0.9, a.z, { pop: true }); g2.player.givePower('molly'); burnsSfx('gift', null, 'pick');
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
      for (const [[x, z], i] of DRUNK) api.enemy({ type: R.pick(['burner', 'furcoat', 'crusty']), seed: 500 + i, name: 'CAMP NEIGHBOR', x, z, behavior: 'w2Drunk', hp: 1, drop: 3, afterDefeat: 'sleep', defeatLine: 'I love you, man... zzz', damage: 1 });
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
            else g2.say(a, ['The 7:00 lanterns burn for you tonight. Go home.']);
          } }));
      });
      api.sign('LAMPLIGHTERS\nGATHER HERE', ...at(28.5, 92), { h: 0.9, yaw: W2.outYaw(30) + Math.PI, style: { bg: '#f4ecd8', fg: '#5a3a1a', size: 22, border: '#c8a060' } });
    }
    /* ---------------- darkwads (no lights, nearly invisible) + the undercover cop ---------------- */
    {
      const DW = [[[-8, 186], [14, 186]], [[-22, 214], [-2, 214]], [[2, 162], [2, 196]], [[20, 222], [20, 240], [8, 240]], [[-28, 168], [-28, 194]]];
      DW.forEach((pts, i) => { const path = pts.map(([th, r]) => at(th, r)); api.npc(BW.castDef('darkwad', 600 + i, { name: 'DARKWAD', behavior: 'w234Darkwad', path, speed: 1.0 + i * 0.1, x: path[0][0], z: path[0][1], chatter: false, hittable: true, lines: ['Lights are for people who want to be seen. I want to be FELT.', 'Shh. I\'m blending in. With the night.'] })); });
      const [cx, cz] = at(2, 60);
      api.npc(BW.castDef('cop', 7, { id: 'cop', name: 'TOTALLY NORMAL BURNER', behavior: 'w234Cop', x: cx, z: cz, view: 15, fov: 1.0, chaseSpeed: 5.4, friendly: false, chatter: false }));
      api.npc(BW.castDef('cop', 8, { name: 'ALSO A NORMAL BURNER', behavior: 'w234Cop', x: at(24, 176)[0], z: at(24, 176)[1], view: 13, chaseSpeed: 5.2, friendly: false, chatter: false }));
    }
    /* ---------------- the art car parade (loop around Brady's block) ---------------- */
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
    /* ---------------- home: Camp Cozy Chaos at 7:30 & E + the Man ---------------- */
    {
      const [hx, hz] = CAMP, oy = W2.outYaw(45), fx = Math.sin(oy), fz = Math.cos(oy), rx = Math.cos(oy), rz = -Math.sin(oy);
      const L = (a, b) => [hx + rx * a + fx * b, hz + rz * a + fz * b];
      // cover: the camp RV, a dome, porta-potties, a shade and a stack of bins
      { const [x, z] = L(-13, 4); api.prop('rv', { x, z, yaw: oy + Math.PI / 2 + 0.1, seed: 902, col: '#f0e6d4' }); }
      { const [x, z] = L(13, 6); api.prop('dome', { x, z, r: 5, col: '#e8d8f8', alt: '#c0a8e8', lights: true, glow: '#ff4fd8' }); }
      { const [x, z] = L(-6, -9); api.prop('portapotty', { x, z, yaw: oy, col: '#2a6ac8' }); const [x2, z2] = L(-4.7, -9); api.prop('portapotty', { x: x2, z: z2, yaw: oy, col: '#3a8a3a' }); }
      { const [x, z] = L(7, -8); api.roundBox(x, 0, z, 2.2, 1.6, 1.4, '#4a6a8a', { yaw: oy, r: 0.25, col: { cover: true } }); }
      { const [x, z] = L(-1, 13); api.prop('shade', { x, z, w: 7, d: 5, col: '#ffcfa0' }); }
      { const [x, z] = L(1, 11); api.prop('couch', { x, z, yaw: oy + Math.PI, col: '#8a2a5a' }); }
      { const [x, z] = L(-14, -4); api.sign('CAMP COZY\nCHAOS', x, z, { h: 1.3, yaw: oy + Math.PI, style: { bg: '#1a0a2a', fg: '#ffe24a', glow: '#ff9a2a', size: 30, border: '#ffe24a' }, glow: '#ffe24a' }); }
      api.light(hx, hz, 22, '#ff70c0', 0.35); api.light(hx, hz, 10, '#ffd890', 0.3);
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; api.glow(hx + Math.sin(a) * 20, 2.6, hz + Math.cos(a) * 20, 0.7, BURNS_NEON[i % 7], { blink: 2 }); }
      { const [x, z] = L(0, -16); api.checkpoint('cp_camp', x, z, { yaw: oy + Math.PI, name: 'Camp Cozy Chaos' }); }
      for (const [a, b] of [[-9, 2], [9, 2]]) { const [x, z] = L(a, b); api.pickup('water', x, 0.9, z); }
      api.marker('home', hx, hz, 'Home?', { col: '#ffe24a' });
      api.region('home', hx, hz, 22);
      const man = new BurnsManBoss(g, { x: W2.MAN[0], z: W2.MAN[1], yaw: oy + Math.PI, scale: 0.88, hp: 4, name: 'THE MAN', title: 'Lovesick Effigy · Rematch',
        attacks: ['stomp', 'swipe', 'fire', 'flash'], stun: 5, arena: { x: hx, z: hz, r: 22 }, flashCharge: 2.4, flashDamage: 2,
        phases: [{ hp: 1, attacks: ['stomp', 'swipe'], combo: 2, rate: 1.05 }, { hp: 0.75, attacks: ['swipe', 'fire'], combo: 3, rate: 1.1 }, { hp: 0.5, attacks: ['fire', 'stomp', 'flash'], combo: 3, rate: 1.2 }, { hp: 0.25, attacks: ['fire', 'swipe', 'flash', 'stomp'], combo: 3, rate: 1.3 }],
        stunLine: 'I... made us... a mixtape...',
        onPhase(g2, b, i) { g2.banner(['', 'HE BROUGHT FIRE', 'HE\'S GLOWING', 'HE\'S FURIOUS'][i], ['', 'Fireballs roll and leave flames: keep moving!', 'NEON FLASH: hide behind the RV, the dome or the porta-potties!', 'Everything at once. You got this.'][i], { col: '#ff4fd8' }); },
        onDefeat(g2) { BURNS_W2.bossDefeated(g2); } });
      man.hidden = true; man.showChinka = true;
      g.addBoss(man); S.man = man;
      api.trigger({ x: hx, z: hz, r: 19, onEnter: g2 => BURNS_W2.homeEnter(g2) });
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
    const S = BURNS_W2.state, BW = BURNS_W234;
    BURNS_W2.updateNote(g);
    if (g.missions.isDone('lost')) for (const L of S.lost) { const a = g.actor(L.id); if (a) { a.w2home = true; a.x = L.dx; a.z = L.dz; a.setBehavior('dance'); a.home = { x: a.x, z: a.z, y: 0, yaw: 0 }; } }
    BW.wireGear(g);
    if (g.missions.isDone('darkwads')) for (const a of g.actors) if (a.behName === 'w234Darkwad') a.w234lit = true;
    const cap = g.actor('captain'); if (cap) BW.attach(cap, BW.attModel('respirator', m => BW.gear.respirator(m)), BURNS_BONES.HEAD);
    BW.attach(g.player, BW.attModel('headlamp', m => BW.gear.headlamp(m)), BURNS_BONES.HEAD, () => S.headlamp);
    S.headlamp = g.missions.isDone('moop');
    if (g.missions.isDone('lanterns')) for (const L of S.lamps) { L.lit = true; L.gl.c = L.gl.c0; }
    if (g.missions.isDone('alley')) { S.alleyDoor.off = true; }
    if (g.missions.isDone('camp')) { S.man.hidden = true; S.bossStarted = true; }
    g.tod = Math.min(0.9, BurnsSave.tokenCount(2) * 0.15);
    if (!S.introDone) BURNS_W2.intro(g);
    else g.banner('FINDING CAMP', 'Your note says ' + BURNS_W2.NOTE[BURNS_W2.clues(g)] + '. Read the signs.', { col: '#ff4fd8' });
  },
  onRespawn(g) {
    const S = BURNS_W2.state;
    for (const a of S.followers || []) { const ac = g.actor(a); if (ac && ac.behName === 'follow') { ac.x = g.player.x + 1.5; ac.z = g.player.z + 1; } }
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
    if (S.headlamp && !p.dead) g.pointLight(p.x + Math.sin(p.yaw) * 2.2, p.y + 1.9, p.z + Math.cos(p.yaw) * 2.2, 9, [1, 0.95, 0.82], 1.0);
  },
  update(g, dt) {
    const S = BURNS_W2.state, W2 = BURNS_W2, p = g.player;
    BURNS_W234.update(g, dt);
    g.w234lamp = !!S.headlamp;
    if (!S.spinnerActors) S.spinnerActors = g.actors.filter(a => a.behName === 'w2Spinner');
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
    if (S.frozenT > 0) { S.frozenT -= dt; p.animOverride = 'idle'; if (S.frozenT <= 0 && S.frozeByMe) { S.frozeByMe = false; p.locked = false; p.animOverride = null; } }
    if (S.lampWalk) BURNS_W2.lampStep(g, dt);
    // the parade parks for the fight
    if (S.parade) S.parade.stopped = !!(S.bossStarted && !g.missions.isDone('camp'));
    // tokens push the night deeper
    const want = Math.min(1, BurnsSave.tokenCount(2) * 0.15 + (S.bossStarted && !g.missions.isDone('camp') ? 1 : 0));
    if (g.tod < want && g.todTarget === null) g.setTod(want, 0.03);
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
    // teapot steam + jellyfish glow from the parade
    if (S.parade && Math.random() < 0.35) for (const c of S.parade.cars) { if (c.i % 6 === 1) { const d2 = (c.mv.x - cam.x) * (c.mv.x - cam.x) + (c.mv.z - cam.z) * (c.mv.z - cam.z); if (d2 < 60 * 60) g.fx.smoke(c.mv.x + Math.sin(c.mv.yaw) * 2.9, 3.4, c.mv.z + Math.cos(c.mv.yaw) * 2.9, 1, '#f4f0ff'); } }
    void t;
  }
});

/* ---------------- the note ---------------- */
BURNS_W2.updateNote = function (g) {
  const W2 = BURNS_W2, n = W2.clues(g), note = W2.NOTE[n];
  const m = g.missions.get('note'); if (m) { m.def.short = 'Find camp: ' + note; m.def.name = 'The Crumpled Note: ' + note; }
  const c = g.missions.get('camp'); if (c) c.def.short = n >= 3 ? 'Go home: 7:30 & E (cross the parade!)' : 'Find camp: ' + note;
  return note;
};
BURNS_W2.clue = function (g, n, who, lines) {
  const note = BURNS_W2.updateNote(g);
  const a = g.actors.find(x => x.name === who);
  g.say(a || { name: who, model: null }, lines, () => {
    g.banner('THE NOTE', note, { col: '#ffe24a', big: true, dur: 3.2 });
    burnsSfx('map_open', null, 'secret');
    if (BURNS_W2.clues(g) >= 3) g.say('brady', ['Seven-thirty and E. Camp Cozy Chaos. Chinka, I\'m coming home.']);
  });
};

BURNS_W2.lampStart = function (g) {
  const S = BURNS_W2.state; S.lampWalk = { i: 0, far: 0 };
  ['wick', 'lamp1', 'lamp2'].forEach(id => { const a = g.actor(id); if (a) { a.w2start = a.w2start || { x: a.x, z: a.z }; a.setBehavior('idle'); } });
  g.banner('LIGHT THE WAY', 'Walk with the lamplighters. Stay in their light.', { col: '#ffcf7a' });
};
BURNS_W2.lampStep = function (g, dt) {
  const S = BURNS_W2.state, W = S.lampWalk, R = S.lampRoute, p = g.player, lead = g.actor('wick');
  if (!lead) return;
  const t = R[Math.min(W.i, R.length - 1)], d = lead.moveTo(t[0], t[1], 1.25, dt, 0.4);
  lead.ch.play('walk', { rate: 0.75 });
  if (d < 0.6 && W.i < R.length - 1) W.i++;
  ['lamp1', 'lamp2'].forEach((id, k) => { const a = g.actor(id); if (!a) return; const bx = lead.x - Math.sin(lead.yaw) * (2 + k * 1.8) + Math.cos(lead.yaw) * (k ? 1 : -1), bz = lead.z - Math.cos(lead.yaw) * (2 + k * 1.8) - Math.sin(lead.yaw) * (k ? 1 : -1); const dd = a.moveTo(bx, bz, 1.6, dt, 0.3); a.ch.play(dd > 0.5 ? 'walk' : 'idle', { rate: 0.75 }); });
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
  ['wick', 'lamp1', 'lamp2'].forEach(id => { const a = g.actor(id); if (a && a.w2start) { a.x = a.w2start.x; a.z = a.w2start.z; a.vx = a.vz = 0; } });
};
BURNS_W2.lampDone = function (g) {
  const S = BURNS_W2.state; S.lampWalk = null;
  for (const L of S.lamps) { L.lit = true; L.gl.c = L.gl.c0; }
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
  const crowd = (a, b, n, beh) => { if (!allowNpc || r() > 0.55) return; const [cx, cz] = L(a, b); for (let i = 0; i < n; i++) { const t = r() * TAU, d = r() * 1.8; api.npc({ type: r.pick(['burner', 'burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'crusty']), seed: Math.floor(r() * 1e6), x: cx + Math.cos(t) * d, z: cz + Math.sin(t) * d, yaw: r() * TAU, behavior: beh || r.pick(['dance', 'idle', 'dance', 'sit', 'wander']), style: Math.floor(r() * 6), radius: 3, ambient: true }); npcs++; } };
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
  const a = g.actor('sparky'); if (a) a.say('DING DING! LEGEND! The back door\'s open!', 3);
};
BURNS_W2.lostHome = function (g, a, L) {
  if (a.w2home) return;
  a.w2home = true; a.x = L.dx; a.z = L.dz; a.setBehavior('dance'); a.home = { x: a.x, z: a.z, y: a.y, yaw: a.yaw };
  a.say(['HOME! It was here the whole time!', 'My avocado! I\'d know that inflatable anywhere!', 'This is it! I can feel it in my sequins!'][BURNS_W2.state.lost.indexOf(L) % 3], 3);
  g.fx.confetti(a.x, a.y + 2, a.z, 20); g.glow += 5; g.toast('+5 GLOW STICKS · ' + L.addr);
  burnsSfx('crowd_cheer', { vol: 0.5 });
  if (g.missions.state('lost') === 'active') g.missions.progress('lost', 1);
};
BURNS_W2.homeEnter = function (g) {
  const S = BURNS_W2.state;
  if (S.bossStarted || g.missions.isDone('camp')) return;
  if (g.missions.state('camp') !== 'active') {
    if (g.time - S.warned > 12) { S.warned = g.time; g.playerBubble('Is this our camp? The note\'s too smudged. I need more clues.', 3); }
    return;
  }
  BURNS_W2.bossIntro(g);
};

/* ---------------- intro ---------------- */
BURNS_W2.intro = function (g) {
  const S = BURNS_W2.state, p = g.player, sp = { x: 80, z: -62 };
  p.locked = true;
  g.cutscene([
    { cam: { x: 40, y: 48, z: 60, tx: 80, ty: 0, tz: -60, fov: 0.95 } },
    { banner: ['WORLD 2', 'FINDING CAMP · THE CITY AT NIGHT', { col: '#ff4fd8', big: true, dur: 3 }] },
    { cam: { from: { x: 40, y: 48, z: 60, tx: 80, ty: 0, tz: -60, fov: 0.95 }, to: { x: 86, y: 3.2, z: -52, tx: 80, ty: 1.6, tz: -62, fov: 0.8 }, dur: 4.2 } },
    { say: ['brady', ['Rule number one on the playa: if you get separated, meet at camp.', 'Chinka wrote our address on a napkin. Our camp is at...']] },
    { do: g2 => { g2.banner('THE NOTE', '?:?? & ?', { col: '#ffe24a', big: true, dur: 3 }); burnsSfx('map_open', null, 'secret'); } },
    { say: ['brady', ['...Somebody gifted me a margarita. Onto the napkin.', 'Question-mark o\'clock and question-mark street. Great.']] },
    { cam: { x: 84, y: 2.4, z: -56, tx: 89.5, ty: 1.6, tz: -58.4, fov: 0.8 } },
    { say: [g.actor('sage'), ['Psst. First night? Lost? I\'m a Ranger. Not a cop. Come talk to me, I\'ll teach you to read this city.']] },
    { do: g2 => { BurnsSave.flag(2, 'intro', true); S.introDone = true; p.locked = false; p.teleport(sp.x, 0, sp.z, 0.4); g2.camYaw = 0.4; g2.snapCam = true; } },
    { banner: ['FIND YOUR CAMP', 'Three clues fill in the note. Read the street signs.', { col: '#ffd84a' }] }
  ], null);
};

/* ---------------- boss: the Man at camp ---------------- */
BURNS_W2.bossIntro = function (g) {
  const S = BURNS_W2.state, man = S.man, p = g.player, [hx, hz] = BURNS_W2.CAMP, oy = BURNS_W2.outYaw(45);
  if (S.bossStarted) return; S.bossStarted = true;
  const c1 = { x: hx - Math.sin(oy) * 6, y: 2.2, z: hz - Math.cos(oy) * 6, tx: hx, ty: 2, tz: hz, fov: 0.85 };
  const c2 = { x: hx - Math.sin(oy) * 12 + Math.cos(oy) * 6, y: 4, z: hz - Math.cos(oy) * 12 - Math.sin(oy) * 6, tx: man.x, ty: 9, tz: man.z, fov: 0.92 };
  g.cutscene([
    { music: 'man_boss' },
    { cam: c1 },
    { say: ['brady', ['Camp Cozy Chaos! The couch! The crooked shade! We\'re HOME!', 'Chinka? Babe? Honey? ...Why is it so quiet?']] },
    { do: g2 => { man.hidden = false; man.showChinka = true; man.setState('idle'); g2.shake(0.7); burnsSfx('man_stomp'); burnsSfx('man_roar', { pitch: 0.8 }); } },
    { cam: { from: c1, to: c2, dur: 2.4 } },
    { banner: ['THE MAN', 'Lovesick Effigy · Rematch', { col: '#ff4fd8', big: true, dur: 3 }] },
    { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['BRADY! He\'s been sitting in our camp for an HOUR. He ate all the trail mix. Even the raisins!']] },
    { say: ['man', ['I KNEW YOU WOULD COME HOME, BUN BOY. I READ YOUR NAPKIN TOO.', 'I BROUGHT FIRE THIS TIME. LOVE IS A FIRE. I AM ALSO WOOD. THIS IS A PROBLEM.']] },
    { say: ['brady', ['Put her down and step away from my couch!']] },
    { do: g2 => { p.teleport(hx - Math.sin(oy) * 12, 0, hz - Math.cos(oy) * 12, oy); g2.camYaw = oy; g2.snapCam = true; g2.boss = man; man.start(); g2.banner('FIGHT!', 'Jump the shockwaves and whips · dodge the fireballs · hide from the flash · bonk his head!', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W2.bossDefeated = function (g) {
  const S = BURNS_W2.state, man = S.man, p = g.player, [hx, hz] = BURNS_W2.CAMP, oy = BURNS_W2.outYaw(45);
  g.missions.complete('camp');
  g.missions.complete('note');
  BURNS_W234.timer(1.4, () => {
    const c1 = { x: hx - Math.sin(oy) * 8 + Math.cos(oy) * 7, y: 3.5, z: hz - Math.cos(oy) * 8 - Math.sin(oy) * 7, tx: man.x, ty: 6, tz: man.z, fov: 0.9 };
    g.cutscene([
      { music: 'burns_victory' },
      { cam: c1 },
      { say: ['man', ['MY LOGS... MY BEAUTIFUL LOGS...', 'YOU WIN THIS CAMP, SMALL MAN. BUT I WILL SEE YOU COMING. I KNOW YOUR FACE. I KNOW YOUR BUN.']] },
      { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['Brady! He knows what you look like! Get a disguise! And something faster than your legs!']] },
      { do: g2 => { man.defeated = false; man.active = false; man.setState('flee'); burnsSfx('man_roar'); g2.shake(0.5); S.fleeT = 0; } },
      { cam: { from: c1, to: { x: hx, y: 6, z: hz, tx: man.x + Math.sin(oy) * 60, ty: 25, tz: man.z + Math.cos(oy) * 60, fov: 0.95 }, dur: 3.2 } },
      { until: g2 => { S.fleeT += 1 / 120; man.y += (3 + S.fleeT * 9) / 120; man.x += Math.sin(oy) * (6 + S.fleeT * 12) / 120; man.z += Math.cos(oy) * (6 + S.fleeT * 12) / 120; for (let i = 0; i < 2; i++) { const f = man.foot(i ? 1 : -1); g2.fx.fire(f[0], f[1] - 0.5, f[2], 2.4); } if (Math.random() < 0.1) burnsSfx('flame_jet', { vol: 0.6 }); return S.fleeT > 3.2; } },
      { do: g2 => { man.hidden = true; man.y = 0; } },
      { cam: { x: hx - Math.sin(oy) * 4, y: 2, z: hz - Math.cos(oy) * 4, tx: hx, ty: 1.4, tz: hz, fov: 0.8 } },
      { say: ['brady', ['A disguise. And wheels.', 'Okay, playa. Dress me up and give me a bike.']] },
      { do: g2 => { p.victoryT = 3; burnsSfx('crowd_cheer'); } },
      { wait: 1.0 }
    ], g2 => g2.finishWorld());
  });
};
