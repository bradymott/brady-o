/* ============================================================
   BRADY GOES TO BURNING MAN — shared kit for Worlds 8, 9 and 10
   (Hell Station · Deep Playa Showdown · The Man Pavilion)
     BurnsW8910Shape  rounded, smooth-shaded shapes. One helper per shape, so
                      each can switch to the engine's rounded primitives later.
     BurnsW8910       timers, surface queries, neon-flash safe-spot finder,
                      small FX helpers
     BurnsW8910Haz    fire bombs, dust devils, thrown wrenches, heavy loads
     BurnsW8910Pulpo  El Pulpo, the fire-breathing octopus art car
   Everything here is prefixed BurnsW8910 / BURNS_W8910 (one shared IIFE).
   ============================================================ */

const BURNS_W8910_SURF = { y: 0, col: null };

/* ---------------- rounded shapes (mesh level, local coordinates) ----------------
   Thin wrappers over the engine's smooth primitives (m.lathe, m.roundBox, m.ellipsoid,
   m.limb, m.roundCyl, m.torus). One helper per shape keeps every call site easy to retune. */
const BurnsW8910Shape = {
  // surface of revolution about local +Y with its base at (x, y, z).
  // prof rows: [r, y, colour?, emissive?]; repeat a row for a crisp crease. o: m.lathe opts + { yaw, pitch, roll }
  lathe(m, x, y, z, prof, o) { o = o || {}; m.push(); m.tf(x, y, z, o.yaw || 0, o.pitch || 0, o.roll || 0); m.lathe(prof, o); m.pop(); return m; },
  // rounded box, centre-anchored (r = edge radius)
  rbox(m, cx, cy, cz, w, h, d, r, o) { m.roundBox(cx, cy, cz, w, h, d, r, o); return m; },
  // smooth ball / blob. o: { squash (y scale), sx, sz, seg, rings, phi1 (PI/2 = dome cap) }
  ball(m, x, y, z, r, o) { o = o || {}; m.ellipsoid(x, y, z, r * (o.sx || 1), r * (o.squash || 1), r * (o.sz || 1), o); return m; },
  // smooth (tapered) cylinder with crisp rims, y = bottom
  tube(m, x, y, z, r0, r1, h, o) { return this.lathe(m, x, y, z, [[0, 0], [r0, 0], [r0, 0], [r1, h], [r1, h], [0, h]], o); },
  // drum with rounded rims, y = bottom
  drum(m, x, y, z, r, h, edge, o) { m.roundCyl(x, y, z, r, h, edge, o); return m; },
  // tapered capsule between two points (tentacles, pipes, limbs, booms)
  pill(m, x0, y0, z0, x1, y1, z1, r0, r1, o) { m.limb(x0, y0, z0, x1, y1, z1, r0, r1 === undefined ? r0 : r1, o); return m; },
  // ring in the local XZ plane
  torus(m, x, y, z, R, r, o) { m.torus(x, y, z, R, r, o); return m; },
  // wheel with a soft tyre, axle along local X
  wheel(m, x, y, z, r, w, o) {
    o = o || {};
    m.push(); m.tf(x, y, z, 0, 0, Math.PI / 2);
    m.color(o.tire || '#1c1a1e'); m.roundCyl(0, -w / 2, 0, r, w, w * 0.38);
    m.color(o.hub || '#a8a8b2').shine(2); m.roundCyl(0, -w / 2 - 0.03, 0, r * 0.5, w + 0.06, 0.06); m.shine(0);
    m.pop();
    return m;
  },
  // a decal wrapped around a vertical cylinder (radius R) centred on yaw angle ang
  arcDecal(m, cx, cy, cz, R, ang, h, reg) {
    const w = h * (reg.aspect || 1), arc = w / R, n = Math.max(3, Math.ceil(arc / 0.1)), a0 = ang - arc / 2;
    const P = (t, yy) => [cx + Math.sin(t) * R, cy + yy, cz + Math.cos(t) * R];
    for (let k = 0; k < n; k++) {
      const ta = a0 + k / n * arc, tb = a0 + (k + 1) / n * arc, ua = reg.u0 + (reg.u1 - reg.u0) * k / n, ub = reg.u0 + (reg.u1 - reg.u0) * (k + 1) / n;
      m.poly([P(tb, -h / 2), P(tb, h / 2), P(ta, h / 2), P(ta, -h / 2)], [[ub, reg.v1], [ub, reg.v0], [ua, reg.v0], [ua, reg.v1]], [cx, cy, cz]);
    }
    return m;
  },
  // simple soft person for big static crowds (no rig, merged into chunks, low-detail primitives)
  person(m, x, z, yaw, rng, o) {
    o = o || {};
    const h = 0.9 + rng() * 0.25, skin = rng.pick(['#e8b996', '#c88a64', '#8a5a3a', '#f0c8a8', '#a86a4a']);
    const top = rng.pick(BURNS_NEON.concat(['#2a2a34', '#f4f0e8', '#1a1a22', '#8a2a5a']));
    const lo = m.lo; m.lo = true;
    m.push(); m.tf(x, 0, z, yaw, 0, 0, h);
    m.color(rng.pick(['#1a1a22', '#2a2a34', '#3a2a24', '#f4f0e8'])); m.limb(-0.11, 0.05, 0, -0.1, 0.8, 0, 0.09, 0.1); m.limb(0.11, 0.05, 0, 0.1, 0.8, 0, 0.09, 0.1);
    m.color(top); m.roundBox(0, 1.12, 0, 0.5, 0.64, 0.3, 0.12);
    const up = o.arms === 'up' || (o.arms !== 'down' && rng() < 0.45);
    m.color(skin);
    if (up) { m.limb(0.24, 1.36, 0, 0.4, 1.98, 0.05, 0.065, 0.055); m.limb(-0.24, 1.36, 0, -0.4, 1.98, 0.05, 0.065, 0.055); }
    else { m.limb(0.28, 1.36, 0, 0.32, 0.88, 0.06, 0.065, 0.055); m.limb(-0.28, 1.36, 0, -0.32, 0.88, 0.06, 0.065, 0.055); }
    m.ball(0, 1.64, 0, 0.17);
    if (rng() < 0.55) { m.color(rng.pick(['#3a2a1a', '#1a1412', '#e8c870', '#ff9ad0', '#8a8a8a'])); m.ellipsoid(0, 1.68, -0.02, 0.18, 0.15, 0.18, { phi1: Math.PI / 2 }); }
    if (rng() < 0.5) { m.color(rng.pick(BURNS_NEON), 1); m.torus(0, 1.42, 0, 0.17, 0.03); m.emissive(0); }
    m.pop();
    m.lo = lo;
    return { glow: up ? [x, 2.05 * h, z] : null, col: top };
  }
};

/* ---------------- small utilities ---------------- */
const BurnsW8910 = {
  // game-time timers (paused with the game, cleared with the scene)
  timer(g, sec, fn) { (g._bw8910T || (g._bw8910T = [])).push({ t: sec, fn }); },
  clearTimers(g) { if (g._bw8910T) g._bw8910T.length = 0; },
  tick(g, dt) {
    const L = g._bw8910T;
    if (L && L.length) { for (const t of L) { if (t.done) continue; t.t -= dt; if (t.t <= 0) { t.done = true; t.fn(g); } } g._bw8910T = (g._bw8910T || []).filter(t => !t.done); }
    BurnsW8910Haz.update(g, dt);
    BurnsW8910.hush(g);
  },
  ground(g, x, z, maxY) { return g.world.surface(x, z, maxY === undefined ? 999 : maxY, 0.1, BURNS_W8910_SURF).y; },
  near(g, x, z, r) { const p = g.player; return Math.hypot(p.x - x, p.z - z) < r; },
  // no ambient NPC chatter during cutscenes (a passing "Back in my day..." bubble would sit on top of the dialog box)
  hush(g) {
    const on = !!g.cine;
    if (on) for (const a of g.actors) if (a.friendly && !a.boss) { if (a.chatT < 1.5) a.chatT = 1.5; if (!g._bw8910Cine && a.bubbleText) { a.bubbleT = 0; a.bubbleText = null; } }
    g._bw8910Cine = on;
  },
  // safe spots behind cover from a flash at head h. covers: [{x, z, r}]
  safeSpots(g, h, covers) {
    const out = [], W = g.world;
    for (const c of covers || []) {
      let dx = c.x - h[0], dz = c.z - h[2]; const d = Math.hypot(dx, dz) || 1; dx /= d; dz /= d;
      let best = null, bestK = 0;
      for (const off of [0.8, 1.5, 2.3, 3.2]) {
        for (const lat of [0, -1.0, 1.0]) {
          const px = c.x + dx * (c.r + off) - dz * lat, pz = c.z + dz * (c.r + off) + dx * lat, gy = W.height(px, pz);
          const k = (W.covered(h[0], h[1], h[2], px, gy + 1.0, pz) ? 1 : 0) + (W.covered(h[0], h[1], h[2], px, gy + 0.3, pz) ? 1 : 0);
          if (k > bestK) { bestK = k; best = { x: px, z: pz, y: gy, k }; }
          if (k === 2) break;
        }
        if (bestK === 2) break;
      }
      if (best) out.push(best);
    }
    return out;
  },
  // per-frame sky fireworks (purely visual)
  skyFireworks(g, cx, cz, rate, spread, h0, h1) {
    if (Math.random() < rate) {
      const a = Math.random() * TAU, d = Math.random() * spread;
      g.fx.firework(cx + Math.cos(a) * d, h0 + Math.random() * (h1 - h0), cz + Math.sin(a) * d, BURNS_NEON[Math.floor(Math.random() * 7)]);
      if (Math.random() < 0.5) burnsSfx('firework_burst', { vol: 0.25, pitch: 0.7 + Math.random() * 0.4 });
    }
  },
  // keep a reference to the glow billboard api.glow() just created (to dim or light it later)
  glow(api, x, y, z, s, col, o) { api.glow(x, y, z, s, col, o); const G = api.world.glows[api.world.glows.length - 1]; G.c0 = G.c.slice(); return G; },
  setGlow(G, on) { if (!G) return; if (on) { G.c[0] = G.c0[0]; G.c[1] = G.c0[1]; G.c[2] = G.c0[2]; } else { G.c[0] = G.c[1] = G.c[2] = 0; } }
};

/* ---------------- hazards: fire bombs, dust devils, wrenches, heavy loads ---------------- */
const BurnsW8910Haz = {
  list(g) { return g._bw8910H || (g._bw8910H = []); },
  clear(g) { const L = g._bw8910H; if (!L) return; for (const h of L) if (h.mv) { h.mv.visible = false; h.mv.noCollide = true; } L.length = 0; },
  count(g, k) { const L = g._bw8910H; return L ? L.filter(h => !h.dead && (!k || h.k === k)).length : 0; },
  // arcing fire bomb from (x,y,z) that lands at (tx,tz) after T seconds
  bomb(g, x, y, z, tx, tz, o) {
    o = o || {}; const T = o.T || 1.4, grav = o.grav || 18, ty = BurnsW8910.ground(g, tx, tz, y);
    return this.add(g, { k: 'bomb', x, y, z, vx: (tx - x) / T, vy: (ty - y) / T + 0.5 * grav * T, vz: (tz - z) / T, grav, t: 0, T, tx, tz, ty, blast: o.blast || 2.4, dmg: o.dmg || 1, fire: o.fire === undefined ? 2.2 : o.fire, col: o.col || '#ff7a2a' });
  },
  // a dust devil: wanders or chases Brady. o: { r, h, speed, life, dir, turn, chase, dmg, giant, bounds:{x,z,r}, avoid:{x,z,r} }
  devil(g, x, z, o) {
    o = o || {};
    return this.add(g, { k: 'devil', x, z, r: o.r || 1.4, h: o.h || 9, speed: o.speed || 4.6, life: o.life || 7, dir: o.dir || 0, turn: o.turn === undefined ? 0.9 : o.turn, chase: o.chase !== false, dmg: o.dmg || 1, giant: !!o.giant, bounds: o.bounds || null, avoid: o.avoid || null, t: 0, seed: Math.random() * 10, grow: 0 });
  },
  wrench(g, x, y, z, tx, ty, tz, o) {
    o = o || {}; const T = o.T || 0.85, grav = 20;
    return this.add(g, { k: 'wrench', x, y, z, vx: (tx - x) / T, vy: (ty - y) / T + 0.5 * grav * T, vz: (tz - z) / T, grav, t: 0, life: T + 1.2, from: o.from || null });
  },
  // a heavy load (mover) thrown in an arc that lands as a temporary obstacle
  load(g, mv, x, y, z, tx, tz, o) {
    o = o || {}; const T = o.T || 1.3, grav = 22, ty = g.world.height(tx, tz);
    mv.visible = true; mv.noCollide = true; mv.x = x; mv.y = y; mv.z = z;
    return this.add(g, { k: 'load', mv, x, y, z, vx: (tx - x) / T, vy: (ty - y) / T + 0.5 * grav * T, vz: (tz - z) / T, grav, t: 0, T, tx, tz, ty, hold: o.hold || 7, blast: o.blast || 2.6, landed: false, spin: (Math.random() - 0.5) * 3 });
  },
  add(g, h) { this.list(g).push(h); return h; },
  update(g, dt) {
    const L = g._bw8910H; if (!L || !L.length) return;
    const p = g.player, W = g.world;
    for (const h of L) {
      if (h.dead) continue;
      h.t += dt;
      if (h.k === 'bomb' || h.k === 'wrench' || (h.k === 'load' && !h.landed)) {
        h.vy -= h.grav * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.z += h.vz * dt;
      }
      if (h.k === 'bomb') {
        const sy = W.surface(h.x, h.z, h.y + 0.3, 0.15, BURNS_W8910_SURF).y;
        if (h.vy < 0 && h.y <= sy + 0.15) this.explode(g, h, sy);
        else if (h.t > h.T + 2) h.dead = true;
      } else if (h.k === 'wrench') {
        const dx = p.x - h.x, dz = p.z - h.z, dy = p.y + 0.9 - h.y, d = Math.hypot(dx, dz);
        if (p.spinT > 0 && d < 1.9 && Math.abs(dy) < 1.5) { h.dead = true; g.fx.burst(h.x, h.y, h.z, 'star', 8, '#e8e8f0'); burnsSfx('pick', { vol: 0.5, pitch: 1.5 }); g.toast('CLANG! WRENCH DEFLECTED!'); continue; }
        if (d < 0.6 && Math.abs(dy) < 1.0) { h.dead = true; if (p.hurt(1, h.x, h.z, 5)) p.say(['Ow! A wrench!', 'Rude tool!', 'Righty-tighty-OUCHY!'][Math.floor(Math.random() * 3)], 1.2); continue; }
        const sy = W.surface(h.x, h.z, h.y + 0.2, 0.1, BURNS_W8910_SURF).y;
        if ((h.vy < 0 && h.y <= sy + 0.1) || h.t > h.life) { h.dead = true; g.fx.spark(h.x, sy + 0.2, h.z, 6, '#ffd890', 4); burnsSfx('bump', { vol: 0.3, pitch: 1.6 }); }
      } else if (h.k === 'load') {
        if (!h.landed) {
          h.mv.x = h.x; h.mv.y = h.y; h.mv.z = h.z; h.mv.yaw += h.spin * dt;
          if (h.vy < 0 && h.y <= h.ty) {
            h.landed = true; h.y = h.ty; h.mv.y = h.ty; h.mv.noCollide = false; h.t = 0;
            g.fx.dust(h.x, h.ty + 0.2, h.z, 26); g.shake(0.45); burnsSfx('man_stomp', { vol: 0.7, pitch: 1.3 });
            g.shockwave({ x: h.x, z: h.z, y: h.ty, speed: 9, max: 6, h: 0.5, dmg: 1, col: '#e8b070', dust: true });
            if (Math.hypot(p.x - h.x, p.z - h.z) < h.blast && p.y < h.ty + 2) p.hurt(2, h.x, h.z, 9);
          }
        } else if (h.t > h.hold) {
          h.mv.y -= dt * 0.8; h.mv.noCollide = true;
          if (h.t > h.hold + 2.5) { h.mv.visible = false; h.dead = true; }
        }
      } else if (h.k === 'devil') {
        const life = h.life;
        h.grow = Math.min(1, h.t / 0.6, Math.max(0, (life - h.t) / 0.8));
        if (h.chase) { const want = Math.atan2(p.x - h.x, p.z - h.z); h.dir = BurnsM.dampAngle(h.dir, want, h.turn, dt); }
        h.dir += Math.sin(h.t * 1.7 + h.seed) * dt * 0.7;
        h.x += Math.sin(h.dir) * h.speed * dt; h.z += Math.cos(h.dir) * h.speed * dt;
        if (h.bounds) { const bx = h.x - h.bounds.x, bz = h.z - h.bounds.z, bd = Math.hypot(bx, bz); if (bd > h.bounds.r) { h.x = h.bounds.x + bx / bd * h.bounds.r; h.z = h.bounds.z + bz / bd * h.bounds.r; h.dir += Math.PI * 0.6; } }
        if (h.avoid && Math.hypot(h.x - h.avoid.x, h.z - h.avoid.z) < h.avoid.r) h.life = Math.min(h.life, h.t + 0.8);
        const B = W.bounds; h.x = clamp(h.x, B.x0, B.x1); h.z = clamp(h.z, B.z0, B.z1);
        if (h.t > life) { h.dead = true; continue; }
        const rr = h.r * (0.4 + 0.6 * h.grow), gy = W.height(h.x, h.z);
        if (!h.harmless && h.grow > 0.5 && Math.hypot(p.x - h.x, p.z - h.z) < rr + 0.45 && p.y < gy + h.h * 0.55 && !p.dead) {
          if (p.hurt(h.dmg, h.x, h.z, 6)) { p.vy = h.giant ? 15 : 12.5; p.grounded = false; g.toast(h.giant ? 'THE BIG ONE GOT YOU!' : 'WHIRLED!'); }
        }
      }
    }
    if (L.some(h => h.dead)) g._bw8910H = L.filter(h => !h.dead);
  },
  explode(g, h, sy) {
    const p = g.player, W = g.world;
    h.dead = true;
    g.fx.burst(h.x, sy + 0.6, h.z, 'spark', 14, '#ffb040'); g.fx.dust(h.x, sy + 0.1, h.z, 8, '#5a4038');
    for (let i = 0; i < 5; i++) g.fx.fire(h.x + (Math.random() - 0.5) * 1.6, sy, h.z + (Math.random() - 0.5) * 1.6, 1.6);
    g.fx.ring(h.x, sy + 0.1, h.z, h.blast, '#ff8a3a', 0.4);
    burnsSfx('firework_burst', { vol: 0.55, pitch: 0.65 }); g.shake(0.16);
    if (Math.hypot(p.x - h.x, p.z - h.z) < h.blast && Math.abs(p.y - sy) < 2.2) p.hurt(h.dmg, h.x, h.z, 7);
    if (h.fire && sy < W.height(h.x, h.z) + 0.5) g.addTempFire(h.x, sy, h.z, 0.9, h.fire);
  },
  draw(g, R) {
    const L = g._bw8910H; if (!L || !L.length) return;
    const S = BURNS_SPRITES.R, cam = g.cam, t = g.time;
    for (const h of L) {
      if (h.dead) continue;
      if (h.k === 'bomb') {
        R.bbs.bb(h.x, h.y, h.z, 1.7, 2.0, S.flame, [1, 0.62, 0.22], 1, true);
        R.bbs.bb(h.x, h.y, h.z, 3.4, 3.4, S.glow, [1, 0.42, 0.12], 0.7, true);
        if (Math.random() < 0.8) g.fx.fire(h.x, h.y - 0.2, h.z, 0.9);
        const k = clamp(h.t / h.T, 0, 1);
        R.flat.flat(h.tx, h.ty + 0.07, h.tz, h.blast * 2.2, h.blast * 2.2, t * 3, S.warn, [1, 0.25 + 0.3 * k, 0.12], 0.45 + 0.4 * Math.abs(Math.sin(t * (8 + k * 10))), true);
      } else if (h.k === 'wrench') {
        R.bbs.bb(h.x, h.y, h.z, 0.75, 0.75, S.cross, [0.72, 0.74, 0.8], 1, false, h.t * 15);
        R.bbs.bb(h.x, h.y, h.z, 1.1, 1.1, S.glow, [1, 0.85, 0.5], 0.35, true);
      } else if (h.k === 'load' && !h.landed) {
        R.flat.flat(h.tx, h.ty + 0.07, h.tz, h.blast * 2.3, h.blast * 2.3, t * 2, S.warn, [1, 0.3, 0.15], 0.5 + 0.4 * Math.abs(Math.sin(t * 12)), true);
      } else if (h.k === 'devil') {
        const dx = h.x - cam.x, dz = h.z - cam.z; if (dx * dx + dz * dz > 150 * 150) continue;
        const k = h.grow, gy = g.world.height(h.x, h.z), col = h.giant ? [0.62, 0.52, 0.46] : [0.72, 0.6, 0.5];
        R.flat.flat(h.x, gy + 0.06, h.z, h.r * 3.4 * k, h.r * 3.4 * k, -t * 5, S.ring, col, 0.55 * k, false);
        R.flat.flat(h.x, gy + 0.05, h.z, h.r * 4.2 * k, h.r * 4.2 * k, 0, S.shadow, [0, 0, 0], 0.35 * k, false);
        const n = h.giant ? 9 : 6;
        for (let i = 0; i < n; i++) {
          const f = i / (n - 1), y = gy + 0.4 + f * h.h * k, rr = h.r * (0.45 + f * 1.25) * k, a = -t * (h.giant ? 4 : 7) + i * 1.3 + h.seed;
          R.bbs.bb(h.x + Math.cos(a) * rr * 0.35, y, h.z + Math.sin(a) * rr * 0.35, rr * 2.4, rr * 2.0, S.puff, col, 0.32 * k, false, a);
        }
        const em = h.giant ? 6 : 3;
        for (let i = 0; i < em; i++) {
          const a = Math.random() * TAU, f = Math.random(), rr = h.r * (0.4 + f * 1.3) * k, sp = (h.giant ? 9 : 7);
          g.fx.add(h.x + Math.cos(a) * rr, gy + 0.3 + f * h.h * 0.8 * k, h.z + Math.sin(a) * rr, -Math.sin(a) * sp, 1.6 + Math.random() * 2, Math.cos(a) * sp, 0.6 + Math.random() * 0.4, 0.6 * (h.giant ? 2 : 1), 2.2 * (h.giant ? 2 : 1), col, 0.3, 'puff', 4, Math.random() * 6, 1);
        }
      }
    }
  }
};

/* ---------------- El Pulpo: the fire-breathing octopus art car (our own design) ---------------- */
const BurnsW8910Pulpo = {
  COL: { copper: '#c86a3e', copperDk: '#8e4428', copperLt: '#e08a58', patina: '#46b0a0', belly: '#f4c0a6', iron: '#2c2630', deck: '#6a4630', deckTop: '#8a6040', neon: '#ff4fd8', neon2: '#38f2ff' },
  // tentacle roots in car space: [angle (yaw, relative to the car), length scale]
  ROOTS: [[0.62, 0.9], [-0.62, 0.9], [1.35, 1.0], [-1.35, 1.0], [2.05, 1.05], [-2.05, 1.05], [2.75, 1.1], [-2.75, 1.1]],
  MANTLE: { z: -1.65, y: 1.6 },
  body(m, o) {
    o = o || {};
    const C = this.COL, S = BurnsW8910Shape, Mz = this.MANTLE.z, My = this.MANTLE.y;
    // chassis, wheels and the walkable deck
    m.color(C.iron); S.rbox(m, 0, 0.9, 0, 3.9, 0.62, 8.6, 0.24);
    for (const wz of [2.85, 0, -2.85]) for (const sx of [1, -1]) S.wheel(m, sx * 1.98, 0.62, wz, 0.62, 0.5, { hub: '#c8843e' });
    m.color(C.deck); S.rbox(m, 0, 1.45, 0.05, 4.3, 0.28, 9.1, 0.12, { top: C.deckTop });
    // copper skirt with a neon underglow strip
    m.color(C.copperDk).shine(2); S.rbox(m, 2.1, 1.12, 0.05, 0.16, 0.42, 9.0, 0.07); S.rbox(m, -2.1, 1.12, 0.05, 0.16, 0.42, 9.0, 0.07); m.shine(0);
    for (let i = 0; i < 16; i++) { const z = -4.2 + i * 0.56; m.color(BURNS_NEON[i % 7], 1); m.box(2.19, 1.0, z, 0.04, 0.09, 0.28); m.box(-2.19, 1.0, z, 0.04, 0.09, 0.28); }
    m.emissive(0);
    // the driver's nook at the front: bucket seat, steering wheel, glowing dash
    m.color('#3a1a2a'); S.rbox(m, 0, 1.92, 3.25, 0.9, 0.5, 0.8, 0.16); S.rbox(m, 0, 2.42, 2.92, 0.9, 0.9, 0.22, 0.1);
    m.color('#2a2a30'); S.pill(m, 0, 1.6, 3.95, 0, 2.3, 3.75, 0.05);
    m.push(); m.tf(0, 2.36, 3.72, 0, -0.9, 0); m.color('#c8843e').shine(2); S.torus(m, 0, 0, 0, 0.3, 0.045, { seg: 14, tseg: 5 }); m.shine(0); m.pop();
    m.color('#1a1420'); S.rbox(m, 0, 1.92, 4.35, 2.4, 0.5, 0.4, 0.14);
    for (let i = 0; i < 3; i++) { m.color(BURNS_NEON[(i * 2) % 7], 1); m.cyl(-0.6 + i * 0.6, 2.0, 4.56, 0.12, 0.12, 0.02, 10, {}); }
    m.emissive(0);
    m.color('#fff4d0', 1); S.rbox(m, 1.5, 1.2, 4.6, 0.4, 0.22, 0.08, 0.04); S.rbox(m, -1.5, 1.2, 4.6, 0.4, 0.22, 0.08, 0.04); m.emissive(0);
    // the mantle (the octopus head): a big smooth copper egg, glossy
    m.color(C.copper).shine(2);
    S.lathe(m, 0, My, Mz, [[0, 0, C.copperDk], [2.0, 0.02, C.copperDk], [2.6, 0.55, C.copper], [2.86, 1.6, C.copper], [2.78, 2.9, C.copper], [2.36, 4.1, '#d4784a'], [1.62, 5.05, C.copperLt], [0.75, 5.55, C.copperLt], [0, 5.68, C.copperLt]], { seg: 26 });
    // patina band + rivets around the waist
    m.color(C.patina); S.torus(m, 0, My + 1.25, Mz, 2.86, 0.13, { seg: 28, tseg: 6 }); m.shine(0);
    m.color('#f0c070'); for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; m.ball(Math.sin(a) * 2.98, My + 1.25, Mz + Math.cos(a) * 2.98, 0.08, { seg: 6, rings: 4 }); }
    // spots
    m.color('#a85230');
    for (const [a, yy, r] of [[0.9, 3.4, 0.42], [2.3, 2.6, 0.55], [-2.0, 3.6, 0.36], [3.0, 3.9, 0.48], [-0.7, 4.4, 0.3], [-2.9, 2.4, 0.45]]) {
      const rr = 2.72 - Math.max(0, yy - 3) * 0.55;
      m.push(); m.tf(Math.sin(a) * rr, My + yy, Mz + Math.cos(a) * rr, a, -0.25, 0); S.ball(m, 0, 0, 0, r, { squash: 0.22, seg: 10, rings: 5 }); m.pop();
    }
    // the eyes: glossy, heavy-lidded, and very much awake
    for (const sx of [1, -1]) {
      const ex = sx * 1.12, ey = My + 2.55, ez = Mz + 2.42;
      m.color(C.copperDk).shine(2); m.push(); m.tf(ex, ey + 0.12, ez - 0.05, sx * 0.42, -0.2, 0); S.ball(m, 0, 0, 0, 0.86, { squash: 0.82 }); m.pop();
      m.color('#fbf6ec', 0.25).shine(3); S.ball(m, ex, ey, ez + 0.18, 0.72); m.emissive(0);
      m.color('#14101a'); S.ball(m, ex + sx * 0.08, ey - 0.02, ez + 0.66, 0.36, { squash: 1.25 });
      m.color('#ffffff', 1); m.ball(ex + sx * 0.02, ey + 0.12, ez + 0.92, 0.09, { seg: 6, rings: 4 }); m.emissive(0).shine(0);
      m.push(); m.tf(ex, ey, ez + 0.38, 0, Math.PI / 2, 0); m.color(C.neon2, 1); S.torus(m, 0, 0, 0, 0.72, 0.05, { seg: 18, tseg: 4 }); m.pop(); m.emissive(0);
    }
    // the siphon (a cheeky copper funnel) and the flame crown on top
    m.color(C.copperDk).shine(2); m.push(); m.tf(1.95, My + 1.0, Mz - 1.2, 1.2, 1.25, 0); S.tube(m, 0, 0, 0, 0.42, 0.28, 1.3, { seg: 12 }); m.pop();
    m.color('#3a3036'); S.tube(m, 0, My + 5.55, Mz, 0.55, 0.42, 0.8, { seg: 14 });
    m.color('#ffb040', 0.6); S.torus(m, 0, My + 6.36, Mz, 0.48, 0.09, { seg: 16, tseg: 5 }); m.emissive(0);
    m.color('#4a3c44'); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; S.tube(m, Math.sin(a) * 0.9, My + 5.0, Mz + Math.cos(a) * 0.9, 0.12, 0.1, 0.8, { seg: 8 }); }
    m.shine(0);
    // deck rail at the back
    m.color('#2a2a30');
    for (const sx of [1, -1]) { S.pill(m, sx * 2.0, 1.6, -4.3, sx * 2.0, 2.4, -4.3, 0.05); S.pill(m, sx * 2.0, 1.6, 1.2, sx * 2.0, 2.4, 1.2, 0.05); S.pill(m, sx * 2.0, 2.4, -4.3, sx * 2.0, 2.4, 1.2, 0.045); }
    const lights = [{ x: 0, y: My + 6.4, z: Mz, s: 2.6, c: '#ffb040' }, { x: 1.12, y: My + 2.55, z: Mz + 3.1, s: 1.2, c: C.neon2 }, { x: -1.12, y: My + 2.55, z: Mz + 3.1, s: 1.2, c: C.neon2 },
      { x: 1.5, y: 1.2, z: 4.7, s: 1.1, c: '#fff0c8', beam: 0 }, { x: -1.5, y: 1.2, z: 4.7, s: 1.1, c: '#fff0c8', beam: 0 }];
    for (let i = 0; i < 6; i++) lights.push({ x: (i % 2 ? 1 : -1) * 2.2, y: 1.0, z: -3.6 + Math.floor(i / 2) * 3.4, s: 0.8, c: BURNS_NEON[i % 7] });
    const cols = [
      { t: 'box', x: 0, z: 0.05, hx: 2.15, hz: 4.55, y0: 0, y1: 1.6, cover: true },
      { t: 'cyl', x: 0, z: Mz, r: 2.6, y0: 1.6, y1: My + 5.2, cover: true },
      { t: 'box', x: 0, z: 4.35, hx: 1.2, hz: 0.2, y0: 1.6, y1: 2.15, walk: false }
    ];
    return { cols, lights, seat: [0, 1.62, 3.28], poofers: [[0, My + 6.3, Mz], [1.95, 2.5, 4.2], [-1.95, 2.5, 4.2]], w: 4.3, len: 9.1, top: 1.6 };
  },
  // one tentacle, built in its own frame: root at the origin, reaching out along +Z
  tentacle(m, i, len) {
    const C = this.COL, S = BurnsW8910Shape, n = 8, L = 4.4 * (len || 1);
    const pts = [];
    for (let k = 0; k <= n; k++) {
      const s = k / n, curl = Math.max(0, s - 0.62) / 0.38;
      pts.push([Math.sin(s * 2.4 + i) * 0.22 * s, -1.25 * Math.sin(Math.min(1, s * 1.25) * Math.PI / 2) + curl * curl * 1.0, L * s * (1 - 0.18 * s) - curl * curl * 0.45]);
    }
    m.shine(2);
    for (let k = 0; k < n; k++) {
      const a = pts[k], b = pts[k + 1], r0 = 0.5 * (1 - k / n * 0.8), r1 = 0.5 * (1 - (k + 1) / n * 0.8);
      m.color(k % 2 ? C.copper : '#d47448'); S.pill(m, a[0], a[1], a[2], b[0], b[1], b[2], r0, r1, { seg: 9 });
      m.color(C.belly); S.ball(m, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - r1 * 0.8, (a[2] + b[2]) / 2, r1 * 0.4, { seg: 7, rings: 4, squash: 0.6 });
    }
    m.shine(0);
    const tip = pts[n]; m.color('#ffb040', 0.7); m.ball(tip[0], tip[1], tip[2], 0.11, { seg: 6, rings: 4 }); m.emissive(0);
    return { cols: [], lights: [{ x: tip[0], y: tip[1], z: tip[2], s: 0.7, c: '#ffb040' }] };
  },
  // spawn El Pulpo as a drivable art car with waving tentacles. o: art car options + { fuel }
  spawn(api, o) {
    o = o || {};
    const self = this;
    const car = api.artCar(Object.assign({ label: 'DRIVE EL PULPO', maxSpeed: 8, accel: 3.2, turn: 0.95 }, o, { build: m => self.body(m, o) }));
    const tents = this.ROOTS.map((R, i) => { const mv = api.mover(m => self.tentacle(m, i, R[1])); mv.noCollide = true; return mv; });
    const P = { car, tents, t: 0, fuel: o.fuel === undefined ? 1 : o.fuel, puffT: 0 };
    // tentacles follow the car (called every step and once per rendered frame)
    P.sync = (g) => {
      const c = Math.cos(car.yaw), s = Math.sin(car.yaw), t = g.time, drive = Math.min(1, Math.abs(car.speed) / 4);
      self.ROOTS.forEach((R, i) => {
        const mv = tents[i], a = R[0], lx = Math.sin(a) * 2.35, lz = self.MANTLE.z + Math.cos(a) * 2.35;
        mv.x = car.x + lx * c + lz * s; mv.z = car.z - lx * s + lz * c; mv.y = car.y + self.MANTLE.y + 0.55;
        mv.yaw = car.yaw + a + Math.sin(t * 1.1 + i * 1.7) * (0.12 + drive * 0.12);
        mv.pitch = Math.sin(t * 1.6 + i * 0.9) * (0.1 + drive * 0.1) - 0.05; mv.roll = Math.sin(t * 1.3 + i * 0.7) * 0.12;
        mv.visible = car.mv.visible;
      });
    };
    P.head = () => [car.x + Math.sin(car.yaw) * self.MANTLE.z, car.y + self.MANTLE.y + 6.3, car.z + Math.cos(car.yaw) * self.MANTLE.z];
    api.update((g, dt) => {
      P.t += dt; P.sync(g);
      // sputtering exhaust when the tank is empty, happy flame puffs when it is full
      P.puffT -= dt;
      if (P.puffT <= 0 && car.mv.visible) {
        P.puffT = P.fuel < 0.2 ? 0.5 + Math.random() * 0.6 : 3 + Math.random() * 4;
        const top = P.head();
        if (Math.hypot(top[0] - g.player.x, top[2] - g.player.z) < 90) {
          if (P.fuel < 0.2) g.fx.smoke(top[0], top[1], top[2], 3, '#3a3438');
          else { for (let k = 0; k < 6; k++) g.fx.add(top[0], top[1], top[2], (Math.random() - 0.5) * 1.4, 7 + Math.random() * 4, (Math.random() - 0.5) * 1.4, 0.5, 1.3, 0.5, [1, 0.55, 0.15], 1, 'flame', 1); if (Math.hypot(top[0] - g.player.x, top[2] - g.player.z) < 30) burnsSfx('flame_jet', { vol: 0.25 }); }
        }
      }
    });
    return P;
  }
};

/* ---------------- accessories skinned onto an actor's bones ----------------
   Things the rig has no slot for (respirators, chest radios, fist-sized crystals...).
   An actor with def.acc8910 = key gets BURNS_W8910_ACC[key] drawn with its own bones
   (one extra draw per visible actor). Call BurnsW8910Acc.draw(g, R) from def.drawSkinned. */
const BURNS_W8910_ACC = {
  captain(m, B) {
    m.setBone(B.HEAD);
    m.color('#3a3a42').shine(1); m.roundBox(0, 0.1, 0.17, 0.2, 0.15, 0.11, 0.05);
    m.color('#ff5a8a'); for (const sx of [1, -1]) { m.push(); m.tf(sx * 0.12, 0.07, 0.2, 0, Math.PI / 2, sx * 0.5); m.roundCyl(0, -0.04, 0, 0.065, 0.08, 0.02); m.pop(); }
    m.color('#1a1a1e'); m.torus(0, 0.12, 0.0, 0.175, 0.012, { seg: 12, tseg: 4 });
    m.color('#fff4b0', 1); m.roundCyl(0, 0.355, 0.15, 0.045, 0.06, 0.015); m.emissive(0);
    m.setBone(B.CHEST);
    m.color('#1a1a1e'); m.roundBox(0.1, 0.33, 0.16, 0.1, 0.16, 0.06, 0.02); m.limb(0.13, 0.4, 0.16, 0.14, 0.58, 0.14, 0.008, 0.006);
    m.color('#ff2a2a', 1); m.ball(0.08, 0.38, 0.195, 0.012); m.emissive(0);
    m.color('#e8f2ff', 0.35).shine(3);
    for (const [b, y] of [[B.UARM_L, -0.16], [B.UARM_R, -0.16], [B.FARM_L, -0.12], [B.FARM_R, -0.12], [B.THIGH_L, -0.22], [B.THIGH_R, -0.22], [B.SHIN_L, -0.2], [B.SHIN_R, -0.2]]) { m.setBone(b); m.roundBox(0, y, 0, b === B.THIGH_L || b === B.THIGH_R ? 0.16 : 0.12, 0.035, b === B.THIGH_L || b === B.THIGH_R ? 0.16 : 0.12, 0.015); }
    m.emissive(0).shine(0);
  },
  billionaire(m, B) {
    m.setBone(B.CHEST); m.color('#e8dcf4').shine(2); m.torus(0, 0.45, 0.02, 0.1, 0.035, { seg: 12, tseg: 5 }); m.roundBox(0, 0.39, 0.12, 0.12, 0.08, 0.03, 0.02);
    m.setBone(B.FARM_L); m.color('#f0c040').shine(3); m.torus(0, -0.22, 0, 0.05, 0.016, { seg: 10, tseg: 4 }); m.shine(0);
  },
  crusty(m, B) {
    m.setBone(B.CHEST); m.color('#c83a2a'); m.torus(0, 0.43, 0.01, 0.11, 0.035, { seg: 12, tseg: 5 }); m.push(); m.tf(0, 0.38, 0.12, 0, -0.3, 0); m.roundBox(0, 0, 0, 0.12, 0.1, 0.02, 0.01); m.pop();
    m.color('#6a3a1a'); m.limb(0.17, 0.46, 0.13, -0.14, 0.04, 0.14, 0.02, 0.02); m.limb(0.17, 0.46, -0.13, -0.14, 0.04, -0.14, 0.02, 0.02);
    m.setBone(B.HIPS); m.color('#d8a838').shine(3); m.push(); m.tf(0, -0.02, 0.15, 0, Math.PI / 2, 0); m.roundCyl(0, -0.015, 0, 0.055, 0.03, 0.01); m.pop(); m.shine(0);
    m.color('#c8a070'); for (const b of [B.SHIN_L, B.SHIN_R]) { m.setBone(b); m.roundBox(0, -0.05, 0.07, 0.13, 0.13, 0.06, 0.03); }
  },
  healer(m, B) {
    m.setBone(B.CHEST); m.color('#d8c8a0'); m.limb(-0.1, 0.45, 0.1, 0, 0.3, 0.16, 0.008, 0.008); m.limb(0.1, 0.45, 0.1, 0, 0.3, 0.16, 0.008, 0.008);
    m.color('#c8a8ff', 0.55).shine(3); m.ellipsoid(0, 0.24, 0.18, 0.06, 0.1, 0.05, { seg: 5, rings: 2 }); m.emissive(0).shine(0);
  },
  techbro(m, B) {
    m.setBone(B.CHEST); m.color('#f4f4f8').shine(2); m.torus(0, 0.46, 0.0, 0.12, 0.03, { seg: 12, tseg: 5 }); m.color('#7aff5a', 1); m.ball(0.0, 0.46, 0.12, 0.018); m.emissive(0);
    m.color('#4a5a4a'); for (let i = 0; i < 6; i++) m.roundBox((i % 2 ? 1 : -1) * 0.11, 0.18 + Math.floor(i / 2) * 0.08, 0.15, 0.08, 0.06, 0.03, 0.01);
    m.setBone(B.FARM_L); m.color('#1a1a1e'); m.roundBox(0, -0.22, 0.03, 0.06, 0.03, 0.06, 0.01); m.color('#38f2ff', 1); m.roundBox(0, -0.22, 0.062, 0.045, 0.022, 0.006, 0.003); m.emissive(0).shine(0);
  },
  firespinner(m, B) {
    m.setBone(B.HEAD); m.color('#3a2a22').shine(1); m.ellipsoid(0, 0.2, -0.01, 0.205, 0.215, 0.2, { seg: 12, rings: 8 });
    m.color('#ff8a1a', 0.9); m.roundBox(0, 0.22, 0.19, 0.2, 0.045, 0.03, 0.015); m.emissive(0);
    m.setBone(B.CHEST); m.color('#c8c8d0').shine(3); m.push(); m.tf(0, 0.32, 0.15, 0, Math.PI / 2, 0); m.roundCyl(0, -0.015, 0, 0.07, 0.03, 0.01); m.pop(); m.shine(0);
    for (const sx of [1, -1]) for (let k = 0; k < 3; k++) { m.color(k === 1 ? '#ffd84a' : '#ff6a1a', 0.5); m.push(); m.tf(sx * (0.12 + k * 0.06), 0.42, -0.16, 0, -0.3, sx * (0.25 + k * 0.3)); m.lathe([[0, 0], [0.05, 0.05], [0.035, 0.25], [0, 0.36]], { seg: 6 }); m.pop(); }
    m.emissive(0);
    m.color('#c8c8d0').shine(3); for (const b of [B.FARM_L, B.FARM_R]) { m.setBone(b); m.roundBox(0, -0.12, 0, 0.11, 0.12, 0.11, 0.03); } m.shine(0);
    m.color('#ff7a1a'); for (const b of [B.SHIN_L, B.SHIN_R]) { m.setBone(b); m.push(); m.tf(0, -0.03, 0.07, 0, Math.PI / 2, 0); m.roundCyl(0, -0.02, 0, 0.065, 0.04, 0.015); m.pop(); }
  },
  greeterF(m, B) {
    m.setBone(B.HEAD); m.color('#ff4fd8').shine(1); m.push(); m.tf(0, 0.36, 0); m.lathe([[0, 0], [0.38, 0.0], [0.36, 0.03], [0.16, 0.06], [0.15, 0.17], [0, 0.19]], { seg: 16 }); m.pop();
    m.setBone(B.FARM_R); m.color('#a87a4a'); m.limb(0, -0.2, 0.05, 0, 0.25, 0.08, 0.012, 0.012); m.roundBox(0, 0.36, 0.08, 0.24, 0.14, 0.02, 0.01);
    m.setBone(B.CHEST); for (let i = 0; i < 7; i++) { const a = -1.1 + i * 0.37; m.color(BURNS_NEON[i % 7]); m.ball(Math.sin(a) * 0.12, 0.42 - Math.cos(a) * 0.06, 0.12, 0.018); }
  },
  greeterM(m, B) {
    m.setBone(B.HEAD); m.color('#e8d08a').shine(1); m.push(); m.tf(0, 0.35, 0); m.lathe([[0, 0], [0.27, 0.0], [0.25, 0.03], [0.14, 0.05], [0.13, 0.15], [0.08, 0.16], [0, 0.15]], { seg: 14 }); m.pop();
    m.color('#5a3a2a'); m.torus(0, 0.39, 0, 0.135, 0.012, { seg: 12, tseg: 3 });
    m.setBone(B.FARM_R); m.color('#a87a4a'); m.limb(0, -0.2, 0.05, 0, 0.25, 0.08, 0.012, 0.012); m.roundBox(0, 0.36, 0.08, 0.24, 0.14, 0.02, 0.01);
  },
  darkwad(m, B) {
    m.setBone(B.CHEST); m.color('#141418'); m.roundBox(0, 0.3, -0.18, 0.3, 0.36, 0.14, 0.05);
    m.color('#1a1a1e'); for (const sx of [1, -1]) m.limb(sx * 0.12, 0.47, 0.11, sx * 0.13, 0.12, 0.13, 0.018, 0.018);
  },
  badidea(m, B) {
    m.setBone(B.FARM_R); m.color('#fbfbf6'); m.roundBox(0, -0.13, 0, 0.13, 0.3, 0.13, 0.05);
    m.setBone(B.UARM_R); m.color('#f4f4ee'); m.roundBox(0, -0.18, 0, 0.12, 0.14, 0.12, 0.04);
    m.setBone(B.FARM_L); m.color('#1a1a1e'); m.torus(0, -0.2, 0, 0.055, 0.02, { seg: 10, tseg: 4 }); m.color('#c8c8d0').shine(3); for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; m.push(); m.tf(Math.sin(a) * 0.072, -0.2, Math.cos(a) * 0.072, a, Math.PI / 2, 0); m.lathe([[0, 0], [0.012, 0], [0, 0.03]], { seg: 4 }); m.pop(); } m.shine(0);
    m.setBone(B.SHIN_L); m.color('#2a2a30'); m.roundBox(0, -0.04, 0.0, 0.14, 0.14, 0.14, 0.04);
    m.setBone(B.CHEST); m.color('#6a4a2a'); m.limb(0.17, 0.46, 0.13, -0.15, 0.05, 0.14, 0.018, 0.018);
  },
  cop(m, B) {
    m.setBone(B.HEAD);
    const cols = ['#ff3b5c', '#ffe24a', '#38f2ff'];
    for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.8; m.color(cols[i]); m.push(); m.tf(Math.sin(a) * 0.08, 0.36, 0, 0, 0, -a * 1.3); m.lathe([[0, 0], [0.09, 0], [0.06, 0.12], [0.02, 0.28], [0, 0.3]], { seg: 8 }); m.color('#ffd84a').shine(3); m.ball(0, 0.3, 0, 0.035, { seg: 6, rings: 4 }); m.shine(0); m.pop(); }
    m.color(cols[0]); m.torus(0, 0.36, 0, 0.17, 0.03, { seg: 14, tseg: 4 });
    m.setBone(B.CHEST); m.color('#f0c040').shine(3); m.torus(0, 0.38, 0.06, 0.1, 0.01, { seg: 12, tseg: 3 }); m.push(); m.tf(0, 0.28, 0.15, 0, Math.PI / 2, 0); m.roundCyl(0, -0.01, 0, 0.04, 0.02, 0.006); m.pop(); m.shine(0);
    m.setBone(B.SHIN_L); m.color('#f8f8f8'); m.roundBox(0, -0.3, 0, 0.12, 0.14, 0.12, 0.03); m.setBone(B.SHIN_R); m.roundBox(0, -0.3, 0, 0.12, 0.14, 0.12, 0.03);
  },
  furry(m, B) {
    m.setBone(B.HEAD);
    m.color('#a8988a').shine(1); m.ellipsoid(0, 0.21, 0, 0.25, 0.24, 0.24, { seg: 14, rings: 10, colFn: (x, y, z) => (Math.sin(x * 40) * Math.cos(z * 37 + y * 20) > 0.6 ? '#7a6a5e' : null) });
    m.color('#f4f0ea'); m.ellipsoid(0, 0.12, 0.2, 0.13, 0.1, 0.12, { seg: 10, rings: 6 }); m.color('#1a1416'); m.ball(0, 0.15, 0.31, 0.035, { seg: 6, rings: 4 });
    for (const sx of [1, -1]) { m.color('#1a1416'); m.ellipsoid(sx * 0.09, 0.27, 0.19, 0.065, 0.075, 0.03); m.color('#5aff6a', 0.4).shine(3); m.ellipsoid(sx * 0.09, 0.27, 0.205, 0.05, 0.06, 0.025); m.emissive(0).shine(0); m.color('#0a0a0a'); m.ball(sx * 0.09, 0.27, 0.228, 0.022, { seg: 6, rings: 4 }); }
    for (const sx of [1, -1]) { m.color('#a8988a'); m.push(); m.tf(sx * 0.15, 0.4, -0.02, 0, 0, -sx * 0.35); m.lathe([[0, 0], [0.08, 0], [0.04, 0.18], [0, 0.24]], { seg: 6, sz: 0.5 }); m.color('#ff4fa8'); m.lathe([[0, 0.02], [0.05, 0.03], [0.02, 0.17], [0, 0.2]], { seg: 6, sz: 0.3 }); m.pop(); }
    m.color('#ff4fd8'); m.ball(0.03, 0.46, 0.0, 0.06); m.color('#38f2ff'); m.ball(-0.04, 0.47, -0.03, 0.05);
    const stripes = ['#ff4fa8', '#ff8a2a', '#38c8c8'];
    for (const b of [B.UARM_L, B.UARM_R, B.FARM_L, B.FARM_R, B.THIGH_L, B.THIGH_R, B.SHIN_L, B.SHIN_R]) { m.setBone(b); for (let i = 0; i < 3; i++) { m.color(stripes[i]); m.roundBox(0, -0.07 - i * 0.05, 0, 0.13, 0.03, 0.13, 0.012); } }
    m.color('#8a7a6e'); for (const b of [B.FARM_L, B.FARM_R]) { m.setBone(b); m.ball(0, -0.3, 0.01, 0.075); }
    for (const b of [B.FOOT_L, B.FOOT_R]) { m.setBone(b); m.color('#8a7a6e'); m.ellipsoid(0, -0.04, 0.07, 0.1, 0.07, 0.15); m.color('#2a2226'); for (let k = -1; k <= 1; k++) m.ball(k * 0.045, -0.04, 0.21, 0.018, { seg: 5, rings: 3 }); }
    m.setBone(B.CHEST); m.color('#141418'); m.limb(0.12, 0.47, 0.13, 0.12, 0.08, 0.13, 0.016, 0.016); m.limb(-0.12, 0.47, 0.13, -0.12, 0.08, 0.13, 0.016, 0.016); m.roundBox(0, 0.25, 0.135, 0.28, 0.03, 0.02, 0.008);
    m.color('#38c8c8'); m.limb(0.18, 0.46, -0.05, -0.1, 0.1, -0.16, 0.02, 0.02);
    m.color('#ffe24a'); m.ball(0.06, 0.25, 0.15, 0.022); m.color('#ff4fd8'); m.ball(-0.06, 0.25, 0.15, 0.022);
  },
  lamplighter(m, B) {
    m.setBone(B.CHEST); m.color('#8a6a4a');
    for (const sx of [1, -1]) {
      m.limb(sx * 0.16, 0.45, -0.05, sx * 0.55, 1.75, -0.35, 0.022, 0.018);
      m.push(); m.tf(sx * 0.56, 1.62, -0.36); m.color('#3a2a1a'); m.lathe([[0, 0], [0.07, 0], [0.08, 0.04], [0.06, 0.06]], { seg: 8 }); m.color('#ffd890', 0.95); m.lathe([[0, 0.05], [0.075, 0.07], [0.075, 0.2], [0.05, 0.23], [0, 0.24]], { seg: 8 }); m.color('#3a2a1a', 0); m.lathe([[0, 0.22], [0.06, 0.23], [0.02, 0.3], [0, 0.31]], { seg: 6 }); m.pop(); m.emissive(0);
    }
    m.setBone(B.HEAD); m.color('#f4ecd8'); m.ellipsoid(0, 0.3, -0.01, 0.2, 0.14, 0.2, { phi1: Math.PI * 0.55 });
  },
  artist(m, B) {
    m.setBone(B.CHEST); m.color('#c8a070'); for (const sx of [1, -1]) m.limb(sx * 0.12, 0.47, 0.12, sx * 0.1, 0.02, 0.13, 0.014, 0.014);
    m.setBone(B.HIPS); m.color('#d8c8a8'); m.roundBox(0, -0.12, 0.13, 0.32, 0.36, 0.03, 0.02);
    const dots = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a']; for (let i = 0; i < 9; i++) { m.color(dots[i % 5]); m.ball(-0.12 + (i * 37 % 24) / 100, -0.24 + (i * 53 % 30) / 100, 0.15, 0.018, { seg: 5, rings: 3 }); }
  },
  fencebotA(m, B) {
    m.setBone(B.HEAD); m.color('#9aa0aa').shine(2);
    m.lathe([[0, -0.02], [0.2, -0.02], [0.21, 0.02], [0.2, 0.2], [0.215, 0.22], [0.2, 0.42], [0.22, 0.44], [0.22, 0.47], [0, 0.47]], { seg: 14, rMod: (th, t) => 1 + (Math.sin(th * 3 + 1) > 0.85 && t > 0.3 && t < 0.7 ? -0.08 : 0) });
    m.shine(0); for (const y of [0.11, 0.33]) { m.color(y > 0.2 ? '#ff4fd8' : '#38f2ff', 1); m.torus(0, y, 0, 0.205, 0.012, { seg: 16, tseg: 3 }); } m.emissive(0);
    for (const sx of [1, -1]) { m.push(); m.tf(sx * 0.075, 0.24, 0.2, 0, Math.PI / 2, 0); m.color('#d82a2a').shine(3); m.roundCyl(0, -0.012, 0, 0.045, 0.02, 0.006); m.color('#f4f4f4', 1); m.roundCyl(0, -0.016, 0, 0.012, 0.03, 0.004); m.emissive(0).shine(0); m.pop(); }
    m.color('#5a5a62'); m.limb(0.12, 0.47, 0, 0.18, 0.62, 0, 0.008, 0.005);
  },
  fencebotB(m, B) {
    m.setBone(B.HEAD); m.color('#c8ccd4').shine(3); m.ellipsoid(0, 0.3, 0, 0.215, 0.17, 0.215, { phi1: Math.PI / 2, colFn: (x, y, z) => ((Math.round(x * 26) + Math.round(z * 26) + Math.round(y * 30)) % 3 === 0 ? '#3a3a42' : null) });
    m.shine(0); m.color('#b8905a'); m.roundBox(0, 0.17, 0.02, 0.36, 0.3, 0.36, 0.02);
    m.color('#1a1a1e'); m.roundBox(0, 0.2, 0.19, 0.28, 0.07, 0.01, 0.005);
    m.color('#38f2ff', 1); m.roundBox(0, 0.2, 0.196, 0.26, 0.018, 0.008, 0.004); m.emissive(0);
    m.color('#c8ccd4'); for (const sx of [1, -1]) m.limb(sx * 0.2, 0.32, 0, sx * 0.28, 0.32, 0, 0.012, 0.012);
  },
  fencebotBody(m, B) {
    m.setBone(B.CHEST); m.color('#5a5a3a'); for (const sx of [1, -1]) m.limb(sx * 0.12, 0.46, 0.13, -sx * 0.1, 0.05, 0.14, 0.018, 0.018);
    m.color('#8ad0ff', 0.3).shine(3); m.roundCyl(0.14, 0.12, 0.15, 0.04, 0.16, 0.015); m.emissive(0).shine(0);
    m.color('#3a3a42'); for (const b of [B.FARM_L, B.FARM_R]) { m.setBone(b); m.roundBox(0, -0.28, 0, 0.11, 0.1, 0.12, 0.03); }
    m.color('#6a5a44'); for (const b of [B.SHIN_L, B.SHIN_R]) { m.setBone(b); m.roundBox(0, -0.05, 0.07, 0.13, 0.13, 0.06, 0.03); }
  },
  deathguild(m, B) {
    m.setBone(B.HEAD); m.color('#d8d4cc').shine(2); m.ellipsoid(0, 0.16, 0.12, 0.15, 0.17, 0.08); m.color('#141414'); for (const sx of [1, -1]) m.ball(sx * 0.055, 0.2, 0.19, 0.035); m.shine(0);
    m.color('#141414'); m.ellipsoid(0, 0.24, -0.03, 0.21, 0.23, 0.2, { phi1: Math.PI * 0.62 });
    m.setBone(B.CHEST); m.color('#c8c8d0').shine(3); for (const sx of [1, -1]) for (let k = 0; k < 3; k++) { m.push(); m.tf(sx * (0.18 + k * 0.03), 0.47, -0.04 + k * 0.05, 0, 0, -sx * 0.4); m.lathe([[0, 0], [0.025, 0], [0, 0.09]], { seg: 5 }); m.pop(); } m.shine(0);
    m.color('#5a3a22'); m.limb(0.17, 0.46, 0.13, -0.15, 0.05, 0.14, 0.018, 0.018); m.limb(-0.17, 0.46, 0.13, 0.15, 0.05, 0.14, 0.018, 0.018);
  },
  burney(m, B) {
    m.setBone(B.HEAD); for (const sx of [1, -1]) { m.color('#f4f0ea'); m.push(); m.tf(sx * 0.07, 0.48, -0.02, 0, 0, -sx * 0.15); m.lathe([[0, 0], [0.045, 0.02], [0.05, 0.2], [0.03, 0.3], [0, 0.32]], { seg: 6, sz: 0.4 }); m.color('#ff9ad0'); m.lathe([[0, 0.04], [0.025, 0.06], [0.03, 0.2], [0, 0.28]], { seg: 6, sz: 0.25 }); m.pop(); }
    m.color('#2a5ac8'); m.ellipsoid(0, 0.1, 0.18, 0.12, 0.035, 0.04);
    m.setBone(B.FARM_R); m.color('#1a1a1e').shine(2); m.roundBox(0, -0.28, 0.06, 0.12, 0.08, 0.07, 0.015); m.color('#5ab0ff', 0.3).shine(3); m.roundCyl(0, -0.27, 0.1, 0.022, 0.03, 0.006); m.emissive(0).shine(0);
  },
  annoyingdj(m, B) {
    m.setBone(B.HEAD); m.color('#1a1a1e').shine(2); m.torus(0, 0.24, 0, 0.19, 0.02, { seg: 14, tseg: 4, sy: 1 }); for (const sx of [1, -1]) { m.push(); m.tf(sx * 0.19, 0.2, 0, 0, 0, Math.PI / 2); m.roundCyl(0, -0.03, 0, 0.065, 0.06, 0.02); m.pop(); }
    m.color('#ffffff'); m.roundBox(0, 0.21, 0.175, 0.3, 0.1, 0.03, 0.03); m.color('#ff8a1a', 0.3).shine(3); for (const sx of [1, -1]) m.roundBox(sx * 0.07, 0.21, 0.19, 0.11, 0.07, 0.01, 0.02); m.emissive(0).shine(0);
  },
  partied(m, B) { m.setBone(B.CHEST); m.color('#2a6ac8'); m.limb(0, 0.46, 0.12, 0, 0.2, 0.15, 0.008, 0.008); m.color('#f4f4f4'); m.roundBox(0, 0.16, 0.155, 0.08, 0.1, 0.01, 0.005); },
  kid(m, B) {
    m.setBone(B.HEAD); m.color('#ffd84a', 0.3); for (let i = 0; i < 7; i++) { const a = -1.2 + i * 0.4; m.push(); m.tf(Math.sin(a) * 0.17, 0.36, Math.cos(a) * 0.12, a, -0.3, 0); m.lathe([[0, 0], [0.025, 0], [0, 0.11]], { seg: 4 }); m.pop(); } m.emissive(0);
    m.setBone(B.FARM_R); m.color('#8a5a32'); m.limb(0, -0.25, 0.05, 0, 0.5, 0.08, 0.018, 0.015); m.color('#c8a0ff', 0.5); m.ball(0, 0.55, 0.08, 0.05); m.emissive(0);
  },
  mom(m, B) { m.setBone(B.CHEST); m.color('#1a1a1e').shine(2); m.roundBox(0.07, 0.25, 0.15, 0.1, 0.07, 0.06, 0.015); m.roundBox(-0.08, 0.2, 0.15, 0.1, 0.07, 0.06, 0.015); m.shine(0); m.color('#3a2a1a'); m.torus(0, 0.42, 0.02, 0.12, 0.008, { seg: 10, tseg: 3 }); },
  cult(m, B) {
    m.setBone(B.CHEST); m.color('#ff4fa8'); m.torus(0, 0.45, 0, 0.17, 0.06, { seg: 14, tseg: 6 }); m.color('#ff8ad8', 0.4); m.ball(0, 0.3, 0.15, 0.04); m.emissive(0);
    m.color('#ff4fa8'); for (const b of [B.FARM_L, B.FARM_R]) { m.setBone(b); m.torus(0, -0.2, 0, 0.065, 0.035, { seg: 10, tseg: 5 }); }
  },
  gatestaff(m, B) { m.setBone(B.FARM_L); m.color('#1a1a1e'); m.roundBox(0, -0.27, 0.05, 0.06, 0.13, 0.04, 0.01); m.limb(0.015, -0.2, 0.05, 0.015, 0.02, 0.05, 0.004, 0.004); },
  pony(m, B) {
    m.setBone(B.HEAD); m.color('#ff4fd8', 0.6); for (let i = 0; i < 5; i++) { const a = -0.8 + i * 0.4; m.ball(Math.sin(a) * 0.17, 0.42 + Math.cos(a) * 0.04, Math.cos(a) * 0.06, 0.03); } m.emissive(0);
  }
};
const BurnsW8910Acc = {
  cache: {},
  geo(key) {
    let a = this.cache[key];
    if (!a) { const m = new BurnsMesh(2048); (BURNS_W8910_ACC[key] || (() => {}))(m, BURNS_BONES); a = this.cache[key] = m.empty ? { geo: null } : { geo: m.geo() }; }
    return a.geo;
  },
  draw(g, R) {
    for (const a of g.actors) {
      if ((!a.def.acc8910 && !a.def.acc8910b) || a.hidden || a.removed || !a._vis) continue;
      for (const key of [a.def.acc8910, a.def.acc8910b]) { if (!key) continue; const geo = this.geo(key); if (geo) R.skin(geo, a.ch.bones, a.ch.nb, a.ch.tint, 0, a.ch.rim); }
    }
  }
};

/* ---------------- the six burner archetypes (looks + lines, our own words) ---------------- */
const BURNS_W8910_ARCH = {
  spec(kind) {
    let s;
    if (kind === 'billionaire') {
      s = BurnsRig.npcSpec('techbro', 701);
      Object.assign(s, { top: { kind: 'button', col: '#fbf8f2' }, vest: null, bottom: { kind: 'chinos', col: '#f6f2ea' }, shoes: { kind: 'sneakers', col: '#ffffff', sole: '#e8e0d0' }, glasses: 'shades', goggles: true, face: 'smug', hair: { style: 'short', col: '#3a2a1a', hi: '#6a5a4a' }, prop: 'coffee', acc: [], body: { h: 1.02, w: 1.0 } });
    } else if (kind === 'crusty') {
      s = BurnsRig.npcSpec('crusty', 702);
      Object.assign(s, { skin: '#c88a5e', skinSh: '#a86a44', hair: { style: 'afro', col: '#b8b4ae', hi: '#e8e4de' }, face: 'beard', goggles: true, glasses: null, hat: null, coat: { kind: 'duster', col: '#8a5a36', trim: '#f0e2c4' }, top: { kind: 'tee', col: '#3a3430' }, vest: null, bottom: { kind: 'cargo', col: '#6a6a54' }, shoes: { kind: 'boots', col: '#6a4a2a' }, acc: ['toolbelt', 'bracelets'], body: { h: 1.0, w: 1.06 } });
    } else if (kind === 'pony') {
      s = BurnsRig.npcSpec('sparklepony', 703);
      Object.assign(s, { coat: { kind: 'fur', col: '#ff4fd8', trim: '#ffffff' }, top: { kind: 'crop', col: '#c8a0ff', pattern: 'sequin' }, bottom: { kind: 'leggings', col: '#1a1a22', pattern: 'plaid' }, shoes: { kind: 'furboots', col: '#38f2ff' }, hair: { style: 'wig', col: '#ff9ad0', hi: '#ffffff' }, glasses: 'heart', acc: ['wings'], face: 'lashes' });
    } else if (kind === 'techbro') {
      s = BurnsRig.npcSpec('techbro', 704);
      Object.assign(s, { vest: 'fleece', vestCol: '#5a6a5a', top: { kind: 'tee', col: '#2a2a34' }, bottom: { kind: 'chinos', col: '#c8b48a' }, prop: 'phone', glasses: null, face: 'smug', acc: ['earbuds'], hair: { style: 'buzz', col: '#3a2a1a', hi: '#5a4a3a' } });
    } else if (kind === 'captain') {
      s = BurnsRig.npcSpec('gate', 705);
      Object.assign(s, { top: { kind: 'hoodie', col: '#2a2a34' }, vest: 'hivis', bottom: { kind: 'cargo', col: '#3a3a30' }, shoes: { kind: 'boots', col: '#141414' }, hat: { kind: 'hardhat', col: '#ffd21a' }, glasses: 'clear', goggles: false, face: 'stern', prop: 'clipboard', hair: { style: 'bun', col: '#6a3a2a', hi: '#8a5a4a' }, acc: [], body: { h: 0.97, w: 1.0 } });
    } else if (kind === 'healer') {
      s = BurnsRig.npcSpec('burner', 706);
      const sk = s.skin;
      Object.assign(s, { coat: { kind: 'kimono', col: '#fbfaf6', trim: '#e8dcff' }, top: { kind: 'tank', col: '#fbfaf6' }, bottom: { kind: 'kilt', col: '#f4f2ec' }, shoes: { kind: 'sneakers', col: sk, sole: sk }, hat: null, goggles: false, glasses: null, face: 'sleepy', hair: { style: 'long', col: '#c8a878', hi: '#f0d8a8' }, acc: ['bracelets'], paint: null });
    } else if (kind === 'firespinner') {
      s = BurnsRig.npcSpec('burner', 707);
      Object.assign(s, { top: { kind: 'crop', col: '#6a4a32', pattern: 'leopard' }, bottom: { kind: 'kilt', col: '#ff7a1a', pattern: 'flames' }, shoes: { kind: 'boots', col: '#c8a070' }, hair: { style: 'bald', col: '#2a1a12', hi: '#2a1a12' }, hat: null, goggles: false, glasses: null, face: 'stern', acc: [], paint: null, body: { h: 1.0, w: 0.95 } });
    } else if (kind === 'greeterF') {
      s = BurnsRig.npcSpec('greeter', 708);
      Object.assign(s, { top: { kind: 'tank', col: '#38c8c8', pattern: 'sequin' }, bottom: { kind: 'tutu', col: '#9aff5a' }, shoes: { kind: 'sneakers', col: '#ff4fd8', sole: '#ffffff' }, hair: { style: 'long', col: '#2a1a14', hi: '#8a5a3a' }, hat: null, glasses: 'shades', face: 'lashes', acc: ['bracelets'], prop: null, body: { h: 0.94, w: 0.92 } });
    } else if (kind === 'greeterM') {
      s = BurnsRig.npcSpec('greeter', 709);
      Object.assign(s, { top: { kind: 'button', col: '#ff8a2a', pattern: 'tiedye' }, bottom: { kind: 'shorts', col: '#ff4fd8' }, shoes: { kind: 'sneakers', col: '#38f2ff', sole: '#ffffff' }, hair: { style: 'short', col: '#2a1a14', hi: '#4a3a2a' }, hat: null, glasses: 'shades', face: 'beard', acc: ['bracelets', 'lei'], prop: null, body: { h: 1.02, w: 1.12 } });
    } else if (kind === 'darkwad') {
      s = BurnsRig.npcSpec('techbro', 710);
      Object.assign(s, { top: { kind: 'hoodie', col: '#141418' }, vest: null, bottom: { kind: 'cargo', col: '#141418' }, shoes: { kind: 'sneakers', col: '#5a5a62', sole: '#3a3a42' }, hair: { style: 'mohawk', col: '#141414', hi: '#2a2a2a' }, glasses: 'shades', goggles: false, face: 'smug', acc: ['toolbelt'], prop: null });
    } else if (kind === 'badidea') {
      s = BurnsRig.npcSpec('burner', 711);
      Object.assign(s, { top: { kind: 'tank', col: '#f8f8f4' }, bottom: { kind: 'shorts', col: '#7a5a3a' }, shoes: { kind: 'boots', col: '#a8845a' }, hair: { style: 'short', col: '#5a3a22', hi: '#7a5a3a' }, hat: null, goggles: true, glasses: null, face: 'smug', acc: ['toolbelt'], paint: null, body: { h: 1.0, w: 1.04 } });
    } else if (kind === 'cop') {
      s = BurnsRig.npcSpec('techbro', 712);
      Object.assign(s, { top: { kind: 'button', col: '#ff8a2a', pattern: 'rainbow' }, vest: 'fleece', vestCol: '#1a1a1e', bottom: { kind: 'shorts', col: '#c8b48a' }, shoes: { kind: 'sneakers', col: '#f4f4f4', sole: '#d8d8d8' }, hair: { style: 'buzz', col: '#3a2a1a', hi: '#5a4a3a' }, glasses: 'shades', face: 'stern', acc: ['toolbelt'], prop: 'radio', body: { h: 1.02, w: 1.1 } });
    } else if (kind === 'furry') {
      s = BurnsRig.npcSpec('burner', 713);
      Object.assign(s, { skin: '#a8988a', skinSh: '#8a7a6e', top: { kind: 'hoodie', col: '#a8988a', pattern: 'leopard' }, bottom: { kind: 'leggings', col: '#a8988a', pattern: 'leopard' }, shoes: { kind: 'furboots', col: '#8a7a6e' }, hair: { style: 'bald', col: '#a8988a', hi: '#a8988a' }, hat: null, goggles: false, glasses: null, face: 'friendly', acc: ['ledNecklace'], paint: null, body: { h: 1.0, w: 1.12 } });
    } else if (kind === 'lamplighter') {
      s = BurnsRig.npcSpec('burner', 714);
      Object.assign(s, { coat: { kind: 'kimono', col: '#f4ecd8', trim: '#e0d0a8' }, top: { kind: 'tee', col: '#f4ecd8' }, bottom: { kind: 'kilt', col: '#ece2cc' }, shoes: { kind: 'sneakers', col: '#a8845a', sole: '#8a6a4a' }, hat: null, goggles: false, glasses: null, face: 'friendly', acc: ['toolbelt'], paint: null, hair: { style: 'short', col: '#3a2a1a', hi: '#5a4a3a' } });
    } else if (kind === 'artist') {
      s = BurnsRig.npcSpec('burner', 715);
      Object.assign(s, { top: { kind: 'crop', col: '#c8c8cc' }, bottom: { kind: 'cargo', col: '#34343e' }, shoes: { kind: 'boots', col: '#6a4a2a' }, hat: { kind: 'cowboy', col: '#e8d090' }, hair: { style: 'wavy', col: '#6a4228', hi: '#9a6a48' }, face: 'friendly', goggles: false, glasses: null, acc: ['bracelets'], prop: 'clipboard', paint: null, body: { h: 0.95, w: 0.92 } });
    } else if (kind === 'fencebotA' || kind === 'fencebotB') {
      s = BurnsRig.npcSpec('crusty', kind === 'fencebotA' ? 716 : 717);
      Object.assign(s, { coat: { kind: 'duster', col: kind === 'fencebotA' ? '#7a5a3a' : '#6a4a2e', trim: '#5a3a22' }, top: { kind: 'tee', col: '#3a3430' }, vest: 'patches', bottom: { kind: 'cargo', col: '#5a5a3a' }, shoes: { kind: 'boots', col: '#c8a070' }, hat: null, goggles: false, glasses: null, hair: { style: 'bald', col: '#2a2a2a', hi: '#2a2a2a' }, face: 'stern', acc: ['toolbelt'], body: { h: 1.0, w: 1.0 } });
    } else if (kind === 'deathguild') {
      s = BurnsRig.npcSpec('burner', 718);
      Object.assign(s, { coat: { kind: 'pirate', col: '#141414', trim: '#3a3a3a' }, top: { kind: 'tee', col: '#141414' }, bottom: { kind: 'cargo', col: '#141414' }, shoes: { kind: 'boots', col: '#141414' }, hat: null, goggles: false, glasses: null, hair: { style: 'bald', col: '#141414', hi: '#141414' }, acc: ['toolbelt'], paint: null, face: 'stern' });
    } else if (kind === 'burney') {
      s = BurnsRig.npcSpec('burner', 719);
      Object.assign(s, { top: { kind: 'button', col: '#2ab0a0', pattern: 'rainbow' }, vest: 'patches', bottom: { kind: 'shorts', col: '#c8b48a' }, shoes: { kind: 'boots', col: '#2a2a2a' }, hat: { kind: 'cowboy', col: '#e8d090' }, hair: { style: 'buzz', col: '#2a5ac8', hi: '#4a7ae8' }, face: 'goofy', goggles: false, glasses: null, acc: ['ledNecklace', 'bracelets'], paint: 'tattoo', body: { h: 1.0, w: 1.12 } });
    } else if (kind === 'annoyingdj') {
      s = BurnsRig.npcSpec('burner', 720);
      Object.assign(s, { top: { kind: 'button', col: '#ff6ab8', pattern: 'tiedye' }, bottom: { kind: 'shorts', col: '#9aff5a' }, shoes: { kind: 'sneakers', col: '#2ac8c8', sole: '#ffffff' }, hat: null, goggles: false, glasses: null, hair: { style: 'short', col: '#141414', hi: '#2a2a3a' }, face: 'goofy', acc: ['ledNecklace', 'bracelets'], paint: null });
    } else if (kind === 'partied') {
      s = BurnsRig.npcSpec('burner', 721);
      Object.assign(s, { top: { kind: 'button', col: '#f4c8d8' }, bottom: { kind: 'cargo', col: '#8a7a64' }, shoes: { kind: 'boots', col: '#6a5a4a' }, hat: null, goggles: false, glasses: null, hair: { style: 'long', col: '#8a8a8a', hi: '#b8b8b8' }, face: 'tired', acc: ['bracelets', 'ledNecklace'], paint: null });
    } else if (kind === 'kid') {
      s = BurnsRig.npcSpec('burner', 722);
      Object.assign(s, { top: { kind: 'none' }, paint: 'rainbow', bottom: { kind: 'cargo', col: '#c8a878' }, shoes: { kind: 'furboots', col: '#ff9ad0' }, hat: { kind: 'furhat', col: '#2ac8c8' }, glasses: 'shades', goggles: false, face: 'kid', acc: ['ledNecklace', 'bracelets'], body: { h: 0.9, w: 0.9 } });
    } else if (kind === 'mom') {
      s = BurnsRig.npcSpec('burner', 723);
      Object.assign(s, { top: { kind: 'hoodie', col: '#ff9ad0' }, vest: 'fleece', vestCol: '#5a9a5a', bottom: { kind: 'jeans', col: '#4a6a9a' }, shoes: { kind: 'sneakers', col: '#ffffff', sole: '#e8e8e8' }, hat: { kind: 'cowboy', col: '#e8d090' }, hair: { style: 'short', col: '#c8c8cc', hi: '#ffffff' }, glasses: 'shades', goggles: false, face: 'friendly', acc: ['lei'], paint: null, body: { h: 0.94, w: 1.04 } });
    } else if (kind === 'cult') {
      s = BurnsRig.npcSpec('burner', 724);
      Object.assign(s, { top: { kind: 'none' }, paint: null, bottom: { kind: 'leggings', col: '#ff6ab8' }, shoes: { kind: 'boots', col: '#ff4fa8' }, hat: null, hair: { style: 'mohawk', col: '#ff4fa8', hi: '#ffb0d8' }, glasses: 'heart', goggles: false, face: 'beard', acc: [], body: { h: 1.04, w: 1.22 } });
    } else if (kind === 'gatestaff') {
      s = BurnsRig.npcSpec('gate', 725);
      Object.assign(s, { top: { kind: 'tee', col: '#141418' }, vest: null, bottom: { kind: 'shorts', col: '#1a1a22' }, shoes: { kind: 'boots', col: '#141414' }, hat: null, glasses: 'shades', face: 'stern', hair: { style: 'down', col: '#6a4a2a', hi: '#d8b070' }, acc: ['toolbelt', 'bracelets'], prop: 'radio', body: { h: 0.96, w: 0.92 } });
    }
    s.key = 'w8910arch:' + kind;
    return s;
  },
  NAMES: { billionaire: 'STERLING, TURNKEY CAMP', crusty: 'GRIT, SINCE \'96', pony: 'GLIMMER', techbro: 'BRAXTON, FOUNDER', captain: 'CAPTAIN PRUDENCE', healer: 'MOONWATER',
    firespinner: 'FIRE SPINNER', greeterF: 'GREETER', greeterM: 'GREETER', darkwad: 'DARKWAD', badidea: 'BAD IDEA BURT', cop: 'TOTALLY A BURNER', furry: 'FUZZBUCKET',
    lamplighter: 'LAMPLIGHTER', artist: 'WREN, PLAYA ARTIST', fencebotA: 'FENCE BOT A', fencebotB: 'FENCE BOT B', deathguild: 'DEATH GUILD', burney: 'BURNEY', annoyingdj: 'DJ DROPZ',
    partied: 'TUESDAY GARY', kid: 'BURNER KID', mom: 'BURNER MOM', cult: 'BROTHER BUBBLEGUM', gatestaff: 'GATE STAFF' },
  // the engine's type names for each role (the engine draws these itself once it knows them)
  TYPE: { captain: 'safetycaptain', billionaire: 'billionaire', crusty: 'crusty', pony: 'sparklepony', techbro: 'techbro', healer: 'healer', firespinner: 'firespinner', greeterF: 'greeter_f', greeterM: 'greeter_m',
    darkwad: 'darkwad', badidea: 'badideaguy', cop: 'undercovercop', furry: 'furry', lamplighter: 'lamplighter', artist: 'playaartist', fencebotA: 'fencebot_a', fencebotB: 'fencebot_b',
    deathguild: 'deathguild', burney: 'burney', annoyingdj: 'annoyingdj', partied: 'partiedtoohard', kid: 'burnerkid', mom: 'burnermom', cult: 'cultleader', gatestaff: 'gatestaff' },
  OVERLAY: { captain: 'captain', billionaire: 'billionaire', crusty: 'crusty', healer: 'healer', techbro: 'techbro', pony: 'pony', firespinner: 'firespinner', greeterF: 'greeterF', greeterM: 'greeterM', darkwad: 'darkwad', badidea: 'badidea', cop: 'cop', furry: 'furry',
    lamplighter: 'lamplighter', artist: 'artist', fencebotA: 'fencebotA', fencebotB: 'fencebotB', deathguild: 'deathguild', burney: 'burney', annoyingdj: 'annoyingdj', partied: 'partied', kid: 'kid', mom: 'mom', cult: 'cult', gatestaff: 'gatestaff' },
  // does the engine already draw this type itself? (never throws; falls back to the stand-ins)
  engineHas(type) {
    try {
      if (typeof BurnsRig.hasType === 'function') return !!BurnsRig.hasType(type);
      const L = BurnsRig.types || BurnsRig.TYPES || (typeof BURNS_NPC_TYPES !== 'undefined' ? BURNS_NPC_TYPES : null);
      if (L) return Array.isArray(L) ? L.indexOf(type) >= 0 : !!L[type];
    } catch (e) { /* stand-in */ }
    return ['ranger', 'dpw', 'sparklepony', 'techbro', 'crusty'].indexOf(type) >= 0 && type !== 'crusty';
  },
  // an actor def for a cast role: the engine type when it exists, otherwise our rounded stand-in
  npc(kind, o) {
    const type = this.TYPE[kind] || kind, d = { type, seed: 700 + (Object.keys(this.TYPE).indexOf(kind) + 1) * 3, name: this.NAMES[kind] || type.toUpperCase() };
    if (!this.engineHas(type)) { const sp = this.spec(kind); if (sp) { d.spec = sp; if (this.OVERLAY[kind]) d.acc8910 = this.OVERLAY[kind]; } }
    if (kind === 'fencebotA' || kind === 'fencebotB') d.acc8910b = 'fencebotBody';
    return Object.assign(d, o || {});
  },
  // cheers for the Burn (W10 cameo crowd)
  BURN: {
    billionaire: ['Magnificent! I\'m buying the ashes.', 'My staff will clap for me. Clap, Gerald.'],
    crusty: ['Best burn since the beach! ...Don\'t quote me.', 'Too corporate! ...Still crying though.'],
    pony: ['I\'m crying glitter! Is that normal?!', 'Can I borrow a tissue? And a hug? And a ride home?'],
    techbro: ['This is so disruptive. I\'m pivoting. To feelings.', 'Zero cellular friction. Infinite vibes.'],
    captain: ['Fire perimeter: INTACT. Feelings: ALSO INTACT.', 'Everyone stay behind the line! ...WOOOO!'],
    healer: ['He\'s releasing his ego... I\'m weeping...', 'My twin flame! ...No wait, that\'s just a fire.']
  }
};

/* ---------------- extra animations for the cast ---------------- */
(() => {
  const B = BURNS_BONES, S = (P, b, x, y, z) => { P.r[b * 3] = x; P.r[b * 3 + 1] = y || 0; P.r[b * 3 + 2] = z || 0; };
  // Bad Idea Burt: cast arm raised, finger to chin, scheming
  BURNS_ANIMS.w8910think = (P, t) => { BURNS_ANIMS.idle(P, t); S(P, B.UARM_R, -2.85, 0, -0.15); S(P, B.FARM_R, -0.1); S(P, B.UARM_L, -1.0, 0, 0.35); S(P, B.FARM_L, -2.1); S(P, B.HEAD, 0.08, 0.2 + Math.sin(t * 0.8) * 0.15, 0.1); };
  // DJs: hands on the decks, head nodding on the beat
  BURNS_ANIMS.w8910dj = (P, t, k) => { const b = Math.sin(t * (k && k.bpm ? k.bpm / 60 * TAU : 13)); S(P, B.UARM_L, -0.85, 0, 0.25); S(P, B.FARM_L, -0.9 + b * 0.1); S(P, B.UARM_R, -0.85, 0, -0.25); S(P, B.FARM_R, -0.9 - b * 0.1); S(P, B.CHEST, 0.15 + Math.abs(b) * 0.06); S(P, B.HEAD, 0.1 + Math.abs(b) * 0.25); S(P, B.THIGH_L, -0.1); S(P, B.SHIN_L, 0.2 + Math.abs(b) * 0.15); S(P, B.THIGH_R, -0.1); S(P, B.SHIN_R, 0.2 + Math.abs(b) * 0.15); P.y = -Math.abs(b) * 0.05; };
  // fire spinners: arms swinging wide circles (the poi flames are particles)
  BURNS_ANIMS.w8910spin = (P, t) => { const a = t * 7.5; S(P, B.UARM_L, -1.3 + Math.sin(a) * 0.9, 0, 1.0 + Math.cos(a) * 0.5); S(P, B.FARM_L, -0.3); S(P, B.UARM_R, -1.3 + Math.sin(a + Math.PI) * 0.9, 0, -1.0 - Math.cos(a + Math.PI) * 0.5); S(P, B.FARM_R, -0.3); S(P, B.CHEST, 0.05, Math.sin(t * 2) * 0.3); S(P, B.THIGH_L, -0.2); S(P, B.SHIN_L, 0.3); S(P, B.THIGH_R, 0.1); S(P, B.SHIN_R, 0.15); P.y = -0.03; };
  // arms wide in welcome (greeters, Brother Bubblegum)
  BURNS_ANIMS.w8910welcome = (P, t) => { BURNS_ANIMS.idle(P, t); S(P, B.UARM_L, -0.3, 0, 1.5 + Math.sin(t * 2) * 0.1); S(P, B.UARM_R, -0.3, 0, -1.5 - Math.sin(t * 2) * 0.1); S(P, B.FARM_L, -0.2); S(P, B.FARM_R, -0.2); P.face = 3; };
})();

/* test hook: lets the scripted playthroughs peek at world state (read-only use) */
try { if (typeof window !== 'undefined' && window.BRADY_BURNS) window.BRADY_BURNS.w8910 = () => ({ w8: typeof BURNS_W8 !== 'undefined' ? BURNS_W8 : null, w9: typeof BURNS_W9 !== 'undefined' ? BURNS_W9 : null, w10: typeof BURNS_W10 !== 'undefined' ? BURNS_W10 : null, credits: typeof BurnsW8910Credits !== 'undefined' ? BurnsW8910Credits : null, end: typeof BURNS_W8910_END !== 'undefined' ? BURNS_W8910_END : null }); } catch (e) { /* ignore */ }
