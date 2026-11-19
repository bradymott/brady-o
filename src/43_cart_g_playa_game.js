/* ============================================================
   ART CART — LOVE TRAIN, Bass Valentine's own secret-level game (id 'lovetrain'),
   played in DEEP PLAYA ART PARK (arena 'playa', 43_cart_c_world.js).
   The art is in love with the beat: one giant piece at a time lights up pink and,
   on every bar of the bass, tosses out hearts. Drive through a heart and it joins
   your LOVE TRAIN: a conga line of hearts that dances along behind you. Drive
   through a rival's train to CUT it: every heart behind the cut spills loose
   (grab them!). Getting hit by anything shakes half your train off. The lit piece
   moves every few bars. First to a 10-heart train wins; at the whistle the
   longest train wins.
   Registers itself: CART_OBJECTIVES.lovetrain, CART_SECRET_LEVELS.heart.
   Everything here is an original design.
   ============================================================ */
const PLG2_C = {
  BEAT: 0.5,         // 120 bpm
  BARS: 5,           // the lit piece moves every 5 bars (10 s)
  GAP: 2.3,          // spacing between hearts in a train
  MAX: 16,           // the longest a train can grow
  POOL: 44,          // loose hearts (preallocated)
  PICK: 2.8,         // pick-up radius
  CUT: 2.1,          // cut radius (a rival's hearts, index 1 and up: the first heart is hitched to the bumper)
  pink: [1, 0.3, 0.6], hot: [1, 0.12, 0.42], rose: [1, 0.62, 0.8], white: [1, 1, 1], gold: [1, 0.85, 0.4]
};
const PLG2_PIECES = [['THE BIG HAND', 0, 0], ['THE LOTUS', -62, -48], ['THE SPINNER', 66, -44], ['THE OBELISK', 58, 62], ['THE RIBS', -60, 58]];
const PLG2_P = {};   // scratch for HUD projections

/* ---------------- the train helpers ---------------- */
// spill hearts [from..n) off k's train as loose hearts (k can't re-grab them for a moment)
function plg2Spill(s, k, from, kick) {
  const P = s.plg2, n = k.plg2n; if (from >= n) return 0;
  for (let i = from; i < n; i++) {
    const h = P.loose.find(q => !q.on); if (!h) break;
    const a = s.rng() * TAU, sp = 3 + s.rng() * (kick || 4);
    h.on = true; h.x = k.plg2x[i]; h.z = k.plg2z[i]; h.y = k.plg2y[i] + 0.8; h.vx = Math.sin(a) * sp; h.vz = Math.cos(a) * sp; h.vy = 5 + s.rng() * 3; h.land = false; h.from = k; h.cool = 1.1; h.ph = s.rng() * 10; h.age = 0;
  }
  k.plg2n = from; k.score = from;
  return n - from;
}
// hitch a heart onto k's train, starting where it was picked up (it slides into line)
function plg2Hitch(s, k, x, y, z) {
  const i = k.plg2n; if (i >= PLG2_C.MAX) return false;
  k.plg2x[i] = x; k.plg2y[i] = y; k.plg2z[i] = z; k.plg2n = i + 1; k.score = k.plg2n;
  return true;
}

CART_OBJECTIVES.lovetrain = {
  name: 'LOVE TRAIN', short: 'Longest heart train wins', time: 120, goal: 10, unit: ' ♥',
  desc: 'The lit art piece throws hearts on the beat: grab them to grow your love train. Drive through a rival\'s train to cut it. Hits cost half. First to 10 wins.',
  fx: {
    init(s) {
      const C = PLG2_C, E = s.E;
      const pieces = PLG2_PIECES.map(([name, x, z]) => { let r = 6; for (const a of E.art) if (Math.hypot(a.x - x, a.z - z) < 4 && a.r) r = Math.max(4, a.r); return { name, x, z, r, y: s.terrain.height(x, z) }; });
      const loose = []; for (let i = 0; i < C.POOL; i++) loose.push({ on: false, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, land: false, from: null, cool: 0, ph: 0, age: 0 });
      s.plg2 = { t: 0, beat: -1, bar: 0, lit: Math.floor(s.rng() * pieces.length), next: -1, pieces, loose, pulse: 0, drops: 0, cuts: 0 };
      for (const k of s.karts) {
        k.plg2n = 0; k.score = 0; k.plg2Cut = 0; k.plg2Col = burnsRGBf(k.car.col);
        if (!k.plg2x) { k.plg2x = new Float32Array(C.MAX); k.plg2y = new Float32Array(C.MAX); k.plg2z = new Float32Array(C.MAX); }
      }
    },
    update(s, dt) {
      const C = PLG2_C, P = s.plg2, K = s.karts, H = s.terrain, G = CART_OBJECTIVES.lovetrain.goal;
      P.t += dt; P.pulse = Math.max(0, P.pulse - dt * 3);
      // ---- the beat: every beat a pulse, every bar the lit piece throws hearts, every few bars it moves ----
      const beat = Math.floor(P.t / C.BEAT);
      if (beat !== P.beat) {
        P.beat = beat; P.pulse = 1;
        if (beat % 4 === 0) {
          P.bar++;
          if (P.bar % C.BARS === 0) {
            let n = P.lit; while (n === P.lit) n = Math.floor(s.rng() * P.pieces.length);
            P.lit = n; s.banner(P.pieces[n].name + ' IS CALLING', '#ff4fd8', 1.3, 'hearts on the beat', true);
            Sound.play('cartBass', { vol: 0.35, pitch: 1.1 });
          }
          const L = P.pieces[P.lit], live = P.loose.reduce((a, h) => a + (h.on ? 1 : 0), 0), want = live < 10 ? 3 : live < 22 ? 2 : 0;
          for (let i = 0; i < want; i++) {
            const h = P.loose.find(q => !q.on); if (!h) break;
            const a = s.rng() * TAU, d = L.r + 4 + s.rng() * 9, T = 1.15;
            h.on = true; h.x = L.x; h.z = L.z; h.y = L.y + 7; h.vx = Math.sin(a) * d / T; h.vz = Math.cos(a) * d / T; h.vy = 4; h.land = false; h.from = null; h.cool = 0.4; h.ph = s.rng() * 10; h.age = 0;
            P.drops++;
          }
          if (want && s.player && Math.hypot(s.player.x - L.x, s.player.z - L.z) < 50) Sound.play('pick', { vol: 0.25, pitch: 1.6 });
        }
      }
      // ---- loose hearts fly, land, and get picked up ----
      for (const h of P.loose) {
        if (!h.on) continue;
        h.age += dt; if (h.cool > 0) h.cool -= dt;
        if (!h.land) {
          h.vy -= 14 * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.z += h.vz * dt;
          const r = Math.hypot(h.x, h.z); if (r > 100) { h.x *= 100 / r; h.z *= 100 / r; h.vx *= -0.3; h.vz *= -0.3; }
          const g = H.height(h.x, h.z) + 1.0; if (h.y <= g && h.vy < 0) { h.y = g; h.land = true; h.vx = h.vz = h.vy = 0; }
        }
        if (h.y - H.height(h.x, h.z) > 3.2) continue;
        for (const k of K) {
          if (k.out || k.plg2n >= C.MAX || (h.cool > 0 && (h.from === k || !h.from))) continue;
          const dx = k.x - h.x, dz = k.z - h.z; if (dx * dx + dz * dz > C.PICK * C.PICK) continue;
          plg2Hitch(s, k, h.x, h.y, h.z); h.on = false;
          s.log('heart', { k: k.id, n: k.plg2n });
          s.fx.burst(h.x, h.y, h.z, 'heart', 6, '#ff6ab0');
          if (k.player) { Sound.play('glowstick', { vol: 0.6, pitch: 1 + k.plg2n * 0.05 }); if (k.plg2n >= G - 2) s.banner(k.plg2n + ' HEARTS!', '#ff9ad8', 0.8, (G - k.plg2n) + ' to go', true); }
          break;
        }
      }
      // ---- the trains follow their cars like a conga line ----
      const fol = Math.min(1, dt * 14);
      for (const k of K) {
        if (k.plg2Cut > 0) k.plg2Cut -= dt;
        const n = k.plg2n; if (!n) continue;
        const back = (k.M ? k.M.len * 0.5 : 2.2) + 0.8;
        let px = k.x - Math.sin(k.yaw) * back, pz = k.z - Math.cos(k.yaw) * back;
        for (let i = 0; i < n; i++) {
          let x = k.plg2x[i], z = k.plg2z[i];
          const dx = x - px, dz = z - pz, d = Math.hypot(dx, dz) || 0.001, want = i === 0 ? 0.6 : C.GAP;
          let tx = x, tz = z; if (d > want) { tx = px + dx / d * want; tz = pz + dz / d * want; }
          x += (tx - x) * fol; z += (tz - z) * fol;
          k.plg2x[i] = x; k.plg2z[i] = z; k.plg2y[i] = H.height(x, z) + 1.1;
          px = x; pz = z;
        }
        if (k.out) plg2Spill(s, k, 0, 3);
      }
      // ---- cutting: a car driving through a rival's train (behind the first heart) cuts it there ----
      for (const c of K) {
        if (c.out || c.plg2Cut > 0) continue;
        for (const o of K) {
          if (o === c || o.out || o.plg2n < 2) continue;
          let at = -1; for (let j = 1; j < o.plg2n; j++) { const dx = c.x - o.plg2x[j], dz = c.z - o.plg2z[j]; if (dx * dx + dz * dz < C.CUT * C.CUT && Math.abs(c.y + 1 - o.plg2y[j]) < 3) { at = j; break; } }
          if (at < 0) continue;
          const lost = plg2Spill(s, o, at, 5); c.plg2Cut = 0.7; P.cuts++;
          s.log('traincut', { k: o.id, by: c.id, n: lost, player: o.player, byPlayer: c.player });
          s.fx.burst(c.x, c.y + 1.5, c.z, 'heart', 10, '#ff4fd8'); s.fx.spark(c.x, c.y + 1, c.z, 10, '#ffffff', 7);
          if (o.player) { s.banner('TRAIN CUT!', '#ff6a6a', 1.2, '-' + lost + ' by ' + c.car.name); Sound.play('break', { vol: 0.7, pitch: 1.2 }); }
          else if (c.player) { s.banner('CUT! ' + lost + ' LOOSE', '#7aff8a', 1.0, 'grab them', true); Sound.play('break', { vol: 0.5, pitch: 1.5 }); }
          break;
        }
      }
      return K.some(k => k.plg2n >= G);
    },
    // anything that hits you shakes half your train loose
    onHit(s, k) {
      const n = k.plg2n | 0; if (n < 1) return;
      const lost = plg2Spill(s, k, n - Math.ceil(n / 2), 4);
      s.log('trainshake', { k: k.id, n: lost });
      if (k.player && lost) s.banner('-' + lost + ' HEART' + (lost > 1 ? 'S' : ''), '#ff9ad8', 0.9, null, true);
    },
    // AI: grab the nearest heart, or go and cut a long train; with nothing loose, head for the lit piece
    aiGoal(s, k, nearestRival) {
      const P = s.plg2; if (!P) return null;
      let best = null, bc = 1e9;
      for (const h of P.loose) { if (!h.on || (h.cool > 0 && h.from === k)) continue; const c = Math.hypot(h.x - k.x, h.z - k.z) + (h.land ? 0 : 4); if (c < bc) { bc = c; best = h; } }
      let gx = best ? best.x : 0, gz = best ? best.z : 0;
      const hunter = k.slot % 3 === 0 ? 1.6 : 1;
      for (const o of s.karts) {
        if (o === k || o.out || o.plg2n < 3) continue;
        const j = Math.min(o.plg2n - 1, 1 + (o.plg2n >> 2)), x = o.plg2x[j], z = o.plg2z[j], c = Math.hypot(x - k.x, z - k.z) - o.plg2n * 2.6 * hunter + 12 + (k.plg2n > o.plg2n ? 15 : 0);
        if (c < bc) { bc = c; gx = x + (x - o.x) * 0.15; gz = z + (z - o.z) * 0.15; best = o; }
      }
      if (best) return { goal: [gx, gz] };
      const L = P.pieces[P.lit], a = k.slot * 0.8 + s.t * 0.3;
      return { goal: [L.x + Math.sin(a) * (L.r + 7), L.z + Math.cos(a) * (L.r + 7)] };
    },
    rank(s) { return s.karts.slice().sort((a, b) => ((b.plg2n | 0) - (a.plg2n | 0)) || (b.hitsDealt - a.hitsDealt)); },
    score(k) { return k.plg2n | 0; },
    draw(s, R, S, t) {
      const C = PLG2_C, P = s.plg2, cam = s.cam; if (!P) return;
      const pulse = P.pulse, bob = pulse * pulse;
      // the lit piece: a pink sky beam, a ring on the sand that throbs with the bass, notes floating off it
      const L = P.pieces[P.lit], gy = L.y + 0.15;
      R.bbs.streak(L.x, L.y + 22, L.z, 0, 1, 0, 44, 5 + bob * 2, S.streak, C.pink, 0.45);
      R.bbs.streak(L.x, L.y + 22, L.z, 0, 1, 0, 44, 1.6, S.streak, C.white, 0.5);
      R.flat.flat(L.x, gy, L.z, (L.r + 9) * 2 * (1 + bob * 0.08), (L.r + 9) * 2 * (1 + bob * 0.08), t * 0.4, S.ring, C.pink, 0.5 + bob * 0.4, true);
      R.flat.flat(L.x, gy - 0.02, L.z, (L.r + 9) * 2.1, (L.r + 9) * 2.1, 0, S.glow, C.hot, 0.18 + bob * 0.15, true);
      R.bbs.bb(L.x, L.y + 9, L.z, 9 + bob * 5, 9 + bob * 5, S.heart, C.hot, 0.5 + bob * 0.4, true);
      if (Math.random() < 0.35) { const a = Math.random() * TAU; s.fx.add(L.x + Math.sin(a) * L.r, L.y + 4 + Math.random() * 4, L.z + Math.cos(a) * L.r, Math.sin(a) * 1.5, 1.6, Math.cos(a) * 1.5, 1.6, 0.9, 0.5, C.rose, 0.9, 'note', 1 | 32); }
      // loose hearts: bouncing on the beat, a soft pink glow under each
      for (const h of P.loose) {
        if (!h.on) continue; const dx = h.x - cam.x, dz = h.z - cam.z; if (dx * dx + dz * dz > 150 * 150) continue;
        const y = h.y + 0.3 + (h.land ? bob * 0.6 + Math.sin(t * 3 + h.ph) * 0.1 : 0), w = 1.7 + bob * 0.35, blink = h.cool > 0 && h.from ? 0.55 : 1;
        R.bbs.bb(h.x, y, h.z, w, w, S.heart, C.hot, 0.95 * blink, false, Math.sin(t * 2 + h.ph) * 0.2);
        R.bbs.bb(h.x, y, h.z, w * 2.2, w * 2.2, S.glow, C.pink, 0.45 * blink, true);
        if (h.land) R.flat.flat(h.x, h.y - 0.9, h.z, 2.6, 2.6, 0, S.glow, C.pink, 0.3, true);
      }
      // the trains: hearts in the car's colour glow, a little bounce running down the line on every beat
      for (const k of s.karts) {
        const n = k.plg2n; if (!n || !k._in) continue;
        for (let i = 0; i < n; i++) {
          const x = k.plg2x[i], z = k.plg2z[i], dx = x - cam.x, dz = z - cam.z; if (dx * dx + dz * dz > 140 * 140) continue;
          const wave = Math.max(0, Math.sin((P.t / C.BEAT - i * 0.15) * Math.PI)), y = k.plg2y[i] + wave * 0.5, w = 1.45 + wave * 0.25;
          R.bbs.bb(x, y, z, w * 1.9, w * 1.9, S.glow, k.plg2Col, 0.55, true);
          R.bbs.bb(x, y, z, w, w, S.heart, C.hot, 1, false, Math.sin(t * 4 + i) * 0.15);
          R.bbs.bb(x - 0.18, y + 0.18, z, w * 0.35, w * 0.35, S.core, C.white, 0.6, true);
        }
      }
    },
    // the train meter (hearts), the lit piece, the arrow, the beat
    hud(s, ctx, top, left) {
      const C = PLG2_C, P = s.plg2, k = s.player; if (!P || !k || s.state !== 'race') return false;
      const W = Game.cssW, H = Game.cssH, portrait = H > W, cy = portrait ? top + 160 : top + 64, G = CART_OBJECTIVES.lovetrain.goal, n = k.plg2n | 0;
      ctx.save();
      const cw = Math.min(260, W * 0.44), cx = W / 2;
      ctx.fillStyle = 'rgba(40,6,28,0.6)'; burnsRR(ctx, cx - cw / 2, cy - 4, cw, 42, 10); ctx.fill();
      ctx.strokeStyle = `rgba(255,79,216,${0.4 + P.pulse * 0.5})`; ctx.lineWidth = 1.5 + P.pulse * 1.5; burnsRR(ctx, cx - cw / 2, cy - 4, cw, 42, 10); ctx.stroke();
      BurnsUI.text(ctx, '♥ ' + P.pieces[P.lit].name + ' IS CALLING', cx, cy + 8, 11, '#ff9ad8', { ui: true });
      // one little heart per car of your train, the goal marked
      const hs = Math.min(15, (cw - 24) / G), x0 = cx - (G - 1) * hs / 2, y = cy + 25;
      for (let i = 0; i < G; i++) {
        const on = i < n, sz = (on ? 5.4 : 4.2) * (on && i === n - 1 ? 1 + P.pulse * 0.25 : 1), x = x0 + i * hs;
        ctx.fillStyle = on ? '#ff2a7a' : 'rgba(255,255,255,0.18)';
        ctx.beginPath(); ctx.moveTo(x, y + sz * 0.9); ctx.bezierCurveTo(x - sz * 1.6, y - sz * 0.2, x - sz * 0.5, y - sz * 1.3, x, y - sz * 0.4); ctx.bezierCurveTo(x + sz * 0.5, y - sz * 1.3, x + sz * 1.6, y - sz * 0.2, x, y + sz * 0.9); ctx.fill();
      }
      // the arrow: the nearest loose heart if any is close, else the lit piece
      let tx = 0, ty = 0, tz = 0, bd = 70, found = false;
      for (const h of P.loose) { if (!h.on || (h.cool > 0 && h.from === k)) continue; const d = Math.hypot(h.x - k.x, h.z - k.z); if (d < bd) { bd = d; tx = h.x; ty = h.y + 2; tz = h.z; found = true; } }
      if (!found) { const L = P.pieces[P.lit]; tx = L.x; ty = L.y + 12; tz = L.z; }
      if (s.R.project(tx, ty, tz, W, H, PLG2_P)) {
        const ax = clamp(PLG2_P.x, 30, W - 30), ay = clamp(PLG2_P.y, 70, H - 120);
        ctx.translate(ax, ay); ctx.fillStyle = found ? '#ff6ab0' : '#ff4fd8'; ctx.strokeStyle = '#2a0a1a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(-10, -6); ctx.lineTo(10, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
      }
      // a rival right on your tail
      for (const o of s.karts) { if (o === k || o.out || n < 2) continue; const j = n - 1, d = Math.hypot(o.x - k.plg2x[j], o.z - k.plg2z[j]); if (d < 9 && Math.hypot(o.x - k.x, o.z - k.z) > 4) { BurnsUI.text(ctx, 'WATCH YOUR TAIL!', W / 2, H * (portrait ? 0.42 : 0.36), 14, Math.floor(s.time * 6) % 2 ? '#ff6a6a' : '#ffffff', { glow: '#ff2060' }); break; } }
      ctx.restore();
      return false;
    }
  }
};

// the lit piece and the trains light the sand (Deep Playa Art Park has no rules of its own; only active in this game)
if (!CART_ARENA_RULES.playa) CART_ARENA_RULES.playa = {
  lights(s, add) {
    const P = s.plg2; if (!P || s.objective !== 'lovetrain') return;
    const L = P.pieces[P.lit]; add(L.x, L.y + 3, L.z, 26, PLG2_C.pink, 1.1 + P.pulse * 0.6, 1.5);
    const k = s.player; if (k && k.plg2n > 1) add(k.plg2x[k.plg2n >> 1], k.plg2y[k.plg2n >> 1] + 1, k.plg2z[k.plg2n >> 1], 9, PLG2_C.pink, 0.7, 1.2);
  }
};

// the menu card: the art park's giant hand with a little love train of hearts dancing past it
if (!CART_ARENA_ICONS.playa) CART_ARENA_ICONS.playa = (ctx, s, t, col) => {
  ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.3); ctx.lineTo(-s * 0.1, -s * 0.35); for (let i = 0; i < 4; i++) ctx.lineTo(-s * 0.1 + i * s * 0.07, -s * 0.55 - (i % 2) * s * 0.08); ctx.lineTo(s * 0.16, -s * 0.3); ctx.lineTo(s * 0.14, s * 0.3); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const x = -s * 0.6 + i * s * 0.38, y = s * 0.55 - Math.abs(Math.sin(t * 4 - i * 0.7)) * s * 0.12, r = s * (i === 0 ? 0.13 : 0.1);
    ctx.fillStyle = i === 0 ? '#ffffff' : '#ff2a7a'; ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.5, y - r * 1.3, x, y - r * 0.4); ctx.bezierCurveTo(x + r * 0.5, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); ctx.fill();
  }
};

/* ---------------- Bass Valentine's secret level: Deep Playa Art Park with its own game ---------------- */
var CART_SECRET_LEVELS = (typeof CART_SECRET_LEVELS !== 'undefined' && CART_SECRET_LEVELS) || {};
CART_SECRET_LEVELS.heart = { arena: 'playa', game: 'lovetrain' };
