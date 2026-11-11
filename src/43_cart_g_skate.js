/* ============================================================
   ART CART — arena: BOWL-O-RAMA (id 'skate'), the skate park, rebuilt big.
   A 240 m concrete park: the throne funbox, kickers and rails in the middle,
   a bowl and a mega bowl, a half-pipe, a spine, a vert wall, quarter pipes,
   a street plaza with ledges, a stair set with handrails, a snake run of
   banked berms, a kicker-to-kicker gap over the pool and a dirt table.
   Its own rules: REAL TRICKS. Steer in the air to spin, tap hop in the air to
   flip, land clean for points and a boost (land mid-flip and you wipe out),
   grind the rails and ledges for points per second. TRICK ATTACK is its
   objective; tricks score in every objective here but only TRICK ATTACK
   counts them to win. Powers: KICKFLIP, GRIND WAX, BOARD SLAP.
   All original, PG-13, affectionate Burning Man satire.
   ============================================================ */

/* ---------------- tuning ---------------- */
const CART_SK = {
  spinRate: 6.0,        // extra yaw rate (rad/s) from full steer in the air (the base air steering adds ~1)
  flipDur: 0.72,        // seconds for one flip
  minAirT: 0.12,        // trick input counts after this much air time
  halfSpinPts: 100, flipPts: 250, airPts: 40,   // per 180°, per flip, per second of air beyond half a second
  grindRate: 120,       // points per second on a rail
  railSnap: 0.9,        // how close to a rail line to lock on
  railH: 0.55,          // the car rides this high above the rail's ground
  comboWindow: 4.0,     // seconds to chain the next trick
  goal: 3000
};

/* ---------------- per-car trick state ---------------- */
function cartSkState(k) {
  if (!k.sk) k.sk = { inAir: false, yawAcc: 0, prevYaw: 0, flips: 0, flipT: 0, flipDur: CART_SK.flipDur, flipA: 0, vx: 0, vz: 0, combo: 0, comboT: 0, last: '', lastPts: 0, lastT: 0, grind: null, gSpeed: 0, railCool: 0, lastRail: null, waxT: 0, pts: 0, best: 0, sparkT: 0, ai: null, feat: null, stage: 0, used: {}, wet: false };
  return k.sk;
}
function cartSkMult(sk) { return 1 + 0.25 * Math.min(4, Math.max(0, sk.combo - 1)); }
// add trick points: always to the car's trick tally; to k.score only when the objective is TRICK ATTACK
function cartSkScore(s, k, pts) {
  const sk = cartSkState(k);
  sk.pts += pts;
  if (s.objective === 'trick') k.score += pts;
}
// which rail (if any) the car is on: within snap of the line, between the ends, moving mostly along it
function cartSkRailAt(s, k, snap) {
  const sk = cartSkState(k), R = s.E.rails; if (!R) return null;
  const sp = Math.hypot(k.vx, k.vz); if (sp < 6) return null;
  let best = null, bd = snap;
  for (const r of R) {
    if (r === sk.lastRail && sk.railCool > 0) continue;
    const t = ((k.x - r.x0) * r.dx + (k.z - r.z0) * r.dz) / r.L2; if (t < 0 || t > 1) continue;
    const d = Math.hypot(k.x - r.x0 - r.dx * t, k.z - r.z0 - r.dz * t); if (d > bd) continue;
    const along = (k.vx * r.ux + k.vz * r.uz) / sp; if (Math.abs(along) < 0.6) continue;
    const ry = lerp(r.y0, r.y1, t); if (k.y > ry + 1.6 || k.y < ry - 0.6) continue;
    bd = d; best = { r, t, dir: along > 0 ? 1 : -1 };
  }
  return best;
}
function cartSkStartGrind(s, k, at, racing) {
  const sk = cartSkState(k), r = at.r;
  const sp = Math.max(6, Math.abs(k.vx * r.ux + k.vz * r.uz));
  sk.grind = { r, t: at.t, dir: at.dir, pts: 0, time: 0 };
  sk.gSpeed = sp; sk.lastRail = r;
  k.air = false; k.hop = false; k.airT = 0; k.vy = 0; k.drift = 0; k.charge = 0; k.pendingDrift = false;
  k.yaw = Math.atan2(r.ux * at.dir, r.uz * at.dir);
  k.landT = 0.12;
  if (racing) { s.log('grind', { k: k.id, rail: r.id }); if (k.player) { Sound.play('kartDrift', { vol: 0.5, pitch: 1.4 }); s.banner(r.kind === 'ledge' ? 'LEDGE!' : 'GRIND!', '#ffe24a', 0.7, null, true); } }
  s.fx.spark(k.x, k.y + 0.2, k.z, 8, '#ffe8a0', 5);
}
function cartSkEndGrind(s, k, why, racing) {
  const sk = cartSkState(k), g = sk.grind; if (!g) return;
  sk.grind = null; sk.railCool = 0.5;
  if (racing && g.time > 0.3) {
    const pts = Math.round(g.pts);
    sk.combo++; sk.comboT = CART_SK.comboWindow; sk.last = 'GRIND ' + g.time.toFixed(1) + 's'; sk.lastPts = pts; sk.lastT = 3.5; sk.best = Math.max(sk.best, pts);
    s.log('trick', { k: k.id, trick: 'grind', time: +g.time.toFixed(2), pts, player: k.player });
    if (k.player) s.banner('GRIND ' + g.time.toFixed(1) + 's!', '#ffe24a', 1.1, '+' + pts + (sk.combo > 1 ? ' · COMBO x' + cartSkMult(sk).toFixed(1) : ''));
    if (why === 'end' && sk.waxT > 0) s.boost(k, 0.6, 'wax');
  }
}
function cartSkGrindStep(s, k, dt, racing) {
  const sk = k.sk, g = sk.grind, r = g.r, inp = k.inp;
  // speed is kept; grind wax builds it
  if (sk.waxT > 0) sk.gSpeed = Math.min(k.vmax * 1.3, sk.gSpeed + 7 * dt); else sk.gSpeed = Math.max(6, sk.gSpeed - 0.6 * dt);
  const sp = sk.gSpeed;
  g.t += g.dir * sp * dt / r.L; g.time += dt;
  const rate = CART_SK.grindRate * (sk.waxT > 0 ? 2 : 1) * cartSkMult(sk);
  if (racing) { g.pts += rate * dt; cartSkScore(s, k, rate * dt); }
  if (g.t < 0 || g.t > 1) {
    // the rail's end: a little pop into the air
    const te = clamp(g.t, 0, 1);
    k.x = r.x0 + r.dx * te; k.z = r.z0 + r.dz * te; k.y = lerp(r.y0, r.y1, te) + CART_SK.railH;
    k.vx = r.ux * g.dir * sp; k.vz = r.uz * g.dir * sp; k.vy = 3.6 + (sk.waxT > 0 ? 1.5 : 0); k.air = true; k.airT = 0; k.hop = false;
    cartSkEndGrind(s, k, 'end', racing);
    sk.inAir = true; sk.yawAcc = 0; sk.prevYaw = k.yaw; sk.flips = 0; sk.flipT = 0; sk.flipA = 0; sk.vx = k.vx; sk.vz = k.vz; sk.ai = null;
    return;
  }
  k.x = r.x0 + r.dx * g.t; k.z = r.z0 + r.dz * g.t; k.y = lerp(r.y0, r.y1, g.t) + CART_SK.railH;
  k.vx = r.ux * g.dir * sp; k.vz = r.uz * g.dir * sp; k.vy = 0; k.speed = sp; k.fwd = sp; k.lat = 0;
  k.yaw = Math.atan2(r.ux * g.dir, r.uz * g.dir) + Math.sin(g.time * 9) * 0.03;
  k.steer = 0; k.drift = 0; k.charge = 0; k.air = false; k.airT = 0; k.hop = false;
  inp.drift = false;
  // sparks off the trucks
  sk.sparkT -= dt;
  if (sk.sparkT <= 0 && s.fx) { sk.sparkT = 0.03; const c = sk.waxT > 0 ? '#ffe24a' : '#ffd8a0'; s.fx.add(k.x - r.ux * g.dir * 1.2 + (Math.random() - 0.5) * 0.4, k.y + 0.1, k.z - r.uz * g.dir * 1.2 + (Math.random() - 0.5) * 0.4, -r.ux * g.dir * 3 + (Math.random() - 0.5) * 3, 1.5 + Math.random() * 2.5, -r.uz * g.dir * 3 + (Math.random() - 0.5) * 3, 0.3 + Math.random() * 0.15, 0.2, 0.04, burnsRGBf(c), 1, 'spark', 1 | 2); }
  if (k.player && Math.random() < dt * 3) Sound.play('kartDrift', { vol: 0.12, pitch: 1.3 + Math.random() * 0.3 });
}
// the car touches down from an air (not grinding): tally the trick
function cartSkLand(s, k, racing, fwd) {
  const sk = cartSkState(k), inp = k.inp;
  const hard = k.vy < -7;
  k.landT = 0.18;
  if (hard) { s.landFx(k); if (k.player) { s.shakeIt(clamp(-k.vy / 30, 0.15, 0.6)); Sound.play('stomp', { vol: 0.35, pitch: 0.7 }); } }
  const wasHit = k.flipT > 0 || k.spinT > 0 || k.out;
  const midFlip = sk.flipT > 0;
  if (!wasHit && racing && midFlip && sk.waxT <= 0) {
    // landed on the roof: wipeout
    k.spinT = 1.0; k.spinA = 0; k.vx *= 0.4; k.vz *= 0.4; k.drift = 0; k.charge = 0; k.boostT = 0;
    sk.combo = 0; sk.comboT = 0; sk.last = 'WIPEOUT'; sk.lastPts = 0; sk.lastT = 3;
    s.log('wipeout', { k: k.id, player: k.player });
    s.fx.smoke(k.x, k.y + 1, k.z, 8, '#c8c0b8'); s.fx.spark(k.x, k.y + 0.5, k.z, 12, '#ffd8a0', 6);
    if (k.player) { s.banner('WIPEOUT!', '#ff6a6a', 1.2, 'landed mid-flip'); Sound.play('kartHit', { vol: 0.7 }); s.shakeIt(0.8); }
  } else if (!wasHit) {
    if (midFlip) sk.flips++;   // grind wax: the flip completes on touchdown
    const halves = Math.floor(Math.abs(sk.yawAcc) / Math.PI + 0.15), flips = sk.flips;
    const airB = k.airT > 0.5 ? Math.round((k.airT - 0.5) * CART_SK.airPts) : 0;
    const base = halves * CART_SK.halfSpinPts + flips * CART_SK.flipPts;
    if (racing && base > 0) {
      sk.combo++; sk.comboT = CART_SK.comboWindow;
      const mult = cartSkMult(sk), pts = Math.round((base + airB) * mult);
      const deg = halves * 180;
      let name = deg ? deg + '' : '';
      if (flips) name += (name ? ' + ' : '') + (flips === 1 ? (deg ? 'FLIP' : 'BACKFLIP') : flips === 2 ? 'DOUBLE FLIP' : flips + 'x FLIP');
      sk.last = name; sk.lastPts = pts; sk.lastT = 3.5; sk.best = Math.max(sk.best, pts);
      cartSkScore(s, k, pts);
      s.log('trick', { k: k.id, trick: name, deg, flips, air: +k.airT.toFixed(2), pts, combo: sk.combo, player: k.player });
      s.boost(k, 0.5 + 0.08 * Math.min(5, sk.combo), 'trick');
      s.fx.burst(k.x, k.y + 1.5, k.z, 'star', 10 + Math.min(20, pts / 40), '#ffe24a');
      if (k.player) { s.banner(name + '!', flips ? '#ff4fd8' : '#38f2ff', 1.2, '+' + pts + (sk.combo > 1 ? ' · COMBO x' + mult.toFixed(1) : '')); Sound.play('kartBoost', { vol: 0.5, pitch: 1.3 }); }
      else if (k.player === false && pts >= 500 && Math.hypot(k.x - s.player.x, k.z - s.player.z) < 40) s.banner(k.car.name + ': ' + name + '!', '#ffffff', 0.9, null, true);
    } else if (racing && k.airT > 0.7 && !k.hop) {
      if (airB > 0) { sk.combo++; sk.comboT = CART_SK.comboWindow; const pts = Math.round(airB * cartSkMult(sk)); cartSkScore(s, k, pts); sk.last = 'BIG AIR'; sk.lastPts = pts; sk.lastT = 3; s.log('trick', { k: k.id, trick: 'air', air: +k.airT.toFixed(2), pts, player: k.player }); }
      s.boost(k, 0.55, 'air'); if (k.player) s.banner('BIG AIR!', '#38f2ff', 0.9, airB > 0 ? '+' + airB : null);
    }
  }
  k.vy = 0; k.airT = 0; k.hop = false; k.air = false;
  sk.inAir = false; sk.yawAcc = 0; sk.flips = 0; sk.flipT = 0; sk.flipA = 0; sk.ai = null;
  if (k.pendingDrift && inp.drift && Math.abs(k.steer) > 0.25 && Math.abs(fwd) > 8 && k.spinT <= 0) { k.drift = Math.sign(k.steer); k.charge = 0; if (k.player) Sound.play('kartDrift', { vol: 0.4 }); }
  k.pendingDrift = false;
}
// start tracking an air (called on the first air step, or by the kickflip)
function cartSkTakeOff(s, k) {
  const sk = cartSkState(k);
  sk.inAir = true; sk.yawAcc = 0; sk.prevYaw = k.yaw; sk.flips = 0; sk.flipT = 0; sk.flipA = 0; sk.vx = k.vx; sk.vz = k.vz; sk.ai = null;
}
// the engine launches cars off steps and bumps at up to 30 m/s: size the pop by the slope the car came off
function cartSkLaunch(s, k, dt) {
  const sk = k.sk, sp = Math.hypot(k.vx, k.vz) || 1, ux = k.vx / sp, uz = k.vz / sp, x1 = k.x - k.vx * dt, z1 = k.z - k.vz * dt;
  const slope = (s.terrain.height(x1, z1) - s.terrain.height(x1 - ux * 2.5, z1 - uz * 2.5)) / 2.5, f = s.terrain.kindAt(x1 - ux * 1.5, z1 - uz * 1.5);
  const est = Math.min(14, Math.max(0, sp * slope)) + (f && f.kind === 'ramp' ? 3.5 : 0) + 2;
  k.vy = Math.min(k.vy, Math.max(3, est), 17);
  sk.vx = k.vx; sk.vz = k.vz;
}
// the pose: the trick flip pitches the whole car (the stun flip from hit() uses k.flipA; this one is ours)
{
  const base = CartRaceScene.prototype.poseKart;
  CartRaceScene.prototype.poseKart = function (k, dt) { base.call(this, k, dt); if (k.sk && k.sk.flipA) k.pitch -= k.sk.flipA; };
}

/* ---------------- the arena entry, the objective, the rules ---------------- */
{
  const A = cartArena('skate');
  A.sub = 'Giant concrete park: bowls, a vert wall, rails, stairs and a gap';
  A.objectives = ['trick', 'glow', 'hill', 'vibe', 'flag'];
  A.powers = ['kickflip', 'wax', 'board'];
  A.blurb = 'Steer in the air to spin, tap hop in the air to flip, land it clean. Ride the rails.';
}
CART_OBJECTIVES.trick = {
  name: 'TRICK ATTACK', short: 'Biggest trick score',
  desc: 'Steer in the air to spin, tap hop in the air to flip, ride the rails to grind. Land it clean for points. First to 3000 wins.',
  time: 120, goal: CART_SK.goal, unit: '\u200b',   // scores are wide ('2596/3000'): a zero-width unit keeps the scoreboard column clear
  fx: {
    init(s) { for (const k of s.karts) { k.score = 0; cartSkState(k); } },
    update(s, dt) { let best = 0; for (const k of s.karts) if (k.score > best) best = k.score; return best >= CART_SK.goal; },
    rank(s) { return s.karts.slice().sort((a, b) => (b.score - a.score) || (b.hitsDealt - a.hitsDealt)); },
    score(k) { return Math.floor(k.score); }
  }
};

CART_ARENA_RULES.skate = {
  music: 'kart2',
  onLoad(s) {
    for (const k of s.karts) cartSkState(k);
    s.skFeats = s.E.skFeats || [];
    s.skPool = s.E.pool || null;
  },
  onStep(s, k, dt, racing) {
    const sk = cartSkState(k), inp = k.inp;
    if (sk.railCool > 0) sk.railCool -= dt;
    if (sk.lastT > 0) sk.lastT -= dt;
    if (sk.comboT > 0) { sk.comboT -= dt; if (sk.comboT <= 0) sk.combo = 0; }
    if (sk.grind) { inp.steer = 0; k.steer = 0; inp.drift = false; if (!k.player || s.autoDrive) inp.driftPress = false; return; }
    const ai = !k.player || s.autoDrive;
    if (k.air && k.bubbleT <= 0) {
      if (!sk.inAir) { cartSkTakeOff(s, k); if (k.airT === 0) cartSkLaunch(s, k, dt); }
      else sk.yawAcc += cartWrap(k.yaw - sk.prevYaw);
      const canTrick = k.spinT <= 0 && k.flipT <= 0 && !k.out;
      if (ai && canTrick && racing) {
        // the AI plans its trick from the air it expects: a flip when there's time, a full spin when there's more
        if (!sk.ai) { const T = Math.max(0, 2 * Math.max(k.vy, 0) / s.G + Math.max(0, k.y - s.terrain.height(k.x + k.vx * 0.5, k.z + k.vz * 0.5)) * 0.12); const turns = Math.min(2, Math.floor((T - CART_SK.minAirT) * (CART_SK.spinRate + 1.0) / (TAU * 0.94))); sk.ai = { T, spin: turns > 0 ? (s.rng() < 0.5 ? 1 : -1) : 0, target: turns * TAU, flip: T > CART_SK.flipDur + CART_SK.minAirT + 0.28 && (turns > 0 || s.rng() < 0.85), flipped: false }; }
        const P = sk.ai;
        inp.steer = P.spin && Math.abs(sk.yawAcc) < P.target - 0.3 ? P.spin : 0;
        inp.driftPress = !!(P.flip && !P.flipped && k.airT > CART_SK.minAirT); if (inp.driftPress) P.flipped = true;
        inp.drift = false;
      }
      if (canTrick && k.airT > CART_SK.minAirT) {
        const spin = -inp.steer * CART_SK.spinRate * dt;
        k.yaw = cartWrap(k.yaw + spin); sk.yawAcc += spin;
        if (inp.driftPress && sk.flipT <= 0) { sk.flipT = sk.flipDur = CART_SK.flipDur; if (k.player) Sound.play('jump', { vol: 0.3, pitch: 0.9 }); }
      }
      if (sk.flipT > 0) { sk.flipT = Math.max(0, sk.flipT - dt); sk.flipA = (1 - sk.flipT / sk.flipDur) * TAU; if (sk.flipT === 0) { sk.flips++; sk.flipA = 0; } }
      // ballistic: the spin doesn't bend the flight
      if (canTrick) { k.vx = sk.vx; k.vz = sk.vz; }
      sk.prevYaw = k.yaw;
    } else if (sk.inAir) { sk.inAir = false; sk.yawAcc = 0; sk.flips = 0; sk.flipT = 0; sk.flipA = 0; sk.ai = null; }
    // the pool: decorative, wet
    const P = s.skPool;
    if (P && !k.air && k.x > P.x0 && k.x < P.x1 && k.z > P.z0 && k.z < P.z1 && k.y < 0.3) {
      if (!sk.wet) { sk.wet = true; s.fx.burst(k.x, k.y + 0.6, k.z, 'drop', 18, '#9adcff'); if (racing) { s.log('splash', { k: k.id }); if (k.player) { s.banner('SPLASH!', '#5ac8ff', 1.0, 'the pool is for looking at'); Sound.play('splash', { vol: 0.7 }); } } }
      k.slowT = Math.max(k.slowT, 0.35); k.drift = 0; k.charge = 0;
      if (k.speed > 4 && Math.random() < dt * 30) s.fx.add(k.x + (Math.random() - 0.5) * 2, k.y + 0.3, k.z + (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 3, 2 + Math.random() * 3, (Math.random() - 0.5) * 3, 0.5, 0.3, 0.1, [0.7, 0.9, 1], 0.9, 'drop', 2);
    } else sk.wet = false;
  },
  vertical(s, k, dt, racing) {
    const sk = cartSkState(k), gh = s.terrain.height(k.x, k.z);
    if (sk.grind) {
      if (k.air) { // the hop fired: pop off the rail and keep the trick window open
        cartSkEndGrind(s, k, 'hop', racing); k.vy = Math.max(k.vy, 6); k.hop = false; k.airT = 0; cartSkTakeOff(s, k);
      } else { cartSkGrindStep(s, k, dt, racing); return true; }
    }
    if (k.air) {
      if (k.bubbleT > 0) return false;
      // the engine launches cars off steps at up to 30 m/s: cap the pop (lips and decks get a bit more)
      k.vy -= s.G * dt; k.y += k.vy * dt; k.airT += dt;
      // land on a rail?
      if (k.vy < 0 && k.spinT <= 0 && k.flipT <= 0 && !k.out) {
        const at = cartSkRailAt(s, k, CART_SK.railSnap + 0.3);
        if (at) { const ry = lerp(at.r.y0, at.r.y1, at.t) + CART_SK.railH; if (k.y <= ry + 0.15) { k.y = ry; if (sk.inAir && racing && (Math.abs(sk.yawAcc) > Math.PI * 0.85 || sk.flips > 0 || sk.flipT > 0)) { const v = k.vy; k.vy = -1; cartSkLand(s, k, racing, k.fwd); k.vy = v; } if (k.spinT <= 0) { cartSkStartGrind(s, k, at, racing); return true; } } }
      }
      if (k.y <= gh) { k.y = gh; cartSkLand(s, k, racing, k.fwd); }
      return true;
    }
    // on the ground: ride onto a rail
    if (k.spinT <= 0 && k.flipT <= 0 && !k.out && k.bubbleT <= 0) {
      const at = cartSkRailAt(s, k, CART_SK.railSnap);
      if (at) { cartSkStartGrind(s, k, at, racing); return true; }
    }
    return false;
  },
  onHit(s, k, kind, src, o) {
    const sk = cartSkState(k);
    if (sk.grind) { sk.grind = null; sk.railCool = 0.8; }
    sk.yawAcc = 0; sk.flips = 0; sk.flipT = 0; sk.flipA = 0; sk.combo = 0; sk.comboT = 0; sk.ai = null;
  },
  // TRICK ATTACK: the AI tours the features; two-stage goals (line up, then go through)
  aiGoal(s, k, nearestRival) {
    if (s.objective !== 'trick') return null;
    const sk = cartSkState(k), F = s.skFeats; if (!F.length) return null;
    const t = s.raceT;
    if (sk.feat) {
      const f = sk.feat, d0 = Math.hypot(k.x - f.ax, k.z - f.az);
      if (sk.stage === 0 && d0 < 6) sk.stage = 1;
      if (sk.stage === 1) { const past = (k.x - f.x) * f.dx + (k.z - f.z) * f.dz; if (past > f.len || (sk.grind) || sk.stageT > 9) { sk.used[f.id] = t; sk.feat = null; } }
      if (sk.feat && (sk.stageT += 0.5) > 16) { sk.used[f.id] = t; sk.feat = null; }
    }
    if (!sk.feat) {
      let best = null, bs = -1e9;
      for (const f of F) {
        const since = t - (sk.used[f.id] === undefined ? -99 : sk.used[f.id]);
        if (since < 14) continue;
        const d = Math.hypot(k.x - f.ax, k.z - f.az);
        // prefer close ones we're roughly facing, with a little randomness so the field spreads out
        const facing = Math.cos(cartWrap(Math.atan2(f.ax - k.x, f.az - k.z) - k.yaw));
        const sc = -d * (0.6 + 0.4 * (1 - facing)) + f.worth * 10 + s.rng() * 25;
        if (sc > bs) { bs = sc; best = f; }
      }
      if (!best) { for (const f of F) sk.used[f.id] = -99; best = F[Math.floor(s.rng() * F.length)]; }
      sk.feat = best; sk.stage = 0; sk.stageT = 0;
    }
    const f = sk.feat;
    return { goal: sk.stage === 0 ? [f.ax, f.az] : [f.ex, f.ez], prey: null };
  },
  hud(s, ctx, W, H, top, left) {
    const k = s.player, sk = k && k.sk; if (!sk) return;
    const portrait = H > W;
    let x, y, align;
    if (portrait) { x = W - left; y = top + 58 + 18; align = 'right'; } else { x = W / 2; y = top + 60; align = 'center'; }
    const lines = [];
    const g = sk.grind;
    if (g) lines.push(['GRIND ' + g.time.toFixed(1) + 's  +' + Math.round(g.pts), '#ffe24a']);
    else if (k.air && sk.inAir && k.airT > 0.25) { const deg = Math.floor(Math.abs(sk.yawAcc) / Math.PI + 0.15) * 180; lines.push([(deg ? deg + '°' : 'AIR') + (sk.flips ? ' + ' + (sk.flips > 1 ? sk.flips + 'x FLIP' : 'FLIP') : sk.flipT > 0 ? ' + flipping…' : '') + '  ' + k.airT.toFixed(1) + 's', sk.flipT > 0 ? '#ff9ad8' : '#9ae8ff']); }
    else if (sk.lastT > 0 && sk.last) lines.push([sk.last + (sk.lastPts ? '  +' + sk.lastPts : ''), sk.last === 'WIPEOUT' ? '#ff6a6a' : '#ffffff']);
    if (sk.combo > 1 && sk.comboT > 0) lines.push(['COMBO x' + cartSkMult(sk).toFixed(1) + '  ' + sk.comboT.toFixed(1) + 's', '#ffd84a']);
    if (sk.waxT > 0) lines.push(['GRIND WAX ' + Math.ceil(sk.waxT) + 's', '#ffe24a']);
    if (s.objective !== 'trick' && sk.pts > 0 && !lines.length && sk.lastT <= 0) lines.push(['TRICKS ' + Math.floor(sk.pts), 'rgba(255,255,255,0.6)']);
    for (let i = 0; i < lines.length; i++) BurnsUI.text(ctx, lines[i][0], x, y + i * 15, 12, lines[i][1], { align, ui: true });
  },
  draw(s, R, S, t) {
    const E = s.E, cam = s.cam;
    // the pool shimmers
    const P = s.skPool;
    if (P && (P.cx - cam.x) * (P.cx - cam.x) + (P.cz - cam.z) * (P.cz - cam.z) < 160 * 160) {
      R.flat.flat(P.cx, 0.08, P.cz, P.x1 - P.x0, P.z1 - P.z0, 0, S.glow, [0.35, 0.7, 1], 0.5, false);
      for (let i = 0; i < 3; i++) { const u = (t * 0.35 + i / 3) % 1; R.flat.flat(P.cx + Math.sin(i * 2.1) * 2, 0.1, P.cz + Math.cos(i * 1.7) * 1.5, 3 + u * 8, 3 + u * 8, 0, S.ring, [0.8, 0.95, 1], 0.4 * (1 - u), true); }
    }
    // the rail a car is grinding lights up at both ends
    for (const k of s.karts) { const g = k.sk && k.sk.grind; if (!g) continue; const r = g.r; R.bbs.bb(r.x0, r.y0 + 0.7, r.z0, 1.6, 1.6, S.glow, [1, 0.9, 0.4], 0.6, true); R.bbs.bb(r.x1, r.y1 + 0.7, r.z1, 1.6, 1.6, S.glow, [1, 0.9, 0.4], 0.6, true); R.bbs.bb(k.x, k.y + 0.3, k.z, 2.4, 2.4, S.glow, [1, 0.85, 0.4], 0.5, true); }
    // the vert wall's neon pulse
    const V = E.vert; if (V) { const p = 0.6 + 0.4 * Math.sin(t * 3); for (let i = 0; i < V.n; i++) R.bbs.bb(V.x0 + (V.x1 - V.x0) * i / (V.n - 1), V.y, V.z0 + (V.z1 - V.z0) * i / (V.n - 1), 1.4, 1.4, S.glow, burnsRGBf(BURNS_NEON[(i + Math.floor(t * 4)) % 7]), 0.5 * p, true); }
  }
};

/* ---------------- the powers ---------------- */
CART_ITEMS.kickflip = { name: 'KICKFLIP', desc: 'Pops the car into a huge air with a flip already going. Land it for points and a boost. Untouchable for a second.', col: '#38f2ff', arena: 'skate' };
CART_ITEMS.wax = { name: 'GRIND WAX', desc: 'For 10 seconds grinds score double and build speed, and no landing wipes you out.', col: '#ffe24a', arena: 'skate' };
CART_ITEMS.board = { name: 'BOARD SLAP', desc: 'Hurls a spinning skateboard ahead. It homes a little and spins out the first car it hits.', col: '#ff4fd8', arena: 'skate' };
const cartSkIsArena = s => s.rules === CART_ARENA_RULES.skate;
CART_ITEM_FX.kickflip = {
  use(s, k) {
    const sk = cartSkState(k);
    if (sk.grind) cartSkEndGrind(s, k, 'hop', true);
    k.vy = 14.5; k.air = true; k.airT = CART_SK.minAirT; k.hop = false; k.y += 0.05; k.invT = Math.max(k.invT, 1.0); k.drift = 0; k.charge = 0; k.pendingDrift = false;
    if (!s.isBattle) s.boost(k, 0.5, 'kick');   // in a race it's a long jump
    cartSkTakeOff(s, k);
    sk.flipT = sk.flipDur = CART_SK.flipDur; sk.ai = { T: 1.1, spin: 0, target: 0, flip: true, flipped: true };
    s.fx.burst(k.x, k.y + 0.4, k.z, 'ring', 12, '#9ae8ff'); s.fx.spark(k.x, k.y + 0.3, k.z, 14, '#38f2ff', 7);
    Sound.play('jump', { vol: k.player ? 0.7 : 0.3, pitch: 0.7 }); if (k.player) s.shakeIt(0.3);
  },
  // outside the arena (races) the flip still shows and lands
  update(s, dt, racing) {
    if (cartSkIsArena(s)) return;
    for (const k of s.karts) {
      const sk = k.sk; if (!sk) continue;
      if (sk.flipT > 0) { sk.flipT = Math.max(0, sk.flipT - dt); sk.flipA = (1 - sk.flipT / sk.flipDur) * TAU; if (sk.flipT === 0) { sk.flips++; sk.flipA = 0; } }
      if (sk.inAir && !k.air) { if (sk.flips > 0 && racing && k.spinT <= 0) { s.fx.burst(k.x, k.y + 1.5, k.z, 'star', 14, '#38f2ff'); if (k.player) s.banner('KICKFLIP LANDED!', '#38f2ff', 1.0); } sk.inAir = false; sk.flips = 0; sk.flipT = 0; sk.flipA = 0; }
    }
  },
  aiWants(s, k) { return !k.air && k.spinT <= 0 && k.flipT <= 0 && k.speed > 8 && Math.abs(k.slopeX || 0) < 0.08 && Math.abs(k.slopeZ || 0) < 0.08 && !(k.sk && k.sk.grind); },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = s * 0.08; ctx.save(); ctx.rotate(-0.6); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-s * 0.42, -s * 0.12, s * 0.84, s * 0.24, s * 0.1) : ctx.rect(-s * 0.42, -s * 0.12, s * 0.84, s * 0.24); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#1a1020'; for (const x of [-0.22, 0.22]) { ctx.beginPath(); ctx.arc(x * s, s * 0.17, s * 0.07, 0, TAU); ctx.fill(); } ctx.restore(); ctx.strokeStyle = col; ctx.lineWidth = s * 0.07; ctx.beginPath(); ctx.arc(0, 0, s * 0.46, 0.4, 2.0); ctx.stroke(); }
};
CART_ITEM_FX.wax = {
  use(s, k) { const sk = cartSkState(k); sk.waxT = 10; s.boost(k, 0.6, 'wax'); s.fx.burst(k.x, k.y + 1, k.z, 'star', 16, '#ffe24a'); Sound.play('cartSparkle', { vol: k.player ? 0.7 : 0.3 }); },
  update(s, dt, racing) { for (const k of s.karts) { const sk = k.sk; if (!sk || sk.waxT <= 0) continue; sk.waxT = Math.max(0, sk.waxT - dt); if (Math.random() < dt * 10) s.fx.glint(k.x + (Math.random() - 0.5) * 2.5, k.y + 0.5 + Math.random() * 1.5, k.z + (Math.random() - 0.5) * 2.5, '#ffe24a'); } },
  aiWants(s, k) { const R = s.E.rails; if (R) for (const r of R) { const t = clamp(((k.x - r.x0) * r.dx + (k.z - r.z0) * r.dz) / r.L2, 0, 1); if (Math.hypot(k.x - r.x0 - r.dx * t, k.z - r.z0 - r.dz * t) < 25) return true; } return k.ai && k.ai.itemT < -5; },
  icon(ctx, s, col) { ctx.fillStyle = col; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.moveTo(-s * 0.4, s * 0.3); ctx.lineTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, -s * 0.3); ctx.lineTo(s * 0.4, s * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.1, s * 0.12, s * 0.07, -0.5, 0, TAU); ctx.fill(); }
};
CART_ITEM_FX.board = {
  use(s, k) {
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), sp = Math.max(0, k.fwd || 0);
    const p = k.M ? cartCarPoint(k, 0, 1.2, k.M.len / 2 + 0.6, [0, 0, 0]) : [k.x + fx * 2, k.y + 1.2, k.z + fz * 2];
    s.shots.push({ type: 'board', fx: 'board', owner: k, x: p[0], y: p[1], z: p[2], vx: fx * (sp + 26), vz: fz * (sp + 26), t: 0, life: 2.4, spin: 0, yaw: k.yaw });
    Sound.play('throw', { vol: k.player ? 0.8 : 0.3 }); s.fx.spark(p[0], p[1], p[2], 6, '#ff9ad8', 4);
  },
  shot(s, sh, dt) {
    const k = sh.owner;
    // homes a little on the nearest rival ahead
    let best = null, bd = 30;
    for (const o of s.karts) { if (o === k || o.out) continue; const dx = o.x - sh.x, dz = o.z - sh.z, d = Math.hypot(dx, dz); if (d < bd && dx * sh.vx + dz * sh.vz > 0) { bd = d; best = o; } }
    if (best) { const sp = Math.hypot(sh.vx, sh.vz), dx = best.x - sh.x, dz = best.z - sh.z, d = Math.hypot(dx, dz) || 1, f = 1 - Math.exp(-2.2 * dt); sh.vx = lerp(sh.vx, dx / d * sp, f); sh.vz = lerp(sh.vz, dz / d * sp, f); }
    sh.x += sh.vx * dt; sh.z += sh.vz * dt; sh.spin += dt * 16; sh.yaw = Math.atan2(sh.vx, sh.vz);
    const gh = s.terrain.height(sh.x, sh.z);
    sh.y = lerp(sh.y, gh + 1.1 + Math.sin(sh.t * 9) * 0.25, 1 - Math.exp(-5 * dt));
    if (s.E.walls && s.wallDist(sh.x, sh.z, s._wdB || (s._wdB = {})).d < 0.5) sh.dead = true;
    if (s.T && s.isRace) { const L = s.T.locate(sh.x, sh.z, k.loc.i, CART_TMPL2); if (Math.abs(L.d) > s.T.HW[L.i] + 4) sh.dead = true; }
    for (const o of s.karts) {
      if (o === k && sh.t < 0.5) continue; if (o === k || o.out) continue;
      const dx = o.x - sh.x, dz = o.z - sh.z;
      if (dx * dx + dz * dz < 2.3 * 2.3 && Math.abs(o.y + 0.8 - sh.y) < 2.6) {
        const d = Math.hypot(sh.vx, sh.vz) || 1;
        s.hit(o, 'spin', k, { item: 'board', dur: 1.1, dx: sh.vx / d, dz: sh.vz / d });
        s.fx.spark(sh.x, sh.y, sh.z, 16, '#ff9ad8', 7); s.fx.confetti(sh.x, sh.y, sh.z, 10); Sound.play('break', { vol: o.player || k.player ? 0.7 : 0.3, pitch: 1.2 });
        sh.dead = true; break;
      }
    }
    if (Math.random() < dt * 20) s.fx.add(sh.x, sh.y - 0.2, sh.z, -sh.vx * 0.05, 0.3, -sh.vz * 0.05, 0.25, 0.25, 0.05, [1, 0.5, 0.9], 1, 'spark', 1);
  },
  draw(s, R, sh, S, t) {
    const a = clamp((sh.life - sh.t) * 3, 0, 1);
    R.bbs.bb(sh.x, sh.y, sh.z, 2.4, 0.5, S.square, [0.95, 0.3, 0.8], a, false, sh.spin);
    R.bbs.bb(sh.x, sh.y, sh.z, 2.0, 0.22, S.square, [0.1, 0.08, 0.12], a, false, sh.spin);
    for (const q of [-0.7, 0.7]) R.bbs.bb(sh.x + Math.cos(sh.spin) * q * 0.9, sh.y + Math.sin(sh.spin) * q * 0.9, sh.z, 0.36, 0.36, S.dot, [1, 1, 1], a, false);
    R.bbs.bb(sh.x, sh.y, sh.z, 3.2, 3.2, S.glow, [1, 0.4, 0.9], 0.5 * a, true);
    const d = Math.hypot(sh.vx, sh.vz) || 1;
    R.bbs.streak(sh.x - sh.vx / d * 1.6, sh.y, sh.z - sh.vz / d * 1.6, sh.vx / d, 0, sh.vz / d, 3.2, 0.8, S.streak, [1, 0.45, 0.9], 0.6 * a);
  },
  aiWants(s, k) { const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw); for (const o of s.karts) { if (o === k || o.out || o.invT > 0.3) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d < 30 && Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)) < 0.35 && dx * fx + dz * fz > 0) return true; } return k.ai && k.ai.itemT < -8; },
  icon(ctx, s, col) { ctx.save(); ctx.rotate(0.5); ctx.fillStyle = col; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = s * 0.08; ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.16, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; for (const x of [-0.25, 0.25]) { ctx.beginPath(); ctx.arc(x * s, s * 0.2, s * 0.08, 0, TAU); ctx.fill(); ctx.stroke(); } ctx.restore(); }
};

/* ---------------- the menu card icon: a bowl, a car popping an air ---------------- */
CART_ARENA_ICONS.skate = (ctx, s, t, col) => {
  // the bowl (a U cross-section) with coping dots
  ctx.lineWidth = Math.max(2, s * 0.12);
  ctx.beginPath(); ctx.moveTo(-s * 0.95, -s * 0.35); ctx.quadraticCurveTo(-s * 0.95, s * 0.6, -s * 0.2, s * 0.6); ctx.lineTo(s * 0.2, s * 0.6); ctx.quadraticCurveTo(s * 0.95, s * 0.6, s * 0.95, -s * 0.35); ctx.lineTo(s * 0.95, s * 0.75); ctx.lineTo(-s * 0.95, s * 0.75); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; for (const x of [-0.95, 0.95]) { ctx.beginPath(); ctx.arc(x * s, -s * 0.35, s * 0.09, 0, TAU); ctx.fill(); }
  // the car: up out of the left lip, a backflip at the top, down into the right
  const u = (t * 0.45) % 1, arcX = (-0.75 + u * 1.5) * s, arcY = -s * 0.35 - Math.sin(u * Math.PI) * s * 0.85;
  const rot = u < 0.25 || u > 0.75 ? 0 : -(u - 0.25) / 0.5 * TAU;
  ctx.save(); ctx.translate(arcX, arcY); ctx.rotate(rot);
  ctx.fillStyle = col; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, s * 0.07);
  ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.08); ctx.lineTo(-s * 0.3, -s * 0.08); ctx.lineTo(-s * 0.1, -s * 0.22); ctx.lineTo(s * 0.18, -s * 0.22); ctx.lineTo(s * 0.3, -s * 0.06); ctx.lineTo(s * 0.3, s * 0.08); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1a1020'; for (const x of [-0.18, 0.18]) { ctx.beginPath(); ctx.arc(x * s, s * 0.1, s * 0.08, 0, TAU); ctx.fill(); }
  ctx.restore();
  // sparkle trail
  ctx.fillStyle = '#ffffff'; for (let i = 1; i <= 3; i++) { const v = u - i * 0.06; if (v < 0) continue; ctx.globalAlpha = 0.5 - i * 0.12; ctx.beginPath(); ctx.arc((-0.75 + v * 1.5) * s, -s * 0.35 - Math.sin(v * Math.PI) * s * 0.85, s * 0.05, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
};

/* ---------------- the park ---------------- */
// a grindable rail / ledge: the line (with end heights), its low terrain bump and a chrome (or concrete) mesh
function cartSkRail(E, def, night) {
  const [x0, z0, x1, z1] = def.at, y0 = def.y0 || 0, y1 = def.y1 || 0, kind = def.kind || 'rail';
  const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
  const r = { id: def.id || ('rail' + E.rails.length), x0, z0, x1, z1, y0, y1, dx, dz, L, L2: L * L, ux, uz, kind };
  E.rails.push(r);
  const w = kind === 'ledge' ? 1.1 : 0.7;
  E.terrain.add(Object.assign({ x0: Math.min(x0, x1) - 1.5, z0: Math.min(z0, z1) - 1.5, x1: Math.max(x0, x1) + 1.5, z1: Math.max(z0, z1) + 1.5 }, { kind: 'rail', noMesh: true, h(x, z) { const t = clamp(((x - x0) * dx + (z - z0) * dz) / (L * L), 0, 1), d = Math.hypot(x - x0 - dx * t, z - z0 - dz * t); if (d >= w) return 0; const base = lerp(y0, y1, t); return kind === 'ledge' ? base + 0.5 : base + 0.5 * (1 - d / w); } }));
  const yaw = Math.atan2(dx, dz);
  CartScene.mesh(E.api, (x0 + x1) / 2, (z0 + z1) / 2, yaw, m => {
    if (kind === 'ledge') {
      m.color('#cfc9bf').shine(0); m.roundBox(0, 0.25, 0, 1.6, 0.5, L, 0.08);
      m.color('#b8b2a8'); m.roundBox(0, 0.02, 0, 1.9, 0.08, L + 0.3, 0.02);
      m.color('#e8ecf4').shine(3); m.limb(-0.78, 0.5, -L / 2, -0.78, 0.5, L / 2, 0.05, 0.05, { seg: 5 }); m.limb(0.78, 0.5, -L / 2, 0.78, 0.5, L / 2, 0.05, 0.05, { seg: 5 }); m.shine(0);
      m.color(def.col || '#38f2ff', night ? 0.9 : 0.3); m.limb(0, 0.52, -L / 2, 0, 0.52, L / 2, 0.035, 0.035, { seg: 4 }); m.emissive(0);
    } else {
      const ya = y0 + CART_SK.railH, yb = y1 + CART_SK.railH;
      m.color('#d8dce8').shine(3); m.limb(0, ya, -L / 2, 0, yb, L / 2, 0.07, 0.07, { seg: 8 });
      const np = Math.max(1, Math.floor(L / 3.5));
      for (let i = 0; i <= np; i++) { const t = i / np, lz = -L / 2 + L * t, py = lerp(ya, yb, t); m.limb(0, lerp(y0, y1, t) - 0.3, lz, 0, py, lz, 0.05, 0.05, { seg: 5 }); }
      m.shine(0);
      m.color(def.col || '#ff4fd8', night ? 1 : 0.3); m.limb(0, y0 + 0.04, -L / 2, 0, y1 + 0.04, L / 2, 0.035, 0.035, { seg: 4 }); m.emissive(0);
    }
  }, { noAO: true, hi: true });
  if (night) { E.api.glow(x0, y0 + 0.7, z0, 0.7, def.col || '#ff4fd8'); E.api.glow(x1, y1 + 0.7, z1, 0.7, def.col || '#ff4fd8'); }
  return r;
}
// extra heightfield features for the park
const CartSkFeat = {
  // a flat raised block with a short edge fade (platforms, manual pads)
  block(cx, cz, w, d, H, o) { o = o || {}; const f = o.fade || 0.4; return Object.assign({ x0: cx - w / 2 - 1, z0: cz - d / 2 - 1, x1: cx + w / 2 + 1, z1: cz + d / 2 + 1 }, { kind: 'concrete', col: o.col || '#c8c2b8', res: 0.5, H, h(x, z) { const ax = Math.abs(x - cx) - w / 2, az = Math.abs(z - cz) - d / 2, a = Math.max(ax, az); if (a <= 0) return H; if (a < f) return H * (1 - a / f); return 0; } }); },
  // a smooth bank: rises from 0 at the far end (len along yaw) to H at the near end, then stays H over the plateau
  bank(cx, cz, yaw, len, w, H, o) { o = o || {}; const R = Math.hypot(len, w) / 2 + 2; return Object.assign(cartBox(cx, cz, R), { kind: 'concrete', col: o.col || '#c4beb4', res: 0.5, H, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); if (Math.abs(v) > w / 2 || u < -len / 2 || u > len / 2) return 0; const t = (u + len / 2) / len; return H * (1 - BurnsM.smoothstep(0, 1, t)); } }); },
  // a stair set: n steps dropping from H (at the near end, u = -len/2) to 0 (far end) along yaw
  stairs(cx, cz, yaw, len, w, H, n, o) { o = o || {}; const R = Math.hypot(len, w) / 2 + 2; return Object.assign(cartBox(cx, cz, R), { kind: 'concrete', col: o.col || '#bdb7ad', res: 0.3, H, h(x, z) { const [u, v] = cartLocal(x, z, cx, cz, yaw); if (Math.abs(v) > w / 2 || u < -len / 2 || u > len / 2) return 0; const step = Math.floor((u + len / 2) / len * n); return Math.max(0, H * (1 - (step + 1) / n)); } }); }
};
CartWorlds.arena_skate = function (A, night) {
  const E = this.base(2001, [-125, -125, 125, 125], '#9a948a', 0.05);
  Object.assign(E, { id: 'skate', arena: A, sky: Object.assign(CART_SKIES.sunset(), { fogD: 0.0042, hor: '#ff9a6a', sky: '#9a94c8', haze: 0.35, fogMax: 0.7 }), tod: A.tod, music: 'kart2', night: night || A.tod === 'sunset', R: 115 });
  const api = E.api, T = E.terrain, rng = mulberry32(9), nite = E.night;
  E.rails = []; E.skFeats = [];
  const feat = (id, x, z, yaw, back, fwd, worth) => { const dx = Math.sin(yaw), dz = Math.cos(yaw); E.skFeats.push({ id, x, z, dx, dz, ax: x - dx * back, az: z - dz * back, ex: x + dx * fwd, ez: z + dz * fwd, len: fwd, worth: worth || 1 }); };
  /* ground paint: the slab, expansion joints, the street plaza, the pool, the snake run lane and graffiti */
  const POOL = E.pool = { x0: -7, z0: 51, x1: 7, z1: 61, cx: 0, cz: 56 };
  api.paint((ctx, P, S) => {
    const c = P(0, 0); ctx.fillStyle = '#b4aea4'; ctx.beginPath(); ctx.arc(c[0], c[1], 114 * S, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(60,56,52,0.22)'; ctx.lineWidth = 0.15 * S;
    for (let i = -114; i <= 114; i += 6) { let a = P(i, -114), b = P(i, 114); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); a = P(-114, i); b = P(114, i); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    // the street plaza: darker pavers
    { const q = P(66, 34); ctx.fillStyle = 'rgba(70,62,72,0.35)'; ctx.fillRect(q[0], q[1], 36 * S, 50 * S); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.1 * S; for (let i = 0; i <= 36; i += 3) { const a = P(66 + i, 34), b = P(66 + i, -16); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    // the pool: deep blue tiles with a white edge
    { const q = P(POOL.x0, POOL.z1); ctx.fillStyle = '#f0f0f4'; ctx.fillRect(q[0] - 0.6 * S, q[1] - 0.6 * S, (POOL.x1 - POOL.x0 + 1.2) * S, (POOL.z1 - POOL.z0 + 1.2) * S); ctx.fillStyle = '#2a78c8'; ctx.fillRect(q[0], q[1], (POOL.x1 - POOL.x0) * S, (POOL.z1 - POOL.z0) * S); ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 0.08 * S; for (let i = 1; i < 14; i++) { const a = P(POOL.x0 + i, POOL.z0), b = P(POOL.x0 + i, POOL.z1); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } }
    // the snake run lane and the landing zones
    ctx.strokeStyle = 'rgba(90,70,110,0.35)'; ctx.lineWidth = 7 * S; ctx.lineCap = 'round'; ctx.beginPath(); { const pts = [[-82, -50], [-83, -34], [-86, -20], [-83, -6], [-86, 8], [-83, 22], [-86, 36], [-82, 50]]; pts.forEach((p, i) => { const q = P(p[0], p[1]); if (i) ctx.lineTo(q[0], q[1]); else ctx.moveTo(q[0], q[1]); }); } ctx.stroke();
    // graffiti blobs and a few painted words
    for (let i = 0; i < 34; i++) { const a = rng() * TAU, r = 14 + rng() * 92, x = Math.sin(a) * r, z = Math.cos(a) * r, p = P(x, z); ctx.strokeStyle = BURNS_NEON[i % 7]; ctx.globalAlpha = 0.3; ctx.lineWidth = 0.6 * S; ctx.beginPath(); for (let k = 0; k < 6; k++) { const b = k * 1.1, rr = (2 + rng() * 3) * S; ctx.lineTo(p[0] + Math.cos(b) * rr, p[1] + Math.sin(b) * rr); } ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.font = `800 ${Math.round(5 * S)}px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const [tx, x, z, rot, col] of [['SEND IT', 0, -30, 0, '#ff4fd8'], ['NO MOOP', 60, 44, 0.4, '#ffe24a'], ['GNAR', -60, 20, -0.5, '#38f2ff'], ['HYDRATE', 30, 90, 0.2, '#7aff5a']]) { const p = P(x, z); ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(rot); ctx.globalAlpha = 0.28; ctx.fillStyle = col; ctx.fillText(tx, 0, 0); ctx.restore(); }
  });
  /* the centre: the throne funbox, three kickers, three rails (the original park) */
  T.add(CartFeat.funbox(0, 6, 9, 6, 2.2));
  feat('throne', 0, 6, 0.3, 26, 14, 1);
  const kick = (id, x, z, yaw, len, w, h, col, worth) => { T.add(CartFeat.ramp(x, z, yaw, len, w, h, { col: '#8a8a92', stripe: col })); feat(id, x, z, yaw, 18, 12, worth || 2); };
  kick('k1', -14, -14, Math.PI * 0.75, 5, 5, 1.7, '#38f2ff');
  kick('k2', 16, 26, -Math.PI * 0.25, 5, 5, 1.7, '#ff4fd8');
  kick('k3', 22, -10, Math.PI / 2, 5, 5, 1.6, '#ffe24a');
  kick('k4', -40, 14, -Math.PI / 2, 6, 6, 2.0, '#7aff5a');
  kick('k5', 40, 30, 0, 6, 6, 2.0, '#ff7a2a');
  kick('k6', 62, 24, Math.PI / 2, 5, 6, 1.6, '#9a6bff');
  kick('k7', -10, -70, Math.PI, 6, 6, 2.2, '#ffe24a');
  cartSkRail(E, { id: 'r1', at: [-20, 30, 8, 30] }, nite);
  cartSkRail(E, { id: 'r2', at: [26, 2, 26, -22] }, nite);
  cartSkRail(E, { id: 'r3', at: [-30, -8, -12, -8] }, nite);
  cartSkRail(E, { id: 'r4', at: [-4, -44, 20, -44], col: '#38f2ff' }, nite);
  /* ring two: the bowl, the half-pipe, the spine, the mid quarter pipes, the gap jump, the stair set */
  T.add(CartFeat.bowl(-28, -40, 12, 10, 4.0, 3.0, { deck: 2.6 }));
  feat('bowl', -28, -40, -0.6, 32, 14, 2);
  T.add(CartFeat.halfpipe(44, -42, 0, 34, 7, 4.0, 3.2));
  feat('pipeA', 44, -36, Math.PI / 2, 28, 4, 2); feat('pipeB', 44, -48, -Math.PI / 2, 28, 4, 2);
  T.add(CartFeat.spine(-46, 44, Math.PI / 2, 22, 4.5, 2.2));
  feat('spineA', -46, 44, 0, 24, 10, 2); feat('spineB', -40, 44, Math.PI, 24, 10, 2);
  T.add(CartFeat.qpipe(-70, 4, -Math.PI / 2, 26, 4.0, 2.8, 2.5)); feat('qpW', -70, 4, -Math.PI / 2, 26, 2, 2);
  T.add(CartFeat.qpipe(0, -96, Math.PI, 34, 4.5, 3.2, 3)); feat('qpS', 0, -96, Math.PI, 28, 2, 2);
  T.add(CartFeat.qpipe(74, 74, Math.PI * 0.25, 20, 4.5, 3.0, 2.5)); feat('qpNE', 74, 74, Math.PI * 0.25, 26, 2, 2);
  // the gap: kicker to kicker over the pool (land on the far ramp's face, or splash)
  T.add(CartFeat.ramp(-14, 56, Math.PI / 2, 7, 7, 2.6, { col: '#5a6a9a', stripe: '#38f2ff' }));
  T.add(CartFeat.ramp(14, 56, -Math.PI / 2, 7, 7, 2.6, { col: '#5a6a9a', stripe: '#38f2ff' }));
  feat('gap', -14, 56, Math.PI / 2, 24, 34, 3);
  // the pool rim (decor, no colliders)
  CartScene.mesh(api, POOL.cx, POOL.cz, 0, m => { m.color('#eef0f4').shine(1); const w = POOL.x1 - POOL.x0, d = POOL.z1 - POOL.z0; m.roundBox(0, 0.1, d / 2 + 0.35, w + 1.4, 0.2, 0.7, 0.06); m.roundBox(0, 0.1, -d / 2 - 0.35, w + 1.4, 0.2, 0.7, 0.06); m.roundBox(w / 2 + 0.35, 0.1, 0, 0.7, 0.2, d, 0.06); m.roundBox(-w / 2 - 0.35, 0.1, 0, 0.7, 0.2, d, 0.06); m.shine(0); m.color('#ffd84a'); for (let i = 0; i < 3; i++) m.ellipsoid(-4 + i * 4, 0.12, (i - 1) * 2.5, 0.9, 0.12, 0.6, { seg: 8, rings: 4 }); }, { hi: true, noAO: true });
  // the stair set: a bank up (east), a platform, six steps down (west), handrails both sides
  T.add(CartSkFeat.bank(35, 81, Math.PI / 2, 10, 10, 1.8));
  T.add(CartSkFeat.block(25, 81, 10, 10, 1.8));
  T.add(CartSkFeat.stairs(15, 81, -Math.PI / 2, 10, 10, 1.8, 6));
  cartSkRail(E, { id: 'hrA1', at: [30, 76.4, 20, 76.4], y0: 1.8, y1: 1.8, col: '#ffe24a' }, nite);
  cartSkRail(E, { id: 'hrA2', at: [20, 76.4, 10, 76.4], y0: 1.8, y1: 0, col: '#ffe24a' }, nite);
  cartSkRail(E, { id: 'hrB1', at: [30, 85.6, 20, 85.6], y0: 1.8, y1: 1.8, col: '#ffe24a' }, nite);
  cartSkRail(E, { id: 'hrB2', at: [20, 85.6, 10, 85.6], y0: 1.8, y1: 0, col: '#ffe24a' }, nite);
  feat('stairsA', 40, 76.4, -Math.PI / 2, 16, 36, 3); feat('stairsB', 40, 85.6, -Math.PI / 2, 16, 36, 3);
  /* ring three: the mega bowl, the vert wall, the street plaza, the snake run, the dirt table, the pyramid */
  T.add(CartFeat.bowl(-58, -60, 16, 13, 5.5, 4.2, { deck: 3, out: 4, col: '#c8c4bc' }));
  feat('megaA', -58, -60, Math.PI, 40, 16, 3); feat('megaB', -58, -60, -Math.PI / 2, 40, 18, 3);
  T.add(CartFeat.qpipe(0, 95, 0, 34, 7, 7, 3, { col: '#b8b4c4' }));
  feat('vertA', 10, 95, 0, 30, 2, 3); feat('vertB', -10, 95, 0, 30, 2, 3);
  E.vert = { x0: -17, x1: 17, z0: 95.3, z1: 95.3, y: 7.4, n: 12 };
  // the street plaza: two ledges, a flat rail, a manual pad
  cartSkRail(E, { id: 'ledge1', at: [74, -8, 74, 12], kind: 'ledge', col: '#38f2ff' }, nite);
  cartSkRail(E, { id: 'ledge2', at: [92, -6, 92, 18], kind: 'ledge', col: '#7aff5a' }, nite);
  cartSkRail(E, { id: 'r5', at: [83, 28, 83, 4], col: '#ff7a2a' }, nite);
  T.add(CartSkFeat.block(83, -10, 8, 4, 0.45, { fade: 0.6, col: '#d0cac0' }));
  feat('plazaA', 74, -8, 0, 22, 24, 2); feat('plazaB', 92, 18, Math.PI, 22, 28, 2); feat('plazaC', 83, 28, Math.PI, 20, 28, 2);
  // the snake run: four banked berms down the west edge
  T.add(CartFeat.berm(-74, -30, 8, 15, -2.47, -0.67, 2.4, { col: '#a8a098' }));
  T.add(CartFeat.berm(-90, -10, 8, 15, 2.47, 0.67, 2.4, { col: '#a8a098' }));
  T.add(CartFeat.berm(-74, 10, 8, 15, -2.47, -0.67, 2.4, { col: '#a8a098' }));
  T.add(CartFeat.berm(-90, 30, 8, 15, 2.47, 0.67, 2.4, { col: '#a8a098' }));
  feat('snakeN', -82, -46, 0, 14, 96, 1); feat('snakeS', -82, 46, Math.PI, 14, 96, 1);
  // the dirt table and its rail (south-east)
  T.add(CartFeat.table(68, -64, Math.PI / 2, 8, 8, 8, 12, 2.8));
  feat('tableA', 68, -64, Math.PI / 2, 30, 18, 2); feat('tableB', 68, -64, -Math.PI / 2, 22, 26, 2);
  cartSkRail(E, { id: 'r6', at: [52, -66, 52, -90], col: '#9a6bff' }, nite);
  // the pyramid (north-west) and the long rail beside it
  T.add(CartFeat.funbox(-62, 62, 12, 8, 2.8, { col: '#c4bec8' }));
  feat('pyrA', -62, 62, 0, 30, 16, 2); feat('pyrB', -62, 58, -Math.PI / 2, 30, 16, 2);
  cartSkRail(E, { id: 'r7', at: [-40, 60, -40, 80], col: '#7aff5a' }, nite);
  /* neon copings and the rail approach lights */
  if (nite) {
    for (let i = 0; i < 20; i++) { const a = i / 20 * TAU; api.glow(-58 + Math.sin(a) * 17, 4.5, -60 + Math.cos(a) * 14, 0.8, BURNS_NEON[i % 7]); }
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; api.glow(-28 + Math.sin(a) * 12.5, 3.3, -40 + Math.cos(a) * 10.5, 0.7, '#38f2ff'); }
    for (let i = 0; i < 9; i++) { api.glow(44 - 7.5, 3.5, -58 + i * 4, 0.6, '#ff4fd8'); api.glow(44 + 7.5, 3.5, -58 + i * 4, 0.6, '#ff4fd8'); }
    api.light(0, 95, 30, '#9a6bff', 0.5); api.light(-58, -60, 30, '#38f2ff', 0.45); api.light(83, 10, 26, '#ff4fd8', 0.4);
  }
  /* perimeter, light towers, bleachers + crowd, graffiti walls, banners, the cast */
  const poly = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU; poly.push([Math.sin(a) * 115, Math.cos(a) * 115]); }
  this.perimeter(E, poly, 'chain');
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; CartScene.prop(api, 'lightTower', { x: Math.sin(a) * 111, z: Math.cos(a) * 111, aim: a + Math.PI }); if (nite) api.light(Math.sin(a) * 92, Math.cos(a) * 92, 30, '#fff0d8', 0.4); }
  for (const a of [0.5, 1.9, 3.5, 4.9]) { const x = Math.sin(a) * 122, z = Math.cos(a) * 122; E.spots.push(...CartScene.bleachers(api, x, z, a + Math.PI, 24, 5, rng)); if (nite) api.light(x, z, 18, '#ffb0e0', 0.4); }
  const tags = ['SHRED\nOR\nDEAD', 'NO\nSKATING\n(JK)', 'GNAR\nZONE', 'BOWL-O-\nRAMA', 'LANDINGS\nARE\nOPTIONAL', 'HYDRATE\nTHEN\nGRIND', 'MOOP-FREE\nMEGA BOWL', 'RANGERS\nSAY\nHUCK IT'];
  tags.forEach((t, i) => { const a = 0.25 + i * (TAU / 8), x = Math.sin(a) * 108, z = Math.cos(a) * 108; CartScene.mesh(api, x, z, a + Math.PI, m => { m.color('#8a8a92'); m.roundBox(0, 1.6, 0, 6, 3.2, 0.5, 0.1); }, { hi: true }); api.sign(t, x + Math.sin(a + Math.PI) * 0.3, z + Math.cos(a + Math.PI) * 0.3, { yaw: a + Math.PI, h: 2.4, y: 0.4, post: false, maxW: 5.4, style: { bg: BURNS_NEON[i * 3 % 7], fg: '#1a1a1a', border: '#ffffff' }, glow: nite ? BURNS_NEON[i * 3 % 7] : null }); });
  // pennant strings across the plaza and over the pool, and a big banner over the vert wall
  for (const [x0, z0, x1, z1] of [[66, -16, 102, -16], [66, 34, 102, 34], [-12, 50, 12, 50], [-12, 62, 12, 62]]) { for (const [px, pz] of [[x0, z0], [x1, z1]]) CartScene.mesh(api, px, pz, 0, m => { m.color('#4a4a56').shine(2); m.limb(0, 0, 0, 0, 5.5, 0, 0.08, 0.06, { seg: 6 }); m.shine(0); return { cols: [{ t: 'cyl', x: 0, z: 0, r: 0.2, y0: 0, y1: 5.5, camPass: true }] }; }, { noAO: true }); CartScene.prop(api, 'pennants', { x: (x0 + x1) / 2, z: (z0 + z1) / 2, x0: x0 - (x0 + x1) / 2, y0: 5.3, z0: z0 - (z0 + z1) / 2, x1: x1 - (x0 + x1) / 2, y1: 5.3, z1: z1 - (z0 + z1) / 2, n: Math.round(Math.hypot(x1 - x0, z1 - z0) / 1.6), sag: 1.0 }); }
  api.sign('TRICK ATTACK', 0, 101.5, { yaw: Math.PI, h: 2.2, y: 9.2, post: true, maxW: 16, style: { bg: '#2a1a3a', fg: '#ffe24a', border: '#ff4fd8' }, glow: nite ? '#ff4fd8' : null });
  api.sign('THE MEGA BOWL', -58, -86, { yaw: 0, h: 1.4, y: 3.0, post: true, maxW: 9, style: { bg: '#1a2a3a', fg: '#38f2ff', border: '#ffffff' }, glow: nite ? '#38f2ff' : null });
  api.sign('STREET\nPLAZA', 84, 40, { yaw: Math.PI, h: 1.6, y: 3.2, post: true, maxW: 7, style: { bg: '#3a1a2a', fg: '#ff9ad8', border: '#ffffff' }, glow: nite ? '#ff4fd8' : null });
  api.sign('SNAKE\nRUN', -98, -44, { yaw: Math.PI, h: 1.6, y: 3.0, post: true, maxW: 6, style: { bg: '#2a1a3a', fg: '#7aff5a', border: '#ffffff' }, glow: nite ? '#7aff5a' : null });
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.6; CartScene.lamp(api, Math.sin(a) * 109.5, Math.cos(a) * 109.5, BURNS_NEON[i % 7], nite); }
  E.heroes.push({ type: 'badideaguy', x: 6, z: -104, yaw: 0, anim: 'dare' }, { type: 'sparklepony', x: -24, z: 92, yaw: Math.PI, anim: 'cheer' }, { type: 'burnerkid', x: 104, z: -24, yaw: -Math.PI / 2, anim: 'wave' }, { type: 'dpw', x: 44, z: 92, yaw: Math.PI, anim: 'cheer' }, { type: 'ranger', x: -104, z: 60, yaw: Math.PI / 2, anim: 'wave' });
  /* objective spots */
  E.zones = [{ x: 0, z: 6, r: 6.5, name: 'THE THRONE' }, { x: -58, z: -60, r: 9, name: 'THE MEGA BOWL' }, { x: 84, z: 10, r: 8, name: 'THE STREET PLAZA' }, { x: 0, z: 93, r: 8, name: 'THE VERT WALL' }, { x: 44, z: -42, r: 7, name: 'THE PIPE' }, { x: -62, z: 62, r: 7, name: 'THE PYRAMID' }, { x: 25, z: 81, r: 6.5, name: 'THE STAIRS' }];
  for (let i = 0; i < 52; i++) { const a = rng() * TAU, r = 10 + rng() * 92; const x = Math.sin(a) * r, z = Math.cos(a) * r; if (x > POOL.x0 - 2 && x < POOL.x1 + 2 && z > POOL.z0 - 2 && z < POOL.z1 + 2) continue; E.orbSpots.push({ x, z }); }
  E.flagSpots = [{ x: 0, z: 6 }, { x: -58, z: -60 }, { x: 84, z: 10 }, { x: 0, z: 86 }, { x: -62, z: 62 }];
  E.captures = [{ x: -78, z: 68, r: 8 }, { x: 72, z: -30, r: 8 }, { x: 0, z: -78, r: 8 }, { x: 36, z: 96, r: 8 }];
  E.gifts.push(...[[0, -30], [-20, 10], [20, 12], [0, 40], [-50, -6], [50, -6], [30, 52], [-30, 56], [-82, -56], [-82, 56], [84, -20], [60, 44], [0, 80], [-40, -80], [40, -80], [96, 36]].map(p => ({ x: p[0], z: p[1] })));
  E.spawn = [[-10, 20], [10, 20], [-28, 26], [28, 18], [-8, -30], [12, -30], [34, 2], [-44, -4]].map(p => ({ x: p[0], z: p[1], yaw: Math.atan2(-p[0], -p[1]) }));
  return this.finish(E);
};
