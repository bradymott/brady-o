/* ============================================================
   BRADY GOES TO BURNING MAN — World 11: the Thunderdome bungee bout (BW11Dome)
   Two fighters hang from bungee cords tied to the dome's apex, each with a
   foam bat. Bounce off the floor, kick off the lattice, swing on the cord;
   a connecting swing knocks the other fighter flying (harder the faster you
   were moving into them). First to three bonks wins.
   Controls: stick = lean / run, JUMP = kick off the floor or a wall (in the
   air it tugs you up the cord), ACTION = swing the bat.
   Started from the world (BW11Dome.start); the world's update/drawSprites/
   drawSkinned call into it. Brady's own controller is swapped out on the
   instance for the bout and restored after.
   ============================================================ */

const BW11Dome = {
  active: false,
  G: 21, K: 15, KD: 2.2, L0: 8.7,
  start(g, o) {
    const D = this, p = g.player;
    if (D.active) return;
    D.g = g; D.o = o || {};
    const C = D.C = { x: o.x, z: o.z, R: o.R || 12 };
    const anchorY = C.R - 0.5;
    const mk = (who, sx, a) => ({ who, a, x: C.x + sx, y: 0, z: C.z + 1.5, vx: 0, vy: 0, vz: 0, yaw: sx < 0 ? Math.PI / 2 : -Math.PI / 2, ax: C.x + sx * 0.12, ay: anchorY, az: C.z, swing: 'idle', st: 0, cd: 0, inv: 0, tumble: 0, kickCd: 0, bonks: 0, hitDone: false, react: 0.8, dodged: false });
    D.f = [mk('brady', -3.2, null), mk('champ', 3.2, o.champ)];
    D.t = 0; D.slow = 0; D.msg = null; D.over = false; D.intro = 1.9;
    D.active = true;
    // swap Brady's controller for the bout
    if (p.vehicle) p.vehicle.dismount(p);
    D.saved = { upd: Object.getOwnPropertyDescriptor(p, 'update'), bike: g.bike };
    g.bike = null; if (g.syncHudButtons) g.syncHudButtons();   // no BIKE button mid-bout
    p.update = function (dt) { BW11Dome.step(dt); };
    p.teleport(D.f[0].x, 0, D.f[0].z, D.f[0].yaw);
    const ch = o.champ;
    if (ch) { ch.setBehavior('bw11Bungee'); ch.x = D.f[1].x; ch.z = D.f[1].z; ch.y = 0; D.saved.noTalk = ch.def.noTalk; ch.def.noTalk = true; }   // ACTION swings the bat, never TALK
    const champF = D.f[1];
    g.boss = { name: o.name || 'THE DOME CHAMPION', maxHp: 3, active: true, get hp() { return Math.max(0, 3 - champF.bonks); }, get defeated() { return champF.bonks >= 3; }, head() { return [champF.x, champF.y + 2.3, champF.z]; }, update() {} };
    g.camYaw = Math.PI / 2; g.snapCam = true;
    D.say('3', '#ffffff', 0.6); burnsSfx('coinTally');
    BW11.after(g, 0.6, () => { D.say('2', '#ffffff', 0.6); burnsSfx('coinTally'); });
    BW11.after(g, 1.2, () => { D.say('1', '#ffffff', 0.6); burnsSfx('coinTally'); });
    BW11.after(g, 1.8, () => { D.say('BONK!', '#ff5a3a', 0.9); burnsSfx('greeter_bell'); burnsSfx('crowd_cheer', { vol: 0.6 }); });
  },
  say(text, col, dur, sub) { this.msg = { text, col: col || '#ffffff', t: 0, dur: dur || 1.2, sub: sub || '' }; },
  // per physics step (runs as Brady's update during the bout)
  step(dt) {
    const D = this, g = D.g, p = g.player; if (!D.active) return;
    D.t += dt; if (D.intro > 0) D.intro -= dt;
    if (D.msg) { D.msg.t += dt; if (D.msg.t > D.msg.dur) D.msg = null; }
    const sdt = D.slow > 0 ? dt * 0.35 : dt; D.slow = Math.max(0, D.slow - dt);
    const B = D.f[0], C = D.f[1], I = p.inp, ctl = D.intro <= 0 && !D.over && !g.cine && !g.dialog.open;
    const pc = { mx: ctl ? I.mx : 0, mz: ctl ? I.mz : 0, jump: ctl && I.jumpPressed, swing: ctl && I.actionPressed };
    const cc = ctl ? D.ai(C, B, sdt) : { mx: 0, mz: 0, jump: false, swing: false };
    D.fighter(B, C, pc, sdt); D.fighter(C, B, cc, sdt);
    // fighters bump each other
    const dx = C.x - B.x, dz = C.z - B.z, dy = C.y - B.y, d = Math.hypot(dx, dz);
    if (d < 0.9 && Math.abs(dy) < 1.6 && d > 1e-3) { const k = (0.9 - d) / 2 / d; B.x -= dx * k; B.z -= dz * k; C.x += dx * k; C.z += dz * k; }
    // Brady follows his fighter
    p.x = B.x; p.y = B.y; p.z = B.z; p.vx = B.vx; p.vy = B.vy; p.vz = B.vz; p.yaw = B.yaw; p.grounded = B.y < 0.05;
    D.anim(p.ch, B); if (C.a) { C.a.x = C.x; C.a.y = C.y; C.a.z = C.z; C.a.yaw = C.yaw; D.anim(C.a.ch, C); }
    // crowd chants
    if (Math.random() < dt * 0.6 && D.o.crowd && D.o.crowd.length) { const a = D.o.crowd[Math.floor(Math.random() * D.o.crowd.length)]; a.say(['BOUNCE! BONK!', 'BONK HIM!', 'SWING!', 'DOME! DOME! DOME!', 'Foam is pain!', 'HIT THE BUN!'][Math.floor(Math.random() * 6)], 1.2); }
    if (!D.over && (B.bonks >= 3 || C.bonks >= 3)) { D.over = true; const won = C.bonks >= 3; D.say(won ? 'YOU WIN!' : 'BONKED OUT!', won ? '#ffe24a' : '#ff5a3a', 2.4, won ? 'New dome champion!' : 'The dome has spoken.'); BW11.after(g, 2.0, () => D.end(won)); }
  },
  fighter(f, o, c, dt) {
    const D = this, Cc = D.C, g = D.g;
    f.cd = Math.max(0, f.cd - dt); f.inv = Math.max(0, f.inv - dt); f.tumble = Math.max(0, f.tumble - dt); f.kickCd = Math.max(0, f.kickCd - dt);
    const floor = f.y < 0.08, mag = Math.min(1, Math.hypot(c.mx, c.mz));
    // face the opponent (auto-aim) unless tumbling
    if (f.tumble <= 0) f.yaw = BurnsM.dampAngle(f.yaw, Math.atan2(o.x - f.x, o.z - f.z), 10, dt);
    // control forces
    if (f.tumble <= 0) { const force = floor ? 26 : 11; f.vx += c.mx * force * dt; f.vz += c.mz * force * dt; }
    // kick off the floor / a wall, or tug up the cord
    if (c.jump && f.kickCd <= 0 && f.tumble <= 0.4) {
      const hx = f.x - Cc.x, hz = f.z - Cc.z, hd = Math.hypot(hx, hz) || 1, wallR = Math.sqrt(Math.max(0, (Cc.R - 1.2) ** 2 - (f.y + 1) ** 2));
      if (f.y < 0.45) { f.vy = Math.max(f.vy, 0) + 10; f.vx += c.mx * 4.5; f.vz += c.mz * 4.5; f.kickCd = 0.32; burnsSfx('spring', { vol: 0.5, pitch: 1.2 }); g.fx.dust(f.x, f.y + 0.05, f.z, 8); }
      else if (hd > wallR - 1.3) { f.vx -= hx / hd * 10; f.vz -= hz / hd * 10; f.vy += 4.5; f.kickCd = 0.35; burnsSfx('jump3d'); g.fx.ring(f.x, f.y + 1, f.z, 1.2, '#ffb040', 0.3); }
      else { const ax = f.ax - f.x, ay = f.ay - (f.y + 1), az = f.az - f.z, l = Math.hypot(ax, ay, az) || 1; f.vx += ax / l * 5.5; f.vy += ay / l * 5.5; f.vz += az / l * 5.5; f.kickCd = 0.65; burnsSfx('jump3d', { pitch: 1.3, vol: 0.6 }); }
    }
    // swing: wind-up -> hitting -> recovery
    if (c.swing && f.swing === 'idle' && f.cd <= 0 && f.tumble <= 0) { f.swing = 'wind'; f.st = f.who === 'champ' ? 0.42 : 0.08; f.hitDone = false; if (f.who === 'champ' && f.a) f.a.say(['HRRRNG!', 'FOAM TIME!', 'BONK INCOMING!'][Math.floor(Math.random() * 3)], 0.8); }
    if (f.swing !== 'idle') {
      f.st -= dt;
      if (f.swing === 'hit' && !f.hitDone) {
        const dx = o.x - f.x, dy = o.y - f.y, dz = o.z - f.z, d = Math.hypot(dx, dz), ang = Math.abs(BurnsM.wrap(Math.atan2(dx, dz) - f.yaw));
        if (d < 2.45 && Math.abs(dy) < 1.9 && ang < 1.35 && o.inv <= 0) { f.hitDone = true; D.bonk(f, o); }
      }
      if (f.st <= 0) {
        if (f.swing === 'wind') { f.swing = 'hit'; f.st = 0.2; burnsSfx('throw', { vol: 0.5, pitch: 1.3 }); }
        else if (f.swing === 'hit') { f.swing = 'rec'; f.st = f.who === 'champ' ? 0.7 : 0.38; }
        else { f.swing = 'idle'; f.cd = f.who === 'champ' ? 0.3 : 0.12; if (f.who === 'champ') f.react = 0.5 + Math.random() * 0.5; }
      }
    }
    // gravity + the bungee
    f.vy -= D.G * dt;
    const hx = f.x - f.ax, hy = f.y + 1.0 - f.ay, hz = f.z - f.az, hd = Math.hypot(hx, hy, hz);
    if (hd > D.L0) { const nx = hx / hd, ny = hy / hd, nz = hz / hd, vr = f.vx * nx + f.vy * ny + f.vz * nz, acc = -D.K * (hd - D.L0) - D.KD * vr; f.vx += nx * acc * dt; f.vy += ny * acc * dt; f.vz += nz * acc * dt; }
    const drag = Math.exp(-(floor ? (mag > 0.1 ? 1.4 : 3.2) : 0.3) * dt); f.vx *= drag; f.vz *= drag;
    const sp = Math.hypot(f.vx, f.vy, f.vz); if (sp > 22) { f.vx *= 22 / sp; f.vy *= 22 / sp; f.vz *= 22 / sp; }
    f.x += f.vx * dt; f.y += f.vy * dt; f.z += f.vz * dt;
    // the floor bounces
    if (f.y < 0) { f.y = 0; if (f.vy < -4) { f.vy = -f.vy * 0.5; if (f.vy > 3) { burnsSfx('spring', { vol: 0.35 }); g.fx.dust(f.x, 0.05, f.z, 5); } } else f.vy = 0; }
    // the lattice wall (sphere around the hips) bounces too
    const Rw = Cc.R - 1.2, px = f.x - Cc.x, py = f.y + 1.0, pz = f.z - Cc.z, dd = Math.hypot(px, py, pz);
    if (dd > Rw) {
      const nx = px / dd, ny = py / dd, nz = pz / dd; f.x -= nx * (dd - Rw); f.y = Math.max(0, f.y - ny * (dd - Rw)); f.z -= nz * (dd - Rw);
      const vn = f.vx * nx + f.vy * ny + f.vz * nz;
      if (vn > 0) { f.vx -= nx * vn * 1.6; f.vy -= ny * vn * 1.6; f.vz -= nz * vn * 1.6; if (vn > 5) { g.shake(0.12); burnsSfx('bump', { vol: 0.5 }); g.fx.burst(f.x + nx * 0.6, f.y + 1, f.z + nz * 0.6, 'spark', 6, '#ffb040'); } }
    }
  },
  bonk(att, def) {
    const D = this, g = D.g;
    const dx = def.x - att.x, dz = def.z - att.z, d = Math.hypot(dx, dz) || 1, nx = dx / d, nz = dz / d;
    const closing = (att.vx - def.vx) * nx + (att.vz - def.vz) * nz, pow = 9 + clamp(closing, 0, 11) * 0.85;
    def.vx = nx * pow; def.vz = nz * pow; def.vy = 5.5 + pow * 0.3; def.tumble = 1.0; def.inv = 1.4; def.bonks++;
    def.swing = 'idle'; def.st = 0;
    D.slow = 0.32; g.shake(0.35 + Math.min(0.3, pow * 0.015));
    g.fx.burst(def.x, def.y + 1.3, def.z, 'star', 16, att.who === 'brady' ? '#ff4fd8' : '#38f2ff'); g.fx.confetti(def.x, def.y + 1.6, def.z, 14);
    burnsSfx('bump'); burnsSfx('stomp', { vol: 0.6 }); burnsSfx('crowd_cheer', { vol: 0.7 });
    const big = pow > 14;
    const left = 3 - def.bonks;
    if (att.who === 'brady') D.say(big ? 'POWER BONK!' : 'BONK!', '#ff4fd8', 1.1, left > 0 ? `${def.bonks} - ${D.f[0].bonks}` : '');
    else D.say(big ? 'OOF! POWER BONK!' : 'BONKED!', '#38f2ff', 1.1, left > 0 ? `${D.f[1].bonks} - ${def.bonks}` : '');
    if (D.o.onBonk) D.o.onBonk(g, att.who, def.bonks, big);
  },
  // the champion: closes in, telegraphs a big swing, dodges now and then
  ai(f, b, dt) {
    f.react = Math.max(0, f.react - dt);
    const dx = b.x - f.x, dz = b.z - f.z, dist = Math.hypot(dx, dz) || 1, dy = b.y - f.y;
    let mx = dx / dist, mz = dz / dist, jump = false, swing = false;
    if (dist < 1.6) { mx = -mx * 0.4; mz = -mz * 0.4; }
    if (f.tumble > 0) return { mx: 0, mz: 0, jump: false, swing: false };
    if (f.y < 0.3 && (dist > 4.5 || dy > 1.6) && Math.random() < dt * 2.2) jump = true;
    if (f.y > 1.2 && dy > 2.5 && Math.random() < dt * 0.8) jump = true;   // tug up toward him
    if (dist < 2.5 && Math.abs(dy) < 1.7 && f.swing === 'idle' && f.cd <= 0 && f.react <= 0) swing = true;
    if (b.swing === 'wind' && dist < 2.9 && !f.dodged && Math.random() < 0.3) { jump = true; mx = -mx; mz = -mz; f.dodged = true; }
    if (b.swing === 'idle') f.dodged = false;
    return { mx: mx * 0.85, mz: mz * 0.85, jump, swing };
  },
  anim(ch, f) {
    let a = 'float', k = null;
    if (f.tumble > 0) a = 'flip';
    else if (f.swing === 'wind' || f.swing === 'hit') a = 'throw';
    else if (f.y < 0.08) { const sp = Math.hypot(f.vx, f.vz); a = sp > 1 ? 'run' : 'idle'; if (sp > 1) k = { rate: clamp(sp / 6, 0.6, 1.4) }; }
    else if (Math.hypot(f.vx, f.vz) > 5) a = 'fly';
    if (ch.anim !== a || a === 'flip' && ch.animT > 0.42 && f.tumble > 0.5) ch.play(a, k, a === 'throw' || a === 'flip');
    if (k) ch.k = k;
  },
  end(won) {
    const D = this, g = D.g, p = g.player; if (!D.active) return;
    D.active = false;
    if (D.saved.upd) Object.defineProperty(p, 'update', D.saved.upd); else delete p.update;
    if (D.saved.bike && !g.bike) g.bike = D.saved.bike;
    if (g.syncHudButtons) g.syncHudButtons();
    g.boss = null;
    const C = D.C; p.teleport(C.x, 0, C.z + C.R - 3, Math.PI); p.ch.play('idle'); g.snapCam = true; g.camYaw = 0;
    const ch = D.o.champ; if (ch) { ch.setBehavior('idle'); ch.x = ch.home.x; ch.z = ch.home.z; ch.y = ch.home.y; ch.yaw = ch.home.yaw; ch.def.noTalk = D.saved.noTalk; }
    if (won && D.o.onWin) D.o.onWin(g); else if (!won && D.o.onLose) D.o.onLose(g);
  },
  abort(g) { if (this.active) { this.over = true; this.end(false); } },
  /* ---------- drawing ---------- */
  drawSprites(g, R) {
    if (!this.active) return;
    const D = this;
    for (const f of D.f) {
      const hx = f.x, hy = f.y + 1.0, hz = f.z, d = Math.hypot(hx - f.ax, hy - f.ay, hz - f.az), taut = d > D.L0 - 0.05;
      const col = f.who === 'brady' ? [1, 0.45, 0.85] : [0.25, 0.9, 1];
      if (taut) BW11.beam(R, f.ax, f.ay, f.az, hx, hy, hz, 0.07, col, 0.85, 3);
      else { const sag = Math.min(1.6, (D.L0 - d) * 0.5), mx = (f.ax + hx) / 2, my = (f.ay + hy) / 2 - sag, mz = (f.az + hz) / 2; BW11.beam(R, f.ax, f.ay, f.az, mx, my, mz, 0.07, col, 0.85, 2); BW11.beam(R, mx, my, mz, hx, hy, hz, 0.07, col, 0.85, 2); }
      R.bbs.bb(hx, hy, hz, 0.8, 0.8, BURNS_SPRITES.R.glow, col, 0.5, true);
    }
  },
  batGeo() {
    if (this._bat) return this._bat;
    const m = new BurnsMesh(1024);
    for (const [bone, col] of [[0, '#ff5ab0'], [1, '#38d8ff']]) {
      m.setBone(bone);
      m.color('#2a2a30').shine(1); m.limb(0, 0.04, -0.06, 0, -0.1, 0.2, 0.03, 0.028, { seg: 8 });
      m.color(col, 0.18).shine(1); m.limb(0, -0.1, 0.2, 0, -0.42, 0.98, 0.075, 0.105, { seg: 10, mid: 0.08 });
      m.emissive(0).shine(0);
    }
    this._bat = m.geo();
    return this._bat;
  },
  drawSkinned(g, R) {
    if (!this.active) return;
    const B = this._bones || (this._bones = new Float32Array(24)), P = BURNS_BONES.PROP * 12, p = g.player, champ = this.o.champ;
    B.set(p.ch.bones.subarray(P, P + 12), 0);
    if (champ && champ.ch && champ.ch.bones) B.set(champ.ch.bones.subarray(P, P + 12), 12); else B.fill(0, 12, 24);
    R.skin(this.batGeo(), B, 2, null, 0, 0.4);
  },
  hud(ctx, g, fdt) {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), D = this;
    const y = S.t + (g.missions.tracker() ? 34 : 6) + 50;
    BurnsUI.text(ctx, 'YOU', W / 2 - 44, y + 8, 12, '#ffd0f4', { align: 'right' });
    for (let i = 0; i < 3; i++) { const on = i < 3 - D.f[0].bonks; ctx.fillStyle = on ? '#ff4fd8' : 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(W / 2 - 24 + i * 22, y + 8, 7, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5; ctx.stroke(); }
    if (D.t < 6 && !D.over) BurnsUI.text(ctx, 'JUMP: bounce / kick off the wall · ACTION: swing the foam bat', W / 2, y + 30, 11, '#ffffff', { ui: true });
    const m = D.msg;
    if (m) {
      const a = clamp(m.t / 0.08, 0, 1) * clamp((m.dur - m.t) / 0.25, 0, 1), sc = 1 + Math.max(0, 0.25 - m.t) * 1.6;
      ctx.save(); ctx.globalAlpha = a;
      BurnsUI.text(ctx, m.text, W / 2, H * 0.38, Math.min(52, W / 10) * sc, m.col, { glow: m.col });
      if (m.sub) BurnsUI.text(ctx, m.sub, W / 2, H * 0.38 + 34, 14, '#ffffff', { ui: true });
      ctx.restore();
    }
  }
};
// the champion's body is driven by the bout
BurnsBehaviors.register('bw11Bungee', { update(a, g, dt) { /* positioned by BW11Dome */ }, talk() { return true; } });
// fans hanging off the lattice: cheer, bang on the bars
BurnsBehaviors.register('bw11Hang', {
  init(a) { a.data.t = Math.random() * 3; },
  update(a, g, dt) {
    a.data.t -= dt;
    if (a.data.t <= 0) { a.data.t = 1.5 + Math.random() * 3; a.data.anim = Math.random() < 0.5 ? 'cheer' : (Math.random() < 0.5 ? 'captive' : 'bell'); }
    a.ch.play(BW11Dome.active ? (a.data.anim === 'captive' ? 'cheer' : a.data.anim || 'cheer') : (a.data.anim || 'captive'));
    if (BW11Dome.active) a.face(BW11Dome.f[0].x, BW11Dome.f[0].z, dt, 2);
  }
});
