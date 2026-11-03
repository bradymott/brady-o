/* ============================================================
   BRADY GOES TO BURNING MAN — World 4: THE ORGY DOME (Tuesday night, velvet fog)
   Comedy, not explicit: everybody keeps their clothes on, the jokes
   are about consent, cuddle etiquette and terrible pickup lines.
   An informant ("Agent Velour") knows where the Man keeps Chinka.
   Missions (Burn Tokens):
     consent  Consent Is Sexy      the Consent Crew's quiz at the velvet rope
     goggles  Lost & Found         8 lost goggles for Lost & Found Lou
     creep    Creep Week           reach the cuddle puddle unseen by the creepy dudes (stealth)
     escort   The Informant        walk Agent Velour to the Quiet Lounge without a creep hugging him
     summit   Top of the Dome      hidden climb up the big pink dome to the neon heart
     boss     The Velvet Creeper   boss inside the big dome; then Velour's clue (Costco Soul Trading Co.)
   Also: the Ego-Death Healer's eye-gazing (mash to break eye contact), darkwads in the
   dim lounges, and an undercover cop failing to blend in at the rope.
   ============================================================ */

const BURNS_W4 = {
  ROPE: { x: 0, z: 66 }, PUDDLE: { x: -34, z: -14 }, LOUNGE: { x: 52, z: 8 }, DOME: { x: 22, z: -62, r: 24, h: 17 }, LOST: { x: -16, z: 52 },
  QUIZ: [
    { q: 'Someone in a fur coat asks if you want to join their cuddle puddle. You\'d rather not. You say...', a: ['A: No thanks!', 'B: Maybe later... (then hide forever)', 'C: *silently moonwalk away*'], ok: 0,
      why: ['A clear "no thanks" is a complete sentence. Gold star!', '"Maybe" isn\'t a yes OR a no. Be clear, sweetie.', 'Iconic moonwalk. But use your words.'] },
    { q: 'Somebody\'s wearing a VERY tiny, very sparkly costume. Does a tiny costume mean they want a hug?', a: ['A: Obviously, yes', 'B: No. Outfits aren\'t invitations.', 'C: Only if the costume has a sign'], ok: 1,
      why: ['Nope! A costume is a costume.', 'Correct! An outfit is an outfit, not an invitation.', 'Ha. Even with a sign: ask first.'] },
    { q: 'What\'s the magic word before you join a cuddle puddle?', a: ['A: CANNONBALL!', 'B: Hug attack!', 'C: Ask first.'], ok: 2,
      why: ['Cannonball is for pools. And it\'s a no.', 'That\'s an ATTACK. We don\'t do attacks. We do asks.', 'ASK FIRST! You are a Consent Champion!'] }
  ],
  LINES: ['Are you a campfire? \'Cause you\'re hot and I want s\'more.', 'Is your name Wi-Fi? I\'m feeling a connection.', 'Did it hurt when you fell off the art car?', 'You must be playa dust. You\'re in EVERYTHING.', 'Do you believe in love at first burn?', 'Are you a water bottle? I\'m SO thirsty for... hydration.', 'Nice goggles. Are those prescription? For my HEART?'],
  state: null
};

BurnsWorlds.register({
  id: 4, name: 'The Orgy Dome', sub: 'Meet the informant. Keep your pants on.',
  sky: Object.assign({}, BURNS_PALETTES.night, { zen: '#120418', hor: '#5a1636', mid: '#2a0a2c', midK: 0.42, fog: '#3a1028', fogD: 0.0128, haze: 0.62, moon: [250, 18], moonK: 0.8, stars: 0.75, mtnCol: '#1a0612', city: [160, 0], cityCol: '#ff3b8a', cityK: 0.75, sky: '#5a3a6a', gnd: '#3a2030', key: '#d890b0', keyK: 0.42, emB: 1.85, rim: '#ff6ab0', clouds: 0.22, cloudCol: '#3a1430' }),
  sky2: Object.assign({}, BURNS_PALETTES.night, { zen: '#160310', hor: '#7a1a3a', mid: '#3a0a24', midK: 0.5, fog: '#4a1024', fogD: 0.0145, haze: 0.66, moon: [262, 12], moonK: 0.7, stars: 0.6, mtnCol: '#1e0610', city: [160, 0], cityCol: '#ff2a5a', cityK: 0.85, sky: '#6a3050', gnd: '#401828', key: '#ff90a8', keyK: 0.42, emB: 1.95, rim: '#ff4a7a', clouds: 0.25, cloudCol: '#4a1428' }),
  tod: 0,
  music: 'burns_w4',
  bounds: [-112, -112, 112, 108],
  spawn: { x: 0, y: 0, z: 96, yaw: Math.PI },
  ground: { base: '#a88070', crack: 0.22, mottle: 0.45, res: 0.5 },
  dust: 0.7,
  missions: [
    { id: 'consent', name: 'Consent Is Sexy', type: 'custom', giver: 'kai', start: 'manual', short: 'Answer the Consent Crew\'s quiz at the podiums', marker: { x: 0, z: 66 },
      desc: 'Nobody gets past the velvet rope without passing the Consent Crew\'s quiz. Walk to podium A, B or C and press ANSWER.', hint: 'The velvet rope at the district entrance',
      onStart(g) { BURNS_W4.quizAsk(g, 0); } },
    { id: 'goggles', name: 'Lost & Found', type: 'collect', count: 8, requires: ['consent'], giver: 'lou', start: 'manual', progressLabel: 'Goggles', short: 'Find 8 lost pairs of goggles', marker: { x: -16, z: 52 },
      desc: 'Lost & Found Lou has a lot of lost & not-found. Eight pairs of goggles went missing in the lounges, on domes and in the cuddle puddle.', hint: 'Lost & Found booth, just inside the rope',
      onStart(g) { for (const P of g.pickups.items) if (P.mission === 'goggles') P.label = 'GOGGLES'; } },
    { id: 'creep', name: 'Creep Week', type: 'stealth', requires: ['consent'], giver: 'kai', start: 'manual', short: 'Reach the cuddle puddle unseen', marker: { x: -34, z: -14 },
      target: { x: -34, z: -2, r: 5 }, desc: 'The informant is in the cuddle puddle. Getting there means Lounge Row: creepy dudes in fur coats with vision cones. If one spots you, he WILL offer you a hug.', hint: 'Lounge Row, north of the rope, out to the cuddle puddle',
      onStart(g) { BURNS_W4.creepStart(g); }, onFail(g) { BURNS_W4.creepReset(g); } },
    { id: 'escort', name: 'The Informant', type: 'escort', requires: ['creep'], giver: 'velour', start: 'manual', companion: 'velour', short: 'Walk Agent Velour to the Quiet Lounge', marker: { x: 52, z: 8 },
      target: { x: 52, z: 8, r: 4.5 }, desc: 'Agent Velour will only talk somewhere quiet. Walk him to the Quiet Lounge, and don\'t let a creep get close enough to hug him.', hint: 'From the cuddle puddle east to the Quiet Lounge',
      onStart(g) { BURNS_W4.escortStart(g); }, onFail(g) { BURNS_W4.escortReset(g); }, onComplete(g) { BURNS_W4.velourTalks(g); } },
    { id: 'summit', name: 'Top of the Dome', type: 'climb', start: 'trigger', secret: true, short: 'Climb to the neon heart', target: { x: 22, z: -62, r: 3.4, y: 17.0 }, tokenAt: { x: 23.2, y: 18.6, z: -62 },
      desc: 'Somebody built a spiral of glowing pads up the big pink dome. At the top: a giant neon heart. Obviously.', hint: 'Around the outside of the big pink dome' },
    { id: 'boss', name: 'The Velvet Creeper', type: 'boss', requires: ['escort'], start: 'manual', tokenDirect: true, short: 'Defeat the Velvet Creeper!', marker: { x: 22, z: -62 },
      desc: 'The Velvet Creeper boa-lassoed your informant into the big pink dome. Dodge his lasso, pop his pickup lines, and bonk him while he\'s tangled.', hint: 'Inside the big pink dome', lockedDesc: 'Find the informant first.' }
  ],
  build(api, g) {
    const W4 = BURNS_W4, R = api.rng, BW = BURNS_W234;
    BW.reset(g);
    W4.state = { introDone: !!BurnsSave.flag(4, 'intro'), lines: [], quiz: -1 };
    const S = W4.state, D = W4.DOME;
    /* ---------------- ground ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 200; i++) { const x = R.range(-115, 115), z = R.range(-115, 110), [px, pz] = P(x, z), r = R.range(2, 10) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); gg.addColorStop(0, R() < 0.5 ? 'rgba(110,60,70,0.22)' : 'rgba(220,180,170,0.2)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      // the red carpet through the rope
      const [ax, az] = P(-1.4, 104), [bx, bz] = P(1.4, 52); c.fillStyle = 'rgba(160,20,50,0.85)'; c.fillRect(ax, bz, bx - ax, az - bz);
      c.strokeStyle = 'rgba(255,200,80,0.6)'; c.lineWidth = 0.15 * sc; c.strokeRect(ax, bz, bx - ax, az - bz);
      // a soft pink glow pad under the big dome
      const [dx, dz] = P(D.x, D.z), g1 = c.createRadialGradient(dx, dz, 0, dx, dz, D.r * sc); g1.addColorStop(0, 'rgba(255,120,180,0.35)'); g1.addColorStop(1, 'rgba(255,120,180,0.05)'); c.fillStyle = g1; c.beginPath(); c.arc(dx, dz, D.r * sc, 0, TAU); c.fill();
      // pathways between lounges
      c.strokeStyle = 'rgba(200,150,140,0.25)'; c.lineWidth = 4 * sc; c.lineCap = 'round';
      const path = [[0, 52], [-6, 30], [-20, 10], [-34, -6]], path2 = [[-30, -10], [0, 0], [30, 6], [52, 8]], path3 = [[30, 6], [24, -36]];
      for (const pa of [path, path2, path3]) { c.beginPath(); pa.forEach(([x, z], i) => { const [px, pz] = P(x, z); i ? c.lineTo(px, pz) : c.moveTo(px, pz); }); c.stroke(); }
    });
    /* ---------------- the velvet rope + the Consent Crew + quiz podiums ---------------- */
    W4.buildRope(api, g);
    /* ---------------- the district: domes and lounges ---------------- */
    W4.buildDistrict(api, g);
    /* ---------------- the cuddle puddle + Agent Velour ---------------- */
    W4.buildPuddle(api, g);
    /* ---------------- the Quiet Lounge ---------------- */
    {
      const { x, z } = W4.LOUNGE;
      api.mesh(x, z, m => {
        m.color('#3a2a3a'); BW.post(m, 0, 0, 0, 0.1, 3.4);
        m.color('#7a5aa8'); BW.lathe(m, 0, 2.8, 0, [[0.1, 1.0], [4.2, 0], [4.2, 0], [4.0, 0.1], [0.2, 1.05], [0, 1.1]], { seg: 18 });
        const cols = [{ t: 'cyl', x: 0, z: 0, r: 0.14, y0: 0, y1: 3.8, camPass: true }];
        for (let i = 0; i < 5; i++) { const a = i / 5 * TAU, bx = Math.sin(a) * 2.6, bz = Math.cos(a) * 2.6; m.color(['#c8a0ff', '#9adcff', '#ffb0d8', '#a0ffd0', '#ffe28a'][i]); BW.egg(m, bx, 0.35, bz, 0.7, 0.4, 0.7, { seg: 10, rings: 6 }); cols.push({ t: 'cyl', x: bx, z: bz, r: 0.6, y0: 0, y1: 0.6 }); }
        m.color('#fff4d8', 0.8); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; BW.ball(m, Math.sin(a) * 3.8, 2.7, Math.cos(a) * 3.8, 0.13, { seg: 8, rings: 5 }); } m.emissive(0);
        return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#b08aff', pool: 9 }, { x: 0, y: 2.7, z: 3.8, s: 0.6, c: '#fff4d8' }] };
      });
      api.sign('QUIET LOUNGE\nSHHHHHH', x + 5, z + 3, { h: 0.9, yaw: -0.7, style: { bg: '#2a1a3a', fg: '#e0d0ff', size: 22, border: '#b08aff' } });
      api.checkpoint('cp_lounge', x - 6, z + 4, { yaw: -Math.PI / 2, name: 'Quiet Lounge' });
    }
    /* ---------------- the big pink dome (enterable) + the summit spiral ---------------- */
    W4.buildDome(api, g);
    /* ---------------- glow sticks + ground score ---------------- */
    api.glowLine(0, 100, 0, 76, 8, 0.9); api.glowLine(-4, 46, -20, 12, 9); api.glowLine(-24, -4, 40, 6, 12); api.glowLine(30, 0, 24, -32, 7);
    api.glowRing(W4.PUDDLE.x, W4.PUDDLE.z, 11, 14); api.glowRing(W4.LOUNGE.x, W4.LOUNGE.z, 6, 10);
    api.glowsticks([[-60, 40], [-70, 30], [-80, 20], [60, 50], [70, 40], [80, 30], [-60, -60], [-70, -70], [-50, -80], [60, -30], [70, -40], [80, -50], [-90, 80], [90, 80]]);
    api.pickup('bag:molly', -48, 0.9, 30); api.pickup('bag:weed', 66, 0.9, 40); api.pickup('bag:powder', -70, 0.9, -50); api.pickup('bag:khole', 60, 0.9, -46); api.pickup('bag:shrooms', -8, 0.9, 20);
    for (const [x, z] of [[8, 60], [-30, 30], [40, 30], [-50, -30], [56, -10], [0, -20]]) api.pickup('water', x, 0.9, z);
    // LSD-only: a ladder of floating heart pads over Lounge Row to a photo
    api.pickup('bag:lsd', 78, 0.9, 64);
    api.hidden(() => { for (let i = 0; i < 6; i++) api.mesh(70 - i * 3.2, 56 - i * 2.4, m => { m.color(burnsHSL(330 + i * 12, 0.9, 0.62), 0.6); BW.heart(m, 0, 0.35, 0, 2.2, { depth: 0.3 }); m.emissive(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.0, hz: 0.6, y0: 0, y1: 0.6 }] }; }, { y: 1.0 + i * 1.3 }); });
    api.pickup('photo', 70 - 5 * 3.2, 8.4, 56 - 5 * 2.4, { id: 'p3', hidden: true });
    api.marker('rope', 0, 66, 'Velvet Rope', { col: '#ff3b5c' });
    api.marker('puddle', W4.PUDDLE.x, W4.PUDDLE.z, 'Cuddle Puddle', { col: '#ff9ad8' });
    api.marker('dome', D.x, D.z, 'The Dome', { col: '#ff4fd8' });
    api.checkpoint('cp_start', 6, 92, { yaw: Math.PI, name: 'Red Carpet' });
  },
  onStart(g) {
    const S = BURNS_W4.state, BW = BURNS_W234;
    BW.wireGear(g);
    BURNS_W4.wire(g);
    g.tod = Math.min(0.85, BurnsSave.tokenCount(4) * 0.14);
    if (!S.introDone) BURNS_W4.intro(g);
    else g.banner('THE ORGY DOME', 'Find the informant. Keep your pants on.', { col: '#ff3b5c' });
  },
  onRespawn(g) { const S = BURNS_W4.state; BURNS_W4.unroot(g); if (S.pull) { S.pull = null; g.player.locked = false; } },
  env(g, env) {
    const S = BURNS_W4.state, p = g.player, D = BURNS_W4.DOME;
    // inside the big dome: thick rosy haze
    const k = clamp(1 - (Math.hypot(p.x - D.x, p.z - D.z) - D.r + 4) / 6, 0, 1);
    if (k > 0) { env.fogD += 0.012 * k; env.fogCol = [lerp(env.fogCol[0], 0.55, k * 0.6), lerp(env.fogCol[1], 0.12, k * 0.6), lerp(env.fogCol[2], 0.3, k * 0.6)]; }
    // the cuddle puddle's red glow
    const kp = clamp(1 - Math.hypot(p.x - BURNS_W4.PUDDLE.x, p.z - BURNS_W4.PUDDLE.z) / 18, 0, 1);
    if (kp > 0) { env.fogD += 0.008 * kp; g.pointLight(BURNS_W4.PUDDLE.x, 2.5, BURNS_W4.PUDDLE.z, 12, [1, 0.25, 0.35], 1.2); }
    if (S.discoT !== undefined && k > 0.3) g.pointLight(D.x, 9, D.z, 22, [1, 0.5, 0.85], 1.2);
  },
  update(g, dt) {
    const S = BURNS_W4.state, W4 = BURNS_W4, p = g.player;
    BURNS_W234.update(g, dt);
    S.discoT = (S.discoT || 0) + dt;
    W4.gazeStep(g, dt);
    W4.linesStep(g, dt);
    if (S.velvet) W4.velvetStep(g, dt);
    if (S.pull) W4.pullStep(g, dt);
    if (g.missions.state('escort') === 'active') W4.escortStep(g, dt);
    // fog drifts out of the cuddle puddle
    if (Math.hypot(p.x - W4.PUDDLE.x, p.z - W4.PUDDLE.z) < 40) { S.fogT = (S.fogT || 0) - dt; if (S.fogT <= 0) { S.fogT = 0.12; g.fx.smoke(W4.PUDDLE.x + (Math.random() - 0.5) * 12, 0.4, W4.PUDDLE.z + (Math.random() - 0.5) * 12, 1, '#ff9ab8'); } }
    const want = Math.min(1, BurnsSave.tokenCount(4) * 0.14);
    if (g.tod < want && g.todTarget === null) g.setTod(want, 0.03);
  },
  drawSkinned(g, R) { BURNS_W234.drawSkinned(g, R); },
  drawSprites(g, R) {
    const S = BURNS_W4.state, SP = BURNS_SPRITES.R, cam = g.cam, t = g.time, D = BURNS_W4.DOME, p = g.player;
    // creeps' vision cones
    for (const a of S.creeps || []) {
      if (a.defeated || a.hidden) continue;
      const d2 = (a.x - cam.x) * (a.x - cam.x) + (a.z - cam.z) * (a.z - cam.z); if (d2 > 55 * 55) continue;
      const L = a.def.view || 9, w = 2 * L * Math.tan(a.def.fov || 0.55), al = a.data.alert || 0;
      R.flat.flat(a.x + Math.sin(a.yaw) * L / 2, a.y + 0.06, a.z + Math.cos(a.yaw) * L / 2, w, L, a.yaw + Math.PI, SP.beam, a.data.mode === 'blather' ? [1, 0.3, 0.5] : al > 0.05 ? [1, 0.45, 0.6] : [1, 0.7, 0.85], 0.32 + al * 0.4, true);
    }
    // the healer's stare beam
    if (S.gaze && S.gaze.a) { const a = S.gaze.a, h = a.ch.headPos([0, 0, 0]), e = [p.x, p.y + 1.62, p.z]; for (let k = 0; k <= 10; k++) { const u = k / 10, w = 0.35 + Math.sin(t * 12 + k) * 0.1; R.bbs.bb(lerp(h[0], e[0], u), lerp(h[1] + 0.05, e[1], u), lerp(h[2], e[2], u), w, w, k % 2 ? SP.star : SP.glow, [1, 0.75, 0.95], 0.85, true); } }
    // pickup-line hearts
    for (const q of S.lines) { const pul = 1 + Math.sin(q.t * 10) * 0.08; R.bbs.bb(q.x, q.y, q.z, 1.1 * pul, 1.1 * pul, SP.heart, [1, 0.35, 0.65], 1, true); R.bbs.bb(q.x, q.y, q.z, 2.2, 2.2, SP.glow, [1, 0.3, 0.6], 0.45, true); }
    // the boa lasso: a fluffy pink rope from his hand to the target
    if (S.velvet && S.velvet.boa) { const B = S.velvet.boa; for (let k = 0; k <= 16; k++) { const u = k / 16, sag = Math.sin(u * Math.PI) * 1.4 * (1 - B.k); R.bbs.bb(lerp(B.x0, B.x1, u), lerp(B.y0, B.y1, u) + sag, lerp(B.z0, B.z1, u), 0.55, 0.55, SP.puff, [1, 0.45, 0.8], 0.95, false, k); } }
    if (S.velvet && S.velvet.mark) { const M = S.velvet.mark; R.flat.flat(M.x, 0.07, M.z, 4.4, 4.4, t * 2, SP.warn, [1, 0.3, 0.7], 0.55 + Math.sin(t * 16) * 0.3, true); }
    // the disco ball inside the big dome throws glints
    const dd = Math.hypot(cam.x - D.x, cam.z - D.z);
    if (dd < D.r + 10) { const a0 = t * 0.6; for (let k = 0; k < 18; k++) { const a = a0 + k * 0.35, el = 0.3 + (k % 5) * 0.12; R.bbs.bb(D.x + Math.cos(a) * D.r * 0.82 * Math.cos(el), 2 + (k % 6) * 1.6, D.z + Math.sin(a) * D.r * 0.82, 0.5, 0.5, SP.star, burnsRGBf(BURNS_NEON[k % 7]), 0.9, true, a); } }
  }
});

/* ---------------- the velvet rope, the Consent Crew, the podiums ---------------- */
BURNS_W4.buildRope = function (api, g) {
  const W4 = BURNS_W4, S = W4.state, BW = BURNS_W234, { x: rx, z: rz } = W4.ROPE;
  // golden stanchions with sagging velvet ropes across the carpet + along the sides
  const posts = [[-8, 0], [-5, 0], [-1.8, 0], [1.8, 0], [5, 0], [8, 0]];
  posts.forEach(([a, b]) => api.mesh(rx + a, rz + b, m => { m.color('#d8b040').shine(3); BW.post(m, 0, 0, 0, 0.07, 1.05); BW.ball(m, 0, 1.12, 0, 0.11); BW.lathe(m, 0, 0, 0, [[0.32, 0], [0.28, 0.06], [0.08, 0.12]], { seg: 12 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: 1.15, camPass: true }] }; }));
  for (let i = 0; i < posts.length - 1; i++) { const [a0] = posts[i], [a1] = posts[i + 1]; api.mesh(rx, rz, m => { m.color('#8a0a2a').shine(1); const pts = []; for (let k = 0; k <= 6; k++) { const u = k / 6; pts.push([lerp(a0, a1, u), 1.0 - Math.sin(u * Math.PI) * 0.28, 0]); } BW.tube(m, pts, 0.055); m.shine(0); return {}; }); }
  // the rope across the carpet is a real barrier until you pass the quiz (also side fences)
  S.gate = api.collider({ t: 'box', x: rx, z: rz, hx: 1.8, hz: 0.25, y0: 0, y1: 2.6, walk: false });
  api.collider({ t: 'box', x: rx - 30, z: rz, hx: 28.2, hz: 0.3, y0: 0, y1: 4.2, walk: false });
  api.collider({ t: 'box', x: rx + 30, z: rz, hx: 28.2, hz: 0.3, y0: 0, y1: 4.2, walk: false });
  for (let x = -56; x <= 56; x += 4) { if (Math.abs(x) < 9) continue; api.mesh(rx + x, rz, m => { m.color('#2a0a1a'); BW.rb(m, 0, 2.0, 0, 3.9, 4.0, 0.3, 0.1); m.color('#ff3b5c', 1); BW.limb(m, -1.9, 3.85, 0.17, 1.9, 3.85, 0.17, 0.035); m.emissive(0); return {}; }); }
  for (const s of [-1, 1]) for (let z = rz - 4; z > -110; z -= 8) api.mesh(rx + s * 60, z, m => { m.color('#2a0a1a'); BW.rb(m, 0, 2.0, 0, 0.3, 4.0, 7.9, 0.1); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.15, hz: 3.95, y0: 0, y1: 4.0, walk: false }] }; });
  api.mesh(rx, rz - 0.5, m => {
    for (const s of [-1, 1]) { m.color('#ff3b5c').shine(2); BW.lathe(m, s * 10.5, 0, 0, [[1.2, 0], [1.0, 0.5], [0.85, 6.5], [1.05, 6.9], [0.7, 7.3], [0, 7.4]], { seg: 16 }); m.shine(0); m.color('#ffd84a', 1); BW.ball(m, s * 10.5, 7.6, 0, 0.35); m.emissive(0); }
    m.color('#ff3b5c').shine(2); m.push(); m.tf(0, 6.6, 0, 0, Math.PI / 2, 0); m.torus(0, 0, 0, 10.5, 0.32, { seg: 32, tseg: 6, theta0: 0 }); m.pop(); m.shine(0);
    return { cols: [{ t: 'cyl', x: -10.5, z: 0, r: 1.1, y0: 0, y1: 7.3 }, { t: 'cyl', x: 10.5, z: 0, r: 1.1, y0: 0, y1: 7.3 }], lights: [{ x: -10.5, y: 7.6, z: 0, s: 1.8, c: '#ffd84a' }, { x: 10.5, y: 7.6, z: 0, s: 1.8, c: '#ffd84a' }, { x: 0, y: 0, z: 4, s: 0, c: '#ff3b5c', pool: 12 }] };
  });
  api.sign('THE ORGY DOME\nDISTRICT', rx, rz - 0.4, { h: 1.5, y: 7.6, post: false, style: { bg: '#2a0a1a', fg: '#ffd0e0', glow: '#ff3b8a', size: 30, border: '#ff3b8a' }, glow: '#ff3b8a' });
  api.sign('CONSENT IS SEXY\nASK FIRST · NO MEANS NO\nYES MEANS ASK AGAIN LATER', rx - 6.5, rz + 4, { h: 1.3, yaw: 0.3, style: { bg: '#fff0f4', fg: '#8a0a2a', size: 22, border: '#ff3b5c' } });
  // the consent crew booth
  api.prop('booth', { x: rx + 6.5, z: rz + 3.2, roof: '#ff3b8a' });
  api.npc({ id: 'kai', name: 'CONSENT CAPTAIN KAI', type: BURNS_W234.engineType('greeter_m') ? 'greeter_m' : 'greeter', seed: 14, x: rx + 4.2, z: rz + 3.6, yaw: -Math.PI / 2, prop: 'clipboard',
    talk(g2, a) {
      const st = g2.missions.state('consent'), cr = g2.missions.state('creep');
      if (st === 'available') g2.say(a, ['Welcome to the Dome district! I\'m Kai, Consent Crew. Everybody\'s welcome. Everybody also takes the quiz.', 'Three questions. Walk to podium A, B or C and hit ANSWER. Get them all right and the rope is yours.'], () => g2.missions.start('consent'));
      else if (st === 'active') BURNS_W4.quizAsk(g2, S.quiz);
      else if (cr === 'available') g2.say(a, ['Looking for somebody? Everybody who\'s anybody ends up in the cuddle puddle eventually.', 'Heads up: Lounge Row is crawling with creepy dudes in fur coats. If they see you, they WILL offer a hug. Stay out of their sight cones.'], () => g2.missions.start('creep'));
      else g2.say(a, ['Consent is sexy. Hydration is sexy. You, hydrated and consenting? Unstoppable.']);
    } });
  api.npc({ name: 'CONSENT CREW', type: BURNS_W234.engineType('greeter_f') ? 'greeter_f' : 'greeter', seed: 15, x: rx + 8.6, z: rz + 5, yaw: -2.6, lines: ['Rule one: ask. Rule two: listen. Rule three: there is no rule three, we just like rule one.', 'Our wristbands glow when you pass the quiz. It\'s very exclusive. Everybody gets one.'], gift: { kind: 'water' } });
  // quiz podiums
  S.podiums = [];
  ['A', 'B', 'C'].forEach((L, i) => {
    const x = rx - 4 + i * 4, z = rz + 9;
    api.mesh(x, z, m => { m.color('#2a0a1a'); BW.lathe(m, 0, 0, 0, [[0.7, 0], [0.55, 0.15], [0.42, 1.0], [0.62, 1.1], [0.62, 1.2], [0, 1.2]], { seg: 14 }); m.color(['#ff4fd8', '#38f2ff', '#ffe24a'][i], 1); BW.ring(m, 0, 1.18, 0, 0.6, 0.05, { seg: 16, tseg: 4 }); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.6, y0: 0, y1: 1.2 }], lights: [{ x: 0, y: 1.3, z: 0, s: 1.2, c: ['#ff4fd8', '#38f2ff', '#ffe24a'][i] }] }; });
    api.sign(L, x, z + 0.75, { h: 0.7, y: 1.3, post: false, style: { bg: '#2a0a1a', fg: ['#ff4fd8', '#38f2ff', '#ffe24a'][i], glow: ['#ff4fd8', '#38f2ff', '#ffe24a'][i], size: 30 }, glow: ['#ff4fd8', '#38f2ff', '#ffe24a'][i] });
    S.podiums.push({ x, z, i, L });
  });
  // the undercover cop "blending in" at the rope; the ego-death healer at the district's edge
  api.npc(BW.castDef('cop', 4, { id: 'cop', name: 'TOTALLY A BURNER', behavior: 'w234Cop', x: rx - 11, z: rz + 6, view: 12, fov: 1.0, chaseSpeed: 5.0, friendly: false, chatter: false }));
  api.npc(BW.castDef('healer', 6, { id: 'healer', name: 'SERENITY STARCHILD', behavior: 'w4Gazer', x: rx - 18, z: rz - 10, yaw: Math.PI / 2, chatter: true, chat: ['I am one with the dust.', 'I cried at a trash truck today. It was so... purposeful.', 'Have you met your twin flame? I meet mine every Tuesday.'] }));
  api.light(rx, rz, 18, '#ff3b5c', 0.4);
  api.checkpoint('cp_rope', rx - 3, rz + 14, { yaw: Math.PI, name: 'The Velvet Rope' });
};

/* ---------------- the district: dome lounges, Lounge Row, darkwads, Lost & Found ---------------- */
BURNS_W4.buildDistrict = function (api, g) {
  const W4 = BURNS_W4, S = W4.state, BW = BURNS_W234, R = api.rng;
  // smaller domes and lounges around the edges
  const domes = [[-60, 40, 7, '#ffb0d8'], [62, 44, 6.5, '#d8b0ff'], [-72, -20, 8, '#ffb8c8'], [74, -12, 7, '#b8d0ff'], [-56, -76, 7.5, '#ffd0e8'], [70, -80, 6, '#e8c0ff'], [-86, 70, 5.5, '#ffc8a8'], [88, 68, 5.5, '#c8ffe8']];
  for (const [x, z, r, c] of domes) { api.prop('dome', { x, z, r, col: c, alt: shade(c, -0.12), lights: true, glow: '#ff4fd8' }); api.light(x, z, r * 2, '#ff6ab0', 0.4); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; api.glow(x + Math.sin(a) * (r + 0.3), 0.3, z + Math.cos(a) * (r + 0.3), 0.5, i % 2 ? '#ff4fd8' : '#ffd84a', { blink: 2 }); } }
  // lounges: canopies, beanbags, giant pillows, hammocks
  const lounge = (x, z, col, dim) => {
    api.mesh(x, z, m => {
      m.color('#2a1a24'); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.78; BW.post(m, Math.sin(a) * 3.4, 0, Math.cos(a) * 3.4, 0.08, 3.0); }
      m.color(col); BW.egg(m, 0, 3.0, 0, 4.0, 0.7, 4.0, { phi1: Math.PI / 2, seg: 16, rings: 5 });
      m.color(dim ? '#3a2a3a' : '#ff9ab8'); BW.rb(m, 0, 0.12, 0, 5.2, 0.24, 5.2, 0.12);
      const cols = []; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU, bx = Math.sin(a) * 2.0, bz = Math.cos(a) * 2.0; m.color(R.pick(['#c8a0ff', '#ff9ab8', '#9adcff', '#ffe28a'])); BW.rb(m, bx, 0.5, bz, 1.6, 0.6, 1.0, 0.28, {}); cols.push({ t: 'box', x: bx, z: bz, hx: 0.8, hz: 0.5, y0: 0, y1: 0.75 }); }
      if (!dim) { m.color('#fff0d8', 1); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; BW.ball(m, Math.sin(a) * 3.5, 2.8, Math.cos(a) * 3.5, 0.1, { seg: 6, rings: 4 }); } m.emissive(0); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.78; cols.push({ t: 'cyl', x: Math.sin(a) * 3.4, z: Math.cos(a) * 3.4, r: 0.1, y0: 0, y1: 3.0, camPass: true }); }
      cols.push({ t: 'cyl', x: 0, z: 0, r: 4.0, y0: 2.9, y1: 3.4 });
      return { cols, lights: dim ? [] : [{ x: 0, y: 0, z: 0, s: 0, c: '#ff70b0', pool: 7 }] };
    }, { yaw: R() * TAU });
  };
  // Lounge Row: the stealth corridor from the rope to the puddle
  const row = [[-14, 40, '#ff9ab8'], [8, 32, '#c8a0ff'], [-22, 24, '#9adcff'], [4, 14, '#ffb0d8'], [-30, 10, '#e8c0ff'], [-8, 0, '#ffd0a0']];
  for (const [x, z, c] of row) lounge(x, z, c, false);
  api.pickup('photo', -30, 4.3, 10, { id: 'p2' });
  for (const [x, z] of [[40, 30], [-46, 52], [44, -34], [-50, -48]]) lounge(x, z, '#4a3a4a', true);
  api.sign('LOUNGE ROW\nPLEASE DON\'T BE WEIRD', -4, 50, { h: 1.0, yaw: Math.PI, style: { bg: '#2a0a1a', fg: '#ffb0d8', size: 22, border: '#ff4fd8' } });
  // creepy dudes: fur coats, tank tops, board shorts, FREE HUGS signs, vision cones
  S.creepDefs = [];
  const CR = [[[-16, 32], [0, 36]], [[-2, 22], [-24, 18]], [[-18, 4], [2, 8]], [[-40, 2], [-26, -26]], [[14, 2], [30, -8]], [[20, -10], [10, -30]], [[-60, 10], [-46, 26]]];
  CR.forEach((path, i) => S.creepDefs.push(api.enemy({ id: 'creep' + i, name: 'CREEPY DUDE', type: 'furcoat', seed: 200 + i, behavior: 'w4Creep', path, x: path[0][0], z: path[0][1], speed: 1.15 + (i % 3) * 0.12, view: 8.5, fov: 0.55, hp: 2, drop: 3, afterDefeat: 'dance', defeatLine: 'You\'re right. I should ask first. I\'ll ask first.',
    spec: Object.assign(BurnsRig.npcSpec('furcoat', 200 + i), { top: { kind: 'tank', col: '#f4f0e8' }, bottom: { kind: 'shorts', col: R.pick(['#ff4fd8', '#38c8ff', '#ffd21a', '#7aff5a']) }, coat: { kind: 'fur', col: R.pick(['#9a3aff', '#ff4fd8', '#f4f0ff', '#c8a070']), trim: '#ffffff' }, glasses: 'shades', hat: null, goggles: false, acc: ['ledNecklace'], face: 'smug', key: 'w4:creep:' + (i % 4) }) })));
  // darkwads lurking in the dim lounges
  [[[40, 30], [44, 22]], [[-46, 52], [-38, 46]], [[44, -34], [36, -40]]].forEach((path, i) => api.npc(BW.castDef('darkwad', 640 + i, { name: 'DARKWAD', behavior: 'w234Darkwad', path, speed: 0.7, x: path[0][0], z: path[0][1], hittable: true, chatter: true, chat: ['Shh. Mood lighting. Which is no lighting.', 'I\'m not lurking. I\'m ambient.'] })));
  // Lost & Found Lou
  const { x: lx, z: lz } = W4.LOST;
  api.prop('booth', { x: lx, z: lz, roof: '#ffd84a' });
  api.sign('LOST & FOUND\n(MOSTLY LOST)', lx + 2.5, lz + 2.2, { h: 0.9, yaw: 0.4, style: { bg: '#ffd84a', fg: '#2a1a10', size: 22, border: '#2a1a10' } });
  api.npc({ id: 'lou', name: 'LOST & FOUND LOU', type: 'crusty', seed: 17, x: lx + 1.6, z: lz - 1.4, yaw: Math.PI,
    talk(g2, a) {
      const st = g2.missions.state('goggles');
      if (st === 'locked') g2.say(a, ['Pass the Consent Crew\'s quiz first, kid. Then we\'ll talk lost stuff.']);
      else if (st === 'available') g2.say(a, ['Lost & Found. Mostly lost. We have four hundred left socks and one emotional support cactus.', 'Eight pairs of goggles walked off tonight. On domes, in lounges, in the cuddle puddle. Find \'em and I\'ll find you something nice.'], () => g2.missions.start('goggles'));
      else if (st === 'active') g2.say(a, [`${g2.missions.get('goggles').n} of 8 goggles. The playa giveth goggles. The playa taketh goggles.`]);
      else g2.say(a, ['Eight goggles, reunited with their faces. You\'re a hero to the slightly visually impaired.']);
    } });
  const GG = [[-60, 0.9, 30], [62, 7.3, 44], [-30, 1.2, -18], [8, 4.3, 32], [44, 0.9, -38], [-72, 8.9, -20], [-24, 1.2, -10], [70, 0.9, -70]];
  GG.forEach(([x, y, z], i) => api.pickup('item:goggles', x, y, z, { mission: 'goggles', gate: true, id: 'gg' + i }));
  api.checkpoint('cp_row', -8, 30, { yaw: Math.PI, name: 'Lounge Row' });
};

/* ---------------- the cuddle puddle ---------------- */
BURNS_W4.buildPuddle = function (api, g) {
  const W4 = BURNS_W4, S = W4.state, BW = BURNS_W234, R = api.rng, { x: px, z: pz } = W4.PUDDLE;
  // a ring of giant pillows around a soft pit of smaller pillows
  for (let i = 0; i < 14; i++) { const a = i / 14 * TAU, x = px + Math.sin(a) * 10, z = pz + Math.cos(a) * 10; if (Math.cos(a) > 0.93) continue; api.mesh(x, z, m => { m.color(R.pick(['#ff9ab8', '#ffb0d8', '#d8a0ff', '#ffc8a0'])); BW.rb(m, 0, 0.75, 0, 3.6, 1.5, 2.0, 0.65); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.8, hz: 1.0, y0: 0, y1: 1.3 }] }; }, { yaw: a + Math.PI / 2 }); }
  api.mesh(px, pz, m => { const cols = []; for (let i = 0; i < 26; i++) { const a = R() * TAU, d = Math.sqrt(R()) * 7.5, x = Math.sin(a) * d, z = Math.cos(a) * d, w = R.range(1.4, 2.4); m.color(R.pick(['#ff7aa8', '#ff9ab8', '#c87aff', '#ffb0c8', '#ff8a8a'])); BW.rb(m, x, 0.25, z, w, 0.5, w * 0.7, 0.22, {}); } m.color('#5a1a2a'); BW.rb(m, 0, 0.04, 0, 16, 0.08, 16, 0.04); return { cols }; });
  api.light(px, pz, 16, '#ff2a4a', 0.65);
  api.sign('THE CUDDLE PUDDLE\nASK BEFORE YOU PUDDLE', px + 2, pz + 12.5, { h: 1.0, style: { bg: '#3a0a1a', fg: '#ffc8d8', glow: '#ff3b5c', size: 22, border: '#ff3b5c' }, glow: '#ff3b5c' });
  // cuddlers (all in onesies and pajamas, lounging, hugging, snoring)
  for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, d = 3 + (i % 3) * 1.6; api.npc({ type: R.pick(['tutu', 'furcoat', 'burner', 'sparklepony']), seed: 900 + i, x: px + Math.sin(a) * d, z: pz + Math.cos(a) * d, yaw: a + Math.PI, behavior: 'idle', anim: i % 2 ? 'w234lounge' : 'sleep', lookAt: false, chat: ['Mmm. Puddle.', 'Please ask before puddling. Thank you for asking.', 'This is a no-shoes, all-consent zone.', 'Zzz... yes, I consent to this nap...'], lines: ['Welcome to the puddle! We ask before we cuddle. And we\'re all wearing pajamas. Very cozy. Very legal.'] }); }
  // Agent Velour, the informant, hiding among the pillows
  api.npc({ id: 'velour', name: 'AGENT VELOUR', type: 'furcoat', seed: 77, x: px + 1.4, z: pz - 1.0, yaw: 2.4, behavior: 'idle', anim: 'w234lounge', followDist: 2.4, chatter: false,
    spec: Object.assign(BurnsRig.npcSpec('furcoat', 77), { coat: { kind: 'duster', col: '#b8a0d8', trim: '#ffd84a' }, top: { kind: 'tee', col: '#1a1a24' }, bottom: { kind: 'jeans', col: '#1a1a24' }, glasses: 'shades', hat: null, face: 'beard', hair: { style: 'short', col: '#2a1a12', hi: '#3a2a1a' }, key: 'w4:velour' }),
    marker: (g2, a) => (g2.missions.state('escort') === 'available' && g2.missions.isDone('creep')) ? '!' : null,
    talk(g2, a) {
      const st = g2.missions.state('escort');
      if (g2.missions.state('creep') === 'active' || st === 'locked') { g2.say(a, ['Shh. I\'m not here. I\'m a pillow. A very well-dressed pillow.']); return; }
      if (st === 'available') g2.say(a, ['You made it past the creeps? Impressive. I\'m Velour. Agent Velour. It\'s a code name. My real name is Doug.', 'I know where the big wooden fella took your lady. But I don\'t talk in puddles. Too many ears. And elbows.', 'Get me to the Quiet Lounge. Keep the creeps off me. If one hugs me, I bolt.'], () => g2.missions.start('escort'));
      else if (st === 'active') g2.say(a, ['Quiet Lounge. East. Walk casual. Casual!']);
      else g2.say(a, ['Shh. We were never here.']);
    } });
  api.checkpoint('cp_puddle', px + 12, pz + 6, { yaw: -Math.PI / 2, name: 'Cuddle Puddle' });
};

/* ---------------- the big pink dome (enterable lathe shell) ---------------- */
BURNS_W4.buildDome = function (api, g) {
  const W4 = BURNS_W4, S = W4.state, BW = BURNS_W234, D = W4.DOME, R = api.rng;
  const N = 14, K = 4, prof = [], inner = [];
  for (let k = 0; k <= N; k++) { const a = k / N * Math.PI / 2, stripe = k % 2 ? '#ff7ab8' : '#ff9ad0'; prof.push([Math.max(0.001, D.r * Math.cos(a)), D.h * Math.sin(a), stripe]); inner.push([Math.max(0.001, (D.r - 0.25) * Math.cos(a)), (D.h - 0.25) * Math.sin(a), k % 2 ? '#c84a8a' : '#d85a9a', 0.12]); }
  // the doorway faces the city (south, +Z): a gap in the lower band only, so it reads as a door
  const gap = 0.18, doorH = prof[K][1];
  api.mesh(D.x, D.z, m => {
    m.color('#ff8ac0').shine(2); m.lathe(prof.slice(0, K + 1), { seg: 40, theta0: gap, theta1: TAU - gap }); m.lathe(prof.slice(K), { seg: 40 }); m.shine(0);
    m.color('#c84a8a'); BW.innerShell(m, inner.slice(0, K + 1), { seg: 40, theta0: gap, theta1: TAU - gap }); BW.innerShell(m, inner.slice(K), { seg: 40 });
    // the doorway arch (an upright oval of neon) + trim
    const dz = D.r * Math.cos(gap) + 0.05, dw = D.r * Math.sin(gap);
    m.color('#ffd84a', 0.9); m.push(); m.tf(0, 0, dz, 0, Math.PI / 2, 0, 1, 1, doorH / dw); m.torus(0, 0, 0, dw, 0.22, { seg: 28, tseg: 6 }); m.pop(); m.emissive(0);
    m.color('#ff3b8a', 1); BW.ring(m, 0, D.h * 0.55, 0, D.r * Math.cos(Math.asin(0.55)) + 0.15, 0.12, { seg: 48, tseg: 4 }); m.emissive(0);
    // inside: a round stage, a dance floor and a disco ball
    m.color('#2a0a1a'); BW.post(m, 0, 0, -10, 4.2, 0.6, { edge: 0.18 });
    m.color('#1a0a14'); BW.rb(m, 0, 0.03, 0, 26, 0.06, 26, 0.03);
    const reg = BURNS_ATLAS.pattern('disco');
    m.color('#d8e4ff', 0.3).shine(3); m.ellipsoid(0, D.h - 3.4, 0, 1.6, 1.6, 1.6, { seg: 18, rings: 12, uvFn: (x, y, z) => [lerp(reg.u0, reg.u1, (Math.atan2(x, z) / TAU + 0.5) * 3 % 1), lerp(reg.v0, reg.v1, (y / 1.6 * 0.5 + 0.5) * 2 % 1)] }); m.shine(0).emissive(0);
    m.color('#8a8a92'); BW.limb(m, 0, D.h - 1.8, 0, 0, D.h - 0.2, 0, 0.05);
    // the walls: a ring of wall colliders (camera-friendly inside), leaving the doorway open
    const cols = [];
    for (let i = 0; i < 48; i++) { const a = (i + 0.5) / 48 * TAU; if (a < gap + 0.04 || a > TAU - gap - 0.04) continue; const wr = D.r - 0.2; cols.push({ t: 'box', x: Math.sin(a) * wr, z: Math.cos(a) * wr, hx: wr * Math.PI / 48 + 0.15, hz: 0.35, y0: 0, y1: 7.5, yaw: a, walk: false }); }
    cols.push({ t: 'cyl', x: 0, z: -10, r: 4.2, y0: 0, y1: 0.6 });
    return { cols, lights: [{ x: 0, y: D.h - 3.4, z: 0, s: 3.5, c: '#ffffff', blink: 3 }, { x: 0, y: 0, z: 0, s: 0, c: '#ff4fa8', pool: 20 }, { x: 0, y: 3.2, z: D.r + 0.2, s: 2, c: '#ffd84a' }] };
  });
  api.sign('THE ORGY DOME\n♥ CONSENT REQUIRED ♥', D.x, D.z + D.r + 0.6, { h: 1.6, y: 6.4, post: false, style: { bg: '#2a0a1a', fg: '#ffd0e8', glow: '#ff3b8a', size: 30, border: '#ffd84a' }, glow: '#ff3b8a' });
  api.light(D.x, D.z + D.r + 4, 12, '#ffd84a', 0.4);
  // giant pillows around the dance floor (soft obstacles)
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2, x = D.x + Math.sin(a) * 15, z = D.z + Math.cos(a) * 15; if (Math.cos(a) > 0.8) continue; api.mesh(x, z, m => { m.color(R.pick(['#ff9ab8', '#d8a0ff', '#ffb0d8'])); BW.rb(m, 0, 0.6, 0, 2.6, 1.2, 1.6, 0.5); return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.3, hz: 0.8, y0: 0, y1: 1.1 }] }; }, { yaw: a }); }
  // the summit: glowing pads spiralling up the outside of the dome to a neon heart
  for (let i = 0; i < 17; i++) {
    const y = 1.0 + i * 1.02, a = 2.0 + i * 0.38, rr = D.r * Math.cos(Math.asin(Math.min(0.98, y / D.h))) + 1.6;
    api.roundBox(D.x + Math.sin(a) * rr, y - 0.26, D.z + Math.cos(a) * rr, 1.7, 0.26, 1.4, burnsHSL(320 + i * 4, 0.85, 0.6), { yaw: a, r: 0.1, e: 0.4 });
  }
  api.mesh(D.x, D.z, m => { m.color('#2a0a1a'); BW.post(m, 0, D.h - 0.4, 0, 1.6, 0.5, { edge: 0.12 }); m.color('#ff3b5c', 0.9); BW.heart(m, 0, D.h + 2.6, 0, 3.2, { depth: 0.35 }); m.emissive(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.6, y0: D.h - 0.4, y1: D.h + 0.1 }], lights: [{ x: 0, y: D.h + 2.6, z: 0.6, s: 5, c: '#ff3b5c' }] }; });
  api.trigger({ x: D.x, z: D.z, r: D.r + 3, y0: 5, once: true, onEnter: g2 => { if (g2.missions.state('summit') === 'available') { g2.missions.start('summit'); g2.banner('HIDDEN CHALLENGE', 'Top of the Dome: climb to the neon heart!', { col: '#ff9ad8' }); } } });
  api.pickup('photo', D.x - 1.2, D.h + 0.9, D.z + 0.6, { id: 'p1' });
  // the boss: the Velvet Creeper (positioned by velvetStep), waits inside on the stage
  api.enemy({ id: 'velvet', name: 'THE VELVET CREEPER', type: 'furcoat', seed: 99, x: D.x, z: D.z - 10, y: 0.6, behavior: 'w4Velvet', hp: 4, boss: true, scale: 2.0, chatter: false, always: true,
    spec: Object.assign(BurnsRig.npcSpec('furcoat', 99), { coat: { kind: 'fur', col: '#7a1a8a', trim: '#ff9ad8' }, top: { kind: 'tank', col: '#f4f0e8' }, bottom: { kind: 'shorts', col: '#ff3b8a' }, shoes: { kind: 'boots', col: '#ffd84a' }, glasses: 'shades', hat: null, goggles: false, hair: { style: 'wavy', col: '#2a1a12', hi: '#5a3a2a' }, face: 'smug', acc: ['ledNecklace', 'bracelets'], key: 'w4:velvet' }) });
  api.checkpoint('cp_dome', D.x + 6, D.z + D.r + 6, { yaw: Math.PI, name: 'The Big Pink Dome' });
  api.trigger({ x: D.x, z: D.z, r: D.r - 3, y1: 4, onEnter: g2 => BURNS_W4.bossIntro(g2) });
};

/* ---------------- runtime wiring ---------------- */
BURNS_W4.wire = function (g) {
  const S = BURNS_W4.state, BW = BURNS_W234, W4 = BURNS_W4;
  S.creeps = g.actors.filter(a => a.behName === 'w4Creep');
  const hugSign = BW.attModel('sign:freehugs', m => { const reg = BURNS_ATLAS.sign('FREE\nHUGS', { bg: '#ffe0ec', fg: '#c8204a', size: 22, pad: 6, border: '#c8204a' }); m.color('#8a6a3a'); BW.limb(m, 0, -0.1, 0.03, 0, 0.5, 0.03, 0.016); m.color('#ffe0ec'); BW.rb(m, 0, 0.66, 0.03, 0.34, 0.3, 0.02, 0.01); m.decal(0, 0.66, 0.045, 0.32, 0.28, reg); m.push(); m.tf(0, 0, 0.06, Math.PI); m.decal(0, 0.66, 0.045, 0.32, 0.28, reg); m.pop(); });
  for (const a of S.creeps) BW.attach(a, hugSign, BURNS_BONES.PROP, () => !a.defeated);
  const boa = BW.attModel('boa', m => { m.color('#ff7ac8'); const pts = []; for (let k = 0; k <= 10; k++) { const a = -2.2 + k / 10 * 4.4; pts.push([Math.sin(a) * 0.2, 0.42 - Math.cos(a) * 0.06 - (k === 0 || k === 10 ? 0.25 : 0), 0.04 + Math.cos(a) * 0.16]); } BW.tube(m, pts, 0.06); });
  const v = g.actor('velvet'); if (v) { BW.attach(v, boa, BURNS_BONES.CHEST); BW.attach(v, BW.attModel('medallion', mm => { mm.color('#ffd84a').shine(3); BW.ring(mm, 0, 0.42, 0.12, 0.12, 0.012, { pitch: -0.3, seg: 16, tseg: 3 }); BW.egg(mm, 0, 0.3, 0.15, 0.06, 0.06, 0.015, { seg: 10, rings: 4 }); mm.shine(0); }), BURNS_BONES.CHEST); }
  g.interactables = g.interactables || [];
  for (const P of S.podiums) g.interactables.push({ x: P.x, z: P.z + 1.2, r: 1.9, label: 'ANSWER ' + P.L, when: g2 => g2.missions.state('consent') === 'active' && S.quiz >= 0 && !S.quizWait, fn: g2 => W4.quizAnswer(g2, P.i) });
  if (g.missions.isDone('consent')) S.gate.off = true;
  if (g.missions.isDone('escort')) { const ve = g.actor('velour'); if (ve) { ve.x = W4.LOUNGE.x + 1; ve.z = W4.LOUNGE.z + 1; ve.setBehavior('sit'); } }
  if (g.missions.isDone('boss')) { if (v) { v.defeated = true; v.friendly = true; v.setBehavior('chill'); v.x = W4.DOME.x; v.z = W4.DOME.z - 10; } }
};

/* ---------------- the consent quiz ---------------- */
BURNS_W4.quizAsk = function (g, i) {
  const S = BURNS_W4.state, Q = BURNS_W4.QUIZ[i]; if (!Q) return;
  S.quiz = i; S.quizWait = true;
  g.say(g.actor('kai') || 'brady', [`Question ${i + 1} of 3: ${Q.q}`, Q.a.join('   ·   ') + '   (walk to a podium and ANSWER)'], () => { S.quizWait = false; });
};
BURNS_W4.quizAnswer = function (g, k) {
  const S = BURNS_W4.state, Q = BURNS_W4.QUIZ[S.quiz], kai = g.actor('kai') || 'brady', P = S.podiums[k];
  if (!Q) return;
  if (k === Q.ok) {
    burnsSfx('crowd_cheer', { vol: 0.5 }); g.fx.confetti(P.x, 2, P.z, 24);
    if (S.quiz >= 2) { S.quizWait = true; g.say(kai, [Q.why[k], 'Three for three! Here\'s your glowing wristband. The rope is open. Welcome to the Dome district!'], () => { S.quiz = -1; S.gate.off = true; burnsSfx('greeter_bell'); g.missions.complete('consent', { x: 0, y: 1.4, z: BURNS_W4.ROPE.z + 2 }); }); }
    else { S.quizWait = true; g.say(kai, [Q.why[k]], () => BURNS_W4.quizAsk(g, S.quiz + 1)); }
  } else {
    burnsSfx('bump'); S.quizWait = true;
    g.say(kai, [Q.why[k], 'Try again! No shame. Only learning. And snacks.'], () => { S.quizWait = false; });
  }
};

/* ---------------- stealth + escort ---------------- */
BURNS_W4.creepStart = function (g) { BURNS_W4.resetCreeps(g); g.player.teleport(-2, 0, 52, Math.PI); g.camYaw = Math.PI; g.snapCam = true; g.banner('CREEP WEEK', 'Reach the cuddle puddle. Stay out of the cones.', { col: '#ff9ad8' }); };
BURNS_W4.creepReset = function (g) { BURNS_W4.resetCreeps(g); g.player.teleport(-2, 0, 56, Math.PI); g.toast('BACK TO THE START OF LOUNGE ROW'); };
BURNS_W4.resetCreeps = function (g) { for (const a of BURNS_W4.state.creeps || []) { if (a.defeated) continue; a.data.mode = 'patrol'; a.data.alert = 0; a.data.i = 0; const P0 = a.def.path[0]; a.x = P0[0]; a.z = P0[1]; a.vx = a.vz = 0; } };
BURNS_W4.escortStart = function (g) { const v = g.actor('velour'); if (v) { v.setBehavior('follow'); v.say('Walk casual. CASUAL.', 2); } };
BURNS_W4.escortReset = function (g) { const v = g.actor('velour'), P = BURNS_W4.PUDDLE; if (v) { v.setBehavior('idle'); v.def.anim = 'w234lounge'; v.x = P.x + 1.4; v.z = P.z - 1.0; } };
BURNS_W4.escortStep = function (g, dt) {
  const v = g.actor('velour'), p = g.player; if (!v) return;
  if (Math.hypot(v.x - p.x, v.z - p.z) > 14 && !g.cine) { v.x = p.x - Math.sin(p.yaw) * 2.2; v.z = p.z - Math.cos(p.yaw) * 2.2; v.y = p.y; }
  for (const c of BURNS_W4.state.creeps) if (!c.defeated && Math.hypot(c.x - v.x, c.z - v.z) < 1.8) { c.say('HUG?!', 1.2); v.say('AAAH! A HUG! I\'M OUT!', 2); g.missions.fail('escort', 'A creep hugged Agent Velour. He bolted back to the puddle.'); return; }
};
BURNS_W4.velourTalks = function (g) {
  const S = BURNS_W4.state, v = g.actor('velour'), D = BURNS_W4.DOME;
  const vel = g.actor('velvet');
  if (v) { v.setBehavior('sit'); }
  g.cutscene([
    { cam: { x: BURNS_W4.LOUNGE.x - 5, y: 2.4, z: BURNS_W4.LOUNGE.z + 5, tx: BURNS_W4.LOUNGE.x, ty: 1.2, tz: BURNS_W4.LOUNGE.z, fov: 0.85 } },
    { say: [v, ['Okay. Okay. Nobody\'s listening. Your lady, the big wooden guy, they\'re at—']] },
    { do: g2 => { burnsSfx('whip', null, 'throw'); g2.shake(0.4); if (v) { v.hidden = true; } g2.fx.burst(v ? v.x : 0, 1.5, v ? v.z : 0, 'heart', 24, '#ff7ac8'); } },
    { say: [vel || { name: 'THE VELVET CREEPER', model: null }, ['*FWIP* GOT YOU, DOUG. Nobody leaves the Dome district without a HUG. Especially snitches.']] },
    { say: ['brady', ['A pink feather boa just lassoed my informant into the big dome. That is... a sentence I just said.']] },
    { banner: ['THE BIG PINK DOME', 'Go get Velour back.', { col: '#ff3b8a' }] }
  ]);
  S.velourTaken = true;
  void D;
};

/* ---------------- the Ego-Death Healer: eye-gazing that roots you ---------------- */
BurnsBehaviors.register('w4Gazer', {
  init(a) { a.data.cd = 2; },
  update(a, g, dt) {
    const D = a.data, S = BURNS_W4.state, p = g.player, d = a.distP();
    D.cd -= dt;
    if (S.gaze && S.gaze.a === a) { a.face(p.x, p.z, dt, 6); a.ch.play('wave'); a.vx = a.vz = 0; a.physics(dt); return; }
    const hx = a.home.x + Math.sin(a.t * 0.2) * 3, hz = a.home.z + Math.cos(a.t * 0.17) * 3, dd = a.moveTo(hx, hz, 0.7, dt, 0.4);
    a.ch.play(dd > 0.6 ? 'walk' : 'float', { rate: 0.6 });
    if (D.cd <= 0 && d < 7.5 && !S.gaze && !g.cine && !g.dialog.open && !p.vehicle && p.grounded && BurnsBehaviors.sees(a, g, 8, 0.9)) {
      D.cd = 9; S.gaze = { a, mash: 0, t: 0, last: -1 };
      p.locked = true; p.animOverride = 'idle'; p.vx = p.vz = 0;
      a.say('Shh. Don\'t speak. Just... gaze. Let our souls hold hands.', 3);
      g.warn('MASH TO LOOK AWAY!', 2.5); burnsSfx('lsd', { vol: 0.5 });
    }
    a.physics(dt);
  }
});
BURNS_W4.gazeStep = function (g, dt) {
  const S = BURNS_W4.state, G = S.gaze, p = g.player; if (!G) return;
  G.t += dt;
  const I = p.inp;
  if ((I.jumpPressed || I.actionPressed) && G.t - G.last > 0.02) { G.last = G.t; G.mash++; g.shake(0.04); p.say(['...', 'Must... look... away...', 'Blinking! I\'m blinking!'][G.mash % 3], 0.6); }
  if (Math.random() < dt * 0.5) G.a.say(['Your third eye is... a little dusty.', 'I see you. I SEE you. Do you see me seeing you?', 'You\'re crying. No, I\'m crying. We\'re both crying.', 'I think you might be my twin flame. Until Monday.'][Math.floor(Math.random() * 4)], 2.2);
  if (G.mash >= 7 || G.t > 9) { G.a.say(G.mash >= 7 ? 'You broke our connection. I forgive you. I already forgot you.' : 'Our souls are done. That\'ll be zero dollars. Gifting!', 2.6); g.toast('EYE CONTACT BROKEN'); BURNS_W4.unroot(g); }
};
BURNS_W4.unroot = function (g) { const S = BURNS_W4.state; if (!S.gaze) return; S.gaze = null; g.player.locked = false; g.player.animOverride = null; };

/* ---------------- creepy dudes: patrol with a cone; spotted = follow + blather (drains hydration) ---------------- */
BurnsBehaviors.register('w4Creep', {
  init(a) { a.data.i = 0; a.data.alert = 0; a.data.mode = 'patrol'; a.data.cd = 0; },
  update(a, g, dt) {
    const D = a.data, p = g.player, P = a.def.path;
    if (D.mode === 'blather') {
      const d = a.moveTo(p.x, p.z, 3.3, dt, 1.4); a.ch.play(d > 1.5 ? 'walk' : 'talk', { rate: 1.2 });
      D.cd -= dt;
      if (d < 3 && D.cd <= 0 && !p.dead && !g.cine) { D.cd = 2.2; p.hurt(1, a.x, a.z, 2); a.say(['Hey... wanna come to a cuddle puddle?', 'Free hugs! The hugs are free! What do you mean, no?', 'I\'m a really good hugger. Ask anyone. Don\'t ask anyone.', 'You look like you need a hug. And a fur coat. I have both.'][Math.floor(Math.random() * 4)], 2); }
      if (d > 15) { D.mode = 'patrol'; D.alert = 0; a.say('...Rude. Free hugs are a GIFT.', 1.6); }
    } else {
      const seen = BurnsBehaviors.sees(a, g, a.def.view || 8.5, a.def.fov || 0.55);
      if (seen) { D.alert = Math.min(1, D.alert + dt * 2.6); if (D.alert >= 1) { D.mode = 'blather'; D.cd = 0.8; a.say('Ohhh, HEY there! Wanna hug?', 1.6); g.missions.event('spotted', a); } }
      else D.alert = Math.max(0, D.alert - dt * 0.6);
      if (P && P.length) { const t = P[D.i], d = a.moveTo(t[0], t[1], a.speed, dt, 0.4); a.ch.play('walk', { rate: 0.85 }); if (d < 0.5) D.i = (D.i + 1) % P.length; }
    }
    a.physics(dt);
  }
});

/* ---------------- pickup lines: pink heart projectiles (spin pops them) ---------------- */
BURNS_W4.throwLine = function (g, a, ang) {
  const S = BURNS_W4.state, h = a.ch.headPos([0, 0, 0]);
  S.lines.push({ x: h[0], y: h[1] - 0.6, z: h[2], vx: Math.sin(ang) * 5, vy: 0, vz: Math.cos(ang) * 5, t: 0 });
  a.say(BURNS_W4.LINES[Math.floor(Math.random() * BURNS_W4.LINES.length)], 2.4);
  burnsSfx('pitch_blah', { vol: 0.6 });
};
BURNS_W4.linesStep = function (g, dt) {
  const S = BURNS_W4.state, p = g.player;
  for (const q of S.lines) {
    q.t += dt;
    const dx = p.x - q.x, dy = p.y + 1.1 - q.y, dz = p.z - q.z, d = Math.hypot(dx, dy, dz) || 1, sp = 5.2;
    q.vx = BurnsM.damp(q.vx, dx / d * sp, 1.3, dt); q.vy = BurnsM.damp(q.vy, dy / d * sp, 1.3, dt); q.vz = BurnsM.damp(q.vz, dz / d * sp, 1.3, dt);
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
    if (q.t > 5) { q.dead = true; continue; }
    if (p.spinT > 0 && Math.hypot(dx, dz) < 1.9 && Math.abs(dy) < 1.6) { q.dead = true; g.fx.burst(q.x, q.y, q.z, 'heart', 10, '#ff7ac8'); burnsSfx('pick', { vol: 0.5 }); g.toast('LINE DECLINED!'); continue; }
    if (Math.hypot(dx, dz) < 0.75 && Math.abs(dy) < 1.0) { q.dead = true; p.hurt(1, q.x, q.z, 4); g.fx.burst(q.x, q.y, q.z, 'heart', 8, '#ff7ac8'); p.say('Ew. That line was SO bad.', 1.2); }
  }
  S.lines = S.lines.filter(q => !q.dead);
};

/* ---------------- the Velvet Creeper (boss) ---------------- */
BURNS_W4.bossIntro = function (g) {
  const S = BURNS_W4.state, a = g.actor('velvet'), p = g.player, D = BURNS_W4.DOME;
  if (S.bossStarted || !a || g.missions.isDone('boss')) return;
  if (g.missions.state('boss') !== 'available') { if (!S.domeWarned) { S.domeWarned = true; const v = a; v.say('Ohhh, a visitor! Come back when you have a FRIEND for me to hug.', 2.6); } return; }
  S.bossStarted = true;
  g.missions.start('boss', true);
  const c1 = { x: D.x + 6, y: 3.5, z: D.z + 4, tx: a.x, ty: 3, tz: a.z, fov: 0.85 };
  g.cutscene([
    { music: 'boss' },
    { cam: c1 },
    { banner: ['THE VELVET CREEPER', 'King of the Lounge · Boss', { col: '#ff3b8a', big: true, dur: 3 }] },
    { say: [a, ['Welcome... to my LOUNGE. Have you met my boa? Her name is Consent. Just kidding. Her name is Linda.', 'Your little informant is MINE now. Nobody leaves without a hug. And I do the hugging.']] },
    { say: [{ name: 'AGENT VELOUR', model: null }, ['(muffled, from inside a pile of boas) HELP. IT\'S SO FLUFFY IN HERE.']] },
    { say: ['brady', ['Buddy. The Consent Crew is RIGHT outside. You did not pass the quiz.']] },
    { say: [a, ['Quizzes are for people who don\'t have a VELVET COAT. GET OVER HERE!']] },
    { do: g2 => { p.teleport(D.x, 0, D.z + 8, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; S.velvet = { mode: 'taunt', t: 1.6, n: 0 }; g2.boss = { name: 'THE VELVET CREEPER', get hp() { return a.hp; }, maxHp: 4, active: true, get defeated() { return a.defeated; }, st: '', head() { return [a.x, a.y + 3.5, a.z]; }, update() {} }; g2.banner('FIGHT!', 'Spin to pop pickup lines · dodge the boa lasso (get out of the pink ring) · bonk him while he\'s tangled', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W4.velvetStep = function (g, dt) {
  const S = BURNS_W4.state, V = S.velvet, a = g.actor('velvet'), p = g.player, D = BURNS_W4.DOME;
  if (!a || a.defeated || g.cine) return;
  V.t -= dt;
  const ph = 4 - a.hp;
  a.y = 0.6 * (Math.hypot(a.x - D.x, a.z - (D.z - 10)) < 4.2 ? 1 : 0);
  if (V.mode === 'taunt') {
    a.face(p.x, p.z, dt, 3); a.ch.play('dance', { style: 5, bpm: 100 });
    const tx = D.x + Math.sin(g.time * 0.3) * 6, tz = D.z - 4 + Math.cos(g.time * 0.23) * 4; a.moveTo(tx, tz, 1.5, dt, 0.5); a.x += a.vx * dt; a.z += a.vz * dt;
    if (V.t <= 0) {
      V.n++;
      if (ph >= 2 && V.n % 4 === 0) { V.mode = 'pack'; V.t = 1.2; }
      else if (V.n % 2 === 0) { V.mode = 'wind'; V.t = 1.3 - ph * 0.12; V.mark = { x: p.x, z: p.z }; a.say(['Come here, you!', 'GET OVER HERE, CUTIE!', 'Linda! FETCH!'][V.n % 3], 1.2); burnsSfx('whip', null, 'throw'); }
      else { V.mode = 'lines'; V.t = 0.4; V.k = 0; V.max = 2 + ph; }
    }
  } else if (V.mode === 'lines') {
    a.face(p.x, p.z, dt, 6); a.ch.play('throw');
    if (V.t <= 0 && V.k < V.max) { V.k++; V.t = 0.55; BURNS_W4.throwLine(g, a, Math.atan2(p.x - a.x, p.z - a.z) + (Math.random() - 0.5) * 0.6); }
    if (V.k >= V.max && V.t <= 0) { V.mode = 'taunt'; V.t = 1.4 - ph * 0.15; }
  } else if (V.mode === 'wind') {
    a.face(V.mark.x, V.mark.z, dt, 6); a.ch.play('yell');
    const h = a.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.3, 0); V.boa = { x0: h[0], y0: h[1], z0: h[2], x1: h[0] + Math.sin(g.time * 14) * 1.4, y1: h[1] + 1.5, z1: h[2] + Math.cos(g.time * 14) * 1.4, k: 0 };
    if (V.t <= 0) { V.mode = 'throw'; V.t = 0.45; }
  } else if (V.mode === 'throw') {
    const h = a.ch.bonePoint(BURNS_BONES.FARM_R, 0, -0.3, 0), u = clamp(1 - V.t / 0.45, 0, 1);
    V.boa = { x0: h[0], y0: h[1], z0: h[2], x1: lerp(h[0], V.mark.x, u), y1: lerp(h[1], 0.6, u), z1: lerp(h[2], V.mark.z, u), k: u };
    if (V.t <= 0) {
      V.boa = null;
      if (Math.hypot(p.x - V.mark.x, p.z - V.mark.z) < 2.2 && p.y < 1.6 && !p.dead) { V.mode = 'reel'; V.t = 2.2; V.mark = null; S.pull = { a, t: 0 }; p.locked = true; a.say('GOTCHA! Hug time!', 1.4); burnsSfx('crowd', { vol: 0.4 }); }
      else { V.mode = 'tangled'; V.t = 3.6 - ph * 0.3; V.mark = null; a.say(['Linda, no! LINDA!', 'I\'m... tangled in my own boa...', 'This is not how hugs work!'][V.n % 3], 2); g.fx.burst(a.x, 2.5, a.z, 'heart', 14, '#ff7ac8'); }
    }
  } else if (V.mode === 'reel') {
    a.face(p.x, p.z, dt, 6); a.ch.play('hug');
    if (V.t <= 0) { V.mode = 'taunt'; V.t = 1.2; }
  } else if (V.mode === 'tangled') {
    a.ch.play('hurt'); a.yaw += dt * 2.5; if (Math.random() < dt * 6) g.fx.burst(a.x, a.y + 3.9, a.z, 'star', 1, '#ffe24a');
    if (V.t <= 0) { V.mode = 'taunt'; V.t = 1.0; a.say('I\'m FREE! And FABULOUS!', 1.4); }
  } else if (V.mode === 'pack') {
    a.ch.play('cheer');
    if (V.t <= 0) { V.mode = 'taunt'; V.t = 2.2; a.say('BOYS! Group hug!', 1.6); for (let k = 0; k < 2; k++) { const an = Math.random() * TAU; g.spawnActor({ type: 'furcoat', seed: 950 + Math.floor(Math.random() * 40), name: 'CREEPER', x: a.x + Math.sin(an) * 4, z: a.z + Math.cos(an) * 4, behavior: 'greeterHug', hp: 1, friendly: false, drop: 2, afterDefeat: 'dance', defeatLine: 'Okay! Okay! I\'ll ask first!', dashSpeed: 7.5 }); } }
  }
  a.x = clamp(a.x, D.x - 15, D.x + 15); a.z = clamp(a.z, D.z - 15, D.z + 15);
};
BURNS_W4.pullStep = function (g, dt) {
  const S = BURNS_W4.state, P = S.pull, p = g.player, a = P.a;
  P.t += dt;
  const tx = a.x + Math.sin(a.yaw) * 1.6, tz = a.z + Math.cos(a.yaw) * 1.6;
  p.x = BurnsM.damp(p.x, tx, 5, dt); p.z = BurnsM.damp(p.z, tz, 5, dt); p.vx = p.vz = 0; p.animOverride = 'hurt';
  const V = S.velvet; if (V) V.boa = { x0: a.x, y0: 2.6, z0: a.z, x1: p.x, y1: p.y + 1, z1: p.z, k: 1 };
  if (P.t > 1.1) { S.pull = null; if (V) V.boa = null; p.locked = false; p.animOverride = null; p.invT = 0; p.hurt(1, a.x, a.z, 9); p.say('A CRINGE HUG! NOOO!', 1.4); g.fx.hearts(p.x, p.y + 2, p.z, 10); }
};
BurnsBehaviors.register('w4Velvet', {
  update(a, g, dt) { if (!BURNS_W4.state.velvet && !a.defeated) { a.ch.play('dance', { style: 5, bpm: 96 }); a.face(g.player.x, g.player.z, dt, 2); } },
  hit(a, g, kind) {
    const V = BURNS_W4.state.velvet;
    if (!V || V.mode !== 'tangled') { if (V) { a.say(['Ooh, feisty!', 'You can\'t hit a man in velvet!', 'Spin all you want, darling!'][Math.floor(Math.random() * 3)], 1); } return false; }
    a.hp -= 1; a.hurtT = 0.35; g.fx.burst(a.x, 3, a.z, 'star', 18, '#ffe24a'); g.fx.hearts(a.x, 4, a.z, 8); burnsSfx('bossHit'); g.shake(0.35);
    const p = g.player, dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz) || 1; p.knock(dx / d * 9, 8, dz / d * 9);
    if (a.hp <= 0) { a.defeated = true; a.hp = 0; BURNS_W4.state.velvet = null; BURNS_W4.bossDefeated(g); }
    else { V.mode = 'taunt'; V.t = 1.6; a.say(['My COAT! It\'s VINTAGE!', 'You... you didn\'t even ask before hitting me!', 'Linda, we\'re leaving! Linda?!'][a.hp % 3], 2); if (a.hp === 2) g.banner('HE CALLED HIS PACK', 'Creepers charge with open arms: dodge, then spin them!', { col: '#ff3b8a' }); if (a.hp === 1) g.banner('HE\'S DESPERATE', 'More lines, faster lasso!', { col: '#ff3b8a' }); }
    return 'handled';
  }
});
BURNS_W4.bossDefeated = function (g) {
  const S = BURNS_W4.state, a = g.actor('velvet'), p = g.player, D = BURNS_W4.DOME, v = g.actor('velour');
  g.boss = null; S.lines.length = 0; if (S.pull) { S.pull = null; p.locked = false; p.animOverride = null; }
  for (const c of g.actors.slice()) if (c.def.name === 'CREEPER' && !c.defeated) c.befriend();
  g.missions.complete('boss');
  BURNS_W234.timer(1.2, () => {
    g.cutscene([
      { music: 'burns_victory' },
      { cam: { x: D.x + 5, y: 3.2, z: D.z + 2, tx: a.x, ty: 2.2, tz: a.z, fov: 0.85 } },
      { do: g2 => { a.ch.play('sit'); a.setBehavior('chill'); } },
      { say: [a, ['Wait. Was I... the creep? Was I the creep this whole time?', '...I was the creep. I\'m going to go take the Consent Crew\'s quiz. Twice.']] },
      { do: g2 => { if (v) { v.hidden = false; v.x = D.x + 2; v.z = D.z + 2; v.setBehavior('idle'); } g2.fx.burst(D.x + 2, 1.5, D.z + 2, 'heart', 20, '#ff7ac8'); } },
      { cam: { x: D.x + 5, y: 2.2, z: D.z + 6, tx: D.x + 2, ty: 1.5, tz: D.z + 2, fov: 0.8 } },
      { say: [v || { name: 'AGENT VELOUR', model: null }, ['Phew. Fluffiest kidnapping of my life. Okay. The clue.', 'The big wooden guy is planning a huge gift for your lady. HUGE. So he\'s been shopping at the Costco Soul Trading Co.', 'Giant gifting warehouse at the edge of the city. They\'ve gifted to every camp out here. Somebody there knows where he\'s keeping her.', 'Ask for the sample lady. Tell her Doug sent you. Then forget Doug.']] },
      { say: ['brady', ['Costco Soul Trading Co. Bulk love, here I come. Hang on, Chinka.']] },
      { do: g2 => { p.victoryT = 3; burnsSfx('crowd_cheer'); } },
      { wait: 0.8 }
    ], g2 => g2.finishWorld());
  });
};

/* ---------------- intro ---------------- */
BURNS_W4.intro = function (g) {
  const S = BURNS_W4.state, p = g.player, R = BURNS_W4.ROPE;
  p.locked = true;
  g.cutscene([
    { cam: { x: 40, y: 34, z: 120, tx: 0, ty: 0, tz: 0, fov: 0.9 } },
    { banner: [BurnsWorlds.label ? BurnsWorlds.label(4) : 'WORLD 4', 'THE ORGY DOME', { col: '#ff3b5c', big: true, dur: 3 }] },
    { cam: { from: { x: 40, y: 34, z: 120, tx: 0, ty: 0, tz: 0, fov: 0.9 }, to: { x: 4, y: 2.6, z: 104, tx: 0, ty: 3, tz: R.z, fov: 0.85 }, dur: 4.2 } },
    { say: ['brady', ['The Dome district. Okay. I\'m here for INFORMATION. That\'s all. Information.', 'Ask for Velour. Come alone. Wear something cozy. ...I am wearing something cozy.']] },
    { say: [{ name: 'CONSENT CAPTAIN KAI', model: null }, ['(over a megaphone) WELCOME TO THE DOME DISTRICT! EVERYBODY TAKES THE QUIZ! EVEN YOU, CUTIE IN THE COSTUME!']] },
    { do: g2 => { p.locked = false; p.teleport(0, 0, 96, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; BurnsSave.flag(4, 'intro', true); S.introDone = true; } },
    { banner: ['FIND THE INFORMANT', 'Pass the Consent Crew\'s quiz at the velvet rope.', { col: '#ffd84a' }] }
  ], null);
};

/* test/debug access (the bundle is one IIFE) */
try { (window.BRADY_W234 = window.BRADY_W234 || {}).w4 = BURNS_W4; } catch (e) { /* no window */ }
