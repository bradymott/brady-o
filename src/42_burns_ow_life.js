/* ============================================================
   BRADY GOES TO BURNING MAN — Black Rock City life (world 500, part 2)
   City missions from people in the street, the Thunderdome bouts, the art-car race around the Man,
   the city-shaped travel map, and BurnsOW.addQuests(): how other worlds (World 17's side quests)
   put their quest givers and targets in the city.
   ============================================================ */

/* ---------------- addresses -> [x, z] ----------------
   '4:30 & Carousel' (or '4:30 & C'), '9:00 Plaza', a story place ('The Heart Car'), a theme camp ('The Deep End',
   its entrance), a named spot a quest pack added ('The Glide'), 'The Man', 'The Temple', 'Center Camp', or [x, z]. */
BURNS_OW.spots = {};
BURNS_OW.address = function (a) {
  const O = BURNS_OW;
  if (Array.isArray(a)) return a;
  const s = String(a || '').trim(), low = s.toLowerCase();
  if (O.spots[low]) return O.address(O.spots[low]);
  const P = O.PLACES.find(q => q.name.toLowerCase() === low || q.short.toLowerCase() === low);
  if (P) return [P.x, P.z];
  if (low === 'the man') return [0, 26];
  if (low === 'the temple') return [0, -222];
  if (low === 'center camp') return O.at(6, O.ESP + 4);
  const K = typeof BurnsCamps !== 'undefined' ? BurnsCamps.kinds : {};
  const C = O.CAMPS.find(c => K[c.kind] && (K[c.kind].name.toLowerCase() === low || (K[c.kind].short || '').toLowerCase() === low));
  if (C) { const b = O.state && O.state.camps && O.state.camps.find(c => c.kind === C.kind); return b && b.entrance ? [b.entrance.x, b.entrance.z] : O.at(C.h, C.r || O.ESP + 9 + C.front); }
  const pl = /^(\d{1,2})(?::(\d\d))?\s*plaza$/i.exec(s);
  if (pl) return O.at((+pl[1] % 12) + (+(pl[2] || 0)) / 60, O.RINGS[2]);
  const m = /^(\d{1,2})(?::(\d\d))?\s*&\s*([a-z]+)/i.exec(s);
  if (!m) { console.warn('burns: unknown address ' + s); return [0, O.ESP]; }
  const h = (+m[1] % 12 || 12) + (+(m[2] || 0)) / 60, street = m[3].toLowerCase();
  const k = O.STREETS.findIndex(n => n.toLowerCase() === street || n[0].toLowerCase() === street);
  const r = k < 0 ? O.ESP : O.RINGS[k] + (k === 0 ? 7 : 4);   // just on the city side of the street
  return O.at(h === 12 ? 0 : h, r);
};

/* ---------------- other worlds' quests in the city (World 17's side quests) ----------------
   BurnsOW.addQuests({ from: 17, spots, missions, people, pickups, build(api, g), update(g, dt), drawSprites(g, R),
                       drawHUD(ctx, g, W, H, S) })   (guide §19.6)
   Call it when your world file loads: every 42_burns_w* file loads after the city files. Mission ids must be unique
   in world 500: prefix them ('w17_...'). requires: [ids in world 500, or '17:arrive' for a mission done in world 17];
   unlock(g, m) can add a condition of your own (checked whenever missions refresh, and when Brady comes back to the city).
   spots: { 'The Glide': '3:30 & Carousel', ... } names you can then use in any address.
   people: { id, at: address | [x, z], type, seed, name, yaw, behavior, lines, quest: missionId, offer: [lines],
             thanks: [lines], talk(g, actor), when(g) }  ('quest' gives the standard offer/remind/thanks talk;
             when(g) false leaves them out of this visit)
   pickups: { kind ('glowstick' | 'water' | ...), at, y, mission, gate (default true), label, col }
   The missions run in world 500 (its pause menu's SIDE QUESTS). BurnsOW.questDone(id) is true once one is finished,
   anywhere in the game (save flag '500:q:<id>'); your def.onComplete still runs. */
BurnsOW.quests = [];
BurnsOW.addQuests = function (Q) {
  if (!Q) return;
  const D = BurnsWorlds.get(BURNS_OW.ID);
  for (const k in Q.spots || {}) BURNS_OW.spots[k.toLowerCase()] = Q.spots[k];
  for (const m of Q.missions || []) {
    if (!m || !m.id) continue;
    if (D.missions.find(x => x.id === m.id)) { console.warn('burns: city quest id taken ' + m.id); continue; }
    const done0 = m.onComplete;
    m.onComplete = function (g, mm, ...rest) { BurnsSave.flag(BURNS_OW.ID, 'q:' + m.id, true); if (done0) return done0.call(this, g, mm, ...rest); };
    if (m.side === undefined) m.side = true;
    if (m.side && m.token === undefined) m.token = false;
    D.missions.push(m);
  }
  BurnsOW.quests.push(Q);
};
BurnsOW.questDone = id => !!BurnsSave.flag(BURNS_OW.ID, 'q:' + id);
// a quest pack's own per-frame hooks (each guarded: one pack's bug never stops the city)
BurnsOW.questHook = function (name, ...args) { for (const Q of BurnsOW.quests) if (Q[name]) { try { Q[name](...args); } catch (e) { if (!Q._err) { Q._err = true; console.error('burns city quests ' + name, e); } } } };
// builds every registered quest pack into the city (called from the city's build)
BurnsOW.buildQuests = function (api, g) {
  for (const Q of BurnsOW.quests) {
    for (const p of Q.people || []) {
      if (p.when && !p.when(g)) continue;
      const at = BURNS_OW.address(p.at || p.x !== undefined && [p.x, p.z]);
      const d = Object.assign({ type: 'burner', seed: 3, behavior: 'idle' }, p, { x: at[0], z: at[1] });
      if (p.quest && !p.talk) d.talk = (gg, a) => BurnsOW.giver(gg, a, p.quest, p.offer || ['Can you help me?'], p.thanks || ['Thank you!']);
      delete d.at; delete d.quest; delete d.offer; delete d.thanks; delete d.when;
      api.npc(d);
    }
    for (const k of Q.pickups || []) { const at = BURNS_OW.address(k.at); api.pickup(k.kind || 'glowstick', at[0], k.y === undefined ? 0.9 : k.y, at[1], { mission: k.mission, gate: k.gate !== false, label: k.label, col: k.col }); }
    if (Q.build) { try { Q.build(api, g); } catch (e) { console.error('burns city quests', e); } }
  }
};

/* ---------------- backpack goods for the city ---------------- */
BurnsPack.define('icebag', { name: 'BAG OF ICE', desc: 'Melting fast. Someone at 8:00 & Dreamer needs it.', col: '#bfe8ff', icon: 'drop' });
BurnsPack.define('pancake', { name: 'PLAYA PANCAKE', desc: 'Still warm. USE: +1 hydration (it was made with love and a lot of water).', col: '#ffcf70', icon: 'heart', use(g) { g.player.givePower('water'); return true; } });
BurnsPack.define('grilledcheese', { name: 'GRILLED CHEESE', desc: 'The playa\'s currency of kindness. USE: +1 hydration.', col: '#ffb040', icon: 'heart', use(g) { g.player.givePower('water'); return true; } });

/* ---------------- the city missions ---------------- */
(function () {
  const O = BURNS_OW, at = a => O.address(a);
  const M = [
    { id: 'owIce', side: true, name: 'Cold Delivery', short: 'Take the ice to Melty', type: 'custom', giver: 'owFrosty', start: 'manual', desc: 'Frosty at Center Camp has a bag of ice for Melty at 8:00 & Dreamer. It will not stay a bag of ice forever.', hint: '8:00 & Dreamer', reward: [{ glow: 15 }, { pack: { pancake: 1 } }] },
    { id: 'owLost', side: true, name: 'Lost and Found', short: 'Find 3 lost things', type: 'collect', count: 3, giver: 'owLou', start: 'manual', desc: 'Lou runs Lost & Found at the 3:00 plaza. A fuzzy hat, a tutu and one single sock went missing around 3:00. Bring them in.', hint: 'Around 3:00 & Bonfire', reward: { costume: 'tutu', glow: 10 } },
    { id: 'owPhoto', side: true, name: 'Playa Paparazzi', short: 'Photograph 3 wonders', type: 'custom', giver: 'owFlash', start: 'manual', desc: 'Flash needs three photos for the zine: the Man, the Landlocked Galleon and the Retro Rocket. Stand close and press ACTION.', hint: 'The Man, the galleon (1:00), the rocket (2:30)', reward: { glow: 25 } },
    { id: 'owDome', side: true, name: 'Dome Raising', short: 'Bring 4 dome struts', type: 'collect', count: 4, giver: 'owBolt', start: 'manual', desc: 'Bolt\'s camp at 7:00 & Bonfire is one dome short. Four struts blew away in the wind. Find them nearby.', hint: 'Near 7:00 & Bonfire', reward: [{ pack: { grilledcheese: 2 } }, { glow: 10 }] },
    { id: 'owNell', side: true, name: 'First Burn', short: 'Walk Nell home', type: 'escort', companion: 'owNell', giver: 'owNell', start: 'manual', target: { x: 0, z: 0, r: 7 }, desc: 'Nell is a first-timer and very lost. Her camp is at 2:30 & Firefly. Walk her home (she follows you).', hint: '2:30 & Firefly', reward: { glow: 20 } },
    { id: 'owThief', side: true, name: 'Stop, Bike Thief!', short: 'Catch the bike thief', type: 'defeat', tag: 'owBikeThief', count: 1, giver: 'owRudy', start: 'manual', desc: 'Someone rode off on Rudy\'s bike. Rudy saw them heading out toward 5:00 & Ember. Catch them (a spin will do).', hint: 'Toward 5:00 & Ember', reward: [{ glow: 20 }, { pack: { water: 1 } }] },
    { id: 'owRace', side: true, name: 'Round the Man', short: 'Race the art car around the Man', type: 'custom', giver: 'owRae', start: 'manual', desc: 'Drive the green art car through every glowing gate around the Man in under 1:40. Talk to Rae to try again any time.', hint: 'The art car by the 6:00 promenade', reward: { glow: 30 } },
    { id: 'owDome2', side: true, name: 'Two Burners Enter', short: 'Win a Thunderdome bout', type: 'custom', giver: 'owAuntie', start: 'manual', desc: 'Auntie Thunder runs the bouts at the 9:00 plaza: bungee harness, foam bat, first to three bonks. Rematches any time.', hint: 'The Thunderdome, 9:00 & Bonfire', reward: { glow: 30 } }
  ];
  const D = BurnsWorlds.get(O.ID);
  for (const m of M) if (!D.missions.find(x => x.id === m.id)) D.missions.push(m);
  const tgt = D.missions.find(m => m.id === 'owNell'); if (tgt) { const p = at('2:30 & Firefly'); tgt.target = { x: p[0], z: p[1], r: 9 }; }
})();

/* ---------------- builders for the city's people, things and mini-games ---------------- */
BurnsOW.buildLife = function (api, g) {
  const O = BURNS_OW, S = O.state, at = a => O.address(a);
  const npc = (id, a, o) => { const p = at(a); return api.npc(Object.assign({ id, x: p[0] + (o.dx || 0), z: p[1] + (o.dz || 0), behavior: 'idle' }, o)); };
  // Frosty (ice) at Center Camp, Melty waiting at 8:00 & Dreamer
  npc('owFrosty', '6:00 & Esplanade', { dx: 14, dz: -18, type: 'burner', seed: 31, name: 'FROSTY', talk: (gg, a) => {
    const st = gg.missions.state('owIce');
    if (st === 'available') gg.say(a, ['Ice! Ice for the people!', 'Melty at 8:00 & Dreamer ordered this an hour ago. Run!'], () => { if (gg.missions.start('owIce')) { gg.missions.track('owIce'); gg.pack.add('icebag'); gg.toast('GOT: BAG OF ICE'); } });
    else gg.say(a, [st === 'done' ? 'You are a legend of refrigeration.' : 'Go go go, it\'s melting!']);
  } });
  npc('owMelty', '8:00 & Dreamer', { type: 'furcoat', seed: 2, name: 'MELTY', behavior: 'chill', talk: (gg, a) => {
    if (gg.missions.state('owIce') === 'active' && gg.pack.has('icebag')) gg.say(a, ['Is that... ICE?', 'I have been wearing this fur coat for six hours. You saved my life.'], () => { gg.pack.take('icebag'); gg.missions.complete('owIce', { x: a.x, y: a.y + 1, z: a.z }); });
    else gg.say(a, ['So. Hot. Is anyone bringing ice?']);
  } });
  // Lost & Found: Lou + three lost things (pickups that only appear while the mission runs)
  npc('owLou', '3:00 & Bonfire', { dx: -8, dz: 22, type: 'burner', seed: 11, name: 'LOU', talk: (gg, a) => BurnsOW.giver(gg, a, 'owLost', ['Lost & Found! Mostly Found, honestly.', 'A fuzzy hat, a tutu and one single sock went missing around here. Find them?'], ['Reunited! Here, take the tutu, nobody claimed it.']) });
  { const c = at('3:00 & Bonfire'); api.sign('LOST &\nFOUND', c[0] - 12, c[1] + 26, { yaw: Math.PI, h: 1.6, style: { bg: '#2a1a0a', fg: '#ffd84a', border: '#ff9a2a' } });
    // the lost things lie in the streets around 3:00 (never inside someone's camp)
    [['FUZZY HAT', 3.25, O.RINGS[3] + 1.5], ['TUTU', 2.5 + 0.012, O.RINGS[1] + 32], ['ONE SOCK', 3.5 - 0.012, O.RINGS[2] + 20]].forEach(([label, h, r]) => { const p = O.at(h, r); api.pickup('glowstick', p[0], 0.9, p[1], { mission: 'owLost', gate: true, label, col: '#ff9ad0' }); }); }
  // Flash the photographer
  npc('owFlash', '4:30 & Esplanade', { dx: -10, dz: -10, type: 'burney', seed: 1, name: 'FLASH', behavior: 'idle', talk: (gg, a) => BurnsOW.giver(gg, a, 'owPhoto', ['I make a zine. Paper! Like it\'s 1997!', 'I need three photos: the Man, the Landlocked Galleon and the Retro Rocket.'], ['Gorgeous. You have the eye.']) });
  S.photos = [{ id: 'man', x: 0, z: 30, label: 'PHOTO: THE MAN' }, { id: 'galleon', x: O.at(1.0, 405)[0], z: O.at(1.0, 405)[1], label: 'PHOTO: THE GALLEON' }, { id: 'rocket', x: O.at(2.6, 185)[0], z: O.at(2.6, 185)[1], label: 'PHOTO: THE ROCKET' }];
  for (const P of S.photos) api.interact({ x: P.x, z: P.z, r: 6, label: P.label, when: gg => gg.missions.state('owPhoto') === 'active' && !BurnsSave.flag(O.ID, 'photo:' + P.id), fn: gg => BurnsOW.takePhoto(gg, P) });
  // Bolt's dome (raised when the four struts are in)
  npc('owBolt', '7:00 & Bonfire', { dx: 6, type: 'dpw', seed: 4, name: 'BOLT', talk: (gg, a) => BurnsOW.giver(gg, a, 'owDome', ['We had five domes. Now we have four domes and a pile of feelings.', 'Four struts blew off toward the open playa side. Grab them?'], ['DOME. RAISED. Grilled cheese for everyone!']) });
  // the struts blew into the streets (Arcade and the 7:00 radial)
  for (const [h, r] of [[6.72, O.RINGS[1] + 1], [6.88, O.RINGS[1] - 1.5], [7.01, O.RINGS[1] + 17], [6.988, O.RINGS[1] + 33]]) { const p = O.at(h, r); api.pickup('glowstick', p[0], 0.9, p[1], { mission: 'owDome', gate: true, label: 'DOME STRUT', col: '#d8dce4' }); }
  // Nell, the lost first-timer (follows Brady once asked)
  npc('owNell', '3:00 & Esplanade', { dx: 6, dz: 10, type: 'sparklepony', seed: 6, name: 'NELL', followDist: 2.4, talk: (gg, a) => {
    const st = gg.missions.state('owNell');
    if (st === 'available') gg.say(a, ['Hi! First Burn! I am SO lost.', 'My camp is at 2:30 & Firefly. Is that... far?'], () => { if (gg.missions.start('owNell')) { gg.missions.track('owNell'); a.setBehavior('follow'); } });
    else gg.say(a, [st === 'done' ? 'HOME! You are my favorite person on Earth.' : 'Lead the way! I\'ll follow you!']);
  } });
  // Rudy (bike stolen) and the thief out at 5:00 & Ember
  npc('owRudy', '5:30 & Carousel', { type: 'burner', seed: 17, name: 'RUDY', talk: (gg, a) => {
    const st = gg.missions.state('owThief');
    if (st === 'available') gg.say(a, ['My bike! Somebody just rode off on my bike!', 'Toward 5:00 & Ember. Pink streamers. Catch them!'], () => { if (gg.missions.start('owThief')) { gg.missions.track('owThief'); BurnsOW.spawnThief(gg); } });
    else gg.say(a, [st === 'done' ? 'My bike! I love it more than ever.' : 'Pink streamers! Toward 5:00 & Ember!']);
  } });
  // Rae starts the art-car race; Auntie Thunder runs the bouts
  npc('owRae', '6:00 & Esplanade', { dx: -16, dz: -56, type: 'ledsuit', seed: 4, name: 'RACER RAE', talk: (gg, a) => BurnsOW.raceTalk(gg, a) });
  { const T = S.camps.find(c => c.kind === 'thunderdome'); const p = T && T.entrance ? [T.entrance.x, T.entrance.z] : at('9:00 & Bonfire');
    api.npc({ id: 'owAuntie', x: p[0] + 3, z: p[1] + 2, type: 'burner', seed: 23, name: 'AUNTIE THUNDER', behavior: 'idle', talk: (gg, a) => BurnsOW.boutTalk(gg, a) }); }
  // the race gates around the Man
  S.gates = []; for (let k = 0; k < 10; k++) { const a = (6 - k * 1.2) * Math.PI / 6; S.gates.push({ x: Math.sin(a) * 165, z: -Math.cos(a) * 165 }); }
  // crowds: people dancing on the camps' floors and hanging out on the Esplanade (instanced, a few shared poses)
  BurnsOW.buildCrowds(api, g);
};

BurnsOW.buildCrowds = function (api, g) {
  const O = BURNS_OW, S = O.state, rng = mulberry32(905);
  api.extras([O.PEOPLE[0], O.PEOPLE[3], O.PEOPLE[5], O.PEOPLE[7]]);   // four looks (burner, fur coat, tutu, LED suit), a few shared poses each
  const ring = (x, z, r0, r1, n, anim, faceX, faceZ) => { for (let i = 0; i < n; i++) { const a = rng() * TAU, r = r0 + Math.sqrt(rng()) * (r1 - r0), px = x + Math.sin(a) * r, pz = z + Math.cos(a) * r; api.extra(px, pz, { yaw: Math.atan2((faceX === undefined ? x : faceX) - px, (faceZ === undefined ? z : faceZ) - pz) + (rng() - 0.5) * 0.6, anim, look: Math.floor(rng() * 4), phase: [0, 0.41][Math.floor(rng() * 2)] }); } };
  // the camps' dance floors
  for (const C of S.camps) for (const st of C.stages || []) if (st.floor && !st.vehicle) ring(st.floor.x, st.floor.z, 1.5, Math.max(4, (st.floor.r || 6) * 0.9), Math.min(34, Math.round((st.floor.r || 6) * 3.2)), 'dance', st.booth ? st.booth.x : undefined, st.booth ? st.booth.z : undefined);
  // the Man's base and the Esplanade
  ring(0, 0, 19, 26, 26, 'cheer', 0, 0);
  for (let h = O.H0 + 0.15; h < O.H1; h += 0.42) { const q = O.at(h, O.ESP - 3); ring(q[0], q[1], 0.5, 4, 4, rng() < 0.5 ? 'dance' : 'idle'); }
};

/* ---------------- missions at runtime ---------------- */
BurnsOW.takePhoto = function (g, P) {
  BurnsSave.flag(BURNS_OW.ID, 'photo:' + P.id, true);
  g.screenFlash('#ffffff', 0.9); burnsSfx('pick', { vol: 0.7 });
  const n = BURNS_OW.state.photos.filter(q => BurnsSave.flag(BURNS_OW.ID, 'photo:' + q.id)).length;
  g.toast(`SNAP! ${n}/3`);
  if (n >= 3) g.missions.complete('owPhoto', { x: g.player.x, y: g.player.y + 1, z: g.player.z });
};
// the bike thief runs from Brady (a little slower than his sprint) but never leaves the neighbourhood
BurnsBehaviors.register('owFlee', {
  init(a) { a.data.t = 0; },
  update(a, g, dt) {
    const p = g.player, H = a.home, dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz) || 1;
    a.data.t -= dt;
    if (d < 15) {
      let tx = a.x + dx / d * 8, tz = a.z + dz / d * 8;
      if (Math.hypot(a.x - H.x, a.z - H.z) > (a.def.radius || 28)) { tx = lerp(tx, H.x, 0.65); tz = lerp(tz, H.z, 0.65); }
      a.moveTo(tx, tz, a.def.speed || 4.4, dt, 0.2); a.ch.play('run', { rate: 1.1 });
      if (a.data.t <= 0) { a.data.t = 3 + Math.random() * 3; a.say(['Finders keepers!', 'It was UNLOCKED!', 'Radical self-reliance!', 'Gifting economy, man!'][Math.floor(Math.random() * 4)], 1.8); }
    } else { const t = g.time * 0.4 + a.def.seed; a.moveTo(H.x + Math.sin(t) * 6, H.z + Math.cos(t) * 6, 1.4, dt, 0.5); a.ch.play('walk'); }
    a.physics(dt);
  }
});
BurnsOW.spawnThief = function (g) {
  if (g.actor('owBikeThief')) return;
  const p = BURNS_OW.address('5:00 & Ember');
  const a = g.spawnActor({ id: 'owBikeThief', type: 'burner', seed: 9, name: 'BIKE THIEF', x: p[0], z: p[1], friendly: false, tag: 'owBikeThief', hp: 1, behavior: 'owFlee', speed: 4.4, radius: 28, drop: 3, defeatLine: 'Okay okay! I thought it was a free bike!', lines: ['Never!'] });
  a.def.tag = 'owBikeThief';
  if (g.fx) g.fx.confetti(p[0], 2, p[1], 12);
};
// the art-car race: drive through every gate around the Man; the clock starts at the first gate
BurnsOW.raceTalk = function (g, a) {
  const R = BURNS_OW.state.race;
  if (R && R.on) { g.say(a, ['GO GO GO! Follow the gates!']); return; }
  g.say(a, ['Wanna race the art car around the Man?', 'Every gate, under a minute forty. Hop in the green one and drive through the first gate!'], () => {
    if (g.missions.state('owRace') === 'available') { g.missions.start('owRace'); g.missions.track('owRace'); }
    BURNS_OW.state.race = { on: true, next: 0, t: 0, started: false };
    g.banner('ROUND THE MAN', 'Drive the art car through the glowing gates', { col: '#7aff5a', small: true });
  });
};
// Thunderdome: a bungee bout with the dome's own fighter (World 11's BW11Dome: bounce, kick off the lattice, first to
// three bonks). Repeatable. If World 11's code isn't in the build, three foam-bat rounds on the floor instead.
BurnsOW.boutTalk = function (g, a) {
  const B = BURNS_OW.state.bout, wins = BurnsSave.flag(BURNS_OW.ID, 'domeWins') | 0;
  if ((B && B.on) || BurnsOW.bungeeOn(g)) { g.say(a, ['Two burners enter! Get in there!']); return; }
  g.say(a, wins ? ['Back for more, champ? The dome remembers you.', 'Same rules: bungee up, foam bat, first to three bonks.'] : ['Welcome to the THUNDERDOME, sweetie.', 'Two burners enter, two burners leave. Bungee harness, foam bat, first to three bonks.', 'JUMP to bounce, kick off the lattice, ACTION to swing.'], () => {
    if (g.missions.state('owDome2') === 'available') { g.missions.start('owDome2'); g.missions.track('owDome2'); }
    const Rc = BURNS_OW.state.race; if (Rc && Rc.on) Rc.on = false;   // one mini-game at a time
    if (BurnsOW.bungee(g, a)) return;
    BURNS_OW.state.bout = { on: true, round: 0, t: 1.5, foe: null };
    g.banner('THUNDERDOME', 'Three rounds. Spin to bonk!', { col: '#ff9a2a', small: true });
  });
};
BurnsOW.bungeeOn = g => typeof BW11Dome !== 'undefined' && BW11Dome.active && BW11Dome.g === g;
BurnsOW.bungeeGame = () => typeof BW11Dome !== 'undefined' ? BW11Dome : null;   // (tests and tools)
BurnsOW.bungee = function (g, auntie) {
  if (typeof BW11Dome === 'undefined' || typeof BW11 === 'undefined' || !BW11.after || !BW11.tick || !BW11.beam) return false;
  const S = BURNS_OW.state, T = S.camps.find(c => c.kind === 'thunderdome');
  if (!T || !T.spots || !T.spots.arena || !T.spots.apex) return false;
  // the camp keeps its people as defs (api.npc): find the live actors
  const act = d => d ? (d.def ? d : g.actors.find(x => x.def === d) || null) : null;
  const c = T.spots.arena, R = Math.max(8, T.spots.apex.y - c.y), F = T.fighters || [], champ = act(F[0]), other = act(F[1]);
  const mc = act((T.actors || []).find(x => (x.def || x).name === 'THE MC')), en = T.entrance || { x: c.x, z: c.z + R };
  BW11.state = { timers: [], cityBout: true };   // World 11's game-time timers; the city ticks them while the bout runs
  const keep = champ ? { beh: champ.behName, x: champ.x, y: champ.y, z: champ.z, yaw: champ.yaw } : null;
  if (other) other.hidden = true;
  const back = () => {
    if (champ && keep) { champ.setBehavior(keep.beh || 'idle'); champ.x = keep.x; champ.y = keep.y; champ.z = keep.z; champ.yaw = keep.yaw; }
    if (other) other.hidden = false;
    if (BW11.state && BW11.state.cityBout) BW11.state.cityBout = false;
  };
  const dx = en.x - c.x, dz = en.z - c.z, dl = Math.hypot(dx, dz) || 1;
  g.cutscene([
    { cam: { x: c.x + dx / dl * (R - 1.5) + 3, y: c.y + 4.5, z: c.z + dz / dl * (R - 1.5), tx: c.x, ty: c.y + 3.2, tz: c.z, fov: 0.95 } },
    { do: g2 => { burnsSfx('crowd_cheer'); g2.player.teleport(c.x - 3.2, c.y, c.z + 1.5, Math.PI / 2); } },
    { say: [mc || 'THE MC', ['TWO BURNERS ENTER! ONE BURNER LEAVES SLIGHTLY MORE BONKED!', `In this corner: ${champ ? champ.def.name : 'THE CHAMPION'}! In the other: some guy named BRADY!`]] }
  ], g2 => {
    BW11Dome.start(g2, { x: c.x, z: c.z, R, champ, name: champ ? champ.def.name : 'THE DOME CHAMPION', crowd: (T.spectators || []).map(act).filter(x => x && !x.removed),
      onWin(g3) {
        back(); BurnsSave.flag(BURNS_OW.ID, 'domeWins', (BurnsSave.flag(BURNS_OW.ID, 'domeWins') | 0) + 1);
        g3.fx.confetti(c.x, c.y + 6, c.z, 60); burnsSfx('crowd_cheer', { vol: 0.8 });
        if (g3.missions.state('owDome2') === 'active') g3.missions.complete('owDome2', { x: c.x, y: c.y + 1.4, z: c.z + R - 5 });
        else { g3.glow += 10; g3.toast('+10 GLOW · DOME CHAMPION AGAIN'); }
        if (mc) mc.say('WE HAVE A NEW DOME CHAMPION!', 3);
      },
      onLose(g3) { back(); g3.say(auntie || mc || 'AUNTIE THUNDER', ['BONKED OUT, sweetie! The dome has spoken.', 'Talk to me when you want a rematch. Stretch first.']); }
    });
  });
  return true;
};
BurnsOW.updateGames = function (g, dt) {
  const O = BURNS_OW, S = O.state, p = g.player;
  if (typeof BW11 !== 'undefined' && BW11.state && BW11.state.cityBout && BW11.tick) BW11.tick(g, dt);
  // race
  const R = S.race;
  if (R && R.on) {
    const G = S.gates[R.next], inCar = p.vehicle && p.vehicle.kind === 'car';
    if (R.started) R.t += dt;
    if (G && inCar && Math.hypot(p.x - G.x, p.z - G.z) < 10) {
      if (!R.started) { R.started = true; R.t = 0; burnsSfx('select'); g.toast('GO!'); }
      else burnsSfx('pick', { vol: 0.6 });
      R.next++;
      if (R.next >= S.gates.length) {   // back at the first gate: finish
        R.on = false; const best = BurnsSave.flag(O.ID, 'raceBest'), t = Math.round(R.t * 10) / 10;
        if (!best || t < best) BurnsSave.flag(O.ID, 'raceBest', t);
        g.banner(t <= 100 ? 'FINISH!' : 'TOO SLOW', `${t.toFixed(1)} s${best ? ' (best ' + Math.min(best, t).toFixed(1) + ' s)' : ''}`, { col: t <= 100 ? '#7aff5a' : '#ff9a2a' });
        if (t <= 100 && g.missions.state('owRace') === 'active') g.missions.complete('owRace', { x: p.x, y: p.y + 2, z: p.z });
        else if (t <= 100) { g.glow += 5; g.toast('+5 GLOW'); }
      }
    }
    // out of the car for a while, or wandered off before the start: the race is off
    R.out = inCar ? 0 : (R.out || 0) + dt;
    if ((R.started && (R.t > 240 || R.out > 8)) || (!R.started && R.out > 60)) { R.on = false; g.toast('RACE OVER: talk to Rae to try again'); }
  }
  // Thunderdome bout (defeated challengers bow out after a moment)
  const B = S.bout;
  if (B && B.gone) { for (const q of B.gone) { q.t -= dt; if (q.t <= 0 && !q.a.removed) g.removeActor(q.a); } B.gone = B.gone.filter(q => q.t > 0); }
  if (B && B.on) {
    const T = S.camps.find(c => c.kind === 'thunderdome'), c = T && T.spots && T.spots.arena ? T.spots.arena : { x: 0, z: 0 };
    if (p.dead || g.faintT > 0) { B.on = false; if (B.foe && !B.foe.removed) g.removeActor(B.foe); g.toast('KNOCKED OUT! Talk to Auntie for a rematch'); return; }
    if (!B.foe || B.foe.defeated || B.foe.removed) {
      if (B.foe && B.foe.defeated) { B.round++; B.t = 2.2; B.gone = (B.gone || []).concat([{ a: B.foe, t: 1.8 }]); B.foe = null; g.fx.confetti(c.x, 3, c.z, 30); burnsSfx('crowd_cheer', { vol: 0.6 }); if (B.round < 3) g.toast(`ROUND ${B.round + 1}!`); }
      if (B.round >= 3) { B.on = false; g.banner('CHAMPION OF THE DOME', 'Two burners entered. You hugged it out.', { col: '#ffd84a' }); if (g.missions.state('owDome2') === 'active') g.missions.complete('owDome2', { x: p.x, y: p.y + 2, z: p.z }); else { g.glow += 10; g.toast('+10 GLOW'); } return; }
      B.t -= dt;
      if (B.t <= 0 && !B.foe) {
        const k = B.round, a = (k * 2.1) % TAU;
        B.foe = g.spawnActor({ id: 'owFoe' + k + '_' + Math.floor(g.time), type: ['burner', 'furcoat', 'ledsuit'][k % 3], seed: 7 + k, name: ['PILLOW PETE', 'FOAM FIONA', 'BIG BEN BONK'][k], x: c.x + Math.sin(a) * 4, z: c.z + Math.cos(a) * 4, friendly: false, hp: 2 + k, behavior: 'charger', drop: 2, defeatLine: ['I yield! Nice spin!', 'Okay, ow. Respect.', 'The dome has spoken!'][k] });
      }
    }
  }
};

/* ---------------- HUD for the mini-games ---------------- */
BurnsOW.drawGamesHUD = function (ctx, g, W, H, S) {
  const O = BURNS_OW, R = O.state.race, B = O.state.bout;
  if (R && R.on) {
    BurnsUI.text(ctx, R.started ? `${R.t.toFixed(1)} s` : 'DRIVE THROUGH THE FIRST GATE', W / 2, (g.topStack || 60) + 18, R.started ? 22 : 13, '#7aff5a', { glow: '#2a8a4a' });
    BurnsUI.text(ctx, `GATE ${Math.min(R.next + 1, O.state.gates.length)}/${O.state.gates.length}`, W / 2, (g.topStack || 60) + 40, 11, '#ffffff', { ui: true });
  }
  if (B && B.on) BurnsUI.text(ctx, `THUNDERDOME  ROUND ${Math.min(3, B.round + 1)}/3`, W / 2, (g.topStack || 60) + 18, 15, '#ffb060', { glow: '#ff5a1a' });
  if (BurnsOW.bungeeOn(g)) BW11Dome.hud(ctx, g, g.lastFdt || 0.016);
};
BurnsOW.drawGamesSkinned = function (g, R) { if (BurnsOW.bungeeOn(g)) BW11Dome.drawSkinned(g, R); };
// gates: glowing rings on the ground and posts of light
BurnsOW.drawGames = function (g, R) {
  if (BurnsOW.bungeeOn(g)) BW11Dome.drawSprites(g, R);
  const O = BURNS_OW, Rc = O.state.race, SP = BURNS_SPRITES.R; if (!Rc || !Rc.on) return;
  const t = g.time;
  O.state.gates.forEach((G, i) => {
    const next = i === Rc.next, done = i < Rc.next, col = done ? [0.4, 0.4, 0.5] : next ? [0.5, 1, 0.5] : [1, 0.85, 0.35];
    R.flat.flat(G.x, 0.08, G.z, 18, 18, t * 0.5, SP.ring, col, next ? 0.9 : 0.4, true);
    for (const s of [-1, 1]) { const a = Math.atan2(G.x, -G.z) + Math.PI / 2, px = G.x + Math.sin(a) * 9 * s, pz = G.z - Math.cos(a) * 9 * s; R.bbs.bb(px, 3, pz, 1.4, 6, SP.beam, col, next ? 0.9 : 0.35, true); }
  });
};

/* ---------------- the travel map: the real city ---------------- */
BurnsOW.mapFit = function (M) {
  const B = { x0: -920, x1: 920, z0: -920, z1: 1060 }, sc = Math.min(M.w / (B.x1 - B.x0), M.h / (B.z1 - B.z0)) * 0.98;
  const ox = M.x + M.w / 2 - (B.x0 + B.x1) / 2 * sc, oz = M.y + M.h / 2 - (B.z0 + B.z1) / 2 * sc;
  return { sc, P: (x, z) => [ox + x * sc, oz + z * sc] };
};
BurnsWorlds.get(BURNS_OW.ID).mapProject = function (g, w, M) {
  const P = BURNS_OW.PLACES.find(q => q.world === w); if (!P) return null;
  const F = BurnsOW.mapFit(M), q = F.P(P.x, P.z); return { x: q[0], y: q[1] };
};
BurnsWorlds.get(BURNS_OW.ID).mapDraw = function (g, ctx, M, t) {
  const O = BURNS_OW, F = BurnsOW.mapFit(M), P = F.P, sc = F.sc;
  ctx.save();
  // the trash fence
  ctx.strokeStyle = 'rgba(255,140,60,0.7)'; ctx.lineWidth = 2; ctx.beginPath();
  for (let k = 0; k <= 5; k++) { const a = k * TAU / 5, q = P(Math.sin(a) * O.FENCE, -Math.cos(a) * O.FENCE); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke();
  // the city: the Esplanade and the lettered streets, radial streets every half hour
  const cx = P(0, 0), arcA = h => h * Math.PI / 6 - Math.PI / 2 + Math.PI;   // clock hour -> canvas angle (6:00 down)
  O.RINGS.forEach((r, i) => { ctx.strokeStyle = i ? 'rgba(255,220,180,0.4)' : 'rgba(255,230,190,0.85)'; ctx.lineWidth = i ? 1.2 : 2.4; ctx.beginPath(); ctx.arc(cx[0], cx[1], r * sc, arcA(O.H0), arcA(O.H1)); ctx.stroke(); });
  for (let h = O.H0; h <= O.H1 + 1e-6; h += 0.5) { const a = O.at(h, O.ESP), b = O.at(h, O.OUTER), qa = P(a[0], a[1]), qb = P(b[0], b[1]); ctx.strokeStyle = h % 1 ? 'rgba(255,220,180,0.25)' : 'rgba(255,220,180,0.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(qa[0], qa[1]); ctx.lineTo(qb[0], qb[1]); ctx.stroke(); }
  // camps glow along the Esplanade, the streamed blocks as soft dots
  for (const b of O.blocks()) { if (b.reserved) continue; const q = P(b.cx, b.cz); ctx.fillStyle = BURNS_NEON[(b.k * 3 + Math.round(b.h * 2)) % 7]; ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 2 + b.cx); ctx.fillRect(q[0] - 2, q[1] - 2, 4, 4); }
  ctx.globalAlpha = 1;
  for (const C of O.CAMPS) { const p = O.at(C.h, C.r || O.ESP + 9 + C.front), q = P(p[0], p[1]); ctx.fillStyle = '#ff4fd8'; ctx.beginPath(); ctx.arc(q[0], q[1], 3.2, 0, TAU); ctx.fill(); }
  // Gate Road, the Man, the Temple
  { const a = P(0, O.OUTER), b = P(0, O.FENCE_IN + 420); ctx.strokeStyle = 'rgba(255,230,200,0.5)'; ctx.lineWidth = 3; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
  if (typeof burnsDrawMan2D === 'function') burnsDrawMan2D(ctx, cx[0], cx[1] + 4, Math.min(0.2, M.h / 1400), t, true);
  { const q = P(0, -250); ctx.fillStyle = '#ffd8a0'; ctx.beginPath(); ctx.moveTo(q[0], q[1] - 7); ctx.lineTo(q[0] + 6, q[1] + 4); ctx.lineTo(q[0] - 6, q[1] + 4); ctx.closePath(); ctx.fill(); }
  // Brady, here and now
  const p = g.player; if (p) { const q = P(p.x, p.z); ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#ff4fd8'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], 4.5 + Math.sin(t * 5) * 1.2, 0, TAU); ctx.fill(); ctx.stroke(); BurnsUI.text(ctx, 'YOU', q[0], q[1] - 12, 10, '#ffffff', { ui: true }); }
  ctx.restore();
};

if (typeof window !== 'undefined') window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsOWLife: true });
