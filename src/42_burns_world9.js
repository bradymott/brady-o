/* ============================================================
   BRADY-O BURNS — World 9: DEEP PLAYA SHOWDOWN (night, dust storm)
   A dust storm rolls over the deep playa. The Temple glows far behind Brady
   (a quiet place: no fighting there). The Man is out here with Chinka.
   Missions (Burn Tokens):
     whiteout   Follow the Lamp Line   wake the Leaning Lighthouses' beacon, then
                                       follow the lamplighters' lamps through a whiteout
     lost       Lost in the Dust       find 5 lost burners and lead them to the Outpost
     secretset  The Secret Set         a rumor, a bass line, the trash fence, two robots
     artist     Wire and Glow          help Wren finish her giant wire-frame moth
     devil      Devil's Shelter        outrun a giant dust devil to the Sleeping Giant (the gap
                                       between his boots; the cupped hand on our stand-in)
     giantclimb Giant Steps            hidden: climb the Sleeping Giant to his nose
     boss       The Man in the Storm   he fights from the dust... then the dust takes them
   The Leaning Lighthouses and the Sleeping Giant are placed through BurnsBigArt
   when that module is present (see BURNS_W9.placeArt), with our own stand-ins otherwise.
   ============================================================ */

const BURNS_W9 = {
  TEMPLE: { x: 0, z: 196, r: 34 }, SPAWN: { x: 0, z: 150 }, OUTPOST: { x: -10, z: 4 },
  LIGHT: { x: 36, z: 120, top: 15.2 }, LAMPS: [[0, 128], [-3, 104], [-8, 80], [-9, 56], [-8, 32], [-10, 14]],
  GIANT: { x: 115, z: -40 }, HAND: { x: 118, z: -58, r: 2.7 }, DEVIL_T: { x: 62, z: -28 },
  MOTH: { x: -92, z: -132 }, FENCE_Z: -258, SET: { x: -120, z: -246 },
  ARENA: { x: 40, z: -190, r: 34 },
  state: null
};
const BURNS_W9_SKY = Object.assign({}, BURNS_PALETTES.night, {
  zen: '#0c0914', hor: '#3a2a30', mid: '#2a1c26', midK: 0.4, fog: '#4a3a3e', fogD: 0.014, haze: 0.75, fogMax: 0.95,
  moon: [150, 38], moonK: 0.55, stars: 0.35, mtnCol: '#1a1218', city: [0, 0], cityCol: '#ff8a5a', cityK: 0.55,
  sky: '#4a4058', gnd: '#3a2c30', key: '#9a8aa8', keyK: 0.42, emB: 1.6, rim: '#c89aff', clouds: 0.3, cloudCol: '#5a4a50'
});
const BURNS_W9_LINES = {
  stomp: ['THE STORM DANCES TO MY HEARTBEAT!', 'STOMP OF LONGING!'], swipe: ['LOW BLOW... OF DUST!', 'JUMP, LITTLE BUN!'],
  flash: ['NEON THROUGH THE DUST! HIDE!', 'BEHOLD MY GLOW! TAKE COVER!'], fireworks: ['A ROMANTIC FIREWORKS DISPLAY!', 'OOH! AAH! WOW!'],
  devil: ['DANCE WITH MY DUST DEVILS!', 'TWIRL, SMALL MAN, TWIRL!'], vanish: ['NOW YOU SEE ME...', 'I AM ONE WITH THE DUST!']
};

/* a kneel for quiet moments */
BURNS_ANIMS.w8910kneel = (P, t) => { const B = BURNS_BONES, S = (b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; }; S(B.THIGH_L, -1.45); S(B.SHIN_L, 2.3); S(B.THIGH_R, -0.2); S(B.SHIN_R, 1.9); S(B.CHEST, 0.45 + Math.sin(t * 1.2) * 0.02); S(B.HEAD, 0.45); S(B.UARM_L, -0.9, 0, 0.15); S(B.FARM_L, -0.5); S(B.UARM_R, -0.9, 0, -0.15); S(B.FARM_R, -0.5); P.y = -0.45; P.face = 2; };

BurnsWorlds.register({
  id: 9, name: 'Deep Playa Showdown', sub: 'The Man, again',
  sky: BURNS_W9_SKY, tod: 0,
  music: 'burns_w9',
  bounds: [-200, -268, 200, 225],
  spawn: { x: 0, y: 0, z: 150, yaw: Math.PI },
  ground: { base: '#a88870', crack: 0.3, mottle: 0.45, res: 0.55 },
  dust: 2.2, bike: true,
  missions: [
    { id: 'whiteout', name: 'Follow the Lamp Line', short: 'Talk to the lamplighters', type: 'custom', giver: 'lamp', start: 'manual', marker: { x: -8, z: 140 },
      desc: 'A whiteout is coming. Wake the beacon on the Leaning Lighthouses, then follow the lamplighters\' lamps to the Outpost.', hint: 'Lamplighters\' camp, just north of the Temple road',
      onUpdate(g, m) { BURNS_W9.whiteoutUpdate(g, m); } },
    { id: 'lost', name: 'Lost in the Dust', short: 'Lead lost burners to the Outpost', type: 'custom', count: 5, giver: 'outpost', start: 'manual', requires: ['whiteout'], progressLabel: 'Burners safe', marker: { x: -10, z: 4 },
      desc: 'Five burners are wandering blind in the storm. Find them (listen for MARCO!), then lead them to the Outpost dome.', hint: 'Out in the dust all around the Outpost' },
    { id: 'secretset', name: 'The Secret Set', short: 'Follow the bass to the trash fence', type: 'custom', giver: 'rumor', start: 'manual', requires: ['whiteout'],
      desc: 'Everyone\'s whispering about a secret set at the trash fence. Follow the bass. Louder means warmer.', hint: 'Somewhere along the trash fence. Listen.',
      onUpdate(g, m, dt) { BURNS_W9.setUpdate(g, m, dt); } },
    { id: 'artist', name: 'Wire and Glow', short: 'Find wire and glow paint for Wren', type: 'collect', count: 6, giver: 'wren', start: 'manual', progressLabel: 'Parts', marker: { x: -84, z: -118 },
      desc: 'Wren\'s giant wire moth needs three coils of wire and three cans of glow paint. The storm scattered them.', hint: 'Wren\'s moth sculpture, deep playa west',
      onComplete(g) { BURNS_W9.mothLit(g); } },
    { id: 'devil', name: 'Devil\'s Shelter', short: 'Get to the Sleeping Giant\'s hand!', type: 'custom', start: 'trigger', requires: ['whiteout'], time: 45, failOnFaint: true, marker: { x: 118, z: -58 },
      desc: 'A dust devil the size of a building is coming. The Sleeping Giant\'s cupped hand is the only shelter.', hint: 'The flats between the Outpost and the Sleeping Giant',
      onStart(g) { BURNS_W9.devilStart(g); }, onFail(g) { BURNS_W9.devilEnd(g); }, onUpdate(g, m) { BURNS_W9.devilUpdate(g, m); } },
    { id: 'giantclimb', name: 'Giant Steps', short: 'Climb the Sleeping Giant', type: 'climb', start: 'trigger', secret: true, target: { x: 139, z: -40, r: 3.4, y: 10.2 }, tokenAt: { x: 139, y: 12.4, z: -40 },
      desc: 'He\'s been asleep since 2009. He won\'t mind if you climb up to his nose.', hint: 'The Sleeping Giant, east' },
    { id: 'boss', name: 'The Man in the Storm', short: 'Defeat the Man!', type: 'boss', start: 'manual', requires: ['whiteout', 'lost'], tokenDirect: true, marker: { x: 40, z: -190 },
      desc: 'He\'s out there in the dust with Chinka. Hide from the flash behind the giant chairs.', hint: 'The open flats north of the Outpost', lockedDesc: 'Get through the whiteout and help the lost burners first.' }
  ],
  build(api, g) {
    const W9 = BURNS_W9, S = BurnsW8910Shape;
    W9.state = { introDone: !!BurnsSave.flag(9, 'intro'), storm: 0.35, surgeT: 30, surge: 0, darkwads: [], lampGlows: [], beaconOn: !!BurnsSave.flag(9, 'beacon'), goggles: !!BurnsSave.flag(9, 'goggles'), followers: [], beatT: 0, warmT: 0, mothGlows: [], neck: null };
    const st = W9.state;
    W9.paintGround(api);
    /* ---------------- the Temple (quiet) ---------------- */
    W9.buildTemple(api);
    /* ---------------- the lamplighters, the beacon and the lamp line ---------------- */
    W9.buildLampLine(api);
    st.art = {};
    // (placed at the fixed base spot every visit; W9.LIGHT is where the beacon ends up: our tower top or the module's summit)
    const LB = W9.LIGHT_BASE || (W9.LIGHT_BASE = Object.assign({}, W9.LIGHT));
    W9.LIGHT = Object.assign({}, LB);
    st.art.lh = W9.placeArt(api, g, 'lighthouses', LB.x, LB.z, { rotY: 0.3, onReach: g2 => { if (g2.missions.state('whiteout') === 'active') BURNS_W9.beacon(g2); } }, () => W9.lighthouses(api));
    if (!st.art.lh.big) W9.lighthouseClimb(api);
    else { const P = st.art.lh.info; if (P && P.summit) { W9.LIGHT.x = P.summit.x; W9.LIGHT.z = P.summit.z; W9.LIGHT.top = P.summit.y; } }
    api.checkpoint('cp_start', 6, 146, { yaw: Math.PI, name: 'Temple Road' });
    /* ---------------- the Outpost ---------------- */
    W9.buildOutpost(api);
    /* ---------------- lost burners ---------------- */
    const lost = [['partied', -66, 64, 'TUESDAY GARY', 'MARCO?! ...Is it still Tuesday?'], ['mom', 58, 76, 'BURNER MOM', 'MARCO! Has anyone seen my son? He\'s embarrassed of me, so he\'s probably hiding.'], ['furry', -96, -26, 'FUZZBUCKET', 'MARCO! It is SO HOT in this suit. And so dusty. So hot AND dusty.'], ['burney', 44, 22, 'BURNEY', 'MARCO! Can\'t take photos in this. Everything\'s beige.'], ['pony', -40, -72, 'GLIMMER', 'MARCO! I can\'t see! Also I have no water! Also no flashlight!']];
    lost.forEach(([kind, x, z, name, line], i) => {
      api.npc(BURNS_W8910_ARCH.npc(kind, { id: 'lost' + i, name, x, z, behavior: 'wander', radius: 4, speed: 0.8, chat: [line.split('!')[0] + '!', 'MARCO?!', 'Hello? Is anyone out there?'], lostIdx: i,
        talk(g2, a) { BURNS_W9.lostTalk(g2, a, line); }, marker: (g2, a) => (g2.missions.state('lost') === 'active' && !a.data.following && !a.data.safe ? '?' : null) }));
    });
    /* ---------------- darkwads: you can't see them, they don't care ---------------- */
    [[-2, 116], [-7, 92], [-12, 66], [-5, 44], [-14, 24], [30, -128], [52, -150], [-30, -40]].forEach(([x, z], i) => {
      const d = api.npc(BURNS_W8910_ARCH.npc('darkwad', { id: 'dw' + i, x, z, yaw: Math.random() * TAU, behavior: 'idle', darkwad: true, chatter: false,
        talk(g2, a) { BURNS_W9.darkwadTalk(g2, a); } }));
      st.darkwads.push(d.id);
    });
    /* ---------------- the playa artist and her wire moth ---------------- */
    W9.buildMoth(api);
    /* ---------------- the Sleeping Giant (shelter + hidden climb) ---------------- */
    // (boots to the west, toward the Outpost; head to the east. The module's piece also hides a photo in his pocket)
    st.art.giant = W9.placeArt(api, g, 'sleepingGiant', W9.GIANT.x, W9.GIANT.z, { rotY: Math.PI / 2, mission: 'giantclimb', pocket: { kind: 'photo', id: 'p1' } }, () => W9.sleepingGiant(api));
    if (st.art.giant.big) W9.adoptGiant(g, st.art.giant.info);
    else api.pickup('photo', 137.5, 10.8, -40, { id: 'p1' });
    api.trigger({ x: W9.DEVIL_T.x, z: W9.DEVIL_T.z, r: 12, when: g2 => g2.missions.state('devil') === 'available', onEnter: g2 => g2.missions.start('devil') });
    api.trigger({ x: W9.GIANT.x + 4, z: W9.GIANT.z, r: 26, once: true, when: g2 => g2.missions.state('giantclimb') === 'available', onEnter: g2 => { g2.missions.start('giantclimb'); g2.banner('HIDDEN CHALLENGE', 'Giant Steps: climb up to his nose!', { col: '#7aff5a' }); } });
    /* ---------------- the trash fence + the secret set ---------------- */
    W9.buildFence(api);
    W9.buildSecretSet(api);
    /* ---------------- the arena: the Man in the storm ---------------- */
    W9.buildArena(api, g);
    /* ---------------- collectibles + gifts ---------------- */
    api.pickup('photo', W9.SET.x + 6, 1.2, W9.FENCE_Z + 2.2, { id: 'p2' });
    api.pickup('bag:lsd', 22, 0.9, 86);
    api.hidden(() => {
      const steps = [[30, 1.4, 70], [33, 2.8, 66], [36.5, 4.2, 63], [40.5, 5.6, 61], [44.5, 7.0, 60], [48.5, 8.4, 61]];
      steps.forEach(([x, y, z], i) => api.roundBox(x, y - 0.3, z, 2.4, 0.3, 2.4, burnsHSL(260 + i * 22, 0.85, 0.65), { e: 0.6, r: 0.12 }));
      api.glow(48.5, 9.6, 61, 2.6, '#ff4fd8');
    });
    api.pickup('photo', 48.5, 9.2, 61, { id: 'p3', hidden: true });
    api.pickup('bag:weed', -30, 0.9, 120); api.pickup('bag:molly', 12, 0.9, -30); api.pickup('bag:powder', -60, 0.9, -160); api.pickup('bag:bufo', 96, 0.9, -12); api.pickup('bag:shrooms', 70, 0.9, -230); api.pickup('bag:liquor', -150, 0.9, -236);
    api.pickup('water', -4, 0.9, 132); api.pickup('water', -18, 0.9, 30); api.pickup('water', 60, 0.9, 60); api.pickup('water', -100, 0.9, -80); api.pickup('water', 100, 0.9, -70);
    api.glowLine(10, 60, 50, 30, 8); api.glowLine(-20, -10, -70, -60, 9); api.glowLine(30, -20, 90, -30, 10); api.glowLine(-40, -150, -100, -220, 10); api.glowLine(20, -60, 36, -140, 9);
    api.marker('temple', W9.TEMPLE.x, W9.TEMPLE.z, 'Temple', { col: '#ffd8a0' });
    api.marker('outpost', W9.OUTPOST.x, W9.OUTPOST.z, 'Outpost', { col: '#38f2ff' });
    api.marker('giant', W9.GIANT.x, W9.GIANT.z, 'Sleeping Giant', { col: '#c8a070' });
    api.marker('moth', W9.MOTH.x, W9.MOTH.z, 'Wire Moth', { col: '#ff4fd8' });
    api.region('temple', W9.TEMPLE.x, W9.TEMPLE.z, W9.TEMPLE.r);
    api.update((g2, dt) => BURNS_W9.update(g2, dt));
  },
  onStart(g) {
    const S = BURNS_W9.state;
    if (g.missions.isDone('whiteout')) S.beaconOn = true;
    if (g.missions.isDone('artist')) BURNS_W9.mothLit(g, true);
    if (g.missions.isDone('boss')) { S.man.hidden = true; S.man.showChinka = false; S.bossStarted = true; S.after = true; }
    for (let i = 0; i < 5; i++) { const a = g.actor('lost' + i); if (a && g.missions.isDone('lost')) { a.data.safe = true; a.x = BURNS_W9.OUTPOST.x + Math.sin(i * 1.3) * 5; a.z = BURNS_W9.OUTPOST.z + Math.cos(i * 1.3) * 5 + 2; a.setBehavior('dance'); } }
    if (!S.introDone) BURNS_W9.intro(g);
    else g.banner('DEEP PLAYA', 'The storm is rolling in. So is the Man.', { col: '#9a6bff' });
  },
  onRespawn(g) {
    const S = BURNS_W9.state;
    BurnsW8910Haz.clear(g);
    if (S.bossStarted && !g.missions.isDone('boss') && S.man && !S.man.defeated) { const m = S.man, A = BURNS_W9.ARENA; m.x = A.x; m.z = A.z - 6; m.hidden = false; m.setState('idle'); m.combo = 0; }
  },
  env(g, env) { BURNS_W9.env(g, env); },
  drawSprites(g, R) { BurnsW8910Haz.draw(g, R); BURNS_W9.drawSprites(g, R); },
  drawSkinned(g, R) { BurnsW8910Acc.draw(g, R); },
  update(g, dt) { BurnsW8910.tick(g, dt); }
});

/* ---------------- big art placement (guarded) ----------------
   Uses the shared big-art module (src/41_burns_bigart.js, docs/BURNS_BIGART.md) when it is
   loaded; otherwise builds our own stand-in. Mission hooks (beacon top, hand shelter, nose)
   use the BURNS_W9 coordinates above, so the stand-ins and the module line up at integration. */
BURNS_W9.placeArt = function (api, g, kind, x, z, o, fallback) {
  // (only kinds the module already has: the others stay on our stand-in quietly until they land)
  if (typeof BurnsBigArt !== 'undefined' && BurnsBigArt && typeof BurnsBigArt.place === 'function' && (!BurnsBigArt.kinds || BurnsBigArt.kinds[kind])) {
    try { const info = BurnsBigArt.place(api, g, kind, x, z, o || {}); if (info !== false) return { big: true, info }; } catch (e) { console.warn('BurnsBigArt.place(' + kind + ') failed; using the stand-in', e); }
  }
  return { big: false, info: fallback() };
};

// the module's Sleeping Giant has no cupped hand: the shelter is the canyon between his boots, and the
// hidden climb ends at his nose (the piece's summit, where the module drops the token)
BURNS_W9.adoptGiant = function (g, P) {
  const W9 = BURNS_W9;
  if (!P || typeof P.toWorld !== 'function') return;
  const c = P.toWorld(0, 0, -16.5);
  W9.HAND = { x: c[0], z: c[2], r: 2.6, P, box: [-1.9, 1.9, -23.8, -9.8], boots: true };
  const dv = g && g.missions && g.missions.get('devil');
  if (dv) Object.assign(dv.def, { marker: { x: c[0], z: c[2] }, short: 'Duck between the Sleeping Giant\'s boots!', desc: 'A dust devil the size of a building is coming. The gap between the Sleeping Giant\'s boots is the only shelter.' });
  const S = P.summit, gc = g && g.missions && g.missions.get('giantclimb');
  if (S && gc) Object.assign(gc.def, { target: { x: S.x, z: S.z, r: S.r + 0.6, y: S.y - 0.3 }, tokenAt: { x: S.x, y: S.y + 1.3, z: S.z }, hint: 'The Sleeping Giant, east: start at his boots' });
};
// is Brady in the shelter? (the stand-in: the cupped hand; the module's giant: between his boots)
BURNS_W9.inShelter = function (g) {
  const H = BURNS_W9.HAND, p = g.player;
  if (H.box && H.P) { const l = H.P.toLocal(p.x, p.z), b = H.box; return l[0] > b[0] && l[0] < b[1] && l[1] > b[2] && l[1] < b[3] && p.y < 3.2; }
  return Math.hypot(p.x - H.x, p.z - H.z) < H.r && p.y < 3.2;
};

/* ---------------- ground ---------------- */
BURNS_W9.paintGround = function (api) {
  const R = api.rng, W9 = BURNS_W9;
  api.paint((c, P, sc) => {
    for (let i = 0; i < 240; i++) { const x = R.range(-200, 200), z = R.range(-268, 225), [px, pz] = P(x, z), r = R.range(3, 14) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.5; gg.addColorStop(0, dark ? 'rgba(110,84,70,0.25)' : 'rgba(230,206,180,0.22)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    // wind ripples in the dust
    c.strokeStyle = 'rgba(240,220,200,0.1)'; c.lineWidth = 0.5 * sc;
    for (let i = 0; i < 160; i++) { const [ax, az] = P(R.range(-200, 200), R.range(-268, 225)), len = R.range(6, 22) * sc; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + len * 0.5, az + len * 0.15, ax + len, az); c.stroke(); }
    // the Temple path: soft, swept, footprints
    const [tx0, tz0] = P(-3, 186), [tx1, tz1] = P(3, 150); c.fillStyle = 'rgba(220,196,168,0.32)'; c.fillRect(tx0, tz1, tx1 - tx0, tz0 - tz1);
    // the Man's arena: a scorched heart-shaped scuff
    const [ax2, az2] = P(W9.ARENA.x, W9.ARENA.z), rr2 = W9.ARENA.r * sc; const ga = c.createRadialGradient(ax2, az2, rr2 * 0.2, ax2, az2, rr2); ga.addColorStop(0, 'rgba(70,46,54,0.5)'); ga.addColorStop(0.9, 'rgba(90,60,66,0.4)'); ga.addColorStop(1, 'rgba(90,60,66,0)'); c.fillStyle = ga; c.beginPath(); c.arc(ax2, az2, rr2, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(255,120,200,0.25)'; c.lineWidth = 1.0 * sc; c.beginPath(); c.arc(ax2, az2, rr2 * 0.96, 0, TAU); c.stroke();
  });
};

/* ---------------- the Temple: an original, quiet structure ---------------- */
BURNS_W9.buildTemple = function (api) {
  const S = BurnsW8910Shape, T = BURNS_W9.TEMPLE;
  api.mesh(T.x, T.z, m => {
    const wood = BURNS_ATLAS.pattern('wood');
    // a ring of tall curved wooden arches around a tiered spire
    m.color('#d8b888').shine(1);
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * TAU, x0 = Math.sin(a) * 11, z0 = Math.cos(a) * 11, x1 = Math.sin(a + TAU / 8) * 11, z1 = Math.cos(a + TAU / 8) * 11;
      m.limb(x0, 0, z0, x0 * 0.9, 7.5, z0 * 0.9, 0.42, 0.32, { uv: wood });
      m.limb(x0 * 0.9, 7.5, z0 * 0.9, (x0 + x1) * 0.42, 10.2, (z0 + z1) * 0.42, 0.32, 0.22, { uv: wood });
      m.limb((x0 + x1) * 0.42, 10.2, (z0 + z1) * 0.42, x1 * 0.9, 7.5, z1 * 0.9, 0.22, 0.32, { uv: wood });
      // lattice panels with notes tucked in
      m.color('#c8a070'); m.push(); m.tf((x0 + x1) * 0.48, 0, (z0 + z1) * 0.48, a + TAU / 16); m.roundBox(0, 1.6, 0, 5.2, 3.2, 0.16, 0.06); m.pop();
      m.color('#fffaf0', 0.3); for (let k = 0; k < 7; k++) { m.push(); m.tf((x0 + x1) * 0.48 + Math.sin(a + 1.9) * (k - 3) * 0.6, 0.7 + (k % 3) * 0.75, (z0 + z1) * 0.48 + Math.cos(a + 1.9) * (k - 3) * 0.6, a + TAU / 16 + Math.PI); m.box(0, 0, -0.1, 0.32, 0.22, 0.01); m.pop(); }
      m.emissive(0); m.color('#d8b888');
    }
    // the spire: stacked tiers, softly glowing inside
    m.lathe([[0, 0], [4.2, 0], [4.2, 0.5], [3.6, 0.6], [3.4, 4], [2.6, 4.4], [2.4, 8], [1.6, 8.6], [1.3, 12], [0.6, 13.5], [0.12, 16.2], [0, 16.4]], { seg: 16, uv: wood, uvRepeat: 3 });
    m.color('#ffd8a0', 0.9); m.lathe([[0, 0.6], [3.38, 0.62], [3.3, 3.9], [0, 3.95]], { seg: 16 }); m.emissive(0).shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 3.6, y0: 0, y1: 16 }], lights: [{ x: 0, y: 2.2, z: 0, s: 6, c: '#ffd8a0', pool: 26 }, { x: 0, y: 16.6, z: 0, s: 3, c: '#ffe8c0' }] };
  });
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; api.glow(T.x + Math.sin(a) * 14, 0.4, T.z + Math.cos(a) * 14, 0.7, '#ffd8a0'); }
  api.light(T.x, T.z, 30, '#ffc890', 0.5);
  api.npc(BURNS_W8910_ARCH.npc('lamplighter', { id: 'keeper', name: 'TEMPLE KEEPER', x: T.x + 5.5, z: T.z - 13.5, yaw: Math.PI, behavior: 'sit', chatter: false,
    lines: ['Welcome. Everyone speaks softly here.', 'People leave what they can\'t carry anymore. Names. Notes. Photos.', 'Whatever you\'re looking for out there... I hope you find it.'] }));
  api.trigger({ x: T.x, z: T.z, r: T.r, once: true, onEnter: g => g.banner('THE TEMPLE', 'A quiet place. Leave something. Take a breath.', { col: '#ffd8a0' }) });
};

/* ---------------- the lamp line ---------------- */
BURNS_W9.buildLampLine = function (api) {
  const S = BurnsW8910Shape, W9 = BURNS_W9, st = W9.state;
  const P = W9.LAMPS, pts = [];
  for (let i = 0; i < P.length - 1; i++) { const [x0, z0] = P[i], [x1, z1] = P[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 12)); for (let k = 0; k < n; k++) pts.push([lerp(x0, x1, k / n) + 2.6, lerp(z0, z1, k / n)]); }
  pts.push([P[P.length - 1][0] + 2.6, P[P.length - 1][1]]);
  pts.forEach(([x, z], i) => {
    api.mesh(x, z, m => {
      m.color('#3a2a22').shine(1); m.limb(0, 0, 0, 0, 3.6, 0, 0.09, 0.07); m.limb(0, 3.5, 0, 0.7, 3.7, 0, 0.05, 0.04);
      m.color('#2a2020'); m.push(); m.tf(0.75, 3.05, 0); m.lathe([[0, 0], [0.18, 0.02], [0.2, 0.08], [0.18, 0.1]], { seg: 8 }); m.pop();
      m.color('#ffd890', 1); m.push(); m.tf(0.75, 3.1, 0); m.lathe([[0, 0], [0.17, 0.02], [0.18, 0.42], [0.13, 0.5], [0, 0.52]], { seg: 8 }); m.pop(); m.emissive(0);
      m.color('#2a2020'); m.push(); m.tf(0.75, 3.6, 0); m.lathe([[0, 0], [0.2, 0], [0.04, 0.22], [0, 0.24]], { seg: 8 }); m.pop(); m.shine(0);
      return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.12, y0: 0, y1: 3.6, camPass: true }] };
    });
    st.lampGlows.push(BurnsW8910.glow(api, x + 0.75, 3.35, z, 1.6, '#ffd890'));
    api.light(x, z, 7, '#ffc070', 0.45);
    if (i % 2 === 0) api.pickup('glowstick', x - 2.6, 0.9, z);
  });
  st.lampPts = pts;
  // the lamplighters' camp
  api.prop('shade', { x: -9, z: 141, w: 6, d: 5, col: '#e8dcc0', lights: false });
  api.mesh(-11.5, 143, m => { m.color('#8a6a4a'); m.roundBox(0, 0.4, 0, 2.2, 0.8, 0.8, 0.12); for (let i = 0; i < 6; i++) { m.color('#3a2a22'); m.limb(-0.9 + i * 0.36, 0.8, 0, -0.9 + i * 0.36, 3.6, -0.3, 0.035, 0.03); m.color('#ffd890', 0.9); m.ball(-0.9 + i * 0.36, 3.7, -0.32, 0.12); m.emissive(0); } return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.1, hz: 0.4, y0: 0, y1: 0.8 }] }; });
  api.npc(BURNS_W8910_ARCH.npc('lamplighter', { id: 'lamp', name: 'LAMPLIGHTER LUZ', x: -7.5, z: 138.5, yaw: Math.PI * 0.8, talk(g, a) { BURNS_W9.lampTalk(g, a); } }));
  api.npc(BURNS_W8910_ARCH.npc('lamplighter', { name: 'LAMPLIGHTER', x: -11, z: 138, yaw: 2.4, behavior: 'idle', lines: ['Every dusk we walk the line and light the lamps. Storm or no storm.', 'The lamps don\'t argue with the dust. They just keep glowing.'], gift: { kind: 'glowstick', n: 10 } }));
  api.npc(BURNS_W8910_ARCH.npc('lamplighter', { name: 'LAMPLIGHTER', x: 4, z: 112, yaw: Math.PI, behavior: 'walk', path: [[4, 112], [-2, 92], [4, 112]], speed: 0.9, chatter: true, chat: ['Follow the lamps.', 'Mind the darkwads. They don\'t glow.'] }));
};
// the Leaning Lighthouses (our stand-in): three striped towers leaning on each other
BURNS_W9.lighthouses = function (api) {
  const L = BURNS_W9.LIGHT;
  const tower = (dx, dz, h, lean, yaw, c1, c2) => api.mesh(L.x + dx, L.z + dz, m => {
    m.push(); m.tf(0, 0, 0, yaw, lean, 0);
    const prof = []; const bands = 6;
    for (let k = 0; k <= bands; k++) { const t = k / bands, r = lerp(2.1, 1.3, t), y = t * h; prof.push([r, y, k % 2 ? c2 : c1]); if (k > 0 && k < bands) prof.push([r, y, k % 2 ? c1 : c2]); }
    m.color(c1).shine(2); m.lathe([[0, 0, c1]].concat(prof).concat([[0, h, c2]]), { seg: 18 });
    m.color('#2a2a30'); m.torus(0, h + 0.15, 0, 1.75, 0.12, { seg: 18 }); m.roundCyl(0, h, 0, 1.7, 0.3, 0.1);
    m.color('#fff4c8', 0.6).shine(3); m.push(); m.tf(0, h + 0.3, 0); m.lathe([[0, 0], [1.05, 0], [1.05, 1.6], [0, 1.62]], { seg: 14 }); m.pop(); m.emissive(0);
    m.color('#c8202a').shine(2); m.push(); m.tf(0, h + 1.6, 0); m.lathe([[0, 0], [1.25, 0], [0.5, 0.9], [0.1, 1.3], [0, 1.35]], { seg: 14 }); m.pop(); m.shine(0);
    m.pop();
    return { cols: lean ? [] : [{ t: 'cyl', x: 0, z: 0, r: 1.9, y0: 0, y1: h + 0.3 }, { t: 'cyl', x: 0, z: 0, r: 1.1, y0: h + 0.3, y1: h + 1.95 }] };
  }, { y: 0.08 });
  tower(0, 0, BURNS_W9.LIGHT.top - 0.3, 0, 0, '#f4f0e8', '#c8202a');
  tower(4.6, 2.2, 10.5, -0.2, -1.2, '#f4f0e8', '#2a5ac8');
  tower(-3.8, 3.6, 9, 0.24, 0.6, '#ffe8b0', '#2a8a5a');
  api.light(L.x, L.z, 14, '#fff0c0', 0.35);
};
// a spiral catwalk around the main tower up to the lantern gallery (the climb + beacon switch)
BURNS_W9.lighthouseClimb = function (api) {
  const L = BURNS_W9.LIGHT, n = 18;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU * 1.5 - 1.2, rr = 3.0, y = 0.75 + i * 0.82;
    api.roundBox(L.x + Math.sin(a) * rr, y - 0.22, L.z + Math.cos(a) * rr, 1.8, 0.22, 1.4, '#8a8a92', { yaw: a, r: 0.08 });
  }
  api.roundBox(L.x, L.top - 0.25, L.z, 4.6, 0.25, 4.6, '#5a5a62', { r: 0.12, col: { t: 'cyl', r: 2.6 } });
  api.glowArc(L.x + 3, 1.0, L.z, L.x, L.top + 1, L.z, 2.0, 7);
  api.sign('THE LEANING LIGHTHOUSES\n"WE\'RE NOT DRUNK, WE\'RE TIRED"', L.x - 7, L.z + 6, { yaw: -0.8, h: 1.2, style: { bg: '#1a1a2a', fg: '#fff0c0', size: 34, border: '#fff0c0' } });
};

/* ---------------- the Outpost ---------------- */
BURNS_W9.buildOutpost = function (api) {
  const O = BURNS_W9.OUTPOST;
  api.prop('dome', { x: O.x, z: O.z, r: 7, col: '#e8e0d0', alt: '#c8b8a8', lights: true, glow: '#38f2ff' });
  api.prop('shade', { x: O.x + 11, z: O.z + 4, w: 7, d: 6, col: '#d8c8a8' });
  api.prop('couch', { x: O.x + 11, z: O.z + 2, yaw: 0, col: '#5a2a5a' });
  api.mesh(O.x + 13, O.z + 7, m => { m.color('#8a5a3a'); m.roundBox(0, 0.45, 0, 1.8, 0.9, 0.8, 0.1); m.color('#e8e8f0').shine(3); m.roundCyl(-0.4, 0.9, 0, 0.25, 0.5, 0.08); m.roundCyl(0.4, 0.9, 0, 0.2, 0.4, 0.06); m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.9, hz: 0.4, y0: 0, y1: 0.9 }] }; });
  api.sign('THE OUTPOST\nSTORM SHELTER · CHAI · HUGS', O.x + 8.5, O.z + 9.5, { yaw: Math.PI, h: 1.2, style: { bg: '#102030', fg: '#7af2ff', glow: '#38f2ff', size: 36, border: '#38f2ff' }, glow: '#38f2ff' });
  api.light(O.x, O.z, 18, '#38c8ff', 0.4);
  api.checkpoint('cp_outpost', O.x + 8, O.z + 14, { yaw: Math.PI, name: 'The Outpost' });
  api.npc({ id: 'outpost', name: 'MOJAVE, OUTPOST CAPTAIN', type: 'ranger', seed: 91, x: O.x + 7.5, z: O.z + 11, yaw: Math.PI,
    talk(g, a) { BURNS_W9.outpostTalk(g, a); } });
  api.npc({ id: 'rumor', name: 'WHISPERING WILLOW', type: 'burner', seed: 92, x: O.x + 13.5, z: O.z + 9, yaw: -2.2,
    chat: ['Daft Punk is playing a secret set at the trash fence tonight!', 'Follow the bass!', 'My friend\'s friend\'s camp-mate SAW the robots!'],
    talk(g, a) { BURNS_W9.rumorTalk(g, a); } });
  api.npc({ name: 'CHAI WALLAH', type: 'tutu', seed: 93, x: O.x + 13, z: O.z + 6, yaw: Math.PI, lines: ['Chai in a dust storm is a human right. Drink.', 'Everyone\'s talking about some secret set at the fence. Robots, apparently.'], gift: { kind: 'water' } });
  api.crowd(O.x + 10, O.z + 3, 3, 3, { behaviors: ['sit', 'idle', 'dance'] });
  api.glowRing(O.x, O.z, 10, 14);
};

/* ---------------- Wren's wire moth ---------------- */
BURNS_W9.buildMoth = function (api) {
  const M = BURNS_W9.MOTH, st = BURNS_W9.state;
  api.mesh(M.x, M.z, m => {
    // a giant moth drawn in welded wire: body, wings, antennae (thin, see-through)
    m.color('#b8b0a8').shine(2);
    m.limb(0, 4.5, -7, 0, 6.5, 7, 0.9, 0.6, { mid: 0.3 });
    const wing = (sx) => {
      const pts = [[0, 6, -2], [sx * 9, 13, -6], [sx * 16, 9, -3], [sx * 14, 5, 2], [sx * 6, 4.5, 3], [sx * 11, 2, 6], [sx * 4, 4, 4]];
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; m.limb(a[0], a[1], a[2], b[0], b[1], b[2], 0.08, 0.08); }
      for (let i = 1; i < 6; i++) { const t = i / 6; m.limb(0, 5.8, -1, sx * 16 * t, 13 - 9 * t + Math.sin(t * 3) * 2, -6 + t * 6, 0.05, 0.05); }
    };
    wing(1); wing(-1);
    for (const sx of [1, -1]) { m.limb(0, 6.6, 6.5, sx * 2.5, 9.5, 9, 0.06, 0.04); m.ball(sx * 2.5, 9.5, 9, 0.25); }
    for (const sx of [1, -1]) for (const z of [-2, 1, 4]) m.limb(sx * 0.6, 4.6, z, sx * 3, 0, z + 0.8, 0.07, 0.06);
    m.shine(0);
    return { cols: [{ t: 'cyl', x: 0, z: 0, r: 1.0, y0: 0, y1: 6.5 }] };
  });
  // glows that come on when the moth is finished
  const spots = [[0, 6, -2], [9, 13, -6], [16, 9, -3], [14, 5, 2], [11, 2, 6], [-9, 13, -6], [-16, 9, -3], [-14, 5, 2], [-11, 2, 6], [2.5, 9.5, 9], [-2.5, 9.5, 9], [0, 6.5, 7]];
  for (const [x, y, z] of spots) { const G = BurnsW8910.glow(api, M.x + x, y, M.z + z, 2.2, BURNS_NEON[st.mothGlows.length % 7]); BurnsW8910.setGlow(G, false); st.mothGlows.push(G); }
  api.npc(BURNS_W8910_ARCH.npc('artist', { id: 'wren', x: M.x + 10, z: M.z + 12, yaw: -2.4, talk(g, a) { BURNS_W9.wrenTalk(g, a); } }));
  api.prop('chair', { x: M.x + 11.4, z: M.z + 13, yaw: -2.2, col: '#c8843e' });
  const parts = [[-60, -98, 'WIRE'], [-118, -150, 'WIRE'], [-74, -170, 'WIRE'], [-130, -108, 'GLOW PAINT'], [-96, -84, 'GLOW PAINT'], [-52, -140, 'GLOW PAINT']];
  parts.forEach(([x, z, lab], i) => api.pickup('item:part', x, 0.8, z, { mission: 'artist', gate: true, label: lab, icon: lab === 'WIRE' ? 'ziptie' : 'drop', id: 'part' + i, persist: false, col: lab === 'WIRE' ? '#c8c8d0' : '#7aff5a' }));
  api.light(M.x, M.z, 16, '#c8a0ff', 0.25);
};

/* ---------------- the Sleeping Giant (our stand-in) ---------------- */
BURNS_W9.sleepingGiant = function (api) {
  const G = BURNS_W9.GIANT, wood = BURNS_ATLAS.pattern('wood'), wc = '#c89a6a', wd = '#9a6a42';
  api.mesh(G.x, G.z, m => {
    m.color(wc).shine(1);
    // boots (toes to the sky), legs, a round belly, chest and a big sleeping head
    for (const sz of [-4.2, 4.2]) { m.color(wd); m.roundBox(-23, 3, sz, 3.8, 6, 3.4, 1.2); m.color(wc); m.limb(-21, 2.6, sz, -9, 3.2, sz * 0.85, 2.3, 2.6, { uv: wood }); m.limb(-9, 3.2, sz * 0.85, 2, 3.4, sz * 0.7, 2.6, 3.0, { uv: wood }); }
    m.ellipsoid(8, 3.6, 0, 9.5, 5.4, 7.4, { seg: 18, rings: 12 });
    m.ellipsoid(16, 4.2, 0, 6.5, 5.6, 7.8, { seg: 16, rings: 10 });
    m.color(wd); m.ellipsoid(8, 3.2, 0, 9.6, 2.2, 7.6, { seg: 18, rings: 6, phi0: Math.PI * 0.5 });
    m.color(wc); m.ball(24.5, 5.2, 0, 5.2, { seg: 18, rings: 12 });
    m.color(wd); m.ellipsoid(24.8, 10.1, 0, 1.1, 0.7, 1.0); // the nose (summit)
    for (const sz of [-1.9, 1.9]) { m.color('#3a2416'); m.push(); m.tf(25.5, 8.6, sz, 0, 0, -0.3); m.torus(0, 0, 0, 0.9, 0.12, { seg: 12, tseg: 4, sy: 0.4 }); m.pop(); }
    m.color('#8a5a32'); m.ellipsoid(28.5, 4.6, 0, 1.6, 3.2, 5.4); // a soft wooden beard
    // left arm out to the north, hand cupped open to the sky (the shelter)
    m.color(wc); m.limb(16, 5, -7, 9, 2.6, -13, 2.1, 1.8, { uv: wood }); m.limb(9, 2.6, -13, 4.5, 1.4, -16.5, 1.8, 1.6, { uv: wood });
    m.push(); m.tf(3, 0, -18); m.color(wd); m.lathe([[0, 0], [2.4, 0.05], [3.3, 0.9], [3.6, 2.4], [3.5, 3.0], [3.0, 3.05], [2.9, 1.2], [0, 0.6]], { seg: 18 });
    for (let f = 0; f < 4; f++) { const a = 2.2 + f * 0.42; m.color(wc); m.limb(Math.sin(a) * 3.2, 2.8, Math.cos(a) * 3.2, Math.sin(a) * 2.6, 4.2, Math.cos(a) * 2.6, 0.5, 0.42); }
    m.pop();
    // right arm resting on the belly
    m.limb(16, 5, 7, 11, 8.2, 8.5, 2.0, 1.8, { uv: wood }); m.limb(11, 8.2, 8.5, 6, 8.6, 4, 1.8, 1.6, { uv: wood }); m.ball(5.4, 8.8, 3.4, 1.9);
    m.shine(0);
    const cols = [
      { t: 'box', x: -23, z: -4.2, hx: 1.9, hz: 1.7, y0: 0, y1: 6 }, { t: 'box', x: -23, z: 4.2, hx: 1.9, hz: 1.7, y0: 0, y1: 6 },
      { t: 'ramp', x: -15, z: -3.9, hx: 2.3, hz: 6, y0: 0, ya: 6, yb: 5.6, yaw: Math.PI / 2 }, { t: 'ramp', x: -15, z: 3.9, hx: 2.3, hz: 6, y0: 0, ya: 6, yb: 5.6, yaw: Math.PI / 2 },
      { t: 'ramp', x: -3.5, z: -3.3, hx: 2.6, hz: 5.6, y0: 0, ya: 5.6, yb: 6.6, yaw: Math.PI / 2 }, { t: 'ramp', x: -3.5, z: 3.3, hx: 2.6, hz: 5.6, y0: 0, ya: 5.6, yb: 6.6, yaw: Math.PI / 2 },
      { t: 'dome', x: 8, z: 0, r: 7.2, y0: 1.8 }, { t: 'dome', x: 16, z: 0, r: 6.6, y0: 3.0 }, { t: 'dome', x: 24.5, z: 0, r: 5.2, y0: 5.0 },
      { t: 'ramp', x: 6.6, z: -15, hx: 1.6, hz: 2.6, y0: 0, ya: 2.8, yb: 3.4, yaw: 0.9 }, { t: 'ramp', x: 12.5, z: -10, hx: 1.8, hz: 4.6, y0: 0, ya: 3.0, yb: 6.6, yaw: 0.85 },
      { t: 'box', x: 3, z: -18, hx: 0.2, hz: 0.2, y0: 0, y1: 0.6, walk: true }
    ];
    // the cupped hand: a ring of low walls (fingers + palm rim) with an open middle
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; if (Math.abs(BurnsM.wrap(a - 0.9 - Math.PI)) < 0.5) continue; cols.push({ t: 'box', x: 3 + Math.sin(a) * 3.3, z: -18 + Math.cos(a) * 3.3, hx: 1.0, hz: 0.35, y0: 0, y1: 3.0, yaw: a, cover: true }); }
    return { cols, lights: [{ x: 3, y: 1.2, z: -18, s: 0, c: '#ffc890', pool: 8 }] };
  });
  api.sign('THE SLEEPING GIANT\nSHHH', G.x - 30, G.z + 10, { yaw: -1.2, h: 1.2, style: { bg: '#2a1a12', fg: '#f4c890', size: 40, border: '#f4c890' } });
  api.light(G.x, G.z, 26, '#ffb070', 0.18);
};

/* ---------------- the trash fence + the secret set ---------------- */
BURNS_W9.buildFence = function (api) {
  const Z = BURNS_W9.FENCE_Z;
  for (let x = -196; x < 196; x += 20) api.prop('fence', { x: x + 10, z: Z, len: 20, h: 1.4 });
  api.collider({ t: 'box', x: 0, z: Z - 0.2, hx: 200, hz: 0.3, y0: 0, y1: 1.4, walk: false });
  api.sign('THE TRASH FENCE\nEND OF THE WORLD\n(TURN AROUND)', 30, Z + 3, { yaw: Math.PI, h: 1.4, style: { bg: '#ff7a1a', fg: '#1a1008', size: 38, border: '#1a1008' } });
  // junk caught on the fence: bottles, a sock, a chair, an old sign
  const R = mulberry32(905);
  for (let i = 0; i < 40; i++) { const x = R.range(-190, 190); api.mesh(x, Z + 0.4, m => { m.color(R.pick(['#5a8a5a', '#8a5a3a', '#c8c8d0', '#e8d0a0', '#3a3a5a'])); if (R() < 0.5) m.roundCyl(0, 0, 0, 0.12, 0.35, 0.04); else m.roundBox(0, 0.4 + R() * 0.5, 0, 0.4 + R() * 0.5, 0.25, 0.08, 0.04); return { cols: [] }; }); }
};
BURNS_W9.buildSecretSet = function (api) {
  const W9 = BURNS_W9, X = W9.SET.x, Z = W9.FENCE_Z + 5;
  api.mesh(X, Z, m => {
    // folding table, decks, car-battery speakers, EL wire
    m.color('#d8d0c0'); m.roundBox(0, 0.85, 0, 3.2, 0.08, 1.0, 0.03); m.color('#4a4a52'); for (const [x, z] of [[-1.4, -0.4], [1.4, -0.4], [-1.4, 0.4], [1.4, 0.4]]) m.limb(x, 0, z, x, 0.82, z, 0.03, 0.03);
    m.color('#1a1a1e').shine(2); m.roundBox(-0.8, 0.95, 0, 0.9, 0.12, 0.7, 0.04); m.roundBox(0.8, 0.95, 0, 0.9, 0.12, 0.7, 0.04); m.shine(0);
    for (const sx of [-1, 1]) { m.color('#2a2a30'); m.roundBox(sx * 2.6, 0.7, 0.2, 1.1, 1.4, 1.0, 0.12); m.color('#5a5a62'); for (const y of [0.4, 1.0]) { m.push(); m.tf(sx * 2.6, y, 0.72, 0, Math.PI / 2, 0); m.roundCyl(0, -0.05, 0, 0.32, 0.08, 0.03); m.pop(); } m.color('#3a3a3a'); m.roundBox(sx * 2.6, 0.18, -0.9, 0.7, 0.36, 0.45, 0.06); m.color('#ff3a2a'); m.ball(sx * 2.6 - 0.2, 0.38, -0.9, 0.05); }
    m.color('#38f2ff', 1); m.limb(-3.2, 1.6, 0.6, 3.2, 1.6, 0.6, 0.03, 0.03); m.color('#ff4fd8', 1); m.limb(-3.2, 1.4, -0.3, 3.2, 1.4, -0.3, 0.03, 0.03); m.emissive(0);
    return { cols: [{ t: 'box', x: 0, z: 0, hx: 1.6, hz: 0.5, y0: 0, y1: 0.9 }, { t: 'box', x: -2.6, z: 0.2, hx: 0.55, hz: 0.5, y0: 0, y1: 1.4, cover: true }, { t: 'box', x: 2.6, z: 0.2, hx: 0.55, hz: 0.5, y0: 0, y1: 1.4, cover: true }] };
  });
  api.npc(BURNS_W8910_ARCH.npc('fencebotA', { id: 'botA', x: X - 0.8, z: Z - 1.0, yaw: 0, anim: 'w8910dj', chatter: false, talk(g, a) { BURNS_W9.botTalk(g, a); } }));
  api.npc(BURNS_W8910_ARCH.npc('fencebotB', { id: 'botB', x: X + 0.8, z: Z - 1.0, yaw: 0, anim: 'w8910dj', chatter: false, talk(g, a) { BURNS_W9.botTalk(g, a); } }));
  api.crowd(X, Z + 12, 5, 8, { types: ['burner', 'tutu', 'ledsuit', 'furcoat', 'sparklepony', 'burner'], behaviors: ['dance'], extra: { chatter: true, chat: ['IS IT THEM?!', 'BEEP BOOP!', 'I KNEW IT!', 'This is the best night of my LIFE!'] } });
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; api.glow(X + Math.sin(a) * 9, 0.4, Z + 6 + Math.cos(a) * 6, 0.8, BURNS_NEON[i % 7], { blink: 8 }); }
  api.light(X, Z + 5, 14, '#ff4fd8', 0.45);
  api.checkpoint('cp_fence', X + 14, Z + 12, { yaw: Math.PI * 0.8, name: 'The Trash Fence' });
  api.trigger({ x: X, z: Z + 6, r: 15, when: g => g.missions.state('secretset') === 'active' && !BURNS_W9.state.setFound, onEnter: g => BURNS_W9.setReveal(g) });
};

/* ---------------- the arena ---------------- */
BURNS_W9.buildArena = function (api, g) {
  const W9 = BURNS_W9, A = W9.ARENA, S = BurnsW8910Shape;
  // the Waiting Chairs: giant chairs facing the horizon (cover from the flash)
  const covers = [];
  const chair = (x, z, yaw, col) => {
    api.mesh(x, z, m => {
      m.color(col).shine(1);
      for (const [lx, lz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) m.limb(lx, 0, lz, lx, 2.6, lz, 0.22, 0.2);
      m.roundBox(0, 2.75, 0, 4.0, 0.36, 4.0, 0.14); m.roundBox(0, 5.4, -1.85, 4.0, 5.0, 0.36, 0.14);
      m.shine(0);
      return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.0, hz: 2.0, y0: 2.55, y1: 2.95 }, { t: 'box', x: 0, z: -1.85, hx: 2.0, hz: 0.2, y0: 0, y1: 7.9, cover: true }, ...[[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]].map(([lx, lz]) => ({ t: 'cyl', x: lx, z: lz, r: 0.24, y0: 0, y1: 2.6, camPass: true }))] };
    }, { yaw });
    covers.push({ x: x - Math.sin(yaw) * 1.85, z: z - Math.cos(yaw) * 1.85, r: 2.2 });
  };
  chair(A.x - 15, A.z + 10, 0.4, '#c84a3a'); chair(A.x + 16, A.z + 8, -0.6, '#3a8ac8'); chair(A.x + 12, A.z - 16, Math.PI - 0.3, '#e8b030'); chair(A.x - 14, A.z - 14, Math.PI + 0.5, '#8a4ac8');
  api.sign('THE WAITING CHAIRS', A.x - 22, A.z + 22, { yaw: -0.6, h: 1.0, style: { bg: '#2a1a2a', fg: '#ffd0f4', size: 38, border: '#ffd0f4' } });
  api.prop('artcar', { x: A.x + 24, z: A.z + 16, yaw: -1.2, len: 8, col: '#2a3a5a', sculpt: '#ff4fd8' }); covers.push({ x: A.x + 24, z: A.z + 16, r: 2.2 });
  for (let i = 0; i < 3; i++) api.prop('portapotty', { x: A.x - 26 + i * 1.35, z: A.z - 4, col: '#3a8a3a' });
  covers.push({ x: A.x - 24.6, z: A.z - 4, r: 2.0 });
  // lamp posts around the arena, the Dust Whale (rebar ribs) for looks
  for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, x = A.x + Math.sin(a) * (A.r + 2), z = A.z + Math.cos(a) * (A.r + 2); api.capsule(x, 0, z, 0.1, 4, '#3a2a22', { col: { camPass: true } }); api.glow(x, 4.2, z, 1.2, i % 2 ? '#ff4fd8' : '#ffd890'); }
  api.mesh(A.x + 2, A.z - 30, m => { m.color('#8a4a32').shine(1); for (let i = 0; i < 9; i++) { const z = -8 + i * 2, h = 3 + Math.sin(i / 8 * Math.PI) * 4; m.limb(-2.5, 0, z, 0, h, z, 0.12, 0.1); m.limb(0, h, z, 2.5, 0, z, 0.1, 0.12); } m.limb(0, 3, -9, 0, 6.5, 8, 0.16, 0.12); m.shine(0); return { cols: [] }; });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; api.light(A.x + Math.sin(a) * A.r * 0.85, A.z + Math.cos(a) * A.r * 0.85, 9, i % 2 ? '#ff4fd8' : '#9a6bff', 0.35); }
  api.pickup('water', A.x - 8, 0.9, A.z + 24); api.pickup('water', A.x + 8, 0.9, A.z + 24);
  api.checkpoint('cp_arena', A.x - 6, A.z + 40, { yaw: Math.PI, name: 'The Flats' });
  // Chinka's LED necklace (only appears in the ending)
  W9.state.neck = api.mover(m => { for (let i = 0; i < 9; i++) { const a = -1.3 + i / 8 * 2.6; m.color(BURNS_NEON[i % 5], 0.9); m.ball(Math.sin(a) * 0.22, 0.03, Math.cos(a) * 0.12, 0.045, { seg: 6, rings: 4 }); } m.emissive(0); m.color('#2a2a30'); m.torus(0, 0.02, 0, 0.2, 0.01, { seg: 14, tseg: 3, sy: 1 }); return { cols: [] }; });
  W9.state.neck.visible = false; W9.state.neck.noCollide = true;
  // the Man
  const man = new BurnsW8910Man(g, { x: A.x, z: A.z - 6, yaw: 0, scale: 0.95, hp: 3, name: 'THE MAN', title: 'Storm-Lover',
    attacks: ['stomp', 'swipe', 'flash', 'fireworks', 'devil', 'vanish'], stun: 5.8, arena: A, covers, devils: 2, flashCharge: 2.8, flashDamage: 2, fireworks: 7,
    avoid: { x: W9.TEMPLE.x, z: W9.TEMPLE.z, r: W9.TEMPLE.r + 20 }, lines: BURNS_W9_LINES,
    stunLines: ['I... am... so... tired... of chasing...', 'The dust... is in my... heart...', 'Need... a hug... from the storm...'],
    hitLines: ['MY SPLINTERS!', 'YOU DENT MY HEART!', 'SHE WILL NEVER LEAVE ME!', 'THE STORM IS ON MY SIDE!'],
    phases: [{ hp: 1, attacks: ['stomp', 'devil', 'vanish'], combo: 3, rate: 1 }, { hp: 0.67, attacks: ['swipe', 'devil', 'flash', 'vanish'], combo: 3, rate: 1.1 }, { hp: 0.34, attacks: ['fireworks', 'devil', 'flash', 'vanish', 'stomp'], combo: 4, rate: 1.2, first: 'flash' }],
    onPhase(g2, b, i) { g2.banner(i === 1 ? 'THE STORM THICKENS' : 'HE\'S FURIOUS', i === 1 ? 'Neon flash incoming: hide behind the giant chairs!' : 'Fireworks, devils, flashes. Stay close to cover.', { col: '#9a6bff' }); W9.state.storm = Math.max(W9.state.storm, 0.7); },
    onDefeat(g2) { BURNS_W9.bossDefeated(g2); } });
  g.addBoss(man);
  man.hidden = true; man.showChinka = true;
  W9.state.man = man; W9.state.covers = covers;
  api.trigger({ x: A.x, z: A.z + 30, r: 12, when: g2 => g2.missions.state('boss') === 'available' && !BURNS_W9.state.bossStarted, onEnter: g2 => BURNS_W9.bossIntro(g2) });
};

/* ---------------- intro ---------------- */
BURNS_W9.intro = function (g) {
  const S = BURNS_W9.state, p = g.player, T = BURNS_W9.TEMPLE;
  p.teleport(BURNS_W9.SPAWN.x, 0, BURNS_W9.SPAWN.z + 26, 0); p.locked = true;
  g.cutscene([
    { music: 'burns_w9' },
    { cam: { x: 22, y: 9, z: 150, tx: T.x, ty: 7, tz: T.z, fov: 0.85 } },
    { banner: [BurnsWorlds.label(9).toUpperCase(), 'DEEP PLAYA SHOWDOWN · A STORM IS COMING', { col: '#9a6bff', big: true, dur: 3.2 }] },
    { cam: { from: { x: 22, y: 9, z: 150, tx: T.x, ty: 7, tz: T.z, fov: 0.85 }, to: { x: -4.5, y: 2.6, z: 168, tx: 0, ty: 5, tz: T.z, fov: 0.85 }, dur: 4 } },
    { say: ['brady', ['The Temple. Even out here, it feels quiet.', 'Rusty said the Man came this way. North. Into the deep playa.']] },
    { do: g2 => { S.storm = 0.8; burnsSfx('wind', { vol: 0.9 }, 'dust'); g2.shake(0.2); } },
    { cam: { x: 0, y: 4, z: 160, tx: 0, ty: 3, tz: 90, fov: 0.9 } },
    { wait: 1.2 },
    { say: ['brady', ['...and so is a dust storm. Of course.']] },
    { do: g2 => { BurnsSave.flag(9, 'intro', true); S.introDone = true; S.storm = 0.4; p.locked = false; p.teleport(BURNS_W9.SPAWN.x, 0, BURNS_W9.SPAWN.z, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; } },
    { banner: ['FOLLOW THE LAMPS', 'The lamplighters\' camp is just ahead.', { col: '#ffd890' }] }
  ], null);
};

/* ---------------- per-step logic ---------------- */
BURNS_W9.update = function (g, dt) {
  const W9 = BURNS_W9, S = W9.state, p = g.player, T = W9.TEMPLE;
  // the storm: base level, surges, whiteout, calm near the Temple
  S.surgeT -= dt;
  if (S.surgeT <= 0) { S.surgeT = 40 + Math.random() * 20; S.surge = 6; if (!g.cine) { g.toast('A DUST SURGE ROLLS THROUGH!'); burnsSfx('wind', { vol: 0.8 }, 'dust'); } }
  if (S.surge > 0) S.surge -= dt;
  const dT = Math.hypot(p.x - T.x, p.z - T.z), calm = BurnsM.smoothstep(T.r + 30, T.r, dT);
  let want = S.after ? 0.15 : 0.32 + (S.surge > 0 ? 0.35 : 0);
  if (g.missions.state('whiteout') === 'active') want = S.beaconOn ? 0.75 : 0.95;
  if (S.bossStarted && !S.after && !S.ending) want = Math.max(want, 0.5);
  if (S.forceStorm !== undefined) want = S.forceStorm;
  want *= 1 - calm * 0.85;
  S.storm = BurnsM.damp(S.storm, want, S.forceStorm !== undefined ? 1.5 : 0.6, dt);
  // darkwads: unseen until you're right on them (or the beacon, goggles or LSD reveal them)
  const lsd = p.power === 'lsd' && p.powerT > 0;
  for (const id of S.darkwads) {
    const a = g.actor(id); if (!a) continue;
    const d = Math.hypot(p.x - a.x, p.z - a.z);
    a.data.revealT = Math.max(0, (a.data.revealT || 0) - dt);
    const lit = a.data.lit, seen = lit || lsd || S.goggles || d < 3.6 || a.data.revealT > 0;
    a.hidden = !seen;
    if (!lit && !a.data.bumpCd && d < 0.95 && !g.cine && !p.dead) {
      a.data.bumpCd = 1.5; a.data.revealT = 4; a.hidden = false;
      const dx = p.x - a.x, dz = p.z - a.z, l = Math.hypot(dx, dz) || 1;
      if (p.vehicle) p.hurt(1, a.x, a.z, 8); else p.knock(dx / l * 7, 6, dz / l * 7);
      p.say(burnsW8910Pick(['WHO\'S THERE?!', 'Oof! A darkwad!', 'Light yourself UP, man!']), 1.4);
      a.say(burnsW8910Pick(['Watch it.', 'Can\'t see me? Your problem.', 'I\'m not invisible, I\'m minimalist.']), 2);
      burnsSfx('bump');
    }
    if (a.data.bumpCd) { a.data.bumpCd -= dt; if (a.data.bumpCd <= 0) a.data.bumpCd = 0; }
    if (!seen && d < 14 && Math.random() < dt * 0.6) g.fx.glint(a.x, a.y + 1.62, a.z, '#ffffff');
  }
  // the beacon's sweeping beams reveal darkwads they cross (the big-art lighthouses have their own beams)
  if (S.art && S.art.lh && S.art.lh.big) { for (const id of S.darkwads) { const a = g.actor(id); if (a && BurnsBigArt.beamHits(g, a.x, a.z)) a.data.revealT = 3; } const R = g.world._bba; if (!S.beaconOn && R && R.beams.some(b => b.lit) && g.missions.state('whiteout') === 'active') BURNS_W9.beacon(g); }
  else if (S.beaconOn) {
    S.beamA = (S.beamA || 0) + dt * 0.7;
    const L = W9.LIGHT;
    for (const id of S.darkwads) { const a = g.actor(id); if (!a) continue; const ang = Math.atan2(a.x - L.x, a.z - L.z), d = Math.hypot(a.x - L.x, a.z - L.z); for (const off of [0, Math.PI]) if (d < 170 && Math.abs(BurnsM.wrap(ang - S.beamA - off)) < 0.07) a.data.revealT = 3; }
  }
  // the lamps flare once the beacon is lit
  const flare = S.beaconOn ? 1 : 0;
  if (S.lampFlare !== flare) { S.lampFlare = flare; for (const G of S.lampGlows) G.s = flare ? 2.6 : 1.6; }
  // lost burners following Brady: are they home?
  BURNS_W9.lostUpdate(g, dt);
  // the beacon switch at the top of the lighthouse
  if (!S.beaconOn && g.missions.state('whiteout') === 'active' && Math.hypot(p.x - W9.LIGHT.x, p.z - W9.LIGHT.z) < 3.4 && p.y > W9.LIGHT.top - 1.0) BURNS_W9.beacon(g);
};
BURNS_W9.env = function (g, env) {
  const S = BURNS_W9.state, k = S.storm * (S.goggles ? 0.55 : 1);
  env.fogD += k * 0.042; env.fogMax = Math.min(0.975, env.fogMax + k * 0.03); env.haze = Math.min(1, env.haze + k * 0.35);
  const fc = [0.5, 0.39, 0.37]; env.fogCol = env.fogCol.map((c, i) => lerp(c, fc[i], Math.min(1, k * 0.7)));
  env.stars *= 1 - Math.min(1, k * 1.2); env.moon *= 1 - k * 0.6;
};
BURNS_W9.drawSprites = function (g, R) {
  const S = BURNS_W9.state, SP = BURNS_SPRITES.R, p = g.player, cam = g.cam, t = g.time;
  // wind-blown dust streaking past the camera (more in the storm)
  const n = Math.floor(2 + S.storm * 9);
  for (let i = 0; i < n; i++) { const a = Math.random() * TAU, d = 2 + Math.random() * 18; g.fx.add(cam.tx + Math.cos(a) * d, cam.ty - 1 + Math.random() * 4, cam.tz + Math.sin(a) * d, 9 + Math.random() * 6, 0.2, 3 + Math.random() * 2, 0.6 + Math.random() * 0.4, 0.3, 1.0, [0.82, 0.7, 0.62], 0.16 + S.storm * 0.18, 'puff', 4, Math.random() * 6, 1); }
  // the beacon's beams
  if (S.beaconOn && !(S.art && S.art.lh && S.art.lh.big)) {
    const L = BURNS_W9.LIGHT, y = L.top + 0.8;
    R.bbs.bb(L.x, y, L.z, 6, 6, SP.glow, [1, 0.95, 0.75], 0.9, true);
    for (const off of [0, Math.PI]) { const a = (S.beamA || 0) + off, dx = Math.sin(a), dz = Math.cos(a); for (let k = 1; k <= 6; k++) R.bbs.streak(L.x + dx * k * 18, y - k * 0.35, L.z + dz * k * 18, dx, -0.02, dz, 26, 3.2 + k * 0.9, SP.streak, [1, 0.92, 0.7], 0.32 - k * 0.03); }
  }
  // lit darkwads wear their new glow stick
  for (const id of S.darkwads) { const a = g.actor(id); if (a && a.data.lit && !a.hidden) R.bbs.bb(a.x, a.y + 1.3, a.z, 1.4, 1.4, SP.glow, [0.4, 1, 0.5], 0.8, true); }
  // the secret set: lasers and EL wire flicker
  const X = BURNS_W9.SET.x, Z = BURNS_W9.FENCE_Z + 5;
  if (Math.hypot(cam.x - X, cam.z - Z) < 120) {
    for (let i = 0; i < 6; i++) { const a = t * 1.3 + i * 1.05, dx = Math.sin(a), dz = Math.cos(a) * 0.4 + 0.6; R.bbs.streak(X + dx * 7, 3 + Math.sin(t * 2 + i) * 1.5, Z + dz * 7, dx, 0.15, dz, 16, 0.12, SP.streak, BURNS_NEON[i % 7] === '#ffe24a' ? [1, 0.9, 0.3] : burnsRGBf(BURNS_NEON[i % 7]), 0.8); }
    const vis = Math.sin(t * 23) > -0.3 ? 1 : 0.2; const bB = g.actor('botB'); if (bB) { const h = bB.ch.bonePoint(BURNS_BONES.HEAD, 0, 0.2, 0.2); R.bbs.bb(h[0], h[1], h[2], 0.9, 0.35, SP.glow, [0.3, 1, 1], 0.9 * vis, true); }
    const bA = g.actor('botA'); if (bA) for (const sx of [1, -1]) { const h = bA.ch.bonePoint(BURNS_BONES.HEAD, sx * 0.075, 0.24, 0.22); R.bbs.bb(h[0], h[1], h[2], 0.35, 0.35, SP.glow, [1, 0.3, 0.3], 0.9, true); }
  }
  // the necklace in the dust
  if (S.neckOn) { const N = S.neck, lit = S.neckLit; for (let i = 0; i < 9; i++) { if (i >= lit) continue; const a = -1.3 + i / 8 * 2.6, c = burnsRGBf(BURNS_NEON[i % 5]); R.bbs.bb(N.x + Math.sin(a) * 0.22, N.y + 0.08, N.z + Math.cos(a) * 0.12, 0.5, 0.5, SP.glow, c, (0.6 + 0.4 * Math.sin(t * 9 + i)) * (i === lit - 1 ? 0.5 + 0.5 * Math.sin(t * 17) : 1), true); } }
};

/* ---------------- the lamp line (whiteout) ---------------- */
BURNS_W9.lampTalk = function (g, a) {
  const st = g.missions.state('whiteout');
  if (st === 'available') {
    g.say(a, ['Evening. I\'m Luz. We light the lamps out to the Outpost every night.', 'A whiteout is rolling in. When it hits, you won\'t see your own feet. The lamps are the only way through.', 'Climb the Leaning Lighthouses and wake the beacon up top. Its beams will show you the line. Then follow the lamps north.'], () => { g.missions.start('whiteout'); BURNS_W9.whiteoutShort(g); g.toast('THE WHITEOUT IS COMING...'); burnsSfx('wind', { vol: 1 }, 'dust'); });
  } else if (st === 'active') g.say(a, [BURNS_W9.state.beaconOn ? 'The beacon is awake! Now follow the lamps north to the Outpost.' : 'The Leaning Lighthouses are just east. Climb the stairs around the tall one.']);
  else g.say(a, ['You made it through. The lamps are proud of you. So am I.']);
};
BURNS_W9.whiteoutShort = function (g) { const m = g.missions.get('whiteout'); if (m) m.def.short = BURNS_W9.state.beaconOn ? 'Follow the lamps to the Outpost' : 'Wake the beacon atop the Leaning Lighthouses'; if (m) m.def.marker = BURNS_W9.state.beaconOn ? { x: -10, z: 4 } : { x: 36, z: 120 }; };
BURNS_W9.beacon = function (g) {
  const S = BURNS_W9.state; if (S.beaconOn) return;
  S.beaconOn = true; BurnsSave.flag(9, 'beacon', true);
  BURNS_W9.whiteoutShort(g);
  g.banner('THE BEACON IS AWAKE', 'Follow the lamp line north to the Outpost.', { col: '#fff0c0' });
  burnsSfx('secret'); g.fx.confetti(BURNS_W9.LIGHT.x, BURNS_W9.LIGHT.top + 2, BURNS_W9.LIGHT.z, 30); g.shake(0.2);
};
BURNS_W9.whiteoutUpdate = function (g, m) {
  const S = BURNS_W9.state, O = BURNS_W9.OUTPOST, p = g.player;
  if (S.beaconOn && Math.hypot(p.x - O.x, p.z - O.z) < 10) g.missions.complete('whiteout', { x: O.x + 6, y: 1.4, z: O.z + 10 });
};
BURNS_W9.outpostTalk = function (g, a) {
  const st = g.missions.state('lost');
  if (st === 'locked') { g.say(a, ['Outpost\'s open, but the storm is wild. Come in through the lamp line.']); return; }
  if (st === 'available') { g.say(a, ['You came through the whiteout? Then you can help.', 'Five burners are lost out there. Listen for MARCO. Talk to them and they\'ll follow you back here.', 'Bring them in, and I\'ll tell you which way the big wooden fella went.'], () => g.missions.start('lost')); return; }
  if (st === 'active') { g.say(a, [`${g.missions.get('lost').n} of 5 safe. Keep listening for MARCO.`]); return; }
  g.say(a, ['Everyone\'s safe. Thank you.', 'The Man? He went north, into the flats past the Waiting Chairs. Carrying a woman who kept yelling your name. And "hydrate."']);
};
BURNS_W9.lostTalk = function (g, a, line) {
  if (a.data.safe) { g.say(a, ['Thank you for finding me. I owe you a glow stick. Several.']); return; }
  if (g.missions.state('lost') !== 'active') { g.say(a, [line, '...wait, are you real? You look real. Never mind.']); return; }
  if (a.data.following) { g.say(a, ['Right behind you! Lead the way to the Outpost!']); return; }
  g.say(a, [{ who: a, text: line }, { who: 'brady', text: 'POLO!' }, { who: a, text: 'Oh thank goodness. Lead me to the Outpost. I\'ll follow your glow.' }], () => { a.data.following = true; a.setBehavior('follow'); a.data.following = true; a.def.followDist = 2.2 + a.def.lostIdx * 0.7; burnsSfx('pick'); g.toast('A LOST BURNER IS FOLLOWING YOU!'); });
};
BURNS_W9.lostUpdate = function (g, dt) {
  const O = BURNS_W9.OUTPOST, m = g.missions.get('lost');
  for (let i = 0; i < 5; i++) {
    const a = g.actor('lost' + i); if (!a || a.data.safe || !a.data.following) continue;
    if (Math.hypot(a.x - O.x, a.z - O.z) < 15 && m && m.state === 'active') {
      a.data.safe = true; a.data.following = false; a.setBehavior('dance');
      a.say(burnsW8910Pick(['SAFE! I love this dome!', 'CHAI! I smell chai!', 'Thank you, man-bun stranger!']), 2.4);
      g.fx.confetti(a.x, a.y + 2, a.z, 18); burnsSfx('crowd_cheer', { vol: 0.5 });
      g.missions.progress('lost', 1);
      if (g.missions.isDone('lost')) g.glow += 10;
    }
  }
};
BURNS_W9.rumorTalk = function (g, a) {
  const st = g.missions.state('secretset');
  if (st === 'locked') { g.say(a, ['Shh! Can\'t talk. The storm\'s too loud. Come back when you\'re through the whiteout.']); return; }
  if (st === 'available') { g.say(a, ['Okay. Don\'t freak out. Daft Punk is playing a secret set at the trash fence tonight!', 'I know! I KNOW! My friend\'s friend\'s camp-mate saw the robots!', 'Nobody knows exactly where. Follow the bass! Louder means warmer!'], () => { g.missions.start('secretset'); BURNS_W9.state.lastD = null; }); return; }
  if (st === 'active') { g.say(a, ['Follow the bass! It\'s somewhere along the fence. Don\'t tell anyone. Tell EVERYONE.']); return; }
  g.say(a, ['Was it them?! Were they the robots?! ...Don\'t tell me. I want to believe.']);
};
BURNS_W9.setUpdate = function (g, m, dt) {
  const S = BURNS_W9.state, p = g.player, X = BURNS_W9.SET.x, Z = BURNS_W9.FENCE_Z + 5, d = Math.hypot(p.x - X, p.z - Z);
  // the bass line: a thump every beat, louder the closer you get
  S.beatT -= dt;
  if (S.beatT <= 0) { S.beatT = 0.48; const v = clamp(1 - d / 260, 0, 1); if (v > 0.03 && !g.cine) { burnsSfx('man_stomp', { vol: 0.12 + v * 0.7, pitch: 0.5 }); if (v > 0.7) g.shake(v * 0.08); if (v > 0.45) g.fx.ring(p.x, p.y + 0.05, p.z, 1 + v * 2, '#ff4fd8', 0.3); } }
  S.warmT -= dt;
  if (S.warmT <= 0) { S.warmT = 3; if (S.lastD != null && !g.cine) { const dd = S.lastD - d; if (dd > 6) g.toast(d < 60 ? 'HOT! THE BASS IS SHAKING YOUR TEETH!' : 'WARMER... THE BASS IS LOUDER'); else if (dd < -6) g.toast('colder... the bass is fading'); } S.lastD = d; }
  m.def.short = d < 60 ? 'The bass is RIGHT HERE!' : 'Follow the bass (louder = warmer)';
};
BURNS_W9.setReveal = function (g) {
  const S = BURNS_W9.state, X = BURNS_W9.SET.x, Z = BURNS_W9.FENCE_Z + 5, p = g.player;
  if (S.setFound) return; S.setFound = true;
  if (p.vehicle) p.vehicle.dismount(p);
  const A = g.actor('botA'), B = g.actor('botB');
  g.cutscene([
    { music: burnsHas(Sound.trackNames, 'land3') ? 'land3' : 'burns_w9' },
    { cam: { x: X + 6, y: 2.4, z: Z + 9, tx: X, ty: 1.6, tz: Z - 1, fov: 0.8 } },
    { do: g2 => { g2.fx.confetti(X, 3, Z + 4, 40); burnsSfx('crowd_cheer'); } },
    { wait: 1.2 },
    { do: g2 => { p.teleport(X + 1.2, 0, Z + 2.2, Math.PI); p.yaw = Math.PI; } },
    { cam: { x: X + 2.4, y: 1.75, z: Z + 3.2, tx: X - 0.2, ty: 1.75, tz: Z - 1, fov: 0.72 } },
    { say: ['brady', ['Two robots. At the trash fence. Playing a secret set on car batteries.', '...Are you...?']] },
    { say: [A, ['We could neither confirm nor deny.']] },
    { say: [B, ['Beep. Boop.']] },
    { say: [A, ['You followed the bass through a dust storm. That\'s the most dedicated thing we\'ve ever seen.', 'Here. Junk-made goggles. Bottle-cap lenses, EL wire, duct tape. They see right through dust.']] },
    { do: g2 => { BURNS_W9.giveGoggles(g2); } },
    { say: [B, ['Beep. (Good luck with the big wooden guy.) Boop.']] },
    { do: g2 => { g2.missions.complete('secretset'); } }
  ], g2 => { burnsMusic('burns_w9'); });
};
BURNS_W9.giveGoggles = function (g) {
  const S = BURNS_W9.state; S.goggles = true; BurnsSave.flag(9, 'goggles', true);
  g.banner('DUST GOGGLES', 'Robot-approved. Now you can see through the storm.', { col: '#38f2ff', big: true });
  burnsSfx('map_open', null, 'secret');
};
BURNS_W9.botTalk = function (g, a) {
  if (!BURNS_W9.state.setFound) { g.say(a, ['...']); return; }
  g.say(a, [a.id === 'botA' ? burnsW8910Pick(['We could neither confirm nor deny.', 'This trash can? Vintage.', 'The colander is load-bearing. Don\'t ask.']) : 'Beep. Boop.']);
};

/* ---------------- Wren and the moth ---------------- */
BURNS_W9.wrenTalk = function (g, a) {
  const st = g.missions.state('artist');
  if (st === 'available' || st === 'locked') g.say(a, ['Oh! Hi! I\'m Wren. This is my moth. She\'s called "The Moth That Ate the Moon."', 'The storm blew away my last three coils of wire and three cans of glow paint. Without them she\'s just... a very large bug.', 'Could you find them? They can\'t have blown far. Further than that. Okay, pretty far.'], () => g.missions.start('artist'));
  else if (st === 'active') g.say(a, [`${g.missions.get('artist').n} of 6! She can feel it. Look at her. She\'s thrilled.`]);
  else g.say(a, ['She\'s glowing. I\'m crying. This is why we haul sculptures across a desert.', 'Hey... I saw the Man earlier, out on the flats. He was talking to the woman he was carrying like she\'d always been his. She did not agree.']);
};
BURNS_W9.mothLit = function (g, quiet) {
  const S = BURNS_W9.state;
  for (const G of S.mothGlows) BurnsW8910.setGlow(G, true);
  if (quiet) return;
  const M = BURNS_W9.MOTH; g.fx.confetti(M.x, 10, M.z, 50); burnsSfx('crowd_cheer', { vol: 0.6 });
  const w = g.actor('wren'); if (w) w.say('SHE GLOWS!', 3);
  g.banner('THE MOTH GLOWS', 'Wren\'s sculpture lights up the storm.', { col: '#ff4fd8' });
};

/* ---------------- Devil's Shelter ---------------- */
BURNS_W9.devilStart = function (g) {
  const S = BURNS_W9.state, p = g.player, H = BURNS_W9.HAND;
  const back = Math.atan2(p.x - H.x, p.z - H.z);
  S.bigDevil = BurnsW8910Haz.devil(g, p.x + Math.sin(back) * 44, p.z + Math.cos(back) * 44, { r: 4.2, h: 34, speed: 10.5, life: 60, dir: back + Math.PI, turn: 0.6, giant: true, dmg: 1, avoid: { x: BURNS_W9.TEMPLE.x, z: BURNS_W9.TEMPLE.z, r: 50 } });
  S.forceStorm = 0.7;
  g.banner('DUST DEVIL!', H.boots ? 'Duck between the Sleeping Giant\'s boots!' : 'Run for the Sleeping Giant\'s cupped hand!', { col: '#ffb070', big: true });
  burnsSfx('wind', { vol: 1 }, 'dust'); g.shake(0.4);
};
BURNS_W9.devilUpdate = function (g, m) {
  const S = BURNS_W9.state, p = g.player, H = BURNS_W9.HAND;
  if (BURNS_W9.inShelter(g)) {
    if (S.bigDevil) S.bigDevil.life = S.bigDevil.t + 2.5;
    g.missions.complete('devil', { x: H.x, y: 1.6, z: H.z });
    BURNS_W9.devilEnd(g);
    g.banner('SHELTERED', H.boots ? 'The devil roars right over the Giant\'s boots.' : 'The devil roars past the Giant\'s hand.', { col: '#ffd890' });
  }
};
BURNS_W9.devilEnd = function (g) { const S = BURNS_W9.state; S.forceStorm = undefined; if (S.bigDevil) { S.bigDevil.life = Math.min(S.bigDevil.life, S.bigDevil.t + 2.5); S.bigDevil.chase = false; S.bigDevil.harmless = true; } S.bigDevil = null; };

/* ---------------- the Man in the storm ---------------- */
BURNS_W9.bossIntro = function (g) {
  const S = BURNS_W9.state, man = S.man, p = g.player, A = BURNS_W9.ARENA;
  if (S.bossStarted) return; S.bossStarted = true;
  if (p.vehicle) p.vehicle.dismount(p);
  g.missions.start('boss', true);
  g.cutscene([
    { music: 'man_boss' },
    { do: g2 => { S.forceStorm = 1; p.teleport(A.x, 0, A.z + 24, Math.PI); man.x = A.x; man.z = A.z - 6; man.yaw = 0; man.hidden = true; } },
    { cam: { x: A.x + 6, y: 3, z: A.z + 30, tx: A.x, ty: 8, tz: A.z - 6, fov: 0.9 } },
    { wait: 1.0 },
    { do: g2 => { man.hidden = false; for (let i = 0; i < 6; i++) g2.fx.dust(man.x + (Math.random() - 0.5) * 8, Math.random() * 10, man.z + (Math.random() - 0.5) * 8, 16, '#b89a80'); burnsSfx('man_roar'); g2.shake(0.5); S.forceStorm = 0.6; } },
    { cam: { from: { x: A.x + 6, y: 3, z: A.z + 30, tx: A.x, ty: 8, tz: A.z - 6, fov: 0.9 }, to: { x: A.x + 4, y: 6, z: A.z + 8, tx: A.x, ty: 10.5, tz: A.z - 6, fov: 0.8 }, dur: 2.6 } },
    { banner: ['THE MAN', 'Storm-Lover · Boss', { col: '#9a6bff', big: true, dur: 3 }] },
    { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['BRADY! I can\'t see ANYTHING! Is that you or a very short dust devil?!']] },
    { say: ['man', ['SMALL MAN. YOU FOLLOWED US INTO THE STORM.', 'THE DUST IS MY WITNESS. SHE WILL LEARN TO LOVE ME.']] },
    { say: ['brady', ['She doesn\'t love you. She doesn\'t even like sand!']] },
    { say: ['man', ['THEN I WILL BURY YOU IN IT!']] },
    { do: g2 => { S.forceStorm = undefined; p.teleport(A.x, 0, A.z + 22, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; g2.boss = burnsW8910Proxy(man, { camY: 8 }); man.start(); g2.banner('FIGHT!', 'Dodge everything · bonk his head when he collapses', { col: '#ffe24a' }); } }
  ]);
};
BURNS_W9.bossDefeated = function (g) {
  const S = BURNS_W9.state, man = S.man, p = g.player, A = BURNS_W9.ARENA;
  g.missions.complete('boss');
  BurnsW8910Haz.clear(g); S.ending = true;
  BurnsW8910.timer(g, 1.6, g2 => {
    const N = S.neck;
    g2.cutscene([
      { do: g3 => { burnsMusic(null); g3.boss = null; g3.banners.length = 0; g3.toasts.length = 0; } },
      { cam: { x: man.x + 9, y: 4, z: man.z + 14, tx: man.x, ty: 6, tz: man.z, fov: 0.85 } },
      { say: ['man', ['...NO.', 'SHE IS MINE. EVEN IF THE STORM HAS TO TAKE US BOTH.']] },
      { say: [{ name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['Brady—!']] },
      { do: g3 => { man.defeated = false; man.active = false; man.setState('walk'); S.forceStorm = 1; burnsSfx('wind', { vol: 1 }, 'dust'); g3.shake(0.5); S.walkT = 0; } },
      { until: g3 => { S.walkT += 1 / 120; man.z -= 6 / 120; for (let i = 0; i < 2; i++) g3.fx.dust(man.x + (Math.random() - 0.5) * 10, Math.random() * 12, man.z + (Math.random() - 0.5) * 10, 3, '#b89a80'); return S.walkT > 2.4; } },
      { do: g3 => { man.hidden = true; man.showChinka = false; for (let i = 0; i < 8; i++) g3.fx.dust(man.x + (Math.random() - 0.5) * 10, Math.random() * 12, man.z + (Math.random() - 0.5) * 10, 16, '#b89a80'); } },
      { do: g3 => { p.locked = true; p.teleport(A.x, 0, A.z + 4, Math.PI); p.animOverride = 'run'; } },
      { cam: { x: A.x + 3, y: 2.2, z: A.z + 10, tx: A.x, ty: 1.4, tz: A.z - 4, fov: 0.85 } },
      { say: ['brady', ['CHINKA!']] },
      { do: g3 => { p.animOverride = null; S.walkT = 0; } },
      { until: g3 => { S.walkT += 1 / 120; p.x += 0; p.z -= 4 / 120; return S.walkT > 1.2; } },
      { fade: 'out', dur: 1.2 },
      { do: g3 => { S.forceStorm = 0.12; S.storm = 0.15; p.teleport(A.x, 0, A.z - 12, Math.PI); p.animOverride = 'w8910kneel'; N.x = A.x - 0.2; N.z = A.z - 13.4; N.y = 0.02; N.yaw = 0.4; N.visible = true; S.neckOn = true; S.neckLit = 9; } },
      { wait: 1.4 },
      { fade: 'in', dur: 2.0 },
      { cam: { x: A.x + 1.6, y: 0.9, z: A.z - 15.2, tx: A.x - 0.2, ty: 0.1, tz: A.z - 13.4, fov: 0.6 } },
      { wait: 2.0 },
      { say: ['brady', ['...Chinka?']] },
      { cam: { from: { x: A.x + 1.6, y: 0.9, z: A.z - 15.2, tx: A.x - 0.2, ty: 0.1, tz: A.z - 13.4, fov: 0.6 }, to: { x: A.x + 3.2, y: 1.8, z: A.z - 9.5, tx: A.x, ty: 0.9, tz: A.z - 12.6, fov: 0.75 }, dur: 3.5 } },
      { say: ['brady', ['Her necklace. Half buried.', 'She never takes this off.']] },
      { do: g3 => { S.neckDim = 0; } },
      { until: g3 => { S.neckDim += 1 / 120; S.neckLit = Math.max(0, 9 - Math.floor(S.neckDim * 2.2)); return S.neckLit <= 0 && S.neckDim > 4.6; } },
      { wait: 1.6 },
      { say: ['brady', ['...', 'The Temple.']] },
      { do: g3 => { BurnsSave.flag(9, 'necklace', true); BurnsSave.flag(9, 'lost', true); } },
      { fade: 'out', dur: 2.5 },
      { wait: 0.8 }
    ], g3 => { S.neckOn = false; p.animOverride = null; p.locked = false; g3.finishWorld(); burnsMusic(null); });
  });
};

/* ---------------- darkwads ---------------- */
BURNS_W9.darkwadTalk = function (g, a) {
  if (a.data.lit) { g.say(a, ['...okay, the glow stick is kind of nice. Don\'t tell anyone.']); return; }
  g.say(a, [burnsW8910Pick(['Lights? Nah. I\'m mysterious.', 'I don\'t do LEDs. I\'m a minimalist.', 'You can\'t see me? Sounds like a you problem.']), { who: 'brady', text: 'Wear this. Before somebody bikes into you.' }, 'Fine. ONE glow stick. Ironically.'], () => {
    a.data.lit = true; g.fx.burst(a.x, a.y + 1.4, a.z, 'star', 10, '#7aff5a'); burnsSfx('pick');
    const S = BURNS_W9.state, n = S.darkwads.filter(id => { const d = g.actor(id); return d && d.data.lit; }).length;
    g.toast(`DARKWAD LIT UP! (${n}/${S.darkwads.length})`);
    if (n === S.darkwads.length) { g.glow += 20; g.banner('EVERY DARKWAD GLOWS', 'The playa is a little safer tonight. +20 glow sticks.', { col: '#7aff5a' }); }
  });
};
