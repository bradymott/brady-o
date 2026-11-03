/* ============================================================
   BRADY GOES TO BURNING MAN — World 16 kit (3/3): RHYTHM WAVE runtime
   - the build tasks' mechanics (carrying bamboo, ground-pounding the
     loose floor panels, hoisting the shade sails, hanging lanterns)
   - the Yoga Yoni Tantra Enlightenment Dance Contest: rivals perform in
     a cutscene, then Brady dances two rounds of the shared dance-off
     minigame (BW567K.rhythm, src/42_burns_w567_kit.js) with his own
     yoga-pose twist and three judges
   - "wonky as a donkey": colour cycling, trails, camera wobble, wobbly
     steering and hallucinations after Bam Bam's pill (calmer when the
     player turns screen shake off or asks the OS for reduced motion)
   - the 2D overlay (spiral eyes, the contest board, hoist meters)
   ============================================================ */

/* ---------------- a stage behaviour for scripted actors ---------------- */
BurnsBehaviors.register('bw16Stage', {
  init(a) { a.data.anim = a.def.anim0 || 'idle'; a.data.k = a.def.animK || null; },
  update(a, g, dt) {
    const d = a.data;
    if (d.goto) { const r = a.moveTo(d.goto.x, d.goto.z, d.goto.speed || 2.6, dt, 0.3); if (r < 0.35) { d.goto = null; a.vx = a.vz = 0; if (d.faceAfter !== undefined) a.yaw = d.faceAfter; } }
    else { a.vx = BurnsM.damp(a.vx, 0, 10, dt); a.vz = BurnsM.damp(a.vz, 0, 10, dt); if (d.faceP) a.face(g.player.x, g.player.z, dt, 5); }
    const sp = Math.hypot(a.vx, a.vz);
    a.ch.play(sp > 0.45 ? 'walk' : d.anim, sp > 0.45 ? null : d.k);
    a.physics(dt);
  }
});
// a judge / spectator that keeps facing a point and can be told to cheer
BW16.stage = function (a, anim, k, faceAfter) { if (!a) return; if (a.behName !== 'bw16Stage') a.setBehavior('bw16Stage'); a.data.anim = anim || 'idle'; a.data.k = k || null; if (faceAfter !== undefined) a.yaw = faceAfter; };
BW16.walkTo = function (a, x, z, yaw, anim) { if (!a) return; BW16.stage(a, anim || a.data.anim || 'idle'); a.data.goto = { x, z }; a.data.faceAfter = yaw; };
BW16.place = function (a, x, z, yaw, anim, k) { if (!a) return; a.x = x; a.z = z; a.y = a.g.world.surface(x, z, 3, 0.2, BURNS_SURF).y; a.vx = a.vz = 0; a.yaw = yaw; BW16.stage(a, anim, k); a.data.goto = null; };

/* ---------------- day -> night ---------------- */
BW16.wantTod = function (g) {
  const M = g.missions, n = BW16.BUILD.filter(id => M.isDone(id)).length;
  if (M.isDone('contest')) return 1;
  if (BW16.state && BW16.state.aliveT > 0) return 0.62;
  return Math.min(0.5, 0.06 + n * 0.11);
};

/* ---------------- Bamboo Haul: carry poles to the Wave ---------------- */
BW16.grabPole = function (g, i) {
  const S = BW16.state, P = S.poles[i], p = g.player;
  if (!P || P.taken || P.delivered || S.carry !== null) return;
  P.taken = true; P.mv.visible = false; S.carry = i;
  p.hold('bw16Pole');
  burnsSfx('pick', { pitch: 0.7 }); g.fx.dust(p.x, p.y + 0.3, p.z, 6);
  g.toast('POLE ' + (S.poles.filter(q => q.delivered).length + 1) + '/4 · CARRY IT TO THE WAVE');
  p.say(['Heavy. Pointy. Mine.', 'This is a lot of bamboo.', 'Pivot! PIVOT!', 'I am one with the pole.'][i % 4], 1.4);
};
BW16.dropPole = function (g, why) {
  const S = BW16.state; if (S.carry === null) return;
  const P = S.poles[S.carry]; P.taken = false; P.mv.visible = true; S.carry = null;
  g.player.hold(null);
  g.toast(why || 'DROPPED THE POLE! IT ROLLED BACK.'); burnsSfx('bump');
};
BW16.deliverPole = function (g) {
  const S = BW16.state, i = S.carry; if (i === null) return;
  const P = S.poles[i]; P.delivered = true; S.carry = null;
  g.player.hold(null);
  const n = S.poles.filter(q => q.delivered).length, rib = S.ribs[n - 1];
  if (rib) { rib.visible = true; rib.drop = 1; rib.y = 9; }
  burnsSfx('stomp', { pitch: 0.8 }); g.shake(0.15);
  g.fx.confetti(BW16.RACK.x, 2.5, BW16.RACK.z, 14);
  const m = g.missions.get('haul'); if (m && m.state === 'active') g.missions.progress('haul', 1, 4);
};
BW16.carryStep = function (g, dt) {
  const S = BW16.state, p = g.player; if (S.carry === null) return;
  // encumbered: slower, no double jump, no spin while carrying (ACTION still talks and uses things)
  p.inp.mx *= 0.8; p.inp.mz *= 0.8;
  if (p.inp.jumpPressed && !p.grounded && !(p.coyote > 0)) p.inp.jumpPressed = false;
  if (p.inp.actionPressed && !g.talkTarget() && !g.interactTarget()) p.inp.actionPressed = false;
  if (p.hurtT > 0.3 || p.dead || p.vehicle) { BW16.dropPole(g, 'OUCH! THE POLE ROLLED BACK.'); return; }
  const R = BW16.RACK;
  if (Math.hypot(p.x - R.x, p.z - R.z) < 3.4 && p.y < 2) BW16.deliverPole(g);
};
BW16.ribStep = function (g, dt) {
  for (const r of BW16.state.ribs) if (r.drop) { r.y = Math.max(0, r.y - dt * (6 + (9 - r.y) * 3)); if (r.y <= 0) { r.drop = 0; r.y = 0; g.fx.dust(r.x, 0.2, BW16.F.z - 21, 10); burnsSfx('land', { pitch: 0.7 }); } }
};

/* ---------------- Lash the Floor: ground-pound the six loose panels ---------------- */
BW16.poundAt = function (g, x, y, z) {
  const S = BW16.state, m = g.missions.get('lash'); if (!m || m.state !== 'active') return;
  for (const q of S.panels) {
    if (q.done || Math.hypot(q.x - x, q.z - z) > 1.9 || Math.abs(y - BW16.F.h) > 1.2) continue;
    q.done = true; q.seatT = 0;
    burnsSfx('stomp'); burnsSfx('pick', { pitch: 1.6, vol: 0.5 }); g.fx.burst(q.x, BW16.F.h + 0.2, q.z, 'star', 10, '#ffd36a'); g.fx.ring(q.x, BW16.F.h + 0.05, q.z, 1.6, '#ffd36a', 0.5);
    const lines = ['ZZZIP! Lashed.', 'Torque would be proud.', 'Solid as bamboo.', 'That one\'s not going anywhere.', 'Lashed AND tied!', 'The floor approves.'];
    g.player.say(lines[S.panels.filter(p2 => p2.done).length % lines.length], 1.2);
    g.missions.progress('lash', 1, S.panels.length);
    return;
  }
};
BW16.panelStep = function (g, dt) {
  const S = BW16.state, t = g.time, F = BW16.F, act = g.missions.state('lash') === 'active';
  for (const q of S.panels) {
    if (q.done) { q.seatT = Math.min(1, (q.seatT || 0) + dt * 5); q.mv.pitch = lerp(q.mv.pitch, 0, q.seatT); q.mv.roll = lerp(q.mv.roll, 0, q.seatT); q.mv.y = lerp(q.mv.y, F.h + 0.004, q.seatT); continue; }
    const w = act ? 1 : 0.4;
    q.mv.pitch = Math.sin(t * 3.1 + q.i * 1.7) * 0.07 * w; q.mv.roll = Math.cos(t * 2.7 + q.i) * 0.07 * w; q.mv.y = F.h + 0.06 + Math.abs(Math.sin(t * 2.2 + q.i)) * 0.05 * w;
  }
};

/* ---------------- Raise the Shade: hoist three sails against the gusts ---------------- */
BW16.hoist = function (g, sail) {
  const S = BW16.state, p = g.player;
  if (sail.done) return;
  sail.k = Math.min(1, sail.k + 0.14);
  S.hoistT = 0.32; p.yaw = Math.atan2(sail.mast.x - p.x, sail.mast.z - p.z);
  burnsSfx('pick', { pitch: 0.7 + sail.k * 0.8, vol: 0.5 });
  if (sail.k >= 1) {
    sail.done = true; sail.k = 1;
    burnsSfx('crowd_cheer', { vol: 0.5 }); burnsSfx('stomp', { pitch: 1.3 }); g.fx.confetti(sail.up.x, sail.up.y, sail.up.z, 24);
    g.toast(sail.sl.name + ' SAIL IS UP!');
    g.missions.progress('sails', 1, 3);
  }
};
BW16.sailStep = function (g, dt) {
  const S = BW16.state, act = g.missions.state('sails') === 'active', p = g.player;
  for (const s of S.sails) {
    if (!s.done && act) {
      s.k = Math.max(0, s.k - dt * 0.045);
      s.gustT -= dt;
      if (s.gustT < 1.0 && s.gustT + dt >= 1.0 && s.k > 0.05 && Math.hypot(p.x - s.winch.x, p.z - s.winch.z) < 9) { g.warn('GUST!', 1.0); burnsSfx('wind', { vol: 0.5 }, 'dust'); }
      if (s.gustT <= 0) { s.gustT = 4.6 + Math.random() * 1.6; if (s.k > 0.05) { s.k = Math.max(0, s.k - 0.24); for (let i = 0; i < 6; i++) g.fx.dust(s.up.x + (Math.random() - 0.5) * 4, 1 + Math.random() * 3, s.up.z + (Math.random() - 0.5) * 4, 2); } }
    }
    const e = easeInOut(clamp(s.k, 0, 1)), fl = s.done ? 0 : Math.sin(g.time * 7 + s.i) * 0.04 * (1 - e) * (act ? 1 : 0);
    s.mv.x = lerp(s.low.x, s.up.x, e); s.mv.y = lerp(s.low.y, s.up.y, e); s.mv.z = lerp(s.low.z, s.up.z, e);
    s.mv.scale = lerp(0.24, 1, e); s.mv.pitch = fl; s.mv.roll = fl * 0.6;
  }
  if (S.hoistT > 0) { S.hoistT -= dt; p.animOverride = S.hoistT > 0 ? 'bw16Hoist' : (p.animOverride === 'bw16Hoist' ? null : p.animOverride); }
};

/* ---------------- Light the Wave: hang the lanterns ---------------- */
BW16.hang = function (g, h) {
  if (h.hung) return;
  h.hung = true; h.mv.visible = true; h.glow.s = h.glow.s0;
  burnsSfx('pick', { pitch: 1.3 }); g.fx.burst(h.lx, h.ly + 0.3, h.lz, 'star', 8, '#ffd36a');
  g.missions.progress('lanterns', 1, BW16.state.hooks.length);
};
BW16.hookStep = function (g, dt) {
  const S = BW16.state, t = g.time;
  for (const h of S.hooks) { if (!h.hung) continue; h.mv.roll = Math.sin(t * 1.3 + h.i) * 0.06; h.mv.pitch = Math.cos(t * 1.1 + h.i * 2) * 0.05; const f = 0.85 + 0.15 * Math.sin(t * 5 + h.i * 2.3); for (let k = 0; k < 3; k++) h.glow.c[k] = h.glow.c0[k] * f; }
};

/* ---------------- the floor comes alive (beat-synced) ---------------- */
BW16.BPM = 118;
BW16.beat = g => (g.time * BW16.BPM / 60);
BW16.floorStep = function (g, dt) {
  const S = BW16.state; if (!S) return;
  const target = S.alive ? 1 : 0; S.aliveK = BurnsM.damp(S.aliveK || 0, target, 1.2, dt);
  const b = BW16.beat(g), pulse = Math.pow(1 - (b % 1), 3), k = S.aliveK;
  for (const sp of S.speakers) for (let i = 0; i < sp.glows.length; i++) { const gl = sp.glows[i], f = k * (0.45 + 0.55 * pulse); gl.s = gl.s0 * (0.6 + 0.6 * pulse) * (k > 0.02 ? 1 : 0); for (let c = 0; c < 3; c++) gl.c[c] = gl.c0[c] * f; }
};
BW16.drawFloor = function (g, R) {
  const S = BW16.state, F = BW16.F, Sp = BURNS_SPRITES.R; if (!S) return;
  const k = S.aliveK || 0, b = BW16.beat(g), t = g.time;
  if (k > 0.05 && Math.hypot(g.player.x - F.x, g.player.z - F.z) < 60) { const pulse = Math.pow(1 - (b % 1), 3); g.pointLight(F.x, F.h + 2.2, F.z, 14, burnsRGBf(burnsHSL((b * 22) % 360, 0.72, 0.64)), (0.6 + 0.9 * pulse) * k); }
  if (k > 0.02) {
    // concentric rings that ripple out from the centre on every beat, colour cycling
    for (let i = 0; i < 4; i++) {
      const ph = ((b + i * 0.25) % 1), r = 1 + ph * (F.r * 2 - 1.2), hue = (b * 25 + i * 70) % 360, c = burnsRGBf(burnsHSL(hue, 0.95, 0.62));
      R.flat.flat(F.x, F.h + 0.02, F.z, r, r, 0, Sp.ring, c, 0.85 * k * (1 - ph), true);
    }
    R.flat.flat(F.x, F.h + 0.015, F.z, F.r * 2.1, F.r * 2.1, 0, Sp.glow, burnsRGBf(burnsHSL((b * 25) % 360, 0.8, 0.5)), 0.5 * k * (0.55 + 0.45 * Math.pow(1 - (b % 1), 2)), true);
    // warm lantern light pooling on the planks
    R.flat.flat(F.x, F.h + 0.012, F.z, F.r * 2.4, F.r * 2.4, 0, Sp.glow, [1, 0.62, 0.3], 0.22 * k, true);
    // spokes of light under the planks
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI + t * 0.2; R.flat.flat(F.x, F.h + 0.018, F.z, 0.45, F.r * 1.9, a, Sp.beam || Sp.glow, burnsRGBf(BURNS_NEON[i % 7]), 0.12 * k, true); }
  }
  // loose floor panels while "Lash the Floor" runs
  if (g.missions.state('lash') === 'active') for (const q of S.panels) if (!q.done) R.flat.flat(q.x, F.h + 0.12, q.z, 2.2, 2.2, 0, Sp.ring, [1, 0.85, 0.3], 0.55 + 0.35 * Math.sin(t * 6 + q.i), true);
  // hooks waiting for a lantern
  if (g.missions.state('lanterns') === 'active') for (const h of S.hooks) if (!h.hung) R.bbs.bb(h.x, h.y + 0.9, h.z, 0.9, 0.9, Sp.glow, [1, 0.8, 0.3], 0.5 + 0.3 * Math.sin(t * 5 + h.i), true);
  // the vibe field around the grove until Doug switches it off
  const G = BW16.GROVE, fk = S.fieldK === undefined ? 1 : S.fieldK;
  if (fk > 0.02 && g.player.z > 120) for (let i = 0; i < 24; i++) { const a = i / 24 * TAU + t * 0.15, x = G.x + Math.sin(a) * BW16.FIELD_R, z = G.z + Math.cos(a) * BW16.FIELD_R, y = 1.5 + Math.sin(t * 2 + i) * 0.6; R.bbs.bb(x, y, z, 3.5, 5, Sp.glow, burnsRGBf(burnsHSL((i * 15 + t * 40) % 360, 0.8, 0.6)), 0.12 * fk, true); }
};

/* ---------------- dust devils on the playa ---------------- */
BW16.devilStep = function (g, dt) {
  const S = BW16.state, p = g.player, t = g.time;
  for (const d of S.devils) {
    d.x = d.x0 + Math.sin(t * d.w + d.ph) * d.ax; d.z = d.z0 + Math.cos(t * d.w * 0.7 + d.ph) * 6;
    const dist = Math.hypot(p.x - d.x, p.z - d.z);
    if (dist < 60 && Math.random() < 0.6) { const a = Math.random() * TAU, rr = Math.random() * 1.6, h = Math.random() * 7; g.fx.add(d.x + Math.cos(a) * rr * (0.4 + h * 0.2), h, d.z + Math.sin(a) * rr * (0.4 + h * 0.2), Math.cos(a + 1.6) * 3, 1.2, Math.sin(a + 1.6) * 3, 1.4, 0.8, 2.2, [0.86, 0.72, 0.6], 0.3, 'puff', 0, Math.random() * 6, 2); }
    if (dist < 3.2 && !g.cine) {
      const push = (3.2 - dist) / 3.2, tx = -(p.z - d.z) / (dist || 1), tz = (p.x - d.x) / (dist || 1);
      if (p.vehicle && p.vehicle.kind === 'bike') { p.vehicle.yaw += push * dt * 2.6; }
      else { p.vx += tx * push * 14 * dt; p.vz += tz * push * 14 * dt; }
      if (!d.hitT || t - d.hitT > 2) { d.hitT = t; p.say(['Whoa, dust devil!', 'Spinny!', 'The playa is DANCING!'][Math.floor(Math.random() * 3)], 1); }
    }
  }
};

/* ---------------- wonky as a donkey ---------------- */
BW16.wonkOn = function (g) { const S = BW16.state; if (S) S.wonkTarget = 1; };
BW16.wonkOff = function (g) { const S = BW16.state; if (S) S.wonkTarget = 0; };
BW16.wonkStep = function (g, dt) {
  const S = BW16.state, p = g.player, calm = S.calm;
  S.wonk = approach(S.wonk || 0, S.wonkTarget || 0, dt * (S.wonkTarget ? 0.35 : 0.5));
  const k = S.wonk; if (k <= 0.001) { if (p.ch.poseFn === BW16.bikePose) p.ch.poseFn = null; if (g.bike) g.bike.turnRate = 0; return; }
  const t = g.time;
  // wobbly steering: the stick's direction drifts slowly (you can steer against it)
  if (!g.cine && !g.dialog.open && !p.locked) {
    const a = k * (0.3 * Math.sin(t * 1.05) + 0.16 * Math.sin(t * 2.6 + 1.3)) * (calm ? 0.6 : 1), c = Math.cos(a), s = Math.sin(a), mx = p.inp.mx, mz = p.inp.mz;
    p.inp.mx = mx * c + mz * s; p.inp.mz = mz * c - mx * s;
  }
  // the bike leans and weaves; Brady leans with it
  if (g.bike) g.bike.turnRate = k * (calm ? 1.2 : 3.2) * Math.sin(t * 2.2);
  if (p.vehicle && p.vehicle === g.bike && p.vehicle.kind === 'bike') { if (!p.ch.poseFn) p.ch.poseFn = BW16.bikePose; }
  else if (p.ch.poseFn === BW16.bikePose) p.ch.poseFn = null;
  // rainbow trails
  S.trailT = (S.trailT || 0) - dt;
  const sp = Math.hypot(p.vx, p.vz);
  if (S.trailT <= 0 && sp > 1.5 && !g.cine) {
    S.trailT = calm ? 0.09 : 0.035;
    const hue = (t * 160) % 360, c = burnsRGBf(burnsHSL(hue, 1, 0.62));
    g.fx.add(p.x - p.vx * 0.04, p.y + 0.35 + Math.random() * 0.5, p.z - p.vz * 0.04, -p.vx * 0.05, 0.25, -p.vz * 0.05, calm ? 0.6 : 1.1, 0.55, 0.12, c, 0.8, 'glow', 1);
    if (!calm && Math.random() < 0.25) g.fx.add(p.x, p.y + 1.6, p.z, (Math.random() - 0.5) * 2, 1.4, (Math.random() - 0.5) * 2, 1.2, 0.35, 0.2, c, 1, Math.random() < 0.5 ? 'star' : 'heart', 1);
  }
};
BW16.bikePose = function (P, t, k) {
  BURNS_ANIMS.bike(P, t, k);
  const g = BW16.state && BW16.state.g, b = g && g.bike; if (!b) return;
  P.roll = clamp(-(b.turnRate || 0) * 0.08, -0.3, 0.3); P.pivot = 0;
};
// the camera breathes: slow roll and fov wobble (much less in calm mode)
BW16.camFx = function (g, fdt) {
  const S = BW16.state; if (!S || S.g !== g) return;
  const k = S.wonk || 0; if (k <= 0.001) return;
  const t = g.time, cam = g.cam, calm = S.calm ? 0.25 : 1;
  cam.roll = (cam.roll || 0) + Math.sin(t * 0.9) * 0.065 * k * calm + Math.sin(t * 2.3) * 0.015 * k * calm;
  cam.fov += (Math.sin(t * 0.7) * 0.05 + Math.sin(t * 1.9) * 0.015) * k * calm;
  cam.ty += Math.sin(t * 1.3) * 0.12 * k * calm;
};
// colour trip: the engine's LSD colour rotation, driven by the wonk (env.trip is rebuilt every frame)
BW16.hookEnv = function (g) {
  if (g._bw16Env) return; g._bw16Env = true;
  const env = g.env || (g.env = {});
  let raw = 0;
  Object.defineProperty(env, 'trip', {
    configurable: true, enumerable: true,
    get() { const S = BW16.state; const w = S && S.g === g ? (S.wonk || 0) : 0; return Math.max(raw, w > 0 ? w * (S.calm ? 0.18 : 0.34 + 0.1 * Math.sin(g.time * 0.6)) : 0); },
    set(v) { raw = v; }
  });
};

/* ---------------- the Yoga Yoni Tantra Enlightenment Dance Contest ---------------- */
BW16.RIVALS = [
  { id: 'moonbeam', name: 'MOONBEAM STARCHILD', sub: 'Interpretive aura dance', anim: 'bw16Aura', dur: 3.4, score: 7.1,
    fx(g, a, t) { if (Math.random() < 0.3) g.fx.add(a.x + (Math.random() - 0.5) * 1.6, a.y + Math.random() * 2, a.z + (Math.random() - 0.5) * 1.6, 0, 0.6, 0, 1.4, 0.4, 0.05, [0.85, 0.75, 1], 1, 'star', 1); if (t > 0.6 && t < 0.62) a.say('Ommmmmmmm...', 2); },
    judges: [['auntie', 'Gorgeous stillness. I felt that in my sacrum.'], ['bambam', 'Was she... dancing?'], ['wolfie', 'She levitated, man. Two whole inches. Seven point one.']] },
  { id: 'glitter', name: 'GLITTER', sub: 'Sparkle pony freestyle', anim: 'bw16Twirl', dur: 3.2, score: 7.8,
    fx(g, a, t) { if (Math.random() < 0.35) g.fx.confetti(a.x, a.y + 1.8, a.z, 2); if (t > 2.45 && t < 2.47) a.say('Can someone get me water? And a chair? And a sponsor?', 2.6); },
    judges: [['bambam', 'BAM! SPARKLY!'], ['auntie', 'Hydrate, sweetie.'], ['wolfie', 'Seven point eight. Minus a point for asking the judges for water.']] },
  { id: 'fluff', name: 'SIR FLUFFINGTON', sub: 'The robot, in a full fursuit', anim: 'bw16Melt', dur: 3.6, score: 8.4,
    fx(g, a, t) { if (t > 1.3 && Math.random() < 0.4) g.fx.smoke(a.x, a.y + 2.0, a.z, 1, '#f4f4f4'); if (t > 1.5 && t < 1.52) a.say('SO HOT. SO HOT IN HERE.', 2); if (t > 3.0 && t < 3.02) a.say('I\'m fine. I\'m SO fine.', 2); },
    judges: [['wolfie', 'Sir Fluffington, are you okay in there?'], ['fluff', 'Never better. Can\'t feel my paws.'], ['auntie', 'Commitment! Fur in the desert! Eight point four!']] }
];
BW16.TO_BEAT = 8.4;
BW16.MARKS = function () {
  const F = BW16.F, J = BW16.JUDGES;
  return {
    brady: { x: F.x, z: F.z - 0.4, yaw: 0 },
    bradyWait: { x: F.x - 6.0, z: F.z + 1.2, yaw: Math.PI / 2 },
    perform: { x: F.x, z: F.z + 0.6, yaw: 0 },
    rivals: [{ x: F.x + 5.6, z: F.z - 1.6 }, { x: F.x + 6.3, z: F.z + 0.4 }, { x: F.x + 5.8, z: F.z + 2.4 }],
    judges: { wolfie: { x: J.x - 1.8, z: J.z + 1.0 }, auntie: { x: J.x, z: J.z + 1.0 }, bambam: { x: J.x + 1.8, z: J.z + 1.0 } },
    guru: { x: F.x + 0.9, z: F.z - 7.5, y: BW16.state.booth.y }
  };
};
// everyone to their marks for the contest
BW16.stageContest = function (g) {
  const Mk = BW16.MARKS(), F = BW16.F;
  BW16.RIVALS.forEach((r, i) => { const a = g.actor(r.id); if (a) BW16.place(a, Mk.rivals[i].x, Mk.rivals[i].z, -Math.PI / 2, 'idle'); });
  for (const id of ['wolfie', 'auntie', 'bambam']) { const a = g.actor(id), q = Mk.judges[id]; if (a) BW16.place(a, q.x, q.z, Math.PI, 'sit'); }
  const gu = g.actor('guru'); if (gu) { gu.x = Mk.guru.x; gu.z = Mk.guru.z; gu.y = Mk.guru.y; gu.def.fixedY = true; BW16.stage(gu, 'welcome'); gu.yaw = 0; }
  const p = g.player; if (p.vehicle) p.vehicle.dismount(p);
  p.teleport(Mk.bradyWait.x, F.h, Mk.bradyWait.z, Mk.bradyWait.yaw);
  for (const a of g.actors) if (a.def.bw16Crowd) { a.data.cheer = 0; }
};
BW16.judge = (g, id) => g.actor(id) || id;
BW16.contest = function (g, retry) {
  const S = BW16.state, F = BW16.F, Mk = BW16.MARKS(), p = g.player;
  if (S.contest) return;
  if (g.missions.state('contest') === 'available') g.missions.start('contest', true);
  S.contest = { retry: !!retry, r: [] };
  BW16.stageContest(g);
  const camWide = { x: F.x + 7.5, y: F.h + 4.2, z: F.z + 13, tx: F.x, ty: F.h + 1.4, tz: F.z - 1.5, fov: 0.85 };
  const camPerf = { x: F.x - 1.5, y: F.h + 2.2, z: F.z + 7.2, tx: F.x, ty: F.h + 1.3, tz: F.z + 0.4, fov: 0.78 };
  const camJudges = { x: F.x + 1.5, y: 2.3, z: BW16.JUDGES.z - 4.5, tx: BW16.JUDGES.x, ty: 1.2, tz: BW16.JUDGES.z + 1, fov: 0.85 };
  const steps = [
    { music: BW16.track('burns_w16', 'land9') },
    { cam: camWide },
    { banner: ['THE YOGA YONI TANTRA', 'ENLIGHTENMENT DANCE CONTEST', { col: '#ffd36a', big: true, dur: 3.2 }] },
    { say: [BW16.judge(g, 'guru'), retry ? ['Welcome back to the floor, seeker.', 'The score to beat is still EIGHT POINT FOUR. Breathe. And then DANCE.'] : ['Namaste, Rhythm Wave! Welcome to the seventh annual Yoga Yoni Tantra Enlightenment Dance Contest!', 'Tonight\'s judges: Wolfie! Auntie Namaste! And... Bam Bam.']] }
  ];
  if (!retry) {
    steps.push({ say: [BW16.judge(g, 'bambam'), ['BAM! BAM!']] });
    BW16.RIVALS.forEach((r, i) => {
      steps.push(
        { do: g2 => { const a = g2.actor(r.id); if (a) BW16.walkTo(a, Mk.perform.x, Mk.perform.z, 0, 'idle'); } },
        { cam: camPerf },
        { until: (g2, c) => { const a = g2.actor(r.id); return !a || !a.data.goto || c.t > 4; } },
        { do: g2 => { const a = g2.actor(r.id); if (a) { a.yaw = 0; a.data.anim = r.anim; a.ch.play(r.anim, null, true); a.ch.animT = 0; } g2.banner(r.name, r.sub, { col: '#ff9ad8', small: true }); } },
        { until: (g2, c) => { const a = g2.actor(r.id); if (a) r.fx(g2, a, c.t); return c.t > r.dur; } },
        { cam: camJudges }
      );
      for (const [who, line] of r.judges) steps.push({ say: [BW16.judge(g, who), [line]] });
      steps.push(
        { do: g2 => { for (const id of ['wolfie', 'auntie', 'bambam']) { const a = g2.actor(id); if (a) { a.data.anim = 'bw16Card'; a.say(id === 'bambam' ? 'BAM/10' : r.score.toFixed(1), 1.6); } } burnsSfx('crowd_cheer', { vol: 0.45 }); g2.banner(r.name, 'SCORE: ' + r.score.toFixed(1), { col: '#ffd36a', small: true }); } },
        { wait: 1.3 },
        { do: g2 => { for (const id of ['wolfie', 'auntie', 'bambam']) { const a = g2.actor(id); if (a) a.data.anim = 'sit'; } const a = g2.actor(r.id); if (a) BW16.walkTo(a, Mk.rivals[i].x, Mk.rivals[i].z, -Math.PI / 2, 'idle'); } }
      );
    });
  }
  steps.push(
    { cam: camWide },
    { do: g2 => { p.teleport(Mk.brady.x, F.h, Mk.brady.z, Mk.brady.yaw); g2.camYaw = Math.PI; } },
    { say: [BW16.judge(g, 'guru'), ['And now... our newest seeker. No camp. No shoes. Excellent bun.', 'Score to beat: EIGHT POINT FOUR. Tap ▲ JUMP and ◉ SPIN on the beat. Find your flow!']] },
    { say: ['brady', ['I\'ve never won anything. I got second in a spelling bee. There were two of us.']] }
  );
  g.cutscene(steps, () => BW16.round(g, 0));
};
BW16.ROUNDS = [
  { title: 'ROUND 1 · SUN SALUTATIONS', duration: 16, difficulty: 0.35 },
  { title: 'ROUND 2 · THE TANTRIC SHUFFLE', duration: 18, difficulty: 0.55 }
];
BW16.MOVES = [[{ n: 'SUN SALUTE', pose: 1, col: '#ffd36a' }, { n: 'ROOT DROP', pose: 3, col: '#ff9a4a' }], [{ n: 'LOTUS TWIST', pose: 2, col: '#ff9ad8' }, { n: 'COSMIC WAVE', pose: 4, col: '#38f2ff' }]];
BW16.round = function (g, i) {
  const S = BW16.state, F = BW16.F, p = g.player, R = BW16.ROUNDS[i], Mk = BW16.MARKS();
  if (!S.contest) return;
  p.teleport(Mk.brady.x, F.h, Mk.brady.z, 0);
  const D = BW16.dance = { pose: 0, poseT: 9, bpm: BW16.BPM, groove: i * 2, hits: 0, pop: null, round: i };
  const cam = () => Game.cssH > Game.cssW ? { x: F.x + 1.4, y: F.h + 3.7, z: F.z + 12.8, tx: F.x, ty: F.h + 1.4, tz: F.z - 1.2, fov: 0.85 } : { x: F.x + 2.4, y: F.h + 2.5, z: F.z + 8.0, tx: F.x, ty: F.h + 1.55, tz: F.z - 0.8, fov: 0.78 };
  const done = res => {
    BW16.dance = null; S.contest.r[i] = res || { score: 0, grade: 'D' };
    if (i === 0) {
      const gr = S.contest.r[0].grade, lines = { S: 'Your chakras are SINGING. Round two!', A: 'Beautiful! The floor is purring.', B: 'Good energy! Let it flow wider.', C: 'Your aura is... trying. Round two!', D: 'Interesting choices. Bold. Round two!' };
      g.say(BW16.judge(g, 'guru'), [lines[gr] || lines.C, 'ROUND TWO: THE TANTRIC SHUFFLE. Faster. Deeper. Shufflier.'], () => BW16.round(g, 1));
    } else BW16.result(g);
  };
  if (typeof BW567K === 'undefined' || !BW567K.rhythm) { done({ score: 0.7, grade: 'B' }); return; }
  g.banner(R.title, 'Tap ▲ JUMP and ◉ SPIN on the beat!', { col: '#ffd36a' });
  BW567K.rhythm(g, {
    title: R.title, bpm: BW16.BPM, duration: R.duration, difficulty: R.difficulty, cam, anim: 'bw16Yoga', music: BW16.track('burns_w16', 'land9'),
    onBeat(g2, bt) {
      if (bt === 0) burnsMusic(BW16.track('burns_w16', 'land9'));
      if (bt % 8 === 0) D.groove = (D.groove + 1) % 6;
      for (const a of g2.actors) if (a.def.bw16Crowd && a.data) { a.data.cheer = Math.max(0, (a.data.cheer || 0) - 0.15); }
    },
    onHit(g2, n, pts) {
      const mv = BW16.MOVES[n.lane ? 1 : 0][D.hits % 2]; D.hits++;
      D.pose = mv.pose; D.poseT = 0; D.pop = { text: mv.n + (pts === 1 ? '!' : ''), col: mv.col, t: 0 };
      if (pts === 1) { g2.fx.burst(p.x, p.y + 2.1, p.z, 'star', 5, mv.col); g2.fx.ring(p.x, F.h + 0.05, p.z, 1.8, mv.col, 0.4); }
      if (D.hits % 6 === 0) { const cr = g2.actors.filter(a => a.def.bw16Crowd); const a = cr[Math.floor(Math.random() * cr.length)]; if (a) a.say(['NAMASTE!', 'YES, BUN MAN!', 'SO ENLIGHTENED!', 'I FELT THAT!', 'HE\'S FLOWING!'][Math.floor(Math.random() * 5)], 1.4); }
    },
    onMiss(g2, n) { D.pop = { text: 'NAMA-STUMBLE', col: '#ff6a6a', t: 0 }; D.pose = 0; },
    onDone: done
  });
};
BW16.result = function (g) {
  const S = BW16.state, C = S.contest, F = BW16.F, p = g.player;
  const s1 = (C.r[0] || {}).score || 0, s2 = (C.r[1] || {}).score || 0, tot = 0.4 * s1 + 0.6 * s2;
  const score = Math.round((6 + 4 * tot) * 10) / 10, win = score > BW16.TO_BEAT;
  C.score = score; C.win = win;
  const camJudges = { x: F.x + 1.5, y: 2.3, z: BW16.JUDGES.z - 4.5, tx: BW16.JUDGES.x, ty: 1.2, tz: BW16.JUDGES.z + 1, fov: 0.85 };
  const camBrady = { x: F.x + 1.2, y: F.h + 1.9, z: F.z + 4.6, tx: F.x, ty: F.h + 1.4, tz: F.z - 0.4, fov: 0.8 };
  const cards = { wolfie: clamp(score + 0.1, 0, 10).toFixed(1), auntie: clamp(score + (win ? 0.4 : -0.2), 0, 10).toFixed(1), bambam: 'BAM/10' };
  const steps = [
    { cam: camJudges },
    { do: g2 => { for (const id of ['wolfie', 'auntie', 'bambam']) { const a = g2.actor(id); if (a) { a.data.anim = 'bw16Card'; a.say(cards[id], 2.2); } } burnsSfx('crowd_cheer', { vol: 0.5 }); } },
    { wait: 1.4 },
    { banner: [win ? 'A NEW CHAMPION!' : 'SO CLOSE!', 'BRADY: ' + score.toFixed(1) + '  ·  TO BEAT: ' + BW16.TO_BEAT.toFixed(1), { col: win ? '#ffd36a' : '#ff9a9a', big: true, dur: 3 }] }
  ];
  if (win) {
    steps.push(
      { do: g2 => { for (const id of ['wolfie', 'auntie', 'bambam']) { const a = g2.actor(id); if (a) a.data.anim = 'cheer'; } for (const a of g2.actors) if (a.def.bw16Crowd) BW16.stage(a, 'cheer'); p.animOverride = 'victory'; } },
      { cam: camBrady },
      { flash: '#ffd36a' }, { shake: 0.3 },
      { do: g2 => { g2.fx.confetti(p.x, p.y + 3, p.z, 70); burnsSfx('crowd_cheer'); } },
      { say: [BW16.judge(g, 'wolfie'), ['AWOOOO! That was the most enlightened thing this floor has ever felt!', 'Brady, you\'re the Yoga Yoni Tantra Enlightenment Champion. The Hammock of Honor is yours tonight.']] },
      { say: ['brady', ['I WON something! I won a THING!']] },
      { do: g2 => { p.animOverride = null; S.contest = null; g2.missions.complete('contest'); } }
    );
    g.cutscene(steps, () => BW16.pill(g));
  } else {
    steps.push(
      { say: [BW16.judge(g, 'guru'), ['The judges have spoken. Sir Fluffington... wins!', '...Sir Fluffington has passed out from the heat. Somebody get him ice.']] },
      { say: [BW16.judge(g, 'wolfie'), ['So close, my dude. The floor felt you. Mostly.', 'Rematch whenever you\'re ready. Talk to me.']] },
      { do: g2 => { S.contest = null; for (const id of ['wolfie', 'auntie', 'bambam']) { const a = g2.actor(id); if (a) a.data.anim = 'sit'; } if (g2.missions.state('contest') === 'active') g2.missions.fail('contest', 'Sir Fluffington wins... technically'); BW16.afterContest(g2, false); } }
    );
    g.cutscene(steps);
  }
};
// after the contest: the judges stand up and go back to hanging out on the floor
BW16.afterContest = function (g, won) {
  const F = BW16.F;
  const w = g.actor('wolfie'); if (w) BW16.place(w, F.x - 3.0, F.z + 7.6, Math.PI, 'idle');
  const b = g.actor('bambam'); if (b) BW16.place(b, F.x + 2.6, F.z + 6.4, Math.PI, won ? 'bw16Bonk' : 'idle');
  const a = g.actor('auntie'); if (a) BW16.place(a, BW16.KITCHEN.x + 1.5, BW16.KITCHEN.z + 1.5, 0.4, 'cheer');
  for (const a2 of g.actors) if (a2.def.bw16Crowd) BW16.stage(a2, 'dance', { style: a2.def.style || 0, bpm: BW16.BPM });
};

/* ---------------- the pill ---------------- */
BW16.pill = function (g) {
  const S = BW16.state, F = BW16.F, p = g.player, bam = g.actor('bambam'), wolf = g.actor('wolfie');
  BW16.afterContest(g, true);
  if (bam) BW16.place(bam, p.x + 1.3, p.z + 1.1, Math.atan2(p.x - (p.x + 1.3), p.z - (p.z + 1.1)), 'idle');
  if (wolf) BW16.place(wolf, p.x + 1.75, p.z - 0.75, Math.atan2(-1.1, 1.3), 'idle');   // behind the pair, facing them
  p.yaw = Math.atan2(1.3, 1.1);
  // Brady -> Bam Bam axis (dx, dz) and its side vector (sx, sz): over-the-shoulder shots both ways
  const L = Math.hypot(1.3, 1.1), dx = 1.3 / L, dz = 1.1 / L, sx = -dz, sz = dx, bx = p.x + 1.3, bz = p.z + 1.1;
  const two = { x: p.x + 0.65 + sx * 3.4, y: p.y + 1.65, z: p.z + 0.55 + sz * 3.4, tx: p.x + 0.65, ty: p.y + 1.35, tz: p.z + 0.55, fov: 0.7 };
  const onBam = { x: p.x - dx * 1.3 + sx * 0.55, y: p.y + 1.85, z: p.z - dz * 1.3 + sz * 0.55, tx: bx, ty: p.y + 1.6, tz: bz, fov: 0.62 };
  const onBrady = { x: bx + dx * 1.3 + sx * 0.5, y: p.y + 1.8, z: bz + dz * 1.3 + sz * 0.5, tx: p.x, ty: p.y + 1.5, tz: p.z, fov: 0.62 };
  const wide = { x: p.x + 0.2 + sx * 4.2 - dx * 1.2, y: p.y + 2.1, z: p.z + 0.2 + sz * 4.2 - dz * 1.2, tx: p.x + 0.1, ty: p.y + 1.3, tz: p.z + 0.6, fov: 0.8 };
  const away = { x: F.x + 4.2, y: F.h + 2.0, z: F.z - 3.2, tx: S.speakers[1].x, ty: F.h + 2.0, tz: S.speakers[1].z, fov: 0.75 };
  const face = () => ({ x: p.x + Math.sin(p.yaw) * 1.25, y: p.y + 1.62, z: p.z + Math.cos(p.yaw) * 1.25, tx: p.x, ty: p.y + 1.6, tz: p.z, fov: 0.55 });
  g.cutscene([
    { cam: two },
    { say: [bam || 'bambam', ['BAM! BAM! Champion! That shuffle was PREHISTORIC!']] },
    { cam: onBam },
    { say: [bam || 'bambam', ['Champions get the good stuff. Sassafras. Ancient recipe. Family secret.', 'Take HALF. Half! Wolfie, tell him.']] },
    { cam: wide },
    { say: [wolf || 'wolfie', ['Half, my dude.']] },
    { cam: onBrady },
    { say: ['brady', ['Half. Totally. Got it.']] },
    { cam: away },
    { do: g2 => { burnsSfx('pickup_bag', { pitch: 0.6 }); g2.banner('*GULP*', '', { col: '#ffffff', small: true, dur: 1.1 }); } },
    { wait: 1.2 },
    { cam: onBam },
    { say: [bam || 'bambam', ['...Champ. Where\'s the other half?']] },
    { do: g2 => { S.spiral = 1; S.spiralT = 0; } },
    { cam: face() },
    { wait: 0.6 },
    { say: ['brady', ['...was that half?']] },
    { do: g2 => { BurnsSave.setGroundScore(true); BW16.wonkOn(g2); g2.flag('pill', true); S.wonk = Math.max(S.wonk || 0, 0.35); } },
    { swell: BW16.track('burns_w16_wonk', 'glitch') },
    { slowmo: 0.35, dur: 2.0 }, { flash: '#ff9ad8' }, { shake: 0.4 },
    { orbit: { actor: 'brady', r0: 3.5, r1: 7, h0: 1.6, h1: 3.6, a0: p.yaw, a1: p.yaw + 2.6, ty: 1.4, dur: 3.4, fov: 0.85 } },
    { say: [wolf || 'wolfie', ['Ohhh, he\'s gonna be WONKY AS A DONKEY.']] },
    { cam: { x: F.x - 4, y: F.h + 2.0, z: F.z + 10, tx: 26, ty: 34, tz: 68, fov: 0.95 } },
    { say: ['brady', ['Guys. Guys. There\'s a DONKEY. In the SKY.']] },
    { say: [bam || 'bambam', ['There is no donkey, champ.', 'Hey. Ground scores are gonna start showing up for you now. Little baggies. On the ground.', 'Stash \'em in your backpack. Trade \'em. Don\'t eat \'em all at once. I see you, champ.']] },
    { cam: two },
    { say: [wolf || 'wolfie', ['Go see the giant glowing mushrooms out on the playa. They bounce. You\'ll love them. They\'ll love you.', 'Take the camp bike. The yellow one. ...Wherever it went.']] },
    { do: g2 => { S.spiral = 0; g2.missions.start('bike'); g2.missions.start('gs101', true); burnsMusic(BW16.track('burns_w16_wonk', 'glitch')); } }
  ], g2 => { g2.banner('GROUND SCORES', 'Baggies now show up on the playa. Pick them up: they go in your BACKPACK.', { col: '#ff9ad8', dur: 4 }); });
};

/* ---------------- the 2D layer: spiral eyes, contest board, hoist meter, wonky vignette ---------------- */
BW16.spiralEyes = function (ctx, g) {
  const S = BW16.state, p = g.player, R = g.R; if (!R || !R.project || g.firstPerson && g.firstPerson()) return;
  const show = S.spiral || (S.wonk > 0.3 && !g.paused);
  if (!show) return;
  const B = BURNS_BONES, W = Game.cssW, H = Game.cssH, o = {}, q = [0, 0, 0], f = [0, 0, 0];
  p.ch.bonePoint(B.HEAD, 0, 0.213, 0.2, q); p.ch.bonePoint(B.HEAD, 0, 0.213, 0.6, f);
  const cam = g.cam, fx = f[0] - q[0], fz = f[2] - q[2], cx = cam.x - q[0], cz = cam.z - q[2];
  if (fx * cx + fz * cz <= 0.05 * Math.hypot(cx, cz) * Math.hypot(fx, fz)) return;   // only when he faces the camera
  const t = g.time;
  for (const sd of [1, -1]) {
    p.ch.bonePoint(B.HEAD, sd * 0.068, 0.214, 0.205, q);
    if (!R.project(q[0], q[1], q[2], W, H, o)) continue;
    const sc = clamp(1.6 / Math.max(0.3, o.w), 0, 6), r = 0.055 * sc * H * 0.55; if (r < 1.2) continue;
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(t * 6 * sd);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a1030'; ctx.lineWidth = Math.max(1, r * 0.16); ctx.beginPath();
    for (let a = 0; a < 3.2 * TAU; a += 0.2) { const rr = r * 0.9 * a / (3.2 * TAU), x = Math.cos(a) * rr, y = Math.sin(a) * rr; if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke(); ctx.restore();
  }
};
BW16.overlayUnder = function (ctx, g, fdt) {
  const S = BW16.state, W = Game.cssW, H = Game.cssH;
  BW16.spiralEyes(ctx, g);
  // the wonky vignette: slow rainbow at the edges
  const k = S.wonk || 0;
  if (k > 0.01 && g.state === 'play') {
    const hue = (g.time * (S.calm ? 12 : 40)) % 360, a = (S.calm ? 0.1 : 0.2) * k;
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.32, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, `hsla(${hue},90%,60%,0)`); v.addColorStop(0.7, `hsla(${(hue + 60) % 360},90%,60%,${a * 0.5})`); v.addColorStop(1, `hsla(${(hue + 140) % 360},95%,55%,${a})`);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
};
BW16.overlayOver = function (ctx, g, fdt) {
  const S = BW16.state, W = Game.cssW, H = Game.cssH, Sf = BurnsUI.safe(), portrait = H > W;
  if (g.paused || g.state !== 'play') return;
  // contest: the score to beat + the move names
  if (S.contest && !g.cine && !g.dialog.open) {
    const y = portrait ? Sf.t + 330 : H - Sf.b - 36, txt = 'TO BEAT: ' + BW16.TO_BEAT.toFixed(1) + (S.contest.r[0] ? '   ·   ROUND 1: ' + (6 + 4 * S.contest.r[0].score).toFixed(1) : '');
    ctx.save(); ctx.font = `600 12px ${FONT_UI}`; const tw = ctx.measureText(txt).width + 30; ctx.restore();
    BurnsUI.pill(ctx, W / 2 - tw / 2, y - 13, tw, 26, 'rgba(30,10,30,0.7)', 'rgba(255,211,106,0.6)');
    BurnsUI.text(ctx, txt, W / 2, y + 0.5, 12, '#ffe8b0', { ui: true, stroke: false });
    const D = BW16.dance;
    // the move name pops in the gap under the rhythm panel (panel bottom: safe top + 140 landscape / + 274 portrait)
    if (D && D.pop) {
      D.pop.t += fdt; const a = clamp(1.2 - D.pop.t * 1.4, 0, 1);
      if (a > 0) {
        const py = Math.max(Sf.t + (portrait ? 274 : 140) + (portrait ? 34 : 32), portrait ? H * 0.5 : 0), sz = (portrait ? 24 : 26) * (1 + 0.25 * Math.max(0, 1 - D.pop.t * 6));
        ctx.save(); ctx.globalAlpha = a; BurnsUI.text(ctx, D.pop.text, W / 2, py + D.pop.t * 8, sz, D.pop.col, { glow: D.pop.col }); ctx.restore();
      } else D.pop = null;
    }
  }
  // hoist meter next to the winch you're at
  if (g.missions.state('sails') === 'active' && !g.cine) {
    const p = g.player, o = {};
    for (const s of S.sails) {
      if (s.done || Math.hypot(p.x - s.winch.x, p.z - s.winch.z) > 3.2) continue;
      if (!g.R.project(s.winch.x, 2.2, s.winch.z, W, H, o)) continue;
      const bw = 14, bh = 70, x = clamp(o.x + 34, 10, W - 30), y = clamp(o.y - bh, 60, H - bh - 20);
      ctx.save(); ctx.fillStyle = 'rgba(10,6,24,0.65)'; burnsRR(ctx, x - 4, y - 4, bw + 8, bh + 8, 8); ctx.fill();
      ctx.fillStyle = s.sl.col; ctx.fillRect(x, y + bh * (1 - s.k), bw, bh * s.k); ctx.restore();
      BurnsUI.text(ctx, 'TAP ◉ ACTION!', x + bw / 2, y - 14, 11, '#ffffff', { glow: s.sl.col });
    }
  }
};
(() => {
  const prev = BurnsUI.drawOverlay;
  BurnsUI.drawOverlay = function (ctx, g, fdt) {
    const mine = g && g.worldId === BW16.ID && BW16.state && BW16.state.g === g && g.player;
    if (mine) { try { BW16.overlayUnder(ctx, g, fdt); } catch (e) { BW16.err(e); } }
    // during a dance-off round the rhythm panel owns the top of the screen: hide the mission tracker pill
    const M = mine && BW16.state.contest && g.bw567rhythm ? g.missions : null;
    if (M) M.tracker = () => null;
    try { prev.call(this, ctx, g, fdt); } finally { if (M) delete M.tracker; }
    if (mine) { try { BW16.overlayOver(ctx, g, fdt); } catch (e) { BW16.err(e); } }
  };
})();
