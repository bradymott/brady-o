/* ============================================================
   BRADY-O BURNS — World 14: flight, freefall and canopy
   BW14_Fly is plugged in as the player's "vehicle" (the engine hands
   the whole player update to vehicle.ride(p, dt)), so Brady really
   flies: an arcade plane (stick = pitch + bank-to-turn, throttle),
   then freefall (stick = steer/track, PULL), then a ram-air canopy
   (left/right toggles turn, both = brake/flare). It also owns the
   flight camera, rings, thermals, drones, dust devils, fireworks
   and the landing scoring. Mission logic lives in the world file
   (BW14_W); this file calls BW14_W.event(g, name, data).
   ============================================================ */

const BW14_PH = {
  // plane (m/s, rad)
  THRUST: 14, DRAG: 0.0097, VROT: 21, VSTALL: 17, VMAX: 62, PITCH_MAX: 0.46, BANK_MAX: 0.95, TURN_K: 1.7,
  CEIL: 540, RWY_DRAG: 0.45,
  // freefall
  FALL_V: 20, TRACK_V: 15,
  // canopy
  CAN_V: 9.6, CAN_SINK: 4.5
};

class BW14_Fly {
  constructor(g, S) {
    this.g = g; this.S = S; this.kind = 'bw14'; this.mode = 'idle'; this.active = false; this.allowExit = false;
    this.t = 0; this.modeT = 0;
    // plane state
    this.pl = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, bank: 0, V: 0, thr: 0, ground: true, prop: 0, ail: 0, elev: 0, rud: 0, vy: 0, inv: 0, bump: 0, wob: 0 };
    // diver / canopy state
    this.dv = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, yaw: 0, L: 0, R: 0, vf: 0, roll: 0, pitch: 0, open: 0, stallT: 0, brakeK: 0, flareMax: 0, minAGLbrake: 99 };
    this.cam = { yaw: 0, x: 0, y: 0, z: 0, init: false, shake: 0, look: 0 };
    this.rings = []; this.frings = []; this.thermalRings = []; this.drones = []; this.devils = []; this.fireworks = [];
    this.radioQ = []; this.radio = null;
    this.gust = { x: 0, z: 0, t: 0, next: 4 };
    this.stats = { ringsThisFlight: 0, bonks: 0 };
  }
  get yaw() { return this.mode === 'plane' || this.mode === 'parked' ? this.pl.yaw : this.dv.yaw; }

  /* ---------------- vehicle interface ---------------- */
  dismount(p, crash) {
    // only lets go when the world asks (or the engine respawns a fainted Brady)
    if (!this.allowExit && !p.dead) return;
    this.release(p);
  }
  release(p) {
    p = p || this.g.player;
    if (p.vehicle === this) p.vehicle = null;
    p.ch.poseFn = null; p.animOverride = null; this.active = false;
    this.g.camYaw = p.yaw; this.g.snapCam = true;
  }
  attach(p) { p = p || this.g.player; p.vehicle = this; this.active = true; p.pound = 0; p.spinT = 0; p.vx = p.vy = p.vz = 0; this.cam.init = false; }
  setMode(m) { this.mode = m; this.modeT = 0; }

  /* ---------------- input ---------------- */
  input(p) {
    const g = this.g, cy = g.camYaw, fx = Math.sin(cy), fz = Math.cos(cy), rx = -Math.cos(cy), rz = Math.sin(cy);
    const locked = p.locked || !!g.cine || g.dialog.open;
    let sy = p.inp.mx * fx + p.inp.mz * fz, sx = p.inp.mx * rx + p.inp.mz * rz;
    if (locked) { sx = 0; sy = 0; }
    const H = Input.hudHeld || {}, HP = this.S.hudP || {};
    return { sx, sy, locked, jump: !locked && !!Input.jump, act: !locked && !!Input.action, jumpP: !locked && !!p.inp.jumpPressed, actP: !locked && !!p.inp.actionPressed, H, HP };
  }
  // touch throttle lever: the finger's height on the lever sets the throttle
  leverThrottle() {
    const L = BW14_HUD.lay && BW14_HUD.lay.thr; if (!L) return null;
    for (const t of Input.touches.values()) if (t.role === 'hud:bw14thr') return clamp((L.y1 - t.y) / (L.y1 - L.y0), 0, 1);
    return null;
  }

  /* ---------------- per-step ---------------- */
  ride(p, dt) {
    this.t += dt; this.modeT += dt;
    const I = this.input(p);
    switch (this.mode) {
      case 'parked': this.stepParked(p, dt); break;
      case 'plane': this.stepPlane(p, dt, I); break;
      case 'exit': this.stepPlaneAuto(dt); this.stepExit(p, dt); break;
      case 'free': this.stepPlaneAuto(dt); this.stepFree(p, dt, I); break;
      case 'deploy': this.stepPlaneAuto(dt); this.stepDeploy(p, dt, I); break;
      case 'canopy': this.stepPlaneAuto(dt); this.stepCanopy(p, dt, I); break;
      case 'landed': this.stepLanded(p, dt, I); break;
      default: break;
    }
    this.stepRadio(dt);
  }
  // world update hook (runs every step, also while not riding): drones, devils, fireworks, ring spin
  worldStep(g, dt) {
    const t = g.time;
    for (const d of this.drones) {
      if (d.hit > 0) { d.hit -= dt; d.vy -= 9 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.z += d.vz * dt; d.mv.roll += dt * 9; if (d.hit <= 0 || d.y < 1) { d.hit = 0; d.y = d.y0; d.mv.roll = 0; } }
      else { const a = t * d.sp + d.ph; d.x = d.cx + Math.sin(a) * d.rx; d.z = d.cz + Math.cos(a * 0.7) * d.rz; d.y = d.y0 + Math.sin(a * 1.7) * 3; d.mv.yaw = a; }
      d.mv.x = d.x; d.mv.y = d.y; d.mv.z = d.z;
    }
    for (const dd of this.devils) { const a = t * dd.sp + dd.ph; dd.x = dd.cx + Math.sin(a) * dd.rx; dd.z = dd.cz + Math.cos(a * 0.8) * dd.rz; }
    // gate rings + updrafts belong to the plane: hidden while Brady falls or floats (no mix-ups with formation rings)
    const planeRings = !this.active || this.mode === 'plane' || this.mode === 'parked' || this.mode === 'idle';
    for (const r of this.rings) if (r.mv) { r.mv.visible = planeRings && !r.done; if (!r.done) r.mv.scale = r.r * (1 + Math.sin(t * 3 + r.i) * 0.03); }
    for (const r of this.thermalRings) if (r.mv) { r.mv.visible = planeRings; r.mv.yaw = t * 0.6 + r.i; r.cool = Math.max(0, (r.cool || 0) - dt); }
    for (const r of this.frings) if (r.mv && !r.done) r.mv.yaw = t * 0.8 + r.i;
    if (this.active && (this.mode === 'plane' || this.mode === 'free' || this.mode === 'canopy')) this.stepFireworks(g, dt);
  }

  /* ---------------- plane ---------------- */
  placePlane(x, z, yaw, y) { const P = this.pl; P.x = x; P.z = z; P.yaw = yaw; P.y = y === undefined ? this.g.world.height(x, z) + BW14_PLANE.GEAR_H : y; P.pitch = 0; P.bank = 0; P.V = 0; P.thr = 0; P.ground = y === undefined; P.vy = 0; }
  posePlane(dt) {
    const P = this.pl, M = this.planeP; if (!M) return;
    P.prop += dt * (P.ground && P.thr < 0.02 && P.V < 0.5 ? (this.mode === 'parked' ? 0 : 4) : 14 + P.thr * 52);
    M.set(0, P.x, P.y, P.z, P.yaw, -P.pitch, P.bank);
    const H = BW14_PLANE;
    M.child(1, 0, H.PROP[0], H.PROP[1], H.PROP[2], 0, 0, P.prop);
    M.child(2, 0, H.AIL[0], H.AIL[1], H.AIL[2], 0, -0.45 * P.ail, 0);
    M.child(3, 0, -H.AIL[0], H.AIL[1], H.AIL[2], 0, 0.45 * P.ail, 0);
    M.child(4, 0, H.ELEV[0], H.ELEV[1], H.ELEV[2], 0, 0.5 * P.elev, 0);
    M.child(5, 0, H.RUD[0], H.RUD[1], H.RUD[2], 0.35 * P.rud, 0, 0);
  }
  // cockpit seat (left seat) in world space
  seat(out) { const P = this.pl; const v = bw14Rot(P.yaw, -P.pitch, P.bank, 0.28, -0.82, 0.55, out || [0, 0, 0]); v[0] += P.x; v[1] += P.y; v[2] += P.z; return v; }
  seatBrady(p) {
    const P = this.pl, s = this.seat(); p.x = s[0]; p.y = s[1]; p.z = s[2]; p.yaw = P.yaw; p.vx = p.vy = p.vz = 0; p.grounded = false;
    const k = { steer: clamp(P.ail, -1, 1), happy: P.V > 25 };
    // pivot at the seat so Brady rides rigidly with the cabin (same rotation order as the plane)
    p.ch.poseFn = (Pz, t) => { BURNS_ANIMS.bw14Pilot(Pz, t, k); Pz.pitch = -P.pitch; Pz.roll = P.bank; Pz.pivot = 0; };
  }
  stepParked(p, dt) { this.posePlane(dt); }
  stepPlane(p, dt, I) {
    const g = this.g, P = this.pl, PH = BW14_PH, W = g.world;
    const inv = !!bw14Flag('invert');
    // controls
    const pitchIn = clamp(inv ? I.sy : -I.sy, -1, 1), bankIn = clamp(I.sx, -1, 1);
    const lever = this.leverThrottle();
    if (lever !== null) P.thr = lever;
    else { if (I.jump) P.thr = Math.min(1, P.thr + 0.55 * dt); if (I.act) P.thr = Math.max(0, P.thr - 0.55 * dt); }
    if (I.locked) { /* autopilot hold during dialogue/cutscenes */ }
    P.ail = BurnsM.damp(P.ail, bankIn, 8, dt); P.elev = BurnsM.damp(P.elev, pitchIn, 8, dt); P.rud = BurnsM.damp(P.rud, bankIn * 0.6, 6, dt);
    if (P.inv > 0) P.inv -= dt;
    const gy = W.height(P.x, P.z) + BW14_PLANE.GEAR_H;
    if (P.ground) {
      // ---- taxi / takeoff roll
      const onRwy = this.onRunway(P.x, P.z);
      P.yaw -= bankIn * 0.6 * Math.min(1, P.V / 7) * dt;
      P.bank = BurnsM.damp(P.bank, 0, 8, dt);
      const rot = P.V > PH.VROT * 0.7 && pitchIn > 0.2 ? 0.17 * pitchIn : 0;
      P.pitch = BurnsM.damp(P.pitch, rot, 3, dt);
      // the strip is smoother, but the flat playa is a runway too (so a gentle playa landing can take off again)
      let a = P.thr * 6.5 - PH.DRAG * P.V * P.V - (onRwy ? PH.RWY_DRAG : 0.85) - (P.thr < 0.05 ? 2.2 : 0);
      P.V = Math.max(0, P.V + a * dt);
      P.x += Math.sin(P.yaw) * P.V * dt; P.z += Math.cos(P.yaw) * P.V * dt;
      P.y = gy + (onRwy ? 0 : Math.sin(this.t * 23) * 0.03 * Math.min(1, P.V / 10));
      if ((P.V > PH.VROT && P.pitch > 0.06) || P.V > PH.VROT + 9) { P.ground = false; P.vy = 0; BW14_W.event(g, 'liftoff', { onRwy, x: P.x, z: P.z }); burnsSfx('jump3d', { pitch: 0.6, vol: 0.5 }); }
      if (P.V > 6 && Math.random() < dt * 14) g.fx.dust(P.x - Math.sin(P.yaw) * 1.5, W.height(P.x, P.z) + 0.1, P.z - Math.cos(P.yaw) * 1.5, 2, '#e0c8a0');
      if (P.V > 3 && pitchIn < -0.5 && !inv && P.V > PH.VROT) this.hint('pull', 'Pull BACK to lift off! (Or tap ⇅ to flip the stick.)');
    } else {
      // ---- flight
      const bankT = bankIn * PH.BANK_MAX;
      P.bank += clamp(bankT - P.bank, -2.4 * dt, 2.4 * dt);
      let pitchT = pitchIn * PH.PITCH_MAX;
      const stall = P.V < PH.VSTALL;
      if (stall) { pitchT = Math.min(pitchT, -0.32); if (!this.stallWarn) { this.stallWarn = true; BW14_HUD.flash(g, 'STALL! THROTTLE UP!', 1.4); this.say('Too slow! Nose down, throttle UP!', 'stall'); } } else this.stallWarn = false;
      if (P.y > PH.CEIL) pitchT = Math.min(pitchT, -0.1);
      P.pitch += clamp(pitchT - P.pitch, -1.25 * dt, 1.25 * dt);
      const yr = clamp(-9.8 * Math.tan(P.bank) / Math.max(P.V, 12) * PH.TURN_K, -0.95, 0.95);
      P.yaw += yr * dt;
      // stay over the playa: past the trash fence Dusty steers you home
      const dc = Math.hypot(P.x, P.z);
      if (dc > 540) { const home = Math.atan2(-P.x, -P.z); P.yaw = BurnsM.dampAngle(P.yaw, home, 0.9, dt); if (dc > 560) this.say('That\'s Gerlach! Turning us back, champ.', 'fence'); }
      let a = P.thr * PH.THRUST - PH.DRAG * P.V * P.V - 9.8 * Math.sin(P.pitch);
      P.V = clamp(P.V + a * dt, 9, PH.VMAX);
      let vx = Math.sin(P.yaw) * Math.cos(P.pitch) * P.V, vy = Math.sin(P.pitch) * P.V, vz = Math.cos(P.yaw) * Math.cos(P.pitch) * P.V;
      if (stall) vy -= (PH.VSTALL - P.V) * 1.1;
      // thermal columns over hot art lift you
      const th = this.thermalAt(P.x, P.y, P.z);
      if (P.boostT > 0) { P.boostT -= dt; P.vy = Math.max(P.vy, 14); if (Math.random() < dt * 30) g.fx.add(P.x + (Math.random() - 0.5) * 6, P.y - 2, P.z + (Math.random() - 0.5) * 6, 0, -6, 0, 0.6, 0.6, 0.1, [1, 0.85, 0.3], 1, 'spark', 1); }
      else if (th > 0) { P.vy = BurnsM.damp(P.vy, th * 1.2, 2, dt); } else P.vy = BurnsM.damp(P.vy, 0, 1.5, dt);
      vy += P.vy;
      // dust devils shove and spin
      for (const d of this.devils) { const dx = P.x - d.x, dz = P.z - d.z, dd = Math.hypot(dx, dz); if (dd < d.r && P.y < d.h) { const k = 1 - dd / d.r; P.bank += (Math.random() - 0.5) * 6 * k * dt + 1.4 * k * dt; P.yaw += 0.9 * k * dt; vx += -dz / (dd || 1) * 9 * k; vz += dx / (dd || 1) * 9 * k; vy += 3 * k; g.shake(0.12 * k); if (!d.warned) { d.warned = true; this.say('DUST DEVIL! Hold on to your bun!', 'devil' + d.i); burnsSfx('wind', { vol: 0.6 }, 'dust'); BW14_W.event(g, 'devil', d); } } else if (dd > d.r * 2) d.warned = false; }
      P.x += vx * dt; P.y += vy * dt; P.z += vz * dt;
      // the ground: a gentle touch anywhere on the playa is a landing, a hard one bounces (never a crash)
      if (P.y < gy) {
        const soft = vy > -4.5 && Math.abs(P.bank) < 0.35 && P.V < 34 && P.pitch > -0.12;
        if (soft) { P.y = gy; P.ground = true; P.pitch = 0; P.bank = 0; burnsSfx('land', { vol: 0.5 }); g.fx.dust(P.x, gy - BW14_PLANE.GEAR_H, P.z, 10); BW14_W.event(g, 'touchdown', { x: P.x, z: P.z }); }
        else { P.y = gy + 1.2; P.pitch = Math.max(P.pitch, 0.22); P.V *= 0.9; P.bank *= 0.4; P.vy = 3; this.bonk('ground'); }
      } else if (P.y < gy + 2.6 && Math.abs(P.bank) > 0.55) { P.bank *= 0.5; this.bonk('wingtip'); }
      this.obstacles(dt);
      this.checkRings(dt);
      this.checkThermalRings(dt);
      this.checkDrones();
      this.checkAirPickups(P.x, P.y, P.z, 9);
      if (P.wob > 0) { P.wob -= dt; P.bank += Math.sin(this.t * 30) * 0.8 * P.wob * dt * 4; }
      if (P.y - gy < 14 && vy < -3 && !P.ground) this.hint('low', 'PULL UP! We\'re a plane, not a dune buggy!');
    }
    this.posePlane(dt);
    this.seatBrady(p);
    BW14_W.event(g, 'planeStep', P);
    if (Sound.engine) Sound.engine(true, clamp(0.25 + P.thr * 0.75, 0.05, 1));
  }
  // after Brady jumps: Dusty takes the controls (wide gentle circle)
  stepPlaneAuto(dt) {
    const P = this.pl; if (!this.planeP || this.planeP.hidden) return;
    P.thr = 0.6; P.bank = BurnsM.damp(P.bank, 0.35, 1.5, dt); P.pitch = BurnsM.damp(P.pitch, 0.02, 1.5, dt);
    P.yaw += -9.8 * Math.tan(P.bank) / Math.max(P.V, 12) * dt; P.V = BurnsM.damp(P.V, 31, 0.5, dt);
    P.x += Math.sin(P.yaw) * P.V * dt; P.y += Math.sin(P.pitch) * P.V * dt; P.z += Math.cos(P.yaw) * P.V * dt;
    this.posePlane(dt);
  }
  onRunway(x, z) { const R = BW14_CFG.RWY; return Math.abs(x - R.x) < R.w / 2 + 2 && z < R.z0 + 10 && z > R.z1 - 10; }
  bonk(what, name) {
    const g = this.g, P = this.pl;
    if (P.inv > 0) return; P.inv = 1.1; P.wob = 0.8; this.stats.bonks++;
    g.shake(0.6); burnsSfx('bump', { vol: 0.9 }, 'stomp'); burnsSfx('hurt3d', { pitch: 1.4, vol: 0.4 });
    g.fx.burst(P.x, P.y, P.z, 'star', 14, '#ffe24a');
    const L = { ground: ['Whoa! That was the playa!', 'Pull UP! The ground is not a runway! ...Okay, it kind of is.'], wingtip: ['Wingtip! Level the wings near the ground!'], art: ['That\'s ART! You don\'t touch the art!', 'MOOP! We just MOOPed the art!', 'The artist felt that.'], man: ['We bonked the Man! He didn\'t notice. He\'s busy being in love.'], drone: ['Somebody\'s drone show just lost a pixel.', 'You owe that drone pilot an apology.'] };
    const list = L[what] || L.art; this.say(list[Math.floor(Math.random() * list.length)], 'bonk' + what);
    BW14_W.event(g, 'bonk', { what, name });
  }
  obstacles() {
    const P = this.pl, O = BW14_City.obstacles; if (!O) return;
    for (const o of O) {
      if (Math.abs(P.x - o.ax) > 80 || Math.abs(P.z - o.az) > 80) continue;
      const dx = o.bx - o.ax, dy = o.by - o.ay, dz = o.bz - o.az, L2 = dx * dx + dy * dy + dz * dz;
      const t = L2 > 0 ? clamp(((P.x - o.ax) * dx + (P.y - o.ay) * dy + (P.z - o.az) * dz) / L2, 0, 1) : 0;
      const qx = o.ax + dx * t, qy = o.ay + dy * t, qz = o.az + dz * t, ex = P.x - qx, ey = P.y - qy, ez = P.z - qz, d = Math.hypot(ex, ey, ez), R = o.r + 1.9;
      if (d < R) {
        const nx = ex / (d || 1), ny = ey / (d || 1), nz = ez / (d || 1);
        P.x = qx + nx * (R + 0.3); P.y = qy + ny * (R + 0.3); P.z = qz + nz * (R + 0.3);
        // reflect the heading off the surface
        const fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), hn = Math.hypot(nx, nz) || 1, hx = nx / hn, hz = nz / hn, dot = fx * hx + fz * hz;
        if (dot < 0) P.yaw = Math.atan2(fx - 2 * dot * hx, fz - 2 * dot * hz);
        P.V *= 0.75; P.pitch = Math.max(P.pitch, 0.12);
        this.bonk(o.name === 'the Man' || o.name === 'the pavilion' ? 'man' : 'art', o.name);
        break;
      }
    }
  }
  thermalAt(x, y, z) {
    let lift = 0;
    for (const t of BW14_City.thermals || []) { const d = Math.hypot(x - t.x, z - t.z); if (d < t.r && y < t.top) lift = Math.max(lift, t.lift * (1 - (d / t.r) * (d / t.r)) * clamp((t.top - y) / 40, 0, 1)); }
    return lift;
  }
  // gate rings (scenic route): pass when crossing the ring plane inside the hoop
  checkRings() {
    const P = this.pl, g = this.g;
    for (const r of this.rings) {
      if (r.done) continue;
      const ex = P.x - r.x, ey = P.y - r.y, ez = P.z - r.z;
      if (Math.abs(ex) > 120 || Math.abs(ez) > 120) { r.prev = null; continue; }
      const nx = Math.sin(r.yaw), nz = Math.cos(r.yaw), d = ex * nx + ez * nz;
      if (r.prev !== null && r.prev !== undefined && ((r.prev < 0 && d >= 0) || (r.prev > 0 && d <= 0))) {
        const lx = ex - nx * d, lz = ez - nz * d, lat = Math.hypot(lx, ey, lz);
        if (lat < r.r * 1.18) { r.done = true; this.stats.ringsThisFlight++; if (r.mv) r.mv.visible = false; g.fx.firework(r.x, r.y, r.z, r.col); g.fx.ring(r.x, r.y, r.z, r.r, r.col, 0.8); burnsSfx('token_get', { pitch: 1.3 + r.i * 0.03, vol: 0.6 }, 'gold'); g.addGlow(5); g.toast('RING ' + (r.i + 1) + '! +5 GLOW STICKS'); BW14_W.event(g, 'ring', r); }
      }
      r.prev = d;
    }
  }
  nextRing() {
    let last = -1; for (const r of this.rings) if (r.done) last = Math.max(last, r.i);
    let best = null; for (const r of this.rings) if (!r.done && r.i > last) { best = r; break; }
    if (!best) for (const r of this.rings) if (!r.done) { best = r; break; }
    return best;
  }
  checkThermalRings() {
    const P = this.pl, g = this.g;
    for (const r of this.thermalRings) {
      if (r.cool > 0) continue;
      const d = Math.hypot(P.x - r.x, P.z - r.z);
      if (d < r.r && Math.abs(P.y - r.y) < 8) { r.cool = 6; P.boostT = 2.6; g.fx.ring(r.x, r.y, r.z, r.r, '#ffd84a', 0.9); g.fx.burst(P.x, P.y, P.z, 'spark', 16, '#ffd84a'); burnsSfx('spring', { vol: 0.5 }, 'jumpBig'); g.toast('UPDRAFT! ⬆'); BW14_W.event(g, 'updraft', r); }
    }
  }
  checkDrones() {
    const P = this.pl;
    for (const d of this.drones) { if (d.hit > 0) continue; const dist = Math.hypot(P.x - d.x, P.y - d.y, P.z - d.z); if (dist < 3.6) { d.hit = 2.2; d.vx = Math.sin(P.yaw) * 14; d.vz = Math.cos(P.yaw) * 14; d.vy = 6; this.bonk('drone'); this.g.fx.burst(d.x, d.y, d.z, 'spark', 18, '#38f2ff'); } }
  }
  // engine pickups flagged bw14air (photos + glow sticks in the sky): bigger grab radius in the air
  checkAirPickups(x, y, z, rad) {
    const g = this.g;
    for (const P of g.pickups.items) {
      if (P.taken || !P.bw14air) continue;
      if (P.gate && g.missions.state(P.mission) !== 'active') continue;
      const dx = x - P.x, dy = y - P.y0, dz = z - P.z;
      if (dx * dx + dz * dz < rad * rad && Math.abs(dy) < rad) { P.taken = true; P.obj.visible = false; g.onPickup(P); }
    }
  }
  /* ---------------- fireworks near the Man (dodge them) ---------------- */
  stepFireworks(g, dt) {
    const S = this.S, px = this.mode === 'plane' ? this.pl.x : this.dv.x, py = this.mode === 'plane' ? this.pl.y : this.dv.y, pz = this.mode === 'plane' ? this.pl.z : this.dv.z;
    const dMan = Math.hypot(px, pz);
    this.fwT = (this.fwT || 2) - dt;
    if (this.mode === 'plane' && dMan < 260 && py < 260 && this.fwT <= 0 && this.fireworks.length < 4) {
      this.fwT = 1.6 + Math.random() * 1.8;
      const ahead = this.pl.V * 2.2, tx = px + Math.sin(this.pl.yaw) * ahead + (Math.random() - 0.5) * 30, tz = pz + Math.cos(this.pl.yaw) * ahead + (Math.random() - 0.5) * 30;
      const a = Math.random() * TAU, r = 20 + Math.random() * 10;
      this.fireworks.push({ x: Math.sin(a) * r, y: 1, z: Math.cos(a) * r, tx, ty: clamp(py + (Math.random() - 0.5) * 16, 30, 250), tz, t: 0, dur: 1.9, col: BURNS_NEON[Math.floor(Math.random() * 7)] });
      burnsSfx('firework_launch', { vol: 0.4 });
    }
    for (const f of this.fireworks) {
      f.t += dt; const k = Math.min(1, f.t / f.dur), x = lerp(f.x, f.tx, k), y = lerp(f.y, f.ty, Math.sin(k * Math.PI / 2)), z = lerp(f.z, f.tz, k);
      f.cx = x; f.cy = y; f.cz = z;
      g.fx.trail(x, y, z, f.col);
      if (k >= 1 && !f.done) {
        f.done = true; g.fx.firework(x, y, z, f.col); g.fx.flashAt(x, y, z); burnsSfx('firework_burst', { vol: 0.7 }); g.pointLight(x, y, z, 30, burnsRGBf(f.col), 2);
        const d = Math.hypot(px - x, py - y, pz - z);
        if (d < 14 && this.mode === 'plane') { const P = this.pl; P.wob = 1; P.bank += (Math.random() - 0.5) * 0.8; P.vy += (py - y) / (d || 1) * 6; g.shake(0.5); this.say(['Stray firework! Somebody\'s camp is celebrating early.', 'Incoming sparkles! Bank away from the rockets!'][Math.floor(Math.random() * 2)], 'fw'); BW14_W.event(g, 'firework', f); }
      }
    }
    this.fireworks = this.fireworks.filter(f => !f.done);
  }

  /* ---------------- the jump ---------------- */
  // Brady on the step, holding the strut (exit cutscene drives modeT)
  stepExit(p, dt) {
    const P = this.pl, s = bw14Rot(P.yaw, -P.pitch, P.bank, BW14_PLANE.STEP[0] - 0.15, BW14_PLANE.STEP[1] + 0.05, BW14_PLANE.STEP[2]);
    p.x = P.x + s[0]; p.y = P.y + s[1]; p.z = P.z + s[2]; p.yaw = P.yaw - 0.4;
    p.ch.poseFn = null; p.ch.play('bw14Climb');
    if (this.modeT > 0.5 && Math.random() < dt * 30) this.g.fx.add(p.x, p.y + 1, p.z, -Math.sin(P.yaw) * 20, 0, -Math.cos(P.yaw) * 20, 0.25, 0.1, 0.5, [1, 1, 1], 0.4, 'streak', 16);
  }
  // let go: freefall begins with the plane's momentum
  letGo(p) {
    p = p || this.g.player;
    const P = this.pl, D = this.dv;
    D.x = p.x; D.y = p.y; D.z = p.z; D.yaw = P.yaw - 0.6; D.vx = Math.sin(P.yaw) * P.V * 0.8; D.vz = Math.cos(P.yaw) * P.V * 0.8; D.vy = -1;
    D.L = D.R = 0; D.open = 0; this.collected = this.collected || 0;
    this.setMode('free'); this.freeT = 0; this.pulled = false; this.engOff = false;
    burnsSfx('wind', { vol: 0.8 }, 'dust'); burnsSfx('yell', { pitch: 1.2, vol: 0.5 });
    BW14_W.event(this.g, 'letgo', D);
  }
  stepFree(p, dt, I) {
    const g = this.g, D = this.dv, C = BW14_CFG, PH = BW14_PH;
    this.freeT += dt;
    if (!this.engOff && Sound.engine) { if (this.freeT > 1.4) { this.engOff = true; Sound.engine(false, 0); } else Sound.engine(true, 0.4 - this.freeT * 0.25); }
    // steer: left/right turn, up = track forward (faster, steeper), down = backslide (slower fall)
    D.yaw -= I.sx * 2.3 * dt;
    const fwdT = I.sy > 0 ? I.sy * PH.TRACK_V : I.sy * 4;
    const fx = Math.sin(D.yaw), fz = Math.cos(D.yaw), rx = -Math.cos(D.yaw), rz = Math.sin(D.yaw), side = I.sx * 5;   // turning also side-slides a little
    const wx = C.WIND.x + this.gust.x, wz = C.WIND.z + this.gust.z;
    D.vx = BurnsM.damp(D.vx, fx * fwdT + rx * side + wx, 2.1, dt); D.vz = BurnsM.damp(D.vz, fz * fwdT + rz * side + wz, 2.1, dt);
    const vT = PH.FALL_V + Math.max(0, I.sy) * 5 - Math.max(0, -I.sy) * 4;
    D.vy = BurnsM.damp(D.vy, -vT, 0.85, dt);
    D.x += D.vx * dt; D.y += D.vy * dt; D.z += D.vz * dt;
    // formation rings + air pickups
    this.checkFreeRings();
    this.checkAirPickups(D.x, D.y + 0.9, D.z, 3.0);
    const gy = g.world.surface(D.x, D.z, D.y + 1, 0.3, BURNS_SURF).y, agl = D.y - gy;
    this.agl = agl;
    // pull!
    const pull = I.actP || I.jumpP || !!(I.HP && I.HP.bw14pull);
    if (pull && this.freeT > 0.8) this.pull(agl);
    else if (agl < C.HARD_DECK) { this.pull(agl, true); }
    // Brady: belly to earth, head toward travel
    p.x = D.x; p.y = D.y; p.z = D.z; p.yaw = D.yaw; p.vx = D.vx; p.vy = D.vy; p.vz = D.vz; p.grounded = false;
    const k = { track: clamp(I.sy, 0, 1), turn: clamp(I.sx, -1, 1) };
    p.ch.poseFn = (Pz, t) => BURNS_ANIMS.bw14Free(Pz, t, k);
    if (Math.random() < dt * 40) g.fx.add(D.x + (Math.random() - 0.5) * 3, D.y - 3 - Math.random() * 6, D.z + (Math.random() - 0.5) * 3, 0, 16 + Math.random() * 8, 0, 0.5, 0.06, 0.03, [1, 1, 1], 0.5, 'streak', 16);
    if (Math.floor(this.freeT * 2) !== Math.floor((this.freeT - dt) * 2) && agl < C.PULL_HI + 30 && agl > C.PULL_LO - 10) burnsSfx('dialogue_blip', { pitch: 2, vol: 0.4 });   // altimeter beeps near the window
    if (Math.floor(this.freeT / 1.7) !== Math.floor((this.freeT - dt) / 1.7)) burnsSfx('wind', { vol: 0.3, pitch: 0.8 + Math.random() * 0.4 }, 'dust');
  }
  checkFreeRings() {
    const D = this.dv, g = this.g;
    for (const r of this.frings) {
      if (r.done) continue;
      const d = D.y - r.y;
      if (r.prev !== undefined && r.prev > 0 && d <= 0 && Math.hypot(D.x - r.x, D.z - r.z) < r.r * 1.15) {
        r.done = true; if (r.mv) r.mv.visible = false; g.fx.ring(r.x, r.y, r.z, r.r, r.col, 0.9); g.fx.burst(r.x, r.y, r.z, 'star', 20, r.col); g.addGlow(3);
        burnsSfx('token_get', { pitch: 1.4 + r.i * 0.05, vol: 0.6 }, 'gold'); BW14_W.event(g, 'fring', r);
      }
      r.prev = d;
    }
  }
  pull(agl, auto) {
    const g = this.g, C = BW14_CFG;
    if (this.pulled) return; this.pulled = true; this.windHint = false; this.flareHint = false;
    let q = agl > C.PULL_HI ? 'early' : agl >= C.PULL_LO ? 'perfect' : agl >= C.PULL_DEAD ? 'late' : 'dead';
    if (auto) q = 'dead';
    this.pullQ = q; this.pullAlt = agl;
    this.setMode('deploy'); this.deployT = 0;
    const cp = this.canP; if (cp) cp.hidden = false;
    burnsSfx('flame_jet', { pitch: 1.8, vol: 0.5 });
    BW14_W.event(g, 'pull', { q, agl, auto });
  }
  stepDeploy(p, dt, I) {
    const g = this.g, D = this.dv, C = BW14_CFG;
    this.deployT += dt;
    const dead = this.pullQ === 'dead', dur = dead ? 3.2 : 1.1, k = clamp(this.deployT / dur, 0, 1);
    D.open = easeOut(k);
    D.vy = BurnsM.damp(D.vy, dead ? -16 : -5, dead ? 0.2 : 3.2 * k + 0.2, dt);
    D.vx = BurnsM.damp(D.vx, C.WIND.x, 2, dt); D.vz = BurnsM.damp(D.vz, C.WIND.z, 2, dt);
    D.x += D.vx * dt; D.y += D.vy * dt; D.z += D.vz * dt;
    if (k > 0.35 && !this.snapped && !dead) { this.snapped = true; g.shake(0.45); burnsSfx('land', { pitch: 0.6, vol: 0.9 }); g.fx.burst(D.x, D.y + 6, D.z, 'star', 16, '#ffffff'); }
    p.x = D.x; p.y = D.y; p.z = D.z; p.yaw = D.yaw; p.grounded = false;
    p.ch.poseFn = (Pz, t) => BURNS_ANIMS.bw14Hang(Pz, t, { l: 0.3, r: 0.3 });
    this.poseCanopy(dt);
    const gy = g.world.surface(D.x, D.z, D.y + 1, 0.3, BURNS_SURF); this.agl = D.y - gy.y;
    if (D.y <= gy.y + 0.02) { D.y = gy.y; this.touchdown(p, gy.col, true); return; }
    if (k >= 1 && !dead) { this.setMode('canopy'); D.vf = 4; D.flareAt = undefined; D.flareMax = 0; this.snapped = false; BW14_W.event(g, 'open', D); }
  }
  // the canopy system: centre of the canopy hangs 6.4 m over Brady's feet
  poseCanopy(dt) {
    const D = this.dv, M = this.canP; if (!M) return;
    const o = Math.max(0.12, D.open), up = bw14Rot(D.yaw, D.pitch, D.roll, 0, 6.4 * o, 0);
    M.set(0, D.x + up[0], D.y + up[1] + 0.3, D.z + up[2], D.yaw, D.pitch, D.roll, 1);
    // squash while opening: re-scale the base bone (span grows first)
    if (o < 1) { const B = M.ch.bones; for (let k = 0; k < 3; k++) { B[k] *= lerp(0.2, 1, o); B[4 + k] *= lerp(0.5, 1, o); B[8 + k] *= lerp(0.3, 1, o); } }
    for (const sd of [1, -1]) { const h = BW14_Model.canopyFlapHinge(sd), pulled = sd > 0 ? D.L : D.R; M.child(sd > 0 ? 1 : 2, 0, h[0], h[1], h[2], 0, -0.9 * pulled, 0); }
  }
  stepCanopy(p, dt, I) {
    const g = this.g, D = this.dv, C = BW14_CFG, PH = BW14_PH;
    // toggles: touch handles, keys/stick (left/right = that toggle, down/JUMP = both)
    const H = I.H || {};
    let Lt = 0, Rt = 0;
    if (H.bw14L) Lt = 1; if (H.bw14R) Rt = 1;
    if (I.sx < -0.15) Lt = Math.max(Lt, -I.sx); if (I.sx > 0.15) Rt = Math.max(Rt, I.sx);
    if (I.sy < -0.3) { const b = Math.min(1, -I.sy); Lt = Math.max(Lt, b); Rt = Math.max(Rt, b); }
    if (I.jump) { Lt = 1; Rt = 1; }
    D.L = BurnsM.damp(D.L, Lt, 7, dt); D.R = BurnsM.damp(D.R, Rt, 7, dt);
    const brake = Math.min(D.L, D.R), turn = D.L - D.R;
    // heading
    D.yaw += turn * 1.25 * (1 - 0.35 * brake) * dt;
    // speed: brakes slow you; a quick flare trades speed for lift
    const vfT = PH.CAN_V * (1 - 0.66 * brake);
    const vfOld = D.vf; D.vf = BurnsM.damp(D.vf, vfT, 1.5, dt);
    const lost = Math.max(0, vfOld - D.vf);
    let vyT = -(PH.CAN_SINK * (1 - 0.6 * brake)) - Math.abs(turn) * 1.7;
    if (brake > 0.86) { D.stallT += dt; if (D.stallT > 2.6) { vyT = -7.5; if (!this.stallSaid) { this.stallSaid = true; BW14_HUD.flash(g, 'STALL! LET UP!', 1.2); } } } else { D.stallT = Math.max(0, D.stallT - dt * 2); this.stallSaid = false; }
    const th = this.thermalAt(D.x, D.y, D.z) * 0.35;
    D.vy = BurnsM.damp(D.vy, vyT + th, 1.3, dt) + lost * 1.05;
    D.vy = Math.min(D.vy, 2.5);
    // wind + gusts + dust shoves
    this.stepGusts(dt);
    // gusts ease off near the ground (wind gradient), so the final approach is fair
    const gk = clamp((this.agl === undefined ? 30 : this.agl) / 22, 0.3, 1), wx = C.WIND.x + this.gust.x * gk, wz = C.WIND.z + this.gust.z * gk;
    const fx = Math.sin(D.yaw), fz = Math.cos(D.yaw);
    D.vx = fx * D.vf + wx; D.vz = fz * D.vf + wz;
    D.x += D.vx * dt; D.y += D.vy * dt; D.z += D.vz * dt;
    // swing: bank into turns, swing forward on a flare
    D.roll = BurnsM.damp(D.roll, -turn * 0.38, 3, dt); D.pitch = BurnsM.damp(D.pitch, -brake * 0.22 + lost * 0.6, 4, dt);
    // collisions with tall stuff (the Man, art) push you off; tops of domes/RVs are landing spots
    const hit = bw14Probe(g, D.x, D.z, D.y);
    this.agl = D.y - hit.y;
    if (this.agl < 8 && brake > 0.5) { if (D.flareAt === undefined) D.flareAt = this.agl; D.flareMax = Math.max(D.flareMax, brake); }
    if (brake < 0.2) D.flareAt = undefined;
    this.checkAirPickups(D.x, D.y + 0.9, D.z, 3.2);
    p.x = D.x; p.y = D.y; p.z = D.z; p.yaw = D.yaw; p.vx = D.vx; p.vy = D.vy; p.vz = D.vz; p.grounded = false;
    const k = { l: D.L, r: D.R, roll: D.roll * 0.6 };
    p.ch.poseFn = (Pz, t) => BURNS_ANIMS.bw14Hang(Pz, t, k);
    this.poseCanopy(dt);
    if (this.agl < 6 && this.agl > 0.5 && !this.flareHint && brake < 0.3) { this.flareHint = true; BW14_HUD.flash(g, 'FLARE!', 0.9); }
    if (this.agl < 40 && !this.windHint) { this.windHint = true; this.say('Final approach: turn INTO the wind (face against the wind arrow) and flare at knee height!'); }
    if (D.y <= hit.y) { D.y = hit.y; this.touchdown(p, hit.col, false); }
    if (Math.random() < dt * 6) g.fx.add(D.x + (Math.random() - 0.5) * 8, D.y + 3 + Math.random() * 4, D.z + (Math.random() - 0.5) * 8, wx * 2, 0, wz * 2, 0.6, 0.05, 0.02, [1, 1, 1], 0.3, 'streak', 16);
  }
  stepGusts(dt) {
    const G = this.gust, g = this.g;
    G.next -= dt;
    if (G.next <= 0) { G.next = 4 + Math.random() * 5; const a = Math.random() * TAU, s = 2 + Math.random() * 3.5; G.tx = Math.sin(a) * s; G.tz = Math.cos(a) * s; G.t = 1.6 + Math.random(); if (this.mode === 'canopy') { g.toast('GUST!'); burnsSfx('wind', { vol: 0.5 }, 'dust'); const D = this.dv; for (let i = 0; i < 14; i++) g.fx.add(D.x - G.tx * 4 + (Math.random() - 0.5) * 10, D.y + (Math.random() - 0.5) * 6, D.z - G.tz * 4 + (Math.random() - 0.5) * 10, G.tx * 3, 0, G.tz * 3, 1.6, 2, 5, [0.92, 0.82, 0.68], 0.25, 'puff', 0); } }
    if (G.t > 0) { G.t -= dt; G.x = BurnsM.damp(G.x, G.tx || 0, 2, dt); G.z = BurnsM.damp(G.z, G.tz || 0, 2, dt); }
    else { G.x = BurnsM.damp(G.x, 0, 1, dt); G.z = BurnsM.damp(G.z, 0, 1, dt); }
  }
  /* ---------------- touchdown + scoring ---------------- */
  touchdown(p, col, hard) {
    const g = this.g, D = this.dv, C = BW14_CFG;
    const vDown = -D.vy, vh = Math.hypot(D.vx, D.vz);
    const dist = Math.hypot(D.x - C.LZ.x, D.z - C.LZ.z);
    const surf = col && col.y1 > 1.2 ? (col.bw14 || (col.t === 'dome' ? 'dome' : col.y1 > 3.1 && col.y1 < 3.6 ? 'rv' : col.y1 > 2.3 && col.y1 < 2.6 ? 'potty' : col.y1 > 2.8 && col.y1 < 3.1 ? 'shade' : 'roof')) : 'playa';
    let land = hard || this.pullQ === 'dead' ? 'hard' : vDown < 2.4 && vh < 7 ? 'soft' : vDown < 3.9 && vh < 9.5 ? 'ok' : 'rough';
    const perfectFlare = land === 'soft' && D.flareMax > 0.6 && D.flareAt !== undefined && D.flareAt < 5.5 && D.flareAt > 1.0;
    const res = { land, dist, surf, perfectFlare, vDown, vh, x: D.x, z: D.z, pullQ: this.pullQ, col: surf === 'dome' ? col : null };
    this.result = res;
    this.setMode('landed'); this.landT = 0; this._slid = false; this._stood = false;
    if (this.canP) { this.canDrop = { y: 0, t: 0 }; }
    p.x = D.x; p.y = D.y; p.z = D.z; p.yaw = D.yaw; p.vx = p.vy = p.vz = 0; p.grounded = true;
    const anim = land === 'hard' ? 'bw14Splat' : land === 'rough' ? 'bw14Tumble' : land === 'ok' ? 'run' : 'victory';
    p.ch.poseFn = null; p.ch.play(anim, null, true);
    g.shake(land === 'hard' ? 0.9 : land === 'rough' ? 0.5 : 0.2);
    g.fx.dust(D.x, D.y, D.z, land === 'soft' ? 6 : 16);
    burnsSfx(land === 'hard' ? 'groundpound' : 'land', { vol: 0.9 });
    BW14_W.event(g, 'landed', res);
  }
  stepLanded(p, dt) {
    const g = this.g, D = this.dv, r = this.result;
    this.landT += dt;
    // run-out / tumble slide
    if (r && r.surf !== 'dome' && (r.land === 'ok' || r.land === 'rough') && this.landT < (r.land === 'ok' ? 0.9 : 1.4)) {
      const k = r.land === 'ok' ? 4.5 : 6;
      D.x += Math.sin(D.yaw) * k * (1 - this.landT) * dt; D.z += Math.cos(D.yaw) * k * (1 - this.landT) * dt;
      const s = g.world.surface(D.x, D.z, D.y + 0.6, 0.3, BURNS_SURF); D.y = s.y;
    } else if (r && r.land === 'ok' && this.landT > 0.9 && !this._stood) { this._stood = true; p.ch.play('victory'); }
    if (r && r.land === 'rough' && r.surf !== 'dome' && this.landT > 1.4 && !this._stood) { this._stood = true; p.ch.play('hurt'); }
    // landed on a dome: tumble down its side to the playa
    if (r && r.col && r.surf === 'dome' && this.landT < 2.2) {
      const c = r.col, dx = D.x - c.x, dz = D.z - c.z, d = Math.hypot(dx, dz) || 0.01, ax = dx / d, az = dz / d;
      if (d < c.r + 0.6) { D.x += ax * 4.5 * dt; D.z += az * 4.5 * dt; const s2 = g.world.surface(D.x, D.z, D.y + 0.5, 0.25, BURNS_SURF); D.y = Math.max(s2.y, D.y - 9 * dt); p.ch.play('bw14Tumble'); D.yaw = Math.atan2(ax, az); }
      else if (!this._slid) { this._slid = true; D.y = g.world.surface(D.x, D.z, D.y + 0.5, 0.25, BURNS_SURF).y; p.ch.play('bw14Splat'); g.fx.dust(D.x, D.y, D.z, 10); burnsSfx('land'); }
    }
    p.x = D.x; p.y = D.y; p.z = D.z; p.yaw = D.yaw;
    // the canopy settles behind Brady
    const M = this.canP;
    if (M && !M.hidden) {
      const k = clamp(this.landT / 1.4, 0, 1), back = bw14Rot(D.yaw, 0, 0, 0, 0, -4 * k);
      M.set(0, D.x + back[0] + bw14Wind().x * k, lerp(D.y + 6.4, D.y + 0.25, k * k), D.z + back[2] + bw14Wind().z * k, D.yaw, lerp(D.pitch, -1.45, k), D.roll * (1 - k), 1);
      const B = M.ch.bones; for (let i = 4; i < 7; i++) B[i] *= lerp(1, 0.18, k);
      for (const sd of [1, -1]) { const h = BW14_Model.canopyFlapHinge(sd); M.child(sd > 0 ? 1 : 2, 0, h[0], h[1], h[2], 0, 0, 0); }
    }
    this.stepPlaneAuto(dt);
  }

  /* ---------------- camera ---------------- */
  camera(fdt) {
    const g = this.g, cam = g.cam, C = this.cam, portrait = Game.cssH > Game.cssW, asp = Game.cssW / Game.cssH;
    let px, py, pz, yaw, dist, hgt, ty, look;
    let lk = 0;
    // a right-side drag swings the view around; it springs back
    if (Input.camDX) { C.look = clamp((C.look || 0) - Input.camDX * 0.006, -2.6, 2.6); Input.camDX = 0; Input.camDY = 0; g.bw14.lookT = 1.2; }
    if ((g.bw14.lookT || 0) > 0) g.bw14.lookT -= fdt; else C.look = BurnsM.damp(C.look || 0, 0, 2.5, fdt);
    lk = C.look || 0;
    if (this.mode === 'plane' || this.mode === 'parked') {
      const P = this.pl; px = P.x; py = P.y; pz = P.z; yaw = P.yaw;
      const speedK = clamp(P.V / 35, 0, 1.3);
      // the higher you fly, the more the camera tips down so the city stays in view
      const hk = P.ground ? 0 : clamp((P.y - 70) / 260, 0, 1);
      dist = (P.ground ? 9.5 : 11.5) + speedK * 1.5 + (portrait ? 1.5 : 0) + hk * 3; hgt = P.ground ? 2.7 : 3.4 + (portrait ? 0.6 : 0) + hk * 7; ty = 1.2 + P.pitch * 4 - hk * 4;
      look = 7 + speedK * 4;
      C.yaw = C.init ? BurnsM.dampAngle(C.yaw, yaw + lk, P.ground ? 6 : 2.8, fdt) : yaw;
      cam.roll = BurnsM.damp(cam.roll || 0, P.ground ? 0 : -P.bank * 0.28, 4, fdt);
    } else if (this.mode === 'exit') {
      const P = this.pl; px = g.player.x; py = g.player.y; pz = g.player.z; yaw = P.yaw;
      dist = 7; hgt = 1.5; ty = 0.6; look = 3; C.yaw = C.init ? BurnsM.dampAngle(C.yaw, yaw + 0.9 + lk, 2, fdt) : yaw + 0.9; cam.roll = 0;
    } else if (this.mode === 'free') {
      const D = this.dv; px = D.x; py = D.y; pz = D.z; yaw = D.yaw;
      dist = 5.2 + (portrait ? 2.5 : 0); hgt = 3.8 + (portrait ? 1.5 : 0); ty = -5.5; look = 4;
      C.yaw = C.init ? BurnsM.dampAngle(C.yaw, yaw + lk, 2.6, fdt) : yaw; cam.roll = BurnsM.damp(cam.roll || 0, 0, 3, fdt);
    } else if (this.mode === 'deploy' || this.mode === 'canopy') {
      const D = this.dv, agl = this.agl === undefined ? 50 : this.agl, low = clamp((14 - agl) / 12, 0, 1);
      px = D.x; py = D.y; pz = D.z; yaw = D.yaw;
      // keep the canopy in frame (that's what you're flying) and blend to a ground-ahead view for the flare
      dist = lerp(this.mode === 'deploy' ? 13.5 : 12.5, 8, low) + (portrait ? 1.5 : 0); hgt = lerp(this.mode === 'deploy' ? 4.5 : 3.6, 1.4, low) + (portrait ? 0.5 : 0); ty = lerp(2.4, 0.9, low); look = lerp(4, 6, low);
      C.yaw = C.init ? BurnsM.dampAngle(C.yaw, yaw + lk, 2.2, fdt) : yaw; cam.roll = BurnsM.damp(cam.roll || 0, D.roll * 0.4, 3, fdt);
    } else {
      // landed: a slow orbit around Brady
      const D = this.dv; px = D.x; py = D.y; pz = D.z; yaw = D.yaw + Math.PI + 0.6 + this.landT * 0.12;
      dist = 6.5 + (portrait ? 2.5 : 0); hgt = 2.2; ty = 1.0; look = 0;
      C.yaw = C.init ? BurnsM.dampAngle(C.yaw, yaw + lk, 1.5, fdt) : yaw; cam.roll = BurnsM.damp(cam.roll || 0, 0, 3, fdt);
    }
    const fx = Math.sin(C.yaw), fz = Math.cos(C.yaw);
    const wx = px - fx * dist, wy = py + hgt, wz = pz - fz * dist;
    if (!C.init) { C.x = wx; C.y = wy; C.z = wz; C.init = true; }
    const kpos = this.mode === 'plane' ? 9 : 6;
    C.x = BurnsM.damp(C.x, wx, kpos, fdt); C.y = BurnsM.damp(C.y, wy, kpos, fdt); C.z = BurnsM.damp(C.z, wz, kpos, fdt);
    let x = C.x, y = C.y, z = C.z;
    const gy = g.world.height(x, z) + 0.6; if (y < gy) y = gy;
    if (g.shakeA > 0) { const s = g.shakeA * 0.5; x += (Math.random() - 0.5) * s; y += (Math.random() - 0.5) * s; z += (Math.random() - 0.5) * s; g.shakeA = Math.max(0, g.shakeA - fdt * 1.8); }
    cam.x = x; cam.y = y; cam.z = z;
    cam.tx = px + Math.sin(yaw) * look; cam.ty = py + ty; cam.tz = pz + Math.cos(yaw) * look;
    const hf = this.mode === 'free' ? 1.35 : this.mode === 'plane' ? 1.28 : 1.2;
    cam.fov = Math.max(this.mode === 'free' ? 1.05 : 0.95, 2 * Math.atan(Math.tan(hf / 2) / asp));
    if (this.mode === 'free') cam.fov += Math.sin(this.t * 1.3) * 0.015;
    cam.shift = portrait ? 0.06 : 0.02; cam.near = 0.2; cam.far = 1800;
  }

  /* ---------------- radio (Captain Dusty, non-blocking captions) ---------------- */
  say(text, key, who) {
    if (key) { this.saidT = this.saidT || {}; const t = this.saidT[key]; if (t !== undefined && this.t - t < 8) return; this.saidT[key] = this.t; }
    this.radioQ.push({ text, who: who || 'CAPT. DUSTY', t: 0, dur: Math.max(2.6, text.length * 0.055) });
    if (this.radioQ.length > 3) this.radioQ.splice(1, 1);
  }
  hint(key, text) { this.hints = this.hints || {}; if (this.hints[key] && this.t - this.hints[key] < 12) return; this.hints[key] = this.t; this.say(text); }
  stepRadio(dt) {
    if (!this.radio && this.radioQ.length) { this.radio = this.radioQ.shift(); burnsSfx('dialogue_blip', { pitch: 0.7, vol: 0.4 }); }
    if (this.radio) { this.radio.t += dt; if (this.radio.t > this.radio.dur) this.radio = null; }
  }
}
// the world's wind vector (helper used by the landed canopy)
function bw14Wind() { return BW14_CFG.WIND; }
// highest landing surface (walkable tops: domes, RVs, porta-potties, shade tops) under a point
function bw14Probe(g, x, z, y) { return g.world.surface(x, z, y + 0.6, 0.25, { y: 0, col: null }); }
