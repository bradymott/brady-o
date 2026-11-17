/* ============================================================
   World tour: PUPO POWER! (docs/design/PUPO.md §3, PU-3)
   The meter fills over 30 s of riding (pokes add to it). Pressed
   with the meter full (the round Pupo button where the power-picker
   chip sits, or F / L on a keyboard), it plays a 2.6 s show with the
   world frozen: Pupo rears up and grows a startled tangle of extra
   arms, each with one pointing claw; his eyes become turning rainbow
   spirals; his tongue unrolls like a patterned carpet; "PUPO POWER!"
   slams in, big, bold and yellow; every arm boops an enemy's belly
   button (everyone gets a pupo for this); butterflies erupt from his
   own; the enemies pop into confetti and drop a coin. Then a 1.5 s
   shield (three little stars). Up to 16 non-boss enemies on screen;
   past 16 they are stunned; projectiles turn into butterflies.
   Fiesta Toon: hard edges and ink outlines; no glows, blurs, washes
   or full-screen flashes; nothing full-screen changes faster than
   about 3 times a second (the letterbox slides once each way, the text
   slams once); gameplay is identical at every tier, the look is
   cheaper at MEDIUM / LOW and calmer with FX CALM.
   PupoPowerFx is built once (pools of arms, butterflies, targets and
   boops; the text and the rug strip drawn once into cached canvases);
   its update and draw allocate nothing (tools/sbw_pupo_power_test.js
   measures it).
   ============================================================ */
const PupoPower = {
  K: { SHOW: 2.6, SHIELD: 1.5, MAX: 16, STUN_OVER: 3, STUN_NO: 6, VIEW_PAD: TS },
  key: false,
  // the look tier: 0 HIGH, 1 MEDIUM (QualityTier.level >= 2), 2 LOW (>= 5); calm: the FX CALM setting (reduced motion)
  tier() { const L = typeof QualityTier !== 'undefined' ? QualityTier.level : 0; return L >= 5 ? 2 : L >= 2 ? 1 : 0; },
  calm() { return typeof TourKit !== 'undefined' && TourKit.reduceMotion(); },
  can(g) { const p = g && g.player; return !!(p && p.pupoRide && p.state === 'play' && !p.dead && g.state === 'play' && g.pupo && !(g.pupo.showT > 0)); },
  press(g) {
    if (!this.can(g)) return false;
    const R = g.pupo;
    if (R.meter < 1) { R.ringShake = 0.35; Sound.play('bump', { vol: 0.35, pitch: 0.7 }); return false; }
    this.start(g); return true;
  },
  start(g) {
    const R = g.pupo, p = g.player, F = PupoPowerFx;
    R.meter = 0; R.showT = 1e-6; R.ringShake = 0;
    PupoReach.letGo(p, R); if (R.arm) { R.arm.phase = 0; R.arm.len = 0; }
    F.begin(g, p);
    const tips = Save.data.tips || (Save.data.tips = {}); if (!tips.pupoPower) { tips.pupoPower = true; Save.save(); }
    this.vol = Save.data.settings && Save.data.settings.music != null ? Save.data.settings.music : 0.6;
    Sound.setMusicVolume(this.vol * 0.3);
    PupoRide.sfx('pupoPower', 'disco', { vol: 0.8 });
  },
  vol: 0.6,
  // the frozen world: only the show, the camera and the particles run
  step(g, dt) {
    const R = g.pupo, F = PupoPowerFx, K = this.K;
    const t0 = R.showT; R.showT += dt; const t = R.showT;
    if (g.shakeAmt > 0) g.shakeAmt = Math.max(0, g.shakeAmt - dt * 30);
    if (g.toastT > 0) g.toastT -= dt;
    F.update(g, t0, t, dt);
    g.player.anim.t += dt;
    g.updateCamera(dt); g.parts.update(dt);
    if (t >= K.SHOW) this.end(g);
  },
  end(g) {
    const R = g.pupo, p = g.player;
    R.showT = 0; R.shieldT = this.K.SHIELD; R.powerShield = 1;
    PupoPowerFx.finish(g);
    Sound.setMusicVolume(this.vol);
    PupoRide.say(g, p.cx, p.y - 18, 'pupo');
  }
};

/* ---------- the show: pools built once ---------- */
const PupoPowerFx = {
  N_ARMS: 16, N_BF: 32, BIG: 1.3, TIERS: [{ arms: 12, bands: 6, rug: 0, bf: 24, bob: true, box: true, shake: 3 }, { arms: 8, bands: 4, rug: 1, bf: 12, bob: false, box: true, shake: 3 }, { arms: 4, bands: 3, rug: 2, bf: 6, bob: false, box: false, shake: 0 }],
  COLS: ['#e8413a', '#ff9a2a', '#ffd84a', '#4ac46a', '#3a8ae8', '#9a5ae8'],
  init() {
    if (this.arms) return;
    this.targets = []; this.tx = new Float32Array(16); this.ty = new Float32Array(16); this.hitDone = false; this.n = 0;
    this.arms = []; for (let i = 0; i < this.N_ARMS; i++) this.arms.push({ on: false, ox: 0, oy: 0, sa: 0, ang: 0, tx: 0, ty: 0, born: 0, shoot: 0, tgt: -1, len: 0, col: i % 2 ? '#b48c62' : '#86643f', sag: 0, w: 5 });
    this.bfs = []; for (let i = 0; i < this.N_BF; i++) this.bfs.push({ on: false, x: 0, y: 0, vx: 0, vy: 0, t0: 0, col: this.COLS[i % 6], s: 1, ph: i * 0.37 });
    this.boops = []; for (let i = 0; i < 16; i++) this.boops.push({ on: false, x: 0, y: 0, t0: 0 });
    this.an = Pupo.newAnchors();
    this.cand = []; this.candD = new Float32Array(64);
  },
  /* the targets: every non-boss enemy overlapping the view grown by 1 tile, nearest first, at most 16 (the rest stunned 3 s) */
  begin(g, p) {
    this.init();
    const K = PupoPower.K, cx = p.cx, cy = p.cy, x0 = g.camX - K.VIEW_PAD, y0 = g.camY - K.VIEW_PAD, x1 = g.camX + Game.viewW + K.VIEW_PAD, y1 = g.camY + Game.viewH + K.VIEW_PAD;
    const C = this.cand, D = this.candD; C.length = 0;
    for (const e of g.entities) {
      if (e.remove || e.dead || e.boss || !e.enemy || e.friendT || e.friendly || this.isShot(e)) continue;
      if (e.x + e.w < x0 || e.x > x1 || e.y + e.h < y0 || e.y > y1) continue;
      const d = (e.x + e.w / 2 - cx) * (e.x + e.w / 2 - cx) + (e.y + e.h / 2 - cy) * (e.y + e.h / 2 - cy);
      // insertion into the sorted candidate list (no sort, no closures)
      let i = C.length; if (i >= 64) continue; C.push(e);
      while (i > 0 && D[i - 1] > d) { C[i] = C[i - 1]; D[i] = D[i - 1]; i--; }
      C[i] = e; D[i] = d;
    }
    const T = this.targets; T.length = 0;
    for (let i = 0; i < C.length; i++) { if (i < K.MAX) T.push(C[i]); else if (C[i].stun) C[i].stun(K.STUN_OVER); else C[i].stunT = K.STUN_OVER; }
    C.length = 0;
    this.n = T.length; this.hitDone = false; this.tier = PupoPower.tier(); this.calm = PupoPower.calm(); this.tongue = 0; this.ground = p.onGround || !!(g.pupo.mode === 'climb');
    for (let i = 0; i < this.n; i++) { const e = T[i]; this.tx[i] = e.x + e.w / 2; this.ty[i] = e.y + e.h * 0.55; }
    // the arms: one per target up to the tier's count (at least 5, so it is always a startled tangle)
    const tr = this.TIERS[this.tier], nA = Math.min(tr.arms, Math.max(5, this.n));
    for (let i = 0; i < this.N_ARMS; i++) {
      const a = this.arms[i]; a.on = i < nA; if (!a.on) continue;
      // every which way: the angle to its target, or a jumble of directions (never a symmetric fan)
      a.tgt = i < this.n ? i : -1;
      a.ang = a.tgt >= 0 ? Math.atan2(this.ty[i] - (p.y + p.h * 0.4), this.tx[i] - p.cx) : -Math.PI / 2 + ((i * 2.399) % TAU) - 1.2;
      // it sprouts from his back and sides (around the upper body), the stub sticks out its own way, never a fan
      const oa = -0.15 - ((i * 0.618) % 1) * 2.85; a.ox = Math.cos(oa) * 13; a.oy = -30 + Math.sin(oa) * 15;
      a.sa = oa + (((i * 0.383) % 1) - 0.5) * 1.4;
      a.born = 0.30 + i * 0.035; a.shoot = 1.00 + (i % tr.arms) * 0.03; a.len = 0; a.sag = ((i * 7) % 5 - 2) * 3; a.w = 4.5 + (i % 3) * 0.6;
      a.tx = a.tgt >= 0 ? this.tx[i] : p.cx + Math.cos(a.ang) * 2.2 * TS; a.ty = a.tgt >= 0 ? this.ty[i] : p.y + p.h * 0.4 + Math.sin(a.ang) * 2.2 * TS;
    }
    for (const b of this.bfs) b.on = false;
    for (const b of this.boops) b.on = false;
    // projectiles on screen turn into butterflies
    let k = 24;
    for (const e of g.entities) {
      if (e.remove || !this.isShot(e)) continue;
      if (e.x + e.w < x0 || e.x > x1 || e.y + e.h < y0 || e.y > y1) continue;
      e.remove = true; if (k < this.N_BF) { const b = this.bfs[k++]; b.on = true; b.x = e.x + e.w / 2; b.y = e.y + e.h / 2; b.vx = 0; b.vy = -2 * TS; b.t0 = 0; b.s = 1; }
    }
    // friends giggle and are not harmed
    for (const e of g.entities) if (e.friendT && !e.remove && e.x + e.w > x0 && e.x < x1 && e.y + e.h > y0 && e.y < y1) g.parts.text(e.cx, e.y - 8, 'HEE HEE', '#ffffff');
  },
  isShot(e) { return (typeof Shot !== 'undefined' && e instanceof Shot) || (typeof BassBall !== 'undefined' && e instanceof BassBall); },
  // the belly button in the world (the art's anchor, scaled and mirrored)
  bellyX: 0, bellyY: 0, mouthX: 0, mouthY: 0,
  anchorsNow(g, p, t) {
    const o = g.pupo.draw, S = PupoRide.ART * this.BIG, f = p.facing, an = Pupo.anchors('rear', t, this.an); this.sc = this.BIG;
    this.bellyX = o.x + f * an.belly.x * S; this.bellyY = o.y + an.belly.y * S;
    this.mouthX = o.x + f * an.mouth.x * S; this.mouthY = o.y + an.mouth.y * S;
    this.eyeLX = o.x + f * an.eyeL.x * S; this.eyeLY = o.y + an.eyeL.y * S; this.eyeRX = o.x + f * an.eyeR.x * S; this.eyeRY = o.y + an.eyeR.y * S; this.eyeR = an.eyeR_r * S;
  },
  update(g, t0, t, dt) {
    const tr = this.TIERS[this.tier], p = g.player;
    this.anchorsNow(g, p, t);
    // the butterflies: three bursts of a third each at 1.20, 1.35 and 1.50 s, from his belly button
    const nb = this.calm ? 6 : tr.bf, per = Math.ceil(nb / 3);
    for (let k = 0; k < 3; k++) {
      const at = 1.20 + k * 0.15;
      if (t0 < at && t >= at) for (let i = k * per; i < Math.min(nb, (k + 1) * per); i++) {
        const b = this.bfs[i], a = -Math.PI / 2 + ((i * 1.7) % 2.4) - 1.2, sp = (this.calm ? 1.5 : 3 + (i * 0.37) % 3) * TS;
        b.on = true; b.x = this.bellyX; b.y = this.bellyY; b.vx = Math.cos(a) * sp * (p.facing || 1) * 0.8; b.vy = Math.sin(a) * sp - (this.calm ? 0.5 * TS : 0); b.t0 = at; b.s = 1;
      }
    }
    for (let i = 0; i < this.N_BF; i++) {
      const b = this.bfs[i]; if (!b.on) continue;
      b.x += (b.vx + Math.sin((t + b.ph) * 3) * 0.6 * TS) * dt; b.y += b.vy * dt;
      b.s = clamp((2.4 - t) / 0.5, 0, 1);
      if (t > 2.4) b.on = false;
    }
    // the boops land: a belly-button dot on every target and a white ink ring growing in it
    for (let i = 0; i < this.n; i++) {
      const tAt = this.boopAt(i, tr);
      if (t0 < tAt && t >= tAt) { const B = this.boops[i]; B.on = true; this.targets[i].pupoBoop = tAt; B.x = this.tx[i]; B.y = this.ty[i]; B.t0 = tAt; if (i % 4 === 0) { this.sfxO.pitch = 0.55 + i * 0.03; PupoRide.sfx('pupoBoop', 'pick', this.sfxO); } }
    }
    // the pop at 1.60: the hits are applied here
    if (!this.hitDone && t >= 1.60) { this.hitDone = true; this.pop(g, tr); }
  },
  // when target i is booped: rounds of the tier's arm count, 0.03 s apart, 0.12 s to arrive; later rounds at 1.25 s
  boopAt(i, tr) { const r = Math.floor(i / tr.arms), j = i % tr.arms; return (r === 0 ? 1.00 : 1.25) + j * 0.03 + 0.12; },
  pop(g, tr) {
    const K = PupoPower.K, src = g.player; let chain = 0;
    for (let i = 0; i < this.n; i++) {
      const e = this.targets[i]; if (!e || e.remove || e.dead) continue;
      const x = e.x + e.w / 2, y = e.y + e.h / 2;
      const r = e.hit('pupoPower', src);
      if (r === true || (r && r !== 'bounce')) {
        // 200 x the chain (no extra lives: the chain table's 1-UPs are for stomps)
        chain++; g.addScore(200 * chain, x, y); g.burst(x, y, 14, '#ffd84a', 'confetti');
        if (typeof GearCoin !== 'undefined') g.spawn(new GearCoin(g, x, y - 6));
      } else if (e.stun) e.stun(K.STUN_NO); else e.stunT = K.STUN_NO;
    }
    if (tr.shake && !this.calm) g.shake(tr.shake);
    Sound.play('kick', { vol: 0.5, pitch: 0.8 });
  },
  finish(g) { const T = this.targets; if (T) { for (let i = 0; i < T.length; i++) T[i].pupoBoop = 0; T.length = 0; } this.n = 0; for (const a of this.arms || []) a.on = false; for (const b of this.bfs || []) b.on = false; for (const b of this.boops || []) b.on = false; },

  /* ---------- drawing in the world (after the inked body): the arms, the eyes, the carpet tongue, boops, butterflies ---------- */
  draw(ctx, p, g, R, t) {
    if (!(R.showT > 0)) return;
    const st = R.showT, tr = this.TIERS[this.tier], f = p.facing || 1, calm = this.calm, bx = p.cx, by = p.y + p.h;
    this.anchorsNow(g, p, t);
    // the tongue, behind the arms
    this.drawTongue(ctx, p, st, tr, f);
    // the arms: sprout 0.30-0.70 (a stub toward the target), shoot to it 1.00-1.40, snap back 1.80-2.30 with one overshoot
    const wav = calm ? 0 : Math.sin(st * TAU * 3);
    for (let i = 0; i < this.N_ARMS; i++) {
      const a = this.arms[i]; if (!a.on || st < a.born) continue;
      const sc = this.sc, ox = bx + a.ox * f * sc, oy = by + a.oy * sc;
      // the target this arm is on now (a second round takes targets 13-16 after the first boop)
      let ti = a.tgt; if (ti >= 0 && this.n > tr.arms && st > 1.25 && i + tr.arms < this.n) ti = i + tr.arms;
      const txx = ti >= 0 ? this.tx[ti] : a.tx, tyy = ti >= 0 ? this.ty[ti] : a.ty;
      // the stub: 1.3 tiles out its own way (wiggling), then the tip travels to the target, then snaps back to the stub
      const sprout = Math.min(1, (st - a.born) / 0.12), stub = 1.3 * TS * easeInOut(sprout);
      const sx2 = ox + Math.cos(a.sa) * f * stub, sy2 = oy + Math.sin(a.sa) * stub;
      let k = 0;
      if (st >= a.shoot && st < 1.80) k = Math.min(1, (st - a.shoot) / 0.12);
      if (st >= 1.25 && ti !== a.tgt && ti >= 0 && st < 1.80) k = Math.min(1, (st - 1.25 - (i % tr.arms) * 0.03) / 0.12);
      if (st >= 1.80) {
        // back like a tape measure: to the stub, past it once, and in
        const q = clamp((st - 1.80) / 0.5, 0, 1); k = q < 0.5 ? 1 - q / 0.5 : 0;
        if (q >= 0.5) { const r = (q - 0.5) / 0.5, L = stub * (1 - r) + Math.sin(r * Math.PI) * 6; if (L < 2) continue; this.armTip(ctx, a, ox, oy, ox + Math.cos(a.sa) * f * L, oy + Math.sin(a.sa) * L, t, wav, i, 0); continue; }
      }
      if (stub < 2) continue;
      const hx = sx2 + (txx - sx2) * k, hy = sy2 + (tyy - sy2) * k, D = Math.hypot(hx - ox, hy - oy);
      // a long arm bows into an arc (alternately up and down), so the tangle reads as noodles, not poles
      this.armTip(ctx, a, ox, oy, hx, hy, t, wav, i, D * 0.16 * (i % 2 ? 1 : -1));
    }
    // the spiral eyes: 0.55-1.00 they spin up, back to his eyes with a slow blink after 1.80
    if (st > 0.55 && st < 2.30) {
      const k = Math.min(1, (st - 0.55) / 0.2) * (st > 2.0 ? Math.max(0, 1 - (st - 2.0) / 0.3) : 1), r = Math.max(4.5, this.eyeR * 1.35) * k, ang = calm ? 0.6 : st * 0.6 * TAU;
      if (r > 1) { Pupo.spiralEye(ctx, this.eyeLX, this.eyeLY, r, ang, tr.bands); Pupo.spiralEye(ctx, this.eyeRX, this.eyeRY, r, ang + 1, tr.bands); }
    }
    // the boops: a belly-button dot and a white ink ring growing 0 -> 14 px over 0.2 s
    for (let i = 0; i < this.n; i++) {
      const B = this.boops[i]; if (!B.on || st > 1.62) continue;
      const k = clamp((st - B.t0) / 0.2, 0, 1), r = 14 * k;
      ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(B.x, B.y, 2.6, 0, TAU); ctx.fill();
      if (r > 0.5) { ctx.lineWidth = 3.4; ctx.strokeStyle = '#1c1426'; ctx.beginPath(); ctx.arc(B.x, B.y, r, 0, TAU); ctx.stroke(); ctx.lineWidth = 1.8; ctx.strokeStyle = '#ffffff'; ctx.stroke(); }
    }
    // the butterflies (flat wings, ink outlines, a 6 Hz flap; they shrink away, never fade)
    for (let i = 0; i < this.N_BF; i++) { const b = this.bfs[i]; if (!b.on || b.s <= 0.02) continue; Pupo.butterfly(ctx, b.x, b.y, 1.05 * b.s, (calm ? st * 0.5 : st * 1.346) + b.ph, b.col); }
  },
  armO: { w: 5, col: '#b48c62', t: 0, point: true, sag: 0, handScale: 1 },
  armTip(ctx, a, x0, y0, x1, y1, t, wav, i, bow) {
    const O = this.armO; O.w = a.w * this.sc; O.col = a.col; O.t = t; O.point = true; O.sag = bow + a.sag + wav * 4 * (i % 2 ? 1 : -1); O.handScale = 0.95 * this.sc;
    Pupo.arm(ctx, x0, y0, x1, y1, O);
  },
  sc: 1, sfxO: { pitch: 1, vol: 0.4 },
  // the carpet tongue: 6 tiles at 10 t/s from 0.70 s; along the floor in front of him, or straight down in mid-air; it rolls
  // back up from 1.80 to 2.30; drawn in slices of the cached rug strip, with an ink edge and a rolled cylinder at the front
  drawTongue(ctx, p, st, tr, f) {
    if (st < 0.70 || st > 2.30) return;
    const full = 6 * TS, Lr = st < 1.80 ? Math.min(full, (st - 0.70) * 10 * TS) : full * (1 - clamp((st - 1.80) / 0.5, 0, 1));
    if (Lr < 2) return;
    const rug = this.rugCanvas(tr.rug), w = 16, mx = this.mouthX, my = this.mouthY;
    if (this.ground) {
      // down from the mouth to the floor, then forward along it
      const fy = p.y + p.h - w / 2 - 1, drop = Math.max(4, fy - my), l1 = Math.min(Lr, drop), l2 = Lr - l1;
      this.rugSeg(ctx, rug, mx, my, Math.PI / 2, l1, w, 0, full);
      if (l2 > 0) this.rugSeg(ctx, rug, mx, fy, f > 0 ? 0 : Math.PI, l2, w, l1, full);
      const ex = mx + f * l2, ey = l2 > 0 ? fy : my + l1;
      if (Lr < full - 1) this.roll(ctx, ex, ey, w, st); else if (l2 > 0) this.fringe(ctx, ex, ey, f, w);
    } else {
      this.rugSeg(ctx, rug, mx, my, Math.PI / 2, Lr, w, 0, full);
      if (Lr < full - 1) this.roll(ctx, mx, my + Lr, w, st);
    }
  },
  // one straight piece of rug: from (x, y) along angle a for len px, showing the strip from u0 (px along the full rug)
  rugSeg(ctx, rug, x, y, a, len, w, u0, full) {
    const sw = rug.width, sx = u0 / full * sw, sl = Math.max(1, len / full * sw);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    ctx.fillStyle = '#1c1426'; ctx.fillRect(-1.5, -w / 2 - 1.5, len + 3, w + 3);
    ctx.drawImage(rug, sx, 0, Math.min(sl, sw - sx), rug.height, 0, -w / 2, len, w);
    ctx.restore();
  },
  roll(ctx, x, y, w, st) {
    const r = w * 0.62;
    ctx.fillStyle = '#1c1426'; ctx.beginPath(); ctx.arc(x, y, r + 1.6, 0, TAU); ctx.fill();
    ctx.fillStyle = '#c8323e'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#ffe9b8'; ctx.lineWidth = 1.4; ctx.beginPath();
    for (let k = 0; k <= 14; k++) { const a = k * 0.55 + st * 9, rr0 = r * (0.15 + k / 16); if (k) ctx.lineTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); else ctx.moveTo(x + Math.cos(a) * rr0, y + Math.sin(a) * rr0); }
    ctx.stroke();
  },
  fringe(ctx, x, y, f, w) {
    ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 2.6; ctx.beginPath();
    for (let k = -3; k <= 3; k++) { const yy = y + k * w / 7; ctx.moveTo(x, yy); ctx.lineTo(x + f * 5, yy); }
    ctx.stroke(); ctx.strokeStyle = '#fff0d0'; ctx.lineWidth = 1.2; ctx.stroke();
  },
  /* the rug strip, drawn once per look (256 x 48): HIGH a deep red field, a cream border band with a zigzag and three navy-and-gold
     medallions; MEDIUM the border and two medallions; LOW two plain stripes */
  rugs: [null, null, null],
  rugCanvas(k) {
    if (this.rugs[k]) return this.rugs[k];
    const c = makeCanvas(256, 48), x = c.getContext('2d');
    x.fillStyle = '#b8283a'; x.fillRect(0, 0, 256, 48);
    if (k === 2) { x.fillStyle = '#f2e2c0'; x.fillRect(0, 8, 256, 6); x.fillRect(0, 34, 256, 6); }
    else {
      x.fillStyle = '#f2e2c0'; x.fillRect(0, 3, 256, 9); x.fillRect(0, 36, 256, 9);
      if (k === 0) { x.strokeStyle = '#8a1e2a'; x.lineWidth = 2; for (const y0 of [3, 36]) { x.beginPath(); for (let u = 0; u <= 256; u += 8) x.lineTo(u, y0 + ((u / 8) % 2 ? 1.5 : 7.5)); x.stroke(); } }
      const meds = k === 0 ? 3 : 2;
      for (let i = 0; i < meds; i++) {
        const cx = 256 * (i + 0.5) / meds, cy = 24;
        x.fillStyle = '#1e3a8a'; x.beginPath(); x.moveTo(cx - 22, cy); x.lineTo(cx, cy - 10); x.lineTo(cx + 22, cy); x.lineTo(cx, cy + 10); x.closePath(); x.fill();
        x.fillStyle = '#ffc83a'; x.beginPath(); x.moveTo(cx - 13, cy); x.lineTo(cx, cy - 6); x.lineTo(cx + 13, cy); x.lineTo(cx, cy + 6); x.closePath(); x.fill();
        x.fillStyle = '#1e3a8a'; x.beginPath(); x.arc(cx, cy, 2.6, 0, TAU); x.fill();
      }
    }
    this.rugs[k] = c; return c;
  },

  /* ---------- the screen: the letterbox and "PUPO POWER!" (CSS px; drawn under the HUD) ---------- */
  screen(ctx, play) {
    const R = play.pupo; if (!R || !(R.showT > 0)) return;
    const st = R.showT, tr = this.TIERS[this.tier], calm = this.calm, gr = Game.gameRect, W = gr.w, H = gr.h;
    // two solid ink bars slide in from the top and bottom (8 % of the view each) and out at the end
    if (tr.box) {
      const bh = H * 0.08, k = calm ? (st < 2.3 ? 1 : 0) : st < 0.15 ? st / 0.15 : st > 2.3 ? Math.max(0, 1 - (st - 2.3) / 0.15) : 1;
      ctx.fillStyle = '#1c1426'; ctx.fillRect(gr.x, gr.y - bh + bh * k, W, bh); ctx.fillRect(gr.x, gr.y + H - bh * k, W, bh);
    }
    if (st < 1.0) return;
    const txt = this.textCanvas(W), cw = txt.width / Game.dpr, ch = txt.height / Game.dpr;
    let s = 1, y = gr.y + H * 0.30;
    if (calm) s = 0.6 + 0.4 * Math.min(1, (st - 1.0) / 0.3);
    else { const k = (st - 1.0) / 0.18; s = k >= 1 ? 1 : k < 0.65 ? 1.6 - 0.7 * (k / 0.65) : 0.9 + 0.1 * ((k - 0.65) / 0.35); }
    if (st > 2.3) y += (st - 2.3) / 0.3 * (H * 0.75);
    const x = gr.x + W / 2;
    if (tr.bob && !calm && st > 1.18 && st < 2.3) {
      // each letter bobs 2 px at 2 Hz, a quarter turn apart
      const d = Game.dpr, x0 = x - cw / 2;
      for (let i = 0; i < this.nL; i++) { const sx = this.lx[i], sw = this.lw[i]; if (sw <= 0) continue; ctx.drawImage(txt, sx * d, 0, sw * d, txt.height, x0 + sx, y - ch / 2 + Math.sin(st * TAU * 2 + i * 0.8) * 2, sw, ch); }
    } else ctx.drawImage(txt, x - cw * s / 2, y - ch * s / 2, cw * s, ch * s);
  },
  // "PUPO POWER!" drawn once into a canvas at 80 % of the view's width (rebuilt only when the resolution changes); the letters'
  // positions are kept so the letter bob draws slices of the same canvas
  textW: 0, textDpr: 0, text: null, lx: new Float32Array(12), lw: new Float32Array(12), nL: 0,
  textCanvas(W) {
    const dpr = Game.dpr, tw = Math.round(W * 0.8);
    if (this.text && this.textW === tw && this.textDpr === dpr) return this.text;
    const str = 'PUPO POWER!', pad = 12, x = makeCanvas(4, 4).getContext('2d');
    x.font = `100px ${FONT_DISPLAY}`; const w100 = Math.max(1, x.measureText(str).width), size = Math.max(12, Math.floor(100 * (tw - 2 * pad) / w100));
    x.font = `${size}px ${FONT_DISPLAY}`;
    const tw2 = x.measureText(str).width, ch = Math.round(size * 1.25) + pad * 2, cw = Math.ceil(tw2) + pad * 2;
    const c = makeCanvas(Math.ceil(cw * dpr), Math.ceil(ch * dpr)), y = c.getContext('2d');
    y.setTransform(dpr, 0, 0, dpr, 0, 0); y.font = `${size}px ${FONT_DISPLAY}`; y.textBaseline = 'middle'; y.lineJoin = 'round';
    const lw = Math.max(4, size * 0.09), dr = Math.max(3, size * 0.06);
    // a solid darker drop down-right, a black outline, the yellow face
    y.lineWidth = lw * 2; y.strokeStyle = '#1c1426'; y.strokeText(str, pad + dr, ch / 2 + dr); y.fillStyle = '#c27a00'; y.fillText(str, pad + dr, ch / 2 + dr);
    y.strokeText(str, pad, ch / 2); y.fillStyle = '#ffd84a'; y.fillText(str, pad, ch / 2);
    // where each letter sits (for the bob)
    let acc = 0; this.nL = str.length;
    for (let i = 0; i < str.length; i++) { const adv = x.measureText(str.slice(0, i + 1)).width; this.lx[i] = i === 0 ? 0 : pad + acc; this.lw[i] = (i === 0 ? pad : 0) + adv - acc + (i === str.length - 1 ? pad : 0); acc = adv; }
    this.text = c; this.textW = tw; this.textDpr = dpr;
    return c;
  }
};

/* ---------- the button (touch), the keys, the HUD meter (keyboard) ---------- */
const PupoButton = {
  hud: [{ id: 'pupo', x: 0, y: 0, r: 30 }],
  // where the power-picker chip would be (it is hidden while riding), a little larger
  place() {
    const c = typeof TourPicker !== 'undefined' ? TourPicker.chip() : null, L = Input.layout; if (!c || !L) return null;
    const b = this.hud[0]; b.x = c.x; b.y = c.y; b.r = clamp(L.r * 0.62, 22, 34);
    if (L.portrait) b.y = Math.max(Game.gameRect.y + Game.gameRect.h + b.r + 6, b.y);
    return b;
  },
  // re-asserted every frame while riding; cleared (only if it is ours) otherwise
  sync(play) {
    const show = play && play.player && play.player.pupoRide && play.state === 'play' && !play.paused;
    if (show) { if (this.place()) Input.hud = this.hud; }
    else if (Input.hud === this.hud) Input.hud = null;
  },
  ring(ctx, x, y, r, k, shake) {
    const n = 10; ctx.lineCap = 'butt';
    for (let i = 0; i < n; i++) {
      const a0 = -Math.PI / 2 + i * TAU / n + 0.07, a1 = a0 + TAU / n - 0.14, f = clamp(k * n - i, 0, 1);
      ctx.strokeStyle = '#1c1426'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x + shake, y, r, a0, a1); ctx.stroke();
      if (f > 0) { ctx.strokeStyle = f >= 1 ? '#ffd84a' : '#8a7a3a'; ctx.lineWidth = 3.2; ctx.beginPath(); ctx.arc(x + shake, y, r, a0, a0 + (a1 - a0) * f); ctx.stroke(); }
    }
  },
  draw(ctx) {
    const play = Game.scene; if (!(play instanceof Play) || !play.player || !play.player.pupoRide || !play.pupo || play.state !== 'play' || play.paused) return;
    const b = this.place(); if (!b) return;
    const R = play.pupo, full = R.meter >= 1, t = play.t, shake = R.ringShake > 0 ? Math.sin(R.ringShake * 60) * 3 : 0;
    const s = full && !(R.showT > 0) ? 1 + 0.03 * (1 + Math.sin(t * TAU * 1.2)) : Input.hudHeld.pupo ? 0.92 : 1;
    ctx.save(); ctx.translate(b.x, b.y); ctx.scale(s, s);
    ctx.fillStyle = full ? 'rgba(60,34,10,0.85)' : 'rgba(14,10,26,0.62)'; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.6; ctx.stroke();
    this.ring(ctx, 0, 0, b.r - 4, R.meter, shake);
    // Pupo's face (spiral eyes when it is full)
    Pupo.head(ctx, 0, 1, b.r / 12.5, t, full ? 'spiral' : 'calm', t * 0.6 * TAU);
    ctx.restore();
    // the first time ever: a label over it
    const tips = Save.data.tips || {};
    if (full && !tips.pupoReady) { tips.pupoReady = true; Save.data.tips = tips; play.pupoReadyT = 4; }
    if (play.pupoReadyT > 0 && typeof TourPicker !== 'undefined') TourPicker.label(ctx, 'TAP PUPO!', b.x, b.y - b.r - 16 + Math.sin(t * 4) * 2, clamp(Math.min(play.pupoReadyT, 4 - play.pupoReadyT) * 2, 0, 1), true);
  },
  // keyboard / gamepad players: the same ring around a 12 px Pupo face, with the key letter, bottom left of the game view
  hudIcon(ctx, play) {
    if (Input.usingTouch || Game.forceTouchUI) return;
    const p = play.player; if (!p || !p.pupoRide || !play.pupo) return;
    const R = play.pupo, gr = Game.gameRect, x = gr.x + Math.max(26, insets.l + 20), y = gr.y + gr.h - 28, full = R.meter >= 1, shake = R.ringShake > 0 ? Math.sin(R.ringShake * 60) * 2 : 0;
    ctx.save();
    ctx.fillStyle = 'rgba(10,8,18,0.6)'; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill();
    this.ring(ctx, x, y, 14, R.meter, shake);
    Pupo.head(ctx, x, y + 1, 1.0, play.t, full ? 'spiral' : 'calm', play.t * 0.6 * TAU);
    ctx.fillStyle = full ? '#ffd84a' : 'rgba(255,255,255,0.7)'; ctx.font = `9px ${FONT_DISPLAY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('F', x + 19, y + 11);
    ctx.restore();
    if (full && !(Save.data.tips || {}).pupoReady) { (Save.data.tips = Save.data.tips || {}).pupoReady = true; play.pupoReadyT = 4; }
    if (play.pupoReadyT > 0 && typeof TourPicker !== 'undefined') TourPicker.label(ctx, 'PRESS F: PUPO POWER!', x + 60, y - 26, clamp(Math.min(play.pupoReadyT, 4 - play.pupoReadyT) * 2, 0, 1), true);
  }
};
window.addEventListener('keydown', e => { if (Input.mode === 'game' && (e.code === 'KeyF' || e.code === 'KeyL')) PupoPower.key = true; });

/* ---------- wiring ---------- */
{
  const G = Play.prototype;
  // the frozen world during the show; the button, the keys and the ring's shake otherwise
  const u0 = G.update;
  G.update = function (dt) {
    const R = this.pupo;
    if (R && R.showT > 0 && !this.paused && this.level && this.level.tour) {
      if (this.fade.a !== this.fade.target) this.fade.a = approach(this.fade.a, this.fade.target, dt * this.fade.speed);
      PupoPower.step(this, dt); PupoPower.key = false; return;
    }
    if (this.level && this.level.tour && !this.paused) {
      PupoButton.sync(this);
      if (R) { if (R.ringShake > 0) R.ringShake -= dt; if (this.pupoReadyT > 0) this.pupoReadyT -= dt; }
      if ((Input.hudPressed.pupo || PupoPower.key) && this.player && this.player.pupoRide) { Input.hudPressed.pupo = false; PupoPower.key = false; PupoPower.press(this); if (R && R.showT > 0) return; }
    }
    PupoPower.key = false;
    return u0.call(this, dt);
  };
  // the screen part of the show goes under the HUD; the keyboard meter over it
  const dh0 = G.drawHUD;
  G.drawHUD = function (ctx) { PupoPowerFx.screen(ctx, this); const r = dh0.call(this, ctx); if (this.level && this.level.tour) PupoButton.hudIcon(ctx, this); return r; };
  // the button is drawn with the touch controls (Input.hud buttons are hit-tested, never drawn by Input)
  const ov0 = Input.overlay;
  Input.overlay = (ctx, L) => { if (ov0) ov0(ctx, L); PupoButton.draw(ctx); };
  // the show's pose: Pupo rears up on his hind legs, Brady clings to his scruff, legs flying
  PupoRide.modes.power = {
    update(p, dt, inp, g, R) {},
    pose(p, R, o) { const k = Math.min(1, R.showT / 0.3); o.pose = 'rear'; o.big = 1 + (PupoPowerFx.BIG - 1) * k; o.x = p.cx - p.facing * 4; o.y = p.y + p.h; o.armsOff = true; o.still = true; o.rider = null; o.boxX = o.x - 70; o.boxW = 140; o.boxY = o.y - 140; o.boxH = 146; o.moodX = 'spiral'; return o; }
  };
  const ps0 = PupoRide.pose;
  PupoRide.pose = function (p, R) {
    if (R.showT > 0) { const o = R.draw; o.rot = 0; o.spiral = R.showT * 0.6 * TAU; return PupoRide.modes.power.pose(p, R, o); }
    return ps0.call(this, p, R);
  };
  const pr0 = PupoRide.paintRide;
  PupoRide.paintRide = function (c) {
    const p = this.cur, R = p.g.pupo;
    if (R.showT > 0) {
      // Brady first, behind the head, his hands in Pupo's scruff (drawn in Pupo's art space)
      const o = R.draw, bg = o.big || 1; c.save(); c.translate(o.x, o.y); c.scale(this.ART * (o.facing || 1), this.ART);
      const a = p.anim, st = a.state; a.state = 'hang'; this.paintRider(c, -10 * bg, -66 * bg); a.state = st; c.restore();
      Pupo.draw(c, o); return;
    }
    return pr0.call(this, c);
  };
  // a booped target squashes and giggles (a quick wobble about its feet) until the pop (TourHooks.entityDraw)
  TourHooks.on('entityDraw', (play, ctx, e) => {
    const R = play.pupo; if (!e.pupoBoop || !R || !(R.showT > 0)) return false;
    const k = Math.sin((R.showT - e.pupoBoop) * TAU * 5) * 0.14 * Math.max(0, 1 - (R.showT - e.pupoBoop) / 0.6), fx = e.x + e.w / 2, fy = e.y + e.h;
    ctx.translate(fx, fy); ctx.scale(1 + k, 1 - k); ctx.translate(-fx, -fy); e.draw(ctx, play.t); return true;
  });
  // the show's world part, after the inked body; the post-power shield stars are drawn by PupoRide.drawStatus
  PupoRide.overs.push((ctx, p, g, R, t) => PupoPowerFx.draw(ctx, p, g, R, t));
  // a hit during the show is impossible (the world is frozen); the shield after it is PupoRide's R.shieldT / powerShield
}
try { window.BRADY_PUPO = Object.assign(window.BRADY_PUPO || {}, { PupoPower, PupoPowerFx, PupoButton }); } catch (e) { /* not in a browser */ }
