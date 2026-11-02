/* ============================================================
   BRADY-O BURNS — World 13: THE WORKSHOPS (morning, workshop village)
   Chinka's note said: "Find me where lost loves are found: 9:00, the Workshops."
   The "Finding Your Long-Lost Love" workshop needs two stamps first.
   Comedic and tasteful: innuendo and silliness only, nothing explicit.
   Missions (Burn Tokens):
     contact    Contact Improv 101      escape Flow (relentlessly flowing, cartoon-censored) to the Nap Tent
     tantra     Tantra Basics           fetch 5 cushions while Klaus (sweet, in a sundress) wants to be your partner
     sound      Sound Bath              ring 5 singing bowls in Solstice's dome; dodge the stare beam (mash to look away)
     belonging  Radical Belonging       snap Brother Bubblegum's followers out of it with a spin
     twinflame  Twin Flames             walk Klaus to Solstice: twin flames (Klaus's happy ending)
     nap        Advanced Napping        hidden: lie still on the golden mat
     lostlove   Finding Your Long-Lost Love   the guided exercise -> Chinka is alive, on the Man's pavilion
   Side (no token): acro, A Terrible Idea (Bad Idea Guy's yoga-ball tower).
   Ending: the Man's goons (the Ranger + the Undercover Cop) revoke Brady's ticket and
   march him out to the gate road. A small plane drones overhead...
   ============================================================ */

const BW13 = {
  SPAWN: { x: 0, z: 126 }, ARCH: { x: 0, z: 112 }, SIGNIN: { x: 9, z: 101 }, PLAZA: { x: 0, z: 60 }, BOARD: { x: 0, z: 76 },
  FLOOR: { x: -52, z: 36, r: 10 }, TANTRA: { x: 54, z: 34, R: 9, H: 7.2 }, NAP: { x: 68, z: -54, R: 8, H: 4.6 },
  SOUND: { x: -58, z: -52, R: 10, H: 8.2 }, LOVE: { x: 0, z: -102, R: 9, H: 7.4 }, CUDDLE: { x: -24, z: -6 }, ACRO: { x: 28, z: -12 },
  CULT: { x: 46, z: 78 }, KOMBUCHA: { x: -15, z: 60 }, MAN: { x: 0, z: -330 }, EXIT: { x: 0, z: 131 },
  state: null
};
BW13.NAPDOOR = { x: BW13.NAP.x - BW13.NAP.R - 0.5, z: BW13.NAP.z };
BW13.SOUNDDOOR = { x: BW13.SOUND.x + BW13.SOUND.R + 0.6, z: BW13.SOUND.z };
BW13.LOVEDOOR = { x: BW13.LOVE.x, z: BW13.LOVE.z + BW13.LOVE.R + 0.6 };
BW13.SKY_A = Object.assign({}, BURNS_PALETTES.day, { zen: '#2f78de', mid: '#86c0f2', midK: 0.4, hor: '#fbe6cc', fog: '#f0dcc2', fogD: 0.0042, haze: 0.5, fogMax: 0.8,
  sun: [115, 34], sunCol: '#fff2d8', sunSize: 0.0024, key: '#fff0d8', keyK: 0.95, sky: '#cfe0f6', gnd: '#dcbc98', mtnCol: '#8a90b0', emB: 1.15, rim: '#ffffff', clouds: 0.42, cloudCol: '#ffffff' });
BW13.SKY_B = Object.assign({}, BW13.SKY_A, { zen: '#2a6ad0', mid: '#7ab4ee', hor: '#f8ecd8', sun: [150, 52], fog: '#ecdcc8', key: '#fff4e4', clouds: 0.5 });

BurnsWorlds.register({
  id: 13, name: 'The Workshops', sub: 'Learn something. Escape everything.',
  sky: BW13.SKY_A, sky2: BW13.SKY_B, tod: 0,
  music: 'w7',
  bounds: [-120, -150, 120, 135],
  spawn: { x: 0, y: 0, z: 126, yaw: Math.PI },
  ground: { base: '#dcbf9c', crack: 0.12, mottle: 0.32, res: 0.45 },
  dust: 0.6,
  missions: [
    { id: 'contact', name: 'Contact Improv 101', short: 'Escape Flow! Get to the Nap Tent', type: 'custom', giver: 'willow', start: 'manual', marker: { x: BW13.FLOOR.x, z: BW13.FLOOR.z },
      desc: 'Willow paired you with Flow. Flow wears his truth (and a fanny pack). Nobody flows in the Nap Tent: get there. Three catches and you\'ve been FLOWED. SPIN makes him pause.', hint: 'The Floor, west of the plaza (Willow)',
      onStart(g, m) { BW13.contactStart(g, m); }, onUpdate(g, m) { if (Math.hypot(g.player.x - BW13.NAPDOOR.x, g.player.z - BW13.NAPDOOR.z) < 3.4) g.missions.complete('contact', { x: BW13.NAP.x - 4, y: 1.4, z: BW13.NAP.z }); },
      onFail(g) { BW13.contactReset(g); }, onComplete(g) { BW13.contactDone(g); } },
    { id: 'tantra', name: 'Tantra Basics', short: 'Bring 5 cushions back to the tent', type: 'custom', count: 5, giver: 'river', start: 'manual', progressLabel: 'Cushions', marker: { x: BW13.TANTRA.x, z: BW13.TANTRA.z },
      desc: 'The wind took River\'s meditation cushions. Bring five back to the tent. Klaus would really, really like to be your partner. SPIN makes him spin too.', hint: 'The Tent of Breath, east of the plaza (River)',
      onStart(g) { BW13.tantraStart(g); }, onComplete(g) { BW13.tantraDone(g); } },
    { id: 'sound', name: 'Sound Bath', short: 'Ring the 5 singing bowls', type: 'custom', count: 5, giver: 'solstice', start: 'manual', progressLabel: 'Bowls', marker: { x: BW13.SOUND.x, z: BW13.SOUND.z },
      desc: 'Solstice wants your aura bathed in sound. Ring the five bowls around the dome. Avoid the eye contact: if the stare beam locks on, mash JUMP to look away.', hint: 'The Sound Dome, north-west (Solstice)',
      onStart(g) { BW13.soundStart(g); }, onComplete(g) { BW13.soundDone(g); } },
    { id: 'belonging', name: 'Radical Belonging', short: 'Spin the followers free', type: 'custom', count: 6, giver: 'bubblegum', start: 'manual', progressLabel: 'Freed', marker: { x: BW13.CULT.x, z: BW13.CULT.z },
      desc: 'Brother Bubblegum\'s followers want you to belong. Forever. In a fun way. SPIN each one to snap them out of it. Three group hugs and you\'ve been belonged.', hint: 'The Pink Circle, east of the plaza (Brother Bubblegum)',
      onStart(g) { BW13.cultStart(g); }, onFail(g) { BW13.cultReset(g); }, onComplete(g) { BW13.cultDone(g); } },
    { id: 'twinflame', name: 'Twin Flames', short: 'Walk Klaus to the Sound Dome', type: 'escort', companion: 'klaus', giver: 'klaus', start: 'manual', requires: ['tantra', 'sound'], target: { x: BW13.SOUNDDOOR.x + 2, z: BW13.SOUNDDOOR.z, r: 4 }, marker: { x: BW13.TANTRA.x - 10, z: BW13.TANTRA.z },
      desc: 'Klaus has never once had a partner. Solstice has been hunting a twin flame all week. You know where this is going.', hint: 'Klaus, sitting outside the Tent of Breath', lockedDesc: 'Finish Tantra Basics and Solstice\'s Sound Bath first.',
      onStart(g) { BW13.twinStart(g); }, onComplete(g) { BW13.twinDone(g); } },
    { id: 'nap', name: 'Advanced Napping', short: 'Lie still on the golden mat', type: 'custom', start: 'trigger', secret: true, marker: { x: BW13.NAP.x + 2, z: BW13.NAP.z },
      desc: 'The final exam of Advanced Napping: lie on the golden mat and do absolutely nothing.', hint: 'Inside the Nap Tent' },
    { id: 'acro', name: 'A Terrible Idea', short: 'Bounce up and ring the bell', type: 'climb', token: false, giver: 'riggs', start: 'manual', target: { x: BW13.ACRO.x + 1, z: BW13.ACRO.z + 5, r: 2.2, y: 9.6 }, marker: { x: BW13.ACRO.x, z: BW13.ACRO.z },
      desc: 'Advanced Acro Yoga, as taught by a man in an arm cast: bounce up the yoga balls and ring the bell on top.', hint: 'The yoga balls, south-east of the cuddle puddle (Riggs)',
      onComplete(g) { const r = g.actor('riggs'); if (r) r.say('YOU RANG IT! A TERRIBLE idea, and you NAILED it!', 3.5); burnsSfx('crowd_cheer', { vol: 0.6 }); g.addGlow(10); g.toast('+10 GLOW STICKS'); } },
    { id: 'lostlove', name: 'Finding Your Long-Lost Love', short: 'Join the 9:00 workshop', type: 'custom', giver: 'pearl', start: 'manual', requires: ['contact', 'tantra'], tokenDirect: true, marker: { x: BW13.LOVE.x, z: BW13.LOVE.z },
      desc: 'Auntie Pearl\'s famous guided exercise. Ninety-two percent success rate. Needs two stamps: Contact Improv and Tantra Basics.', hint: 'The Dome of Second Chances, north end of the village', lockedDesc: 'Two stamps required: Contact Improv 101 and Tantra Basics.' }
  ],
  build(api, g) {
    const R = api.rng;
    BW13.state = { timers: [], introDone: !!BurnsSave.flag(13, 'intro'), cushions: [], carried: [], delivered: 0, bowls: [], ex: null, gaze: null, flare: 0, truckT: 0 };
    const S = BW13.state;
    /* ---------------- signs + textures first (stable atlas layout) ---------------- */
    S.tx = { sched: BURNS_ATLAS.sign('WORKSHOP VILLAGE · TODAY\n9:00  CONTACT IMPROV 101 .......... THE FLOOR\n9:00  FINDING YOUR LONG-LOST LOVE ... DOME OF SECOND CHANCES\n10:00 TANTRA BASICS ................. TENT OF BREATH\n11:00 SOUND BATH w/ SOLSTICE ......... THE SOUND DOME\nNOON  RADICAL BELONGING (FOREVER) ..... THE PINK CIRCLE\n1:00  ADVANCED NAPPING ............... NAP TENT\n2:00  ADVANCED ACRO YOGA (please no) ... THE BALLS\n3:00  GOAT YOGA (NO GOATS)   4:00 MANIFESTING PARKING', { bg: '#fff8ea', fg: '#2a1a3a', size: 19, border: '#ff4fb0', font: FONT_UI, pad: 12 }) };
    /* ---------------- ground ---------------- */
    api.paint((c, P, sc) => {
      for (let i = 0; i < 170; i++) { const [px, pz] = P(R.range(-120, 120), R.range(-150, 135)), r = R.range(2, 10) * sc; const g2 = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; g2.addColorStop(0, dark ? 'rgba(160,120,90,0.2)' : 'rgba(250,236,210,0.24)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(px - r, pz - r, r * 2, r * 2); }
      const disc = (x, z, r, col) => { const [px, pz] = P(x, z); const gg = c.createRadialGradient(px, pz, r * 0.2 * sc, px, pz, r * sc); gg.addColorStop(0, col); gg.addColorStop(0.85, col); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.beginPath(); c.arc(px, pz, r * sc, 0, TAU); c.fill(); };
      // walking paths between the workshops
      c.strokeStyle = 'rgba(240,222,196,0.5)'; c.lineCap = 'round'; c.lineWidth = 3.4 * sc;
      const paths = [[[0, 130], [0, 70]], [[0, 50], [0, -90]], [[-8, 58], [-46, 40]], [[8, 58], [46, 36]], [[0, 10], [-48, -48]], [[0, 10], [60, -52]], [[0, 20], [-24, -6]], [[0, 20], [28, -10]], [[10, 66], [44, 76]], [[-110, 131], [110, 131]]];
      for (const [a, b] of paths) { const [x0, z0] = P(a[0], a[1]), [x1, z1] = P(b[0], b[1]); c.beginPath(); c.moveTo(x0, z0); c.quadraticCurveTo((x0 + x1) / 2 + 6 * sc, (z0 + z1) / 2 - 4 * sc, x1, z1); c.stroke(); }
      // the exit road (gate road this way)
      const [ex0, ez] = P(-120, BW13.EXIT.z), [ex1] = P(120, BW13.EXIT.z); c.fillStyle = 'rgba(160,122,96,0.45)'; c.fillRect(ex0, ez - 3.5 * sc, ex1 - ex0, 7 * sc);
      c.strokeStyle = 'rgba(100,72,56,0.3)'; c.lineWidth = 0.35 * sc; for (const o of [-1.2, 1.2]) { c.beginPath(); c.moveTo(ex0, ez + o * sc); c.lineTo(ex1, ez + o * sc); c.stroke(); }
      disc(BW13.PLAZA.x, BW13.PLAZA.z, 17, 'rgba(244,226,198,0.6)');
      c.strokeStyle = 'rgba(255,79,176,0.35)'; c.lineWidth = 0.5 * sc; { const [px, pz] = P(BW13.PLAZA.x, BW13.PLAZA.z); c.beginPath(); c.arc(px, pz, 15.5 * sc, 0, TAU); c.stroke(); }
      disc(BW13.CULT.x, BW13.CULT.z, 9, 'rgba(255,150,205,0.55)');
      disc(BW13.TANTRA.x, BW13.TANTRA.z, 10.5, 'rgba(170,80,60,0.35)');
      disc(BW13.SOUND.x, BW13.SOUND.z, 11, 'rgba(240,236,250,0.5)');
      disc(BW13.LOVE.x, BW13.LOVE.z, 10, 'rgba(255,170,200,0.45)');
      disc(BW13.NAP.x, BW13.NAP.z, 9, 'rgba(170,200,240,0.4)');
      disc(BW13.CUDDLE.x, BW13.CUDDLE.z, 7, 'rgba(255,200,220,0.4)');
      disc(BW13.ACRO.x, BW13.ACRO.z, 8, 'rgba(160,220,200,0.35)');
      disc(BW13.FLOOR.x, BW13.FLOOR.z, 12, 'rgba(140,100,70,0.3)');
    });
    /* ---------------- entrance, sign-in, plaza ---------------- */
    BW13.buildEntrance(api, S);
    BW13.buildPlaza(api, S);
    /* ---------------- the workshops ---------------- */
    BW13.buildContact(api, S);
    BW13.buildTantra(api, S);
    BW13.buildSound(api, S);
    BW13.buildLove(api, S);
    BW13.buildNap(api, S);
    BW13.buildCuddle(api, S);
    BW13.buildAcro(api, S);
    BW13.buildCult(api, S);
    BW13.buildFiller(api, R, S);
    BW13.buildMan(api, S);
    /* ---------------- checkpoints, markers ---------------- */
    api.checkpoint('cp_gate', 6, 118, { yaw: Math.PI, name: 'Workshop Village' });
    api.checkpoint('cp_plaza', 14, 50, { yaw: Math.PI, name: 'The Plaza' });
    api.checkpoint('cp_north', 12, -72, { yaw: Math.PI, name: 'North Workshops' });
    api.marker('plaza', BW13.PLAZA.x, BW13.PLAZA.z, 'Plaza', { col: '#ffe24a' });
    api.marker('floor', BW13.FLOOR.x, BW13.FLOOR.z, 'Floor', { col: '#ffb070' });
    api.marker('tantra', BW13.TANTRA.x, BW13.TANTRA.z, 'Tantra', { col: '#ff6a4a' });
    api.marker('sound', BW13.SOUND.x, BW13.SOUND.z, 'Sound', { col: '#c8a0ff' });
    api.marker('love', BW13.LOVE.x, BW13.LOVE.z, 'Love', { col: '#ff7ab0' });
    api.marker('nap', BW13.NAP.x, BW13.NAP.z, 'Nap', { col: '#8ab0e8' });
    api.marker('cult', BW13.CULT.x, BW13.CULT.z, 'Pink', { col: '#ff4fb0' });
    /* ---------------- pickups ---------------- */
    api.pickup('photo', BW13.ACRO.x + 1, 11.2, BW13.ACRO.z + 5, { id: 'p1' });
    api.pickup('photo', BW13.NAP.x + 3.2, 3.4, BW13.NAP.z + 3.2, { id: 'p2' });
    api.pickup('photo', BW13.SOUND.x, BW13.SOUND.H + 1.9, BW13.SOUND.z, { id: 'p3', hidden: true });
    api.pickup('bag:powder', -40, 0.9, 30);
    api.pickup('bag:khole', 44, 0.9, 24);
    api.pickup('bag:lsd', -30, 0.9, -14);
    api.pickup('bag:weed', 34, 0.9, -4);
    api.pickup('bag:molly', 8, 0.9, -86);
    api.pickup('water', -6, 0.9, 88); api.pickup('water', 30, 0.9, 50); api.pickup('water', -40, 0.9, -30); api.pickup('water', 40, 0.9, -40); api.pickup('water', 12, 0.9, -60);
    api.glowLine(0, 122, 0, 82, 12);
    api.glowRing(BW13.PLAZA.x, BW13.PLAZA.z, 13, 18);
    api.glowArc(-8, 0.9, 56, -42, 0.9, 40, 2.4, 10);
    api.glowArc(8, 0.9, 56, 42, 0.9, 36, 2.4, 10);
    api.glowRing(BW13.FLOOR.x, BW13.FLOOR.z, 7, 12, 1.2);
    api.glowLine(0, 40, 0, -84, 18);
    api.glowArc(-4, 0.9, 6, -44, 0.9, -46, 3, 12);
    api.glowArc(4, 0.9, 6, 56, 0.9, -50, 3, 12);
    api.glowRing(BW13.CUDDLE.x, BW13.CUDDLE.z, 6.6, 10);
    api.glowArc(BW13.ACRO.x - 4, 2.6, BW13.ACRO.z, BW13.ACRO.x, 5.2, BW13.ACRO.z - 1, 1.5, 5);
    api.glowRing(BW13.CULT.x, BW13.CULT.z, 7, 10);
    api.glowRing(BW13.LOVE.x, BW13.LOVE.z, 11.5, 14);
    api.glowArc(-90, 0.9, 100, -60, 0.9, 80, 2, 8);
    api.glowArc(90, 0.9, 100, 70, 0.9, 60, 2, 8);
    // LSD-only: floating chakra discs up to the crystal on the Sound Dome
    api.hidden(() => {
      const steps = [[-40, 1.6, -36], [-43, 3.0, -39], [-46.5, 4.4, -42], [-50, 5.8, -45], [-53.5, 7.2, -48]];
      steps.forEach(([x, y, z], i) => { api.cylinder(x, y - 0.25, z, 1.1, 0.25, burnsHSL(i * 52 + 280, 0.85, 0.62), { e: 0.6, round: 0.08 }); api.glow(x, y + 0.3, z, 1.6, burnsHSL(i * 52 + 280, 0.9, 0.7)); });
    });
    /* ---------------- interactables ---------------- */
    g.interactables = [];
    api.trigger({ x: BW13.NAPDOOR.x + 3, z: BW13.NAP.z, r: 3.5, once: true, when: g2 => g2.missions.state('nap') === 'available', onEnter: g2 => { g2.missions.start('nap', true); g2.banner('HIDDEN CHALLENGE', 'Advanced Napping: lie still on the golden mat.', { col: '#ffd84a' }); } });
  },
  onStart(g) {
    const S = BW13.state, p = g.player;
    // distant scenery that must never be distance-culled
    for (const c of g.world.chunks) if (c.bounds && c.bounds[5] < -250) c.always = true;
    BW13.restore(g);
    if (!S.introDone) BW13.intro(g);
    else g.banner(BurnsWorlds.label(13).toUpperCase() + ' · THE WORKSHOPS', g.missions.isDone('lostlove') ? 'Ticket revoked. Some people never learn. (You.)' : 'Two stamps. One long-lost love.', { col: '#38c8ff' });
    void p;
  },
  onRespawn(g) {
    const p = g.player; p.animOverride = null; p.locked = false;
    const S = BW13.state; if (S.ex && !g.cine) BW13.exerciseAbort(g);
  },
  env(g, env) { const S = BW13.state; if (S && S.clearSky > 0) { env.fogD *= 1 - S.clearSky * 0.65; env.fogMax *= 1 - S.clearSky * 0.4; } },
  update(g, dt) {
    const S = BW13.state;
    BW1213.tick(S, dt);
    BW1213.gateLabels(g);
    // while something is chasing Brady, ACTION always means SPIN (nobody stops him for a chat)
    const chase = g.missions.state('contact') === 'active' || g.missions.state('tantra') === 'active' || g.missions.state('belonging') === 'active' || g.missions.state('sound') === 'active';
    if (chase !== S.chaseMode) {
      S.chaseMode = chase;
      for (const a of g.actors) { if (a.id === 'flow' || a.id === 'klaus' || (a.id && a.id.indexOf('follower') === 0)) continue; if (a.def._nt === undefined) a.def._nt = !!a.def.noTalk; a.def.noTalk = chase ? true : a.def._nt; }
    }
    BW13.updateGrab(g, dt);
    BW13.updateCushions(g, dt);
    BW13.updateBowls(g, dt);
    BW13.updateGaze(g, dt);
    BW13.updateNap(g, dt);
    BW13.updateExercise(g, dt);
    BW13.updateTruck(g, dt);
    if (S.planeOn) { const P = S.plane; S.planeT += dt; P.x = 70 - S.planeT * 15; P.roll = Math.sin(S.planeT * 1.4) * 0.12; P.pitch = 0.04; if (Math.random() < dt * 30) g.fx.add(P.x + 3.4, P.y + 0.05, P.z, 0, 0, 0, 1.4, 0.35, 1.6, [1, 1, 1], 0.3, 'puff', 0); }
    // tokens push the morning along
    const want = Math.min(1, BurnsSave.tokenCount(13) * 0.15);
    if (g.tod < want && g.todTarget === null) g.setTod(want, 0.02);
    if (S.flare > 0) S.flare = Math.max(0, S.flare - dt * 0.12);
  },
  drawSprites(g, R) { BW13.drawSprites(g, R); }
});

/* ============================================================
   builders
   ============================================================ */
BW13.sign = (api, text, x, z, o) => { o = Object.assign({ h: 0.95, style: { bg: '#fff4e0', fg: '#3a1a4a', size: 30, border: '#ff4fb0' } }, o || {}); o.style = Object.assign({ pad: 9 }, o.style, { size: Math.min(30, o.style.size || 30) }); return api.sign(text, x, z, o); };
BW13.buildEntrance = function (api, S) {
  const A = BW13.ARCH;
  api.mesh(A.x, A.z, m => {
    const cols = [];
    for (const sx of [-6, 6]) {
      m.color('#ff4fb0').shine(2); m.roundCyl(sx, 0, 0, 0.7, 0.5, 0.15); m.color('#ffffff'); m.limb(sx, 0.4, 0, sx, 6.6, 0, 0.42, 0.36);
      for (let i = 0; i < 5; i++) { m.color(BURNS_NEON[i], 0.6); m.push(); m.tf(sx, 1.2 + i * 1.1, 0); m.torus(0, 0, 0, 0.43, 0.06, { seg: 14, tseg: 4 }); m.pop(); }
      m.emissive(0); m.color('#38c8ff'); m.ball(sx, 6.9, 0, 0.6); m.shine(0);
      cols.push({ t: 'cyl', x: sx, z: 0, r: 0.5, y0: 0, y1: 7.4 });
    }
    m.color('#ffe24a'); let prev = null; for (let i = 0; i <= 10; i++) { const t = i / 10, x = lerp(-6, 6, t), y = 6.6 + Math.sin(t * Math.PI) * 1.6; if (prev) m.limb(prev[0], prev[1], 0, x, y, 0, 0.18, 0.18); prev = [x, y]; }
    return { cols };
  });
  BW13.sign(api, 'WORKSHOP VILLAGE', A.x, A.z + 0.35, { y: 5.0, h: 1.5, post: false, maxW: 9, style: { bg: '#ff4fb0', fg: '#ffffff', size: 54, border: '#ffe24a', glow: '#ffd0f0' } });
  BW13.sign(api, 'LEARN SOMETHING · UNLEARN EVERYTHING', A.x, A.z + 0.36, { y: 4.1, h: 0.7, post: false, maxW: 8, style: { bg: '#2a1a3a', fg: '#ffe24a', size: 30, border: '#38c8ff' } });
  // the sign-in table (greeters) and an info kiosk
  const T = BW13.SIGNIN;
  api.mesh(T.x, T.z, m => {
    m.color('#38c8ff').shine(1); m.roundBox(0, 0.42, 0, 3.2, 0.84, 1.1, 0.12); m.color('#fff4e0'); m.roundBox(0, 0.86, 0, 3.3, 0.06, 1.2, 0.02);
    for (let i = 0; i < 6; i++) { m.color(BURNS_NEON[i]); m.roundBox(-1.2 + i * 0.3, 0.92, 0.2, 0.22, 0.04, 0.3, 0.01); }
    m.color('#ffd84a').shine(3); BW1213.M.bell(m, 1.2, 0.9, -0.1, 0.12); m.shine(0);
    m.push(); m.tf(-3.4, 0, -1.6); m.color('#ffe24a'); m.roundBox(0, 1.1, 0, 2.0, 2.2, 1.8, 0.25); m.color('#ff4fb0'); m.roundBox(0, 2.3, 0, 2.4, 0.2, 2.2, 0.08); m.color('#2a1a3a'); m.roundBox(0, 1.35, 0.92, 1.3, 0.7, 0.04, 0.02); m.pop();
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 0.55, y0: 0, y1: 0.9 }, { t: 'box', x: -3.4, z: -1.6, hx: 1.2, hz: 1.1, y0: 0, y1: 2.4 }] };
  });
  BW13.sign(api, 'SIGN IN · GET A PASSPORT', T.x, T.z + 1.2, { y: 1.0, h: 0.6, style: { bg: '#fff4e0', fg: '#3a1a4a', size: 30, border: '#38c8ff' } });
  api.npc({ id: 'greeterF', name: 'GREETER DAISY', type: 'greeter_f', seed: 2, x: T.x - 0.8, z: T.z - 1.1, yaw: 0, chatter: true, chat: ['WELCOME HOOOME!', 'Sign in, sign up, sign everything!'], talk(g, a) { BW13.greeterTalk(g, a); } });
  api.npc({ id: 'greeterM', name: 'GREETER BOOMER', type: 'greeter_m', seed: 3, x: T.x + 0.9, z: T.z - 1.1, yaw: 0, chatter: true, chat: ['Collect all the stamps!', 'Hug for the road?'], talk(g, a) { BW13.greeterTalk(g, a); } });
};
BW13.greeterTalk = function (g, a) {
  const S = BW13.state, dz = g.actor('greeterF'), bm = g.actor('greeterM');
  if (!g.flag('passport')) {
    g.say(dz || a, ['WELCOME HOOOME to Workshop Village! Sign in, sign up, sign EVERYTHING!']);
    g.say('brady', ['Hi. I need the "Finding Your Long-Lost Love" workshop. Nine o\'clock.']);
    g.say(bm || a, ['Ooh, ADVANCED level! That one needs two stamps in your Workshop Passport.', 'Contact Improv 101 and Tantra Basics still have spots! Here\'s your passport!'], () => { g.flag('passport', true); g.banner('WORKSHOP PASSPORT', 'Two stamps needed: Contact Improv 101 + Tantra Basics', { col: '#38c8ff', big: true }); burnsSfx('map_open', null, 'secret'); });
    g.say(dz || a, ['Hug for the road? ...Too late. Already hugged you.']);
    return;
  }
  const st = (g.missions.isDone('contact') ? 1 : 0) + (g.missions.isDone('tantra') ? 1 : 0);
  if (g.missions.isDone('lostlove')) g.say(a, ['Wait, they REVOKED your ticket? ...Welcome back anyway. Unofficially. Shh.']);
  else if (st >= 2) g.say(a, ['Two stamps! The Dome of Second Chances is at the north end. Go get your love, bun man!']);
  else g.say(a, [`${st} of 2 stamps! Contact Improv is at The Floor (west), Tantra is in the Tent of Breath (east).`]);
};
BW13.buildPlaza = function (api, S) {
  const B = BW13.BOARD;
  api.mesh(B.x, B.z, m => {
    m.color('#8a5a3a'); for (const sx of [-4.4, 4.4]) m.limb(sx, 0, 0, sx, 5.2, 0, 0.18, 0.16);
    m.color('#ff4fb0').shine(1); m.roundBox(0, 3.0, -0.08, 9.2, 4.0, 0.22, 0.08); m.shine(0);
    m.color('#ffffff'); m.decal(0, 3.0, 0.035, 8.6, Math.min(3.7, 8.6 / (S.tx.sched.aspect || 2.3)), S.tx.sched);
    m.color('#ffe24a'); m.roundBox(0, 5.15, -0.08, 9.6, 0.28, 0.4, 0.1);
    return { cols: [{ t: 'box', x: 0, z: -0.08, hx: 4.6, hz: 0.18, y0: 0.9, y1: 5.1, walk: true }, { t: 'cyl', x: -4.4, z: 0, r: 0.2, y0: 0, y1: 5.2 }, { t: 'cyl', x: 4.4, z: 0, r: 0.2, y0: 0, y1: 5.2 }] };
  });
  // the Kombucha (water) cart
  const K = BW13.KOMBUCHA;
  api.mesh(K.x, K.z, m => {
    m.color('#7aff5a').shine(1); m.roundBox(0, 0.85, 0, 2.0, 1.0, 1.0, 0.14); m.color('#ffffff'); m.roundBox(0, 1.38, 0, 2.1, 0.08, 1.1, 0.03); m.shine(0);
    m.color('#3a3a40'); for (const sx of [-0.7, 0.7]) { m.push(); m.tf(sx, 0.32, 0.55, 0, 0, Math.PI / 2); m.torus(0, 0, 0, 0.26, 0.06); m.pop(); }
    for (let i = 0; i < 5; i++) { m.color(['#ffb040', '#ff6a8a', '#7ad8ff', '#c8ff7a', '#ffe24a'][i], 0.2).shine(3); m.lathe([[0.08, 1.42], [0.09, 1.6], [0.04, 1.72], [0.03, 1.8]], { seg: 8 }); m.push(); m.tf(-0.8 + i * 0.4, 0, 0.1); m.lathe([[0.08, 1.42], [0.09, 1.6], [0.04, 1.72], [0.03, 1.8]], { seg: 8 }); m.pop(); }
    m.emissive(0).shine(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.05, hz: 0.55, y0: 0, y1: 1.45 }] };
  });
  BW13.sign(api, 'KOMBUCHA\n(it\'s water)', K.x, K.z + 1.4, { y: 1.5, h: 0.75, post: false, style: { bg: '#2a4a1a', fg: '#c8ff7a', size: 32, border: '#7aff5a' } });
  api.npc({ id: 'kai', name: 'KAI', type: 'burner', seed: 61, x: K.x + 1.6, z: K.z + 0.6, yaw: 1.2, lines: ['Free kombucha! Well, free water. The kombucha exploded.', 'Long story. Mostly a short one. It was loud.'], gift: { kind: 'water' }, chat: ['Hydrate! Ferment! Mostly hydrate!'] });
  // plaza life: a crusty heckler, burner mom + kid, the overzealous ranger, two workshop recruiters
  api.npc({ name: 'GRIT, SINCE \'96', type: 'crusty', seed: 11, x: B.x - 6, z: B.z - 2.5, yaw: 0.3, chat: ['Workshops? We learned by getting it wrong in a whiteout.', 'Back in my day the only workshop was the DPW yard.'], lines: ['Workshops? In my day we learned by doing it wrong in a whiteout.', 'Contact improv used to be called "the camp next to you was too close".'] });
  api.npc({ name: 'BURNER MOM', type: 'burnermom', seed: 4, x: 9, z: 66, yaw: -0.4, lines: ['WOOO! I signed up for EVERY workshop! Twice!', 'Photo with the bun man! Both cameras! Here, take some glow sticks, sweetie!'], gift: { kind: 'glowstick', n: 15 } });
  api.npc({ name: 'HER KID', type: 'burnerkid', seed: 4, x: 10.6, z: 65, yaw: -0.9, lines: ['Please stop her from signing up for Tantra.', 'She already did. Didn\'t she.'] });
  api.npc({ id: 'ranger', name: 'RANGER BRICE', type: 'ranger', seed: 2, x: -12, z: 52, behavior: 'walk', path: [[-12, 52], [12, 52], [12, 70], [-12, 70]], speed: 1.1,
    chat: ['Your bike light is five lumens too dim. I\'m writing that down.', 'Per the principles, that hug was a little long.', 'I\'m not a cop. Very different hat.'],
    lines: ['Per the principles, I have to explain the workshop schedule to you. All of it. Starting in 1986.', '...You left. Mid-explanation. I\'m writing that down.'] });
  const pitches = ['BREATHWORK!', 'CACAO CIRCLE!', 'SOUND BATH!', 'PRIMAL SCREAM!', 'GOAT YOGA (NO GOATS)!', 'KOMBUCHA 101!', 'MANIFEST PARKING!', 'LAUGHTER YOGA!'];
  for (const [x, z, s] of [[-20, 30, 1], [20, 16, 2]]) {
    const spec = Object.assign(BW1213.base(700 + s, { face: 'friendly', top: { kind: 'tee', col: s === 1 ? '#ffe24a' : '#38c8ff' }, bottom: { kind: 'shorts', col: '#2a2a34' }, shoes: { kind: 'sneakers', col: '#ffffff' }, acc: ['lanyard', 'bracelets'], prop: 'clipboard' }), { key: 'bw13:recruiter' + s });
    api.enemy({ spec, name: 'WORKSHOP RECRUITER', x, z, behavior: 'pitcher', pitches, hp: 2, cooldown: 2.8, aggro: 12, defeatLine: 'Fine! But Breathwork is at 3!' });
  }
  api.crowd(-4, 46, 4, 3, { types: ['burner', 'tutu', 'furcoat'], behaviors: ['dance', 'wander', 'dance'] });
};
BW13.buildContact = function (api, S) {
  const F = BW13.FLOOR;
  api.mesh(F.x, F.z, m => {
    const cols = [];
    m.color('#b88a5a').shine(1); m.roundCyl(0, 0, 0, F.r, 0.26, 0.1, { seg: 32 }); m.shine(0);
    m.color('#a07a4a'); for (let i = -4; i <= 4; i++) m.box(i * 2.2, 0.262, 0, 0.04, 0.004, Math.sqrt(Math.max(0, F.r * F.r - i * i * 4.84)) * 1.9);
    cols.push({ t: 'cyl', x: 0, z: 0, r: F.r, y0: 0, y1: 0.26 });
    const mast = [], hts = [6.4, 4.6, 6.4, 4.6];
    for (let k = 0; k < 4; k++) { const a = Math.PI / 4 + k * Math.PI / 2, x = Math.sin(a) * (F.r + 1.2), z = Math.cos(a) * (F.r + 1.2); m.color('#e8e0d0'); m.limb(x, 0, z, x, hts[k], z, 0.12, 0.09); m.color('#ff7a2a'); m.ball(x, hts[k] + 0.05, z, 0.16); mast.push([x, hts[k] - 0.2, z]); cols.push({ t: 'cyl', x, z, r: 0.14, y0: 0, y1: hts[k], camPass: true }); }
    BW1213.M.sail(m, mast[0], mast[1], mast[2], mast[3], '#ffb070', 0.9);
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ffd0a0', pool: 12, i: 0.25 }] };
  });
  BW13.sign(api, 'CONTACT IMPROV 101\n"THE FLOOR"', F.x + 9, F.z + 9, { yaw: 0.8, h: 1.1 });
  api.npc({ id: 'willow', name: 'WILLOW (FACILITATOR)', spec: Object.assign(BW1213.base(81, { face: 'lashes', body: { h: 0.98, w: 0.9, fem: true }, skin: '#f0c8a8', skinSh: '#d0a888', hair: { style: 'wavy', col: '#c86a3a', hi: '#e89a5a' }, top: { kind: 'tank', col: '#ff9a5a', pattern: 'tiedye' }, bottom: { kind: 'leggings', col: '#5a3a8a' }, shoes: { kind: 'barefoot' }, hat: { kind: 'bandana', col: '#ffe24a' }, acc: ['bracelets', 'beads'] }), { key: 'bw13:willow' }),
    x: F.x + 6, z: F.z + 6, yaw: -2.4, behavior: 'idle', anim: 'bw1213_heart', talk(g, a) { BW13.willowTalk(g, a); } });
  // contact improv pairs (rolling, leaning, flowing)
  const pairs = [[-4, -2], [2, -5], [4, 3], [-3, 4]];
  pairs.forEach(([x, z], i) => { for (let k = 0; k < 2; k++) api.npc({ type: ['burner', 'tutu', 'ledsuit', 'furcoat'][(i + k) % 4], seed: 820 + i * 2 + k, x: F.x + x + (k ? 0.7 : -0.7), z: F.z + z, y: 0.26, yaw: k ? -Math.PI / 2 : Math.PI / 2, behavior: 'bw12still', anim: k ? 'bw1213_flow' : 'bw1213_hug', chat: ['Share your weight!', 'Trust the floor.', 'We are one organism.', 'Ow. Still flowing.'], lines: ['We\'ve been flowing since 7 a.m. I can\'t feel my legs. It\'s beautiful.'] }); });
  api.npc({ name: 'BURNEY', type: 'burney', seed: 5, x: F.x + 11, z: F.z - 3, yaw: -1.6, lines: ['Hold that pose! ...That\'s not a pose, that\'s a man fleeing.', 'I\'ve got 9,000 photos of this workshop. All blurry. Art!'] });
  // Flow: relentlessly flowing (cartoon censor: a big pixel mosaic + a fanny pack)
  const fs = Object.assign(BW1213.base(91, { face: 'goofy', skin: '#e8b48c', skinSh: '#c8906a', hair: { style: 'bun', col: '#6a4428', hi: '#a87848' }, beard: { col: '#6a4428', len: 0.05 }, top: { kind: 'none' }, bottom: { kind: 'shorts', col: '#e8b48c' }, shoes: { kind: 'barefoot' }, hat: { kind: 'bandana', col: '#7aff5a' }, acc: ['bw13mosaic', 'bw13fannypack', 'beads'], body: { h: 1.02, w: 1.04 } }), { key: 'bw13:flow' });
  api.npc({ id: 'flow', name: 'FLOW', spec: fs, x: F.x - 1, z: F.z, y: 0.26, yaw: 0.5, behavior: 'bw13flow', always: true, chatter: false, hittable: true, talk(g, a) { return BW13.flowTalk(g, a); } });
};
BW13.willowTalk = function (g, a) {
  const st = g.missions.state('contact');
  if (!g.flag('passport')) { g.say(a, ['Welcome! Sign in at the greeters\' table first, then come flow with us.']); return; }
  if (st === 'available') { BW13.contactIntro(g); return; }
  if (st === 'active') { g.say(a, ['The exercise is: find your way through the flow. Flow is... very committed.']); return; }
  g.say(a, ['You avoided contact for the entire class. That\'s technically the opposite. Growth!']);
};
BW13.flowTalk = function (g, a) {
  if (g.missions.state('contact') === 'active') return true;
  g.say(a, g.missions.isDone('contact') ? [['Brother! Same time tomorrow?', 'Free-flow Friday. You\'re on the list. You\'ve always been on the list.'][Math.floor(Math.random() * 2)]] : ['Brother. Wanna flow?', 'I wear my truth. And a fanny pack. For snacks.']);
  return true;
};
BW13.buildTantra = function (api, S) {
  const T = BW13.TANTRA;
  api.mesh(T.x, T.z, m => {
    const cols = BW1213.M.tent(m, T.R, T.H, { cols: ['#e8402a', '#ff8a2a', '#c8204a'], stripes: 12, door: 1.15, doorH: 3.0, flag: '#ffe24a' });
    m.color('#7a2a3a'); m.roundCyl(0, 0, 0, 6.6, 0.05, 0.02, { seg: 28 }); m.color('#c84a3a'); m.roundCyl(0, 0.05, 0, 4.2, 0.04, 0.02, { seg: 24 });
    const r = mulberry32(14);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + 0.3; BW1213.M.cushion(m, Math.sin(a) * 4.6, 0.05, Math.cos(a) * 4.6, 0.85, 0.24, 0.85, r.pick(['#ffb040', '#ff6a8a', '#c84aa0', '#ffd84a', '#ff8a5a']), a); }
    // River's pile (delivered cushions appear on it), incense
    m.color('#8a5a3a'); m.roundCyl(0, 0.05, 0, 0.9, 0.3, 0.08);
    for (const [x, z] of [[2.2, -2.6], [-2.4, -2.2]]) { m.color('#3a2a1a'); m.roundCyl(x, 0, z, 0.12, 0.2, 0.03); m.color('#5a3a2a'); m.limb(x, 0.2, z, x + 0.05, 0.62, z, 0.006, 0.006); }
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ff9a6a', pool: 9, i: 0.45 }, { x: 0, y: 3.5, z: 0, s: 2.2, c: '#ffb080' }] };
  }, { yaw: -Math.PI / 2 });
  BW13.sign(api, 'TANTRA BASICS\nBREATHE TOGETHER', T.x - T.R - 1.4, T.z + 3.2, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#5a1a2a', fg: '#ffd0a0', size: 36, border: '#ff8a2a' } });
  api.npc({ id: 'river', name: 'RIVER (FACILITATOR)', spec: Object.assign(BW1213.base(93, { face: 'serene', skin: '#c88a64', skinSh: '#a86a44', hair: { style: 'long', col: '#1a1410', hi: '#4a3a2a' }, beard: { col: '#1a1410', len: 0.06 }, top: { kind: 'long', col: '#f0e0c8' }, coat: { kind: 'robe', col: '#c8643a', trim: '#e8a060' }, bottom: { kind: 'pants', col: '#e8d8c0' }, shoes: { kind: 'barefoot' }, acc: ['beads', 'bracelets'] }), { key: 'bw13:river' }),
    x: T.x + 2.1, z: T.z, yaw: -Math.PI / 2, behavior: 'bw12still', anim: 'bw1213_floorsit', chatter: false, talk(g, a) { BW13.riverTalk(g, a); } });
  // the circle: couples breathing, and an extremely normal burner in a jester hat
  const circ = (i, type, seed, o) => { const a = i / 10 * TAU + 0.3, x = T.x + Math.cos(a) * 4.6, z = T.z - Math.sin(a) * 4.6; api.npc(Object.assign({ type, seed, x, z, yaw: Math.atan2(T.x - x, T.z - z), behavior: 'bw12still', anim: 'bw1213_breathe', chatter: false, lines: ['Inhale... exhale... is that guy looking at us?'] }, o || {})); };
  circ(1, 'burner', 931); circ(2, 'tutu', 932); circ(6, 'furcoat', 933); circ(7, 'burner', 934);
  circ(4, 'undercovercop', 1, { id: 'cop', name: 'TOTALLY NORMAL BURNER', anim: 'bw1213_floorsit', chatter: true, chat: ['Groovy.', 'I am also... breathing.', 'Is this a normal amount of eye contact?'], lines: ['Greetings, fellow burner. I am simply here for the... tantra.', 'Groovy. (He flashes a badge by accident and hides it in his jester hat.)'] });
  // Klaus: sweet, enthusiastic, nine years without a partner. In a lovely floral sundress.
  const ks = Object.assign(BW1213.base(97, { face: 'goofy', skin: '#f2c8a8', skinSh: '#d2a888', hair: { style: 'short', col: '#e8c878', hi: '#fff0b0' }, beard: { col: '#d8b868', trim: true, len: 0.03 }, top: { kind: 'tank', col: '#e8d8f0', pattern: 'pastelFloral' }, coat: { kind: 'robe', col: '#f4c8dc', trim: '#ffe8f0', pattern: 'pastelFloral' }, bottom: { kind: 'pants', col: '#f4c8dc' }, shoes: { kind: 'sandals', col: '#a87a4a' }, acc: ['bw13flowercrown', 'bracelets'], body: { h: 1.1, w: 1.05 } }), { key: 'bw13:klaus' });
  api.npc({ id: 'klaus', name: 'KLAUS', spec: ks, x: T.x + Math.cos(0.3 + 9 / 10 * TAU) * 4.6, z: T.z - Math.sin(0.3 + 9 / 10 * TAU) * 4.6, yaw: -Math.PI / 2, behavior: 'bw13klaus', always: true, chatter: false, hittable: true, talk(g, a) { return BW13.klausTalk(g, a); } });
  // the meditation cushions blown around the village (gated to the mission)
  const spots = [[BW13.SIGNIN.x - 3.4, 2.42, BW13.SIGNIN.z - 1.6], [BW13.KOMBUCHA.x, 1.48, BW13.KOMBUCHA.z], [BW13.CUDDLE.x + 3, 0.2, BW13.CUDDLE.z + 2], [-36, 2.6, 90], [BW13.ACRO.x - 4, 3.4, BW13.ACRO.z]];
  const cc = ['#ffb040', '#ff6a8a', '#c84aa0', '#ffd84a', '#ff8a5a'];
  spots.forEach((p, i) => { const mv = api.mover(m => { BW1213.M.cushion(m, 0, -0.12, 0, 0.75, 0.24, 0.75, cc[i]); m.color('#ffe24a', 0.4); m.ball(0.3, 0.1, 0.3, 0.05); m.emissive(0); return { cols: [] }; }); mv.x = p[0]; mv.y = p[1] + 0.2; mv.z = p[2]; mv.visible = false; S.cushions.push({ mv, home: p.slice(), state: 'home', i }); });
};
BW13.riverTalk = function (g, a) {
  const st = g.missions.state('tantra');
  if (!g.flag('passport')) { g.say(a, ['Breathe in... and go sign in with the greeters. Breathe out.']); return; }
  if (st === 'available') { BW13.tantraIntro(g); return; }
  if (st === 'active') { g.say(a, [`${BW13.state.delivered} of five cushions. Breathe. Run. Breathe.`]); return; }
  g.say(a, ['The cushions are home. Your breath was... mostly running. But there was breath.']);
};
BW13.klausTalk = function (g, a) {
  const st = g.missions.state('twinflame');
  if (g.missions.state('tantra') === 'active') return true;
  if (g.missions.isDone('twinflame')) { g.say(a, ['Twin flame! Ja! We are breathing in sync since forty minutes. Wunderbar!']); return true; }
  if (st === 'available') { g.say(a, ['You know someone? Who wants to breathe with Klaus? For real?', { who: 'brady', text: 'I know someone who stares into strangers\' souls for fun.' }, 'Then take me! I am ready! I have been ready for nine years!'], () => g.missions.start('twinflame')); return true; }
  if (st === 'active') { g.say(a, ['Lead the way, friend! I follow! Like in tantra, but in a direction!']); return true; }
  if (g.missions.isDone('tantra')) { g.say(a, ['Everyone always runs from Klaus. Maybe my breathing is too... enthusiastic.', 'Maybe the universe has someone for Klaus. Maybe not today.']); return true; }
  g.say(a, ['Hallo! I am Klaus! Nine years I come to Tantra Basics, never once a partner.', 'But today... I have a feeling. A partner feeling!']);
  return true;
};
BW13.buildSound = function (api, S) {
  const D = BW13.SOUND;
  api.mesh(D.x, D.z, m => {
    const cols = BW1213.M.domeShell(m, D.R, D.H, { cols: ['#fbf8f2', '#ece4f8'], stripes: 10, door: 0.72, doorH: 3.1, inner: '#d8c8e8', ei: 0.18 });
    m.color('#c8a0ff', 0.6).shine(3); m.push(); m.tf(0, D.H - 0.1, 0); m.lathe([[0, 0], [0.6, 0.55], [0.6, 0.75], [0, 1.6]], { seg: 6 }); m.pop(); m.emissive(0).shine(0);
    // tiers of seating around the inside wall (gentle steps up to the big gong)
    const tiers = [[7.0, 0.55], [7.9, 1.1], [8.7, 1.65]];
    for (const [rr, h] of tiers) for (let k = 0; k < 14; k++) {
      const a = (k + 0.5) / 14 * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.62) continue;
      m.color(h > 1.5 ? '#a888c8' : h > 1 ? '#b8a0d8' : '#c8b8e8'); m.push(); m.tf(Math.sin(a) * rr, 0, Math.cos(a) * rr, a); m.roundBox(0, h / 2, 0, 2 * rr * Math.sin(Math.PI / 14) + 0.25, h, 0.95, 0.08); m.pop();
      cols.push({ t: 'box', x: Math.sin(a) * rr, z: Math.cos(a) * rr, hx: rr * Math.sin(Math.PI / 14) + 0.12, hz: 0.47, y0: 0, y1: h, yaw: a });
    }
    m.color('#e8e0f4'); m.roundCyl(0, 0, 0, 2.4, 0.08, 0.03, { seg: 24 });
    // the big gong on its stand (north side, up by the top tier)
    const ga = Math.PI, gx = Math.sin(ga) * 7.2, gz = Math.cos(ga) * 7.2;
    m.color('#5a3a2a'); m.limb(gx - 1.3, 0, gz, gx - 1.3, 4.6, gz, 0.08, 0.07); m.limb(gx + 1.3, 0, gz, gx + 1.3, 4.6, gz, 0.08, 0.07); m.limb(gx - 1.4, 4.5, gz, gx + 1.4, 4.5, gz, 0.07, 0.07);
    m.color('#d8a83a').shine(3); m.push(); m.tf(gx, 3.0, gz, 0, Math.PI / 2, 0); m.roundCyl(0, -0.04, 0, 1.0, 0.08, 0.03, { seg: 24 }); m.pop(); m.shine(0);
    cols.push({ t: 'cyl', x: gx - 1.3, z: gz, r: 0.09, y0: 0, y1: 4.6, camPass: true }, { t: 'cyl', x: gx + 1.3, z: gz, r: 0.09, y0: 0, y1: 4.6, camPass: true });
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#d8c0ff', pool: 10, i: 0.4 }, { x: 0, y: D.H + 0.6, z: 0, s: 3, c: '#c8a0ff' }] };
  }, { yaw: Math.PI / 2 });
  BW13.sign(api, 'SOUND BATH\nw/ SOLSTICE', BW13.SOUNDDOOR.x + 1.6, D.z + 3.4, { yaw: Math.PI / 2, h: 1.0, style: { bg: '#f4f0ff', fg: '#5a3a8a', size: 36, border: '#c8a0ff' } });
  // the five singing bowls (on the tiers + the big gong); rung = glowing
  const rot = a => a + Math.PI / 2;
  const bowlAt = [[rot(1.0), 7.0, 0.55], [rot(-1.4), 7.9, 1.1], [rot(2.2), 8.7, 1.65], [rot(-2.4), 7.0, 0.55], [Math.PI / 2 + Math.PI, 7.2, 2.4]];
  bowlAt.forEach(([a, rr, y], i) => {
    const big = i === 4, x = D.x + Math.sin(a) * rr, z = D.z + Math.cos(a) * rr;
    if (!big) api.mesh(x, z, m => { m.color(['#d8a83a', '#c8c8d0', '#b87a3a', '#e0b860'][i]).shine(3); m.lathe([[0, 0], [0.24, 0.02], [0.36, 0.14], [0.4, 0.3], [0.37, 0.31], [0.33, 0.16], [0, 0.06]], { seg: 16 }); m.shine(0); m.color('#5a3a8a'); m.roundCyl(0, -0.06, 0, 0.3, 0.06, 0.02); return { cols: [] }; }, { y });
    S.bowls.push({ x: big ? D.x - 7.2 + 0.01 : x, y: big ? 3.0 : y + 0.3, z: big ? D.z : z, rung: false, k: 0, big });
  });
  // Solstice: the ego-death healer (and the twin-flame hunt)
  api.npc({ id: 'solstice', name: 'SOLSTICE', type: 'healer', seed: 5, x: BW13.SOUNDDOOR.x + 2.5, z: D.z - 2.5, yaw: Math.PI / 2, behavior: 'bw13healer', always: true, chatter: false, talk(g, a) { return BW13.solsticeTalk(g, a); } });
};
BW13.solsticeTalk = function (g, a) {
  const st = g.missions.state('sound');
  if (g.missions.isDone('twinflame')) { g.say(a, ['Twin flame found. I\'m not ghosting him on Monday. Maybe Tuesday. Probably never.']); return true; }
  if (st === 'available') { g.say(a, ['I achieved ego death on Tuesday. Best thing that ever happened to me. Me, specifically.', 'Welcome to my Sound Bath. Ring the five singing bowls and let the vibrations wash your aura. It\'s very dusty.', 'Also, I may look into your soul. Unsolicited. It\'s sort of my thing.'], () => g.missions.start('sound')); return true; }
  if (st === 'active') { g.say(a, ['Ring the bowls. Don\'t fight the gaze. Okay, fight the gaze a little.']); return true; }
  g.say(a, ['You are four percent more enlightened. I\'m at a hundred. Obviously.', 'My twin flame is out there. I can feel it. Probably wearing something floral.']);
  return true;
};
BW13.buildLove = function (api, S) {
  const L = BW13.LOVE;
  api.mesh(L.x, L.z, m => {
    const cols = BW1213.M.domeShell(m, L.R, L.H, { cols: ['#ff9ac0', '#ffc8dc'], stripes: 12, door: 0.8, doorH: 3.0, inner: '#e87aa8', ei: 0.22 });
    m.color('#ff4f8a', 0.5); m.push(); m.tf(0, L.H + 0.7, 0, 0, 0, 0); m.extrude(BW1213.M.heartPts(0.9), 0.25); m.pop(); m.emissive(0);
    const r = mulberry32(9), lights = [];
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; if (Math.abs(BurnsM.wrap(a)) < 0.3) continue; BW1213.M.cushion(m, Math.sin(a) * 4.2, 0, Math.cos(a) * 4.2, 0.9, 0.26, 0.9, i === 4 ? '#ffe24a' : r.pick(['#ff7ab0', '#ffd0e0', '#c84a8a', '#ffb0c8']), a); }
    BW1213.M.cushion(m, 0, 0, 0, 1.1, 0.3, 1.1, '#ff4f8a');
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.4, rr = 2.8 + (i % 2) * 2.2, y = 4.6 - (i % 3) * 0.6; m.color('#5a3a3a'); m.limb(Math.sin(a) * rr, y + 0.25, Math.cos(a) * rr, Math.sin(a) * rr, y + 1.6, Math.cos(a) * rr, 0.01, 0.01); m.color('#ff6aa0', 0.75); m.push(); m.tf(Math.sin(a) * rr, y, Math.cos(a) * rr, a); m.extrude(BW1213.M.heartPts(0.22), 0.14); m.pop(); m.emissive(0); lights.push({ x: Math.sin(a) * rr, y, z: Math.cos(a) * rr, s: 1.1, c: '#ff8ab8' }); }
    lights.push({ x: 0, y: 0, z: 0, s: 0, c: '#ff8ab8', pool: 9, i: 0.45 });
    return { cols, lights };
  });
  BW13.sign(api, 'FINDING YOUR LONG-LOST LOVE\n9:00 · TWO STAMPS REQUIRED', L.x + 4.4, BW13.LOVEDOOR.z + 1.2, { h: 1.0, style: { bg: '#fff0f6', fg: '#a01a5a', size: 34, border: '#ff4f8a' } });
  api.npc({ id: 'pearl', name: 'AUNTIE PEARL', spec: Object.assign(BW1213.base(95, { face: 'mom', body: { h: 0.92, w: 1.02, fem: true }, skin: '#b07850', skinSh: '#905830', hair: { style: 'bun', col: '#d8d8dc', hi: '#ffffff' }, glasses: 'round', top: { kind: 'long', col: '#c86a8a', pattern: 'knit' }, coat: { kind: 'kimono', col: '#7a3a6a', trim: '#e8a0c0' }, bottom: { kind: 'pants', col: '#4a2a4a' }, shoes: { kind: 'dad', col: '#f4f0e8' }, acc: ['beads', 'bw13glasschain'], prop: 'guide' }), { key: 'bw13:pearl' }),
    x: BW13.LOVEDOOR.x - 2.2, z: BW13.LOVEDOOR.z + 0.6, yaw: 0.3, behavior: 'idle', chatter: false, talk(g, a) { BW13.pearlTalk(g, a); } });
  const parts = [[1, 'burner', 961], [2, 'tutu', 962], [3, 'furcoat', 963], [5, 'burner', 964], [6, 'ledsuit', 965]];
  for (const [i, type, seed] of parts) { const a = i / 8 * TAU, x = L.x + Math.sin(a) * 4.2, z = L.z + Math.cos(a) * 4.2; api.npc({ type, seed, x, z, yaw: Math.atan2(L.x - x, L.z - z), behavior: 'bw12still', anim: 'bw1213_floorsit', chatter: false, lines: [['I lost my love at Center Camp in 2011. Pearl says he\'s "nearby". He\'s been nearby for 14 years.', 'I\'m here to find my long-lost hat. It counts.', 'Ninety-two percent! I\'m the eight percent. Third year.', 'Shh. I\'m visualizing.', 'My long-lost love is a burrito I left in a cooler.'][parts.findIndex(q => q[0] === i)]] }); }
};
BW13.pearlTalk = function (g, a) {
  const st = g.missions.state('lostlove');
  if (g.missions.isDone('lostlove')) { g.say(a, ['Go get her, honey. Even if they kicked you out. ESPECIALLY then.']); return; }
  if (st === 'active') return;
  const n = (g.missions.isDone('contact') ? 1 : 0) + (g.missions.isDone('tantra') ? 1 : 0);
  if (n < 2) { g.say(a, ['Finding Your Long-Lost Love, nine o\'clock sharp. Ninety-two percent success rate.', `Two stamps in your Workshop Passport, honey. You\'ve got ${n}. Contact Improv and Tantra Basics.`]); return; }
  g.say(a, ['Contact Improv AND Tantra Basics? Oh, you\'ve been through it. Come on in, baby.'], () => BW13.exerciseStart(g));
};
BW13.buildNap = function (api, S) {
  const N = BW13.NAP;
  api.mesh(N.x, N.z, m => {
    const cols = BW1213.M.domeShell(m, N.R, N.H, { cols: ['#8ab0e8', '#c8dcf4'], stripes: 8, door: 0.95, doorH: 2.6, inner: '#6a88c0', ei: 0.15 });
    const r = mulberry32(5);
    for (let i = 0; i < 6; i++) { const x = -3 + (i % 3) * 2.6, z = (i < 3 ? -2.8 : 0.4); m.color(r.pick(['#5a7ab8', '#7a9ad0', '#a0b8e0'])); m.roundBox(x, 0.08, z, 1.1, 0.16, 2.1, 0.06); BW1213.M.cushion(m, x, 0.16, z - 0.75, 0.6, 0.18, 0.35, '#f4f0ff'); }
    m.color('#ffd84a', 0.3).shine(2); m.roundBox(1.8, 0.1, 3.0, 1.2, 0.2, 2.2, 0.08); m.emissive(0).shine(0); BW1213.M.cushion(m, 1.8, 0.2, 2.2, 0.7, 0.2, 0.4, '#fff4c0');
    // the pillow mountain (photo on top)
    for (let k = 0; k < 7; k++) BW1213.M.cushion(m, 3.2 + (k % 2) * 0.3, k * 0.32, -3.2 + (k % 3) * 0.2, 1.6 - k * 0.12, 0.34, 1.5 - k * 0.12, r.pick(['#f4f0ff', '#c8dcf4', '#ffd0e0', '#fff4c0']), k * 0.4);
    cols.push({ t: 'box', x: 3.3, z: -3.1, hx: 0.75, hz: 0.7, y0: 0, y1: 2.3 }, { t: 'box', x: 1.8, z: 3.0, hx: 0.6, hz: 1.1, y0: 0, y1: 0.3 });
    return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#a8c8ff', pool: 8, i: 0.35 }] };
  }, { yaw: -Math.PI / 2 });
  BW13.sign(api, 'ADVANCED NAPPING\nSHHH · NO FLOWING', BW13.NAPDOOR.x - 1.4, N.z + 3.0, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#1a2a4a', fg: '#c8dcff', size: 36, border: '#8ab0e8' } });
  // golden mat (rotated: local +x -> world +z because of the tent yaw)
  S.goldMat = { x: N.x - 3.0, z: N.z + 1.8 };
  api.npc({ name: 'GUY WHO PARTIED TOO HARD', type: 'partiedtoohard', seed: 3, x: N.x + 0.4, z: N.z + 3.0, yaw: 0, behavior: 'sleep', chatter: false, onWake(g, a) { a.say(['What day is it? Is this the nap workshop? I\'ve been here since Tuesday.', 'Five more minutes. Five more days.'][Math.floor(Math.random() * 2)], 3); } });
  api.npc({ type: 'burner', seed: 1001, x: N.x - 2.8, z: N.z - 0.2, behavior: 'sleep', chatter: false, lines: ['Zzz... certified... zzz...'] });
};
BW13.buildCuddle = function (api, S) {
  const C = BW13.CUDDLE;
  api.mesh(C.x, C.z, m => {
    m.color('#ffc0d8'); m.roundCyl(0, 0, 0, 5, 0.18, 0.08, { seg: 28 });
    const r = mulberry32(21);
    for (let i = 0; i < 14; i++) { const a = r() * TAU, rr = 1 + r() * 3.6; BW1213.M.cushion(m, Math.sin(a) * rr, 0.18, Math.cos(a) * rr, 0.7 + r() * 0.3, 0.22, 0.6 + r() * 0.3, r.pick(['#ffffff', '#ff9ac0', '#c8a0ff', '#9adcff', '#fff0a0']), r() * 3); }
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 5, y0: 0, y1: 0.18 }] };
  });
  BW13.sign(api, 'CUDDLE PUDDLE 101\nASK FIRST · FUR WELCOME', C.x + 5.5, C.z + 4.5, { yaw: 0.8, h: 1.0 });
  api.npc({ name: 'FLUFFERNUTTER', type: 'furry', seed: 7, x: C.x + 1.2, z: C.z - 0.6, y: 0.18, yaw: 2.6, anim: 'hug', lines: ['Free hugs! Consensual hugs! Fur included!', 'It\'s a hundred and four degrees in this suit. Totally worth it.', 'Here, take some glow sticks. They match my eyes.'], gift: { kind: 'glowstick', n: 12 }, chat: ['*happy tail wag*', 'Hug? Ask first!'] });
  for (const [x, z, s, an] of [[-1.6, 1.0, 1011, 'bw1213_floorsit'], [-0.6, 1.6, 1012, 'bw1213_hug'], [0.2, 2.3, 1013, 'bw1213_floorsit'], [1.6, 1.8, 1014, 'sleep']]) api.npc({ type: ['burner', 'tutu', 'ledsuit', 'furcoat'][s % 4], seed: s, x: C.x + x, z: C.z + z, y: 0.18, yaw: s, behavior: 'bw12still', anim: an, chatter: false, lines: ['We\'re a puddle. Puddles don\'t talk. ...Okay, a little.'] });
};
BW13.buildAcro = function (api, S) {
  const A = BW13.ACRO;
  api.mesh(A.x, A.z, m => {
    const cols = [];
    const ball = (x, y, z, r, col, spring) => { m.color(col).shine(2); m.ball(x, y + r, z, r); m.shine(0); cols.push(Object.assign({ t: 'dome', x, z, r, y0: y + r * 0.02 }, spring ? { spring } : {})); };
    const mat = (x, y, z, w, d, col) => { m.color(col); m.roundBox(x, y + 0.1, z, w, 0.2, d, 0.08); cols.push({ t: 'box', x, z, hx: w / 2, hz: d / 2, y0: y, y1: y + 0.2 }); };
    ball(-4, 0, 0, 1.0, '#ff4fb0', 15.5);
    ball(0, 0, -3, 1.2, '#38c8ff'); ball(0.6, 2.2, -2.8, 1.0, '#ffe24a'); mat(0, 4.0, -2.9, 2.6, 2.6, '#7aff5a');
    ball(1.4, 4.2, -2.0, 0.8, '#ff7a2a', 15.5);
    ball(-1.2, 0, 2.2, 1.3, '#9a6bff'); ball(-1.0, 2.5, 2.4, 1.15, '#ff4fb0'); ball(-0.8, 4.7, 2.3, 0.9, '#38c8ff'); mat(-0.9, 6.4, 2.3, 2.4, 2.4, '#ffe24a');
    ball(1, 0, 5, 1.2, '#7aff5a'); ball(1.1, 2.3, 5.1, 1.1, '#ff7a2a'); ball(0.9, 4.4, 5, 1.0, '#9a6bff'); ball(1.0, 6.3, 5.0, 0.9, '#ff4fb0'); ball(1.0, 8.0, 5, 0.75, '#38c8ff'); mat(1.0, 9.4, 5.0, 2.2, 2.2, '#ff4fb0');
    m.color('#5a3a2a'); m.limb(1.0, 9.6, 4.2, 1.0, 11.0, 4.2, 0.04, 0.04); m.limb(1.0, 11.0, 4.2, 1.0, 11.0, 4.8, 0.03, 0.03);
    m.color('#ffd84a').shine(3); BW1213.M.bell(m, 1.0, 10.3, 4.8, 0.3); m.shine(0);
    return { cols };
  });
  BW13.sign(api, 'ADVANCED ACRO YOGA\n(VERY ADVANCED)\n(please no)', A.x - 6, A.z - 4, { yaw: -0.6, h: 1.25 });
  api.npc({ id: 'riggs', name: 'RIGGS (BAD IDEAS)', type: 'badideaguy', seed: 2, x: A.x - 5.5, z: A.z + 1.5, yaw: 1.2,
    talk(g, a) {
      const st = g.missions.state('acro');
      if (st === 'available') g.say(a, ['Hear me out: Advanced Acro Yoga. No partners. Just yoga balls. Stacked.', 'I broke my arm doing it yesterday, which makes me basically an expert.', 'Bounce up there and ring the bell. What\'s the worst that could happen? Besides this.'], () => g.missions.start('acro'));
      else if (st === 'active') g.say(a, ['Bounce off the pink one. Then the orange one. Then pray. That\'s the advanced part.']);
      else g.say(a, ['Next workshop: Advanced Advanced Acro. On a moving art car. Sign-ups are a waiver.']);
    } });
};
BW13.buildCult = function (api, S) {
  const C = BW13.CULT;
  api.mesh(C.x, C.z, m => {
    m.color('#ff4fb0').shine(2); m.roundCyl(0, 0, -4, 2.4, 0.55, 0.15, { seg: 24 }); m.shine(0);
    m.color('#ffd0e8'); m.roundBox(3.8, 0.45, -4, 2.0, 0.9, 0.9, 0.12);
    for (let i = 0; i < 6; i++) { m.color(['#ffe24a', '#ff9a3a', '#ffffff', '#ff6aa0', '#c8ff7a', '#ffd0a0'][i]); m.lathe([[0, 0.92], [0.16, 0.95], [0.2, 1.04], [0.16, 1.1], [0, 1.1]], { seg: 10 }); m.push(); m.tf(3.0 + (i % 3) * 0.55, 0, -4.25 + Math.floor(i / 3) * 0.5); m.lathe([[0, 0.92], [0.16, 0.95], [0.2, 1.04], [0.16, 1.1], [0, 1.1]], { seg: 10 }); m.pop(); }
    for (const sx of [-3.2, 3.2]) { m.color('#ffffff'); m.limb(sx, 0, -5.6, sx, 4.4, -5.6, 0.1, 0.08); m.color('#ff4fb0'); m.ball(sx, 4.5, -5.6, 0.25); }
    return { cols: [{ t: 'cyl', x: 0, z: -4, r: 2.4, y0: 0, y1: 0.55 }, { t: 'box', x: 3.8, z: -4, hx: 1.0, hz: 0.45, y0: 0, y1: 0.9 }] };
  });
  BW13.sign(api, 'RADICAL BELONGING\nALL WELCOME · (FOREVER)', C.x, C.z - 5.7, { y: 3.0, h: 1.2, post: false, maxW: 6.2, style: { bg: '#ff4fb0', fg: '#ffffff', size: 40, border: '#ffe24a' } });
  BW13.sign(api, 'FREE SNACKS', C.x + 3.8, C.z - 3.4, { y: 0.95, h: 0.45, post: false, style: { bg: '#fff0f6', fg: '#a01a5a', size: 30, border: '#ff4fb0' } });
  api.npc({ id: 'bubblegum', name: 'BROTHER BUBBLEGUM', type: 'cultleader', seed: 1, x: C.x, z: C.z - 4, y: 0.55, fixedY: true, yaw: 0, behavior: 'bw13cult', always: true, chatter: false, talk(g, a) { BW13.bubbleTalk(g, a); } });
  S.followers = [];
  for (let i = 0; i < 6; i++) {
    const row = Math.floor(i / 3), col = i % 3, x = C.x - 2.4 + col * 2.4, z = C.z + 0.2 + row * 2.2;
    const spec = Object.assign(BW1213.base(1100 + i, { face: 'beatific', top: { kind: i % 2 ? 'tee' : 'long', col: ['#ff9ac8', '#ffb0d8', '#ff7ab8'][i % 3] }, coat: i % 3 === 0 ? { kind: 'robe', col: '#ffd0e8', trim: '#ff9ac8' } : null, bottom: { kind: 'pants', col: '#ffe0f0' }, shoes: { kind: 'sandals', col: '#ff9ad0' }, hat: { kind: 'bandana', col: '#ff4fb0' }, glasses: i % 2 ? 'heart' : null }), { key: 'bw13:follower' + i });
    S.followers.push(api.npc({ id: 'follower' + i, name: 'FOLLOWER', spec, x, z, yaw: Math.PI, behavior: 'bw13follower', always: true, chatter: false, hittable: true, slot: [x, z], idx: i, lines: ['We have snacks.', 'Have you heard about... belonging?'] }));
  }
};
BW13.bubbleTalk = function (g, a) {
  const st = g.missions.state('belonging');
  if (st === 'available') { g.say(a, ['Welcome, friend. Join us. We have snacks.', { who: 'brady', text: 'What\'s the workshop?' }, 'Radical Belonging. You belong. With us. Forever. ...In a fun way.', { who: 'brady', text: 'I\'m good, thanks.' }, 'Wonderful! Resistance is part of the welcome! FOLLOWERS... WELCOME HIM.'], () => g.missions.start('belonging')); return; }
  if (st === 'active') { g.say(a, ['Arms wide, bun man! The hug is coming whether you belong or not!']); return; }
  g.say(a, ['They belong to themselves now. That was always the real workshop, actually.', 'Wow. I\'m really good at this.']);
};
BW13.buildFiller = function (api, R, S) {
  const M = BW1213.M;
  // shade structures + chill domes around the edges
  const shade = (x, z, w, d, col) => api.mesh(x, z, m => { const h = 3.0; const cols = []; for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { m.color('#d8d0c8'); m.limb(sx * w / 2, 0, sz * d / 2, sx * w / 2, h, sz * d / 2, 0.08, 0.07); cols.push({ t: 'cyl', x: sx * w / 2, z: sz * d / 2, r: 0.1, y0: 0, y1: h, camPass: true }); } M.sail(m, [-w / 2, h, d / 2], [w / 2, h + 0.4, d / 2], [w / 2, h, -d / 2], [-w / 2, h + 0.4, -d / 2], col, 0.3); m.color('#a07a50'); m.roundBox(0, 0.22, 0, w * 0.5, 0.44, 0.8, 0.12); cols.push({ t: 'box', x: 0, z: 0, hx: w * 0.25, hz: 0.4, y0: 0, y1: 0.44 }); return { cols, lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ffd0a0', pool: w, i: 0.2 }] }; });
  shade(-74, 92, 8, 6, '#9adcff'); shade(76, 98, 7, 6, '#ffd84a'); shade(-86, 20, 8, 7, '#ff9ac8'); shade(88, 10, 7, 7, '#c8ff7a'); shade(-20, 96, 6, 5, '#c8a0ff'); shade(24, -60, 6, 6, '#ffb070');
  for (const [x, z, r, col] of [[-92, 60, 5, '#f4f0ea'], [94, 60, 4.5, '#ffe0c0'], [-96, -40, 5.5, '#e0f0ff'], [96, -96, 5, '#f8e0ff'], [-40, -110, 5, '#e8f8e0'], [44, -112, 4.5, '#fff0d0']]) api.sphere(x, 0, z, r, col, { squash: 0.75, gloss: 1 });
  // porta-potties (a cushion waits on top of one)
  for (let i = 0; i < 4; i++) api.prop('portapotty', { x: -38 + i * 1.35, z: 90, yaw: 0, col: ['#2a6ac8', '#3a8a3a', '#2a6ac8', '#c83a3a'][i] });
  // the trash truck that drives the east edge (the healer weeps at its beauty)
  S.truck = api.mover(m => { BurnsProps.boxtruck(m, { col: '#e8e8e0', cabCol: '#2a6ac8', seed: 7 }); return { cols: [] }; });
  S.truck.x = 106; S.truck.z = 120; S.truck.yaw = Math.PI;
  // the little plane for the ending
  S.plane = api.mover(m => BW1213.M.plane(m)); S.plane.visible = false; S.plane.y = 40;
  // bikes and folks drifting between workshops
  api.crowd(-70, 60, 6, 4, { types: ['burner', 'tutu', 'ledsuit', 'furcoat'], behaviors: ['dance', 'wander', 'idle', 'wander'] });
  api.crowd(70, 60, 5, 3, { types: ['burner', 'tutu', 'furcoat'], behaviors: ['wander', 'dance', 'idle'] });
  api.crowd(-10, -40, 5, 3, { types: ['burner', 'ledsuit', 'tutu'], behaviors: ['wander', 'wander', 'dance'] });
  // the exit road and its sign (seen in the ending)
  BW13.sign(api, 'YOU ARE NOW LEAVING\nCOME HOME SOON', BW13.EXIT.x + 4, BW13.EXIT.z - 2.6, { h: 1.0, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 38, border: '#3a1a10' } });
  BW13.sign(api, '← GATE ROAD', BW13.EXIT.x - 6, BW13.EXIT.z - 2.6, { h: 0.7, style: { bg: '#ff7a2a', fg: '#ffffff', size: 36, border: '#ffffff' } });
};
// the Man's pavilion on the northern horizon (always visible; Chinka is up there)
BW13.buildMan = function (api, S) {
  const M = BW13.MAN;
  api.mesh(M.x, M.z, m => {
    m.color('#b8a088'); m.lathe([[34, 0], [34, 3], [30, 7], [22, 9], [22, 11], [0, 11]], { seg: 28 });
    m.color('#38f2ff', 0.9); m.push(); m.tf(0, 9.2, 0); m.torus(0, 0, 0, 26, 0.5, { seg: 40, tseg: 5 }); m.pop();
    m.color('#7a5a3a'); m.limb(-4, 11, 0, -2.5, 30, 0, 1.4, 1.1); m.limb(4, 11, 0, 2.5, 30, 0, 1.4, 1.1); m.roundBox(0, 36, 0, 7, 13, 4, 1.4);
    m.limb(-3.4, 41, 0, -10, 50, 0, 1.0, 0.8); m.limb(-10, 50, 0, -12.5, 60, 0, 0.8, 0.6); m.limb(3.4, 41, 0, 10, 50, 0, 1.0, 0.8); m.limb(10, 50, 0, 12.5, 60, 0, 0.8, 0.6);
    m.color('#38f2ff', 1); for (const sd of [-1, 1]) { m.limb(sd * 4.3, 11, 1.2, sd * 2.8, 30, 1.2, 0.35, 0.35); m.limb(sd * 3.6, 41, 1.6, sd * 10.4, 50, 1.6, 0.3, 0.3); m.limb(sd * 10.4, 50, 1.6, sd * 12.9, 60, 1.6, 0.3, 0.3); }
    m.color('#ff7ad0', 1); m.push(); m.tf(0, 47.5, 0); m.lathe([[0, 0], [3.2, 3.6], [0, 7.2]], { seg: 4 }); m.pop(); m.emissive(0);
    return { cols: [] };
  });
  api.glow(M.x, 51, M.z, 18, '#ff7ad0'); api.glow(M.x, 9.5, M.z, 30, '#38f2ff');
};

/* ============================================================
   intro
   ============================================================ */
BW13.intro = function (g) {
  const S = BW13.state, p = g.player, A = BW13.ARCH;
  const camA = { x: 18, y: 22, z: 150, tx: 0, ty: 4, tz: 40, fov: 0.9 };
  const camB = { x: 4, y: 2.4, z: 121, tx: 0, ty: 3.6, tz: A.z, fov: 0.85 };
  p.teleport(0, 0, 124, Math.PI); p.locked = true;
  g.cutscene([
    { music: 'w7' },
    { cam: camA },
    { banner: [BurnsWorlds.label(13).toUpperCase(), 'THE WORKSHOPS · SATURDAY, 8:55 A.M.', { col: '#38c8ff', big: true, dur: 3.2 }] },
    { cam: { from: camA, to: camB, dur: 4 } },
    { say: ['brady', ['Workshop Village. Nine o\'clock. "Where lost loves are found."', 'Okay, Chinka. I\'m here.']] },
    { say: [{ name: 'GREETER DAISY', model: BurnsRig.model(BurnsRig.npcSpec('greeter_f', 2)) }, ['WELCOME HOOOME! First workshop? Sign in at the table! Everybody signs in!']] },
    { do: g2 => { BurnsSave.flag(13, 'intro', true); S.introDone = true; p.locked = false; g2.camYaw = Math.PI; g2.snapCam = true; } },
    { banner: ['THE WORKSHOPS', 'Sign in with the greeters. Get two stamps. Find her.', { col: '#38c8ff' }] }
  ], null);
};

/* ============================================================
   being held: grab helper (mash JUMP to break free)
   ============================================================ */
BW13.grab = function (g, by, dur, line) {
  const S = BW13.state, p = g.player;
  if (p.grabbedBy || p.invT > 0 || g.cine || g.dialog.open || p.vehicle || p.dead) return false;
  p.grab(by, dur); S.grab = { by, t: dur };
  g.warn(line || 'MASH JUMP TO BREAK FREE!', dur);
  burnsSfx('bump', { vol: 0.5 });
  return true;
};
BW13.updateGrab = function (g, dt) {
  const S = BW13.state, G = S.grab, p = g.player; if (!G) return;
  G.t -= dt;
  if (p.grabbedBy !== G.by) { S.grab = null; g.warnT = 0; return; }   // broke free (the engine knocks Brady away)
  if (G.t <= 0) {                                                     // held the whole time
    p.release(false); S.grab = null; g.warnT = 0;
    const b = G.by;
    if (b && b.onTimeout) b.onTimeout(g);
    if (b && b.data && b.data.mode !== 'free') { b.data.mode = 'dizzy'; b.data.t = 1.4; }
    p.invT = Math.max(p.invT, 1.2);
  }
};

/* ============================================================
   CONTACT IMPROV 101: Flow
   ============================================================ */
BW13.contactIntro = function (g) {
  const p = g.player, F = BW13.FLOOR, flow = g.actor('flow'), w = g.actor('willow');
  g.cutscene([
    { do: g2 => { p.teleport(F.x + 3.2, 0.26, F.z + 2.6, -2.2); if (flow) { flow.x = F.x + 0.6; flow.z = F.z + 1.0; flow.y = 0.26; flow.data.mode = 'cine'; flow.yaw = Math.atan2(p.x - flow.x, p.z - flow.z); } } },
    { cam: { x: F.x + 7.5, y: 2.6, z: F.z + 7.5, tx: F.x + 1.6, ty: 1.2, tz: F.z + 1.6, fov: 0.85 } },
    { say: [w, ['Welcome to Contact Improv! We find a partner, share our weight, and let the dance happen.', 'Everyone has a partner except... you. And Flow. Perfect!']] },
    { cam: { x: F.x + 2.6, y: 1.5, z: F.z + 4.6, tx: F.x + 0.6, ty: 1.0, tz: F.z + 1.0, fov: 0.8 } },
    { say: [flow, ['Brother. Let\'s FLOW.']] },
    { say: ['brady', ['Is he... is he wearing anything?']] },
    { say: [w, ['Flow wears his truth.']] },
    { say: [flow, ['And a fanny pack! For snacks!']] },
    { say: ['brady', ['Nope. Nope nope nope. Where\'s the nearest place he can\'t follow me?']] },
    { say: [w, ['Well... nobody flows in the Nap Tent. That\'s the rule. East side, past the yoga balls.']] },
    { do: g2 => { g2.missions.start('contact'); } }
  ], null);
};
BW13.contactStart = function (g, m) {
  const flow = g.actor('flow');
  m.data.catches = 0;
  if (flow) { flow.data.mode = 'dizzy'; flow.data.t = 1.8; flow.data.rt = 3; flow.say('Let me warm up my flow...', 1.8); }
  g.player.invT = 1.5;
  g.banner('ESCAPE FLOW!', 'Reach the Nap Tent. SPIN makes him pause. Three catches and you\'ve been FLOWED.', { col: '#ffb070' });
  burnsMusic('star', 'w7');
};
BW13.contactReset = function (g) {
  const flow = g.actor('flow'), F = BW13.FLOOR, p = g.player;
  if (p.grabbedBy === flow) p.release(false);
  if (flow) { flow.x = F.x - 1; flow.z = F.z; flow.y = 0.26; flow.data.mode = 'class'; }
  burnsMusic('w7');
};
BW13.contactDone = function (g) {
  const flow = g.actor('flow'), N = BW13.NAP, p = g.player, D = BW13.NAPDOOR;
  if (p.grabbedBy) p.release(false);
  burnsMusic('w7');
  if (flow) { flow.x = D.x - 5; flow.z = D.z + 1.5; flow.y = g.world.height(flow.x, flow.z); flow.data.mode = 'respect'; }
  g.cutscene([
    { cam: { x: D.x + 1.5, y: 2.0, z: D.z - 4.5, tx: D.x - 4, ty: 1.1, tz: D.z + 1, fov: 0.85 } },
    { say: [flow, ['"No flowing in the Nap Tent." ...I respect the sign.', 'Willow says you avoided contact for the ENTIRE class. That\'s technically the opposite of the exercise.', 'She stamped it anyway. Growth!']] },
    { do: g2 => { g2.banner('STAMP 1', 'Contact Improv 101 ✓', { col: '#ffb070', big: true }); burnsSfx('stomp', { vol: 0.6 }); } },
    { say: [flow, ['Same time tomorrow, brother?']] },
    { say: ['brady', ['No.']] },
    { do: g2 => { if (flow) flow.data.mode = 'free'; } }
  ], null);
  void N;
};
BurnsBehaviors.register('bw13flow', {
  init(a) { a.data.mode = 'class'; a.data.rt = 2; a.data.t = 0; a.data.lineT = 2; },
  hit(a, g, kind) {
    if (a.data.mode === 'chase' || a.data.mode === 'roll') { a.data.mode = 'dizzy'; a.data.t = 1.1; a.vx = a.vz = 0; a.say(['Ooh, a SPIN! You\'re flowing!', 'Beautiful! Again!', 'You\'re a natural, brother!'][Math.floor(Math.random() * 3)], 1.4); g.fx.burst(a.x, a.y + 1.6, a.z, 'star', 6, '#ffe24a'); }
    return 'handled';
  },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP();
    D.t -= dt; D.lineT -= dt;
    const say = L => { if (D.lineT <= 0) { D.lineT = 2.4 + Math.random() * 1.6; a.say(L[Math.floor(Math.random() * L.length)], 1.8); } };
    const active = g.missions.state('contact') === 'active';
    if (!active && (D.mode === 'chase' || D.mode === 'roll' || D.mode === 'hold')) D.mode = g.missions.isDone('contact') ? 'free' : 'class';
    a.def.noTalk = active || D.mode === 'cine';
    if (D.mode === 'cine') { a.vx = a.vz = 0; a.ch.play('bw1213_flow'); a.face(p.x, p.z, dt, 3); a.physics(dt); return; }
    if (D.mode === 'class') { a.vx = a.vz = 0; a.ch.play('bw1213_flow'); a.yaw += dt * 0.4; a.physics(dt); return; }
    if (D.mode === 'respect') { a.vx = a.vz = 0; a.face(p.x, p.z, dt, 3); a.ch.play('bw1213_heart'); a.physics(dt); return; }
    if (D.mode === 'free') {
      if (!D.tx || Math.random() < dt * 0.15) { const t = Math.random() * TAU; D.tx = -20 + Math.cos(t) * 14; D.tz = 30 + Math.sin(t) * 14; }
      const dd = a.moveTo(D.tx, D.tz, 1.6, dt, 0.6); a.ch.play(dd > 0.8 ? 'walk' : 'bw1213_flow');
      if (d < 7) say(['Brother! Free-flow Friday!', 'Wanna share some weight?', 'I see you avoiding me. Beautiful avoidance.']);
      a.physics(dt); return;
    }
    if (D.mode === 'dizzy') { a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.ch.play('bw1213_flow'); if (D.t <= 0) { D.mode = active ? 'chase' : 'class'; D.rt = 1.6; } a.physics(dt); return; }
    if (D.mode === 'hold') { a.vx = a.vz = 0; a.face(p.x, p.z, dt, 8); a.ch.play('bw1213_flow'); say(['WE\'RE FLOWING!', 'Feel the weight share!', 'Let the floor hold us, brother!']); a.physics(dt); return; }
    if (D.mode === 'roll') {
      a.vx = D.dx * 10.5; a.vz = D.dz * 10.5; a.ch.play('bw1213_roll');
      if (Math.random() < dt * 20) g.fx.dust(a.x, a.y + 0.1, a.z, 1);
      if (D.t <= 0 || (D.bump || 0) > 0) { D.bump = 0; D.mode = 'chase'; D.rt = 2.6 + Math.random() * 1.4; }
      BW13.flowCatch(a, g);
      a.physics(dt); return;
    }
    // chase
    D.rt -= dt;
    const sp = d > 18 ? 7.1 : d > 7 ? 6.3 : 5.6;
    a.moveTo(p.x, p.z, sp, dt, 0.6); a.ch.play('run', { rate: 0.95 });
    say(['Brother, wait! Let\'s flow!', 'Where are you flowing?!', 'Share your weight with me!', 'Point of contact INCOMING!', 'Don\'t resist the flow!', 'I\'m rolling toward you! With love!']);
    if (D.rt <= 0 && d < 9.5 && d > 2.2 && a.grounded) { D.mode = 'roll'; D.t = 0.72; const l = d || 1; D.dx = (p.x - a.x) / l; D.dz = (p.z - a.z) / l; a.yaw = Math.atan2(D.dx, D.dz); a.say('ROLLING POINT OF CONTACT!', 1.2); burnsSfx('spin', { pitch: 0.8 }); }
    BW13.flowCatch(a, g);
    a.physics(dt);
  }
});
BW13.flowCatch = function (a, g) {
  const p = g.player, m = g.missions.get('contact');
  if (!m || m.state !== 'active' || !a.touching(0.15) || p.invT > 0 || p.grabbedBy || g.cine) return;
  m.data.catches = (m.data.catches || 0) + 1;
  if (m.data.catches >= 3) { g.missions.fail('contact', 'You got FLOWED. Three times.'); a.say('Three flows! We\'re basically married now!', 2.4); return; }
  a.data.mode = 'hold';
  a.onTimeout = (g2) => { a.say('That was a GREAT flow.', 1.5); };
  BW13.grab(g, a, 3.0, `FLOWED ${m.data.catches}/3! MASH JUMP!`);
  a.say(['WE\'RE FLOWING!', 'Feel the weight share!'][m.data.catches % 2], 1.6);
  g.playerBubble('I feel a LOT of weight share!', 1.6);
};

/* ============================================================
   TANTRA BASICS: Klaus + the cushions
   ============================================================ */
BW13.tantraIntro = function (g) {
  const p = g.player, T = BW13.TANTRA, k = g.actor('klaus'), r = g.actor('river');
  const ex = T.x - 2.2, ez = T.z + 0.5;
  g.cutscene([
    { do: g2 => { p.teleport(ex, 0, ez, Math.PI / 2); if (k) { k.data.mode = 'cine'; } } },
    { cam: { x: T.x - 6.5, y: 2.4, z: T.z + 3.6, tx: T.x, ty: 0.9, tz: T.z, fov: 0.85 } },
    { say: [r, ['Welcome to Tantra Basics. Today we simply sit with a partner... and breathe together.']] },
    { do: g2 => { if (k) { k.x = ex + 1.5; k.z = ez - 1.2; k.y = 0; k.yaw = Math.atan2(p.x - k.x, p.z - k.z); k.ch.play('bw1213_skip'); } burnsSfx('jump3d', { pitch: 1.3 }); } },
    { cam: { x: ex - 2.5, y: 1.9, z: ez + 2.5, tx: ex + 1.2, ty: 1.4, tz: ez - 1.0, fov: 0.8 } },
    { say: [k, ['PARTNER! Hallo! I am Klaus!', 'Nine years I come to Tantra Basics, and never once a partner. Today is the day, ja?']] },
    { say: ['brady', ['I\'m actually just here for the stamp—']] },
    { say: [k, ['Then we BREATHE for the stamp! Together! I am very good at breathing!']] },
    { say: [r, ['Beautiful energy. Oh, and the wind took our meditation cushions. Bring five back and I\'ll stamp your passport.']] },
    { do: g2 => { g2.missions.start('tantra'); } }
  ], null);
};
BW13.tantraStart = function (g) {
  const S = BW13.state, k = g.actor('klaus');
  S.delivered = 0; S.carried.length = 0;
  for (const c of S.cushions) { c.state = 'home'; c.mv.visible = true; c.mv.x = c.home[0]; c.mv.y = c.home[1] + 0.2; c.mv.z = c.home[2]; }
  if (k) { k.data.mode = 'dizzy'; k.data.t = 1.8; k.data.lt = 3; k.say('One moment! I stretch my heart!', 1.8); }
  g.player.invT = 1.5;
  g.banner('TANTRA BASICS', 'Bring 5 cushions back to the tent. Klaus wants to be your partner. Very much.', { col: '#ff8a5a' });
  burnsMusic('burns_w3', 'w7');
};
BW13.tantraDone = function (g) {
  const S = BW13.state, k = g.actor('klaus'), r = g.actor('river'), T = BW13.TANTRA, p = g.player;
  burnsMusic('w7');
  if (p.grabbedBy) p.release(false);
  for (const c of S.cushions) if (c.state !== 'pile') c.mv.visible = false;
  if (k) { k.data.mode = 'sad'; k.x = T.x - T.R - 2.4; k.z = T.z - 3; k.y = g.world.height(k.x, k.z); k.yaw = -Math.PI / 2; }
  g.say(r, ['Five cushions! Your breathing was... mostly running. But the cushions are home.'], () => { g.banner('STAMP 2', 'Tantra Basics ✓', { col: '#ff8a5a', big: true }); burnsSfx('stomp', { vol: 0.6 }); });
  if (k) g.say(k, ['Everyone always runs from Klaus. Maybe my breathing is too... enthusiastic.']);
};
BW13.updateCushions = function (g, dt) {
  const S = BW13.state, p = g.player, T = BW13.TANTRA;
  if (g.missions.state('tantra') !== 'active') { for (const c of S.cushions) if (c.state === 'fly') c.state = 'home'; return; }
  const t = g.time;
  for (const c of S.cushions) {
    const mv = c.mv;
    if (c.state === 'home') {
      mv.x = c.home[0]; mv.z = c.home[2]; mv.y = c.home[1] + 0.25 + Math.sin(t * 2 + c.i) * 0.08; mv.yaw += dt * 0.8;
      if (Math.hypot(p.x - mv.x, p.z - mv.z) < 1.3 && Math.abs(p.y + 0.9 - mv.y) < 1.5 && !p.grabbedBy) { c.state = 'carried'; S.carried.push(c); burnsSfx('pick', { pitch: 0.8 }); g.toast(`Carrying ${S.carried.length} cushion${S.carried.length > 1 ? 's' : ''}! Bring them to the tent.`); }
    } else if (c.state === 'carried') {
      const k = S.carried.indexOf(c);
      mv.x = BurnsM.damp(mv.x, p.x, 18, dt); mv.z = BurnsM.damp(mv.z, p.z, 18, dt); mv.y = BurnsM.damp(mv.y, p.y + 2.05 + k * 0.26 + Math.sin(t * 6 + k) * 0.03, 18, dt); mv.yaw = p.yaw + k * 0.3;
    } else if (c.state === 'fly') {
      c.ft += dt * 1.6; const u = Math.min(1, c.ft);
      mv.x = lerp(c.from[0], c.to[0], u); mv.z = lerp(c.from[2], c.to[2], u); mv.y = lerp(c.from[1], c.to[1], u) + Math.sin(u * Math.PI) * 2.2;
      if (u >= 1) c.state = c.toState;
    }
  }
  // delivery: walk into the circle
  if (S.carried.length && Math.hypot(p.x - T.x, p.z - T.z) < 5.2) {
    for (const c of S.carried) { c.state = 'fly'; c.ft = 0; c.from = [c.mv.x, c.mv.y, c.mv.z]; c.to = [T.x + (S.delivered % 3 - 1) * 0.3, 0.42 + S.delivered * 0.24, T.z + (S.delivered % 2) * 0.2]; c.toState = 'pile'; S.delivered++; }
    S.carried.length = 0;
    burnsSfx('gift', { vol: 0.6 }, 'pick');
    const m = g.missions.get('tantra');
    m.n = S.delivered;
    if (S.delivered >= 5) g.missions.complete('tantra', { x: T.x - 2, y: 1.3, z: T.z });
    else g.toast(`Cushions: ${S.delivered}/5`);
  }
};
BW13.dropCushion = function (g) {
  const S = BW13.state, c = S.carried.pop(); if (!c) return false;
  c.state = 'fly'; c.ft = 0; c.from = [c.mv.x, c.mv.y, c.mv.z]; c.to = [c.home[0], c.home[1] + 0.25, c.home[2]]; c.toState = 'home';
  g.toast('Klaus hugged a cushion loose! It flew back where it was.');
  return true;
};
BurnsBehaviors.register('bw13klaus', {
  init(a) { a.data.mode = 'wait'; a.data.lt = 2; a.data.rt = 3; a.data.t = 0; },
  hit(a, g, kind) {
    if (a.data.mode === 'chase' || a.data.mode === 'leap') { a.data.mode = 'dizzy'; a.data.t = 1.2; a.vx = a.vz = 0; a.say(['Ooh, you spin! I spin also!', 'Wunderbar! A spinning partner!', 'Again! AGAIN!'][Math.floor(Math.random() * 3)], 1.5); g.fx.hearts(a.x, a.y + 2, a.z, 4); }
    return 'handled';
  },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP();
    D.t -= dt; D.lt -= dt;
    const say = (L, s) => { if (D.lt <= 0) { D.lt = s || (2.6 + Math.random() * 1.6); a.say(L[Math.floor(Math.random() * L.length)], 1.9); } };
    const active = g.missions.state('tantra') === 'active';
    if (!active && (D.mode === 'chase' || D.mode === 'leap' || D.mode === 'hold')) D.mode = g.missions.isDone('tantra') ? 'sad' : 'wait';
    a.def.noTalk = active || D.mode === 'cine';
    if (D.mode === 'cine') { a.vx = a.vz = 0; a.physics(dt); return; }
    if (D.mode === 'wait') { a.vx = a.vz = 0; a.ch.play('bw1213_floorsit'); if (d < 9) say(['Partner?', 'Anyone? A partner?', 'I brought snacks for two!'], 6); a.physics(dt); return; }
    if (D.mode === 'sad') { a.vx = a.vz = 0; a.ch.play('bw1213_floorsit'); a.ch.faceOverride = 2; if (d < 8) say(['*sigh*', 'Nine years...', 'Maybe next year.'], 7); a.physics(dt); return; }
    a.ch.faceOverride = -1;
    if (D.mode === 'love') { a.vx = a.vz = 0; a.ch.play('bw1213_breathe'); if (Math.random() < dt * 1.2) g.fx.hearts(a.x, a.y + 1.6, a.z, 1); a.physics(dt); return; }
    if (D.mode === 'follow') {
      const fd = 2.6;
      if (d > 30) { a.x = p.x - Math.sin(p.yaw) * 2; a.z = p.z - Math.cos(p.yaw) * 2; a.y = p.y; }
      if (d > fd) { a.moveTo(p.x, p.z, d > 8 ? 7.5 : d > 4 ? 5.5 : 3, dt, fd * 0.8); a.ch.play('bw1213_skip', { rate: 0.9 }); }
      else { a.moveTo(a.x, a.z, 0, dt); a.face(p.x, p.z, dt, 4); a.ch.play('wave'); }
      if (a.grounded && p.grounded && p.y > a.y + 1.2 && d < 4) { a.vy = 11; a.grounded = false; }
      say(['I follow! Like tantra, but in a direction!', 'Is she pretty? Is she nice? Does she BREATHE?', 'My heart is going like a techno song!'], 5);
      a.physics(dt); return;
    }
    if (D.mode === 'dizzy') { a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.ch.play('spin'); if (D.t <= 0) { D.mode = active ? 'chase' : 'wait'; D.rt = 1.8; } a.physics(dt); return; }
    if (D.mode === 'hold') { a.vx = a.vz = 0; a.face(p.x, p.z, dt, 8); a.ch.play('hug'); say(['In... and out... wunderbar!', 'Our breath is SYNCHRONIZED!', 'Do you feel it? I feel it!'], 1.6); a.physics(dt); return; }
    if (D.mode === 'leap') {
      a.ch.play(a.vy > 0 ? 'jump' : 'fall');
      if (a.grounded && D.t < 0.6) { D.mode = 'chase'; D.rt = 3 + Math.random() * 1.5; }
      BW13.klausCatch(a, g); a.physics(dt); return;
    }
    // chase: happy skipping, open arms
    D.rt -= dt;
    a.moveTo(p.x, p.z, d > 14 ? 7.0 : 6.0, dt, 0.6); a.ch.play('bw1213_skip', { rate: 1.05 });
    say(['Partner! Wait! We breathe together!', 'I am very good at breathing!', 'Inhale... with Klaus!', 'You run, I follow. This is also a connection, ja?', 'My dress has pockets! For snacks! For two!', 'Wunderbar, you are fast!', 'Is this cardio tantra?']);
    if (D.rt <= 0 && d > 4 && d < 10 && a.grounded) { D.mode = 'leap'; D.t = 1.2; const tt = 0.85; a.vx = (p.x + p.vx * 0.4 - a.x) / tt; a.vz = (p.z + p.vz * 0.4 - a.z) / tt; a.vy = 9.5; a.grounded = false; a.say('PARTNER LEAP!', 1.2); burnsSfx('jump3d', { pitch: 0.8 }); }
    BW13.klausCatch(a, g);
    a.physics(dt);
  }
});
BW13.klausCatch = function (a, g) {
  const p = g.player;
  if (g.missions.state('tantra') !== 'active' || !a.touching(0.2) || p.invT > 0 || p.grabbedBy || g.cine) return;
  a.data.mode = 'hold';
  BW13.grab(g, a, 2.8, 'MASH JUMP!');
  a.say('GOT YOU! Okay: in... and out...', 1.8);
  BW13.dropCushion(g);
};

/* ============================================================
   SOUND BATH: Solstice, the bowls and the stare beam
   ============================================================ */
BW13.soundStart = function (g) {
  const S = BW13.state, s = g.actor('solstice'), D = BW13.SOUND;
  for (const b of S.bowls) { b.rung = false; b.k = 0; }
  if (s) { s.x = D.x; s.z = D.z; s.data.mode = 'bath'; s.data.ang = 0; }
  g.banner('SOUND BATH', 'Ring the 5 bowls. If the stare beam locks on, MASH JUMP to look away.', { col: '#c8a0ff' });
  burnsMusic('secret', 'w7');
};
BW13.soundDone = function (g) {
  const s = g.actor('solstice');
  burnsMusic('w7');
  if (s) { s.data.mode = 'roam'; s.x = BW13.SOUNDDOOR.x + 2.5; s.z = BW13.SOUND.z - 2.5; }
  if (g.player.grabbedBy) g.player.release(false);
  if (s) g.say(s, ['You are now four percent more enlightened. I\'m at a hundred. Obviously.', 'My twin flame is out there. I can feel it. Probably wearing something floral.']);
};
BW13.updateBowls = function (g, dt) {
  const S = BW13.state, p = g.player;
  for (const b of S.bowls) b.k = Math.max(0, b.k - dt * 0.6);
  if (g.missions.state('sound') !== 'active') return;
  for (const b of S.bowls) {
    if (b.rung) continue;
    if (Math.hypot(p.x - b.x, p.z - b.z) < (b.big ? 1.6 : 1.25) && Math.abs(p.y + 0.9 - b.y) < 1.5) {
      b.rung = true; b.k = 1;
      burnsSfx(b.big ? 'reunion' : 'pick', { pitch: b.big ? 0.5 : 0.45 + S.bowls.indexOf(b) * 0.08, vol: 0.6 });
      for (let i = 0; i < 5; i++) g.fx.notes(b.x, b.y + 0.6, b.z); g.fx.ring(b.x, b.y, b.z, 2.2, '#c8a0ff', 0.7);
      const m = g.missions.get('sound'); m.n++;
      if (m.n >= 5) g.missions.complete('sound', { x: BW13.SOUND.x + 2, y: 1.4, z: BW13.SOUND.z });
      else g.toast(`Bowls: ${m.n}/5. Your aura: slightly less dusty.`);
    }
  }
};
BurnsBehaviors.register('bw13healer', {
  init(a) { a.data.mode = 'roam'; a.data.cd = 2; a.data.ang = 0; a.data.lt = 3; a.data.wind = 0; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP();
    D.cd -= dt; D.lt -= dt;
    const S = BW13.state;
    if (D.mode === 'cine') { a.vx = a.vz = 0; a.physics(dt); return; }
    if (D.mode === 'love') { a.vx = a.vz = 0; a.ch.play('bw1213_breathe'); if (Math.random() < dt * 1.2) g.fx.hearts(a.x, a.y + 1.6, a.z, 1); a.physics(dt); return; }
    if (D.mode === 'cry') { a.vx = a.vz = 0; a.ch.play('bw1213_cry'); if (Math.random() < dt * 4) g.fx.burst(a.x, a.y + 1.7, a.z, 'drop', 1, '#9adcff'); if (D.t2 > 0) D.t2 -= dt; else D.mode = 'roam'; a.physics(dt); return; }
    if (D.mode === 'bath') {
      // standing in the middle of the dome; the gaze sweeps around like a lighthouse
      a.moveTo(BW13.SOUND.x, BW13.SOUND.z, 1.4, dt, 0.4);
      const locked = S.gaze && S.gaze.on;
      if (!locked) D.ang += dt * 0.75;
      a.yaw = locked ? Math.atan2(p.x - a.x, p.z - a.z) : D.ang;
      a.ch.play('bw1213_gaze');
      const inDome = Math.hypot(p.x - BW13.SOUND.x, p.z - BW13.SOUND.z) < BW13.SOUND.R;
      if (!locked && inDome && D.cd <= 0) {
        const dd = Math.abs(BurnsM.wrap(Math.atan2(p.x - a.x, p.z - a.z) - a.yaw));
        if (dd < 0.17 && d < 11 && g.world.raycast(a.x, a.y + 1.6, a.z, p.x, p.y + 1.4, p.z, true) > 0.95) BW13.gazeLock(g, a);
      }
      a.physics(dt); return;
    }
    // roam outside the dome: offer unsolicited eye gazing
    if (!D.tx || Math.random() < dt * 0.2) { const t = Math.random() * TAU; D.tx = BW13.SOUNDDOOR.x + 4 + Math.cos(t) * 3.5; D.tz = BW13.SOUND.z + Math.sin(t) * 5; }
    if (S.gaze && S.gaze.on) { a.vx = a.vz = 0; a.face(p.x, p.z, dt, 8); a.ch.play('bw1213_gaze'); a.physics(dt); return; }
    if (D.wind > 0) {
      D.wind -= dt; a.vx = a.vz = 0; a.face(p.x, p.z, dt, 6); a.ch.play('bw1213_gaze');
      if (D.wind <= 0) { const dd = Math.abs(BurnsM.wrap(Math.atan2(p.x - a.x, p.z - a.z) - a.yaw)); if (d < 9.5 && dd < 0.5 && g.world.raycast(a.x, a.y + 1.6, a.z, p.x, p.y + 1.4, p.z, true) > 0.95) BW13.gazeLock(g, a); else D.cd = 2; }
      a.physics(dt); return;
    }
    const dd = a.moveTo(D.tx, D.tz, 1.2, dt, 0.5); a.ch.play(dd > 0.6 ? 'walk' : 'bw1213_heart');
    if (D.cd <= 0 && d < 8 && !g.missions.isDone('twinflame') && !g.cine && !g.dialog.open && !p.grabbedBy && g.missions.state('contact') !== 'active' && g.missions.state('tantra') !== 'active') { D.wind = 0.9; a.say('Hold still. I\'m going to look into your soul.', 1.6); }
    a.physics(dt);
  }
});
BW13.gazeLock = function (g, a) {
  const S = BW13.state, p = g.player;
  if (p.grabbedBy || p.invT > 0 || g.cine || g.dialog.open || p.vehicle || p.dead) return;
  const yaw = Math.atan2(p.x - a.x, p.z - a.z);
  const proxy = { x: p.x - Math.sin(yaw) * 0.55, y: p.y, z: p.z - Math.cos(yaw) * 0.55, yaw, data: {}, onTimeout(g2) { p.hurt(1, a.x, a.z, 3); g2.toast('You\'ve been SEEN. Deeply. -1 hydration.'); } };
  S.gaze = { on: true, by: a, proxy, t: 0 };
  BW13.grab(g, proxy, 3.4, 'LOOK AWAY! MASH JUMP!');
  a.say(['I see you. I see ALL of you.', 'Your soul is... medium.', 'Are you my twin flame? ...No. Your aura is beige.', 'Don\'t blink. Blinking is for the unenlightened.', 'We\'re connecting. Well, I am. You\'re mostly sweating.'][Math.floor(Math.random() * 5)], 2.6);
  burnsSfx('secret', { vol: 0.5 });
};
BW13.updateGaze = function (g, dt) {
  const S = BW13.state, G = S.gaze, p = g.player;
  if (!G || !G.on) return;
  G.t += dt;
  if (p.grabbedBy !== G.proxy) { G.on = false; G.by.data.cd = 3.2; G.by.data.wind = 0; if (G.t < 3.3) G.by.say(['Rude. Beautiful, but rude.', 'You looked away! That\'s growth. For me.', 'Fine. I\'ll gaze at the dome.'][Math.floor(Math.random() * 3)], 2); }
};
BW13.updateTruck = function (g, dt) {
  const S = BW13.state, T = S.truck; if (!T) return;
  S.truckT += dt;
  const L = 270, u = (S.truckT * 5.2) % (L * 2), fwd = u < L, z = fwd ? 125 - u : 125 - (2 * L - u);
  T.x = fwd ? 106 : 100; T.z = z; T.yaw = fwd ? Math.PI : 0;
  const s = g.actor('solstice');
  if (s && s.data.mode === 'roam' && !(S.gaze && S.gaze.on) && Math.abs(T.z - s.z) < 18 && !s.data.cried) { s.data.cried = true; s.data.mode = 'cry'; s.data.t2 = 4; s.say('A trash truck... carrying our burdens... it\'s so beautiful...', 3.8); }
  if (s && Math.abs(T.z - s.z) > 60) s.data.cried = false;
};

/* ============================================================
   TWIN FLAMES: Klaus meets Solstice
   ============================================================ */
BW13.twinStart = function (g) {
  const k = g.actor('klaus'); if (k) { k.data.mode = 'follow'; k.ch.faceOverride = -1; }
  g.banner('TWIN FLAMES', 'Walk Klaus to the Sound Dome.', { col: '#ff9ad0' });
};
BW13.twinDone = function (g) {
  const k = g.actor('klaus'), s = g.actor('solstice'), D = BW13.SOUNDDOOR, p = g.player;
  const kx = D.x + 3.4, kz = D.z + 0.9, sx = D.x + 3.4, sz = D.z - 0.9;
  g.cutscene([
    { do: g2 => { if (k) { k.data.mode = 'cine'; k.x = kx; k.z = kz; k.y = g2.world.height(kx, kz); k.yaw = Math.PI; k.ch.play('idle'); } if (s) { s.data.mode = 'cine'; s.x = sx; s.z = sz; s.y = g2.world.height(sx, sz); s.yaw = 0; s.ch.play('bw1213_gaze'); } p.teleport(D.x + 6.2, 0, D.z + 2.6, -2.2); BW13.state.twinBeam = 0; } },
    { cam: { x: D.x + 6.8, y: 1.9, z: D.z, tx: D.x + 3.4, ty: 1.5, tz: D.z, fov: 0.75 } },
    { say: [s, ['...Who is this?']] },
    { say: [k, ['Hallo. I am Klaus. I am... very good at breathing.']] },
    { do: g2 => { BW13.state.twinBeam = 1; burnsSfx('reunion', { vol: 0.6 }, 'secret'); g2.fx.hearts((kx + sx) / 2, 2.0, (kz + sz) / 2, 20); if (k) k.ch.play('bw1213_gaze'); } },
    { wait: 1.6 },
    { say: [s, ['Your aura... is the exact color of my aura.', 'Are you... my twin flame?']] },
    { say: [k, ['TWIN FLAME!']] },
    { say: [s, ['I usually ghost people on Monday.']] },
    { say: [k, ['...And this Monday?']] },
    { say: [s, ['I\'ll make an exception. Maybe Tuesday. Maybe never.']] },
    { say: [k, ['WUNDERBAR!']] },
    { do: g2 => { BW13.state.twinBeam = 0; if (k) { k.data.mode = 'love'; k.ch.play('bw1213_breathe'); } if (s) { s.data.mode = 'love'; } g2.fx.hearts((kx + sx) / 2, 1.8, (kz + sz) / 2, 30); burnsSfx('crowd_cheer', { vol: 0.5 }); } },
    { say: ['brady', ['Two strangers found each other at a Burn. Maybe there\'s hope for me too.']] }
  ], null);
};

/* ============================================================
   RADICAL BELONGING: Brother Bubblegum and the followers
   ============================================================ */
BW13.CULT_MOVES = [['welcome', 'Arms wide!'], ['bw1213_heart', 'Hearts open!'], ['bw1213_sky', 'Point to the sky!'], ['dance', 'Now... sway!']];
BurnsBehaviors.register('bw13cult', {
  init(a) { a.data.t = 0; a.data.i = 0; },
  update(a, g, dt) {
    const D = a.data, S = BW13.state; D.t += dt;
    if (D.t > 3.2) { D.t = 0; D.i = (D.i + 1) % BW13.CULT_MOVES.length; const mv = BW13.CULT_MOVES[D.i]; if (a.distP() < 22) a.say(mv[1], 1.6); S.cultMove = { i: D.i, t: g.time }; }
    const mv = BW13.CULT_MOVES[D.i];
    a.ch.play(mv[0], { style: 0, bpm: 100 });
    if (g.missions.isDone('belonging')) { a.ch.play('dance', { style: 1, bpm: 120 }); }
    a.vx = a.vz = 0; a.face(g.player.x, g.player.z, dt, 1.5);
  }
});
BurnsBehaviors.register('bw13follower', {
  init(a) { a.data.mode = 'row'; a.data.lt = 2 + Math.random() * 3; a.data.hugs = 0; },
  hit(a, g, kind) {
    if (a.data.mode === 'free') return 'handled';
    if (g.missions.state('belonging') !== 'active') { a.say('Spinning is not belonging! ...It looks fun though.', 1.6); return 'handled'; }
    BW13.freeFollower(g, a); return 'handled';
  },
  update(a, g, dt) {
    const D = a.data, S = BW13.state, p = g.player, d = a.distP();
    D.lt -= dt;
    if (D.mode === 'free') { a.ch.play('dance', { style: a.def.idx % 6, bpm: 112 + a.def.idx * 4 }); a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.physics(dt); return; }
    const active = g.missions.state('belonging') === 'active';
    a.def.noTalk = active;
    if (active && D.mode === 'row') D.mode = 'recruit';
    if (!active && D.mode === 'recruit') D.mode = 'row';
    if (D.mode === 'row') {
      const sl = a.def.slot, dh = a.moveTo(sl[0], sl[1], 2.2, dt, 0.3);
      // mimic Brother Bubblegum, a beat late
      const cm = S.cultMove, mvI = cm && g.time - cm.t > 0.35 ? cm.i : (cm ? (cm.i + BW13.CULT_MOVES.length - 1) % BW13.CULT_MOVES.length : 0);
      if (dh > 0.5) a.ch.play('walk'); else { a.ch.play(BW13.CULT_MOVES[mvI][0], { style: 0, bpm: 100 }); a.yaw = BurnsM.dampAngle(a.yaw, Math.PI, 4, dt); }
      if (cm && (a.def.idx === 0 || a.def.idx === 4) && D.said !== cm.t && g.time - cm.t > 0.4 && d < 22) { D.said = cm.t; a.say(BW13.CULT_MOVES[cm.i][1], 1.2); }
      a.physics(dt); return;
    }
    if (D.mode === 'hold') { a.vx = a.vz = 0; a.face(p.x, p.z, dt, 8); a.ch.play('hug'); a.physics(dt); return; }
    if (D.mode === 'dizzy') { a.vx = BurnsM.damp(a.vx, 0, 5, dt); a.vz = BurnsM.damp(a.vz, 0, 5, dt); a.ch.play('welcome'); if ((D.t -= dt) <= 0) D.mode = 'recruit'; a.physics(dt); return; }
    // recruit: shuffle toward Brady, arms wide, chanting
    a.moveTo(p.x, p.z, d > 12 ? 3.6 : 2.7, dt, 0.5); a.ch.play(d < 3 ? 'welcome' : 'walk', { rate: 0.8 });
    if (D.lt <= 0 && d < 14) { D.lt = 2.4 + Math.random() * 2; a.say(['Join us...', 'We have snacks...', 'Belong... with us...', 'There\'s a group hug...', 'Arms wide, bun man...'][Math.floor(Math.random() * 5)], 1.6); }
    const m = g.missions.get('belonging');
    if (m && m.state === 'active' && a.touching(0.15) && p.invT <= 0 && !p.grabbedBy && !g.cine) {
      m.data.hugs = (m.data.hugs || 0) + 1;
      if (m.data.hugs >= 3) { g.missions.fail('belonging', 'You\'ve been... BELONGED.'); return; }
      D.mode = 'hold'; a.onTimeout = () => { D.mode = 'dizzy'; D.t = 1.5; };
      BW13.grab(g, a, 2.6, `GROUP HUG ${m.data.hugs}/3! MASH!`);
      a.say('BELONG WITH US!', 1.5);
    }
    a.physics(dt);
  }
});
BW13.freeFollower = function (g, a) {
  const m = g.missions.get('belonging'); if (!m || m.state !== 'active' || a.data.mode === 'free') return;
  if (g.player.grabbedBy === a) g.player.release(false);
  a.data.mode = 'free';
  a.say(['Wait... I can dance however I WANT?', 'I\'ve always wanted to do the robot!', 'Free! FREE! ...Are the snacks still free?', 'My name is Gary! I forgot I was Gary!', 'I\'m going to the Sound Bath! Alone! By choice!', 'Pink isn\'t even my color!'][a.def.idx % 6], 2.6);
  g.fx.confetti(a.x, a.y + 1.8, a.z, 18); burnsSfx('gift', { vol: 0.5 }, 'pick');
  m.n++;
  if (m.n >= 6) g.missions.complete('belonging', { x: BW13.CULT.x, y: 1.4, z: BW13.CULT.z - 1 });
  else g.toast(`Freed: ${m.n}/6`);
};
BW13.cultStart = function (g) {
  const m = g.missions.get('belonging'); m.data.hugs = 0;
  g.banner('RADICAL BELONGING', 'SPIN the followers to snap them out of it. Avoid the group hugs!', { col: '#ff4fb0' });
};
BW13.cultReset = function (g) {
  const S = BW13.state; const p = g.player;
  for (const f of S.followers) { const a = g.actor(f.id); if (a && a.data.mode !== 'free') { if (p.grabbedBy === a) p.release(false); a.data.mode = 'row'; } }
  const m = g.missions.get('belonging'); if (m) { let n = 0; for (const f of S.followers) { const a = g.actor(f.id); if (a && a.data.mode === 'free') n++; } m.n = n; }
};
BW13.cultDone = function (g) {
  const b = g.actor('bubblegum');
  if (b) g.say(b, ['Hm. They belong to themselves now.', '...That was always the real workshop, actually. Wow. I\'m good at this.']);
};

/* ============================================================
   ADVANCED NAPPING (hidden)
   ============================================================ */
BW13.updateNap = function (g, dt) {
  const S = BW13.state, p = g.player, m = g.missions.get('nap');
  if (!m || m.state !== 'active') return;
  const G = S.goldMat, on = Math.hypot(p.x - G.x, p.z - G.z) < 1.1 && p.grounded && Math.hypot(p.vx, p.vz) < 0.4 && !p.locked;
  if (S.napT === undefined) S.napT = 0;
  if (S.napping) {
    S.napT += dt; if (Math.random() < dt * 2) g.fx.zzz(p.x, p.y + 0.8, p.z);
    if (S.napT > 3.2) { S.napping = false; S.napT = 0; p.locked = false; p.animOverride = null; p.say('I feel... ADVANCED.', 2.2); g.missions.complete('nap', { x: G.x, y: 1.3, z: G.z - 1.2 }); }
    return;
  }
  if (on) { S.napT += dt; if (S.napT > 2.2) { S.napping = true; S.napT = 0; p.locked = true; p.animOverride = 'bw1213_lie'; burnsSfx('khole', { vol: 0.3 }); } }
  else S.napT = 0;
};

/* ============================================================
   FINDING YOUR LONG-LOST LOVE: the guided exercise -> the reveal -> the goons
   ============================================================ */
BW13.exerciseStart = function (g) {
  const S = BW13.state, p = g.player, L = BW13.LOVE, pearl = g.actor('pearl');
  g.missions.start('lostlove', true);
  const seat = { x: L.x, z: L.z - 4.2 };
  g.cutscene([
    { do: g2 => { p.teleport(seat.x, 0.26, seat.z, 0); p.locked = true; p.animOverride = 'bw1213_floorsit'; if (pearl) { pearl.x = L.x; pearl.z = L.z; pearl.y = 0.3; pearl.def.fixedY = true; pearl.setBehavior('bw12still'); pearl.def.anim = 'bw1213_floorsit'; pearl.yaw = 0; } burnsMusic('gift_camp', 'w7'); } },
    { cam: { x: L.x - 3.4, y: 2.6, z: L.z - 7.0, tx: L.x, ty: 0.8, tz: L.z - 1.0, fov: 0.85 } },
    { say: [pearl, ['Welcome, lost lovers. Finding Your Long-Lost Love. Ninety-two percent success rate.', 'Sit. Close your eyes. Breathe IN when the light grows... and out when it fades.']] },
    { do: g2 => { BW13.exerciseBegin(g2); } }
  ], null);
};
BW13.exerciseBegin = function (g) {
  const S = BW13.state;
  S.ex = { phase: 'breathe', n: 0, t: 0, used: false, meter: 0, cheer: 0 };
  g.camYaw = 0; g.camPitch = 0.34; g.snapCam = true;
  g.bossSay(null, 'Press JUMP when the light is fullest (0/3)', 9999);
};
BW13.exerciseAbort = function (g) {
  const S = BW13.state, p = g.player; S.ex = null; p.locked = false; p.animOverride = null; g.bossLine = null;
  if (g.missions.state('lostlove') === 'active') g.missions.fail('lostlove', 'The circle broke. Talk to Pearl to try again.');
  const pearl = g.actor('pearl'); if (pearl) { pearl.def.fixedY = false; pearl.setBehavior('idle'); pearl.x = BW13.LOVEDOOR.x - 2.2; pearl.z = BW13.LOVEDOOR.z + 0.6; }
};
BW13.breathK = t => 0.5 - 0.5 * Math.cos(t / 3.0 * TAU);
BW13.updateExercise = function (g, dt) {
  const S = BW13.state, E = S.ex, p = g.player, pearl = g.actor('pearl');
  if (!E || g.cine) return;
  const pressed = p.inp.jumpPressed || p.inp.actionPressed;
  E.t += dt;
  g.camYaw = BurnsM.dampAngle(g.camYaw, 0, 3, dt);
  if (E.phase === 'breathe') {
    const k = BW13.breathK(E.t), cyc = Math.floor(E.t / 3.0);
    if (cyc !== E.cyc) { E.cyc = cyc; E.used = false; }
    if (pressed && !E.used) {
      E.used = true;
      if (k > 0.8) { E.n++; burnsSfx('pick', { pitch: 0.6 + E.n * 0.1, vol: 0.5 }); g.fx.ring(p.x, p.y + 0.4, p.z, 2.4, '#ff9ad0', 0.8); if (pearl) pearl.say(['Good... and out...', 'Beautiful. Again.', 'Mm-hmm. That\'s a breath.'][E.n - 1] || 'Good.', 1.6); }
      else { if (pearl) pearl.say(['Breathe WITH the light, honey.', 'Not yet. Wait for it to grow.', 'That\'s a gasp. We want a breath.'][Math.floor(Math.random() * 3)], 1.6); }
      g.bossSay(null, `Press JUMP when the light is fullest (${E.n}/3)`, 9999);
    }
    if (E.n >= 3) {
      E.phase = 'pause'; g.bossLine = null;
      g.cutscene([{ say: [pearl, ['Now. Picture them. Hold them right in the middle of your chest.', 'And call their name. Not with your mouth. With your WHOLE SELF.']] }], g2 => { E.phase = 'call'; E.meter = 0; g2.bossSay(null, 'MASH JUMP: call her name!', 9999); });
    }
    return;
  }
  if (E.phase === 'call') {
    E.meter = Math.max(0, E.meter - dt * 0.18);
    if (pressed) { E.meter = Math.min(1, E.meter + 0.13); burnsSfx('dialogue_blip', { vol: 0.25, pitch: 0.6 + E.meter }); g.fx.hearts(p.x, p.y + 1.4, p.z, 1); }
    const lines = [[0.3, 'Louder, honey!'], [0.6, 'From the heart!'], [0.85, 'From the BUN!']];
    for (const [th, l] of lines) if (E.meter >= th && E.cheer < th) { E.cheer = th; if (pearl) pearl.say(l, 1.4); }
    g.bossSay(null, `MASH JUMP: call her name!  ${Math.round(E.meter * 100)}%`, 9999);
    if (Math.random() < dt * 8 * E.meter) g.fx.hearts(p.x, p.y + 1.8, p.z, 1);
    if (E.meter >= 1) { E.phase = 'done'; g.bossLine = null; BW13.reveal(g); }
  }
};
BW13.reveal = function (g) {
  const S = BW13.state, p = g.player, L = BW13.LOVE, M = BW13.MAN, pearl = g.actor('pearl');
  const door = BW13.LOVEDOOR;
  const camIn = { x: L.x + 2.4, y: 1.7, z: L.z - 1.4, tx: L.x, ty: 1.0, tz: L.z - 4.2, fov: 0.8 };
  const camOut = { x: door.x + 2, y: 16, z: door.z + 16, tx: M.x, ty: 58, tz: M.z, fov: 0.62 };
  g.cutscene([
    { cam: camIn },
    { do: g2 => { p.animOverride = 'yell'; burnsSfx('yell', { vol: 0.8 }); g2.shake(0.3); } },
    { say: ['brady', ['CHINKAAAAAAA!']] },
    { do: g2 => { p.animOverride = 'bw1213_floorsit'; burnsMusic(null); S.clearSky = 1; } },
    { wait: 1.4 },
    { cam: camOut },
    { wait: 1.0 },
    { do: g2 => { S.flare = 1; burnsSfx('firework_launch', { vol: 0.6 }); } },
    { wait: 1.6 },
    { do: g2 => { burnsSfx('firework_burst', { vol: 0.6 }); burnsSfx('chinka', { vol: 0.6 }, 'secret'); } },
    { say: [{ name: 'A VOICE, VERY FAR AWAY', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['...BRAAAADY!']] },
    { cam: camIn },
    { do: g2 => { p.animOverride = 'cheer'; burnsMusic('credits', 'w7'); } },
    { say: ['brady', ['That\'s HER! She\'s ALIVE!', 'She\'s... on top of the Man\'s pavilion?!']] },
    { say: [pearl, ['Mm-hmm. That\'s a reply. Ninety-two percent, baby.', 'The other eight percent found a really good sandwich.']] },
    { do: g2 => { g2.missions.complete('lostlove'); } }
  ], g2 => BW13.goons(g2));
};
// the Man's goons revoke Brady's ticket and march him out to the gate road
BW13.goons = function (g) {
  const S = BW13.state, p = g.player, L = BW13.LOVE, door = BW13.LOVEDOOR, E = BW13.EXIT;
  const cop = g.actor('cop'), rng = g.actor('ranger'), pearl = g.actor('pearl'), flow = g.actor('flow'), klaus = g.actor('klaus');
  const setCine = a => { if (a) { a.setBehavior('bw12cine'); a.def.fixedY = false; a.ch.play('idle'); } };
  setCine(cop); setCine(rng);
  const march = { t: 0 };
  g.cutscene([
    { do: g2 => { S.clearSky = 0; p.animOverride = null; p.teleport(L.x, 0, L.z + 3.2, 0); if (cop) { cop.x = door.x - 1.0; cop.z = door.z - 2.2; cop.y = 0; cop.yaw = Math.PI; } if (rng) { rng.x = door.x + 1.0; rng.z = door.z - 2.2; rng.y = 0; rng.yaw = Math.PI; } burnsMusic('castle', 'w7'); } },
    { cam: { x: L.x - 2.8, y: 2.0, z: L.z + 1.6, tx: door.x, ty: 1.3, tz: door.z - 2.0, fov: 0.8 } },
    { say: [cop || 'COP', ['Groovy. ...FREEZE!', '(He flashes his badge.) I mean... greetings, fellow burner. You\'re under... groovy arrest.']] },
    { say: [rng || 'RANGER', ['Per the principles: a formal complaint has been filed against you by a...', '(He checks his clipboard.) ...forty-foot wooden effigy.']] },
    { say: [cop || 'COP', ['Disturbing the Man\'s romance. Unauthorized flowing. Breathing in a tantra tent without a partner.']] },
    { say: [rng || 'RANGER', ['Your ticket is REVOKED.']] },
    { say: ['brady', ['You can\'t revoke a ticket for—']] },
    { say: [rng || 'RANGER', ['I\'m writing it down. That makes it real.']] },
    { fade: 'out', dur: 0.5 },
    { do: g2 => { p.teleport(0, 0, 44, 0); p.locked = true; if (cop) { cop.x = -0.9; cop.z = 44; } if (rng) { rng.x = 0.9; rng.z = 44; } march.t = 0; if (flow) { flow.data.mode = 'respect'; flow.x = -5; flow.z = 66; } if (klaus && BurnsSave.hasToken(13, 'twinflame')) { /* stays with Solstice */ } } },
    { fade: 'in', dur: 0.5 },
    { cam: { x: 5.5, y: 2.6, z: 96, tx: 0, ty: 1.2, tz: 60, fov: 0.85 } },
    { until: g2 => {
      march.t += 1 / 120; const z = 44 + march.t * 3.2;
      p.x = 0; p.z = z; p.y = 0; p.yaw = 0; p.animOverride = 'walk';
      if (cop) { cop.x = -0.95; cop.z = z; cop.y = 0; cop.yaw = 0; cop.ch.play('walk'); }
      if (rng) { rng.x = 0.95; rng.z = z; rng.y = 0; rng.yaw = 0; rng.ch.play('walk', { rate: 1.1 }); }
      if (flow && march.t > 2 && !march.f) { march.f = true; flow.say('Flow safely, brother!', 2.4); }
      return march.t > 7.5;
    } },
    { fade: 'out', dur: 0.5 },
    { do: g2 => { p.teleport(E.x, 0, E.z, Math.PI); p.animOverride = null; if (cop) { cop.x = E.x - 1.3; cop.z = E.z - 2.2; cop.yaw = 0.3; cop.ch.play('idle'); } if (rng) { rng.x = E.x + 1.3; rng.z = E.z - 2.2; rng.yaw = -0.3; rng.ch.play('clipboard'); } burnsMusic('w7'); } },
    { fade: 'in', dur: 0.5 },
    { cam: { x: E.x + 6.2, y: 1.8, z: E.z - 1.2, tx: E.x - 0.4, ty: 1.3, tz: E.z - 1.1, fov: 0.85 } },
    { say: [rng || 'RANGER', ['This is the gate road. Gate\'s that way. Don\'t come back.', 'I\'m writing down that I told you that.']] },
    { say: [cop || 'COP', ['Groovy. Bye now.']] },
    { do: g2 => { if (cop) { cop.setBehavior('walk'); cop.def.path = [[-12, 60], [12, 60]]; cop.def.pingpong = true; cop.speed = 1.6; } if (rng) { rng.setBehavior('walk'); rng.def.path = [[-12, 52], [12, 52], [12, 70], [-12, 70]]; rng.speed = 1.6; } } },
    { wait: 1.4 },
    { say: ['brady', ['Revoked. Chinka\'s on top of the Man\'s pavilion, and I\'m standing on the gate road.']] },
    { do: g2 => { const P = S.plane; P.visible = true; P.x = 70; P.y = 20; P.z = E.z - 9; P.yaw = -Math.PI / 2; S.planeT = 0; S.planeOn = true; burnsSfx('artcarHorn', { vol: 0.25, pitch: 0.5 }); p.yaw = 0.5; p.animOverride = 'bw1213_lookup'; } },
    { cam: { x: E.x + 1.2, y: 0.9, z: E.z + 4.2, tx: E.x - 3, ty: 11, tz: E.z - 9, fov: 1.0 } },
    { wait: 2.0 },
    { say: ['brady', ['If I can\'t get back in through the gate...', '...I\'ll come in from the SKY.']] },
    { banner: ['TO BE CONTINUED', '...from the sky.', { col: '#38c8ff', big: true, dur: 3 }] },
    { wait: 2.2 },
    { do: g2 => { p.locked = false; p.animOverride = null; S.plane.visible = false; S.planeOn = false; } }
  ], g2 => g2.finishWorld());
};

/* ============================================================
   revisits: put everyone where the story left them
   ============================================================ */
BW13.restore = function (g) {
  const S = BW13.state, M = g.missions;
  const flow = g.actor('flow'), klaus = g.actor('klaus'), sol = g.actor('solstice'), T = BW13.TANTRA;
  if (M.isDone('contact') && flow) flow.data.mode = 'free';
  if (M.isDone('tantra') && klaus) { klaus.data.mode = 'sad'; klaus.x = T.x - T.R - 2.4; klaus.z = T.z - 3; klaus.yaw = -Math.PI / 2; for (const c of S.cushions) c.mv.visible = false; }
  if (M.isDone('twinflame')) { const D = BW13.SOUNDDOOR; if (klaus) { klaus.data.mode = 'love'; klaus.x = D.x + 3.4; klaus.z = D.z + 0.9; klaus.yaw = Math.PI; } if (sol) { sol.data.mode = 'love'; sol.x = D.x + 3.4; sol.z = D.z - 0.9; sol.yaw = 0; } }
  if (M.isDone('belonging')) for (const f of S.followers) { const a = g.actor(f.id); if (a) a.data.mode = 'free'; }
  if (BurnsSave.flag(13, 'passport') === undefined && (M.isDone('contact') || M.isDone('tantra'))) BurnsSave.flag(13, 'passport', true);
};

/* ============================================================
   sprites: stare beams, rung bowls, the heart flare over the Man's pavilion, breathing light
   ============================================================ */
BW13.drawSprites = function (g, R) {
  const S = BW13.state, SP = BURNS_SPRITES.R, t = g.time, p = g.player;
  // stare beam (locked on Brady, or sweeping in the dome)
  const sol = g.actor('solstice');
  if (sol && !sol.hidden) {
    const eye = sol.ch.bonePoint(BURNS_BONES.HEAD, 0, 0.22, 0.2);
    if (S.gaze && S.gaze.on) {
      const tgt = [p.x, p.y + 1.6, p.z];
      BW1213.FX.beam(R, eye, tgt, 0.75, [1, 0.45, 0.9], 0.5, false, SP.glow);
      BW1213.FX.beam(R, eye, tgt, 0.16 + Math.sin(t * 20) * 0.03, [0.95, 0.15, 0.7], 0.8, true);
      BW1213.FX.dots(R, eye, tgt, 10, 0.22, [1, 0.8, 1], 0.9, (t * 2) % 1);
    } else if (sol.data.mode === 'bath' || (sol.data.wind > 0)) {
      const L = sol.data.mode === 'bath' ? 11 : 9, yaw = sol.yaw, end = [eye[0] + Math.sin(yaw) * L, eye[1] - 0.25, eye[2] + Math.cos(yaw) * L];
      BW1213.FX.beam(R, eye, end, sol.data.mode === 'bath' ? 1.1 : 0.5, [0.85, 0.5, 1], 0.45, false, SP.glow);
      BW1213.FX.beam(R, eye, end, sol.data.mode === 'bath' ? 0.22 : 0.08, [0.6, 0.2, 0.9], sol.data.mode === 'bath' ? 0.55 : 0.35 + Math.sin(t * 30) * 0.15, true);
      if (sol.data.mode === 'bath') BW1213.FX.dots(R, eye, end, 12, 0.3, [1, 0.85, 1], 0.6, (t * 1.5) % 1);
    }
  }
  if (S.twinBeam) {
    const k = g.actor('klaus');
    if (k && sol) { const a = sol.ch.bonePoint(BURNS_BONES.HEAD, 0, 0.22, 0.2), b = k.ch.bonePoint(BURNS_BONES.HEAD, 0, 0.22, 0.2); BW1213.FX.beam(R, a, b, 0.7, [1, 0.4, 0.7], 0.6, false, SP.glow); BW1213.FX.beam(R, a, b, 0.14, [1, 0.2, 0.55], 0.85, true); BW1213.FX.dots(R, a, b, 10, 0.3, [1, 0.7, 0.85], 0.9, (t * 1.2) % 1); }
  }
  // singing bowls glow when rung (and hint glow while the mission is on)
  const bathOn = g.missions.state('sound') === 'active';
  for (const b of S.bowls) { const k = b.rung ? 0.4 + b.k * 0.6 : bathOn ? 0.25 + Math.sin(t * 3 + b.x) * 0.1 : 0; if (k > 0.01) R.bbs.bb(b.x, b.y + 0.3, b.z, 1.6 * (b.big ? 1.6 : 1), 1.6 * (b.big ? 1.6 : 1), SP.glow, b.rung ? [0.8, 0.6, 1] : [1, 0.9, 0.6], k * 0.7, true); }
  // the breathing light in the exercise
  const E = S.ex;
  if (E && E.phase === 'breathe') { const k = BW13.breathK(E.t); R.flat.flat(p.x, p.y + 0.06, p.z, 1.2 + k * 2.6, 1.2 + k * 2.6, 0, SP.ring, k > 0.8 ? [1, 0.6, 0.85] : [0.7, 0.6, 1], 0.5 + k * 0.4, true); R.bbs.bb(p.x, p.y + 1.2, p.z, 1 + k * 2.2, 1 + k * 2.2, SP.glow, [1, 0.55, 0.8], 0.2 + k * 0.35, true); }
  if (E && E.phase === 'call') { const k = E.meter; R.bbs.bb(p.x, p.y + 1.5, p.z, 1 + k * 3.5, 1 + k * 3.5, SP.heart, [1, 0.35, 0.6], 0.3 + k * 0.6, true); }
  // the heart flare over the Man's pavilion
  if (S.flare > 0) {
    const M = BW13.MAN, k = S.flare, rise = clamp((1 - k) * 5, 0, 1), y = 56 + rise * 14, sz = 20 + rise * 22;
    R.bbs.bb(M.x, y, M.z, sz * 2.4, sz * 2.4, SP.glow, [1, 0.35, 0.65], Math.min(0.9, k * 1.2), true);
    R.bbs.bb(M.x, y, M.z, sz, sz, SP.heart, [1, 0.25, 0.55], Math.min(1, k * 1.6), false);
    R.bbs.bb(M.x, y, M.z, sz * 0.8, sz * 0.8, SP.heart, [1, 0.75, 0.9], Math.min(1, k * 1.6) * 0.8, true);
    if (rise < 1) R.bbs.streak(M.x, 47 + rise * 10, M.z, 0, 1, 0, 20 * rise + 2, 3, SP.streak, [1, 0.6, 0.85], 0.8);
  }
};

/* test/debug hooks for the World 12 + 13 scripts (read-only peeks at world state) */
if (window.BRADY_BURNS) window.BRADY_BURNS.w1213 = { w12: () => BW12.state, w13: () => BW13.state, strokeAt: (st, s) => BW12.strokeAt(st, s), BW12, BW13 };
