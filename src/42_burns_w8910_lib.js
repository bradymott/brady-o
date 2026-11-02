/* ============================================================
   BRADY-O BURNS — shared kit for Worlds 8, 9 and 10
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
  },
  ground(g, x, z, maxY) { return g.world.surface(x, z, maxY === undefined ? 999 : maxY, 0.1, BURNS_W8910_SURF).y; },
  near(g, x, z, r) { const p = g.player; return Math.hypot(p.x - x, p.z - z) < r; },
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
        if (h.grow > 0.5 && Math.hypot(p.x - h.x, p.z - h.z) < rr + 0.45 && p.y < gy + h.h * 0.55 && !p.dead) {
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
