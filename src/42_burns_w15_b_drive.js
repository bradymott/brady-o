/* ============================================================
   BRADY GOES TO BURNING MAN — World 15 "EXODUS": driving + the trip
   The Party Barge controller (an override of the art car's ride),
   the TRIP METER and everything it makes wonky (rippling ribbon
   road, rainbow trails, melting sky, breathing mountains, wings,
   the unicorn, talking signs, floating jellyfish), the Exodus line
   and its pulses, and the last-bag givers.
   ============================================================ */

const BW15D = {
  /* ---------------- per-visit state ---------------- */
  init(g) {
    const S = BW15.state = {
      g, rv: null, v: 0, steer: 0, wob: 0, s: 0, lat: 0, onRoad: false, paved: false, zone: 'line', bump: 0, honkT: 0, revT: 0, scripted: null, ap: null,
      trip: { bags: 0, level: 0, show: 0, peak: 0 }, bagIds: {},
      form: { mode: 'rv', t: 0, end: 0, k: 0 }, parts: {}, ribbon: { segs: [], amp: 0 }, jelly: [], arches: [], signs: [], bubbles: [],
      pulse: { phase: 'hold1', t: 0, stopZ: BW15.STOP_A, gate: false, speed: 0.6, bigT: 0, count: 0, done: false, tries: 0 },
      givers: [], cur: null, cops: [], traps: [], enc: null, chase: null, tail: null, hideK: 0, hideWhy: '',
      devils: [], zones: [], quips: {}, quipT: 0, lastQuip: '', cps: [], card: null, pony: null, ponyAboard: false,
      allowExit: false, ending: false, trail: 0, trailAcc: 0, dustAcc: 0, mapT: 0, t: 0, hud: { speedK: 0, tripK: 0 }
    };
    return S;
  },
  /* ---------------- trip level ---------------- */
  // 0..1 from the bags taken this visit (8 = maximum wonk)
  tripTarget(S) { return clamp(S.trip.bags / 8, 0, 1); },
  // visual intensity (with the peak while a cop is near)
  // (cops make it peak, relative to how many bags are in: no bags, no rainbows)
  tripVis(S) { const L = S.trip.level; return clamp(L + S.trip.peak * Math.min(0.55, L * 0.9), 0, 1.25); },
  /* ---------------- the Party Barge controller ---------------- */
  vmax(S) { return S.zone === 'line' ? 11 : S.paved ? 24 : 16.5; },
  ride(g, rv, p, dt) {
    const S = BW15.state, I = p.inp, W = g.world;
    if (!S) return;
    const locked = p.locked || !!g.cine || g.dialog.open;
    const cy = g.camYaw;
    let sx = 0, sy = 0;
    if (!locked) { sx = I.mx * -Math.cos(cy) + I.mz * Math.sin(cy); sy = I.mx * Math.sin(cy) + I.mz * Math.cos(cy); }
    if (S.ap && !locked) { const a = BW15D.autopilot(g, S); sx = a[0]; sy = a[1]; }
    const vmax = BW15D.vmax(S);
    // ---- throttle: up = gas, down = brake/reverse, neutral = cruise (holds speed)
    if (S.scripted) { S.v = approach(S.v, S.scripted.v, (S.scripted.acc || 6) * dt); }
    else if (locked) S.v = approach(S.v, 0, 5 * dt);
    else if (sy > 0.25) S.v = Math.min(Math.max(S.v, 0) + 6.5 * sy * dt * (S.v < 0 ? 3 : 1), vmax);
    else if (sy < -0.25) { if (S.v > 0.05) S.v = Math.max(0, S.v - 13 * -sy * dt); else { S.revT += dt; if (S.revT > 0.35) S.v = Math.max(-4.5, S.v - 4 * dt); } }
    if (sy >= -0.25) S.revT = 0;
    if (S.v > vmax) S.v = approach(S.v, vmax, 8 * dt);
    // auto-brake behind whatever is ahead (traffic, cops); bumping at speed is still possible
    // (steering lets you crawl out from behind a stopped car)
    const capMin = Math.abs(sx) > 0.35 && sy > -0.25 ? 1.8 : 0;
    if (S.v > 0 && S.capAhead !== undefined && S.v > Math.max(capMin, S.capAhead)) S.v = approach(S.v, Math.max(capMin, S.capAhead), 16 * dt);
    if (capMin && S.v < capMin && sy > 0.25) S.v = Math.min(capMin, S.v + 4 * dt);
    // ---- steering
    S.steer = BurnsM.damp(S.steer, clamp(sx, -1, 1), 7, dt);
    const av = Math.abs(S.v), turn = 1.25 * clamp(av / 3, 0, 1) / (1 + Math.max(0, av - 11) * 0.035);
    let yawRate = -S.steer * turn * (S.v < 0 ? -1 : 1);
    // trip wobble: a lazy sway that the lane assist and the steady taps fight
    const tv = BW15D.tripVis(S), encK = S.enc ? 1.3 : 1, steady = S.enc ? S.enc.steady : 0;
    S.wob = tv * encK * (1 - steady * 0.85) * (0.19 * Math.sin(S.t * 1.25) + 0.11 * Math.sin(S.t * 2.7 + 1.3) + 0.05 * Math.sin(S.t * 5.3));
    yawRate += S.wob * clamp(av / 6, 0, 1);
    // lane assist when the stick is centred
    if (Math.abs(sx) < 0.14 && av > 0.6 && !S.scripted) {
      const target = BW15D.assistYaw(S, rv);
      if (target !== null) { const k = (S.enc ? 1.9 : 2.7) + av * 0.05; yawRate += clamp(BurnsM.wrap(target - rv.yaw) * k, -1.1, 1.1); }
    }
    if (S.scripted && S.scripted.yaw !== undefined) yawRate = clamp(BurnsM.wrap(S.scripted.yaw - rv.yaw) * 3, -1.2, 1.2);
    rv.yaw = BurnsM.wrap(rv.yaw + yawRate * dt);
    // ---- integrate + collide (three circles along the body)
    const fx = Math.sin(rv.yaw), fz = Math.cos(rv.yaw);
    rv.x += fx * S.v * dt; rv.z += fz * S.v * dt;
    BW15D.collide(g, rv, S, dt);
    const B = W.bounds; rv.x = clamp(rv.x, B.x0 + 3, B.x1 - 3); rv.z = clamp(rv.z, B.z0 + 3, B.z1 - 3);
    // ---- road + terrain
    const pr = BW15_ROAD.project(rv.x, rv.z, S.s, S._pr || (S._pr = {}));
    S.s = pr.s; S.lat = pr.lat; S.onRoad = Math.abs(pr.lat) < 6.5 && rv.z > -210;
    S.paved = S.onRoad && pr.s > BW15.S.pave && Math.abs(pr.lat) < 4.6;
    S.zone = rv.z < BW15.GATE_Z + 6 && Math.abs(rv.x) < 22 ? 'line' : pr.s > BW15.S.welcome - 10 ? 'town' : S.onRoad ? 'road' : 'off';
    let y = W.height(rv.x, rv.z);
    if (S.ribbon.amp > 0.01) y += BW15D.ripple(S, S.s) * BurnsM.smoothstep(6.5, 3.6, Math.abs(S.lat));
    const fm = S.form, hover = (fm.mode === 'wings' || fm.mode === 'pegacorn') ? fm.k * (0.55 + 0.25 * Math.sin(S.t * 3.1)) : 0;
    rv.y = y + hover;
    const h1 = W.height(rv.x + fx * 3, rv.z + fz * 3), h0 = W.height(rv.x - fx * 3, rv.z - fz * 3);
    const lx = Math.cos(rv.yaw), lz = -Math.sin(rv.yaw), hl = W.height(rv.x + lx * 1.2, rv.z + lz * 1.2), hr = W.height(rv.x - lx * 1.2, rv.z - lz * 1.2);
    const gallop = fm.mode === 'unicorn' || fm.mode === 'pegacorn' ? fm.k * Math.abs(Math.sin(S.t * 7)) * clamp(av / 8, 0, 1) * 0.35 : 0;
    rv.y += gallop;
    const mv = rv.mv;
    mv.x = rv.x; mv.y = rv.y; mv.z = rv.z; mv.yaw = rv.yaw;
    mv.pitch = BurnsM.damp(mv.pitch || 0, -Math.atan((h1 - h0) / 6) + Math.sin(S.t * 9) * 0.004 * clamp(av / 10, 0, 1), 8, dt);
    mv.roll = BurnsM.damp(mv.roll || 0, Math.atan((hl - hr) / 2.4) + S.steer * clamp(av / 22, 0, 1) * 0.045 + S.wob * 0.08, 6, dt);
    // ---- Brady at the helm
    const sp = rv.seatPos(S._sp || (S._sp = [0, 0, 0]));
    p.x = sp[0]; p.y = sp[1]; p.z = sp[2]; p.yaw = rv.yaw; p.vx = fx * S.v; p.vz = fz * S.v; p.vy = 0; p.grounded = true;
    if (p.animOverride) p.ch.play(p.animOverride);
    else if (S.waveT > 0) { S.waveT -= dt; p.ch.play('wave'); }
    else p.ch.play('drive', { steer: clamp(S.steer + S.wob * 0.6, -1, 1) });
    // ---- horn, actions
    if (I.jumpPressed && !locked) BW15D.honk(g, S);
    if (I.actionPressed && !locked) BW15D.action(g, S);
    if (Sound.engine) Sound.engine(!g.cine || Math.abs(S.v) > 0.5, clamp(av / 24, 0.05, 1));
    BW15D.poseParts(g, S, dt);
    BW15D.collectPickups(g, S);
    BW15D.dustAndTrails(g, S, dt);
  },
  // heading the lane assist steers toward (null = no assist)
  assistYaw(S, rv) {
    if (S.zone === 'line') {
      // snap to the nearest lane or corridor, facing down the line
      const xs = [-14, -10.5, -7, -3.5, 0, 3.5, 7, 10.5, 14];
      let bx = xs[0]; for (const x of xs) if (Math.abs(rv.x - x) < Math.abs(rv.x - bx)) bx = x;
      return S.v >= 0 ? clamp((bx - rv.x) * 0.12, -0.3, 0.3) : null;
    }
    if (!S.onRoad) return null;
    const a = BW15_ROAD.at(S.s + (S.v >= 0 ? 4 : -4), 0, S._as || (S._as = {}));
    const laneT = S.lat > 0.4 && S.lat < 6 ? BW15.LANE_W / 2 : -BW15.LANE_W / 2;
    const want = a.yaw - clamp((S.lat - laneT) * 0.09, -0.32, 0.32);
    return S.v >= 0 ? want : null;
  },
  // three-circle push against static props and other vehicles
  collide(g, rv, S, dt) {
    const W = g.world, c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    let tx = 0, tz = 0, hits = 0;
    const e = S._ce || (S._ce = { x: 0, z: 0 });
    for (const off of [3.4, 0.2, -3.2]) {
      const cx = rv.x + s * off, cz = rv.z + c * off;
      e.x = cx; e.z = cz;
      const hit = W.push(e, 1.32, rv.y - 0.3, 3.2, 0.4, rv.mv);
      if (hit) { tx += e.x - cx; tz += e.z - cz; hits++; }
    }
    if (!hits) { S.bump = Math.max(0, S.bump - dt); return; }
    const d = Math.hypot(tx, tz) || 1;
    rv.x += tx / hits; rv.z += tz / hits;
    const frontal = -(tx / d * s + tz / d * c) * Math.sign(S.v || 1);
    if (frontal > 0.45 && Math.abs(S.v) > 4.5 && S.bump <= 0) {
      S.bump = 0.8; S.v *= 0.25; g.shake(0.35); burnsSfx('bump'); g.fx.dust(rv.x + s * 4.5, rv.y + 0.6, rv.z + c * 4.5, 10);
      BW15D.quip(g, 'bonk', ['Babe! Our RV!', 'BONK. That\'s gonna leave a sticker.', 'We\'re fine! Everything\'s fine!', 'Steering! Remember steering?']);
    } else S.v *= Math.max(0, 1 - dt * (frontal > 0.3 ? 4 : 0.8));
  },
  honk(g, S) {
    if (S.honkT > 0) return; S.honkT = 0.5; S.honks = (S.honks || 0) + 1;
    burnsSfx('artcarHorn'); g.fx.notes(S.rv.x, S.rv.y + 4, S.rv.z);
    for (const a of g.actors) if (!a.hidden && a.friendly && a !== S.chinka && Math.hypot(a.x - S.rv.x, a.z - S.rv.z) < 16) a.say(['WOOO!', 'BYE!', 'SEE YOU NEXT YEAR!', 'PARTY BARGE!', 'Honk honk!'][Math.floor(Math.random() * 5)], 1.4);
    if (S.enc) BW15D.encHonk(g, S);
  },
  // ACTION while driving: steady the wheel, take a bag, pick up a hitchhiker, or ask Chinka about the map
  action(g, S) {
    if (!S) return;
    if (S.enc) { BW15C.encTap(g, S); return; }
    const gv = BW15D.readyGiver(S); if (gv) { BW15D.takeBag(g, S, gv); return; }
    if (S.pony && !S.ponyAboard && BW15D.ponyReady(g, S)) { BW15W.boardPony(g, S); return; }
    BW15D.mapHint(g, S);
  },
  ponyReady(g, S) { const a = S.pony, rv = S.rv; if (!a || S.ponyAboard || a.hidden || S.ending) return false; return Math.abs(S.v) < 2 && Math.hypot(a.x - rv.x, a.z - rv.z) < 13; },
  actionLabel(g) {
    const S = BW15.state; if (!S) return 'MAP';
    if (S.enc) return 'STEADY';
    const gv = BW15D.readyGiver(S); if (gv) return 'TAKE';
    if (S.pony && !S.ponyAboard && BW15D.ponyReady(g, S)) return 'PICK UP';
    return 'MAP';
  },
  /* ---------------- pickups: the RV's whole footprint collects ---------------- */
  collectPickups(g, S) {
    const rv = S.rv, c = Math.cos(rv.yaw), s = Math.sin(rv.yaw), lsd = false;
    for (const P of g.pickups.items) {
      if (P.taken) continue;
      const dx = P.x - rv.x, dz = P.z - rv.z;
      if (dx > 7 || dx < -7 || dz > 7 || dz < -7) continue;
      if (P.hidden && !lsd) continue;
      if (P.gate && g.missions.state(P.mission) !== 'active') continue;
      if (P.w15fly) continue;
      const lx = dx * c - dz * s, lz = dx * s + dz * c;
      if (Math.abs(lx) < 1.9 && Math.abs(lz) < 5.4 && P.y0 > rv.y - 0.8 && P.y0 < rv.y + 5) { P.taken = true; P.obj.visible = false; g.onPickup(P); }
    }
  },
  // every baggie in this world feeds the trip meter instead of a power-up (nobody is ever shown using them)
  bagTaken(g, S, power) {
    const id = S.lastBagId || null; S.lastBagId = null;
    const P = BURNS_POWERUPS[power] || BURNS_POWERUPS.water;
    S.trip.bags++;
    burnsSfx('pickup_bag'); g.fx.confetti(S.rv.x, S.rv.y + 4, S.rv.z, 26); g.fx.burst(S.rv.x, S.rv.y + 4, S.rv.z, 'star', 14, P.col);
    g.banner('LAST BAG!', `${P.label} · TRIP METER ${Math.min(8, S.trip.bags)}/8`, { col: P.col, small: true });
    // persistent progress for the "Every Last Bag" token
    if (id && !BurnsSave.flag(15, id)) {
      BurnsSave.flag(15, id, true);
      if (g.missions.state('bags') === 'active') g.missions.progress('bags', 1);
    }
    const n = S.trip.bags;
    const lines = [
      ['Babe. The road just... waved at us.', 'Is the steering wheel always this... wheel-y?'],
      ['Okay the sky is doing a little dance now.', 'Why are the cones so FRIENDLY?'],
      ['Rainbows! Behind us! Are we the rainbow?', 'I can hear the color pink.'],
      ['The mountains are breathing. In. Out. Respect.', 'That cloud looks like your mom. It IS your mom.'],
      ['Uh. Babe? The RV has WINGS.', 'We\'re a little bit of a bird now.'],
      ['Our RV... is a unicorn. I\'m not mad. I\'m proud.', 'Neigh? NEIGH!'],
      ['Jellyfish. Over the highway. Totally normal.', 'Wave at the jellyfish! They\'re waving back!'],
      ['Every. Last. Bag. We\'re basically a parade now.', 'This is the most beautiful traffic of my life.']
    ][clamp(n - 1, 0, 7)];
    BW15D.quip(g, 'bag' + n, lines, true);
    if (S.chinka) { S.chinka.data.anim = 'cheer'; S.chinka.data.animT = 1.3; }
    if (n >= 5) BW15D.setForm(g, S, n === 5 ? 'wings' : n === 6 ? 'unicorn' : n === 7 ? 'wings' : 'pegacorn', n >= 8 ? 34 : 24);
  },
  /* ---------------- RV forms: wings, unicorn, both ---------------- */
  setForm(g, S, mode, dur) {
    const F = S.form; F.mode = mode; F.t = 0; F.end = dur; F.k = 0;
    burnsSfx(mode === 'wings' ? 'fly' : 'appear', null, 'secret'); g.screenFlash('#ffffff', 0.35);
    g.fx.confetti(S.rv.x, S.rv.y + 3, S.rv.z, 60); g.fx.hearts(S.rv.x, S.rv.y + 4, S.rv.z, 10);
    g.toast(mode === 'wings' ? 'THE PARTY BARGE SPROUTED WINGS!' : mode === 'unicorn' ? 'THE PARTY BARGE IS A UNICORN NOW!' : 'PEGACORN MODE!');
  },
  poseParts(g, S, dt) {
    const rv = S.rv, P = S.parts, F = S.form;
    if (F.mode !== 'rv') { F.t += dt; F.k = Math.min(1, F.k + dt * 1.6); if (F.t > F.end) { F.mode = 'rv'; F.k = 0; g.fx.confetti(rv.x, rv.y + 3, rv.z, 30); burnsSfx('powerdown', { vol: 0.5 }); g.toast('THE PARTY BARGE IS AN RV AGAIN. PROBABLY.'); } }
    const uni = F.mode === 'unicorn' || F.mode === 'pegacorn', wings = F.mode === 'wings' || F.mode === 'pegacorn';
    const c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    const at = (o, lx, ly, lz) => { o.x = rv.x + lx * c + lz * s; o.y = rv.y + ly; o.z = rv.z - lx * s + lz * c; o.yaw = rv.yaw; };
    rv.mv.visible = !uni;
    if (P.uni) {
      P.uni.visible = uni; at(P.uni, 0, 0, 0); P.uni.pitch = rv.mv.pitch; P.uni.roll = rv.mv.roll; P.uni.scale = uni ? 0.6 + 0.4 * easeOut(F.k) : 1;
      const run = clamp(Math.abs(S.v) / 6, 0, 1), ph = S.t * 7;
      P.legs.forEach((L, i) => { L.visible = uni; const fz = i < 2 ? 2.35 : -3.1, sx = i % 2 ? -0.82 : 0.82; at(L, sx * P.uni.scale, 2.16 * P.uni.scale, fz * P.uni.scale); L.scale = P.uni.scale; L.pitch = Math.sin(ph + (i === 0 || i === 3 ? 0 : Math.PI)) * 0.6 * run; L.roll = 0; });
    }
    if (P.wingL) {
      const wk = wings ? easeOut(F.k) : 0, flap = 0.35 + 0.5 * Math.sin(S.t * 6.5);
      for (const [W, sd] of [[P.wingL, 1], [P.wingR, -1]]) { W.visible = wk > 0.02; at(W, sd * 1.25, 2.95, -0.4); W.scale = wk * 1.6; W.roll = sd * flap; W.pitch = 0; }
    }
  },
  /* ---------------- dust, rainbow trails ---------------- */
  dustAndTrails(g, S, dt) {
    const rv = S.rv, av = Math.abs(S.v), c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    if (av > 1.5) {
      S.dustAcc += dt * av * (S.paved ? 0.25 : S.zone === 'off' ? 1.8 : 1.0);
      while (S.dustAcc > 1) { S.dustAcc -= 1; const sd = Math.random() < 0.5 ? 1 : -1; g.fx.dust(rv.x - s * 4.2 + c * sd * 1.1, rv.y + 0.2, rv.z - c * 4.2 - s * sd * 1.1, 1, S.paved ? '#c8b8a8' : '#dcc2a0'); }
    }
    const tv = BW15D.tripVis(S);
    if (tv > 0.18 && av > 2) {
      S.trailAcc += dt * av;
      while (S.trailAcc > 0.5) {
        S.trailAcc -= 0.5;
        for (let i = 0; i < 7; i++) {
          const lx = (i - 3) * 0.34, x = rv.x - s * 5.2 + c * lx, z = rv.z - c * 5.2 - s * lx;
          const col = burnsRGBf(BW15_RAINBOW[i]);
          g.fx.add(x, rv.y + 0.08, z, 0, 0, 0, 1.1 + tv * 1.4, 0.55, 0.85, col, 0.85 * Math.min(1, tv * 1.6), 'square', 1 | 8, rv.yaw, 0);
        }
        if (S.form.mode !== 'rv') g.fx.glint(rv.x - s * 3 + (Math.random() - 0.5) * 3, rv.y + 2 + Math.random() * 2, rv.z - c * 3, BURNS_NEON[Math.floor(Math.random() * 7)]);
      }
    }
  },
  /* ---------------- the rippling ribbon road ---------------- */
  ripple(S, s) {
    const R = S.ribbon; if (R.amp <= 0.01) return 0;
    const ds = s - R.s0, env = BurnsM.smoothstep(-46, -26, ds) * (1 - BurnsM.smoothstep(58, 82, ds));
    return R.amp * env * (0.5 + 0.5 * Math.sin(s * 0.19 - S.t * 3.0));
  },
  updateRibbon(g, S) {
    const R = S.ribbon, want = S.paved || (S.onRoad && S.s > BW15.S.pave) ? clamp((S.trip.level - 0.3) * 1.5, 0, 0.95) * (S.ending ? 0 : 1) : 0;
    R.amp = approach(R.amp, want, 0.006);
    R.s0 = S.s;
    const vis = R.amp > 0.015, o = S._ro || (S._ro = {}), W = g.world;
    for (let i = 0; i < R.segs.length; i++) {
      const mv = R.segs[i];
      if (!vis) { mv.visible = false; continue; }
      const s = S.s - 44 + i * 6.2;
      if (s < BW15.S.pave + 3 || s > BW15_ROAD.len - 4) { mv.visible = false; continue; }
      BW15_ROAD.at(s, 0, o);
      const r0 = BW15D.ripple(S, s - 3), r1 = BW15D.ripple(S, s + 3), rm = BW15D.ripple(S, s);
      const hA = W.height(o.x - o.tx * 3, o.z - o.tz * 3), hB = W.height(o.x + o.tx * 3, o.z + o.tz * 3);
      mv.visible = true; mv.x = o.x; mv.z = o.z; mv.y = W.height(o.x, o.z) + rm + 0.1; mv.yaw = o.yaw;
      mv.pitch = -Math.atan((hB + r1 - hA - r0) / 6); mv.roll = 0; mv.scale = 1;
    }
  },
  /* ---------------- trip visions: jellyfish, rainbow arches, talking signs ---------------- */
  updateVisions(g, S, dt) {
    const tv = BW15D.tripVis(S), rv = S.rv, c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    // jellyfish drift over the highway once the trip is strong
    const jOn = tv > 0.55 && rv.z > -230 && !S.ending;
    S.jelly.forEach((J, i) => {
      const mv = J.mv;
      J.k = approach(J.k, jOn ? 1 : 0, dt * 0.35);
      if (J.k <= 0.001) { mv.visible = false; J.placed = false; return; }
      const dx = J.x - rv.x, dz = J.z - rv.z, ahead = dx * s + dz * c;
      if (!J.placed || ahead < -50 || Math.hypot(dx, dz) > 170) {
        const a = BW15_ROAD.at(S.s + 55 + i * 30 + Math.random() * 20, (i % 2 ? 1 : -1) * (5 + Math.random() * 16), {});
        J.x = a.x; J.z = a.z; J.h = 11 + Math.random() * 7; J.ph = Math.random() * 6; J.placed = true; J.vx = (Math.random() - 0.5) * 2; J.vz = (Math.random() - 0.5) * 2;
      }
      J.x += J.vx * dt; J.z += J.vz * dt;
      mv.visible = true; mv.x = J.x; mv.z = J.z; mv.y = g.world.height(J.x, J.z) + J.h + Math.sin(S.t * 0.7 + J.ph) * 2.2;
      mv.yaw += dt * 0.15; mv.scale = J.k * 1.25 * (1 + 0.07 * Math.sin(S.t * 2.1 + J.ph));
    });
    // rainbow arches bloom over the highway
    for (const A of S.arches) { A.k = approach(A.k, tv > 0.38 && !S.ending ? 1 : 0, dt * 0.5); A.mv.visible = A.k > 0.01; A.mv.scale = easeOut(A.k); }
    // talking signs
    const tOn = tv > 0.25;
    for (const T of S.signs) {
      T.k = approach(T.k, tOn ? 1 : 0, dt * 1.5);
      const d = Math.hypot(T.x - rv.x, T.z - rv.z), show = T.k > 0.05 && d < 140;
      for (const e of [T.eyeL, T.eyeR]) {
        e.visible = show && !(T.blink > 0); e.scale = T.k;
        if (show) { const ex = rv.x - e.x, ez = rv.z - e.z; e.yaw = Math.atan2(ex, ez); e.pitch = clamp(-Math.atan2(rv.y + 3.5 - e.y, Math.hypot(ex, ez)), -0.6, 0.6); }
      }
      if (T.blink > 0) T.blink -= dt; else if (Math.random() < dt * 0.25) T.blink = 0.12;
      const talking = T.talkT > 0;
      if (talking) T.talkT -= dt;
      T.mouthO.visible = show && talking && Math.floor(S.t * 9) % 2 === 0; T.mouthC.visible = show && !T.mouthO.visible; T.mouthO.scale = T.mouthC.scale = T.k;
      if (show && tOn && d < 46 && !T.said && T.ahead(rv) && !g.cine) { T.said = true; const line = T.lines[Math.min(T.lines.length - 1, Math.floor(tv * T.lines.length))]; T.talkT = 2.8; S.bubbles.push({ x: T.x, y: T.top + 0.6, z: T.z, text: line, t: 3.2, sign: true }); burnsSfx('dialogue_blip', { vol: 0.5, pitch: 0.7 }); }
      if (T.said && d > 80) T.said = false;
    }
    for (const b of S.bubbles) b.t -= dt;
    if (S.bubbles.length) S.bubbles = S.bubbles.filter(b => b.t > 0);
  },
  /* ---------------- Chinka, co-pilot and map-reader ---------------- */
  quip(g, key, lines, force) {
    const S = BW15.state, a = S && S.chinka; if (!a || g.cine) return false;
    const now = S.t, last = S.quips[key] || -999;
    if (!force && (now - last < 25 || now - S.quipT < 4.5)) return false;
    S.quips[key] = now; S.quipT = now;
    const line = lines[Math.floor(Math.random() * lines.length)];
    a.say(line, Math.max(2.6, line.length * 0.065)); S.lastQuip = line;
    return true;
  },
  mapHint(g, S) {
    if (S.t - S.mapT < 1.2) return; S.mapT = S.t;
    const st = BW15D.stage(g, S);
    const hints = {
      line: ['Map says: we wait for the pulse, then GO. Grab the last bags while we\'re parked.', 'The flaggers wave, we roll. Steer between the lanes if we\'re stuck!'],
      big: ['THE PULSE! Weave through the gaps between the lanes! Gate\'s straight ahead!', 'Go go go! Squeeze between the cars, babe!'],
      gateroad: ['Straight down the gate road, then the highway. Gerlach is... that way. The map has glitter on it.', 'Highway\'s ahead. Real-world speed limits. Ugh.'],
      highway: ['Keep it under 45 near cops. Tap STEADY when they watch us.', 'Gas station soon! And somebody\'s hitchhiking... in a fur suit.'],
      check: ['Checkpoint ahead. Crawl through it, stay in the lane, tap STEADY on the beat. Act natural.', 'Natural. NATURAL. Not that natural.'],
      tail: ['That beige convertible has been behind us forever. With a JESTER HAT. Lose him in the dust or behind a truck!', 'Hot springs are off to the left. Steam is great for hiding. And skin.'],
      town: ['GERLACH! The diner\'s on the right. Pancakes or death.', 'Park by the diner, babe. We made it.']
    };
    const L = hints[st] || hints.highway;
    if (S.chinka) { S.chinka.say(L[Math.floor(Math.random() * L.length)], 4.5); S.chinka.ch.play('wave'); }
    burnsSfx('map_open', { vol: 0.5 }, 'cardFlip');
  },
  stage(g, S) {
    if (S.zone === 'line') return S.pulse.phase === 'big' ? 'big' : 'line';
    if (S.tail && !S.tail.done) return 'tail';
    if (S.s < BW15.S.junction) return 'gateroad';
    if (S.s > BW15.S.welcome - 40) return 'town';
    if (S.s > BW15.S.check - 140 && S.s < BW15.S.check + 20) return 'check';
    return 'highway';
  },
  /* ---------------- the Exodus line: lane layout, pulses, yielding ---------------- */
  layoutLine(S, T, rvZ) {
    const rng = mulberry32(1505);
    T.lanes.forEach((lane, li) => {
      let front = BW15.STOP_A - BW15.LINE_BACK - 2;
      for (const car of lane.cars) {
        let s = front - car.len / 2;
        if (li === BW15.PLAYER_LANE && s + car.len / 2 > rvZ - BW15.LINE_BACK - 6.5 && s - car.len / 2 < rvZ - BW15.LINE_BACK + 6.5) s = rvZ - BW15.LINE_BACK - 7 - car.len / 2;
        car.s = s; car.v = 0; T.place(lane, car);
        front = s - car.len / 2 - (1.6 + rng() * 1.6);
      }
    });
  },
  updateLine(g, S, dt) {
    const T = S.line; if (!T) return;
    const P = S.pulse, rv = S.rv;
    P.t += dt;
    const go = P.phase === 'go1' || P.phase === 'big' || (P.phase === 'done' && P.bgOpen);
    for (const lane of T.lanes) { lane.speed = go ? (P.phase === 'big' ? 4.1 : 4.6) : 0.9; lane.def.wave = go ? false : true; }
    const stopZ = P.phase === 'hold1' ? BW15.STOP_A : (P.phase === 'go1' || P.phase === 'hold2' || P.phase === 'count') ? BW15.STOP_B : (P.phase === 'big' ? null : (P.gate ? null : BW15.GATE_Z - 4));
    const rvBack = rv.z - Math.cos(rv.yaw) * 4.9, rvFront = rv.z + Math.cos(rv.yaw) * 4.9;
    for (const lane of T.lanes) {
      const lx = lane.seg[0].x;
      for (let i = 0; i < lane.cars.length; i++) {
        const car = lane.cars[i], z = BW15.LINE_BACK + car.s;
        let maxS = Infinity;
        // pulse stop line / closed gate
        if (stopZ !== null && z + car.len / 2 < stopZ + 1.5) maxS = Math.min(maxS, stopZ - BW15.LINE_BACK - car.len / 2);
        // never drive into the Party Barge from behind
        if (Math.abs(rv.x - lx) < 2.7 && z < rv.z && z + car.len / 2 > Math.min(rvBack, rvFront) - 14) maxS = Math.min(maxS, Math.min(rvBack, rvFront) - 1.4 - car.len / 2 - BW15.LINE_BACK);
        if (car.s > maxS) { car.s = Math.max(maxS, car.s - 0.5); car.v = 0; T.place(lane, car); }
      }
    }
    BW15D.pulseLogic(g, S, dt);
  },
  pulseLogic(g, S, dt) {
    const P = S.pulse, rv = S.rv;
    switch (P.phase) {
      case 'hold1': if (P.t > 2 && BW15D.giversDone(S, [0, 1]) && !g.cine) BW15D.setPulse(g, S, 'go1'); break;
      case 'go1': if (P.t > 9 && (Math.abs(S.v) < 0.4 || P.t > 22)) BW15D.setPulse(g, S, 'hold2'); break;
      case 'hold2': if (P.t > 2 && BW15D.giversDone(S, [2, 3]) && !g.cine) BW15D.setPulse(g, S, 'count'); break;
      case 'count': if (P.t > 3.2) BW15D.setPulse(g, S, 'big'); break;
      case 'big':
        P.bigT = BW15.BIG_TIME - P.t;
        if (rv.z > BW15.GATE_Z + 2.5) { BW15D.setPulse(g, S, 'won'); break; }
        if (P.bigT <= 0) BW15D.setPulse(g, S, 'missed');
        break;
      case 'won': if (P.t > 3) BW15D.setPulse(g, S, 'done'); break;
      case 'retry': if (P.t > 5) BW15D.setPulse(g, S, 'big'); break;
      case 'done': if (P.t > (P.bgOpen ? 24 : 18)) { P.bgOpen = !P.bgOpen; P.gate = P.bgOpen; P.t = 0; } break;
    }
    for (const a of S.arms || []) a.roll = BurnsM.damp(a.roll || 0, P.gate ? 1.3 : 0, 3, dt);
    for (const b of S.barriers || []) b.off = !!P.gate;
    for (const L of S.lights || []) { const green = P.phase === 'go1' || P.phase === 'big' || (P.phase === 'done' && P.bgOpen) || P.phase === 'won'; L.red.visible = !green; L.green.visible = green; }
  },
  setPulse(g, S, phase) {
    const P = S.pulse; P.phase = phase; P.t = 0;
    const fl = S.flaggers || [];
    if (phase === 'go1') { P.gate = false; g.banner('PULSE!', 'The line moves! Hold the stick up to roll with it.', { col: '#7aff5a' }); burnsSfx('crowd_cheer'); fl.forEach(a => a.say('GO GO GO! Slowly!', 2)); BW15D.quip(g, 'go1', ['It\'s moving! The line is MOVING!', 'Pulse! Roll, babe, roll!'], true); }
    if (phase === 'hold2') { g.banner('HOLD', 'Pulse stopped. More burners with last bags...', { col: '#ff9a4a', small: true }); fl.forEach(a => a.say('HOLD IT! Next pulse soon!', 2)); }
    if (phase === 'count') { g.banner('THE BIG PULSE', 'Get through the gate before it closes!', { col: '#ffe24a', big: true }); burnsSfx('kartCountdown', null, 'select'); }
    if (phase === 'big') { P.gate = true; P.bigT = BW15.BIG_TIME; burnsSfx('kartGo', null, 'powerup'); g.banner('GO!', 'Weave between the lanes · the gate closes in ' + BW15.BIG_TIME + 's', { col: '#7aff5a' }); BW15D.quip(g, 'big', ['Babe! Between the lanes! GO!', 'Squeeze through! We fit! Probably!'], true); for (const a of S.walkers || []) a.data.clear = true; }
    if (phase === 'won') {
      g.banner('YOU SURVIVED THE PULSE', 'Out of the playa. Into the dust.', { col: '#7aff5a', big: true });
      burnsSfx('crowd_cheer'); fl.forEach(a => a.say('BYE! SEE YOU NEXT YEAR!', 3));
      if (!g.missions.isDone('pulse')) g.missions.complete('pulse');
      setTimeout0(() => { P.gate = false; });
    }
    if (phase === 'missed') {
      P.gate = false; burnsSfx('buzzkill', null, 'powerdown'); g.banner('THE PULSE CLOSED!', 'Back in line for the next one...', { col: '#ff6a4a' });
      BW15D.quip(g, 'missed', ['Noooo! The gate! It closed on us!', 'Next pulse. We got this. We got this.'], true);
      P.tries++;
      g.fadeTo(1, 0.6);
      BW15D.later(g, 0.75, () => { BW15D.placeRV(g, S, { x: 0, z: BW15.STOP_B - 22, yaw: 0 }); g.fadeTo(0, 0.6); BW15D.setPulse(g, S, 'retry'); g.banner('NEXT PULSE IN 5', 'Line up in a gap and get ready!', { col: '#ffe24a', small: true }); });
      P.phase = 'wait';
    }
    if (phase === 'done') { P.gate = false; P.bgOpen = false; }
    function setTimeout0(fn) { BW15D.later(g, 3, fn); }
  },
  // game-time timers (paused with the game)
  later(g, sec, fn) { const S = BW15.state; (S.timers || (S.timers = [])).push({ t: sec, fn }); },
  runTimers(dt) { const S = BW15.state; if (!S.timers || !S.timers.length) return; for (const t of S.timers) { t.t -= dt; if (t.t <= 0 && !t.done) { t.done = true; t.fn(); } } S.timers = S.timers.filter(t => !t.done); },
  /* ---------------- highway traffic: terrain-hugging, yielding, slowing at the checkpoint ---------------- */
  updateHighway(g, S, dt) {
    const T = S.hwy; if (!T) return;
    const W = g.world, rv = S.rv;
    for (const lane of T.lanes) {
      const out = lane.def.id === 'out';
      for (const car of lane.cars) {
        const mv = car.mv;
        // the checkpoint makes everybody crawl
        if (out && Math.abs(car.s - (BW15.S.check + 6 - lane.def.s0)) < 30) { if (car.prevS !== undefined && car.s > car.prevS + 3.2 * dt) { car.s = car.prevS + 3.2 * dt; car.v = Math.min(car.v, 3.2); T.place(lane, car); } }
        // yield to the Party Barge: cars never drive through it
        const dx = mv.x - rv.x, dz = mv.z - rv.z;
        if (dx * dx + dz * dz < 900) {
          const cf = Math.sin(mv.yaw), cc = Math.cos(mv.yaw), along = -(dx * cf + dz * cc), side = Math.abs(dx * cc - dz * cf);
          if (side < 2.6 && along > 0 && along < car.len / 2 + 5.2 + 1.5) { const back = car.len / 2 + 5.2 + 1.5 - along; car.s -= back; car.v = 0; T.place(lane, car); if (!car.honked && Math.random() < 0.02) { car.honked = true; burnsSfx('artcarHorn', { vol: 0.35, pitch: 1.3 }); } }
        }
        car.prevS = car.s;
        if (dx * dx + dz * dz > 170 * 170) continue;
        const y = W.height(mv.x, mv.z), fx = Math.sin(mv.yaw), fz = Math.cos(mv.yaw);
        const h1 = W.height(mv.x + fx * 2, mv.z + fz * 2), h0 = W.height(mv.x - fx * 2, mv.z - fz * 2);
        let rip = 0; if (S.ribbon.amp > 0.01) { const pr = BW15_ROAD.project(mv.x, mv.z, car.rs, car._pr || (car._pr = {})); car.rs = pr.s; rip = BW15D.ripple(S, pr.s); }
        mv.y = y + rip; mv.pitch = -Math.atan((h1 - h0) / 4);
      }
    }
  },
  // the speed the Party Barge may keep without rear-ending what's ahead
  aheadCap(g, S) {
    const rv = S.rv, c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    let gap = Infinity;
    const test = (x, z, yaw, half, w) => {
      const dx = x - rv.x, dz = z - rv.z; if (dx * dx + dz * dz > 50 * 50) return;
      const lz = dx * s + dz * c, lx = dx * c - dz * s;
      if (lz <= 0 || Math.abs(lx) > 1.3 + (w || 1.25) - 0.15) return;
      gap = Math.min(gap, lz - 4.9 - half);
    };
    if (S.line && S.zone === 'line') for (const lane of S.line.lanes) { if (Math.abs(lane.seg[0].x - rv.x) > 4) continue; for (const car of lane.cars) test(car.mv.x, car.mv.z, car.mv.yaw, car.len / 2); }
    if (S.hwy) for (const lane of S.hwy.lanes) for (const car of lane.cars) test(car.mv.x, car.mv.z, car.mv.yaw, car.len / 2);
    for (const cp of S.cops) if (cp.mv.visible) test(cp.x, cp.z, cp.yaw, 2.5, 1.0);
    return gap === Infinity ? 99 : Math.max(0, (gap - 1.2) * 1.5);
  },
  /* ---------------- last-bag givers ---------------- */
  giversDone(S, idx) { return idx.every(i => { const G = S.givers[i]; return !G || G.state === 'done'; }); },
  readyGiver(S) { return S.givers.find(G => G.state === 'ready') || null; },
  updateGivers(g, S, dt) {
    const rv = S.rv, c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    for (const G of S.givers) {
      const a = G.a; if (!a || G.state === 'done') continue;
      G.t += dt;
      const active = G.when(g, S);
      if (G.state === 'wait' && active) { G.state = 'approach'; G.t = 0; a.setBehavior('bw15Giver'); a.say(G.hello, 2.6); }
      if (G.state === 'approach' || G.state === 'ready') {
        // stand by the window (Brady's side when there's room, otherwise Chinka's)
        const side = G.side || 1;
        const wz = BW15M.SEAT_Z, tx = rv.x + c * side * 2.25 + s * wz, tz = rv.z - s * side * 2.25 + c * wz;
        a.data.tx = tx; a.data.tz = tz;
        const d = Math.hypot(a.x - tx, a.z - tz);
        if (d < 0.9 && Math.abs(S.v) < 1.6) { if (G.state !== 'ready') { G.state = 'ready'; G.t = 0; a.say(G.line, 3.2); burnsSfx('dialogue_blip'); } }
        else if (G.state === 'ready' && (d > 2.5 || Math.abs(S.v) > 2.5)) G.state = 'approach';
        if (G.state === 'ready' && G.t > 3.4 && Math.floor(G.t) % 4 === 0 && !a.bubbleText) a.say(['Take it! Take it!', 'Can\'t take it with us!', 'Please, I have a long drive!'][Math.floor(Math.random() * 3)], 1.8);
        // too far behind, or ignored for too long: toss it onto the road ahead
        const dRv = Math.hypot(a.x - rv.x, a.z - rv.z);
        if ((G.state === 'approach' && G.t > 6 && dRv > 16) || G.t > 28) BW15D.tossBag(g, S, G);
      }
      if (G.state === 'thanks') { if (G.t > 2.5) { G.state = 'done'; a.setBehavior(G.after || 'idle'); } }
    }
    // bags in flight
    for (const G of S.givers) {
      const P = G.pick; if (!P || !P.w15fly) continue;
      if (P.taken) { P.w15fly = null; continue; }   // the engine's pickup radius got it first
      const F = P.w15fly; F.t += dt;
      const k = Math.min(1, F.t / F.dur);
      let tx = F.tx, ty = F.ty, tz = F.tz;
      if (F.toRV) { const sp = rv.seatPos([0, 0, 0]); tx = sp[0]; ty = sp[1] + 1.2; tz = sp[2]; }
      P.x = lerp(F.x, tx, k); P.z = lerp(F.z, tz, k); P.y0 = lerp(F.y, ty, k) + Math.sin(k * Math.PI) * F.arc;
      if (k >= 1) { P.w15fly = null; if (F.toRV) { S.lastBagId = G.id; P.taken = true; P.obj.visible = false; g.onPickup(P); } }
    }
  },
  takeBag(g, S, G) {
    if (!G || G.state !== 'ready') return;
    const a = G.a, P = G.pick;
    G.state = 'thanks'; G.t = 0;
    a.ch.play('cheer'); a.say(G.thanks, 2.4);
    S.waveT = 0.7;
    if (G.side === -1 && S.chinka) S.chinka.say('Got it! Passing it up to the captain!', 2);
    if (P && !P.taken) { P.x = a.x; P.z = a.z; P.y0 = a.y + 2.0; P.w15fly = { t: 0, dur: 0.55, x: a.x, y: a.y + 2.0, z: a.z, arc: 1.4, toRV: true }; }
    else { S.lastBagId = G.id; BW15D.bagTaken(g, S, G.power); }
  },
  tossBag(g, S, G) {
    const a = G.a, P = G.pick, rv = S.rv;
    G.state = 'thanks'; G.t = 0;
    a.say('CATCH! It\'s on the road!', 2.4); a.ch.play('throw');
    if (!P || P.taken) return;
    const d = Math.max(14, Math.abs(S.v) * 2.2 + 10), c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    const tx = rv.x + s * d, tz = rv.z + c * d;
    P.w15fly = { t: 0, dur: 0.9, x: a.x, y: a.y + 2, z: a.z, tx, ty: g.world.height(tx, tz) + 1.1, tz, arc: 4 };
    P.x = a.x; P.z = a.z; P.y0 = a.y + 2;
    BW15D.later(g, 0.95, () => { P.w15fly = null; P.w15ground = true; });
    g.toast('A LAST BAG LANDED ON THE ROAD AHEAD!');
  },
  /* ---------------- autopilot (scripted tests + cutscene drives) ---------------- */
  autopilot(g, S) {
    const A = S.ap, rv = S.rv;
    let tx, tz;
    if (A.lineX !== undefined) { tx = A.lineX; tz = rv.z + (A.look || 11); }
    else if (A.x !== undefined) { tx = A.x; tz = A.z; }
    else { const p = BW15_ROAD.at(S.s + (A.look || 14), A.lat === undefined ? -1.85 : A.lat, {}); tx = p.x; tz = p.z; }
    const want = Math.atan2(tx - rv.x, tz - rv.z), err = BurnsM.wrap(want - rv.yaw);
    const sx = A.noSteer ? 0 : clamp(-err * 2.2, -1, 1);
    const sp = A.speed === undefined ? 18 : A.speed;
    const sy = S.v < sp - 0.6 ? 1 : S.v > sp + 0.6 ? -0.6 : 0;
    return [sx, sy];
  },
  placeRV(g, S, o) {
    const rv = S.rv, p = g.player;
    rv.x = o.x; rv.z = o.z; rv.yaw = o.yaw || 0; S.v = 0; S.steer = 0;
    rv.y = g.world.height(rv.x, rv.z);
    rv.mv.x = rv.x; rv.mv.y = rv.y; rv.mv.z = rv.z; rv.mv.yaw = rv.yaw; rv.mv.px = rv.x; rv.mv.pz = rv.z;
    BW15_ROAD.project(rv.x, rv.z, null, S._pr || (S._pr = {})); S.s = S._pr.s; S.lat = S._pr.lat;
    const sp = rv.seatPos([0, 0, 0]); p.teleport(sp[0], sp[1], sp[2], rv.yaw);
    g.camYaw = rv.yaw; g.snapCam = true;
  }
};

/* ---------------- behaviours: people glued to the deck, and the bag givers ---------------- */
BurnsBehaviors.register('bw15Seat', {
  update(a, g, dt) {
    const S = BW15.state; if (!S || !S.rv) return;
    const rv = S.rv, o = a.def.seat || [-0.62, BW15M.DECK, BW15M.SEAT_Z], c = Math.cos(rv.yaw), s = Math.sin(rv.yaw);
    a.x = rv.x + o[0] * c + o[2] * s; a.z = rv.z - o[0] * s + o[2] * c; a.y = rv.y + o[1];
    a.yaw = rv.yaw + (a.def.seatYaw || 0); a.vx = a.vz = a.vy = 0;
    const anim = a.data.anim && a.data.animT > 0 ? a.data.anim : (a.bubbleText && a.bubbleT > 0 ? (a.def.talkAnim || 'sit') : (a.def.seatAnim || 'sit'));
    if (a.data.animT > 0) a.data.animT -= dt;
    a.ch.play(anim, a.def.seatAnim === 'dance' ? { style: 2 } : undefined);
  }
});
BurnsBehaviors.register('bw15Giver', {
  update(a, g, dt) {
    const tx = a.data.tx, tz = a.data.tz;
    if (tx === undefined) { a.ch.play('idle'); a.physics(dt); return; }
    const d = a.moveTo(tx, tz, 3.4, dt, 0.4);
    const S = BW15.state;
    if (d < 0.6 && S && S.rv) { a.face(S.rv.x, S.rv.z, dt, 6); a.ch.play('wave'); } else a.ch.play(d > 3 ? 'run' : 'walk', { rate: 1 });
    a.physics(dt);
  }
});
// goodbye-sayers wandering between the vehicles; when the pulse goes they clear the corridors
BurnsBehaviors.register('bw15Walker', {
  init(a) { a.data.wait = Math.random() * 3; a.data.tx = a.x; a.data.tz = a.z; },
  update(a, g, dt) {
    const D = a.data;
    if (D.clear) {
      const ex = a.home.x < 0 ? -15.6 : 15.6;
      const d = a.moveTo(ex, a.z, 4.2, dt, 0.4); a.ch.play(d > 0.5 ? 'run' : 'cheer', { rate: 1 });
      a.physics(dt); return;
    }
    if (D.wait > 0) { D.wait -= dt; a.vx = BurnsM.damp(a.vx, 0, 6, dt); a.vz = BurnsM.damp(a.vz, 0, 6, dt); a.ch.play(D.hug ? 'hug' : 'wave'); }
    else {
      const d = a.moveTo(D.tx, D.tz, a.speed, dt, 0.5); a.ch.play('walk', { rate: a.speed / 1.4 });
      if (d < 0.6 || (D.bump || 0) > 40) { D.bump = 0; D.wait = 1.5 + Math.random() * 4; D.hug = Math.random() < 0.4; D.tx = a.home.x + (Math.random() - 0.5) * 1.2; D.tz = a.home.z + (Math.random() - 0.5) * 16; }
    }
    a.physics(dt);
  }
});
