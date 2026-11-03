/* ============================================================
   BRADY GOES TO BURNING MAN — World 17 side quests (the home world's job board).
   Three jobs belong to home and stay here:
     s_buttid    BUTT ID              timing minigame at the portrait studio → a censored playa ID (token)
     s_burn      THE CATHEDRAL BURNS  Friday night: sit at the perimeter, watch the Stick Cathedral burn (token)
     s_rootdrive THE ROOT DRIVE       catch the touring coliseum car and deliver the DJ's USB
   The other twelve happen around the city, so they live in Black Rock City now (42_burns_w17_e_city.js):
   the friends here at home tell Brady where to find them out there.
   ============================================================ */

/* decor for Brady's tipi: owned + shown flags (17:decor:<id> = true on, 'off' owned but hidden) */
BW17.decorOwned = id => BurnsSave.flag(17, 'decor:' + id) !== undefined;
BW17.decorOn = id => BurnsSave.flag(17, 'decor:' + id) === true;
BW17.giveDecor = function (g, id, quiet) {
  if (!BW17.decorOwned(id)) BurnsSave.flag(17, 'decor:' + id, true);
  BW17.syncDecor(g);
  if (!quiet) g.toast('NEW TIPI DECOR: ' + (BW17.DECOR[id] || id).toUpperCase());
};
BW17.DECOR = { flamingo: 'Lawn flamingo', pirate: 'Pirate flag', disco: 'Disco ball', heartflag: 'Heart flag', fairy: 'Fairy lights', skates: 'Granny\'s spare skates', idframe: 'Framed Butt ID' };
BW17.syncDecor = function (g) { const S = BW17.state; if (!S || !S.decor || S.g !== g) return; for (const id in S.decor) S.decor[id].visible = BW17.decorOn(id); };

/* quest givers offer what they have (one quest: describe + start; several: pick from a list) */
BW17.offer = function (g, a, ids, fallback) {
  const av = ids.filter(id => g.missions.state(id) === 'available');
  if (!av.length) { if (fallback) fallback(); return false; }
  const start = id => { const Q = BW17.QUEST[id]; g.say(a, Q.pitch, () => { if (Q.gate && !Q.gate(g, a)) return; g.missions.start(id); if (Q.onAccept) Q.onAccept(g, a); }); };
  if (av.length === 1) { start(av[0]); return true; }
  BW17.choose(g, { who: a.def.name, prompt: 'Got a minute? I\'ve got jobs.', options: av.map(id => g.missions.get(id).def.name).concat(['MAYBE LATER']), def: av.length,
    done: (g2, i) => { if (i < av.length) start(av[i]); else a.say('No rush. The playa\'s not going anywhere.', 2); } });
  return true;
};

/* ---------------- quest definitions (missions with side: true) ---------------- */
// pitch = what the giver says when you accept; gate(g, a) = extra condition at accept time
BW17.QUEST = {
  s_buttid: { pitch: ['Darling! A first-timer without a playa ID? Scandalous.', 'Step on the pink rug, turn around, and give me your best side. Your BEST side.', 'It\'s tasteful. There\'s a peach sticker. Very legal.'] },
  s_burn: { pitch: ['The Stick Cathedral burns TONIGHT. Out past Esplanade.', 'Get to the perimeter, sit down with everybody, and don\'t move till it falls.', 'I lit the fuses myself. Well. I helped. Mostly I held a clipboard.'] },
  s_rootdrive: { pitch: ['Code red. DJ Rhizome left her USB stick in the common dome, and the coliseum car already rolled out.', 'Grab the Root Drive, catch the car on its lap, hop aboard and hand it over.', 'No USB, no set. No set, no vibes. No vibes, I get yelled at.'] }
};

BW17.SIDE = [
  { id: 's_buttid', side: true, token: true, name: 'Butt ID', short: 'Pose for your playa ID (POSE on the rug)', type: 'custom', giver: 'snaps', start: 'manual', requires: ['arrive'],
    desc: 'A first-timer needs a playa ID. The portrait studio does them while you wait. From behind.', hint: 'Dust & Glamour Portrait Studio, Esplanade west', reward: [{ glow: 15 }, { text: 'A framed copy for your tipi' }],
    onComplete(g) { BW17.giveDecor(g, 'idframe'); } },
  { id: 's_burn', side: true, token: true, name: 'The Cathedral Burns', short: 'Sit at the burn perimeter', type: 'custom', giver: 'sparky', start: 'manual', requires: ['neighbors'],
    desc: 'Friday night the Stick Cathedral burns. Sit at the perimeter with everybody and watch.', hint: 'Friday night. The Stick Cathedral, out past Esplanade (east).', lockedDesc: 'Meet the neighbours first.', reward: [{ glow: 30 }] },
  { id: 's_rootdrive', side: true, name: 'The Root Drive', short: 'Grab the USB, catch and board the coliseum car', type: 'custom', giver: 'moss', start: 'manual', requires: ['arrive'],
    desc: 'DJ Rhizome left her USB stick in the common dome and the coliseum car is touring. Grab it, catch the car, hop aboard.', hint: 'The USB is in the common dome; the car laps the whole camp', reward: [{ glow: 30 }, { pack: { w17booch: 1 } }, { text: 'A lap on the coliseum' }],
    onUpdate(g, m) { BW17.rootDriveStep(g, m); } }
];

/* ---------------- per-quest mechanics ---------------- */
BW17.clearItems = function (g, ids) { if (!g.pack) return; for (const id of ids) { const n = g.pack.count(id); if (n) g.pack.take(id, n); } };
// THE ROOT DRIVE: once Brady has the USB, board the car while it's out on its lap
BW17.rootDriveStep = function (g, m) {
  const S = BW17.state, rs = S.rs;
  if (!rs || !rs.artCar || !g.pack || !g.pack.has('w17usb')) return;
  const V = rs.artCar;
  if (!m.data.sent && V.docked) { m.data.sent = true; try { BurnsCamps.undock(g, rs); } catch (e) { /* ignore */ } g.toast('THE CAR\'S ROLLING! CATCH IT!'); }
  if (V.boarded && !m.data.done) {
    m.data.done = true; g.pack.take('w17usb'); g.player.hold(null);
    const dj = rs.actors.map(d => g.actors.find(a => a.def === d)).find(a => a && a.def.name === 'DJ RHIZOME');
    if (dj) dj.say('MY ROOT DRIVE! You absolute legend!', 2.6);
    g.fx.confetti(g.player.x, g.player.y + 2, g.player.z, 40); burnsSfx('crowd_cheer');
    g.banner('SET SAVED!', 'Ride the lap, or hop off any time', { col: '#7aff5a' });
    g.missions.complete('s_rootdrive');
  }
};

/* ---------------- placing the side-quest people, props and prompts ---------------- */
BW17.buildSide = function (api, g) {
  const L = BW17.L, S = BW17.state;
  const I = it => api.interact(it);
  const act = id => g.actor(id);
  /* --- BUTT ID: Snaps at the portrait studio --- */
  api.npc({ id: 'snaps', name: 'SNAPS', type: 'burney', seed: 3, x: L.studio.camera[0], z: L.studio.camera[1], yaw: L.studioYaw + Math.PI,
    talk(g2, a) {
      const st = g2.missions.state('s_buttid');
      if (st === 'active') g2.say(a, ['On the pink rug, sweetheart. Then POSE.']);
      else if (st === 'done') g2.say(a, ['My finest work. They\'ll hang it in a museum. A small one. Behind a curtain.']);
      else BW17.offer(g2, a, ['s_buttid'], () => g2.say(a, ['Portraits! Glamour! Tasteful posterior documentation!']));
    } });
  I({ x: L.studio.stool[0], z: L.studio.stool[1], r: 1.9, label: 'POSE', when: g2 => g2.missions.state('s_buttid') === 'active', fn: g2 => {
    const p = g2.player; p.teleport(L.studio.stool[0], 0, L.studio.stool[1], L.studioYaw + Math.PI); p.animOverride = 'victory';
    BW17.minigame(g2, { kind: 'timing', title: 'BUTT ID', labels: ['TURN AROUND...', 'A LITTLE LOWER...', 'NOW: CHEEKY!'], rounds: 3, need: 2, zone: [0.4, 0.6], speed: 1.15,
      onPress(g3, st, hit) { if (hit) { g3.screenFlash('#ffffff', 0.35); burnsSfx('camera_flash', { vol: 0.6 }); } },
      done(g3, ok) {
        p.animOverride = null; const a = act('snaps');
        if (!ok) { if (a) a.say('Blurry! Again! Find your light!', 2.2); return; }
        g3.say(a, ['Gorgeous. Censored. Laminated.', 'Here\'s your playa ID. Show it with pride. Or at the post office.'], () => {
          if (g3.pack) g3.pack.add('w17buttid', 1, { quiet: true }); BW17.showCard(g3, 4.2); g3.missions.complete('s_buttid');
        });
      } });
  } });
  /* --- THE CATHEDRAL BURNS: the perimeter and the SIT spot --- */
  const pc = L.perimeter;
  I({ x: pc[0], z: pc[1], r: 2.4, label: 'SIT', when: g2 => g2.missions.state('s_burn') === 'active', fn: g2 => BW17.burnScene(g2) });
  for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.22, r = 31; api.npc({ type: ['burner', 'crusty', 'tutu', 'furcoat', 'greeter', 'ledsuit'][i % 6], seed: (i * 5) % 24, x: L.cathedral[0] + Math.sin(Math.PI + a) * r, z: L.cathedral[1] + Math.cos(Math.PI + a) * r, yaw: a, behavior: 'sit', chat: ['Tonight she burns.', 'I helped weave the west gallery.', 'Every burn is a little goodbye.'], ambient: true, bw17when: g2 => BW17.isNight() && BW17.storyAt(8) && g2.missions.state('s_burn') !== 'done' }); }
  /* --- THE ROOT DRIVE: Moss the stage manager, the USB in the common dome --- */
  api.pickup('pack:w17usb', L.commonDome[0] + 0.3, 1.25, L.commonDome[1] + 1.1, { mission: 's_rootdrive', gate: true, label: 'THE ROOT DRIVE', onTake(g2) { g2.player.hold('phone'); g2.banner('GOT THE ROOT DRIVE', 'Now catch the coliseum car!', { col: '#7aff5a' }); } });
  /* --- ground scores scattered round the district (cartoon baggies; they go in the backpack) --- */
  for (const [k, x, z, y] of L.baggies) api.pickup('bag:' + k, x, y || 0.9, z);
};

/* the Friday-night burn: Sparky counts it down, then the Big Art module's full Stick Cathedral burn plays
   (crowd ring, fire up the weave, a fire tornado, the collapse, the ember pile; it persists on later visits) */
BW17.burnScene = function (g) {
  const S = BW17.state, L = BW17.L, p = g.player, C = L.cathedral, pc = L.perimeter;
  if (S.burning) return; S.burning = true;
  p.teleport(pc[0], 0, pc[1], Math.atan2(C[0] - pc[0], C[1] - pc[1])); p.animOverride = 'sit';
  const sp = g.actor('sparky') || { name: 'SPARKY' };
  const finish = g2 => { S.burning = false; p.animOverride = null; g2.missions.complete('s_burn', { x: p.x, y: p.y + 1.3, z: p.z - 2 });
    g2.say('brady', ['That was the most beautiful thing I have ever seen.', 'Also I think my eyebrows are gone. Sparky, is this how it happened?']); };
  g.cutscene([
    { cam: { x: pc[0] - 4, y: 1.6, z: pc[1] - 5, tx: C[0], ty: 14, tz: C[1], fov: 0.95 } },
    { say: [sp, ['Everybody sit. Phones away. This is the good part.', 'Three... two... ONE!']] },
    { do: g2 => { p.animOverride = 'sit'; } }
  ], g2 => {
    if (typeof BurnsBigArt !== 'undefined' && S.cathedral) BurnsBigArt.burn(g2, S.cathedral, { music: 'burns_w17n', crowd: 20, onDone: g3 => finish(g3) });
    else { for (let i = 0; i < 6; i++) g2.addTempFire(C[0] + (Math.random() - 0.5) * 12, 0.5, C[1] + (Math.random() - 0.5) * 16, 2.5, 30); finish(g2); }
  });
};
