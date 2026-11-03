/* ============================================================
   BRADY GOES TO BURNING MAN — World 15 "EXODUS": cops, the sky, the HUD
   Speed traps, the checkpoint and the KEEP IT TOGETHER minigame
   (hold the lane, keep a legal speed, tap STEADY on the beat while
   the trip peaks), cartoon chases (hide in dust, behind trucks, in
   the line), the Undercover Cop's tail, the melting sky, and the 2D
   overlay (trip meter, speedometer, minigame, talking-sign bubbles).
   All police are our own generic designs.
   ============================================================ */

const BW15C = {
  /* ---------------- cop cars (movers driven by a tiny AI) ---------------- */
  makeCop(api, o) {
    const mv = api.mover(m => o.kind === 'unmarked' ? BW15M.unmarked(m) : BW15M.patrolCar(m), {});
    const cop = { id: o.id, kind: o.kind || 'patrol', mv, x: o.x, z: o.z, y: 0, yaw: o.yaw || 0, v: 0, state: 'park', home: { x: o.x, z: o.z, yaw: o.yaw || 0 }, lights: !!o.lights, lightsT: 0, siren: 0 };
    mv.x = o.x; mv.z = o.z; mv.yaw = cop.yaw; mv.y = api.height(o.x, o.z); cop.y = mv.y;
    return cop;
  },
  driveCop(g, cop, tx, tz, speed, dt) {
    const W = g.world;
    const want = Math.atan2(tx - cop.x, tz - cop.z), err = BurnsM.wrap(want - cop.yaw);
    cop.yaw = BurnsM.wrap(cop.yaw + clamp(err, -1, 1) * Math.min(1.6, 0.6 + Math.abs(cop.v) * 0.12) * dt * 2.2);
    cop.v = approach(cop.v, speed * Math.max(0.25, Math.cos(err)), (speed > cop.v ? 9 : 14) * dt);
    cop.x += Math.sin(cop.yaw) * cop.v * dt; cop.z += Math.cos(cop.yaw) * cop.v * dt;
    const e = { x: cop.x, z: cop.z }; if (W.push(e, 1.2, cop.y - 0.2, 1.6, 0.4, cop.mv)) { cop.x = e.x; cop.z = e.z; cop.v *= 0.9; }
  },
  syncCop(g, cop, dt) {
    const W = g.world, mv = cop.mv, fx = Math.sin(cop.yaw), fz = Math.cos(cop.yaw);
    cop.y = W.height(cop.x, cop.z);
    const S = BW15.state; if (S && S.ribbon.amp > 0.01) { const pr = BW15_ROAD.project(cop.x, cop.z, cop.rs, cop._pr || (cop._pr = {})); cop.rs = pr.s; if (pr.d < 5) cop.y += BW15D.ripple(S, pr.s); }
    mv.x = cop.x; mv.z = cop.z; mv.y = cop.y; mv.yaw = cop.yaw;
    mv.pitch = -Math.atan((W.height(cop.x + fx * 2, cop.z + fz * 2) - W.height(cop.x - fx * 2, cop.z - fz * 2)) / 4);
    // light bar: flash red/blue when active, dark otherwise
    cop.lightsT += dt;
    const L = mv.lights;
    if (cop.kind === 'patrol' && L.length >= 2) {
      const on = cop.lights, ph = Math.floor(cop.lightsT * 6) % 2;
      L[0].cc = on ? (ph ? [1, 0.12, 0.18] : [0.25, 0.03, 0.05]) : [0, 0, 0];
      L[1].cc = on ? (ph ? [0.08, 0.15, 0.4] : [0.15, 0.3, 1]) : [0, 0, 0];
      if (on && Math.random() < dt * 4) g.pointLight(cop.x, cop.y + 2.2, cop.z, 10, ph ? [1, 0.15, 0.2] : [0.2, 0.35, 1], 1.4);
    } else if (cop.kind === 'unmarked' && L.length) L[0].cc = cop.lights && Math.floor(cop.lightsT * 5) % 2 ? [1, 0.1, 0.12] : [0, 0, 0];
  },
  /* ---------------- per-step: traps, checkpoint, chase, tail ---------------- */
  update(g, S, dt) {
    const rv = S.rv;
    S.trip.peak = approach(S.trip.peak, S.enc ? 1 : (S.chase ? 0.5 : 0), dt * 0.9);
    // hiding (dust devils, steam, the dust bowl, trucks, the line, our own dust plume)
    BW15C.updateHide(g, S, dt);
    // speed traps + the checkpoint start KEEP IT TOGETHER
    if (!S.enc && !S.chase && !g.cine && !S.ending) {
      for (const T of S.traps) {
        if (T.done) continue;
        if (S.onRoad && S.s > T.s - T.pre && S.s < T.s - T.pre + 18 && S.v > 0.5) { BW15C.startEnc(g, S, T); break; }
      }
    }
    // going around the checkpoint off-road gets you noticed
    if (!S.enc && !S.chase && !g.cine && !S.ending) { const T = S.traps.find(q => q.kind === 'check' && !q.done); if (T && S.s > T.s - 12 && S.s < T.s + 24 && Math.abs(S.lat) > 6.5 && Math.abs(S.lat) < 70) { T.done = true; g.toast('YOU SKIPPED THE CHECKPOINT!'); if (T.officer) T.officer.say('HEY! The checkpoint is THIS way!', 2.4); BW15C.startChase(g, S, T.cop, 'skip'); } }
    if (S.enc) BW15C.updateEnc(g, S, dt);
    if (S.chase) BW15C.updateChase(g, S, dt);
    // the undercover cop's tail
    if (!S.tail && !S.tailDone && !S.chase && !S.enc && S.s > BW15.S.tailStart && S.s < BW15.S.welcome - 60 && S.onRoad && !g.cine) BW15C.startTail(g, S);
    if (S.tail) BW15C.updateTail(g, S, dt);
    // parked cops idle at their posts, returning cops head home
    for (const cop of S.cops) {
      if (cop.state === 'return') {
        const d = Math.hypot(cop.home.x - cop.x, cop.home.z - cop.z), far = Math.hypot(cop.x - rv.x, cop.z - rv.z);
        if (d < 3 || far > 120) { cop.x = cop.home.x; cop.z = cop.home.z; cop.yaw = cop.home.yaw; cop.v = 0; cop.state = 'park'; cop.lights = !!cop.homeLights; }
        else BW15C.driveCop(g, cop, cop.home.x, cop.home.z, 12, dt);
      }
      BW15C.syncCop(g, cop, dt);
      if (cop.officer && cop.state === 'park') { const a = cop.officer; if (a.behName !== 'idle' && a.behName !== 'bw15Walker') a.setBehavior('idle'); }
    }
  },
  /* ---------------- KEEP IT TOGETHER ---------------- */
  startEnc(g, S, T) {
    const check = T.kind === 'check';
    S.enc = { T, kind: T.kind, t: 0, dur: check ? 11 : 7.5, susp: clamp(S.trip.level * 0.22, 0, 0.3), beat: 0.62, next: 1.1, beats: [], hits: 0, miss: 0, steady: 0, msg: null, msgT: 0, band: check ? [0, 4.6] : [8.5, 20.2], laneLat: -BW15.LANE_W / 2, warnT: 0, honks: 0 };
    T.active = true;
    const cop = T.cop;
    burnsSfx('kartCountdown', { vol: 0.6 }, 'select');
    g.banner('KEEP IT TOGETHER', check ? 'Crawl through · stay in your lane · tap STEADY on the beat' : 'Speed limit 45 · stay in your lane · tap STEADY on the beat', { col: '#ff4fd8', big: true, dur: 2.2 });
    BW15D.quip(g, 'enc' + T.kind, check ? ['Checkpoint. Okay. Be cool. BE COOL.', 'Act natural, babe. Like a normal guy. In a normal RV.'] : ['Cop! Cop on the shoulder! Be normal!', 'Radar! Hands at ten and two! Eyes... somewhere!'], true);
    if (T.officer) { T.officer.say(check ? 'Evening. Morning? Slow it down, folks.' : '...', 2.5); }
    if (cop) cop.watch = true;
  },
  encTap(g, S) {
    const E = S.enc; if (!E) return;
    // find the nearest unjudged beat
    const t = E.t; let best = null, bd = 0.24;
    for (const b of E.beats) { if (b.res) continue; const d = Math.abs(b.t - t); if (d < bd) { bd = d; best = b; } }
    if (!best) { E.susp += 0.06; E.msg = 'OFF BEAT'; E.msgT = 0.5; burnsSfx('bump', { vol: 0.3 }); return; }
    const perfect = bd < 0.09;
    best.res = perfect ? 'PERFECT' : 'GOOD'; E.hits++;
    E.susp = Math.max(0, E.susp - (perfect ? 0.1 : 0.06)); E.steady = Math.min(1, E.steady + (perfect ? 0.45 : 0.3));
    E.msg = perfect ? 'STEADY!' : 'GOOD'; E.msgT = 0.45;
    burnsSfx(perfect ? 'gold' : 'pick', { vol: 0.45, pitch: perfect ? 1.2 : 1 });
  },
  encHonk(g, S) { const E = S.enc; if (!E) return; E.susp += 0.14; E.honks++; E.msg = 'WHY ARE YOU HONKING?!'; E.msgT = 1; },
  updateEnc(g, S, dt) {
    const E = S.enc;
    E.t += dt; if (E.msgT > 0) E.msgT -= dt;
    E.steady = Math.max(0, E.steady - dt * 0.55);
    // schedule beats ahead of time so the ring can shrink onto them
    while (E.next < E.dur - 0.5) { E.beats.push({ t: E.next, res: null }); E.next += E.beat; }
    if (Math.floor(E.t / E.beat) !== Math.floor((E.t - dt) / E.beat)) burnsSfx('kick', { vol: 0.45 }, '');
    for (const b of E.beats) if (!b.res && E.t - b.t > 0.24) { b.res = 'MISS'; E.miss++; E.susp += 0.085; E.msg = 'WOBBLE!'; E.msgT = 0.4; }
    // lane + speed
    const lane = E.kind === 'check' ? -BW15.LANE_W / 2 : (S.lat > 0 ? BW15.LANE_W / 2 : -BW15.LANE_W / 2);
    const out = Math.abs(S.lat - lane) > 1.35 || !S.onRoad;
    const slow = S.v < E.band[0] - 0.3, fast = S.v > E.band[1] + 0.3;
    E.outLane = out; E.fast = fast; E.slow = slow && E.kind !== 'check';
    if (out) E.susp += dt * 0.3;
    if (fast) E.susp += dt * (E.kind === 'check' ? 0.55 : 0.32);
    if (E.slow) E.susp += dt * 0.12;
    if (!out && !fast && !E.slow) E.susp = Math.max(0, E.susp - dt * 0.035);
    if (E.kind === 'check' && S.v > 9) E.susp = 1.01;   // blowing through a checkpoint
    if ((out || fast) && E.warnT <= 0) { E.warnT = 1.4; g.toast(out ? 'STAY IN YOUR LANE!' : E.kind === 'check' ? 'CRAWL! UNDER 10!' : 'SLOW DOWN! LIMIT 45!'); } else if (E.warnT > 0) E.warnT -= dt;
    const T = E.T;
    if (T.officer && E.kind === 'check') { const rv = S.rv, a = T.officer; a.data.tx = rv.x + Math.cos(rv.yaw) * -2.6 + Math.sin(rv.yaw) * 1; a.data.tz = rv.z - Math.sin(rv.yaw) * -2.6 + Math.cos(rv.yaw) * 1; if (a.behName !== 'bw15Giver') a.setBehavior('bw15Giver'); if (Math.random() < dt * 0.35) a.say(['License? Registration? ...Glitter?', 'Where you folks headed?', 'Is that RV... sparkling?', 'You seem very... focused.', 'Any loose glitter in the vehicle?'][Math.floor(Math.random() * 5)], 2.4); }
    if (E.susp >= 1) { BW15C.endEnc(g, S, false); return; }
    if (E.t >= E.dur && (E.kind !== 'check' || S.s > T.s + 6)) BW15C.endEnc(g, S, true);
    else if (E.kind === 'check' && E.t > E.dur + 14) BW15C.endEnc(g, S, E.susp < 1);
  },
  endEnc(g, S, ok) {
    const E = S.enc, T = E.T; S.enc = null; T.active = false; T.done = true;
    if (T.officer && T.officer.behName === 'bw15Giver') { T.officer.data.tx = T.officer.home.x; T.officer.data.tz = T.officer.home.z; BW15D.later(g, 3, () => { if (T.officer.behName === 'bw15Giver') T.officer.setBehavior('idle'); }); }
    if (ok) {
      burnsSfx('secret'); g.banner('KEPT IT TOGETHER', E.kind === 'check' ? 'Waved through. Smooth.' : 'The radar shrugged. Smooth.', { col: '#7aff5a', small: true });
      if (T.officer) T.officer.say(['Drive safe, folks.', 'Have a good one. Hydrate.', 'Carry on. ...Nice stickers.'][Math.floor(Math.random() * 3)], 2.6);
      BW15D.quip(g, 'encok', ['Nailed it. NAILED it.', 'Smoothest man alive.', 'I was so calm. Was I calm? I was calm.'], true);
      if (E.kind === 'check' && !g.missions.isDone('together')) g.missions.complete('together');
    } else {
      burnsSfx('buzzkill', null, 'powerdown');
      g.banner('BUSTED... ALMOST', 'Lights! Sirens! Lose them: dust clouds · behind trucks · in the line', { col: '#ff4a6a', big: true, dur: 2.6 });
      if (T.officer) T.officer.say('PULL OVER! ...Is that RV glowing?!', 2.6);
      BW15C.startChase(g, S, T.cop, E.kind);
    }
  },
  /* ---------------- chases ---------------- */
  startChase(g, S, cop, why) {
    if (!cop) return;
    S.chase = { cop, t: 0, lock: 1, close: 0, why, lostT: 0, delay: 1.3 };
    cop.state = 'chase'; cop.lights = true; cop.v = 0;
    const T = S.traps.find(q => q.cop === cop); if (T && T.officer) T.officer.say('Hold on! My coffee! ...PULL OVER!', 2.4);
    if (S.tail) S.tail.paused = true;
    burnsMusic('burns_w15_chase', 'burns_w8');
  },
  updateChase(g, S, dt) {
    const C = S.chase, cop = C.cop, rv = S.rv;
    C.t += dt;
    if (C.delay > 0) { C.delay -= dt; return; }   // he spilled his coffee: a head start
    const dx = rv.x - cop.x, dz = rv.z - cop.z, d = Math.hypot(dx, dz);
    const sees = d < 16 || BW15C.sees(g, S, cop, d);   // nobody hides from a cop that's right on them
    if (sees) { C.lock = Math.min(1, C.lock + dt * 0.45); C.lx = rv.x; C.lz = rv.z; }
    else C.lock -= dt * (S.hideRate || 0.3) * (C.t < 2.5 ? 0.35 : 1);
    C.sees = sees;
    // pursue: aim a little ahead of the RV
    const lead = clamp(d / 25, 0, 1.2), tx = rv.x + Math.sin(rv.yaw) * S.v * lead, tz = rv.z + Math.cos(rv.yaw) * S.v * lead;
    // a patrol car is quick on the road and hopeless off it
    const cpr = BW15_ROAD.project(cop.x, cop.z, cop.rs, cop._pr || (cop._pr = {})); cop.rs = cpr.s;
    const top = cpr.d < 7 ? 25.5 : 13.5;
    if (C.lock > 0.15) BW15C.driveCop(g, cop, tx, tz, clamp(Math.max(S.v + (d - 9) * 0.7, 8), 0, top), dt);
    else BW15C.driveCop(g, cop, C.lx || tx, C.lz || tz, 7, dt);
    if (Math.random() < dt * 1.2) burnsSfx('siren', { vol: 0.35 }, 'laser');
    if (d < 7.5 && C.lock > 0.5) C.close += dt; else C.close = Math.max(0, C.close - dt * 0.6);
    if (Math.random() < dt * 0.25) BW15D.quip(g, 'chase', ['Dust! Drive into the dust!', 'Get behind that truck, babe!', 'Off-road! Kick up a cloud!', 'Merge into the traffic! Blend in!'], false);
    if (C.close > 2.2) { BW15C.busted(g, S, cop); return; }
    if (C.lock <= 0 || C.t > 70) BW15C.escaped(g, S);
  },
  escaped(g, S) {
    const C = S.chase; S.chase = null;
    C.cop.state = 'return'; C.cop.lights = false;
    burnsSfx('secret'); g.banner('LOST \'EM!', C.t > 70 ? 'Their shift ended. Nice.' : 'Hidden in plain sight.', { col: '#7aff5a', big: true, dur: 2 });
    BW15D.quip(g, 'escaped', ['We\'re ghosts, babe. Glittery ghosts.', 'Woo! Nobody saw nothing!'], true);
    burnsMusic('burns_w15', 'burns_w7');
    if (S.tail) S.tail.paused = false;
  },
  busted(g, S, cop) {
    const rv = S.rv; S.chase = null; S.enc = null;
    if (S.tail) { S.tail.cop.state = 'return'; S.tail = null; }
    burnsSfx('buzzkill', null, 'powerdown');
    const copM = { name: 'OFFICER', model: BurnsRig.model(BW15_CAST.who('cop', 4).spec) };
    const ch = S.chinka;
    S.scripted = { v: 0, acc: 12 };
    cop.v = 0; cop.lights = true;
    const c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    g.cutscene([
      { do: g2 => { burnsMusic('burns_w15', 'burns_w7'); } },
      { cam: { x: rv.x + c * 7 - s * 6, y: rv.y + 5, z: rv.z - s * 7 - c * 6, tx: rv.x, ty: rv.y + 3, tz: rv.z, fov: 0.95 } },
      { banner: ['BUSTED!', '(kinda)', { col: '#ff4a6a', big: true, dur: 2.4 }] },
      { say: [copM, ['Sir. Do you know why I pulled you over?']] },
      { say: ['brady', ['...Because my RV has wings?']] },
      { say: [copM, ['Your RV has WHAT?']] },
      { say: [ch || { name: 'CHINKA', model: BurnsRig.model(BurnsRig.chinkaSpec()) }, ['He\'s just really, REALLY tired, officer. Six days of dust.']] },
      { say: [copM, ['Uh-huh. Here\'s a pamphlet about hydration. Go back to your last camp flag and try that again. Slowly.']] },
      { fade: 'out', dur: 0.5 },
      { do: g2 => { BW15C.retry(g2, S); } },
      { fade: 'in', dur: 0.6 },
      { banner: ['TRY AGAIN', 'Keep it together this time!', { col: '#ffe24a', small: true }] }
    ], () => { S.scripted = null; });
  },
  // back to the last camp flag; reset cops and encounters after it
  retry(g, S) {
    const cpId = BurnsSave.get().checkpoint[15];
    const cp = S.cps.find(c => c.id === cpId) || S.cps[0];
    BW15C.resetAfter(g, S, cp ? cp.s : 0);
    if (cp && cp.s > 5) { const a = BW15_ROAD.at(cp.s, -BW15.LANE_W / 2, {}); BW15D.placeRV(g, S, { x: a.x, z: a.z, yaw: a.yaw }); }
    else BW15D.placeRV(g, S, { x: BW15.LANES[BW15.PLAYER_LANE], z: BW15.SPAWN_Z, yaw: 0 });
    S.scripted = null; S.enc = null; S.chase = null;
  },
  resetAfter(g, S, s0) {
    for (const T of S.traps) if (T.s > s0) { T.done = false; T.active = false; }
    for (const cop of S.cops) { cop.x = cop.home.x; cop.z = cop.home.z; cop.yaw = cop.home.yaw; cop.v = 0; cop.state = 'park'; cop.lights = !!cop.homeLights; cop.watch = false; }
    if (S.tail) S.tail = null;
    if (s0 < BW15.S.tailStart) { S.tailDone = false; const m = g.missions.get('undercover'); if (m && m.state === 'active') m.state = 'available'; }
  },
  /* ---------------- the Undercover Cop ---------------- */
  startTail(g, S) {
    const cop = S.undercover; if (!cop) return;
    S.tail = { cop, lock: 1, t: 0, paused: false };
    cop.state = 'tail';
    const st = g.missions.state('undercover');
    if (st === 'available') g.missions.start('undercover');
    g.banner('SOMEBODY\'S FOLLOWING US', 'A beige convertible. A jester hat. Very undercover.', { col: '#ffb020', big: true, dur: 2.6 });
    BW15D.quip(g, 'tail', ['Babe. Don\'t look. That guy in the jester hat is a cop.', 'He\'s pretending to be a burner. Badly. Lose him!'], true);
    if (S.ucDriver) S.ucDriver.say('Groovy...', 2);
  },
  updateTail(g, S, dt) {
    const T = S.tail, cop = T.cop, rv = S.rv;
    T.t += dt;
    if (T.paused) { BW15C.driveCop(g, cop, cop.x + Math.sin(cop.yaw) * 5, cop.z + Math.cos(cop.yaw) * 5, 0, dt); return; }
    const dx = rv.x - cop.x, dz = rv.z - cop.z, d = Math.hypot(dx, dz);
    const sees = (d < 10 && S.hideK < 0.5) || BW15C.sees(g, S, cop, d);
    if (sees) T.lock = Math.min(1, T.lock + dt * 0.12); else T.lock -= dt * (S.hideRate || 0.3);
    T.sees = sees;
    // follow ~16 m behind along the road; he won't take his convertible off-road
    let tx, tz;
    if (S.onRoad) { const a = BW15_ROAD.at(S.s - 16, S.lat, {}); tx = a.x; tz = a.z; }
    else { const pr = BW15_ROAD.project(cop.x, cop.z, cop.rs, {}); const a = BW15_ROAD.at(pr.s + 4, -1.85, {}); tx = a.x; tz = a.z; }
    const dist = Math.hypot(tx - cop.x, tz - cop.z);
    BW15C.driveCop(g, cop, tx, tz, S.onRoad ? clamp(S.v + (dist - 2) * 0.6, 0, 22.5) : (dist > 4 ? 6 : 0), dt);
    if (S.ucDriver && Math.random() < dt * 0.2) S.ucDriver.say(['Groovy.', 'Just a normal burner, driving normally.', 'Far out. Very far out.', 'Nice... ground score you\'ve got.'][Math.floor(Math.random() * 4)], 2);
    if (T.lock <= 0) {
      S.tail = null; S.tailDone = true; cop.state = 'return';
      burnsSfx('secret'); g.banner('SHOOK THE UNDERCOVER COP', 'He\'s asking a cactus if it\'s seen a unicorn.', { col: '#7aff5a', big: true });
      if (S.ucDriver) S.ucDriver.say('Where\'d the party barge go? ...Groovy.', 3);
      if (g.missions.state('undercover') === 'active') g.missions.complete('undercover');
      BW15D.quip(g, 'shook', ['Bye, jester hat!', 'He\'s gone. We\'re free. Pancakes await.'], true);
      return;
    }
    if (S.s > BW15.S.welcome - 20) {
      S.tail = null; S.tailDone = true; cop.state = 'return';
      g.banner('HE GOT BORED', 'The jester hat turned around. Groovy.', { col: '#ffb020', small: true });
      const m = g.missions.get('undercover'); if (m && m.state === 'active') m.state = 'available';
    }
  },
  /* ---------------- line of sight + hiding ---------------- */
  sees(g, S, cop, d) {
    if (d > 75) return false;
    if (S.hideK > 0.5) return false;
    // blending into dense traffic only works if he isn't already right on you
    if (S.dense >= 3 && d > 14) { S.hideWhy = 'IN THE LINE'; return false; }
    const rv = S.rv, len = Math.max(0.1, d);
    const t = g.world.raycast(cop.x, cop.y + 1.4, cop.z, rv.x, rv.y + 2.2, rv.z, true);
    if (t * len < len - 6.2) { S.hideWhy = 'BEHIND A TRUCK'; return false; }
    return true;
  },
  updateHide(g, S, dt) {
    const rv = S.rv;
    let k = 0, why = '', rate = 0.3;
    for (const D of S.devils) { if (Math.hypot(D.x - rv.x, D.z - rv.z) < D.r) { k = 1; why = 'DUST DEVIL'; rate = 0.42; } }
    for (const Z of S.zones) { if (Math.hypot(Z.x - rv.x, Z.z - rv.z) < Z.r) { k = 1; why = Z.why; rate = Math.max(rate, Z.rate || 0.45); } }
    if (!k && S.zone === 'off' && Math.abs(S.v) > 9) { k = 0.6; why = 'DUST CLOUD'; rate = 0.26; }
    // how much traffic is around (used to blend into the line)
    let n = 0;
    if (S.hwy) for (const lane of S.hwy.lanes) for (const car of lane.cars) { const dx = car.mv.x - rv.x, dz = car.mv.z - rv.z; if (dx * dx + dz * dz < 144) n++; }
    S.dense = n;
    S.hideK = k; S.hideWhy = why; S.hideRate = k ? rate : 0.32;
  },
  /* ---------------- sky + atmosphere (per frame) ---------------- */
  env(g, env) {
    const S = BW15.state; if (!S) return;
    if (!S.envHooked || S.envObj !== env) {
      // drive the renderer's built-in trip shader from our own trip meter (this scene only)
      let eng = 0; const E = env;
      try { Object.defineProperty(E, 'trip', { configurable: true, enumerable: true, get() { const s2 = BW15.state; return Math.max(eng, s2 ? s2.tripShader || 0 : 0); }, set(v) { eng = v || 0; } }); } catch (e) { /* ignore */ }
      S.envHooked = true; S.envObj = env;
    }
    const tv = BW15D.tripVis(S), t = g.time, rv = S.rv;
    S.tripShader = tv > 0.02 && !S.ending ? clamp(0.05 + tv * 0.34 + S.trip.peak * 0.22, 0, 0.72) : 0;
    // dust: the line, the dust bowl, devils
    let dust = S.zone === 'line' ? 0.004 : 0;
    for (const Z of S.zones) if (Z.fog) { const d = Math.hypot(Z.x - rv.x, Z.z - rv.z); if (d < Z.r + 20) dust = Math.max(dust, Z.fog * BurnsM.smoothstep(Z.r + 20, Z.r * 0.4, d)); }
    for (const D of S.devils) { const d = Math.hypot(D.x - rv.x, D.z - rv.z); if (d < D.r + 6) dust = Math.max(dust, 0.02 * BurnsM.smoothstep(D.r + 6, D.r * 0.5, d)); }
    if (dust > 0) { env.fogD += dust; env.haze = Math.min(1, env.haze + dust * 20); }
    if (tv <= 0.01 || S.ending) return;
    const h = t * 22, k = clamp(tv, 0, 1);
    const tmp = S._ec || (S._ec = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    env.zen = bw15Mix3(env.zen, bw15HslF(h + 220, 0.75, 0.42, tmp[0]), k * 0.7);
    env.hor = bw15Mix3(env.hor, bw15HslF(h + 320, 0.85, 0.66, tmp[1]), k * 0.6);
    env.mid = bw15HslF(h + 40, 0.9, 0.62, tmp[2]); env.midK = Math.max(env.midK, k * 0.75);
    env.clouds = Math.max(env.clouds, 0.25 + k * 0.5); env.cloudCol = bw15HslF(h + 140, 0.8, 0.75, tmp[3]); env.cloudSpeed = 0.015 + k * 0.07; env.cloudScale = 0.55 + k * 0.5;
    env.mtnH *= 1 + k * 0.5 * (0.5 + 0.5 * Math.sin(t * 1.15));
    env.mtnCol = bw15Mix3(env.mtnCol, bw15HslF(h + 260, 0.6, 0.4, tmp[4]), k * 0.55);
    env.fogCol = bw15Mix3(env.fogCol, bw15HslF(h + 20, 0.55, 0.72, [0, 0, 0]), k * 0.3);
    env.emB = env.emB + k * 0.4;
  },
  /* ---------------- extra sprites: dust devils, steam, cop glows ---------------- */
  sprites(g, R) {
    const S = BW15.state; if (!S) return;
    const SP = BURNS_SPRITES.R, t = g.time, cam = g.cam;
    for (const D of S.devils) {
      const dx = D.x - cam.x, dz = D.z - cam.z; if (dx * dx + dz * dz > 160 * 160) continue;
      const y0 = g.world.height(D.x, D.z);
      for (let i = 0; i < 9; i++) { const a = t * 2.2 + i * 0.7, r = D.r * (0.35 + i * 0.06), y = y0 + 1 + i * 1.6; R.bbs.bb(D.x + Math.cos(a) * r * 0.6, y, D.z + Math.sin(a) * r * 0.6, r * 1.3, r * 1.3, SP.puff, [0.86, 0.74, 0.6], 0.32, false, a); }
    }
    for (const Z of S.zones) if (Z.steam) {
      const dx = Z.x - cam.x, dz = Z.z - cam.z; if (dx * dx + dz * dz > 140 * 140) continue;
      if (Math.random() < 0.5) { const a = Math.random() * TAU, r = Math.random() * Z.r * 0.8; g.fx.add(Z.x + Math.cos(a) * r, Z.y + 0.3, Z.z + Math.sin(a) * r, (Math.random() - 0.5) * 0.4, 1.0 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4, 3 + Math.random() * 2, 1.5, 5, [0.95, 0.97, 1], 0.28, 'smoke', 4); }
    }
  },
  /* ---------------- 2D overlay ---------------- */
  overlay(ctx, g, fdt) {
    const S = BW15.state; if (!S || g.state !== 'play' || g.paused) return;
    const W = Game.cssW, H = Game.cssH, UI = BurnsUI, Sf = UI.safe(), portrait = H > W, t = g.time;
    const tv = BW15D.tripVis(S);
    // final card
    if (S.card) { BW15C.drawCard(ctx, g, S, fdt); return; }
    if (g.cine) { BW15C.drawBubbles(ctx, g, S); return; }
    // trip tint around the edges
    if (tv > 0.15) { const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `hsla(${(t * 70) % 360},90%,60%,${Math.min(0.3, tv * 0.22)})`); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
    BW15C.drawBubbles(ctx, g, S);
    // ---- trip meter (left column, under the pills)
    const rows = 3 + (g.packVisible && g.packVisible() ? 1 : 0);   // the engine's left column (+ its backpack pill)
    const x0 = Sf.l + 6, y0 = Sf.t + 8 + Math.min(24, W / 26) * 1.4 + 28 * rows + 6;
    const dayUp = portrait && g.dayCardT >= 0;   // portrait: the engine's day card sits right under the left column
    ctx.save(); if (dayUp) ctx.globalAlpha = 0.15;
    UI.pill(ctx, x0, y0, 128, 38, 'rgba(10,6,24,0.6)', 'rgba(255,255,255,0.25)');
    UI.text(ctx, 'TRIP', x0 + 8, y0 + 11, 10, '#ffffff', { align: 'left', stroke: false });
    UI.text(ctx, `BAGS ${Math.min(8, S.trip.bags)}/8`, x0 + 120, y0 + 11, 9, '#ffd0f4', { align: 'right', stroke: false, ui: true });
    for (let i = 0; i < 8; i++) {
      const on = i < Math.round(S.trip.level * 8), bx = x0 + 8 + i * 14.4, by = y0 + 20, wob = on ? Math.sin(t * 6 + i) * tv * 1.5 : 0;
      ctx.fillStyle = on ? BW15_RAINBOW[i % 7] : 'rgba(255,255,255,0.14)'; burnsRR(ctx, bx, by + wob, 12, 10, 3); ctx.fill();
    }
    ctx.restore();
    // ---- speedometer
    const mph = Math.round(Math.abs(S.v) * 2.237), L = Input.layout;
    let gx = W / 2, gy = H - Sf.b - 30;
    if (L && portrait) { gx = clamp(L.stickHome.x, Sf.l + 60, W / 2); gy = L.stickHome.y - L.stickHome.r - 38; }
    const rush = S.zone === 'line' && S.pulse.phase === 'big';
    const lim = S.enc ? (S.enc.kind === 'check' ? 10 : 45) : rush ? 'GO' : S.zone === 'line' ? 10 : S.paved ? 45 : 25;
    UI.pill(ctx, gx - 58, gy - 22, 116, 44, 'rgba(10,6,24,0.6)', S.enc && (S.enc.fast || S.enc.slow) ? 'rgba(255,80,80,0.9)' : 'rgba(255,255,255,0.25)');
    UI.text(ctx, String(mph), gx - 16, gy - 3, 21, !rush && mph > lim ? '#ff8a8a' : '#ffffff', { stroke: false });
    UI.text(ctx, 'MPH', gx - 16, gy + 13, 8, '#cfc8e8', { stroke: false, ui: true });
    ctx.save(); ctx.fillStyle = '#ffffff'; burnsRR(ctx, gx + 16, gy - 17, 32, 34, 5); ctx.fill(); ctx.strokeStyle = '#c8303a'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    UI.text(ctx, 'LIMIT', gx + 32, gy - 8, 6, '#1a1a22', { stroke: false, ui: true }); UI.text(ctx, String(lim), gx + 32, gy + 6, 13, '#1a1a22', { stroke: false });
    // ---- the Exodus pulse
    const P = S.pulse;
    if (S.zone === 'line' && P.phase !== 'done' && P.phase !== 'won' && !(g.dayCardT >= 0 && P.phase === 'hold1')) {   // (not under the engine's day card)
      const label = P.phase === 'big' ? `GATE CLOSES IN ${Math.max(0, Math.ceil(P.bigT))}` : P.phase === 'count' ? `THE BIG PULSE IN ${Math.max(1, Math.ceil(3.2 - P.t))}` : P.phase === 'go1' ? 'PULSE! ROLL!' : P.phase === 'retry' ? `NEXT PULSE IN ${Math.max(1, Math.ceil(5 - P.t))}` : 'HOLDING · TAKE THE LAST BAGS';
      const col = P.phase === 'big' ? (P.bigT < 10 && Math.floor(t * 4) % 2 ? '#ff6a6a' : '#7aff5a') : P.phase === 'go1' ? '#7aff5a' : '#ffb04a';
      const py = (g.topStack || Sf.t + 40) + 6 + g.toasts.length * 28;
      UI.text(ctx, label, W / 2, py + 10, Math.min(16, W / 30), col, { glow: col });
    }
    // ---- KEEP IT TOGETHER
    if (S.enc) BW15C.drawEnc(ctx, g, S);
    // ---- chase / tail
    const C = S.chase || S.tail;
    if (C && !S.enc) {
      const bw = Math.min(260, W * 0.5), bx = W / 2 - bw / 2, by = (g.topStack || Sf.t + 40) + 4 + g.toasts.length * 28;
      UI.pill(ctx, bx, by, bw, 46, 'rgba(30,6,20,0.72)', S.chase ? 'rgba(255,60,90,0.9)' : 'rgba(255,176,32,0.9)');
      UI.text(ctx, S.chase ? 'COPS ON YOUR TAIL!' : 'UNDERCOVER COP: LOSE HIM', W / 2, by + 11, 11, S.chase ? '#ff9ab0' : '#ffd890', { stroke: false });
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; burnsRR(ctx, bx + 12, by + 22, bw - 24, 8, 4); ctx.fill();
      const lk = clamp(C.lock, 0, 1); ctx.fillStyle = S.chase ? '#ff4a6a' : '#ffb020'; burnsRR(ctx, bx + 12, by + 22, (bw - 24) * lk, 8, 4); ctx.fill();
      UI.text(ctx, !C.sees && S.hideWhy ? 'HIDING: ' + S.hideWhy : (C.sees ? 'HE CAN SEE YOU · DUST · TRUCKS · TRAFFIC' : 'OUT OF SIGHT...'), W / 2, by + 38, 9, !C.sees ? '#7aff9a' : '#ffffff', { stroke: false, ui: true });
    }
  },
  drawEnc(ctx, g, S) {
    const E = S.enc, W = Game.cssW, H = Game.cssH, UI = BurnsUI, Sf = UI.safe(), portrait = H > W;
    const bw = Math.min(300, W * 0.62), bx = W / 2 - bw / 2, by = (g.topStack || Sf.t + 40) + 4 + g.toasts.length * 28 + (portrait ? 30 : 0);
    UI.pill(ctx, bx, by, bw, 62, 'rgba(26,6,30,0.78)', 'rgba(255,79,216,0.9)');
    UI.text(ctx, 'KEEP IT TOGETHER', W / 2, by + 12, 13, '#ffd0f4', { glow: '#ff4fd8' });
    // suspicion
    UI.text(ctx, 'SUSPICION', bx + 12, by + 30, 8, '#ffffff', { align: 'left', stroke: false, ui: true });
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; burnsRR(ctx, bx + 64, by + 26, bw - 76, 8, 4); ctx.fill();
    const k = clamp(E.susp, 0, 1), gr = ctx.createLinearGradient(bx + 64, 0, bx + bw - 12, 0); gr.addColorStop(0, '#7aff5a'); gr.addColorStop(0.6, '#ffe24a'); gr.addColorStop(1, '#ff3b5c');
    ctx.fillStyle = gr; burnsRR(ctx, bx + 64, by + 26, (bw - 76) * k, 8, 4); ctx.fill();
    // checks: lane, speed, beat
    const chip = (x, ok, label) => { ctx.fillStyle = ok ? 'rgba(80,220,120,0.85)' : 'rgba(255,70,90,0.9)'; burnsRR(ctx, x, by + 40, 60, 16, 8); ctx.fill(); UI.text(ctx, label, x + 30, by + 48.5, 8, '#ffffff', { stroke: false, ui: true }); };
    const cw = (bw - 24) / 3;
    chip(bx + 12 + (cw - 60) / 2, !E.outLane, E.outLane ? 'LANE!' : 'LANE OK');
    chip(bx + 12 + cw + (cw - 60) / 2, !E.fast && !E.slow, E.fast ? 'TOO FAST' : E.slow ? 'TOO SLOW' : 'SPEED OK');
    chip(bx + 12 + cw * 2 + (cw - 60) / 2, E.steady > 0.15, E.steady > 0.15 ? 'STEADY' : 'TAP!');
    // the beat ring closes onto the ACTION button
    const L = Input.layout;
    if (L) {
      const A = L.action, nb = E.beats.find(b => !b.res && b.t > E.t - 0.24);
      ctx.save();
      if (nb) { const u = clamp((nb.t - E.t) / 0.62, 0, 1.5), r = A.r * (1 + u * 1.6); ctx.strokeStyle = `rgba(255,${200 - u * 80 | 0},255,${0.9 - u * 0.4})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(A.x, A.y, r, 0, TAU); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(A.x, A.y, A.r * 1.04, 0, TAU); ctx.stroke();
      ctx.restore();
      if (E.msg && E.msgT > 0) UI.text(ctx, E.msg, A.x, A.y - A.r * 2.2, 14, E.msg === 'STEADY!' ? '#ffe24a' : E.msg === 'GOOD' ? '#7aff9a' : '#ff8a9a', { glow: '#ff4fd8' });
    }
  },
  drawBubbles(ctx, g, S) {
    if (!S.bubbles.length) return;
    const R = g.R, W = Game.cssW, H = Game.cssH, o = {};
    const hush = S.chinka && S.chinka.bubbleText;   // Chinka has the floor: signs wait their turn (no overlapping bubbles)
    for (const b of S.bubbles) {
      if ((hush && b.sign) || !R.project(b.x, b.y, b.z, W, H, o) || o.w > 90) continue;
      const a = clamp(Math.min(b.t * 3, 1), 0, 1), sc = clamp(26 / o.w, 0.7, 1.15);
      ctx.save(); ctx.globalAlpha = a; ctx.font = `600 ${Math.round(13 * sc)}px ${FONT_UI}`;
      const lines = BurnsUI.wrap(ctx, b.text, 200 * sc), lh = 16 * sc;
      const w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20 * sc, h = lines.length * lh + 12 * sc;
      const bx = clamp(o.x - w / 2, 6, W - w - 6), by = clamp(o.y - h - 14 * sc, 6, H - h - 6);
      const hue = (g.time * 60) % 360;
      ctx.fillStyle = `hsl(${hue},90%,88%)`; burnsRR(ctx, bx, by, w, h, 11 * sc); ctx.fill();
      ctx.strokeStyle = `hsl(${hue + 120},80%,55%)`; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); const tx = clamp(o.x, bx + 12, bx + w - 12); ctx.moveTo(tx - 6 * sc, by + h - 1); ctx.lineTo(tx + 6 * sc, by + h - 1); ctx.lineTo(o.x, Math.min(by + h + 11 * sc, o.y - 2)); ctx.closePath(); ctx.fillStyle = `hsl(${hue},90%,88%)`; ctx.fill();
      ctx.fillStyle = '#2a1036'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
      lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 6 * sc + i * lh));
      ctx.restore();
    }
  },
  drawCard(ctx, g, S, fdt) {
    const C = S.card, W = Game.cssW, H = Game.cssH;
    C.t += fdt;
    const a = clamp(C.t / 1.2, 0, 1);
    ctx.save();
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(20,10,40,${a})`); gr.addColorStop(0.6, `rgba(120,50,90,${a})`); gr.addColorStop(1, `rgba(255,150,100,${a})`);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    // a little sunrise
    ctx.globalAlpha = a; const sy = H * 0.86 - Math.min(1, C.t / 4) * H * 0.08;
    const sg = ctx.createRadialGradient(W / 2, sy, 4, W / 2, sy, H * 0.35); sg.addColorStop(0, 'rgba(255,230,160,0.9)'); sg.addColorStop(0.2, 'rgba(255,170,120,0.5)'); sg.addColorStop(1, 'rgba(255,120,120,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    const k1 = clamp((C.t - 0.8) / 1.0, 0, 1), k2 = clamp((C.t - 2.2) / 1.0, 0, 1);
    ctx.globalAlpha = k1; BurnsUI.text(ctx, 'WELCOME HOME…', W / 2, H * 0.42, Math.min(46, W / 11), '#ffe8c0', { glow: '#ff9ad0' });
    ctx.globalAlpha = k2; BurnsUI.text(ctx, 'see you next year', W / 2, H * 0.42 + Math.min(46, W / 11) * 1.1, Math.min(22, W / 20), '#ffffff', { ui: true });
    ctx.globalAlpha = clamp((C.t - 3.6) / 0.8, 0, 1); BurnsUI.text(ctx, '♥ Brady & Chinka ♥', W / 2, H * 0.62, 13, '#ffd0f4', { ui: true });
    ctx.restore();
  }
};

/* ---------------- 2D overlay hook for this world (chains with any other overlay hooks) ---------------- */
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    prev.call(this, ctx, g, fdt);
    if (!g || g.worldId !== 15 || !BW15.state || BW15.state.g !== g) return;
    try { BW15C.overlay(ctx, g, fdt); } catch (e) { if (Game.reportError) Game.reportError(e); }
  };
})();
