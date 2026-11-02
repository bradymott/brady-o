/* ============================================================
   BRADY-O BURNS — World 14: SKYDIVE INTO THE BURN
   (plays 13th, right before the finale)
   The Man's goons revoked Brady's ticket and walked him out of the
   city. Chinka is on top of the Man's pavilion. The gate is closed to
   him... so he goes to the little desert airstrip, earns a seat on
   Captain Dusty's plane, FLIES it over Black Rock City, jumps, and
   steers his canopy down to the Glow Crew, his stashed yellow bike
   and his costume. Then: the finale (World 10).
   Missions (Burn Tokens):
     preflight  Pre-Flight Check     oil cap (hangar rave leftovers), the runaway windsock, drive the fuel truck
     takeoff    Smooth Takeoff       lift off before the end of the strip, no bounces
     rings      Ring Run             13 glowing rings over the deep-playa art
     needle     Thread the Needle    secret: fly UNDER the Leaning Lighthouses' kiss
     formation  Freefall Formation   fall through all 5 formation rings
     bullseye   Bullseye Landing     land inside the 4 m bullseye by the X
   Story missions: pilot (find Dusty), chute (the rigger + the sparkle pony),
   briefing (Safety Third), board (wheels up), jump (land at the Glow Crew).
   Files: 42_burns_w14_a_base.js (config, models, anims), _b_city.js (the
   flyover city + art), _c_flight.js (plane/freefall/canopy), _d_hud.js.
   ============================================================ */

const BW14_SKY_A = Object.assign({}, BURNS_PALETTES.day, { zen: '#3f7ed6', hor: '#f6d6b2', mid: '#8ab8ea', midK: 0.3, fog: '#ead0b0', fogD: 0.0048, haze: 0.55, sun: [95, 18], sunCol: '#fff0d4', key: '#fff0dc', keyK: 0.95, clouds: 0.45, mtnCol: '#8a7a90' });
const BW14_SKY_B = Object.assign({}, BURNS_PALETTES.dusk, { fogD: 0.0068, sun: [255, 4], clouds: 0.55, cityK: 0.45 });

const BW14_W = {
  // the scenic route: [x, z, altitude]
  ROUTE: [[410, -30, 24], [392, -150, 40], [305, -262, 52], [150, -250, 30], [228, -372, 46], [92, -446, 36], [-130, -420, 52], [-196, -268, 40], [-262, -312, 54], [-352, -196, 30], [-205, -150, 42], [-50, -165, 48], [60, -90, 60]],
  DZ: { x: 30, z: -50, r: 75, alt: 320 },
  RING_COLS: ['#38f2ff', '#ff4fd8', '#ffe24a', '#7aff5a', '#ff7a2a', '#9a6bff'],
  QUIPS: {
    1: 'Left side: the Retro Rocket. Built by a guy who swears it\'ll launch on Sunday.',
    3: 'That\'s the Sleeping Giant. Don\'t wake him. He\'s been up since Tuesday.',
    4: 'The Pump Jack Colossus! It pumps vibes. Allegedly.',
    5: 'Somebody tied a semi truck in a knot. Art is hard to explain from up here.',
    6: 'The Leaning Lighthouses! Fly OVER them... unless you\'re feeling lucky.',
    7: 'A pirate ship. In the desert. Landlocked and loving it.',
    8: 'The Stick Cathedral. Ten thousand sticks. Zero nails. Maximum splinters.',
    9: 'Glowshroom Grove! They glow at night. And mildly at noon.',
    11: 'Easy over the Temple, kid. Gentle on the throttle. That place is quiet.',
    12: 'There\'s the Man. And... is that your lady on his pavilion? Holy smokes.'
  },
  state: null,

  /* ---------------- events from the flight systems ---------------- */
  event(g, name, d) {
    const S = g.bw14; if (!S) return;
    const F = S.fly;
    if (name === 'liftoff') {
      if (S.takeoffPhase) { S.to = { onRwy: d.onRwy, endOk: d.z > BW14_CFG.RWY.z1 - 20, bad: !d.onRwy, t: 0 }; F.say(d.onRwy ? 'Wheels up! Climb gentle, keep the wings level...' : 'Off the strip, but airborne! Climb, climb!'); }
    } else if (name === 'touchdown' || name === 'bonk') {
      if (S.takeoffPhase && S.to) { S.to.bad = true; }
      if (name === 'touchdown' && !S.takeoffPhase) F.say('Touch and go! Throttle up and pull back to lift off again.', 'tgo');
    } else if (name === 'planeStep') {
      // the takeoff test: clean liftoff on the strip, no bounce/bonk until 30 m up
      if (S.takeoffPhase && S.to) {
        const agl = d.y - BW14_PLANE.GEAR_H - g.world.height(d.x, d.z);
        if (agl > 30) { S.takeoffPhase = false; if (!S.to.bad && S.to.onRwy) { g.missions.complete('takeoff'); F.say('Smooth as a fresh-raked playa! You\'re a natural.'); } else { F.say('That was... technically a takeoff. We\'ll call it "art".'); } S.routeT = 0; bw14After(g, 3.5, () => F.say('Follow the rings, kid. Scenic route over the deep playa.', 'route')); }
      }
      if (S.takeoffPhase && !S.to && d.ground && Math.abs(d.x - BW14_CFG.RWY.x) > BW14_CFG.RWY.w / 2 + 3 && d.V > 6) { F.hint('edge', 'Stay on the strip! Steer with the stick.'); }
      // Thread the Needle: under the Leaning Lighthouses' kiss
      const LH = S.lh;
      if (LH) {
        const ex = d.x - LH.x, ez = d.z - LH.z, dn = ex * LH.nx + ez * LH.nz;
        if (LH.prev !== undefined && Math.sign(dn) !== Math.sign(LH.prev) && Math.abs(ex * LH.ax + ez * LH.az) < 10 && d.y < 26 && d.y > 2) {
          if (!g.missions.isDone('needle')) { g.missions.complete('needle'); g.banner('THREAD THE NEEDLE!', 'Under the lighthouses\' kiss. Respect.', { col: '#ffe24a', big: true }); }
          F.say('YOU FLEW UNDER THE LIGHTHOUSES?! I\'m telling everyone. Nobody\'s gonna believe me.', 'needle');
        }
        LH.prev = dn;
      }
      // the drop zone
      const DZ = S.dz, inDz = Math.hypot(d.x - DZ.x, d.z - DZ.z) < DZ.r, high = d.y - BW14_PLANE.GEAR_H >= DZ.alt;
      const ready = inDz && high && !d.ground;
      if (ready && !S.dzReady) { F.say('GREEN LIGHT! Out on the step, kid! JUMP!', 'green'); burnsSfx('greeter_bell', { pitch: 1.4 }); BW14_HUD.flash(g, 'GREEN LIGHT · JUMP!', 1.6); }
      if (inDz && !high && !d.ground) F.hint('climb', 'We\'re over the drop zone, but too low. Climb to ' + BW14_HUD.ft(DZ.alt) + ' feet!');
      S.dzReady = ready;
    } else if (name === 'ring') {
      S.ringsDone = (S.ringsDone || 0) + 1;
      const q = BW14_W.QUIPS[d.i]; if (q) F.say(q, 'q' + d.i);
      const left = F.rings.filter(r => !r.done).length;
      if (!left) { if (!g.missions.isDone('rings')) g.missions.complete('rings'); bw14After(g, 1.2, () => F.say('Every ring! Now ride the golden updrafts over the burn barrels up to ' + BW14_HUD.ft(S.dz.alt) + ' feet.')); }
      else if (d.i === BW14_W.ROUTE.length - 1) bw14After(g, 1.2, () => F.say('Missed ' + left + ' ring' + (left > 1 ? 's' : '') + '. Circle back, or climb the updrafts to the drop zone.'));
      BW14_W.updateTracker(g);
    } else if (name === 'updraft') {
      F.pl.boostT = 2.6;
    } else if (name === 'letgo') {
      BW14_W.placeFreefallTargets(g, d);
      BW14_W.updateTracker(g);
    } else if (name === 'fring') {
      S.formation = (S.formation || 0) + 1;
      g.toast('FORMATION ' + S.formation + '/5');
      if (S.formation >= 5 && !g.missions.isDone('formation')) g.missions.complete('formation');
    } else if (name === 'pull') {
      const C = BW14_CFG;
      if (d.q === 'perfect') { g.banner('PERFECT PULL!', 'Right in the green. +10 glow sticks', { col: '#7aff5a' }); g.addGlow(10); F.say('Beautiful pull! Now steer for the X. Toggles: left, right, both to flare.'); }
      else if (d.q === 'early') { g.banner('EARLY PULL', 'Long scenic ride. Mind the wind!', { col: '#9adcff', small: true }); F.say('Early pull! You\'ll be up there a while. Watch the wind drift.'); }
      else if (d.q === 'late') { g.banner('LATE PULL!', 'Cutting it close...', { col: '#ffb020', small: true }); F.say('LATE! Flare when your feet are about to touch!'); }
      else { BW14_HUD.flash(g, d.auto ? 'NO PULL!' : 'TOO LOW!', 1.6); F.say(d.auto ? 'PULL! PULL! ...the backup popped. It\'s gonna be a lumpy one.' : 'Way too low! That chute needs more sky than that!'); }
      void C;
    } else if (name === 'open') {
      BW14_W.ctlHint(g, 'canopy');
      BW14_W.updateTracker(g);
    } else if (name === 'landed') {
      BW14_W.landed(g, d);
    }
  },
  ctlHint(g, mode) {
    const touch = Input.usingTouch || Game.forceTouchUI, S = g.bw14;
    const T = {
      plane: touch ? ['FLY THE DUST BUNNY', 'Left stick: pitch + bank to turn · Right lever: throttle', 'Throttle up, roll, pull back at 50 kt · ⇅ flips the stick'] : ['FLY THE DUST BUNNY', 'Arrows/WASD: pitch + bank · Space: throttle up · X/Shift: down', 'Throttle up, roll, then pull back (↓) to lift off'],
      free: touch ? ['FREEFALL!', 'Stick: steer (up = track forward) · Fly through the rings', 'Hit PULL when the altimeter is in the GREEN'] : ['FREEFALL!', 'Arrows: steer (up = track forward)', 'X/Shift or Space: PULL in the GREEN'],
      canopy: touch ? ['CANOPY OPEN', 'Hold LEFT / RIGHT toggles to turn', 'Hold BOTH to brake · FLARE just before your feet touch'] : ['CANOPY OPEN', 'Left/Right: toggles · Down or Space: both (brake)', 'FLARE just before your feet touch']
    };
    S.ctlHint = { lines: T[mode], t: 6 };
  },
  updateTracker(g) {
    const S = g.bw14, F = S.fly, m = g.missions.get('jump'); if (!m) return;
    let t = 'Skydive into the Burn';
    if (F.mode === 'plane') { const r = F.nextRing(); t = F.pl.ground ? 'Throttle up, pull back' : r ? 'Ring ' + (r.i + 1) + ' of ' + F.rings.length : 'Climb to ' + BW14_HUD.ft(S.dz.alt) + ' ft · JUMP'; }
    else if (F.mode === 'free') t = 'Pull in the green!';
    else if (F.mode === 'canopy' || F.mode === 'deploy') t = 'Steer to the X · flare';
    m.def.short = t;
  },

  /* ---------------- build helpers ---------------- */
  rings(api, g, F) {
    const R = this.ROUTE;
    for (let i = 0; i < R.length; i++) {
      const [x, z, y] = R[i], n = R[Math.min(R.length - 1, i + 1)], p = R[Math.max(0, i - 1)];
      const yaw = i < R.length - 1 ? Math.atan2(n[0] - x, n[1] - z) : Math.atan2(x - p[0], z - p[1]);
      const col = this.RING_COLS[i % this.RING_COLS.length];
      const mv = api.mover(m => { BW14_Model.ring(m, col); return { cols: [] }; });
      mv.x = x; mv.y = y; mv.z = z; mv.yaw = yaw; mv.scale = 10; mv.noCollide = true;
      F.rings.push({ i, x, y, z, yaw, r: 10, col, mv, done: false, prev: null });
    }
    // golden updrafts spiralling up around the Man to the drop zone
    for (let k = 0; k < 9; k++) {
      const a = 0.9 + k * 0.62, rr2 = 118 - k * 6, x = Math.sin(a) * rr2, z = -Math.cos(a) * rr2, y = 80 + k * 30;
      const mv = api.mover(m => { BW14_Model.ring(m, '#ffd84a', true); return { cols: [] }; });
      mv.x = x; mv.y = y; mv.z = z; mv.scale = 16; mv.noCollide = true;
      F.thermalRings.push({ i: k, x, y, z, r: 17, mv, cool: 0 });
    }
    // freefall formation rings (placed for real when Brady lets go)
    for (let k = 0; k < 5; k++) {
      const col = this.RING_COLS[(k + 2) % this.RING_COLS.length];
      const mv = api.mover(m => { BW14_Model.ring(m, col, true); return { cols: [] }; });
      mv.x = 0; mv.y = -50; mv.z = 0; mv.scale = 7; mv.noCollide = true; mv.visible = false;
      F.frings.push({ i: k, x: 0, y: -50, z: 0, r: 7, col, mv, done: false });
    }
    // festival drones over the Temple + the route
    const dspots = [[-40, -170, 50, 26, 14], [10, -150, 64, 20, 18], [-120, -160, 46, 30, 10], [250, -330, 60, 24, 16], [-290, -250, 50, 20, 20], [80, -100, 70, 26, 12], [-20, -120, 38, 18, 18]];
    dspots.forEach(([cx, cz, y0, rx, rz], i) => {
      const col = BURNS_NEON[i % 7], mv = api.mover(m => { m.push(); m.tf(0, 0, 0, 0, 0, 0, 2.2); BW14_Model.drone(m, col); m.pop(); return { cols: [] }; });
      mv.noCollide = true;
      F.drones.push({ mv, cx, cz, y0, rx, rz, sp: 0.25 + (i % 3) * 0.08, ph: i * 1.7, x: cx, y: y0, z: cz, hit: 0, col });
    });
    // dust devils wandering the deep playa
    [[260, -200, 12, 60, 40], [-60, -330, 14, 80, 30], [-300, -120, 11, 50, 60], [120, -420, 12, 70, 30]].forEach(([cx, cz, r, rx, rz], i) => F.devils.push({ i, cx, cz, r, rx, rz, h: 75, sp: 0.07 + i * 0.02, ph: i * 2.1, x: cx, z: cz }));
  },
  // formation rings + freefall glow sticks + photo 3 laid along Brady's expected fall line
  placeFreefallTargets(g, D) {
    const S = g.bw14, F = S.fly, C = BW14_CFG, L = C.LZ;
    const toLZ = Math.atan2(L.x - D.x, L.z - D.z);
    const at = (y, side) => {
      const t = (D.y - y) / BW14_PH.FALL_V, throwK = 1 - Math.exp(-t / 0.75);
      const mx = Math.sin(F.pl.yaw) * F.pl.V * 0.8 * 0.75 * throwK, mz = Math.cos(F.pl.yaw) * F.pl.V * 0.8 * 0.75 * throwK;
      const steer = Math.min(t * 3.5, 50);
      return [D.x + mx + C.WIND.x * t + Math.sin(toLZ) * steer + Math.cos(toLZ) * side, D.z + mz + C.WIND.z * t + Math.cos(toLZ) * steer - Math.sin(toLZ) * side];
    };
    // five rings evenly spaced between just below the exit and just above the pull window
    const top = D.y - 30, bot = C.PULL_HI + 12, gap = Math.max(14, (top - bot) / 4);
    const ys = [0, 1, 2, 3, 4].map(k => Math.max(bot - 4, top - k * gap)), sides = [0, 4, -3, 5, -2];
    F.frings.forEach((r, k) => { const [x, z] = at(ys[k], sides[k]); r.x = x; r.z = z; r.y = ys[k]; r.prev = undefined; if (r.mv) { r.mv.x = x; r.mv.y = r.y; r.mv.z = z; r.mv.visible = !r.done; } });
    const sticks = g.pickups.items.filter(P => P.bw14ff && !P.taken);
    sticks.forEach((P, i) => { const k = Math.floor(i / 5), f = (i % 5 + 1) / 6, ya = k === 0 ? D.y - 12 : ys[k - 1], yb = ys[Math.min(4, k)]; const y = lerp(ya, yb, f), s0 = k === 0 ? 0 : sides[k - 1], s1 = sides[Math.min(4, k)], [x, z] = at(y, lerp(s0, s1, f)); P.x = x; P.z = z; P.y0 = y; });
    const ph = g.pickups.items.find(P => P.id === 'p3' && !P.taken);
    if (ph) { const [x, z] = at(D.y - 170, 40); ph.x = x; ph.z = z; ph.y0 = D.y - 170; }
  },

  /* ---------------- boarding, takeoff, the jump ---------------- */
  board(g) {
    const S = g.bw14, F = S.fly, p = g.player, C = BW14_CFG, R = C.RWY;
    g.missions.complete('board');
    g.cutscene([
      { cam: { x: C.PARK.x - 9, y: 3.2, z: C.PARK.z + 9, tx: C.PARK.x, ty: 2, tz: C.PARK.z, fov: 0.9 } },
      { say: [g.actor('dusty'), ['Checklist\'s done, chute\'s on, and you\'re briefed. Mostly.', 'Climb in, kid. Left seat. YOU\'RE flying. I\'ll talk you through it on the radio.']] },
      { say: ['brady', ['Me? Fly? I can barely parallel park a bike.']] },
      { say: [g.actor('dusty'), ['Bikes are harder. No wings. Let\'s go get your lady.']] },
      { fade: 'out', dur: 0.5 },
      { do: g2 => BW14_W.startFlight(g2) },
      { cam: { x: R.x + 10, y: 4, z: R.z0 + 14, tx: R.x, ty: 2, tz: R.z0 - 10, fov: 0.9 } },
      { fade: 'in', dur: 0.5 },
      { wait: 0.6 },
      { do: g2 => { g2.banner('WHEELS UP', 'Take off from the strip · Captain Dusty on the radio', { col: '#ff9a4a', big: true }); } }
    ], g2 => { BW14_W.ctlHint(g2, 'plane'); F.say('Throttle ALL the way up. At fifty knots, pull back. Gently. She bites.', 'roll'); });
  },
  startFlight(g) {
    const S = g.bw14, F = S.fly, p = g.player, R = BW14_CFG.RWY;
    const d = g.actor('dusty'); if (d) d.hidden = true;
    F.placePlane(R.x, R.z0 - 6, Math.PI);
    F.attach(p); F.setMode('plane'); F.pl.thr = 0; F.pl.V = 0; F.pl.ground = true;
    F.posePlane(0); F.seatBrady(p); F.cam.init = false;
    S.takeoffPhase = true; S.to = null; S.dzReady = false;
    g.missions.start('jump', true);
    BW14_W.updateTracker(g);
    if (S.sock && S.sock.mode !== 'pole') S.sock.mode = 'pole';
    burnsMusic('burns_w7');
    g.setTod(0.42, 0.012);
  },
  jumpOut(g) {
    const S = g.bw14, F = S.fly, p = g.player;
    if (F.mode !== 'plane') return;
    S.dzReady = false; F.setMode('exit');
    if (Sound.engine) Sound.engine(true, 0.4);
    g.setTod(Math.max(g.tod, 0.72), 0.02);
    // below the wing line, off the right side: Brady on the step, the strut, the wing above, the city way down
    const exitCam = (k) => { const P = F.pl, s = bw14Rot(P.yaw, 0, 0, -5.6 - k * 1.6, -0.55 - k * 0.9, -3.2 + k * 2.6); return { x: P.x + s[0], y: P.y + s[1], z: P.z + s[2], tx: p.x, ty: p.y + 0.6, tz: p.z, fov: 1.1 }; };
    let tt = 0;
    g.cutscene([
      { do: g2 => { F.say('Out on the step... hold the strut... and on three!', 'step'); } },
      { until: (g2, c) => { tt += 1 / 120; c.cam = exitCam(Math.min(1, tt / 2.4)); if (tt > 0.6 && !S.yelled) { S.yelled = true; g2.playerBubble('CHINKA! I\'M DROPPING IN!', 1.8); } return tt > 2.4; } },
      { do: g2 => { S.yelled = false; F.letGo(g2.player); BW14_W.ctlHint(g2, 'free'); burnsMusic('burns_w9'); } },
      { until: (g2, c) => { tt += 1 / 120; const D = F.dv, k = clamp((tt - 2.4) / 1.6, 0, 1), a = F.dv.yaw + Math.PI * (1 - k) * 0.9; c.cam = { x: D.x - Math.sin(a) * lerp(4, 7, k), y: D.y + lerp(1.5, 6, k), z: D.z - Math.cos(a) * lerp(4, 7, k), tx: D.x + Math.sin(D.yaw) * 2, ty: D.y - lerp(1, 8, k), tz: D.z + Math.cos(D.yaw) * 2, fov: lerp(1.1, 1.25, k) }; return tt > 4.0; } }
    ], g2 => { F.cam.init = false; BW14_W.updateTracker(g2); });
  },
  // after a hard landing, or for another go at the bullseye: back to the plane over the drop zone
  resetJump(g) {
    const S = g.bw14, F = S.fly, p = g.player, DZ = S.dz, L = BW14_CFG.LZ;
    S.card = null;
    g.fadeTo(1, 0.35);
    bw14After(g, 0.45, g2 => {
      const yaw = Math.atan2(L.x - DZ.x, L.z - DZ.z) + 0.9;
      F.placePlane(DZ.x - Math.sin(yaw) * 30, DZ.z - Math.cos(yaw) * 30, yaw, DZ.alt + 30 + BW14_PLANE.GEAR_H);
      F.pl.V = 31; F.pl.thr = 0.6; F.pl.ground = false; F.planeP.hidden = false;
      if (F.canP) F.canP.hidden = true;
      F.attach(p); F.setMode('plane'); F.posePlane(0); F.seatBrady(p); F._stood = false; F.result = null; F.pulled = false; F.snapped = false; F.flareHint = false;
      p.ch.poseFn = null; g2.camYaw = yaw;
      S.dzReady = true;
      g2.fadeTo(0, 0.4);
      BW14_W.jumpOut(g2);
    });
  },
  /* ---------------- landing: score, card, and what happens next ---------------- */
  landed(g, r) {
    const S = g.bw14, F = S.fly, C = BW14_CFG;
    S.ctlHint = null;
    const jm = g.missions.get('jump'); if (jm) jm.def.short = r.land === 'hard' ? 'Ouch! Jump again' : 'Landed! GO or jump again';
    const surfName = { dome: 'A DOME!', potty: 'A PORTA-POTTY ROOF!', rv: 'AN RV ROOF!', shade: 'A SHADE STRUCTURE!', roof: 'SOMEBODY\'S ROOF!', playa: 'the playa' }[r.surf] || 'the playa';
    const rows = [];
    if (r.land === 'hard') {
      const what = r.surf !== 'playa' ? surfName : 'A BRADY-SHAPED CRATER';
      S.card = { t: 0, title: 'HARD LANDING', col: '#ff6a6a', rows: [['Landed on', what, '#ffd0d0'], ['Pull', r.pullQ === 'dead' ? 'too late!' : r.pullQ, '#ffb0b0']], quip: ['Captain Dusty: "Let\'s call that a practice run."', 'The Glow Crew gave it a 4/10. For enthusiasm.', 'You are fine. Your dignity is in the shop.'][Math.floor(Math.random() * 3)], again: true, hard: true };
      F.say('You okay? Shake it off. I\'m circling back. One more time!', 'hard');
      g.fx.burst(r.x, 1, r.z, 'star', 20, '#ffe24a'); burnsSfx('crowd', { vol: 0.4 });
    } else {
      const d = r.dist, bull = d < 4, great = d < 9, good = d < 18;
      const stars = (bull ? 2 : great ? 1 : good ? 1 : 0) + (r.land === 'soft' ? 1 : 0) - (r.land === 'rough' ? 1 : 0);
      const landTxt = { soft: r.perfectFlare ? 'PERFECT FLARE' : 'SOFT', ok: 'RAN IT OUT', rough: 'TUMBLE!' }[r.land];
      rows.push(['Distance to the X', d < 1 ? 'ON IT!' : d.toFixed(1) + ' m', bull ? '#7aff5a' : great ? '#ffe24a' : '#ffffff']);
      rows.push(['Landing', landTxt, r.land === 'soft' ? '#7aff5a' : r.land === 'ok' ? '#ffe24a' : '#ff9a6a']);
      if (r.surf !== 'playa') rows.push(['Touched down on', surfName, '#ff9ad8']);
      const title = { potty: 'OCCUPIED!', dome: 'DOME SLIDE!', rv: 'RV ROOFTOP!', shade: 'SHADE BOUNCE!', roof: 'UNSCHEDULED STOP' }[r.surf] || (bull ? 'BULLSEYE!' : great ? 'NICE LANDING!' : good ? 'GOOD LANDING' : 'YOU LANDED!');
      const quip = r.surf === 'potty' ? 'From inside: "OCCUPIED!"' : r.surf === 'dome' ? 'You slid down the dome. Somebody inside cheered.' : r.surf === 'rv' ? 'The RV owner: "Rent is due Sunday."' : r.surf === 'shade' ? 'Boing. Shade structures make great trampolines. Don\'t tell them.' : r.land === 'rough' ? 'You tumbled like a dusty burrito. The crowd loved it.' : bull ? 'The Glow Crew is losing their minds.' : d > 45 ? 'The Glow Crew is jogging over with your bike.' : 'The Glow Crew waves their glow sticks.';
      S.card = { t: 0, title, col: bull ? '#7aff5a' : '#ffd84a', rows, stars: clamp(stars, 0, 3), quip, again: true, hard: false };
      if (bull && !g.missions.isDone('bullseye')) bw14After(g, 0.6, g2 => g2.missions.complete('bullseye'));
      g.fx.confetti(r.x, 2, r.z, bull ? 60 : 24); burnsSfx('crowd_cheer', { vol: bull ? 0.9 : 0.5 });
      F.say(bull ? 'BULLSEYE! Right on the X! I\'m crying. It\'s dust. It\'s fine.' : r.land === 'rough' ? 'You\'re down! Rolling counts!' : 'You\'re down! Welcome home, kid. From the sky.', 'land');
      for (const a of g.actors) if (a.def.crew) { a.setBehavior('dance'); a.say(['BRADY!!', 'WOOO!', 'Nailed it! Kind of!', 'Welcome home!'][Math.floor(Math.random() * 4)], 2); }
    }
    if (Sound.engine) Sound.engine(false, 0);
    bw14After(g, 1.4, () => { if (S.card) S.card.ready = true; });
  },
  cardInput(g) {
    const S = g.bw14, c = S.card, F = S.fly, p = g.player; if (!c || !c.ready || g.cine || g.dialog.open) return;
    const H = S.hudP || {}, kb = !(Input.usingTouch || Game.forceTouchUI);
    const go = H.bw14go || (kb && p.inp.jumpPressed), again = H.bw14again || (kb && p.inp.actionPressed);
    if (again && c.again) { burnsSfx('select'); BW14_W.resetJump(g); }
    else if (go && !c.hard) { burnsSfx('select'); S.card = null; BW14_W.ending(g); }
  },
  /* ---------------- the ending: bike, costume, onward to the Man ---------------- */
  ending(g) {
    const S = g.bw14, F = S.fly, p = g.player, C = BW14_CFG, L = C.LZ;
    g.missions.complete('jump');
    F.allowExit = true; F.release(p); F.setMode('idle'); F.allowExit = false;
    if (F.canP) F.canP.hidden = true;
    const bx = L.x + 4.5, bz = L.z - 3.5;
    p.teleport(L.x + 1.5, 0, L.z - 1, Math.atan2(bx - L.x, bz - L.z)); p.locked = true;
    const lumi = g.actor('lumi');
    const toMan = Math.atan2(-L.x, -L.z);
    g.cutscene([
      { music: 'burns_victory' },
      { cam: { x: L.x - 7, y: 2.6, z: L.z + 6, tx: L.x + 1, ty: 1.2, tz: L.z - 1, fov: 0.9 } },
      { say: [lumi || { name: 'LUMI' }, ['BRADY! You FELL out of the SKY! On PURPOSE!', 'We kept your yellow bike and your costume trunk safe. The Glow Crew never forgets.']] },
      { say: ['brady', ['Two days ago I couldn\'t get in through the gate. Today I came in through the roof.']] },
      { do: g2 => { S.trunkOpen = true; burnsSfx('costume'); g2.fx.confetti(p.x, p.y + 1.5, p.z, 40); g2.fx.burst(p.x, p.y + 1, p.z, 'star', 24, '#ff4fd8'); p.rebuildModel(); p.animOverride = 'victory'; g2.banner('SUITED UP', (BURNS_COSTUMES.find(c => c.id === BurnsSave.get().costume) || BURNS_COSTUMES[0]).name, { col: '#ff4fd8' }); } },
      { wait: 1.4 },
      { say: [lumi || { name: 'LUMI' }, ['Chinka\'s up on the Man\'s pavilion. Everybody saw her. She waved at your plane!', 'Go. GO! Ride like the wind. The wind is literally that way.']] },
      { do: g2 => { p.animOverride = null; if (!g2.bike) g2.giveItem('bike', true); const b = g2.bike; if (b) { b.x = bx; b.z = bz; b.y = 0; b.yaw = toMan; b.visible = true; p.teleport(bx, 0, bz, toMan); p.locked = false; b.mount(p); p.locked = true; } } },
      { cam: { x: L.x + 14, y: 7, z: L.z + 16, tx: 0, ty: 14, tz: 0, fov: 0.85 } },
      { say: ['brady', ['Hold on, Chinka. I\'m coming.']] },
      { do: g2 => { S.rideT = 0; burnsSfx('bike_bell'); } },
      { until: g2 => { S.rideT += 1 / 120; const b = g2.bike; if (b) { b.speed = Math.min(12, S.rideT * 6 + 0.5); b.yaw = toMan; } return S.rideT > 3.2; } },
      { fade: 'out', dur: 0.8 },
      { do: g2 => { const b = g2.bike; if (b && b.rider) { b.rider = null; p.vehicle = null; } p.locked = false; } }
    ], g2 => g2.finishWorld());
  },

  /* ---------------- airport mission bits ---------------- */
  // the runaway windsock: it hops away when Brady gets close, then snags on the fence
  SOCK_HOPS: [[396, 112], [372, 58], [356, 6], [364, -34]],
  updateSock(g, dt) {
    const S = g.bw14, K = S.sock, C = BW14_CFG; if (!K) return;
    const p = g.player, top = 6.6;
    if (K.mode === 'pole') { K.x = C.SOCK.x; K.z = C.SOCK.z; K.y = top; K.yaw = Math.atan2(C.WIND.x, C.WIND.z) + Math.sin(g.time * 1.3) * 0.15; K.pitch = 0.15 + Math.sin(g.time * 2.1) * 0.05; }
    else if (K.mode === 'fly') {
      K.t += dt / 1.1; const k = Math.min(1, K.t), to = this.SOCK_HOPS[K.hop];
      K.x = lerp(K.fx, to[0], k); K.z = lerp(K.fz, to[1], k); K.y = lerp(K.fy, 1.2, k) + Math.sin(k * Math.PI) * 7; K.yaw += dt * 6; K.pitch = Math.sin(g.time * 7) * 0.8;
      if (Math.random() < 0.5) g.fx.dust(K.x, K.y, K.z, 1, '#f4e0c0');
      if (k >= 1) { K.mode = 'rest'; K.t = 0; }
    } else if (K.mode === 'rest') {
      K.y = 1.2 + Math.abs(Math.sin(g.time * 3)) * 0.4; K.pitch = Math.sin(g.time * 4) * 0.4;
      const d = Math.hypot(p.x - K.x, p.z - K.z);
      const last = K.hop >= this.SOCK_HOPS.length - 1;
      if (!last && d < 7) { K.fx = K.x; K.fy = K.y; K.fz = K.z; K.hop++; K.mode = 'fly'; K.t = 0; burnsSfx('wind', { vol: 0.5 }, 'dust'); g.toast(['WHOOSH! It got away!', 'The wind says: NOPE.', 'So close!'][K.hop - 1] || 'WHOOSH!'); }
      if (last && d < 2.4 && p.y < 3) { K.mode = 'home'; K.t = 0; K.fx = K.x; K.fy = K.y; K.fz = K.z; burnsSfx('pick'); g.fx.burst(K.x, K.y, K.z, 'star', 14, '#ff7a2a'); g.banner('GOT THE WINDSOCK!', 'Back on the pole it goes', { col: '#ff9a4a', small: true }); }
    } else if (K.mode === 'home') {
      K.t += dt / 1.4; const k = Math.min(1, K.t);
      K.x = lerp(K.fx, C.SOCK.x, k); K.z = lerp(K.fz, C.SOCK.z, k); K.y = lerp(K.fy, top, k) + Math.sin(k * Math.PI) * 9; K.yaw += dt * 4;
      if (k >= 1) { K.mode = 'pole'; bw14Flag('sock', true); BW14_W.preflightStep(g, 'sock'); }
    }
    if (K.mv) { K.mv.x = K.x; K.mv.y = K.y; K.mv.z = K.z; K.mv.yaw = K.yaw; K.mv.pitch = K.pitch || 0; }
  },
  preflightStep(g, what) {
    const S = g.bw14, m = g.missions.get('preflight');
    if (!m || m.state === 'done') return;
    S.pf = S.pf || {}; if (S.pf[what]) return; S.pf[what] = true;
    const n = ['oilcap', 'sock', 'fuel'].filter(k => S.pf[k]).length;
    m.n = n;
    if (n >= 3) { const C = BW14_CFG; g.missions.complete('preflight', { x: C.PARK.x + 3, y: 1.4, z: C.PARK.z + 5 }); const d = g.actor('dusty'); if (d) d.say('Checklist complete! She\'s purring.', 3); }
    else g.toast('PRE-FLIGHT ' + n + '/3');
  },
  giveRig(g) {
    const p = g.player, spec = BurnsRig.bradySpec('none');
    spec.acc = (spec.acc || []).concat(['bw14Rig']);
    spec.key = 'brady14:' + JSON.stringify(spec);
    p.model = BurnsRig.model(spec); p.ch.setModel(p.model);
  },
  plainBrady(g) {
    const p = g.player, spec = BurnsRig.bradySpec('none'); spec.key = 'brady:' + JSON.stringify(spec);
    p.model = BurnsRig.model(spec); p.ch.setModel(p.model);
  },

  /* ---------------- intro ---------------- */
  intro(g) {
    const S = g.bw14, p = g.player, C = BW14_CFG;
    p.teleport(C.SPAWN.x, 0, C.SPAWN.z + 18, Math.PI); p.locked = true;
    g.cutscene([
      { music: 'burns_intro' },
      { cam: { x: 520, y: 60, z: 330, tx: 420, ty: 0, tz: 140, fov: 0.9 } },
      { banner: [BurnsWorlds.label(14).toUpperCase(), 'SKYDIVE INTO THE BURN', { col: '#ff9a4a', big: true, dur: 3 }] },
      { cam: { from: { x: 520, y: 60, z: 330, tx: 420, ty: 0, tz: 140, fov: 0.9 }, to: { x: C.SPAWN.x - 5, y: 2.4, z: C.SPAWN.z + 26, tx: C.SPAWN.x, ty: 1.6, tz: C.SPAWN.z + 16, fov: 0.85 }, dur: 3.5 } },
      { say: ['brady', ['Revoked. My ticket got REVOKED.', 'By a Ranger with a clipboard and a "cop" in a jester hat. Escorted out of my own city.']] },
      { cam: { x: 378, y: 2.4, z: 222, tx: 366, ty: 1.5, tz: 230, fov: 0.85 } },
      { say: [{ name: 'RANGER RAMSEY', model: BurnsRig.model(BurnsRig.npcSpec('ranger', 14)) }, ['And STAY out. On foot, anyway.']] },
      { say: [{ name: '"DAVE" (A REGULAR BURNER)', model: BurnsRig.model(BurnsRig.npcSpec('undercovercop', 14)) }, ['Groovy.']] },
      { cam: { x: C.SPAWN.x - 5, y: 2.4, z: C.SPAWN.z + 26, tx: C.SPAWN.x, ty: 1.6, tz: C.SPAWN.z + 16, fov: 0.85 } },
      { say: ['brady', ['And Chinka is on top of the Man\'s pavilion. Waiting for me.']] },
      { do: g2 => { S.flyby = 0; burnsSfx('artcarHorn', { pitch: 0.5, vol: 0.4 }); } },
      { cam: { x: C.SPAWN.x - 4, y: 1.8, z: C.SPAWN.z + 24, tx: C.SPAWN.x + 20, ty: 40, tz: C.SPAWN.z - 60, fov: 0.95 } },
      { wait: 1.6 },
      { say: ['brady', ['...If I can\'t get in through the gate...', 'I\'ll come in through the SKY.']] },
      { do: g2 => { bw14Flag('intro', true); p.locked = false; p.teleport(C.SPAWN.x, 0, C.SPAWN.z, Math.PI); g2.camYaw = Math.PI; g2.snapCam = true; bw14Music(g2); } },
      { banner: ['FIND A PILOT', 'The little airstrip at the edge of the playa', { col: '#ffd84a' }] }
    ]);
  }
};
function bw14Music(g) { burnsMusic(burnsHas(Sound.trackNames, 'burns_w14') ? 'burns_w14' : 'burns_w3'); }

BurnsWorlds.register({
  id: 14, name: 'Skydive Into the Burn', sub: 'Fly in. Fall in. Land on your bike.',
  sky: BW14_SKY_A, sky2: BW14_SKY_B, tod: 0.05,
  music: 'burns_w3',
  bounds: BW14_CFG.BOUNDS,
  spawn: { x: BW14_CFG.SPAWN.x, y: 0, z: BW14_CFG.SPAWN.z, yaw: Math.PI },
  ground: { base: '#d6ae86', crack: 0.24, mottle: 0.36, res: 0.625 },
  dust: 0.7,
  missions: [
    { id: 'pilot', name: 'Find a Pilot', type: 'talk', target: 'dusty', start: 'auto', token: false, short: 'Find a pilot at the airstrip', marker: { x: 433, z: 146 },
      desc: 'The gate won\'t let you back in. The sky might. Somebody here owns a plane.', hint: 'The cream plane with bunny ears, by the runway' },
    { id: 'preflight', name: 'Pre-Flight Check', type: 'custom', count: 3, giver: 'dusty', start: 'manual', requires: ['pilot'], progressLabel: 'Pre-flight', short: 'Oil cap · windsock · fuel', marker: { x: 484, z: 118 },
      desc: 'Captain Dusty\'s checklist: find the oil cap, catch the runaway windsock, drive the fuel truck to the plane.', hint: 'Hangar (oil cap), runway edge (windsock), fuel depot (truck)' },
    { id: 'chute', name: 'Packed With Love', type: 'custom', token: false, giver: 'rosie', start: 'manual', requires: ['pilot'], short: 'Get your parachute from Rigger Rosie', marker: { x: 474, z: 82 },
      desc: 'Rigger Rosie packed you a rainbow chute. A sparkle pony "borrowed" the pilot chute as a cape.', hint: 'The packing shade by the hangar; the pony hangs out by the terminal' },
    { id: 'briefing', name: 'Safety Third', type: 'custom', token: false, giver: 'captain', start: 'manual', requires: ['pilot'], short: 'Sit through the safety briefing', marker: { x: 486, z: 176 },
      desc: 'Nobody flies until the Safety Third Captain has briefed them. Thoroughly. Ish.', hint: 'The folding chairs behind the terminal shack' },
    { id: 'board', name: 'Wheels Up', type: 'custom', token: false, giver: 'dusty', start: 'manual', requires: ['preflight', 'chute', 'briefing'], short: 'Climb aboard the Dust Bunny', marker: { x: 433, z: 146 },
      desc: 'Oil, wind, fuel, chute, briefing: done. Climb in. You\'re flying.', hint: 'Captain Dusty at the Dust Bunny', lockedDesc: 'Pre-flight, a parachute and the safety briefing first.' },
    { id: 'takeoff', name: 'Smooth Takeoff', type: 'custom', start: 'manual', requires: ['board'], tokenDirect: true, short: 'Lift off on the strip, no bounces',
      desc: 'Throttle up, pull back at 50 knots, stay on the strip and keep climbing to 30 m without touching down or bonking anything.', hint: 'The runway (you can fly again from the airstrip)' },
    { id: 'rings', name: 'Ring Run', type: 'custom', start: 'manual', requires: ['board'], tokenDirect: true, short: 'Fly through all 13 rings',
      desc: 'Thirteen glowing rings lead over the deep-playa art: the rocket, the giant, the pump jack, the knotted semi and more.', hint: 'The sky over the deep playa' },
    { id: 'needle', name: 'Thread the Needle', type: 'custom', start: 'manual', secret: true, tokenDirect: true, short: 'Fly under the Leaning Lighthouses',
      desc: 'Two lighthouses lean together out in the deep playa. There\'s a gap under the kiss. A small plane fits. Probably.', hint: 'The Leaning Lighthouses, deep playa' },
    { id: 'formation', name: 'Freefall Formation', type: 'custom', start: 'manual', requires: ['board'], tokenDirect: true, short: 'Fall through all 5 formation rings',
      desc: 'The Glow Crew\'s friends hung five LED formation rings under the drop zone. Steer through every one before you pull.', hint: 'Freefall, below the drop zone' },
    { id: 'bullseye', name: 'Bullseye Landing', type: 'custom', start: 'manual', requires: ['board'], tokenDirect: true, short: 'Land in the bullseye (4 m)',
      desc: 'The Glow Crew laid out a target next to your bike. Land inside the pink bullseye. Flare just before touchdown.', hint: 'The Glow Crew camp, 4:40 & Esplanade' },
    { id: 'jump', name: 'Skydive Into the Burn', type: 'custom', token: false, start: 'manual', requires: ['board'], short: 'Skydive into the Burn',
      desc: 'Fly over the city, jump at the drop zone, pull in the green, steer to the Glow Crew, land by your bike.', hint: 'The drop zone over the Man' }
  ],
  build(api, g) {
    const C = BW14_CFG, R = api.rng, W = BW14_W;
    const S = g.bw14 = { timers: [], pf: {}, dz: W.DZ, hudP: {} };
    W.state = S;
    BW14_City.begin();
    /* ---------------- ground + the flyover city ---------------- */
    BW14_City.paint(api);
    const L = C.LZ;
    const avoid = [{ x: L.x, z: L.z, r: 34 }, Object.assign(bw14Clock(6, 182), { r: 36 }), Object.assign(bw14Clock(3, 248), { r: 18 }), Object.assign(bw14Clock(9, 248), { r: 18 }), Object.assign(bw14Clock(4.5, 248), { r: 18 }), Object.assign(bw14Clock(7.5, 248), { r: 18 })];
    BW14_City.camps(api, avoid);
    BW14_City.landmarks(api, avoid);
    BW14_City.centerCamp();
    BW14_City.temple();
    BW14_City.fence();
    BW14_City.ART.find(a => a.id === 'lighthouses').yaw = -1.45;
    BW14_City.art(api, g);
    S.man = BW14_City.man(api, g);
    S.artCars = BW14_City.artCars(api, g);
    // hot art with thermals: the plaza fire pieces + the Ember Bloom by the landing zone
    BW14_City.hotArt(api, g, bw14Clock(7.5, 248).x, bw14Clock(7.5, 248).z, 'the Flame Lotus', 8, 18);
    BW14_City.hotArt(api, g, bw14Clock(4.5, 248).x, bw14Clock(4.5, 248).z, 'the Ember Tree', 8, 18);
    BW14_City.hotArt(api, g, L.x + 46, L.z - 34, 'the Ember Bloom', 6, 12);
    // the Leaning Lighthouses' arch frame (for Thread the Needle)
    { const A = BW14_City.ART.find(a => a.id === 'lighthouses'); S.lh = { x: A.x, z: A.z, ax: Math.cos(A.yaw), az: -Math.sin(A.yaw), nx: Math.sin(A.yaw), nz: Math.cos(A.yaw) }; }
    /* ---------------- the airstrip ---------------- */
    const RW = C.RWY;
    for (let z = RW.z1; z <= RW.z0; z += 23) for (const sd of [-1, 1]) { api.cylinder(RW.x + sd * (RW.w / 2 + 0.8), 0, z, 0.45, 0.32, '#f4f0e8', { round: 0.12, noCol: true }); }
    for (const zt of [RW.z0 + 2, RW.z1 - 2]) for (let k = -4; k <= 4; k++) api.glow(RW.x + k * 2.4, 0.4, zt, 0.5, zt > 100 ? '#7aff5a' : '#ff3b3b', { blink: 2 });
    // the windsock (pole + the sock as a mover)
    api.cylinder(C.SOCK.x, 0, C.SOCK.z, 0.12, 6.5, '#c8c8d0', { round: 0.04, col: { camPass: true } });
    api.sphere(C.SOCK.x, 6.45, C.SOCK.z, 0.16, '#ff3b3b', { noCol: true, e: 0.6 });
    S.sock = { mode: bw14Flag('sock') ? 'pole' : 'pole', x: C.SOCK.x, y: 6.6, z: C.SOCK.z, yaw: 0, pitch: 0, hop: 0, t: 0 };
    S.sock.mv = api.mover(m => { BW14_Model.sock(m); return { cols: [] }; }); S.sock.mv.noCollide = true;
    api.sign('WINDSOCK\n(WHEN PRESENT)', C.SOCK.x + 2.2, C.SOCK.z + 1, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 28 } });
    // the Dust Bunny (puppet) + its colliders while parked
    const F = S.fly = new BW14_Fly(g, S);
    { const m = new BurnsMesh(8192); BW14_Model.plane(m, { skinned: true }); F.planeP = new BW14_Puppet(g, m.geo(), BW14_PLANE.NB); g.addBoss(F.planeP); }
    { const m = new BurnsMesh(4096); BW14_Model.canopy(m); F.canP = new BW14_Puppet(g, m.geo(), 3); F.canP.hidden = true; g.addBoss(F.canP); }
    S.geos = [F.planeP.model.geo, F.canP.model.geo];
    F.placePlane(C.PARK.x, C.PARK.z, C.PARK.yaw); F.setMode('parked'); F.posePlane(0);
    {
      const c = Math.cos(C.PARK.yaw), s = Math.sin(C.PARK.yaw);
      S.parkCols = BW14_Model.planeCols().map(d => Object.assign({}, d, { x: C.PARK.x + d.x * c + d.z * s, z: C.PARK.z - d.x * s + d.z * c, yaw: C.PARK.yaw, walk: true, tag: 'bw14plane' }));
      F.planeP.addColliders = () => { if (F.mode === 'parked') for (const d of S.parkCols) g.world.col.addDyn(d); };
    }
    // Dusty's hammock under the wing (strung between the strut and a post)
    {
      const hx = C.PARK.x + 2.2, hz = C.PARK.z + 1.2;
      api.cylinder(hx + 3.2, 0, hz, 0.1, 1.9, '#8a6a4a', { round: 0.04 });
      api.mesh(hx, hz, m => { m.color('#ff7a2a'); m.surf(8, 3, (u, v, o) => { o[0] = lerp(-2.6, 2.6, u); o[1] = 1.15 - Math.sin(u * Math.PI) * 0.45; o[2] = lerp(-0.45, 0.45, v); }, {}); m.surf(8, 3, (u, v, o) => { o[0] = lerp(2.6, -2.6, u); o[1] = 1.13 - Math.sin(u * Math.PI) * 0.45; o[2] = lerp(-0.45, 0.45, v); }, {}); return { cols: [] }; });
    }
    api.npc({ id: 'dusty', name: 'CAPTAIN DUSTY', spec: BW14_W.dustySpec(), x: C.PARK.x + 2.2, z: C.PARK.z + 1.2, y: 0.55, fixedY: true, yaw: Math.PI / 2, behavior: 'sleep', chatter: false,
      onWake(g2, a) { BW14_W.talkDusty(g2, a); },
      talk(g2, a) { BW14_W.talkDusty(g2, a); } });
    // the hangar (Quonset) with last night's "Hangar Rave" leftovers
    {
      const H = C.HANGAR, len = 24, rad = 9;
      api.mesh(H.x, H.z, m => {
        m.color('#c8ccd4').shine(2);
        const arc = (r, flip) => m.surf(16, 6, (u, v, o) => { const a = u * Math.PI; o[0] = lerp(-len / 2, len / 2, v); o[1] = Math.sin(a) * r; o[2] = Math.cos(a) * r; }, { out: [0, 0, 0], flip: !!flip });
        arc(rad); m.color('#8a8e98'); arc(rad - 0.15, true);
        m.color('#9aa0a8'); for (let k = -2; k <= 2; k++) { m.push(); m.tf(k * len / 4.5, 0, 0, 0, 0, Math.PI / 2); m.torus(0, 0, 0, rad + 0.05, 0.08, { seg: 20, tseg: 4, sy: 1 }); m.pop(); }
        m.color('#b8bcc4'); m.push(); m.tf(len / 2, 0, 0, Math.PI / 2); for (const sd of [-1, 1]) m.surf(10, 2, (u, v, o) => { const a = u * Math.PI, r = v * rad; o[0] = Math.cos(a) * r; o[1] = Math.sin(a) * r; o[2] = sd * 0.02; }, { out: [0, 0, -sd] }); m.pop();
        m.color('#ff4fd8', 1); for (let k = 0; k < 9; k++) { const a = k / 8 * Math.PI; m.ball(-len / 2 + 0.2, Math.sin(a) * (rad - 0.4), Math.cos(a) * (rad - 0.4), 0.18, { seg: 6, rings: 4 }); } m.emissive(0).shine(0);
        return { cols: [
          { t: 'box', x: 0, z: rad - 0.45, hx: len / 2, hz: 0.45, y0: 0, y1: 4.2 }, { t: 'box', x: 0, z: -(rad - 0.45), hx: len / 2, hz: 0.45, y0: 0, y1: 4.2 },
          { t: 'box', x: len / 2 - 0.3, z: 0, hx: 0.3, hz: rad, y0: 0, y1: 8 },
          { t: 'box', x: 0, z: 0, hx: len / 2, hz: 3.4, y0: 8.4, y1: 9.0 }, { t: 'box', x: 0, z: 5.6, hx: len / 2, hz: 1.6, y0: 7.0, y1: 7.6 }, { t: 'box', x: 0, z: -5.6, hx: len / 2, hz: 1.6, y0: 7.0, y1: 7.6 }
        ], lights: [{ x: 0, y: 0, z: 0, s: 0, c: '#ffb070', pool: 14 }] };
      });
      api.sign('HANGAR 1\nLAST NIGHT\'S RAVE: OVER', H.x - len / 2 - 0.3, H.z + 6.5, { yaw: -Math.PI / 2, h: 1.1, style: { bg: '#1a0a2a', fg: '#ff9ad8', glow: '#ff4fd8', size: 28, border: '#ff4fd8' }, glow: '#ff4fd8' });
      // the speaker stack (oil cap on top) + crate steps
      const sx = H.x + 4, sz = H.z - 4;
      api.roundBox(sx - 3.2, 0, sz + 2, 1.4, 1.0, 1.4, '#8a6a3a');
      api.roundBox(sx - 1.6, 0, sz + 0.8, 1.4, 2.0, 1.4, '#7a5a3a');
      api.roundBox(sx, 0, sz, 2.2, 3.1, 2.0, '#1a1a20', { r: 0.12 });
      api.roundBox(sx, 3.1, sz, 1.8, 1.1, 1.6, '#24242c', { r: 0.12 });
      api.mesh(sx - 1.12, sz, m => { for (const yy of [0.9, 2.1, 3.65]) { m.push(); m.tf(0, yy, 0, 0, 0, Math.PI / 2); m.color('#3a3a44').shine(1); m.roundCyl(0, -0.04, 0, yy > 3 ? 0.32 : 0.42, 0.08, 0.03, { seg: 14 }); m.color('#ff4fd8', 0.8); m.roundCyl(0, -0.06, 0, 0.1, 0.1, 0.03, { seg: 8 }); m.pop(); } m.emissive(0).shine(0); return { cols: [] }; });
      api.pickup('item:oilcap', sx, 5.1, sz, { mission: 'preflight', gate: true, label: 'OIL CAP', icon: 'drop', id: 'oilcap', persist: false, onTake: g2 => { bw14Flag('oilcap', true); BW14_W.preflightStep(g2, 'oilcap'); g2.toast('GOT THE OIL CAP! (it smells like tequila)'); } });
      api.glowArc(sx - 3.2, 1.6, sz + 2, sx, 5.2, sz, 1.0, 5);
      // a sibling plane in the hangar + a workbench
      api.mesh(H.x - 3, H.z + 3.5, m => { m.tf(0, BW14_PLANE.GEAR_H, 0, 0.5, 0, 0, 0.82); BW14_Model.plane(m, { body: '#2fa8b8', belly: '#ffe24a', stripe: '#ff4fd8', trim: '#ffe24a', name: 'PLAYA PELICAN', ears: false }); return { cols: [{ t: 'box', x: 0, z: 0, hx: 0.6, hz: 3.4, y0: 0, y1: 2.0 }] }; });
      api.roundBox(H.x + 9, 0, H.z + 6, 3.4, 1.0, 1.2, '#6a4a2a', { r: 0.1 });
      api.mesh(H.x + 2, H.z, m => { m.color('#d8e0f0', 0.3).shine(3); m.ball(0, 7.2, 0, 0.7, { seg: 12, rings: 8 }); m.emissive(0).shine(0); m.color('#3a3a44'); m.limb(0, 7.9, 0, 0, 8.9, 0, 0.02, 0.02, { seg: 3 }); return { cols: [] }; });
      for (let k = 0; k < 10; k++) api.glow(H.x - 10 + k * 2.2, 6.2 + Math.sin(k) * 0.5, H.z + Math.cos(k * 1.3) * 5, 0.45, BURNS_NEON[k % 7], { blink: 3 });
      api.light(H.x, H.z, 14, '#ff6ad0', 0.35);
      api.npc({ type: 'burner', seed: 141, name: 'RAVE SURVIVOR', x: H.x + 7, z: H.z + 3, behavior: 'sleep', chatter: false, lines: ['Is the rave over? ...Is it Tuesday?', 'Somebody was using an oil cap as a shot glass. Top of the speakers. Not me. Probably.'] });
    }
    // the terminal shack, its signs, the free water, the control tower (photo 1)
    {
      const T = C.SHACK;
      api.roundBox(T.x, 0, T.z, 7, 3.2, 5, '#e8dcc4', { r: 0.25, top: '#c8a878' });
      api.prop('shade', { x: T.x - 5, z: T.z, w: 4, d: 6, h: 2.6, col: '#ff9a4a' });
      api.sign('BRC INTERNATIONAL\n(NOT INTERNATIONAL)', T.x - 3.6, T.z, { yaw: -Math.PI / 2, y: 2.3, post: false, h: 1.0, style: { bg: '#2fa8b8', fg: '#ffffff', size: 28, border: '#ffffff' } });
      const signs = [['NO TSA.\nJUST VIBES.', T.x - 8, T.z + 6], ['LOST & FOUND:\nYOUR DIGNITY', T.x - 8, T.z - 4], ['BAGGAGE CLAIM:\nIT\'S ALL BAGGAGE', T.x + 5, T.z + 8]];
      for (const [t, x, z] of signs) api.sign(t, x, z, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 28, border: '#3a1a10' } });
      api.prop('cooler', { x: T.x - 4.4, z: T.z + 2.4, col: '#2a8ac8' });
      api.sign('FREE WATER\n(HYDRATE!)', T.x - 4.4, T.z + 3.4, { yaw: -Math.PI / 2, y: 0.9, post: false, h: 0.6, style: { bg: '#2a8ac8', fg: '#ffffff', size: 26 } });
      // control tower (a scaffold) with photo 1 at the top
      api.prop('scaffold', { x: T.x + 7, z: T.z - 9, levels: 4, lh: 2.2, w: 3, d: 3 });
      api.sign('CONTROL TOWER\n(VIBES ONLY)', T.x + 7, T.z - 7.2, { y: 9.4, post: false, h: 0.9, style: { bg: '#ffe24a', fg: '#2a1a10', size: 26, border: '#2a1a10' } });
      api.pickup('photo', T.x + 7, 10.0, T.z - 9, { id: 'p1' });
      api.glowArc(T.x + 5.5, 1.2, T.z - 9, T.x + 7, 8.8, T.z - 9, 1.0, 6);
      api.light(T.x, T.z, 12, '#ffd8a0', 0.4);
      api.npc({ id: 'greeterAir', type: 'greeter', seed: 14, name: 'AIRPORT GREETER', x: T.x - 6, z: T.z - 1.6, yaw: -Math.PI / 2,
        lines: ['Welcome hooome! By AIR! ...Wait, you\'re LEAVING? Nobody leaves by air. Except skydivers.', 'Free water in the cooler. Hydrate or die-drate, flyboy.'], gift: { kind: 'water' } });
      api.npc({ id: 'pony', name: 'STARDUST', spec: BW14_W.ponySpec(), x: T.x - 10, z: T.z + 4, behavior: 'wander', radius: 6, speed: 1.1,
        talk(g2, a) { BW14_W.talkPony(g2, a); }, marker: (g2, a) => g2.missions.state('chute') === 'active' && !bw14Flag('pilotchute') ? '?' : null });
      // arriving burners (by air), gifting
      api.crowd(T.x - 14, T.z + 14, 3.2, 5, { types: ['burner', 'furcoat', 'tutu', 'ledsuit', 'sparklepony'], behaviors: ['dance', 'idle', 'wander', 'dance'], lines: ['Flew in from Reno! Fastest line ever!', 'Welcome home! We packed nothing but glitter.', 'The pilot let me hold the map. I held it upside down.'] });
      for (let i = 0; i < 4; i++) api.prop('cooler', { x: T.x - 15 + i * 1.6, z: T.z + 20, col: BURNS_NEON[i] });
      api.npc({ type: 'furcoat', seed: 33, name: 'JUST LANDED', x: T.x - 11, z: T.z + 18, yaw: 0.5, lines: ['Just flew in! Here, glow sticks for the walk!', 'Pro tip: wear goggles on the plane. And off the plane. Always goggles.'], gift: { kind: 'glowstick', n: 8 } });
    }
    // briefing area: chairs, a whiteboard, the Safety Third Captain
    {
      const B = C.BRIEF;
      api.prop('shade', { x: B.x, z: B.z, w: 9, d: 7, col: '#ffe0a0' });
      for (let r = 0; r < 2; r++) for (let k = 0; k < 3; k++) api.prop('chair', { x: B.x - 2 + k * 2, z: B.z + 1 + r * 2, yaw: Math.PI, col: BURNS_NEON[(r * 3 + k) % 7] });
      api.sign('SAFETY THIRD\n1. FUN  2. ???  3. SAFETY', B.x, B.z - 2.8, { h: 1.3, style: { bg: '#ffffff', fg: '#c81a3a', size: 28, border: '#3a3a44' } });
      api.npc({ id: 'captain', name: 'SAFETY THIRD CAPTAIN', type: BURNS_NPC_TYPES.safetycaptain ? 'safetycaptain' : 'burner', spec: BURNS_NPC_TYPES.safetycaptain ? undefined : BW14_W.captainSpec(), seed: 3, x: B.x + 1.5, z: B.z - 1.5, yaw: 0,
        talk(g2, a) { BW14_W.talkCaptain(g2, a); } });
      api.npc({ id: 'dummy', name: 'DUMMY', spec: BW14_W.dummySpec(), x: B.x - 1.8, z: B.z - 1.8, yaw: 0.3, noTalk: true, chatter: false, behavior: 'idle', anim: 'idle', lookAt: false });
    }
    // the rigger's packing shade
    {
      const RG = C.RIGGER;
      api.prop('shade', { x: RG.x, z: RG.z, w: 16, d: 6, col: '#c8b8e8' });
      api.mesh(RG.x, RG.z, m => { const cols = ['#ff4f6a', '#ffd84a', '#38c8ff', '#7ae85a', '#ff4fd8']; for (let k = 0; k < 4; k++) { m.color('#3a2a4a'); m.roundBox(-6 + k * 3.6, 0.03, 0, 2.6, 0.06, 4.6, 0.03); for (let c = 0; c < 5; c++) { m.color(cols[(c + k) % 5]); m.roundBox(-6 + k * 3.6, 0.1 + c * 0.03, -1.6 + c * 0.7, 2.2, 0.06, 0.62, 0.03); } } return { cols: [] }; });
      api.sign('RIGGER ROSIE\nPACKED WITH LOVE', RG.x - 8.5, RG.z + 3, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#2a0a2a', fg: '#ff9ad8', size: 28, border: '#ff4fd8' } });
      api.npc({ id: 'rosie', name: 'RIGGER ROSIE', spec: BW14_W.rosieSpec(), x: RG.x - 2, z: RG.z - 0.5, yaw: -Math.PI / 2,
        talk(g2, a) { BW14_W.talkRosie(g2, a); } });
    }
    // another little plane tied down on the apron (no name decal: saves sign-atlas space)
    api.mesh(447, 176, m => { m.tf(0, BW14_PLANE.GEAR_H * 0.85, 0, 0, 0, 0, 0.85); BW14_Model.plane(m, { body: '#ffd84a', belly: '#9a6bff', stripe: '#ff4fd8', trim: '#38f2ff', name: false, ears: false, led: false }); return { cols: BW14_Model.planeCols().map(c => Object.assign({}, c, { x: c.x * 0.85, z: c.z * 0.85, hx: c.hx && c.hx * 0.85, hz: c.hz && c.hz * 0.85, r: c.r && c.r * 0.85, y0: c.y0 * 0.85, y1: c.y1 * 0.85 })) }; }, { yaw: -Math.PI / 2 - 0.25 });
    for (const sd of [1, -1]) api.cylinder(447 + Math.sin(-Math.PI / 2 - 0.25 + sd * Math.PI / 2) * 4.6, 0, 176 + Math.cos(-Math.PI / 2 - 0.25 + sd * Math.PI / 2) * 4.6, 0.18, 0.4, '#3a3a44', { noCol: true });
    // the fuel depot + the fuel truck (drivable)
    {
      const FU = C.FUEL;
      api.mesh(FU.x + 6, FU.z - 4, m => { m.color('#d8dce4').shine(3); m.push(); m.tf(0, 2.6, -5, 0, Math.PI / 2, 0); m.lathe([[0, 0], [1.9, 0.05], [2.1, 0.4], [2.1, 9.6], [1.9, 9.95], [0, 10]], { seg: 18 }); m.pop(); m.color('#ff3a2a'); for (const z of [-3, 3]) { m.roundBox(0, 0.4, z, 3.2, 0.8, 0.8, 0.12); } m.shine(0); return { cols: [{ t: 'box', x: 0, z: 0, hx: 2.2, hz: 5.2, y0: 0, y1: 4.7 }] }; });
      api.sign('AVGAS\nNO OPEN FLAMES', FU.x + 1, FU.z + 3, { yaw: -Math.PI / 2, h: 1.0, style: { bg: '#ffe24a', fg: '#c81a1a', size: 26, border: '#c81a1a' } });
      S.truck = api.artCar({ x: FU.x - 6, z: FU.z + 14, yaw: -Math.PI / 2, build: m => BW14_Model.fuelTruck(m), maxSpeed: 9, accel: 4, turn: 1.1, label: 'DRIVE THE FUEL TRUCK',
        when: g2 => g2.missions.state('preflight') === 'active' && !(g2.bw14.pf && g2.bw14.pf.fuel) });
      api.npc({ id: 'gary', name: 'GASOLINE GARY', type: 'dpw', seed: 21, x: FU.x - 3, z: FU.z + 18, yaw: -Math.PI / 2, behavior: 'sit',
        talk(g2, a) { BW14_W.talkGary(g2, a); } });
      api.prop('chair', { x: FU.x - 3, z: FU.z + 18, yaw: -Math.PI / 2, col: '#3a6a8a' });
    }
    // walls of the airport (the city fence keeps Brady on the airstrip until he flies)
    for (let z = -36; z < 300; z += 20) api.prop('fence', { x: 352, z: z + 10, yaw: Math.PI / 2, len: 20 });
    for (let x = 352; x < 560; x += 20) { api.prop('fence', { x: x + 10, z: -38, len: 20 }); }
    // the Man's goons from the Workshops, guarding the fence they walked Brady out through
    api.npc({ id: 'goonRanger', name: 'RANGER RAMSEY', type: 'ranger', seed: 14, x: 366, z: 226, yaw: Math.PI / 2, behavior: 'idle',
      lines: ['Ticket: revoked. Per the principles. Specifically principle eleven, which I wrote this morning.', 'The city is closed to you ON FOOT, sir. I was very specific about the feet.', 'I\'m not a cop. HE is. ...Undercover.'] });
    api.npc({ id: 'goonCop', name: '"DAVE" (A REGULAR BURNER)', type: 'undercovercop', seed: 14, x: 366, z: 233, yaw: Math.PI / 2, behavior: 'idle',
      lines: ['Greetings, fellow burner. Nothing to see here. Groovy.', 'Is that a parachute? ...Carry on, citizen. I mean. Groovy.'] });
    api.sign('CITY FENCE\nRANGERS SAY: NOPE', 356, 160, { yaw: Math.PI / 2, h: 1.1, style: { bg: '#f4e8c8', fg: '#3a1a10', size: 28, border: '#c81a1a' } });
    api.sign('BLACK ROCK MUNICIPAL AIRSTRIP\nPOP: WHOEVER LANDS', C.SPAWN.x + 5, C.SPAWN.z - 4, { yaw: 0, h: 1.3, style: { bg: '#2a1a3a', fg: '#ffd84a', size: 28, border: '#ffd84a' } });
    api.checkpoint('cp_road', C.SPAWN.x - 4, C.SPAWN.z - 12, { yaw: Math.PI, name: 'Airstrip Road' });
    api.checkpoint('cp_hangar', 462, 108, { yaw: Math.PI, name: 'The Hangar' });
    // glow sticks around the airstrip (paths that teach the tasks), water, ground score
    api.glowLine(C.SPAWN.x, C.SPAWN.z - 6, C.SPAWN.x - 6, 212, 9);
    api.glowLine(450, 186, 440, 150, 6);
    api.glowLine(455, 130, 470, 100, 6);
    api.glowLine(420, 60, 380, 60, 8, 0.9);
    api.glowLine(360, 40, 366, -24, 7);
    api.glowRing(C.PARK.x, C.PARK.z, 8, 10);
    api.glowLine(500, 88, 470, 120, 6);
    api.glowArc(C.SOCK.x - 3, 1, C.SOCK.z, C.SOCK.x - 18, 1, C.SOCK.z, 3, 6);
    api.pickup('water', 470, 0.9, 160); api.pickup('water', 380, 0.9, 30);
    api.pickup('bag:bufo', 520, 0.9, 210); api.pickup('bag:powder', 512, 0.9, 40);
    // a tech bro pitching a skydiving app, an influencer shooting on the runway
    api.enemy({ type: 'techbro', seed: 14, x: 440, z: 214, behavior: 'pitcher', hp: 2, pitches: ['UBER FOR SKYDIVING!', 'PLUMMET.APP!', 'SERIES A-LTITUDE!', 'DISRUPT GRAVITY!'] });
    api.enemy({ type: 'influencer', seed: 14, x: 398, z: 190, behavior: 'flasher', hp: 2 });
    // air colliders for the airstrip buildings (the plane bonks off them instead of flying through)
    BW14_City.obstacle('the hangar', C.HANGAR.x - 12, 3, C.HANGAR.z, C.HANGAR.x + 12, 3, C.HANGAR.z, 9);
    BW14_City.obstacle('the terminal', C.SHACK.x, 0, C.SHACK.z, C.SHACK.x, 3, C.SHACK.z, 4.5);
    BW14_City.obstacle('the control tower', C.SHACK.x + 7, 0, C.SHACK.z - 9, C.SHACK.x + 7, 10, C.SHACK.z - 9, 2.6);
    BW14_City.obstacle('the fuel tank', C.FUEL.x + 6, 2.6, C.FUEL.z - 9, C.FUEL.x + 6, 2.6, C.FUEL.z + 1, 2.4);
    api.marker('plane', C.PARK.x, C.PARK.z, 'Dust Bunny', { col: '#ff9a4a' });
    api.marker('hangar', C.HANGAR.x, C.HANGAR.z, 'Hangar', { col: '#c8ccd4' });
    /* ---------------- the landing zone: the Glow Crew camp ---------------- */
    {
      api.prop('dome', { x: L.x - 15, z: L.z + 9, r: 6, col: '#e8e0f0', lights: true });
      for (let i = 0; i < 3; i++) api.prop('portapotty', { x: L.x + 14 + i * 1.35, z: L.z - 7, yaw: Math.PI, col: ['#2a6ac8', '#3a8a3a', '#2a6ac8'][i] });
      api.prop('rv', { x: L.x - 9, z: L.z - 17, yaw: 1.2, seed: 1414 });
      api.prop('shade', { x: L.x + 15, z: L.z + 13, w: 7, d: 6, col: '#ffb0c8' });
      api.prop('couch', { x: L.x + 15, z: L.z + 12, yaw: Math.PI, col: '#5a2a8a' });
      api.sign('THE GLOW CREW\n(LAND HERE, BRADY)', L.x + 6, L.z + 18, { yaw: Math.PI + 0.3, h: 1.3, style: { bg: '#1a0a2a', fg: '#7aff5a', glow: '#38f2ff', size: 28, border: '#7aff5a' }, glow: '#7aff5a' });
      api.prop('crate', { x: L.x + 6.5, z: L.z - 2, s: 1.1 });
      api.sign('BRADY\'S\nCOSTUME', L.x + 6.5, L.z - 2, { y: 1.15, post: false, h: 0.5, style: { bg: '#ff4fd8', fg: '#ffffff', size: 26 } });
      api.mesh(L.x + 4.5, L.z - 3.5, m => { BurnsProps.bikeShape(m, 0, 0, 0, Math.atan2(-L.x, -L.z), '#ffd21a'); return { cols: [] }; });
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; api.glow(L.x + Math.sin(a) * 20, 0.35, L.z + Math.cos(a) * 20, 0.6, BURNS_NEON[i % 7], { blink: 4 }); }
      api.light(L.x, L.z, 22, '#ff4fd8', 0.22);
      const crewTypes = ['ledsuit', 'tutu', 'burner', 'furcoat', 'sparklepony'];
      for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.4; api.npc({ type: crewTypes[i], seed: 400 + i, x: L.x + Math.sin(a) * 11, z: L.z + Math.cos(a) * 11, yaw: a + Math.PI, behavior: 'idle', anim: 'cheer', crew: true, chatter: false, lines: ['Land on the X! We believe in you! Mostly!'] }); }
      api.npc({ id: 'lumi', name: 'LUMI (GLOW CREW)', type: 'ledsuit', seed: 77, x: L.x + 3.5, z: L.z + 5, yaw: Math.PI, behavior: 'idle', anim: 'wave', crew: true, chatter: false, lines: ['We\'ve got your bike. And your costume. Just land, Brady!'] });
      // glow sticks spiralling down over the target (canopy)
      for (let i = 0; i < 12; i++) { const a = i * 0.9, r = 26 - i * 1.4; api.pickup('glowstick', L.x + Math.sin(a) * r, 40 - i * 2.5, L.z + Math.cos(a) * r, { bw14air: true }); }
    }
    /* ---------------- air collectibles ---------------- */
    { const A = BW14_City.ART.find(a => a.id === 'rocket'); api.pickup('photo', A.x, 44, A.z, { id: 'p2', bw14air: true }); }
    api.pickup('photo', 0, -50, 0, { id: 'p3', bw14air: true });
    for (let i = 0; i < 25; i++) api.pickup('glowstick', 0, -60, 0, { bw14air: true, bw14ff: true });
    // rings, updrafts, formation rings, drones, dust devils
    W.rings(api, g, F);
    api.update((g2, dt) => F.worldStep(g2, dt));
    // the drop zone marker
    api.marker('dz', W.DZ.x, W.DZ.z, 'Drop zone', { col: '#ff3b5c' });
    api.marker('lz', L.x, L.z, 'Glow Crew', { col: '#7aff5a' });
    // long-range city geometry (drawn past the normal chunk range while flying)
    S.far = BW14_City.finish(g.world);
    // the circuit plane: burners arriving by air
    { const mv = api.mover(m => { m.push(); m.tf(0, 0, 0, 0, 0, 0, 0.9); BW14_Model.plane(m, { body: '#ffffff', belly: '#ff4fd8', stripe: '#9a6bff', trim: '#38f2ff', name: 'AIR VIBES', ears: false, led: true }); m.pop(); return { cols: [] }; }); mv.noCollide = true; S.circuit = mv; }
  },
  onStart(g) {
    const S = g.bw14, F = S.fly, C = BW14_CFG;
    BW14_HUD.install(g);
    // free water at the shack cooler (for the thirsty sparkle pony)
    g.interactables = (g.interactables || []).concat([
      { x: C.SHACK.x - 4.4, z: C.SHACK.z + 2.4, r: 2.4, label: 'GRAB WATER', when: g2 => g2.missions.state('chute') === 'active' && !bw14Flag('pilotchute') && !g2.bw14.hasWater,
        fn: g2 => { g2.bw14.hasWater = true; burnsSfx('pickup_bag'); g2.toast('GOT A WATER BOTTLE (FOR STARDUST)'); } }
    ]);
    if (bw14Flag('pilotchute')) BW14_W.ponyNoCape(g);
    // persistent progress
    S.pf = { oilcap: !!bw14Flag('oilcap'), sock: !!bw14Flag('sock'), fuel: !!bw14Flag('fuel') };
    if (g.missions.isDone('preflight')) S.pf = { oilcap: true, sock: true, fuel: true };
    if (S.pf.fuel && S.truck) { S.truck.x = C.PARK.x + 9; S.truck.z = C.PARK.z + 12; S.truck.yaw = Math.PI; S.truck.parked = true; S.truck.syncMover(); }
    if (g.missions.isDone('chute')) BW14_W.giveRig(g); else BW14_W.plainBrady(g);
    const pf = g.missions.get('preflight'); if (pf && pf.state !== 'done') pf.n = ['oilcap', 'sock', 'fuel'].filter(k => S.pf[k]).length;
    if (g.missions.isDone('pilot')) { const d = g.actor('dusty'); if (d) { d.setBehavior('idle'); d.y = 0; d.def.fixedY = false; d.x = C.PARK.x + 3.4; d.z = C.PARK.z + 4.5; } }
    g.tod = 0.05 + (g.missions.isDone('preflight') ? 0.06 : 0) + (g.missions.isDone('chute') ? 0.06 : 0) + (g.missions.isDone('briefing') ? 0.06 : 0);
    bw14Music(g);
    if (!bw14Flag('intro')) BW14_W.intro(g);
    else g.banner('SKYDIVE INTO THE BURN', g.missions.isDone('board') ? 'Captain Dusty is ready when you are' : 'Earn a seat on the Dust Bunny', { col: '#ff9a4a' });
  },
  onRespawn(g) { const F = g.bw14.fly; if (F && F.active) { F.allowExit = true; F.release(g.player); F.allowExit = false; F.setMode('idle'); } },
  update(g, dt) {
    const S = g.bw14, F = S.fly, p = g.player, C = BW14_CFG;
    S.hudP = Object.assign({}, Input.hudPressed);
    bw14Timers(g, dt);
    if (S.ctlHint && S.ctlHint.t > 0) S.ctlHint.t -= dt;
    if (S.card) { S.card.t += dt; BW14_W.cardInput(g); }
    // flip the stick
    if (S.hudP.bw14inv) { bw14Flag('invert', !bw14Flag('invert')); burnsSfx('select'); g.toast(bw14Flag('invert') ? 'STICK: ARCADE (UP = CLIMB)' : 'STICK: PILOT (PULL BACK = CLIMB)'); }
    // the jump (touch button or ACTION / X / Shift on keyboard and pad)
    if (F.active && F.mode === 'plane' && S.dzReady && !g.cine && !g.dialog.open && (S.hudP.bw14jump || p.inp.actionPressed)) { p.inp.actionPressed = false; BW14_W.jumpOut(g); }
    if (F.active && (F.mode === 'plane' || F.mode === 'free')) { S.trackT = (S.trackT || 0) - dt; if (S.trackT <= 0) { S.trackT = 0.25; BW14_W.updateTracker(g); } }
    // on foot: the windsock chase, the fuel run, the airport fence
    BW14_W.updateSock(g, dt);
    if (!F.active) {
      if (S.truck && g.missions.state('preflight') === 'active' && !S.pf.fuel && Math.hypot(S.truck.x - C.PARK.x, S.truck.z - C.PARK.z) < 14) {
        S.pf.fuel = false; bw14Flag('fuel', true); BW14_W.preflightStep(g, 'fuel');
        g.banner('FUELED UP!', 'Glug glug glug. The Dust Bunny is full.', { col: '#ffd84a', small: true }); burnsSfx('pickup_bag');
        if (p.vehicle === S.truck) S.truck.dismount(p);
        S.truck.parked = true;
      }
      if (!p.vehicle || p.vehicle === S.truck) {
        const X0 = 356, X1 = 560, Z0 = -34, Z1 = 296;
        if (p.x < X0 || p.z < Z0 || p.x > X1 || p.z > Z1) { p.x = clamp(p.x, X0, X1); p.z = clamp(p.z, Z0, Z1); if (!S.fenceT || g.time - S.fenceT > 4) { S.fenceT = g.time; g.toast('Rangers on the fence. The only way in is UP.'); } }
        if (p.vehicle === S.truck) { S.truck.x = clamp(S.truck.x, X0, X1); S.truck.z = clamp(S.truck.z, Z0, Z1); S.truck.syncMover(); }
      }
    }
    // the circuit plane (hidden while Brady flies, so the sky is his)
    if (S.circuit) {
      const mv = S.circuit, t = g.time * 0.05, a = t % TAU, cx = 470, cz = 150, rx = 150, rz = 210;
      mv.visible = !F.active || F.mode === 'idle';
      mv.x = cx + Math.sin(a) * rx; mv.z = cz + Math.cos(a) * rz; mv.y = 70 + Math.sin(a * 2) * 6;
      mv.yaw = Math.atan2(Math.cos(a) * rx, -Math.sin(a) * rz); mv.roll = 0.3; mv.pitch = 0;
    }
    // far city chunks: long range while airborne, normal culling on the ground
    const far = F.active && F.mode !== 'parked' && F.mode !== 'idle' && F.mode !== 'landed';
    if (S.far && S.farOn !== far) { S.farOn = far; for (const c of S.far) c.always = far; }
    // time of day follows the story: morning tasks -> golden flight -> sunset jump
    if (F.active && F.mode === 'plane' && !F.pl.ground && g.todTarget === null && g.tod < 0.66) g.setTod(0.66, 0.006);
    if (F.active && (F.mode === 'canopy' || F.mode === 'landed') && g.tod < 0.85 && g.todTarget === null) g.setTod(0.85, 0.02);
  },
  env(g, env) {
    const S = g.bw14, F = S && S.fly, t = g.tod;
    // the sun arcs across the sky (east in the morning, west at the jump)
    const az = lerp(95, 255, t), el = lerp(18, 3.5, t) + 26 * Math.sin(Math.PI * Math.min(1, t * 1.1));
    const d = BurnsEnv.dir(az, el); env.sunDir = d; env.keyDir = d.slice();
    // see the whole city from the air: thinner haze the higher the camera
    const cy = g.cam ? g.cam.y : 2, k = clamp((cy - 20) / 220, 0, 1);
    env.fogD *= lerp(1, 0.26, k); env.haze = lerp(env.haze, env.haze * 0.55, k); env.fogMax = lerp(env.fogMax, env.fogMax * 0.8, k);
    if (F && F.active && F.mode === 'free') env.fogD *= 0.9;
  },
  drawSprites(g, R) {
    const S = g.bw14, F = S.fly, SP = BURNS_SPRITES.R, cam = g.cam, t = g.time, L = BW14_CFG.LZ;
    if (!F) return;
    // Chinka's beacon over the Man's pavilion (always visible)
    for (let i = 0; i < 6; i++) R.bbs.bb(0, 30 + i * 18, 0, 10 - i, 22, SP.glow, [1, 0.4, 0.8], 0.16 + Math.sin(t * 2 + i) * 0.03, true);
    if (S.man) { const h = S.man.hand ? S.man.hand(1) : [0, 18, 0]; R.bbs.bb(h[0], h[1], h[2], 6, 6, SP.glow, [1, 0.45, 0.85], 0.55 + Math.sin(t * 4) * 0.15, true); }
    // the landing target beacon
    const flying = F.active && F.mode !== 'parked' && F.mode !== 'idle';
    if (flying) {
      R.bbs.bb(L.x, 1.5, L.z, 9, 9, SP.glow, [1, 0.35, 0.85], 0.5 + Math.sin(t * 5) * 0.2, true);
      for (let i = 0; i < 5; i++) R.bbs.bb(L.x, 8 + i * 14, L.z, 4, 16, SP.glow, [1, 0.4, 0.9], 0.1, true);
    }
    if (F.active && F.mode === 'plane') {
      const P = F.pl;
      // the next ring glows; updrafts shimmer; the drop zone pulses
      const nr = F.nextRing();
      if (nr) R.bbs.bb(nr.x, nr.y, nr.z, 30, 30, SP.glow, burnsRGBf(nr.col), 0.3 + Math.sin(t * 6) * 0.1, true);
      for (const u of F.thermalRings) { if (u.cool > 0) continue; R.bbs.bb(u.x, u.y, u.z, 24, 12, SP.glow, [1, 0.85, 0.3], 0.22, true); if (Math.random() < 0.3 && Math.hypot(u.x - cam.x, u.z - cam.z) < 260) g.fx.add(u.x + (Math.random() - 0.5) * 24, u.y - 10, u.z + (Math.random() - 0.5) * 24, 0, 12, 0, 1.4, 0.5, 0.2, [1, 0.85, 0.35], 0.8, 'spark', 1); }
      const DZ = S.dz; R.flat.flat(DZ.x, DZ.alt, DZ.z, DZ.r * 2, DZ.r * 2, t * 0.2, SP.ring, S.dzReady ? [0.3, 1, 0.4] : [1, 0.25, 0.3], 0.22, true);
      for (let i = 0; i < 4; i++) R.bbs.bb(DZ.x, DZ.alt - 60 + i * 40, DZ.z, 8, 40, SP.glow, S.dzReady ? [0.3, 1, 0.4] : [1, 0.3, 0.35], 0.12, true);
      // nav lights on the wingtips + a strobe
      const M = F.planeP; if (M && !M.hidden) { const a = M.point(0, 5.4, 0.9, 0.4), b = M.point(0, -5.4, 0.9, 0.4), c = M.point(0, 0, 1.6, -3.9); R.bbs.bb(a[0], a[1], a[2], 1.4, 1.4, SP.glow, [1, 0.2, 0.2], 0.9, true); R.bbs.bb(b[0], b[1], b[2], 1.4, 1.4, SP.glow, [0.2, 1, 0.3], 0.9, true); if (Math.floor(t * 1.5) % 2 === 0 && (t * 1.5) % 1 < 0.12) R.bbs.bb(c[0], c[1], c[2], 3, 3, SP.glow, [1, 1, 1], 1, true); }
      void P;
    }
    if (F.active && F.mode === 'free') { for (const r of F.frings) if (!r.done) R.bbs.bb(r.x, r.y, r.z, 16, 16, SP.glow, burnsRGBf(r.col), 0.35, true); }
    // big halos on the air photos so you can find them
    for (const P of g.pickups.items) if (P.bw14air && P.base === 'photo' && !P.taken && P.y0 > 5) R.bbs.bb(P.x, P.y0, P.z, 12, 12, SP.glow, [1, 0.5, 0.8], 0.5 + Math.sin(t * 4) * 0.15, true);
    // dust devils
    for (const d of F.devils) { if (Math.hypot(d.x - cam.x, d.z - cam.z) > 320) continue; for (let i = 0; i < 2; i++) { const a = Math.random() * TAU, h = Math.random() * d.h, rr2 = d.r * (0.3 + h / d.h * 0.8); g.fx.add(d.x + Math.sin(a) * rr2, h, d.z + Math.cos(a) * rr2, Math.cos(a) * 8, 4, -Math.sin(a) * 8, 1.6, 3 + h * 0.05, 7 + h * 0.08, [0.85, 0.72, 0.58], 0.28, 'puff', 0, Math.random() * 6, 2); } }
    // thermals over the hot art shimmer
    for (const th of BW14_City.thermals) { if (Math.hypot(th.x - cam.x, th.z - cam.z) > 220 || Math.random() > 0.35) continue; g.fx.add(th.x + (Math.random() - 0.5) * th.r, 3 + Math.random() * 20, th.z + (Math.random() - 0.5) * th.r, 0, 6 + Math.random() * 4, 0, 1.8, 0.4, 0.1, [1, 0.6, 0.25], 0.6, 'spark', 1); }
    // the windsock's tip light + the parked plane's strobe
    if (S.trunkOpen) R.bbs.bb(L.x + 6.5, 1.6, L.z - 2, 3, 3, SP.glow, [1, 0.4, 0.85], 0.6, true);
  }
});

/* ---------------- characters (our own originals) ---------------- */
Object.assign(BW14_W, {
  dustySpec() {
    const s = BurnsRig.npcSpec('crusty', 1414);
    Object.assign(s, { face: 'beard', hair: { style: 'short', col: '#d8d4cc', hi: '#ffffff' }, hat: { kind: 'bw14FlightCap', col: '#6a3a1e' }, glasses: 'aviator', top: { kind: 'button', col: '#e8dcc0' },
      coat: { kind: 'duster', col: '#7a4a2a', trim: '#f4ecd8' }, bottom: { kind: 'cargo', col: '#5a5a3a' }, shoes: { kind: 'boots', col: '#4a2e1a' }, acc: ['bandana', 'watch'], prop: 'walkie', key: 'w14:dusty' });
    return s;
  },
  rosieSpec() {
    const s = BurnsRig.npcSpec('burner', 1415);
    Object.assign(s, { face: 'lashes', hair: { style: 'bun', col: '#c83a6a', hi: '#ff8ab0' }, top: { kind: 'tank', col: '#2a2a34' }, bottom: { kind: 'cargo', col: '#6a5a8a' }, shoes: { kind: 'boots', col: '#2a2a2a' },
      acc: ['toolbelt', 'bracelets', 'goggles'], glasses: 'round', prop: 'clipboard', paint: 'tattoo', key: 'w14:rosie' });
    return s;
  },
  ponySpec() {
    const s = BurnsRig.npcSpec('sparklepony', 1416);
    s.acc = (s.acc || []).filter(a => a !== 'wings').concat(['cape']); s.key = 'w14:pony';
    return s;
  },
  captainSpec() {
    const s = BurnsRig.npcSpec('burner', 1417);
    Object.assign(s, { face: 'stern', hair: { style: 'buzz', col: '#3a2a1a', hi: '#5a4a3a' }, hat: { kind: 'hardhat', col: '#ffb020' }, top: { kind: 'tee', col: '#ff7a2a' }, vest: 'hivis', bottom: { kind: 'cargo', col: '#3a3a44' },
      shoes: { kind: 'boots', col: '#2a2a2a' }, glasses: 'clear', prop: 'clipboard', acc: ['headset'], key: 'w14:captain' });
    return s;
  },
  dummySpec() {
    return { kind: 'burner', face: 'goofy', skin: '#e8d8c0', skinSh: '#c8b8a0', hair: { style: 'bald', col: '#e8d8c0', hi: '#ffffff' }, top: { kind: 'tee', col: '#ff4fd8' }, bottom: { kind: 'shorts', col: '#38c8ff' }, shoes: { kind: 'sneakers', col: '#ffe24a' }, acc: ['bw14Rig'], body: { h: 1, w: 1 }, key: 'w14:dummy' };
  },
  /* ---------------- talk handlers ---------------- */
  talkDusty(g, a) {
    const S = g.bw14, M = g.missions;
    if (a.behName === 'sleep') {
      a.setBehavior('idle'); a.def.fixedY = false; a.y = 0; a.x = BW14_CFG.PARK.x + 3.4; a.z = BW14_CFG.PARK.z + 4.5;
      g.say(a, ['ZZZ— wha?! Who\'s flyin\' my plane?! ...Oh. Nobody. Good.', 'Captain Dusty. Thirty years crop-dusting beans. Now I dust burners. Out of a plane. On purpose.'], () => {
        g.say('brady', ['I need to get INTO the city. Today. The gate won\'t let me. My wife is on top of the Man.'], () => {
          g.say(a, ['On top of the Man? Huh. That\'s a new one even for this week.', 'Tell you what: you earn the seat. Pre-flight checklist: find my oil cap, catch my windsock — it blew off again — and drive the fuel truck over.', 'Then get a chute from Rigger Rosie, and sit through the Safety Third briefing. Rules are rules. Third rules, but rules.'], () => { M.start('preflight'); g.setTod(Math.max(g.tod, 0.08), 0.05); if (S.sock && S.sock.mode === 'pole' && !S.pf.sock) BW14_W.sockGust(g); });
        });
      });
      return;
    }
    if (M.state('preflight') === 'available') { g.say(a, ['Checklist time: oil cap, windsock, fuel. Chop chop.'], () => M.start('preflight')); return; }
    if (M.isDone('board') || M.state('board') === 'available') {
      if (M.isDone('board')) g.say(a, ['Back for another go? She\'s fueled and itching. Hop in.'], () => BW14_W.board(g));
      else BW14_W.board(g);
      return;
    }
    const left = [];
    if (!M.isDone('preflight')) { const pf = S.pf || {}; if (!pf.oilcap) left.push('my oil cap (last night was a hangar rave)'); if (!pf.sock) left.push('the windsock (runway edge, heading for Gerlach)'); if (!pf.fuel) left.push('fuel (Gary\'s truck at the depot)'); }
    if (!M.isDone('chute')) left.push('a chute from Rigger Rosie');
    if (!M.isDone('briefing')) left.push('the Safety Third briefing');
    g.say(a, ['Still need: ' + left.join(', ') + '.', ['The playa doesn\'t care how fast you fly. It cares how you land.', 'Bunny ears? Aerodynamic. Probably.', 'Ever flown before? Great. Me neither. Kidding. Mostly.'][Math.floor(Math.random() * 3)]]);
  },
  sockGust(g) {
    const S = g.bw14, K = S.sock;
    K.fx = K.x; K.fy = K.y; K.fz = K.z; K.hop = 0; K.mode = 'fly'; K.t = 0;
    burnsSfx('wind', null, 'dust'); g.shake(0.25); g.toast('THE WINDSOCK BLEW AWAY! CATCH IT!');
  },
  talkRosie(g, a) {
    const M = g.missions, st = M.state('chute');
    if (st === 'locked') { g.say(a, ['Rigger Rosie. I pack chutes and good intentions. Talk to Captain Dusty first, sugar.']); return; }
    if (st === 'available') { g.say(a, ['A first-timer! I packed you my rainbow canopy. Seven cells, seven colors, seven chakras.', 'Ninety-nine percent ready. The one percent is the pilot chute. A sparkle pony "borrowed" it. She\'s wearing it as a CAPE.', 'Stardust. Terminal shack. Bring it back and you\'re good to fall.'], () => M.start('chute')); return; }
    if (st === 'active') {
      if (bw14Flag('pilotchute')) { g.say(a, ['MY PILOT CHUTE! Glitter on it. Of course.', 'There. Packed with love, double-checked, and lightly blessed. Your rig is ON.', 'Red handle: canopy. The other one is a glow stick. Don\'t mix them up.'], () => { M.complete('chute'); BW14_W.giveRig(g); burnsSfx('costume'); g.fx.confetti(g.player.x, g.player.y + 1.5, g.player.z, 24); g.setTod(Math.max(g.tod, g.tod + 0.06), 0.05); }); }
      else g.say(a, ['Stardust has my pilot chute. Look for a cape. And a thirst.']);
      return;
    }
    g.say(a, ['Pull in the GREEN, toggles to steer, both to flare. And smile, the Glow Crew is filming.']);
  },
  talkPony(g, a) {
    const M = g.missions;
    if (M.state('chute') !== 'active' || bw14Flag('pilotchute')) { g.say(a, ['Can I borrow some water? And a tent? And maybe your plane?', 'I\'m, like, SO dehydrated. Is that a thing?']); return; }
    if (!g.bw14.hasWater) { g.say(a, ['Ooh, is this YOUR cape? It\'s so my color. It\'s a parachute? Even better. I\'m basically flying.', 'I\'ll gift it back for... water? I\'m, like, SO dehydrated.']); g.bw14.ponyAsked = true; return; }
    g.say(a, ['WATER! You\'re an angel. A dusty angel. Here, take the cape. Fly free, cape.'], () => { bw14Flag('pilotchute', true); g.bw14.hasWater = false; g.toast('GOT THE PILOT CHUTE! BACK TO ROSIE'); burnsSfx('gift', null, 'pick'); g.fx.hearts(a.x, a.y + 2, a.z, 10); BW14_W.ponyNoCape(g); });
  },
  ponyNoCape(g) {
    const a = g.actor('pony'); if (!a) return;
    const s = BW14_W.ponySpec(); s.acc = (s.acc || []).filter(x => x !== 'cape'); s.key = 'w14:pony:nocape';
    a.model = BurnsRig.model(s); a.ch.setModel(a.model);
  },
  talkCaptain(g, a) {
    const M = g.missions, st = M.state('briefing');
    if (st === 'locked') { g.say(a, ['Safety Third Air briefing is for passengers. Talk to the pilot first. Safely. Third.']); return; }
    if (st === 'done') { g.say(a, ['Remember: fun first, ??? second, safety third. Now go be... reasonably safe.']); return; }
    M.start('briefing', true);
    const p = g.player, B = BW14_CFG.BRIEF;
    p.teleport(B.x, 0, B.z + 1.2, Math.PI); p.animOverride = 'sit';
    const cap = a;
    g.cutscene([
      { cam: { x: B.x + 4.5, y: 2.6, z: B.z + 5, tx: B.x - 0.5, ty: 1.4, tz: B.z - 1.4, fov: 0.85 } },
      { say: [cap, ['Welcome to Safety Third Air! Safety first? No. Safety THIRD. Right after fun and... I forget the second one.', 'In the unlikely event of a water landing: there is no water. This is a desert. Hydrate.']] },
      { do: g2 => { const d = g2.actor('dummy'); if (d) { d.ch.play('cheer'); d.say('(dummy noises)', 2); } } },
      { say: [cap, ['This is Dummy. Dummy has a RIG. Red handle: canopy. Do NOT pull the glow stick. Dummy pulled the glow stick.', 'Watch your altimeter in freefall. Pull in the GREEN. Too early, you drift to Reno. Too late, you become a lawn ornament.']] },
      { say: [cap, ['Under the canopy: left toggle, go left. Right toggle, go right. BOTH toggles: brakes.', 'Right before your feet touch: FLARE. Pull both like you\'re hugging a giant invisible bear.']] },
      { say: ['brady', ['Hug the bear. Got it.']] },
      { say: [cap, ['And the stick: pull BACK to climb, like a real pilot. If your brain says otherwise, tap the little arrows thing and flip it.', 'Any questions? Great. No refunds. You are now... briefed. Ish.']] },
      { do: g2 => { p.animOverride = null; M.complete('briefing'); g2.setTod(Math.max(g2.tod, g2.tod + 0.06), 0.05); g2.toast('SAFETY THIRD STICKER ACQUIRED'); } }
    ]);
  },
  talkGary(g, a) {
    const M = g.missions, S = g.bw14;
    if (M.state('preflight') !== 'active') { g.say(a, ['Gasoline Gary. I sell nothing. I gift fuel. To Dusty. Grudgingly.', 'On my break. Since 2009.']); return; }
    if (S.pf.fuel) { g.say(a, ['Plane\'s full? Good. Leave the truck. It knows the way home. It doesn\'t, but it\'s a nice thought.']); return; }
    g.say(a, ['Dusty needs fuel? Truck\'s right there. Keys are in it. Keys are always in it.', 'Drive it over to the plane. Don\'t hit the bunny. She bites.']);
  }
});

