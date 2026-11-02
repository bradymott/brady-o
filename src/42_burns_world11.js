/* ============================================================
   BRADY-O BURNS — World 11: SOUND CAMP CRAWL (plays 7th, after the art car hunt)
   Night on the 10:00 and 2:00 sides of the city: sound camps, lasers, bikes.
   Someone saw where the Man took Chinka: a DJ. The first DJ Brady finds is the
   wrong one (DJ Loophole, who loses a DJ-off and points him to DJ Alkali).
   Alkali wants four offerings before she'll let anyone near her decks:
     cable     Blown Bass      Root Society: find 3 speaker cables, plug in     -> Root-Wood Talisman
     vip       Velvet Rope     Opulent Temple: sneak onto the VIP riser          -> Golden Headphone Jack
     usb       Lost & Sound    Camp ?: catch the tech bro with DJ Maybe's USB    -> Glowing "?" Charm
     dome      Bungee Bout     Thunderdome: win a bungee foam-bat duel           -> Champion Skull Buckle
   Plus: djoff (BurnsDJ vs DJ Loophole), heckle (out-heckle Crusty Curt),
   set (the headline set at the Wobble Dome, BurnsDJ; B or better wins the world).
   Side: light up the darkwads on the dark playa path.
   Real camps (Root Society, Opulent Temple, Camp Question Mark, Death Guild's
   Thunderdome) appear by name only on our own original structures.
   ============================================================ */

if (typeof BURNS_MUSIC_FALLBACK !== 'undefined' && !BURNS_MUSIC_FALLBACK.burns_w11) BURNS_MUSIC_FALLBACK.burns_w11 = 'land3';

BW11.spec = function (base, seed, over, key) {
  const s = BurnsRig.npcSpec(BW11.type(base), seed);
  Object.assign(s, { paint: null, coat: null, vest: null, hat: null, goggles: false, glasses: null, beard: null, led: null, prop: null, prop2: null, acc: [] }, over);
  s.key = 'w11:' + key; return s;
};
BW11.LOOKS = {
  mel: () => BW11.spec('burner', 31, { face: 'goofy', hat: { kind: 'bandana', col: '#ff4fd8' }, glasses: 'shades', top: { kind: 'tank', col: '#ffe24a' }, bottom: { kind: 'shorts', col: '#2a2a34', cargo: true }, shoes: { kind: 'sneakers', col: '#ff4fd8' }, acc: ['kandi', 'ledNecklace'], prop: 'radio' }, 'mel'),
  mycelium: () => BW11.spec('burner', 32, { face: 'friendly', skin: '#b98258', skinSh: '#94603a', hair: { style: 'wavy', col: '#4a3a24', hi: '#7a5a34' }, beard: { col: '#4a3a24', len: 0.06 }, hat: { kind: 'sunhat', col: '#8a5a2a' }, glasses: 'round', lensCol: '#7aff5a', top: { kind: 'vest', col: '#5a7a3a' }, bottom: { kind: 'pants', col: '#6a4a2a' }, shoes: { kind: 'sandals', col: '#6a4a2a' }, acc: ['beads', 'headset', 'kandi'] }, 'mycelium'),
  maybe: () => BW11.spec('burner', 33, { face: 'goofy', hair: { style: 'afro', col: '#9a6bff', hi: '#ff9ad8' }, glasses: 'round', lensCol: '#ff4fd8', top: { kind: 'tee', col: '#1a1030' }, coat: { kind: 'kimono', col: '#2a1a4a', trim: '#38f2ff' }, bottom: { kind: 'pants', col: '#1a1a2a' }, shoes: { kind: 'hightops', col: '#38f2ff', sole: '#ffffff' }, acc: ['headset', 'ledNecklace'] }, 'maybe'),
  alkali: () => BW11.spec('burner', 34, { body: { h: 1.08, w: 0.92, fem: true }, skin: '#d8a888', skinSh: '#b08060', face: 'lashes', hair: { style: 'mohawk', col: '#f4f4ff', hi: '#ffffff' }, glasses: 'visor', lensCol: '#38f2ff', top: { kind: 'long', col: '#d8dce8' }, bottom: { kind: 'leggings', col: '#c8ccd8', pattern: 'holo' }, shoes: { kind: 'combat', col: '#f4f4ff', sole: '#c8c8d0' }, coat: { kind: 'robe', col: '#f4f0ff', trim: '#38f2ff' }, acc: ['headset', 'ledNecklace', 'kandi'], led: '#38f2ff' }, 'alkali'),
  sherpa: () => BW11.spec('burner', 35, { face: 'tired', hat: { kind: 'cap', col: '#f4f0e8' }, top: { kind: 'tee', col: '#e8e0d0' }, vest: 'hivis', bottom: { kind: 'cargo', col: '#6a6a5a' }, shoes: { kind: 'workboots', col: '#6a4a2a' }, acc: ['toolbelt'], prop: 'clipboard' }, 'sherpa'),
  guard: i => BW11.spec('burner', 40 + i, { face: 'stern', hair: { style: 'buzz', col: '#1a1a1a' }, glasses: 'wrap', top: { kind: 'button', col: '#141418', long: true }, bottom: { kind: 'pants', col: '#141418' }, shoes: { kind: 'combat', col: '#0a0a0c' }, acc: ['earbuds'], prop: 'flashlight', body: { h: 1.08, w: 1.2 } }, 'guard' + i),
  toasty: () => BW11.spec('burner', 36, { face: 'friendly', hat: { kind: 'cap', col: '#ffe24a' }, top: { kind: 'tee', col: '#ff7a2a' }, bottom: { kind: 'shorts', col: '#2a2a34' }, shoes: { kind: 'sneakers', col: '#ffe24a' }, acc: ['beads'] }, 'toasty')
};

/* ---------------- custom behaviours ---------------- */
// VIP security: walk a beat, stop and look around, flashlight cone; re-fires 'spotted' (with a cooldown)
BurnsBehaviors.register('bw11Guard', {
  init(a) { a.data.i = 0; a.data.alert = 0; a.data.cd = 0; a.data.wait = 0; },
  update(a, g, dt) {
    const D = a.data, P = a.def.path; D.cd = Math.max(0, D.cd - dt);
    if (D.wait > 0) { D.wait -= dt; a.ch.play(D.phone ? 'phone' : 'idle'); a.vx = BurnsM.damp(a.vx, 0, 8, dt); a.vz = BurnsM.damp(a.vz, 0, 8, dt); if (D.look !== undefined) a.yaw = BurnsM.dampAngle(a.yaw, D.look, 2.5, dt); }
    else { const q = P[D.i]; const d = a.moveTo(q[0], q[1], a.def.speed || 1.25, dt, 0.4); a.ch.play('walk'); if (d < 0.5) { D.i = (D.i + 1) % P.length; D.wait = q[3] || a.def.pause || 1.8; D.look = q[2]; D.phone = Math.random() < 0.4; } }
    const seen = !g.cine && BurnsBehaviors.sees(a, g, a.def.view || 9, a.def.fov || 0.5) && Math.abs(g.player.y - a.y) < 3.5;
    if (seen) { D.alert = Math.min(1, D.alert + dt * 3.2); if (D.alert >= 1 && D.cd <= 0) { D.cd = 3; a.say(a.def.spotLine || 'WRISTBAND?!', 1.6); burnsSfx('yell', { vol: 0.6 }); g.missions.event('spotted', a); } }
    else D.alert = Math.max(0, D.alert - dt * 0.9);
    a.physics(dt);
  },
  draw(a, g, R) {
    const v = a.def.view || 9, fov = a.def.fov || 0.5, f = Math.sin(a.yaw), c = Math.cos(a.yaw), al = a.data.alert;
    const col = al > 0.3 ? [1, 0.35, 0.3] : [1, 0.95, 0.7];
    R.flat.flat(a.x + f * v * 0.5, a.y + 0.06, a.z + c * v * 0.5, v * Math.tan(fov) * 2.1, v, a.yaw, BURNS_SPRITES.R.beam, col, 0.32 + al * 0.3, true);
  }
});
// the networking tech bro holding DJ Maybe's USB stick: flees, pitches over his shoulder, gets winded
BurnsBehaviors.register('bw11Runner', {
  init(a) { a.data.mode = 'idle'; a.data.t = 0; a.data.cd = 1.5; a.data.run = 0; },
  update(a, g, dt) {
    const D = a.data, p = g.player, d = a.distP(); D.t -= dt; D.cd -= dt;
    const live = g.missions.state('usb') === 'active' && !BW11.state.usbFree;
    if (!live || D.mode === 'idle' && d > 9) {
      if (!D.tx || Math.random() < dt * 0.3) { const t = Math.random() * TAU, r = Math.random() * 5; D.tx = a.home.x + Math.cos(t) * r; D.tz = a.home.z + Math.sin(t) * r; }
      const dd = a.moveTo(D.tx, D.tz, 1.1, dt, 0.4); a.ch.play(dd > 0.5 ? 'walk' : 'phone');
      if (live && d < 9) D.mode = 'flee';
    } else if (D.mode === 'tired') {
      a.vx = BurnsM.damp(a.vx, 0, 6, dt); a.vz = BurnsM.damp(a.vz, 0, 6, dt); a.ch.play('phone');
      if (D.t <= 0) { D.mode = 'flee'; a.say('Back to hustling!', 1.2); }
    } else {
      const ax = a.x - p.x, az = a.z - p.z, l = Math.hypot(ax, az) || 1;
      let tx = a.x + ax / l * 5 + az / l * 2, tz = a.z + az / l * 5 - ax / l * 2;
      const hx = a.home.x - a.x, hz = a.home.z - a.z;
      if (Math.hypot(hx, hz) > 12) { tx = a.x + hx * 0.7 + az / l * 3; tz = a.z + hz * 0.7 - ax / l * 3; }
      a.moveTo(tx, tz, d < 9 ? 5.6 : 2, dt, 0.1); a.ch.play(d < 9 ? 'run' : 'walk', { rate: 1 });
      if (d < 9) D.run += dt;
      if (D.run > 4.2) { D.mode = 'tired'; D.t = 2.6; D.run = 0; a.say(['Hold on, I\'m closing a round.', 'One sec, posting about this.', 'Cardio is a legacy system...'][Math.floor(Math.random() * 3)], 2.2); }
      if (D.cd <= 0 && d < 11) { D.cd = 2.2; g.projectile({ kind: 'pitch', x: a.x, y: a.y + 1.6, z: a.z, speed: 3.4, homing: 1.4, life: 4.5, text: ['USB-AS-A-SERVICE!', 'LET\'S CIRCLE BACK!', 'DISRUPT THE DROP!', 'SYNERGY!'][Math.floor(Math.random() * 4)], dmg: 1, r: 0.55, from: a }); burnsSfx('pitch_blah', { vol: 0.5 }); }
    }
    a.physics(dt);
  },
  hit(a, g) { return g.missions.state('usb') === 'active' && !BW11.state.usbFree; }
});

/* ---------------- the world ---------------- */
BurnsWorlds.register({
  id: 11, name: 'Sound Camp Crawl', sub: 'The 10:00 and 2:00 sides, camp to camp',
  sky: Object.assign({}, BURNS_PALETTES.night, { zen: '#04051a', hor: '#2c1446', mid: '#170e38', midK: 0.4, fog: '#24183c', fogD: 0.0088, haze: 0.45, cityCol: '#ff4fd8', cityK: 0.75, stars: 0.95, clouds: 0.12, cloudCol: '#2a2048', emB: 1.7, sky: '#5a5a9c', gnd: '#4a3a5a', key: '#9aa8e8', keyK: 0.62, rim: '#b07aff' }),
  music: (window.Sound && Sound.trackNames && Sound.trackNames.indexOf('burns_w11') >= 0) ? 'burns_w11' : 'land3',
  bounds: [-232, -150, 232, 100],
  spawn: { x: BW11.P.spawn.x, y: 0, z: BW11.P.spawn.z, yaw: BW11.P.spawn.yaw },
  ground: { base: '#b4977c', crack: 0.22, mottle: 0.38, res: 0.5 },
  dust: 0.6,
  bike: true,
  missions: [
    { id: 'quest', name: 'Find the Right DJ', short: 'Find the DJ who saw the Man', type: 'custom', token: false, start: 'auto', silent: true, marker: { x: -150, z: 40 },
      desc: 'One DJ saw where the Man went. Start with the loudest camp. You can\'t miss him.', hint: 'Camp Make Some Noise, by the 10:00 plaza',
      onComplete(g) { BW11.state.showOfferings = true; } },
    { id: 'djoff', name: 'DJ-Off', short: 'Out-DJ DJ Loophole (C or better)', type: 'custom', giver: 'loophole', start: 'manual', marker: { x: -150, z: 44 },
      desc: 'DJ Loophole won\'t share what he knows until someone out-DJs him. Get a C or better.', hint: 'Camp Make Some Noise, by the 10:00 plaza' },
    { id: 'heckle', name: 'Heckle-Off', short: 'Out-heckle Crusty Curt', type: 'custom', giver: 'curt', start: 'manual', marker: { x: -196, z: -16 },
      desc: 'A crusty vet is heckling every DJ in town. Heckle him back: win two rounds of three.', hint: 'Root Society dance floor, 10:00 side' },
    { id: 'cable', name: 'Blown Bass', short: 'Find 3 speaker cables, then plug in', type: 'custom', count: 3, progressLabel: 'Speaker cables', giver: 'mycelium', start: 'manual', requires: ['quest'], marker: { x: -184, z: -40 },
      desc: 'The wind tore Root Society\'s bass cable into three pieces: one up the tree, one on a speaker, one atop Curt\'s tower. Then plug it in.', hint: 'Root Society, 10:00 side',
      onEvent(g, m, name, data) {
        if (name !== 'pickup' || data.mission !== 'cable') return;
        m.n++; burnsSfx('pick');
        if (m.n >= 3) { g.banner('ALL THREE CABLES!', 'Plug them in at the junction box on the stage', { col: '#7aff5a' }); m.data.marker = 'mycelium'; }
        else g.toast(`Speaker cables: ${m.n}/3`);
        return true;
      } },
    { id: 'vip', name: 'Velvet Rope', short: 'Sneak up onto the VIP riser', type: 'stealth', giver: 'sherpa', start: 'manual', requires: ['quest'], target: { x: BW11.P.vip.x, z: BW11.P.vip.z, r: 3.3, y: 2.3 }, marker: { x: BW11.P.vip.x, z: BW11.P.vip.z },
      desc: 'Get onto the billionaire\'s VIP riser without being spotted by security. The back stairs are your friend.', hint: 'Opulent Temple, 10:00 side (the sherpa behind the riser)',
      onFail(g) { BW11.after(g, 0.9, g2 => { const V = BW11.P.vip; g2.player.teleport(V.x - 9, 0, V.z + 9, Math.PI); g2.snapCam = true; g2.toast('ESCORTED OUT. TRY AGAIN WITH THE SHERPA.'); }); },
      onComplete(g) { BW11.vipWin(g); } },
    { id: 'usb', name: 'Lost & Sound', short: 'Get DJ Maybe\'s USB stick back', type: 'custom', giver: 'maybe', start: 'manual', requires: ['quest'], marker: { x: BW11.P.qmFloor.x, z: BW11.P.qmFloor.z },
      desc: 'A networking tech bro "acquired" DJ Maybe\'s USB stick. Catch him (spin or stomp), grab it, bring it back.', hint: 'Camp Question Mark, 2:00 side',
      onEvent(g, m, name, data) { if (name === 'pickup' && data.mission === 'usb') { m.data.got = true; m.data.marker = 'maybe'; g.banner('GOT THE USB STICK', 'Bring it back to DJ Maybe', { col: '#38f2ff' }); burnsSfx('secret'); return true; } } },
    { id: 'dome', name: 'Bungee Bout', short: 'Win the Thunderdome bout', type: 'custom', giver: 'rattlebones', start: 'manual', requires: ['quest'], marker: { x: BW11.P.dome.x, z: BW11.P.dome.z },
      desc: 'Strap into a bungee, grab a foam bat, and bonk the Moopinator three times before he bonks you.', hint: 'The Thunderdome, 2:00 side' },
    { id: 'set', name: 'Drop the Bass', short: 'Play the headline set at the Wobble Dome', type: 'custom', giver: 'alkali', start: 'manual', requires: ['cable', 'vip', 'usb', 'dome'], tokenDirect: true, marker: { x: BW11.P.wob.x, z: BW11.P.wob.z + 4 },
      desc: 'DJ Alkali has the four offerings. Now play a set worth her secret: B or better.', hint: 'The Wobble Dome, far 2:00 side', lockedDesc: 'DJ Alkali wants four offerings first: Root Society, Opulent Temple, Camp ?, the Thunderdome.' },
    { id: 'darkwads', name: 'Light Up the Darkwads', short: 'Light up 4 darkwads', type: 'custom', token: false, count: 4, progressLabel: 'Darkwads lit', giver: 'ranger', start: 'manual', marker: { x: 0, z: -34 },
      desc: 'The dark playa path is full of burners with zero lights. Talk to one with 3 glow sticks to stick EL wire on him.', hint: 'The dark path across the playa, between 10:00 and 2:00',
      onEvent(g, m, name) { if (name === 'lit') { g.missions.progress('darkwads'); return true; } },
      onComplete(g) { const r = g.actor('ranger'); if (r) r.say('Four darkwads, illuminated. I\'m writing you a commendation. In triplicate.', 3); g.addGlow(15); g.player.givePower('water'); g.toast('+15 GLOW STICKS'); } }
  ],
  build(api, g) { BW11.build(api, g); },
  onStart(g) { BW11.onStart(g); },
  update(g, dt) { BW11.update(g, dt); },
  drawSprites(g, R) { BW11.drawLasers(g, R); BW11Dome.drawSprites(g, R); BW11.drawExtras(g, R); },
  drawSkinned(g, R) { BW11Dome.drawSkinned(g, R); },
  onRespawn(g) { if (BW11Dome.active) BW11Dome.abort(g); }
});

/* ---------------- build ---------------- */
BW11.build = function (api, g) {
  const P = BW11.P, R = api.rng;
  BW11.state = { lasers: [], timers: [], showOfferings: g.missions && false, usbFree: false, hornT: 2, fogT: 0, doorLock: 0 };
  const S = BW11.state;
  S.showOfferings = BurnsSave.get().missions['11:quest'] === 'done';
  g.interactables = g.interactables || [];
  /* ---------- ground ---------- */
  api.paint((c, Pt, sc) => {
    // city side a touch darker, blotches, tyre tracks
    for (let i = 0; i < 180; i++) { const x = R.range(-232, 232), z = R.range(-150, 100), [px, pz] = Pt(x, z), r = R.range(2, 10) * sc; const gg = c.createRadialGradient(px, pz, 0, px, pz, r); const dark = R() < 0.55; gg.addColorStop(0, dark ? 'rgba(110,80,70,0.25)' : 'rgba(225,200,170,0.2)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(px - r, pz - r, r * 2, r * 2); }
    c.strokeStyle = 'rgba(100,72,60,0.2)'; c.lineWidth = 0.3 * sc;
    for (let i = 0; i < 40; i++) { const [ax, az] = Pt(R.range(-232, 232), R.range(-150, 100)), ang = R() * TAU, len = R.range(30, 110) * sc; c.beginPath(); c.moveTo(ax, az); c.quadraticCurveTo(ax + Math.cos(ang + 0.5) * len * 0.5, az + Math.sin(ang + 0.5) * len * 0.5, ax + Math.cos(ang) * len, az + Math.sin(ang) * len); c.stroke(); }
  });
  api.road(P.esp, 13, { tracks: [-3, -1, 1, 3], dash: 'rgba(255,230,180,0.25)' });
  api.road([[-170, 6], [-196, 60], [-222, 100]], 10, { tracks: [-1.5, 1.5] });
  api.road([[170, 6], [196, 60], [222, 100]], 10, { tracks: [-1.5, 1.5] });
  api.road([[-100, 20], [-110, 60], [-115, 100]], 8, {});
  api.road([[100, 20], [110, 60], [115, 100]], 8, {});
  // the dark shortcut across the open playa (no lamps: darkwad country)
  S.darkPath = [[-86, -28], [-50, -44], [-10, -52], [30, -48], [70, -38], [90, -30]];
  api.road(S.darkPath, 5, { col: 'rgba(120,96,84,0.35)', edge: 'rgba(90,70,60,0.15)' });
  api.sign('10:00 & ESPLANADE', -176, 16, { yaw: Math.PI * 0.85, h: 0.9, style: { bg: '#f4e8c8', fg: '#2a1a10', border: '#2a1a10', size: 40 } });
  api.sign('2:00 & ESPLANADE', 176, 16, { yaw: -Math.PI * 0.85, h: 0.9, style: { bg: '#f4e8c8', fg: '#2a1a10', border: '#2a1a10', size: 40 } });
  api.sign('SOUND CAMPS →\n2:00 SIDE', -78, 24, { yaw: Math.PI * 0.6, h: 1.1, style: { bg: '#1a0a2a', fg: '#ff9ad8', border: '#ff4fd8', size: 36, glow: '#ff4fd8' }, glow: '#ff4fd8' });
  api.sign('← 10:00 SIDE\nSOUND CAMPS', 78, 24, { yaw: -Math.PI * 0.6, h: 1.1, style: { bg: '#1a0a2a', fg: '#9aff7a', border: '#7aff5a', size: 36, glow: '#7aff5a' }, glow: '#7aff5a' });
  api.sign('SHORTCUT\n(VERY DARK)', -90, -22, { yaw: 2.4, h: 1.0, style: { bg: '#2a2a30', fg: '#ffffff', border: '#ffe24a', size: 34 } });
  // lamp posts along the Esplanade (the lamplighters' lanterns)
  const EL = BW11.plen(P.esp), tmp = {};
  for (let s = 8; s < EL - 6; s += 24) { BW11.along(P.esp, s, tmp); const rx = Math.cos(tmp.yaw), rz = -Math.sin(tmp.yaw); BW11.lampPost(api, tmp.x - rx * 7.8, tmp.z - rz * 7.8); }
  /* ---------- the 10:00 side ---------- */
  BW11.buildLoop(api, g); BW11.buildRoot(api, g); BW11.buildCurtTower(api); BW11.buildTemple(api, g);
  /* ---------- the 2:00 side ---------- */
  BW11.buildQM(api, g); BW11.buildDome(api, g); BW11.buildWobble(api, g);
  /* ---------- theme camps on the city side ---------- */
  BW11.camp(api, -214, 34, 1101, { yaw: 0.2, dome: true });
  BW11.camp(api, -124, 70, 1102, { yaw: -0.1, sign: 'CAMP NAP TIME\n(SHHH)', fg: '#9adcff' });
  BW11.camp(api, -62, 50, 1103, { yaw: 0.1, dome: true });
  BW11.camp(api, -30, 78, 1104, { yaw: 0, sign: 'HUG DECONSTRUCTION\nZONE', fg: '#ff9ad8' });
  BW11.camp(api, 44, 60, 1105, { yaw: -0.05 });
  BW11.camp(api, 66, 84, 1106, { yaw: 0.15, dome: true });
  BW11.camp(api, 128, 46, 1107, { yaw: 0.1, sign: 'SPARKLE PONY\nRESCUE (WATER: NO)', fg: '#c8a0ff' });
  BW11.camp(api, 214, 30, 1108, { yaw: -0.2, dome: true });
  BW11.camp(api, -170, 92, 1109, { yaw: 0.1 });
  // grilled cheese gifting camp (middle of the Esplanade)
  const C = P.cheese;
  api.prop('shade', { x: C.x, z: C.z, w: 7, d: 5, col: '#ffd890' });
  api.roundBox(C.x, 0, C.z - 1.6, 3.2, 1.0, 0.9, '#6a6a72', { r: 0.12, top: '#2a2a30' });
  api.mesh(C.x, C.z - 1.6, m => { m.color('#ff7a2a', 0.8); m.roundBox(-0.6, 1.05, 0, 0.9, 0.05, 0.6, 0.02); m.color('#ffd84a', 0.2); for (let i = 0; i < 4; i++) m.roundBox(0.5 + (i % 2) * 0.4, 1.09, -0.15 + Math.floor(i / 2) * 0.3, 0.3, 0.06, 0.25, 0.02); m.emissive(0); return { lights: [{ x: -0.6, y: 1.2, z: 0, s: 1.4, c: '#ff9a4a' }] }; });
  api.sign('GRILLED CHEESE\nALWAYS O\'CLOCK', C.x + 4.5, C.z - 2.6, { yaw: Math.PI, h: 1.2, style: { bg: '#ffe28a', fg: '#6a2a0a', border: '#6a2a0a', size: 38 } });
  api.light(C.x, C.z, 12, '#ffb070', 0.5);
  api.prop('couch', { x: C.x - 2, z: C.z + 2, yaw: Math.PI, col: '#8a2a5a' });
  /* ---------- checkpoints + markers ---------- */
  api.checkpoint('cp_plaza', -186, 62, { yaw: 2.4, name: '10:00 Plaza' });
  api.checkpoint('cp_root', -168, -8, { yaw: Math.PI, name: 'Root Society' });
  api.checkpoint('cp_temple', -94, -24, { yaw: Math.PI, name: 'Opulent Temple' });
  api.checkpoint('cp_cheese', 8, 44, { yaw: Math.PI, name: 'Grilled Cheese' });
  api.checkpoint('cp_qm', 86, -18, { yaw: Math.PI, name: 'Camp ?' });
  api.checkpoint('cp_wobble', 134, -76, { yaw: Math.PI, name: 'The Wobble Dome' });
  api.marker('root', P.root.x, P.root.z, 'Root Society', { col: '#7aff5a' });
  api.marker('temple', P.temple.x, P.temple.z, 'Opulent Temple', { col: '#ffd84a' });
  api.marker('qm', P.qm.x, P.qm.z, 'Camp ?', { col: '#38f2ff' });
  api.marker('dome', P.dome.x, P.dome.z, 'Thunderdome', { col: '#ff5a3a' });
  api.marker('wob', P.wob.x, P.wob.z, 'Wobble Dome', { col: '#ff4fd8' });
  api.marker('loop', P.loop.x, P.loop.z, 'DJ Loophole', { col: '#9aff7a' });
  BW11.buildPeople(api, g);
  BW11.buildPickups(api, g);
  // bike traffic: two Esplanade lanes (each way) + riders crossing the playa
  const esp = P.esp, back = esp.slice().reverse();
  BW11.addBikes(api, [
    { path: esp, n: 4, speed: 7.5, off: 3.0 },
    { path: back, n: 4, speed: 7, off: 3.0 },
    { path: [[-150, 12], [-90, -20], [0, -12], [90, -20], [150, 12], [90, 8], [0, 14], [-90, 8], [-150, 12]], n: 3, speed: 8, off: 0 }
  ]);
  // art cars cruising the open playa (lights moving in the dark)
  api.artCar({ x: -40, z: -90, yaw: 1.2, path: [[-40, -90], [30, -110], [70, -80], [20, -70], [-50, -70]], pathSpeed: 2.6, drivable: false, col: '#2a1a4a', sculpt: '#ff4fd8', len: 9, w: 4 });
  api.artCar({ x: 40, z: -20, yaw: -1.6, path: [[40, -20], [-30, -18], [-60, -60], [-10, -100], [50, -70]], pathSpeed: 2.2, drivable: false, col: '#1a3a3a', sculpt: '#7aff5a', len: 8, w: 3.6 });
  // interactables: plug in the bass
  const J = S.junction;
  g.interactables.push({ x: J.x, z: J.z, y: J.y, r: 2.4, label: 'PLUG IN', when: g2 => g2.missions.state('cable') === 'active' && g2.missions.get('cable').n >= 3, fn: g2 => BW11.plugIn(g2) });
  // mystery doors: in one, out the next
  S.doors.forEach((d, i) => api.trigger({ x: d.x, z: d.z, r: 0.9, onEnter: g2 => BW11.doorWarp(g2, i) }));
};
BW11.buildPeople = function (api, g) {
  const P = BW11.P, S = BW11.state, T = BW11.type;
  const quest = () => g.missions.isDone('quest');
  /* ---- the plaza ---- */
  api.npc({ id: 'mel', name: 'MEGAPHONE MEL', spec: BW11.LOOKS.mel(), x: -188, z: 66, yaw: 2.6, behavior: 'idle', gift: { kind: 'glowstick', n: 10 },
    lines: ['ATTENTION, BEAUTIFUL WEIRDOS! A giant wooden guy was spotted dancing at a sound camp!', 'Word is ONE DJ saw where he went. Which DJ? The playa won\'t say.', 'Start with the loudest camp. You can\'t miss him. Please make him stop.'],
    chat: ['WATER IS A LIFESTYLE!', 'LOST AND FOUND IS AT CENTER CAMP! SO IS YOUR DIGNITY!', 'BIKES HAVE LIGHTS! BE LIKE BIKES!'] });
  api.npc({ type: T('burney'), seed: 3, name: 'BURNEY', x: -205, z: 58, yaw: 1.4, behavior: 'idle', gift: { kind: 'glowstick', n: 8 }, lines: ['Hold that pose! One more! ONE MORE!', 'Perfect. You look like a man on a mission. A sad, dusty mission.', 'Here, glow sticks. For the photo shoot of your life.'] });
  /* ---- DJ Loophole's camp ---- */
  const L = P.loop;
  api.npc({ id: 'loophole', name: 'DJ LOOPHOLE', type: T('annoyingdj'), seed: 1, x: L.x + 0.6, z: L.z + 0.25, y: 0.5, fixedY: true, yaw: Math.PI, behavior: 'idle', anim: 'dj', noDJ: true, chatter: false, talk: (g2, a) => BW11.talkLoophole(g2, a) });
  const bored = [['Make it stop.', 'Is this... the same drop?'], ['It\'s the same drop.', 'I have heard this drop four hundred times.'], ['My ears are filing a complaint.', 'MAKE SOME NOISE. I\'m making a noise. It\'s a sigh.'], ['I came for the grilled cheese.', 'He played "the drop" at my wedding. I wasn\'t even married.']];
  bored.forEach((ls, i) => api.npc({ type: ['burner', 'tutu', 'furcoat', 'ledsuit'][i], seed: 120 + i, x: L.x - 3 + i * 2, z: L.z - 6 - (i % 2) * 1.5, yaw: Math.PI * 0 + 0.0, behavior: i === 3 ? 'sit' : 'idle', lines: ls, chat: [ls[0]] }));
  /* ---- Root Society ---- */
  const RT = P.root, RF = P.rootFloor;
  api.npc({ id: 'mycelium', name: 'DJ MYCELIUM', spec: BW11.LOOKS.mycelium(), x: RT.x, z: RT.z + 7.2, y: 1.3, fixedY: true, yaw: 0, behavior: 'idle', noDJ: true, talk: (g2, a) => BW11.talkMycelium(g2, a),
    chat: ['...is this thing on?', 'The roots are quiet tonight.', 'Bass is the heartbeat of the forest. Our heart is unplugged.'] });
  api.npc({ id: 'curt', name: 'CRUSTY CURT', type: T('crusty'), seed: 7, prop: 'bottle', x: RF.x + 7, z: RF.z - 6, yaw: Math.PI, behavior: 'idle', talk: (g2, a) => BW11.talkCurt(g2, a),
    chat: ['BOOO! PLAY SOMETHING WITH A BANJO!', 'THIS ISN\'T MUSIC, IT\'S A FAX MACHINE FALLING DOWN STAIRS!', 'Baker Beach had better bass! And it was a BEACH!', 'Too corporate! Even the trees are corporate now!'] });
  const fixed = BurnsSave.hasToken(11, 'cable');
  S.rootCrowd = api.crowd(RF.x, RF.z, 7, 10, { types: ['burner', 'tutu', 'furcoat', 'ledsuit', 'burner', 'sparklepony'], behaviors: fixed ? ['dance'] : ['idle', 'wander', 'idle'], lines: fixed ? ['THE BASS IS BACK!', 'I can feel it in my roots!'] : ['Where\'s the bass?', 'This is just treble and vibes.', 'I\'m dancing on the inside.'] });
  /* ---- Opulent Temple ---- */
  const TP = P.temple, TF = P.templeFloor, V = P.vip;
  api.npc({ id: 'gilda', name: 'DJ GILDA', type: T('burner'), seed: 51, x: TP.x, z: TP.z + 4.2, y: 1.4, fixedY: true, collide: false, yaw: 0, behavior: 'dance', style: 1, noDJ: true, lines: ['Welcome to the Temple of Excess, darling.', 'Every drop here comes with a flame cannon. Mind your eyebrows.', 'The billionaire on the riser? He tips in NFTs. I don\'t take NFTs.'] });
  api.npc({ type: T('firespinner'), seed: 2, tool: 'poi', x: TP.x - 4.5, z: TP.z + 9.5, yaw: 0, behavior: 'firespin', turn: 0.6, name: 'FIRE SPINNER' });
  api.npc({ type: T('firespinner'), seed: 5, tool: 'staff', x: TP.x + 4.5, z: TP.z + 9.5, yaw: 0, behavior: 'firespin', turn: -0.5, name: 'FIRE SPINNER' });
  api.crowd(TF.x, TF.z, 8.5, 12, { types: ['burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'influencer'], behaviors: ['dance'] });
  api.npc({ type: T('undercovercop'), seed: 1, name: 'TOTALLY A BURNER', x: TF.x + 9, z: TF.z + 2, behavior: 'undercover', path: [[TF.x + 9, TF.z + 2], [TF.x, TF.z + 10], [TF.x - 9, TF.z + 2], [TF.x, TF.z - 7]], view: 10, lines: ['Groovy. I am a regular burner. With regular... vibes.', 'Have you seen any ground score? Asking for a... friend. Groovy.'] });
  api.npc({ id: 'sherpa', name: 'SHERPA SAM', spec: BW11.LOOKS.sherpa(), x: V.x - 8.5, z: V.z - 6.5, yaw: 1.2, behavior: 'idle', talk: (g2, a) => BW11.talkSherpa(g2, a) });
  api.npc({ id: 'sterling', name: 'STERLING TURNKEY', type: T('billionaire'), seed: 1, x: V.x + 1.6, z: V.z - 1.1, y: 2.6, fixedY: true, yaw: 0.2, behavior: 'idle', talk: (g2, a) => BW11.talkSterling(g2, a),
    chat: ['Radical inclusion! (Not past the rope.)', 'My sherpas built this riser by hand. Their hands.', 'Is it hot, or is it just my yacht guilt?'] });
  // VIP security with flashlights (custom stealth guards)
  const guard = (i, path, o) => api.npc(Object.assign({ id: 'guard' + i, name: 'VIP SECURITY', spec: BW11.LOOKS.guard(i), x: path[0][0], z: path[0][1], behavior: 'bw11Guard', path, view: 9, fov: 0.5, noTalk: true, chatter: false, speed: 1.3, spotLine: ['WRISTBAND?!', 'SIR. SIR. RISER\'S CLOSED.', 'NO WRISTBAND, NO VIBE.'][i % 3] }, o || {}));
  guard(0, [[V.x - 5, V.z + 5.6, Math.PI * 0.95], [V.x + 5, V.z + 5.6, Math.PI * 1.05]], { fov: 0.55 });
  guard(1, [[V.x + 5.6, V.z + 3.2, -Math.PI / 2], [V.x + 5.6, V.z - 3.4, 0.4]], { view: 8 });
  guard(2, [[V.x - 7, V.z - 7.6, -Math.PI / 2, 2.4], [V.x + 4, V.z - 7.6, Math.PI / 2, 2.0]], { view: 8.5, speed: 1.1 });
  /* ---- the crossing ---- */
  const C = P.cheese;
  api.npc({ id: 'toasty', name: 'TOASTY', spec: BW11.LOOKS.toasty(), x: C.x - 0.4, z: C.z - 2.6, yaw: 0, behavior: 'idle', gift: { kind: 'water' }, lines: ['Grilled cheese! Four a.m. or four p.m., it\'s grilled cheese o\'clock.', 'Gifting is my love language. My other love language is butter.'] });
  api.npc({ type: T('partiedtoohard'), seed: 2, name: 'TUESDAY', x: C.x + 6, z: C.z + 6, behavior: 'wander', radius: 5, speed: 0.8, lines: ['What day is it? I\'ve been awake since... Tuesday?', 'Have you seen my other boot? It has my camp address in it.', 'If you see the Man, tell him he owes me a hat.'] });
  api.npc({ id: 'ranger', name: 'RANGER DALE', type: T('ranger'), seed: 4, x: -84, z: 14, yaw: 2.2, behavior: 'idle', talk: (g2, a) => BW11.talkRanger(g2, a) });
  api.npc({ type: T('lamplighter'), seed: 1, name: 'LAMPLIGHTER', x: -60, z: 30, behavior: 'walk', path: [[-60, 30], [60, 30]], pingpong: true, speed: 0.9, lines: ['Every dusk we hang the lanterns. Every dawn we take them down.', 'Light the way, friend.'] });
  const dk = [[-66, -38], [-38, -47], [-14, -52], [12, -51], [38, -46], [62, -40]];
  dk.forEach(([x, z], i) => api.npc({ type: T('darkwad'), seed: 10 + i, x: x + (i % 2 ? 1.2 : -1.2), z, yaw: i, behavior: 'darkwad', radius: i % 3 === 0 ? 3 : 0, name: 'DARKWAD' }));
  /* ---- Camp ? ---- */
  const Q = P.qm, QF = P.qmFloor;
  api.npc({ id: 'maybe', name: 'DJ MAYBE', spec: BW11.LOOKS.maybe(), x: Q.x, z: Q.z + 5.4, y: 1.0, fixedY: true, yaw: 0, behavior: 'idle', noDJ: true, talk: (g2, a) => BW11.talkMaybe(g2, a) });
  for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; api.npc({ type: T('furry'), seed: i + 1, x: QF.x + Math.sin(a) * 5, z: QF.z + Math.cos(a) * 5, yaw: a + Math.PI, behavior: 'dance', style: [1, 4, 0, 5][i], name: 'FURRY', lines: [['*happy tail wag*', 'The tech bro with the USB? He ran that way! *points with paw*'], ['Is it hot or is it just this suit? It\'s the suit.', 'Free hugs! Fur included!'], ['We\'re not a cult. We\'re a fandom. Different paperwork.'], ['Pro tip: tech bros get winded. They skip leg day for pitch day.']][i] }); }
  api.crowd(QF.x, QF.z, 8, 7, { types: ['burner', 'tutu', 'ledsuit', 'sparklepony', 'furcoat'], behaviors: ['dance'] });
  for (let i = 0; i < 3; i++) api.enemy({ type: 'techbro', seed: 20 + i, x: QF.x + [-8, 8, 0][i], z: QF.z + [3, 1, 9][i], behavior: 'pitcher', hp: 2, name: 'NETWORKING BRO', cooldown: 3.2, aggro: 10, pitches: ['LET\'S CONNECT!', 'WHAT\'S YOUR BURN NAME? MINE\'S SEED ROUND', 'DANCE FLOOR DAO!', 'ARE YOU HIRING?', 'SYNERGY!'] });
  api.enemy({ id: 'blake', name: 'BLAKE (FOUNDER, PRE-SEED)', type: 'techbro', seed: 77, x: QF.x - 3, z: QF.z + 5, behavior: 'bw11Runner', hp: 1, drop: 4, defeatLine: 'FINE! Take it! It wasn\'t even on the blockchain!', afterDefeat: 'chill',
    onDefeat(g2, a) { BW11.state.usbFree = true; g2.toast('THE USB STICK FELL OUT OF HIS FLEECE!'); } });
  api.npc({ type: T('undercovercop'), seed: 2, name: 'DEFINITELY A BURNER', x: QF.x - 7, z: QF.z - 4, behavior: 'undercover', path: [[QF.x - 7, QF.z - 4], [QF.x + 7, QF.z - 4], [QF.x + 6, QF.z + 8], [QF.x - 6, QF.z + 8]], view: 10 });
  api.npc({ type: T('burnermom'), seed: 1, name: 'BURNER MOM', x: 76, z: 6, yaw: -1.2, behavior: 'idle', gift: { kind: 'water' }, lines: ['WOOO! Best! Week! Ever!', 'Take my photo with the bun man! Both cameras!', 'Here, sweetie, water. You look dehydrated AND heartbroken.'] });
  api.npc({ type: T('burnerkid'), seed: 1, name: 'MORTIFIED KID', x: 78, z: 8, yaw: -1.4, behavior: 'idle', lines: ['Please don\'t look at us.', 'She brought her MOM. My mom. My actual mom.'] });
  /* ---- the Thunderdome ---- */
  const D = P.dome;
  api.npc({ id: 'rattlebones', name: 'MC RATTLEBONES', type: T('deathguild'), seed: 1, x: D.x - 5.8, z: D.z + D.R + 1.6, y: 3.0, fixedY: true, yaw: Math.PI * 0.85, behavior: 'idle', anim: 'yell', talk: (g2, a) => BW11.talkMC(g2, a),
    chat: ['BOUNCE! BONK! BOUNCE! BONK!', 'ANYONE ELSE WANT A FOAM SANDWICH?!', 'THE DOME IS HUNGRY!'] });
  api.npc({ id: 'moop', name: 'THE MOOPINATOR', type: T('deathguild'), seed: 9, scale: 1.25, x: D.x + 3, z: D.z - 2, yaw: Math.PI, behavior: 'idle', anim: 'idle', lines: ['I remove MOOP. You look like MOOP.', 'Foam only. I have standards.'], chatter: false, noDJ: true });
  api.npc({ type: T('safetycaptain'), seed: 2, name: 'HARNESS INSPECTOR', x: D.x + 6.5, z: D.z + D.R + 2.2, yaw: Math.PI, behavior: 'idle', lines: ['Harness tension: acceptable. Bat foam density: acceptable. Your vibe: concerning.', 'Safety THIRD? In my dome? It\'s at least... second.'] });
  S.domeFans = [];
  (S.domeNodes || []).filter((n, i) => i % 3 === 0).slice(0, 12).forEach((n, i) => {
    const r = D.R + 0.45, x = D.x + n[0] * r, y = n[1] * r - 0.9, z = D.z + n[2] * r;
    S.domeFans.push(api.npc({ type: ['burner', 'deathguild', 'furcoat', 'crusty', 'tutu', 'ledsuit'][i % 6], seed: 300 + i, x, z, y: Math.max(0, y), fixedY: true, yaw: Math.atan2(D.x - x, D.z - z), behavior: 'bw11Hang', noTalk: true, chatter: false, collide: false, noDJ: true }));
  });
  api.crowd(D.x, D.z + D.R + 6, 4, 5, { types: ['burner', 'deathguild', 'furcoat'], behaviors: ['idle', 'dance'] });
  /* ---- the Wobble Dome ---- */
  const W = P.wob, WF = P.wobFloor;
  api.npc({ id: 'alkali', name: 'DJ ALKALI', spec: BW11.LOOKS.alkali(), x: W.x, z: W.z + 4.2, y: 1.6, fixedY: true, yaw: 0, behavior: 'dance', style: 2, noDJ: true, talk: (g2, a) => BW11.talkAlkali(g2, a), chat: ['The bass knows.', 'Offerings first. Vibes second.'] });
  api.npc({ id: 'margo', name: 'STAGE MANAGER MARGO', type: 'campLead', seed: 14, x: W.x - 6.5, z: W.z + 6, y: 1.6, fixedY: true, yaw: 0.6, behavior: 'idle', noDJ: true, gift: { kind: 'water' },
    lines: ['Who\'s on next? You? Okay. OKAY. I\'m breathing.', 'Do not touch the red button. There is no red button. Don\'t look for it.', 'Here, water. Everyone on my stage is hydrated or they\'re off my stage.'] });
  api.crowd(WF.x, WF.z, 9, 16, { types: ['burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony', 'burner'], behaviors: ['dance'] });
  api.npc({ type: T('furry'), seed: 9, name: 'FURRY', x: WF.x + 6, z: WF.z + 5, behavior: 'dance', style: 1, lines: ['Alkali\'s sets make my tail go round.'] });
};
BW11.buildPickups = function (api, g) {
  const P = BW11.P, S = BW11.state;
  // cables (Blown Bass)
  const th = S.treehouse, RT = P.root, CT = P.curt;
  api.pickup('item:cable', th.x, th.y + 0.9, th.z, { mission: 'cable', gate: true, label: 'SPEAKER CABLE', icon: 'ziptie', id: 'cable0' });
  api.pickup('item:cable', RT.x - 6.9, 3.8, RT.z + 8.6, { mission: 'cable', gate: true, label: 'SPEAKER CABLE', icon: 'ziptie', id: 'cable1' });
  api.pickup('item:cable', CT.x - 0.75, 10.9, CT.z, { mission: 'cable', gate: true, label: 'SPEAKER CABLE', icon: 'ziptie', id: 'cable2' });
  // the USB stick rides on Blake until he drops it
  api.pickup('item:usb', P.qmFloor.x, 2.6, P.qmFloor.z, { mission: 'usb', gate: true, label: 'USB STICK', icon: 'tab', id: 'usb', persist: false,
    follow(g2, Pk) { const b = g2.actor('blake'); if (!b) return; if (!BW11.state.usbFree) { Pk.x = b.x; Pk.z = b.z; Pk.y0 = b.y + 2.55; } else if (!Pk.dropped) { Pk.dropped = true; Pk.x = b.x + 0.8; Pk.z = b.z; Pk.y0 = b.y + 0.8; g2.fx.burst(Pk.x, Pk.y0, Pk.z, 'star', 10, '#38f2ff'); } } });
  // photos of Chinka
  api.pickup('photo', S.nest.x, S.nest.y + 0.9, S.nest.z, { id: 'p1' });
  api.pickup('photo', S.towerTop.x, S.towerTop.y + 0.9, S.towerTop.z, { id: 'p2' });
  api.pickup('photo', P.qm.x, 15.4, P.qm.z, { id: 'p3', hidden: true });
  // ground score
  const RF = P.rootFloor, TF = P.templeFloor, QF = P.qmFloor, V = P.vip;
  api.pickup('bag:bufo', RF.x - 13, 0.9, RF.z - 9);
  api.pickup('bag:weed', CT.x + 2.2, 0.9, CT.z + 2.8);
  api.pickup('bag:liquor', CT.x - 2.6, 0.9, CT.z - 3.2);
  api.pickup('bag:molly', TF.x - 6, 0.9, TF.z + 6);
  api.pickup('bag:khole', V.x - 3.2, 3.5, V.z + 0.8);
  api.pickup('bag:powder', 2, 0.9, 36);
  api.pickup('bag:lsd', QF.x + 13, 0.9, QF.z - 6);
  api.pickup('bag:shrooms', -24, 0.9, -76);
  for (const [x, z] of [[-190, 50], [-150, 30], [-176, -10], [-120, -18], [-60, 10], [40, 20], [120, -16], [170, -2], [146, -74], [-84, -66]]) api.pickup('water', x, 0.9, z);
  // glow sticks: routes that teach the way (and the jumps)
  api.glowLine(-192, 70, -156, 50, 9); api.glowLine(-160, 30, -176, 0, 7);
  api.glowLine(-176, 0, -184, -12, 4); api.glowRing(RF.x, RF.z, RF.r + 1.6, 14);
  const stepsA = [[1.15, 4.4, 1.6], [1.65, 4.3, 3.2], [2.15, 4.2, 4.7]];
  for (const [a, d, y] of stepsA) api.pickup('glowstick', RT.x + Math.sin(a) * d, y + 0.8, RT.z + Math.cos(a) * d);
  for (const [a, d, y] of [[3.45, 3.5, 7.8], [4.1, 3.6, 9.4], [4.75, 3.5, 11.0]]) api.pickup('glowstick', RT.x + Math.sin(a) * d, y + 0.8, RT.z + Math.cos(a) * d);
  api.glowArc(RT.x - 6.9, 1.6, RT.z + 10.5, RT.x - 6.9, 3.4, RT.z + 8.6, 1, 3);
  api.glowLine(CT.x + 1.5, CT.z + 4, CT.x + 1.5, CT.z + 1.5, 3);
  api.glowLine(-150, -10, -126, -24, 6); api.glowRing(TF.x, TF.z, TF.r + 1.5, 14);
  api.glowLine(TF.x - 8, P.temple.z + 7, TF.x + 8, P.temple.z + 7, 6, 2.3);
  for (const [y, lx] of [[3.1, -9.2], [5.0, -10.8], [6.9, -9.2], [8.8, -10.8]]) api.pickup('glowstick', P.temple.x + lx, y + 0.7, P.temple.z - 0.55);
  api.glowArc(V.x - 9, 0.9, V.z - 6, V.x - 2.4, 1.6, V.z - 4.6, 0.6, 5);
  // the lit Esplanade and the dark shortcut
  const tmp = {}, EL = BW11.plen(P.esp);
  for (let s = 40; s < EL - 40; s += 13) { BW11.along(P.esp, s, tmp); if (Math.abs(tmp.x) < 150) api.pickup('glowstick', tmp.x, 0.9, tmp.z); }
  const DL = BW11.plen(S.darkPath);
  for (let s = 6; s < DL - 4; s += 10) { BW11.along(S.darkPath, s, tmp); api.pickup('glowstick', tmp.x, 0.9, tmp.z); }
  api.glowRing(QF.x, QF.z, QF.r + 1.5, 14); api.glowArc(P.qm.x - 3, 0.9, P.qm.z + 3, P.qm.x, 3.4, P.qm.z, 1.2, 4);
  api.glowRing(P.dome.x, P.dome.z, 6, 10); api.glowLine(P.dome.x, P.dome.z + 16, P.dome.x, P.dome.z + 12, 3);
  api.glowRing(P.wobFloor.x, P.wobFloor.z, P.wobFloor.r + 1.5, 16); api.glowLine(150, -60, 150, -76, 5);
  api.glowLine(118, -40, 140, -64, 6);
};

/* ---------------- start, update, extra visuals ---------------- */
BW11.onStart = function (g) {
  const S = BW11.state;
  if (g.missions.isDone('quest')) S.showOfferings = true;
  if (BurnsSave.hasToken(11, 'usb') || g.missions.isDone('usb')) S.usbFree = true;
  S.bassOn = BurnsSave.hasToken(11, 'cable');
  if (!BurnsSave.flag(11, 'intro')) BW11.intro(g);
  else g.banner('SOUND CAMP CRAWL', g.missions.isDone('quest') ? 'Bring DJ Alkali her four offerings' : 'Find the DJ who saw the Man', { col: '#7aff5a' });
};
BW11.update = function (g, dt) {
  const S = BW11.state, p = g.player, P = BW11.P;
  BW11.tick(g, dt);
  BW11.updateBikes(g, dt);
  S.doorLock = Math.max(0, S.doorLock - dt);
  // DJ Loophole plays The Drop. Again.
  const L = P.loop, dl = Math.hypot(p.x - L.x, p.z - L.z);
  S.hornT -= dt;
  if (S.hornT <= 0 && !g.cine && !g.dialog.open) {
    S.hornT = g.missions.isDone('djoff') ? 9 : 4.2;
    if (dl < 45) { burnsSfx('artcarHorn', { vol: clamp(0.5 - dl / 100, 0.05, 0.4), pitch: 1.05 }); const lp = g.actor('loophole'); if (lp && Math.random() < 0.6) lp.say(['MAKE SOME NOOOISE!', 'HERE COMES THE DROP! AGAIN!', 'ONE MORE TIME! ONE MORE TIME!', 'DROP IT! ...AGAIN!'][Math.floor(Math.random() * 4)], 1.6); }
  }
  // fog at Camp ?
  const Q = P.qm;
  if (Math.hypot(p.x - Q.x, p.z - Q.z) < 70 && Math.random() < dt * 9) { const a = Math.random() * TAU, r = Math.random() * 12; g.fx.add(Q.x + Math.sin(a) * r, 0.3, Q.z + 20 + Math.cos(a) * r, (Math.random() - 0.5) * 0.4, 0.15, (Math.random() - 0.5) * 0.4, 4, 2, 5, [0.75, 0.7, 1], 0.12, 'smoke', 4); }
  // the bass is back at Root Society: notes float up from the speakers
  if (S.bassOn && Math.random() < dt * 2.5) { const c = S.rootCones[Math.floor(Math.random() * S.rootCones.length)]; if (c) g.fx.notes(c[0], c[1] + 0.5, c[2] + 0.4); }
};
BW11.drawExtras = function (g, R) {
  const S = BW11.state, SP = BURNS_SPRITES.R, t = g.time, beat = Math.pow(Math.max(0, Math.cos(t * 128 / 60 * TAU)), 4);
  // speaker cones breathe with the beat (Root Society once fixed, the Wobble Dome always)
  if (S.bassOn) for (const c of S.rootCones) R.bbs.bb(c[0], c[1], c[2] + 0.3, 1.4 + beat * 0.8, 1.4 + beat * 0.8, SP.glow, [0.5, 1, 0.35], 0.25 + beat * 0.5, true);
  // the mirror ball throws little beams onto the floor
  const M = S.mirror; if (M) {
    const dx = M.x - g.cam.x, dz = M.z - g.cam.z;
    if (dx * dx + dz * dz < 110 * 110) {
      for (let i = 0; i < 9; i++) { const a = t * 0.6 + i * 0.7, r = 6 + (i % 3) * 4, tx = M.x + Math.sin(a) * r, tz = M.z + 14 + Math.cos(a) * r * 0.8; BW11.beam(R, M.x, M.y, M.z, tx, 0.1, tz, 0.05, burnsRGBf(BURNS_NEON[i % 7]), 0.35, 3); R.flat.flat(tx, 0.08, tz, 0.9, 0.9, 0, SP.glow, burnsRGBf(BURNS_NEON[i % 7]), 0.6, true); }
      if (Math.random() < 0.4) g.fx.glint(M.x + (Math.random() - 0.5) * 2.4, M.y + (Math.random() - 0.5) * 2.4, M.z + 1.2, '#ffffff');
    }
  }
};
BW11.doorWarp = function (g, i) {
  const S = BW11.state; if (S.doorLock > 0 || g.cine) return;
  const n = S.doors.length, d = S.doors[(i + 1) % n], p = g.player;
  S.doorLock = 1.6;
  if (p.vehicle) p.vehicle.dismount(p);
  p.teleport(d.x + Math.sin(d.yaw) * 1.8, 0, d.z + Math.cos(d.yaw) * 1.8, d.yaw); g.snapCam = true; g.camYaw = d.yaw;
  g.fx.ring(p.x, p.y + 1, p.z, 2.4, '#38f2ff', 0.5); g.fx.burst(p.x, p.y + 1.2, p.z, 'star', 12, '#ff4fd8');
  burnsSfx('portal', null, 'secret');
  g.toast(['...?', 'WAIT, WHERE?', 'WHO PUT THAT DOOR THERE?', 'THE CAMP IS ASKING QUESTIONS'][Math.floor(Math.random() * 4)]);
};

/* ---------------- story: intro ---------------- */
BW11.intro = function (g) {
  const p = g.player, P = BW11.P, mel = g.actor('mel');
  p.teleport(P.spawn.x, 0, P.spawn.z, P.spawn.yaw);
  const c0 = { x: -150, y: 46, z: 130, tx: -150, ty: 4, tz: -40, fov: 0.9 }, c1 = { x: -130, y: 18, z: 40, tx: -150, ty: 6, tz: -55, fov: 0.95 }, c2 = { x: -192, y: 2.6, z: 82, tx: -196, ty: 1.6, tz: 74, fov: 0.85 };
  g.cutscene([
    { music: g.def.music },
    { cam: c0 },
    { banner: [BurnsWorlds.label(11).toUpperCase(), 'SOUND CAMP CRAWL · 10:00 TO 2:00', { col: '#7aff5a', big: true, dur: 3 }] },
    { cam: { from: c0, to: c1, dur: 3.6 } },
    { cam: { from: c1, to: c2, dur: 2.4 } },
    { say: ['brady', ['El Pulpo is running on fumes. Yellow bike it is.', 'Somewhere out here, somebody saw where the Man took Chinka.']] },
    { cam: { x: -192, y: 2.4, z: 72, tx: -188, ty: 1.7, tz: 66, fov: 0.85 } },
    { say: [mel || 'MEGAPHONE MEL', ['ATTENTION, BEAUTIFUL WEIRDOS! A giant wooden guy was spotted dancing at a sound camp tonight!', 'Rumor says ONE DJ saw where he went with that lady!']] },
    { say: ['brady', ['A DJ. At a sound camp. On the 10 and 2 sides.', 'That narrows it down to... all of them.']] },
    { do: g2 => { BurnsSave.flag(11, 'intro', true); g2.camYaw = P.spawn.yaw; g2.snapCam = true; } },
    { banner: ['FIND THE RIGHT DJ', 'Start with the loudest one. Then ride the yellow bike (BIKE button).', { col: '#ffd84a' }] }
  ], null);
};

/* ---------------- DJ Loophole + the DJ-off ---------------- */
BW11.talkLoophole = function (g, a) {
  const st = g.missions.state('djoff');
  if (st === 'done') { g.say(a, g.missions.isDone('set') ? ['MAKE SOME NOOOISE! ...Heard you played the Wobble Dome. Show-off.'] : ['MAKE SOME NOISE! ...Oh. You. Go find Alkali, the Wobble Dome, 2:00 side. I have a drop to repeat.']); return; }
  g.say(a, st === 'active' ? ['Rematch? The crowd still loves me. The crowd LOVES the drop.'] : ['MAKE SOME NOOOISE! Oh. Hi. You want the decks? Nobody gets the decks. I AM the decks.', 'You want info about a giant wooden guy? Beat me in a DJ-off. Whoever gets the crowd going wins.', 'Get at least a C. I got a D-minus once and I\'m STILL here. Here we go!'], () => {
    g.missions.start('djoff', st === 'active');
    BW11.djoff(g);
  });
};
BW11.djoff = function (g) {
  const L = BW11.P.loop, a = g.actor('loophole');
  if (a) { a.x = L.x + 2.1; a.z = L.z - 0.2; a.yaw = Math.PI * 0.8; a.ch.play('cheer'); }
  BurnsDJ.open(g, {
    title: 'DJ-Off vs. DJ Loophole', bpm: 124, genre: 'house', difficulty: 1, duration: 46, crowd: 9,
    booth: { x: L.x, y: 0.5, z: L.z + 0.35, yaw: Math.PI }, exclude: ['loophole'],
    quotes: { D: ['Even DJ Loophole\'s crowd prefers DJ Loophole. Ouch.'], C: ['You beat The Drop. Barely. It counts.'], B: ['The crowd forgot The Drop exists. Beautiful.'], A: ['DJ Loophole is crying into an energy drink.'], S: ['DJ Loophole has retired. (For an hour.)'] },
    onDone(r) {
      if (a) { a.x = L.x + 0.6; a.z = L.z + 0.25; a.yaw = Math.PI; }
      const ok = r.grade !== 'D' && !r.forfeit;
      if (!ok) { g.say(a || 'DJ LOOPHOLE', ['HA! The crowd prefers ME! The drop is ETERNAL!', 'Rematch whenever. I\'m always here. ALWAYS.']); return; }
      g.say(a || 'DJ LOOPHOLE', [`...${r.grade}? Okay. The crowd likes you more. Wow. Rude.`, 'FINE. The DJ who saw the big wooden guy? DJ ALKALI. She plays the Wobble Dome, way out past 2:00.', 'But Alkali only lets people near her decks if they bring offerings.', 'Something from Root Society, from Opulent Temple, from Camp Question Mark, and from the Thunderdome. One each.', 'Now if you\'ll excuse me. MAKE SOME NOOOISE!'], () => {
        g.missions.complete('djoff', { x: L.x - 1, y: 1.4, z: L.z - 3.2 });
        if (!g.missions.isDone('quest')) g.missions.complete('quest');
        BW11.state.showOfferings = true;
        g.banner('FOUR OFFERINGS', 'Root Society · Opulent Temple · Camp ? · Thunderdome', { col: '#ffd84a' });
      });
    }
  });
};

/* ---------------- Root Society: Blown Bass + the Heckle-Off ---------------- */
BW11.talkMycelium = function (g, a) {
  const st = g.missions.state('cable'), m = g.missions.get('cable');
  if (st === 'locked') { g.say(a, ['Welcome to the roots, friend. We\'re all connected underground. Like fungus. Like bass.', 'Except our bass is gone. The wind took it. Come back if you can help.']); return; }
  if (st === 'available') { g.say(a, ['Alkali sent you? She sends her regards, probably. Through the mycelium.', 'Our bass cable blew apart in the wind. Three pieces, scattered.', 'One went up the tree. One\'s on top of a speaker. Curt\'s tower ate the third. Find them, plug them in at the junction box.'], () => g.missions.start('cable')); return; }
  if (st === 'active') { g.say(a, m.n >= 3 ? ['You have all three! The junction box is on the stage, by the left speaker. PLUG IN!'] : [`${m.n} of 3 cables. The roots are patient. I am... mostly patient.`]); return; }
  g.say(a, ['Feel that? That\'s the earth humming back. You did that.']);
};
BW11.plugIn = function (g) {
  const S = BW11.state, a = g.actor('mycelium'), J = S.junction, RT = BW11.P.root;
  g.interactables = g.interactables.filter(it => it.label !== 'PLUG IN');
  S.bassOn = true;
  g.cutscene([
    { cam: { x: RT.x + 9, y: 4.5, z: RT.z + 22, tx: RT.x, ty: 3, tz: RT.z + 6, fov: 0.95 } },
    { do: g2 => { burnsSfx('man_stomp', { vol: 0.7 }); g2.shake(0.5); for (const c of S.rootCones) g2.fx.ring(c[0], c[1], c[2] + 0.4, 3, '#7aff5a', 0.6); g2.fx.confetti(RT.x, 6, RT.z + 12, 40); burnsSfx('crowd_cheer'); for (const c of S.rootCrowd || []) { const ac = g2.actors.find(x => x.def === c); if (ac) ac.setBehavior('dance'); } } },
    { wait: 1.2 },
    { say: [a || 'DJ MYCELIUM', ['THE BASS RETURNS! The roots are singing!', 'For Alkali, take this. A talisman carved from a root that fell in the 2019 windstorm.', 'It hums at forty hertz. Like a very small, very wise subwoofer.']] },
    { do: g2 => { BW11.give(g2, 'talisman'); g2.missions.complete('cable', { x: J.x + 1.5, y: J.y + 1.2, z: J.z + 1.5 }); } }
  ]);
};
BW11.HECKLES = [
  { line: 'Nice man bun. Did it come with the ticket, or was it an upgrade?', opts: ['My bun has seen the inside of a shower this decade. Can your kilt say that?', 'Uh... your FACE is a bun.', 'I\'m going through a breakup. With a giant wooden man. It\'s complicated.'], best: 0, react: ['OHHHHH!', '...what?', 'Awww. Wait, what?'] },
  { line: 'I\'ve been coming here since before you were born. We built this city uphill. Both ways.', opts: ['Cool story, grandpa.', 'Back then the event guide was a napkin. You still haven\'t finished reading it.', 'Was the Man shorter back then? Asking for my wife.'], best: 1, react: ['Boooo.', 'OHHHHHH! NAPKIN!', 'Huh?'] },
  { line: 'This music sounds like a fax machine falling down the stairs!', opts: ['Fax machines are vintage. You LOVE vintage.', '...Beep boop?', 'And your beer is so warm it\'s legally a soup.'], best: 2, react: ['Heh. Okay.', 'Crickets.', 'SOUP! SOUP! SOUP!'] }
];
BW11.talkCurt = function (g, a) {
  const st = g.missions.state('heckle');
  if (st === 'done') { g.say(a, ['Hah. Still can\'t believe a bun beat me. Back in my day, buns knew their place. On sandwiches.']); return; }
  g.say(a, ['BOOO! Play something with a BANJO!', 'What? You think you can heckle better than me, kid? I heckled the Man when he was twelve feet tall.', 'Heckle-off. Three rounds. The crowd decides.'], () => { g.missions.start('heckle', st === 'active'); BW11.heckleRound(g, a, 0, 0); });
};
BW11.heckleRound = function (g, a, i, wins) {
  const H = BW11.HECKLES[i];
  if (!H) {
    if (wins >= 2) g.say(a, ['...Alright, bun boy. You got me. The crowd has spoken and it said "not Curt."', 'Here. My event guide from 2004. Half the camps in it don\'t exist anymore. Neither do I, technically.'], () => { a.setBehavior('sit'); g.missions.complete('heckle', { x: a.x - 1.5, y: a.y + 1.4, z: a.z + 1 }); burnsSfx('crowd_cheer'); });
    else g.say(a, ['HAH! The crowd has spoken, and it said CURT!', 'Come back when you\'ve got material. And a real belt.']);
    return;
  }
  g.say(a, [`Round ${i + 1}: "${H.line}"`], () => {
    BW11.choice(g, { who: 'YOUR COMEBACK', prompt: `"${H.line}"`, options: H.opts, def: (H.best + 1) % 3, done(g2, k) {
      const win = k === H.best, crowd = g2.actors.filter(x => x.def.ambient && Math.hypot(x.x - a.x, x.z - a.z) < 18);
      const shout = crowd.length ? crowd[Math.floor(Math.random() * crowd.length)] : null;
      if (shout) shout.say(H.react[k], 2);
      if (win) { burnsSfx('crowd_cheer', { vol: 0.8 }); g2.fx.confetti(a.x, a.y + 2, a.z, 20); g2.toast(`ROUND ${i + 1}: BRADY!`); for (const c of crowd) c.ch.play('cheer'); }
      else { burnsSfx('crowd', { vol: 0.3 }); g2.toast(`ROUND ${i + 1}: CURT!`); }
      BW11.after(g2, 0.9, g3 => BW11.heckleRound(g3, a, i + 1, wins + (win ? 1 : 0)));
    } });
  });
};

/* ---------------- Opulent Temple: the Velvet Rope ---------------- */
BW11.talkSherpa = function (g, a) {
  const st = g.missions.state('vip');
  if (st === 'locked') { g.say(a, ['I\'m one of Mr. Turnkey\'s "sherpas." I built that riser. By hand. In a dust storm.', 'Don\'t tell him I talked to you. Don\'t tell him I talk at all.']); return; }
  if (st === 'available') { g.say(a, ['An offering for Alkali? Mr. Turnkey keeps a golden headphone jack up on the riser. He has nine. He won\'t miss one.', 'Security turns away anyone without a wristband. But the staff stairs are right behind me.', 'Watch their flashlights. If a beam lands on you, you\'re out. They stop to check their phones a lot.'], () => g.missions.start('vip')); return; }
  if (st === 'active') { g.say(a, ['Staff stairs, behind the riser. Stay out of the flashlight beams. Patience.']); return; }
  g.say(a, ['He GAVE it to you? Radical inclusion actually happened. Somebody write that down.']);
};
BW11.talkSterling = function (g, a) {
  if (g.missions.isDone('vip')) g.say(a, ['You again! My favorite rope-skipper. Want to hear about my startup? It\'s a startup for startups.']);
  else g.say(a, ['Welcome to my radically inclusive VIP!', 'The rope is symbolic. The security is not.']);
};
BW11.vipWin = function (g) {
  const a = g.actor('sterling'), V = BW11.P.vip;
  g.cutscene([
    { cam: { x: V.x - 4, y: 4.6, z: V.z + 5, tx: V.x + 1.5, ty: 3.6, tz: V.z - 1, fov: 0.9 } },
    { say: [a || 'STERLING TURNKEY', ['Hold on. You got past Brock, Brock AND Brock? Nobody gets past the Brocks.', 'That\'s... honestly a great growth mindset. Radically inclusive of you.', 'Here. A golden headphone jack. Bespoke. My sherpas mined the gold. Ethically. Mostly.']] },
    { do: g2 => BW11.give(g2, 'jack') },
    { say: ['brady', ['Thanks. Maybe pay your sherpas in something besides exposure.']] },
    { say: [a || 'STERLING TURNKEY', ['...Exposure is a currency.']] }
  ]);
};

/* ---------------- Camp ?: Lost & Sound ---------------- */
BW11.talkMaybe = function (g, a) {
  const st = g.missions.state('usb'), m = g.missions.get('usb');
  if (st === 'locked') { g.say(a, ['Who are you? Who am I? Is anyone truly a DJ, or are we all just pressing play?']); return; }
  if (st === 'available') { g.say(a, ['Have you seen a USB stick? It had my whole set on it.', 'A tech bro picked it up. He said he\'d "circle back." Will he? Does anyone?', 'He\'s fast, but he gets winded. Catch him, spin him, and the USB falls out of his fleece. Why are fleeces like that?'], () => g.missions.start('usb')); return; }
  if (st === 'active' && m.data.got) {
    g.say(a, ['MY USB! Is this... a tear? Is it dust? Why not both?', 'For Alkali: a glowing question-mark charm. Does it glow because of magic, or batteries? Yes.'], () => { BW11.give(g, 'charm'); g.missions.complete('usb', { x: a.x, y: a.y + 1.2, z: a.z + 2 }); });
    return;
  }
  if (st === 'active') { g.say(a, ['Is he still running? Are you faster? Can a question be an answer?']); return; }
  g.say(a, ['Why is the bass so good tonight? Why not?']);
};

/* ---------------- the Thunderdome ---------------- */
BW11.talkMC = function (g, a) {
  const st = g.missions.state('dome');
  if (st === 'locked') { g.say(a, ['THE DOME IS HUNGRY! But are YOU? Come back when you\'ve got a reason to bounce.']); return; }
  if (st === 'done') { g.say(a, ['OUR NEW CHAMPION! May your bounces be high and your bonks be soft!']); return; }
  const first = st === 'available';
  g.say(a, first ? ['WELCOME TO THE THUNDERDOME! Two bungees! Two foam bats! Zero real injuries! Legally!', 'You want the champion\'s skull buckle? Then strap in and bonk THE MOOPINATOR!', 'First to three bonks! JUMP to bounce and kick off the walls! ACTION to swing!'] : ['BACK FOR MORE?! The Moopinator is undefeated since Tuesday! STRAP IN!'], () => { if (first) g.missions.start('dome'); BW11.bout(g); });
};
BW11.bout = function (g) {
  const D = BW11.P.dome, champ = g.actor('moop'), insp = g.actors.find(x => x.def.name === 'HARNESS INSPECTOR');
  g.cutscene([
    { cam: { x: D.x - 9, y: 6, z: D.z + 9, tx: D.x, ty: 4, tz: D.z, fov: 0.95 } },
    { do: g2 => { g2.player.teleport(D.x - 3.2, 0, D.z + 1.5, Math.PI / 2); burnsSfx('crowd_cheer'); } },
    { say: [insp || 'HARNESS INSPECTOR', ['Harness tension: acceptable. Bat foam density: acceptable. Your vibe: concerning.']] },
    { say: [champ || 'THE MOOPINATOR', ['I remove MOOP. And you look like MOOP.']] },
    { say: ['brady', ['I am NOT matter out of place. I\'m matter in a hurry.']] }
  ], g2 => {
    BW11Dome.start(g2, { x: D.x, z: D.z, R: D.R, champ, name: 'THE MOOPINATOR', crowd: (BW11.state.domeFans || []).map(d => g2.actors.find(a => a.def === d)).filter(Boolean),
      onWin(g3) {
        g3.cutscene([
          { cam: { x: D.x + 7, y: 3.2, z: D.z + 7, tx: D.x, ty: 2, tz: D.z, fov: 0.95 } },
          { do: g4 => { burnsSfx('crowd_cheer'); g4.fx.confetti(D.x, 6, D.z, 60); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; g4.fx.firework(D.x + Math.sin(a) * 4, D.R + 4, D.z + Math.cos(a) * 4, BURNS_NEON[i]); } burnsSfx('firework_burst'); } },
          { say: [g3.actor('rattlebones') || 'MC RATTLEBONES', ['THE MOOPINATOR HAS BEEN BONKED! WE HAVE A NEW DOME CHAMPION!']] },
          { say: [champ || 'THE MOOPINATOR', ['Good bonk. Here. My skull buckle. It\'s heavier than it looks. Emotionally.']] },
          { do: g4 => { BW11.give(g4, 'buckle'); g4.missions.complete('dome', { x: D.x, y: 1.4, z: D.z + D.R - 5 }); } }
        ]);
      },
      onLose(g3) { g3.say(g3.actor('rattlebones') || 'MC RATTLEBONES', ['BONKED OUT! The dome has spoken!', 'Talk to me when you want a rematch. Stretch first.']); }
    });
  });
};

/* ---------------- the Ranger + darkwads ---------------- */
BW11.talkRanger = function (g, a) {
  const st = g.missions.state('darkwads');
  if (st === 'available' || st === 'locked') { g.say(a, ['Ranger Dale. I\'m not a cop. I\'m a volunteer with a very serious hat.', 'The shortcut across the playa is crawling with darkwads. Zero lights. Total menaces. They\'ll knock you clean off that bike.', 'Talk to one with three glow sticks and he\'ll let you stick EL wire on him. Light up four and I\'ll write you a commendation.'], () => g.missions.start('darkwads')); return; }
  if (st === 'active') { const m = g.missions.get('darkwads'); g.say(a, [`${m.n} of 4 darkwads illuminated. Your bike light is also five lumens too dim, but one thing at a time.`]); return; }
  g.say(a, ['Commendation filed. In triplicate. Laminated.', 'The sound camps are that way. The 2:00 side is past the art cars. Hydrate.']);
};

/* ---------------- the Wobble Dome: DJ Alkali + the headline set ---------------- */
BW11.talkAlkali = function (g, a) {
  const done = g.missions.isDone('set');
  if (done) { g.say(a, ['Play me another set sometime, bun boy. The crowd keeps asking.'], () => BW11.askEncore(g, a)); return; }
  if (!g.missions.isDone('quest')) {
    g.say(a, ['Who sent you? Nobody? Then nobody gets my decks.', 'The big wooden guy? I saw him. I\'ll tell you where he went... after you play me a set worth hearing.', 'But first: offerings. Root Society, Opulent Temple, Camp Question Mark, the Thunderdome. One from each.'], () => { g.missions.complete('quest'); BW11.state.showOfferings = true; g.banner('FOUR OFFERINGS', 'Root Society · Opulent Temple · Camp ? · Thunderdome', { col: '#ffd84a' }); });
    return;
  }
  const missing = BW11.ITEMS.filter(I => !BW11.has(I.id));
  if (missing.length) { g.say(a, ['Offerings. I need all four before you touch my decks.', 'Still missing: ' + missing.map(I => I.name.toLowerCase().replace(/(^|\s)\S/g, s => s.toUpperCase()) + ' (' + I.camp + ')').join(', ') + '.']); return; }
  const first = !g.missions.get('set').data.tried;
  g.say(a, first ? ['The talisman, for grounding. Gold, for the ears. The question mark, for mystery. And a skull, because crowds are brutal.', 'Fine. You get my decks for one set. Don\'t trainwreck my crowd.'] : ['Back for another run? The crowd is warmed up. Don\'t waste it.'], () => {
    if (g.missions.state('set') !== 'active') g.missions.start('set', true);
    g.missions.get('set').data.tried = true;
    BW11.headline(g);
  });
};
BW11.headline = function (g, encore) {
  const W = BW11.P.wob, WF = BW11.P.wobFloor, alk = g.actor('alkali'), mg = g.actor('margo');
  if (alk) { alk.x = W.x - 4.6; alk.z = W.z + 4.4; alk.yaw = 0.3; }
  if (mg) { mg.x = W.x + 5; mg.z = W.z + 6.4; }
  BurnsDJ.open(g, {
    title: encore ? 'Wobble Dome · Encore' : 'Wobble Dome · Headline Set', bpm: 126, genre: 'house', difficulty: 2, duration: 72,
    crowd: { x: WF.x, z: WF.z, r: 15 }, booth: { x: W.x, y: 1.6, z: W.z + 4.2, yaw: 0 }, exclude: ['alkali', 'margo'],
    quotes: { S: ['DJ Alkali just took off her visor. Nobody has ever seen her eyes.', 'The Wobble Dome is wobbling. Structurally. Call DPW.'], A: ['Alkali nods. Twice. That\'s basically a standing ovation.'], B: ['The Wobble Dome approves. The dust is dancing.'], C: ['Some people danced. Some people left for grilled cheese.'], D: ['The Wobble Dome... did not wobble.'] },
    onDone(r) { if (alk) { alk.x = W.x; alk.z = W.z + 4.2; alk.yaw = 0; } if (!encore) BW11.setDone(g, r); else if (r.grade === 'S') { g.addGlow(20); g.toast('ENCORE S! +20 GLOW STICKS'); } }
  });
};
BW11.askEncore = function (g, a) {
  BW11.choice(g, { who: 'DJ ALKALI', prompt: 'Play an encore set?', options: ['Drop the bass again', 'Not now'], def: 1, done(g2, i) { if (i === 0) BW11.headline(g2, true); } });
};
BW11.setDone = function (g, r) {
  const a = g.actor('alkali'), W = BW11.P.wob, p = g.player;
  const great = r.grade === 'S' || r.grade === 'A' || r.grade === 'B';
  if (!great) { g.say(a || 'DJ ALKALI', [`A ${r.grade}. The crowd's not quite there yet.`, 'Breathe. Hydrate. Talk to me when you want to run it back.']); return; }
  if (r.grade === 'S') { g.addGlow(25); g.toast('S-RANK SET! +25 GLOW STICKS'); }
  g.cutscene([
    { music: 'burns_victory' },
    { cam: { x: W.x + 6, y: 3.6, z: W.z + 13, tx: W.x, ty: 2.6, tz: W.z + 4, fov: 0.9 } },
    { do: g2 => { p.teleport(W.x + 1.4, 1.6, W.z + 6.4, Math.PI * 0.85); g2.fx.confetti(W.x, 7, W.z + 10, 70); burnsSfx('crowd_cheer'); } },
    { say: [a || 'DJ ALKALI', [r.grade === 'S' ? 'Okay, bun boy. THAT was a set. I took my visor off for that.' : 'Okay, bun boy. That was a SET.', 'Your wooden friend? He came through during my warm-up. Seven stories of pine, carrying a woman who was NOT having it.', 'He kept asking everyone where the heart-shaped sound car parks for sunrise. Then he stomped off toward deep playa.']] },
    { say: ['brady', ['The sunrise set. That\'s where he\'s taking her.', 'Hold on, Chinka. I\'m coming.']] },
    { say: [a || 'DJ ALKALI', ['Go. And next year, you open for me.']] },
    { do: g2 => { g2.missions.complete('set'); } },
    { wait: 1.2 }
  ], g2 => g2.finishWorld());
};

/* test / debug access (the build is one IIFE) */
try { if (window.BRADY_BURNS) { window.BRADY_BURNS.BW11 = BW11; window.BRADY_BURNS.BW11Dome = BW11Dome; } } catch (e) { /* ignore */ }
