/* ============================================================
   ART CART — the Career final, BURN THE MAN (race rules for the Burn Night
   circuit; stand-in for the Man's own level). A dynamite plunger stands on
   the road; drive into it and it slams down, a fuse spark races to the Man
   and a new plunger appears further up the course. Every rival wants it too.
   First to push 3 lights the Man: he burns, fireworks fill the sky.
   Picked with CartRaceScene opts.final = 'plunger' (43_cart_h_career.js).
   Cheap by design: one pooled mesh group (box + handle: one draw call), the
   rest sprites and particles; nothing allocated per frame.
   ============================================================ */
const CART_PLG = { goal: 3, reach: 3.1, ahead0: 120, ahead1: 190, respawn: 1.8, fuse: 1.5, scale: 1.7 };
const CART_PLG_T = { at: {}, cam: { tx: 0, ty: 0, tz: 0, px: 0, py: 0, pz: 0, fov: 1.05 }, p: {}, gold: [1, 0.78, 0.25], red: [1, 0.3, 0.15], fire: [1, 0.55, 0.18], white: [1, 1, 1] };
const CartPlungerMesh = {
  // the detonator: a red box with hazard stripes and a bundle of dynamite strapped to its side (boxy is the point)
  box(m) {
    m.color('#c8261e').shine(2); m.roundBox(0, 0.42, 0, 1.25, 0.84, 0.9, 0.08); m.shine(0);
    m.color('#ffd23a', 0.25); m.roundBox(0, 0.42, 0, 1.29, 0.16, 0.94, 0.04);
    m.color('#2a2228'); m.roundBox(0, 0.87, 0, 1.0, 0.08, 0.7, 0.03);
    m.color('#b8bcc8').shine(3); m.limb(0, 0.88, 0, 0, 1.0, 0, 0.12, 0.1, { seg: 10 }); m.shine(0);
    for (let i = 0; i < 6; i++) { const a = (i % 3) * 0.24 - 0.24, b = i < 3 ? 0 : 0.21; m.color('#e8322a', 0.15); m.limb(0.86 + b, 0.06, a, 0.86 + b, 0.92, a, 0.1, 0.1, { seg: 8 }); m.color('#f4e4c8'); m.limb(0.86 + b, 0.92, a, 0.86 + b, 0.98, a, 0.1, 0.1, { seg: 8 }); }
    m.color('#ffd23a', 0.4); m.limb(0.96, 0.98, 0, 0.9, 1.25, 0.08, 0.025, 0.02, { seg: 4 });
    m.color('#1a1418'); m.torus(0.97, 0.5, 0, 0.3, 0.05, { seg: 12, tseg: 4 });
    m.emissive(0);
  },
  // the T handle (moves: it slams down when a car hits the box)
  handle(m) {
    m.color('#d8dce8').shine(3); m.limb(0, 0, 0, 0, 1.15, 0, 0.06, 0.06, { seg: 8 });
    m.color('#ffd23a', 0.5); m.limb(-0.55, 1.18, 0, 0.55, 1.18, 0, 0.1, 0.1, { seg: 10 });
    m.color('#ffffff', 0.9); m.ball(-0.6, 1.18, 0, 0.12, { seg: 8, rings: 6 }); m.ball(0.6, 1.18, 0, 0.12, { seg: 8, rings: 6 });
    m.emissive(0).shine(0);
  }
};

CART_RACE_RULES.plunger = {
  noRaceHud: true, noLaps: true,
  desc: 'Plungers pop up on the track: drive into one to push it. First to push 3 lights the Man!',
  onLoad(s) {
    s.laps = 999; s.manHold = true; s.name = 'BURN THE MAN';
    if (s.man) s.man.burn = 0;
    const G = new BurnsGroup(4), P = s.plg = { goal: CART_PLG.goal, alive: false, x: 0, y: 0, z: 0, yaw: 0, s: 0, d: 0, t: 0, pushT: -1, next: 0.01, n: 0, by: null, winner: null, igniteT: -1, fuseT: -1, fx0: 0, fy0: 0, fz0: 0, fxN: 0, heat: 0, fwT: 0, G };
    P.box = G.add(m => CartPlungerMesh.box(m), { visible: false, scale: CART_PLG.scale });
    P.handle = G.add(m => CartPlungerMesh.handle(m), { visible: false, scale: CART_PLG.scale });
    G.finish(); s.props.groups.push(G);
    for (const k of s.karts) { k.plg = 0; k.plgT = 0; }
  },
  // aim chance per rival per plunger: the sharper rivals go for it more often
  aim(s, k) { return k.player || s.rng() < 0.15 + clamp((k.ai ? k.ai.skill : 0.9) - 0.8, 0, 0.25) * 1.2; },
  /* a new plunger: on the road 120–190 m ahead of the player, at the candidate spot with the fewest rivals between the
     player and it (so it is a race to it, not a gift to whoever happens to lead), clear of every car */
  spawn(s) {
    const P = s.plg, T = s.T, ref = s.player, a = CART_PLG_T.at;
    let best = 1e9;
    for (let tries = 0; tries < 10; tries++) {
      const ahead = CART_PLG.ahead0 + s.rng() * (CART_PLG.ahead1 - CART_PLG.ahead0), sp = ((ref.loc.s + ahead) % T.L + T.L) % T.L;
      T.at(sp, a); const d = (s.rng() * 2 - 1) * a.hw * 0.5, x = a.x + a.nx * d, z = a.z + a.nz * d;
      let score = s.rng() * 0.5;
      for (const k of s.karts) {
        if (k.player) continue;
        let ds = k.loc.s - ref.loc.s; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L;
        if (ds > -8 && ds < ahead) score += ds > ahead - 45 ? 3 : 1;   // a rival already close to it counts most
        if ((k.x - x) * (k.x - x) + (k.z - z) * (k.z - z) < 30 * 30) score += 10;
      }
      if (s.terrain.kindAt && s.terrain.kindAt(x, z)) score += 5;   // off the ramps
      if (score < best) { best = score; P.x = x; P.z = z; P.s = sp; P.d = d; P.yaw = a.yaw + Math.PI / 2; }
    }
    P.y = s.terrain.height(P.x, P.z); P.alive = true; P.t = 0; P.pushT = -1; P.n++;
    for (const k of s.karts) if (k.ai && !k.player) k.ai.plgAim = P.by !== k && this.aim(s, k);   // whoever pushed the last one catches its breath
    if (P.n > 1) s.banner('NEW PLUNGER!', '#ffd84a', 1.2, 'follow the arrow', true);
    s.log('plungerSpawn', { n: P.n, x: +P.x.toFixed(1), z: +P.z.toFixed(1) });
  },
  push(s, k) {
    const P = s.plg; P.alive = false; P.pushT = 0; P.by = k; P.next = CART_PLG.respawn;
    k.plg++; k.plgT = s.raceT; k.cheerT = 1.4;
    s.boost(k, 0.6, 'pad');
    s.fx.spark(P.x, P.y + 1.8, P.z, 30, '#ffd84a', 9); s.fx.smoke(P.x, P.y + 0.6, P.z, 8, '#d8c8b0');
    // the fuse spark races from the plunger to the Man
    if (s.man) { P.fuseT = 0; P.fx0 = P.x; P.fy0 = P.y + 1.6; P.fz0 = P.z; P.fxN = k.plg; }
    const near = Math.hypot(k.x - s.cam.x, k.z - s.cam.z) < 40;
    Sound.play('stomp', { vol: k.player ? 0.9 : near ? 0.5 : 0.25, pitch: 0.8 }); if (k.player) { Sound.play('kartBoost', { vol: 0.6 }); s.shakeIt(0.6); }
    s.log('plunger', { k: k.id, n: k.plg, player: k.player });
    if (k.plg >= P.goal) return this.win(s, k);
    if (k.player) s.banner('KA-CHUNK! ' + k.plg + ' / ' + P.goal, '#ffd84a', 1.8, k.plg === P.goal - 1 ? 'ONE MORE LIGHTS THE MAN!' : 'Find the next plunger');
    else s.banner(k.car.name + ' PUSHED ONE', k.plg === P.goal - 1 ? '#ff6a6a' : '#ff9a3a', 1.4, k.plg + ' / ' + P.goal + (k.plg === P.goal - 1 ? ' · ONE MORE AND THEY WIN!' : ''), true);
  },
  // the third push: stop the race, the fuse runs to the Man, he ignites (ignite()) as it arrives
  win(s, k) {
    const P = s.plg; P.winner = k; P.alive = false; s.stageWon = k.player;
    s.state = 'done'; s.stateT = 0; Input.setMode('ui'); s.layoutControls(); if (Sound.engine) Sound.engine(false, 0);
    for (const q of s.karts) q.cheerT = q === k ? 99 : 0;   // (not 'finished': the scene then ends the show after 9 s, not 4.5)
    s.banner(k.player ? 'THREE! LIGHT HIM UP!' : k.car.name + ' PUSHED THREE!', k.player ? '#ffd84a' : '#ff9a3a', 1.6);
    if (!s.man) this.ignite(s);
  },
  ignite(s) {
    const P = s.plg; if (P.igniteT >= 0) return; P.igniteT = 0; P.fuseT = -1;
    const k = P.winner;
    s.banner('THE MAN BURNS!', '#ff8a2a', 5, k && k.player ? 'YOU LIT HIM!' : k ? k.car.name + ' LIT HIM' : '');
    s.flash = 1; s.white = 0.5; s.shakeIt(1);
    Sound.play('crowd', { vol: 0.9 }); Sound.play(k && k.player ? 'kartFinish' : 'powerdown', { vol: 0.8 });
    if (s.man) { const M = s.man.ch, sc = M.scale || 1; s.fx.confetti(M.x, M.y + 6 * sc, M.z, 80); for (let i = 0; i < 4; i++) s.fx.firework(M.x + (s.rng() - 0.5) * 30, M.y + 30 + s.rng() * 20, M.z + (s.rng() - 0.5) * 30, BURNS_NEON[i]); }
    s.log('manBurns', { by: k ? k.id : null, player: !!(k && k.player) });
  },
  onUpdate(s, dt, racing) {
    const P = s.plg; if (!P) return;
    P.t += dt;
    if (racing && s.state === 'race' && !P.alive && !P.winner) { P.next -= dt; if (P.next <= 0) this.spawn(s); }
    if (P.pushT >= 0) P.pushT += dt;
    // a car reaching the plunger pushes it
    if (P.alive && s.state === 'race') for (const k of s.karts) {
      if (k.out || k.sunk) continue;
      const dx = k.x - P.x, dz = k.z - P.z;
      if (dx * dx + dz * dz < CART_PLG.reach * CART_PLG.reach && Math.abs(k.y - P.y) < 2.6) { this.push(s, k); break; }
    }
    // the fuse
    if (P.fuseT >= 0) {
      P.fuseT += dt;
      if (P.fuseT >= CART_PLG.fuse) {
        P.fuseT = -1;
        if (s.man) { const M = s.man.ch, sc = M.scale || 1; s.fx.firework(M.x, M.y + 9 * sc, M.z, P.fxN >= P.goal ? '#ff8a2a' : '#ffd84a'); s.fx.spark(M.x, M.y + 5 * sc, M.z, 24, '#ffb040', 10); }
        if (P.winner) this.ignite(s); else Sound.play('kartLap', { vol: 0.35, pitch: 0.7 });
      }
    }
    let top = 0; for (const k of s.karts) if (k.plg > top) top = k.plg;
    P.heat = BurnsM.damp(P.heat, top / P.goal, 2, dt);
    // the burn: he catches from the feet up, fireworks barrage the sky
    if (P.igniteT >= 0) {
      P.igniteT += dt;
      if (s.man) {
        s.man.burn = Math.min(1, P.igniteT / 2.6);
        P.fwT -= dt;
        if (P.fwT <= 0 && P.igniteT < 9) { P.fwT = 0.12 + s.rng() * 0.18; const M = s.man.ch, a = s.rng() * TAU, r = 20 + s.rng() * 70; s.fx.firework(M.x + Math.cos(a) * r, M.y + 35 + s.rng() * 40, M.z + Math.sin(a) * r, BURNS_NEON[Math.floor(s.rng() * 7)]); }
      }
    }
    // pose the plunger: it rises out of the ground, bobs its handle up and down to beckon, slams down when pushed, then sinks
    const B = P.box, Hd = P.handle, sc = CART_PLG.scale;
    const rise = P.alive ? Math.min(1, P.t / 0.5) : 1, sink = P.pushT >= 0 ? clamp((P.pushT - 0.9) / 0.6, 0, 1) : 0;
    B.visible = Hd.visible = P.alive || (P.pushT >= 0 && sink < 1);
    const y = P.y - (1 - rise) * 1.6 * sc - sink * 1.9 * sc;
    B.x = Hd.x = P.x; B.z = Hd.z = P.z; B.yaw = Hd.yaw = P.yaw; B.y = y;
    const up = P.alive ? 0.62 + 0.12 * Math.sin(P.t * 5) : 0.62 * (1 - Math.min(1, P.pushT / 0.12));
    Hd.y = y + (0.94 + up) * sc;
  },
  aiOffset(s, k, off) {
    const P = s.plg; if (!P || !P.alive) return off;
    let ds = P.s - k.loc.s; if (ds < -s.T.L / 2) ds += s.T.L; if (ds > s.T.L / 2) ds -= s.T.L;
    if (ds <= 0 || ds > 85) return off;
    if (k.player || (k.ai && k.ai.plgAim)) return lerp(off, P.d, ds < 40 ? 0.95 : 0.7);   // going for it (the player's autopilot always is)
    // a rival not going for it keeps its line clear of it (no accidental pushes)
    if (ds < 45 && Math.abs(off - P.d) < 5) return P.d + (off >= P.d ? 5 : -5);
    return off;
  },
  // the camera turns to the Man while the fuse runs and he burns
  camera(s, fdt) {
    const P = s.plg; if (!P || !P.winner || !s.man) return null;
    const M = s.man.ch, sc = M.scale || 1, k = s.player, c = CART_PLG_T.cam;
    let dx = k.x - M.x, dz = k.z - M.z; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const a = Math.atan2(dx, dz) + (P.igniteT > 0 ? P.igniteT * 0.08 : 0), d = 36 * Math.max(0.8, sc);
    c.tx = M.x; c.ty = M.y + 4.5 * sc + (P.igniteT > 0 ? 2 : 0); c.tz = M.z;
    c.px = M.x + Math.sin(a) * d; c.py = M.y + 2 * sc; c.pz = M.z + Math.cos(a) * d; c.fov = 1.0;
    void fdt; return c;
  },
  draw(s, R, S, t) {
    const P = s.plg; if (!P) return;
    const C = CART_PLG_T;
    if (P.alive) {
      const pulse = 0.7 + 0.3 * Math.sin(t * 6), gy = P.y + 0.08;
      R.bbs.streak(P.x, gy + 22, P.z, 0, 1, 0, 44, 2.6, S.streak, C.gold, 0.55 * pulse);
      R.bbs.streak(P.x, gy + 9, P.z, 0, 1, 0, 18, 1.1, S.streak, C.white, 0.5);
      R.flat.flat(P.x, gy, P.z, 9 + 2 * pulse, 9 + 2 * pulse, t * 0.8, S.ring, C.gold, 0.85, true);
      R.flat.flat(P.x, gy + 0.02, P.z, 7, 7, 0, S.glow, C.red, 0.4, true);
      R.bbs.bb(P.x, P.y + 2.8 * CART_PLG.scale, P.z, 3.4 * pulse, 3.4 * pulse, S.glow, C.gold, 0.7, true);
      if (Math.random() < 0.5) s.fx.spark(P.x + 0.95 * CART_PLG.scale * Math.cos(P.yaw), P.y + 1.3 * CART_PLG.scale, P.z - 0.95 * CART_PLG.scale * Math.sin(P.yaw), 1, '#ffd84a', 3);
    }
    if (P.fuseT >= 0 && s.man) {
      const M = s.man.ch, u = P.fuseT / CART_PLG.fuse, e = u * u * (3 - 2 * u), sc = M.scale || 1;
      const x = lerp(P.fx0, M.x, e), z = lerp(P.fz0, M.z, e), y = lerp(P.fy0, M.y + 7 * sc, e) + Math.sin(u * Math.PI) * 22;
      R.bbs.bb(x, y, z, 3.2, 3.2, S.glow, C.gold, 1, true); R.bbs.bb(x, y, z, 1.4, 1.4, S.core, C.white, 1, true);
      s.fx.add(x, y, z, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, (Math.random() - 0.5) * 2, 0.5, 0.5, 0.1, C.fire, 1, 'spark', 1);
    }
    // the burn: big flames climbing the figure and a hot glow (on top of the scene's own Man fire)
    if (s.man && P.igniteT >= 0) {
      const M = s.man.ch, sc = M.scale || 1, b = s.man.burn;
      for (let i = 0; i < 4; i++) s.fx.fire(M.x + (Math.random() - 0.5) * 5 * sc, M.y + Math.random() * 11 * sc * b, M.z + (Math.random() - 0.5) * 4 * sc, 3.6 * sc * (0.5 + b * 0.5));
      if (Math.random() < 0.3) s.fx.spark(M.x + (Math.random() - 0.5) * 6 * sc, M.y + Math.random() * 10 * sc, M.z, 3, '#ffb040', 8);
      R.bbs.bb(M.x, M.y + 5 * sc, M.z, 26 * sc, 34 * sc, S.glow, C.fire, 0.35 * b, true);
    }
    // the Man's stage glows hotter with every plunger pushed
    if (s.man && P.heat > 0.02 && P.igniteT < 0) { const M = s.man.ch, gy = s.terrain.height(M.x, M.z) + 0.2; R.flat.flat(M.x, gy, M.z, 40, 40, t * 0.3, S.ring, C.fire, 0.5 * P.heat * (0.8 + 0.2 * Math.sin(t * 4)), true); }
  },
  lights(s, add) {
    const P = s.plg; if (!P) return;
    if (P.alive) add(P.x, P.y + 3, P.z, 12, CART_PLG_T.gold, 1.4, 2.5);
    if (P.fuseT >= 0 && s.man) add(P.fx0, P.fy0 + 4, P.fz0, 8, CART_PLG_T.fire, 1, 1.5);
  },
  // the results: most plungers first, the earlier last push breaking ties
  finish(s) {
    const order = s.karts.slice().sort((a, b) => (b.plg - a.plg) || (a.plgT - b.plgT) || (a.rank - b.rank));
    order.forEach((k, i) => { k.rank = i + 1; });
    s.results = order.map(k => ({ id: k.id, name: k.name, car: k.car.name, player: k.player, score: k.plg, t: 0, rank: k.rank }));
    if (typeof s.stageWon !== 'boolean') s.stageWon = order[0] === s.player && s.player.plg >= s.plg.goal;
    s.log('results', { rank: s.player.rank });
    s.state = 'results'; s.stateT = 0; Input.setMode('ui'); s.layoutControls(); if (Sound.engine) Sound.engine(false, 0);
    Sound.music('kart_results');
    s.buildButtons();
  },
  // dev-only (debug.career.win): end it now with the player (place 1) or a rival winning
  forceEnd(s, place) {
    const P = s.plg, w = place === 1 ? s.player : s.karts.find(k => !k.player);
    w.plg = P.goal; w.plgT = s.raceT; if (!P.winner) { this.win(s, w); this.ignite(s); }
  },
  forced(s, place) { s.stageWon = place === 1; },
  /* the HUD: the plunger count (yours as three plunger icons, the leading rival's), FIRST TO 3, an arrow to the plunger
     (over it when on screen, on the screen's edge when not) and the minimap with the plunger on it */
  hud(s, ctx, W, H, top, left) {
    const P = s.plg; if (!P) return;
    const k = s.player, portrait = H > W, t = s.time;
    // the panel: title + your three plungers
    const pw = 190, px = left - 4, py = top - 2;
    ctx.save(); ctx.fillStyle = 'rgba(10,4,20,0.6)'; burnsRR(ctx, px, py, pw, 74, 12); ctx.fill(); ctx.strokeStyle = 'rgba(255,216,74,0.35)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
    BurnsUI.text(ctx, 'BURN THE MAN', px + 12, py + 14, 13, '#ff9a3a', CART_TXT_L0);
    BurnsUI.text(ctx, 'FIRST TO ' + P.goal, px + pw - 10, py + 14, 9, 'rgba(255,255,255,0.75)', CART_TXT_URS);
    for (let i = 0; i < P.goal; i++) cartPlungerIcon(ctx, px + 26 + i * 40, py + 46, 15, i < k.plg, t + i);
    BurnsUI.text(ctx, 'YOU', px + pw - 14, py + 46, 11, '#ffd84a', CART_TXT_UR);
    // the rivals closest to winning
    const rx = portrait ? W - Math.max(14, insets.r + 6) - 160 : px, rw = portrait ? 150 : pw;
    let ry = portrait ? top + 62 : py + 88; const L = s._plgL || (s._plgL = []); L.length = 0;
    for (const q of s.karts) if (!q.player && q.plg > 0) L.push(q);
    L.sort((a, b) => b.plg - a.plg || a.plgT - b.plgT);
    for (let i = 0; i < L.length && i < 3; i++) {
      const q = L[i], danger = q.plg >= P.goal - 1;
      ctx.fillStyle = q.car.col; ctx.beginPath(); ctx.arc(rx + 10, ry, 4.5, 0, TAU); ctx.fill();
      BurnsUI.text(ctx, q.car.name, rx + 20, ry, 10, danger ? '#ff8a8a' : '#ffffff', { align: 'left', ui: true });
      BurnsUI.text(ctx, q.plg + ' / ' + P.goal, rx + rw - 14, ry, 11, danger ? '#ff6a6a' : '#ffd84a', CART_TXT_UR);
      ry += 16;
    }
    // where to go
    if (P.alive && s.state === 'race') this.pointer(s, ctx, W, H, portrait);
    else if (!P.alive && !P.winner && s.state === 'race') BurnsUI.text(ctx, 'NEXT PLUNGER COMING…', W / 2, portrait ? H * 0.3 : H * 0.24, 12, 'rgba(255,216,74,0.85)', CART_TXT_U);
    // the minimap, with the plunger and the Man on it
    s.drawMinimap(ctx); this.mapDots(s, ctx, W, H, portrait, t);
  },
  pointer(s, ctx, W, H, portrait) {
    const P = s.plg, k = s.player, R = s.R, o = CART_PLG_T.p, t = s.time;
    const dist = Math.hypot(P.x - k.x, P.z - k.z), label = Math.round(dist) + ' m';
    const on = R && R.project(P.x, P.y + 3.4 * CART_PLG.scale, P.z, W, H, o) && o.x > 24 && o.x < W - 24 && o.y > 60 && o.y < H - 40;
    ctx.save();
    if (on) {
      const b = Math.sin(t * 6) * 4, x = o.x, y = o.y - 14 + b;
      ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y + 14); ctx.lineTo(x - 12, y - 4); ctx.lineTo(x - 5, y - 4); ctx.lineTo(x - 5, y - 16); ctx.lineTo(x + 5, y - 16); ctx.lineTo(x + 5, y - 4); ctx.lineTo(x + 12, y - 4); ctx.closePath(); ctx.stroke(); ctx.fill();
      BurnsUI.text(ctx, 'PLUNGER · ' + label, x, y - 28, 11, '#ffd84a', CART_TXT_U);
    } else {
      // an arrow round the edge of an ellipse, pointing where the plunger is relative to the camera's heading
      const cam = s.cam, fy = Math.atan2(cam.tx - cam.x, cam.tz - cam.z), a = cartWrap(Math.atan2(P.x - cam.x, P.z - cam.z) - fy);
      const cx = W / 2, cy = H * 0.5, rx = W * 0.4, ry = H * (portrait ? 0.3 : 0.36), x = cx - Math.sin(a) * rx, y = cy - Math.cos(a) * ry;
      ctx.translate(x, y); ctx.rotate(-a);
      ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -20); ctx.lineTo(15, 6); ctx.lineTo(5, 3); ctx.lineTo(5, 16); ctx.lineTo(-5, 16); ctx.lineTo(-5, 3); ctx.lineTo(-15, 6); ctx.closePath(); ctx.stroke(); ctx.fill();
      ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
      BurnsUI.text(ctx, label, x, y + (Math.cos(a) > 0 ? 30 : -30), 11, '#ffd84a', CART_TXT_U);
    }
    ctx.restore();
  },
  // the same mapping as CartRaceScene.drawMinimap
  mapDots(s, ctx, W, H, portrait, t) {
    const T = s.TR; if (!T || !s._mmK) return;
    const S = portrait ? 92 : 104, x0 = portrait ? Math.max(14, insets.l + 6) : W - Math.max(14, insets.r + 6) - S - 46, y0 = portrait ? Math.max(10, insets.t + 6) + 130 : Math.max(10, insets.t + 6);
    const b = T.bounds, sc = s._mmK / 2, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2, P = s.plg;
    if (s.man) { const mx = x0 + S / 2 + (s.man.ch.x - cx) * -sc, my = y0 + S / 2 + (s.man.ch.z - cz) * -sc; ctx.fillStyle = '#ff8a2a'; ctx.beginPath(); ctx.moveTo(mx, my - 6); ctx.lineTo(mx + 4, my + 4); ctx.lineTo(mx - 4, my + 4); ctx.closePath(); ctx.fill(); }
    if (P.alive) { const px = x0 + S / 2 + (P.x - cx) * -sc, py = y0 + S / 2 + (P.z - cz) * -sc, r = 4 + 2 * Math.sin(t * 6); ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill(); ctx.stroke(); }
  }
};
// the HUD's plunger: a little detonator box with its T handle (down when pushed)
function cartPlungerIcon(ctx, x, y, s, done, t) {
  ctx.save(); ctx.translate(x, y); ctx.lineJoin = 'round';
  const up = done ? 0 : 0.18 + 0.06 * Math.sin(t * 5);
  if (done) { ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 7); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.95, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = done ? 1 : 0.55;
  ctx.fillStyle = done ? '#ffd84a' : '#c8c8d8'; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = 1.6;
  ctx.fillRect(-s * 0.08, -s * (0.55 + up), s * 0.16, s * 0.4); ctx.strokeRect(-s * 0.08, -s * (0.55 + up), s * 0.16, s * 0.4);
  ctx.fillRect(-s * 0.55, -s * (0.68 + up), s * 1.1, s * 0.18); ctx.strokeRect(-s * 0.55, -s * (0.68 + up), s * 1.1, s * 0.18);
  ctx.fillStyle = done ? '#e8322a' : '#6a3a40'; burnsRR(ctx, -s * 0.62, -s * 0.18, s * 1.24, s * 0.78, 3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = done ? '#ffd23a' : '#8a7a50'; ctx.fillRect(-s * 0.62, s * 0.08, s * 1.24, s * 0.14);
  ctx.restore();
}
