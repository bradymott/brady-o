/* ============================================================
   ART CART — the Career / Battle Royale / secret-level screens of the home
   menu (KartMenuScene, 43_cart_f_menu.js dispatches to layout_<state>,
   draw_<state>, over_<state>): QUICK RACE, the run map (13 stages, each with
   its level's car), the secret levels and their three games, the garage
   (stat points), the prize screen and the "game won with this car"
   celebration. Car thumbnails are rendered once in 3D into a 2D atlas.
   ============================================================ */
const CART_NO_STAGE = { run: 1, secret: 1, secretGames: 1 };   // full-screen grids: no showroom behind them
const CART_TXT_CU = { ui: true, stroke: false };
// a stat pip: -1 empty, 0 the car's own, 1 the driver's point (outlined, with a dot), 2 a stat point (white-hot, ringed in the stat's colour)
function cartPip(ctx, x, y, w, h, kind, col) {
  ctx.fillStyle = kind === 0 ? col : kind === 1 ? 'rgba(255,255,255,0.16)' : kind === 2 ? '#ffffff' : 'rgba(255,255,255,0.14)';
  burnsRR(ctx, x, y, w, h, 4); ctx.fill();
  if (kind === 2) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); }
  else if (kind === 1) {   // the driver's point: an outlined pip with a dot (the driver's "seat")
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; burnsRR(ctx, x + 0.8, y + 0.8, w - 1.6, h - 1.6, 3.5); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.22, 0, TAU); ctx.fill();
  }
}
function cartLockIcon(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
  ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.6, s * 0.22); ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.42, Math.PI, 0); ctx.stroke();
  ctx.fillStyle = col; burnsRR(ctx, -s * 0.62, -s * 0.15, s * 1.24, s * 0.95, s * 0.18); ctx.fill();
  ctx.fillStyle = 'rgba(20,10,30,0.85)'; ctx.beginPath(); ctx.arc(0, s * 0.25, s * 0.14, 0, TAU); ctx.fill();
  ctx.restore();
}
function cartCheckIcon(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#0a2a12'; ctx.lineWidth = Math.max(2, s * 0.28); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-s * 0.45, 0); ctx.lineTo(-s * 0.1, s * 0.38); ctx.lineTo(s * 0.5, -s * 0.38); ctx.stroke(); ctx.restore();
}
// the Man: a neon stick figure, arms up; burning, he flickers orange with flames licking up
function cartManIcon(ctx, x, y, s, t, burn) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const col = burn ? '#ffb040' : '#38f2ff';
  ctx.shadowColor = col; ctx.shadowBlur = s * 0.4; ctx.strokeStyle = col; ctx.lineWidth = Math.max(2, s * 0.09);
  ctx.beginPath(); ctx.moveTo(-s * 0.28, s * 0.95); ctx.lineTo(0, s * 0.25); ctx.lineTo(s * 0.28, s * 0.95);
  ctx.moveTo(0, s * 0.25); ctx.lineTo(0, -s * 0.45); ctx.moveTo(-s * 0.5, -s * 0.8); ctx.lineTo(0, -s * 0.35); ctx.lineTo(s * 0.5, -s * 0.8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.16, -s * 0.5); ctx.lineTo(0, -s * 0.78); ctx.lineTo(s * 0.16, -s * 0.5); ctx.closePath(); ctx.stroke();
  if (burn) for (let i = 0; i < 7; i++) { const fx = (i - 3) * s * 0.16, h = s * (0.35 + 0.25 * Math.abs(Math.sin(t * 7 + i * 1.7))); ctx.fillStyle = i % 2 ? 'rgba(255,200,60,0.8)' : 'rgba(255,90,30,0.75)'; ctx.beginPath(); ctx.moveTo(fx - s * 0.1, s); ctx.quadraticCurveTo(fx, s - h * 2, fx + s * 0.1, s); ctx.fill(); }
  ctx.restore();
}

// a soft rotating sunburst (behind a medal)
function cartSunburst(ctx, x, y, r, t, col, a) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.4); ctx.globalAlpha = a; ctx.fillStyle = col;
  for (let i = 0; i < 12; i++) { const b = i / 12 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, b - 0.09, b + 0.09); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// a four-point twinkle
function cartTwinkle(ctx, x, y, s, col) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath();
  ctx.moveTo(0, -s); ctx.quadraticCurveTo(0, 0, s, 0); ctx.quadraticCurveTo(0, 0, 0, s); ctx.quadraticCurveTo(0, 0, -s, 0); ctx.quadraticCurveTo(0, 0, 0, -s); ctx.fill(); ctx.restore();
}
// a five-point star with an outline
function cartStar(ctx, x, y, r, col, edge) {
  ctx.save(); ctx.translate(x, y); ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.fillStyle = col; ctx.fill(); if (edge) { ctx.strokeStyle = edge; ctx.lineWidth = 1.4; ctx.stroke(); } ctx.restore();
}
/* the 3D celebration on the showroom stage (prize and game-won screens): fireworks behind the podium, stage spotlights,
   and (game won) the Man standing tall and glowing behind it. Pooled; nothing allocated per frame. */
const CART_CELEB = { fw: [], dirs: [], cols: [], man: null, next: 0, p: [0, 0, 0], gold: [1, 0.8, 0.3], fire: [1, 0.5, 0.18], white: [1, 1, 1] };
(function () { const n = 26; for (let i = 0; i < n; i++) { const y = 1 - (i + 0.5) / n * 2, r = Math.sqrt(1 - y * y), a = i * 2.39996; CART_CELEB.dirs.push([Math.cos(a) * r, y, Math.sin(a) * r]); } for (let i = 0; i < 6; i++) CART_CELEB.fw.push({ live: false, x: 0, y: 0, z: 0, t: 0, r: 6, c: 0 }); })();
Object.assign(KartMenuScene.prototype, {
  /* ---------- shared bits ---------- */
  mapBackdrop(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0418'); g.addColorStop(0.62, '#2a0c3a'); g.addColorStop(0.86, '#6a1e4a'); g.addColorStop(1, '#a8402a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const st = this._stars || (this._stars = (() => { const r = mulberry32(5), a = []; for (let i = 0; i < 70; i++) a.push([r(), r() * 0.7, 0.5 + r() * 1.3, r() * 6]); return a; })());
    ctx.fillStyle = '#ffffff';
    for (const s of st) { ctx.globalAlpha = 0.25 + 0.35 * (0.5 + 0.5 * Math.sin(this.t * 1.5 + s[3])); ctx.fillRect(s[0] * W, s[1] * H, s[2], s[2]); }
    ctx.globalAlpha = 1;
    // the playa horizon: a soft glow and the far-off camps
    const hg = ctx.createRadialGradient(W / 2, H * 1.05, 10, W / 2, H * 1.05, W * 0.7); hg.addColorStop(0, 'rgba(255,140,80,0.35)'); hg.addColorStop(1, 'rgba(255,140,80,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, H * 0.5, W, H * 0.5);
  },
  // 3D car thumbnails, rendered once into a 2D atlas (again when the Blender cars finish loading)
  carThumbs() {
    const glb = typeof CartGLB !== 'undefined' && !!CartGLB.ready;
    if (this._thumbs !== undefined && this._thumbsGlb === glb) return this._thumbs;
    this._thumbs = null; this._thumbsGlb = glb;
    if (!this.gl || !this.R || BurnsGL.lost) return null;
    try {
      const cw = 192, chh = 120, cols = 4, rows = Math.ceil(CART_CARS.length / cols), R = this.R, hy = 1.6;
      R.resize(cols * cw, rows * chh); R.setCamera({ x: 0, y: 2, z: 5, tx: 0, ty: 1, tz: 0, fov: 0.8 });
      const env = BurnsEnv.build(CartShowroom.sky || 'dusk', null, 0, {}, 0);
      const st = { t: 0.3, speed: 0, steer: 0, fire: 0, boost: 0, air: 0, beat: 0.6, night: 1 };
      R.begin(env);
      CART_CARS.forEach((c, i) => {
        const M = CartModels.get(c.id, false), bones = new Float32Array(Math.max(16, M.nb) * 12);
        const car = { id: c.id, x: 0, y: 0, z: 0, yaw: -0.85, pitch: 0, roll: 0, wheelA: 0, steerVis: 0, bob: 0 };
        cartPoseCar(M, car, st, bones);
        const k = 0.98 / Math.max(M.len, M.w * 1.25, M.h * 1.65), oy = hy - 0.08 - M.h * k * 0.5;
        for (let b = 0; b < M.nb; b++) { const o = b * 12; for (let j = 0; j < 12; j++) bones[o + j] *= k; bones[o + 7] += oy; }
        R.portrait({ x: (i % cols) * cw, y: Math.floor(i / cols) * chh, w: cw, h: chh }, env, BURNS_ATLAS.T, burnsRGBf(shade(c.col, -0.62)), hy, RR => RR.skin(M.geo, bones, M.nb, null, 0, 0.7));
      });
      R.post.noFx = [0, 0, 1, 1];
      R.end(env, { fires: [], bloom: 0 });
      const cv = makeCanvas(cols * cw, rows * chh); cv.getContext('2d').drawImage(BurnsGL.canvas, 0, 0);
      this._thumbs = { c: cv, cw, chh, cols };
    } catch (e) { console.error(e); this._thumbs = null; }
    return this._thumbs;
  },
  // a car's thumbnail filling a rectangle (cropped to cover), or its colours and weapon icon without WebGL
  drawThumb(ctx, carId, x, y, w, h, r) {
    const T = this.carThumbs(), i = CART_CARS.findIndex(c => c.id === carId), C = CART_CARS[i];
    ctx.save(); burnsRR(ctx, x, y, w, h, r || 8); ctx.clip();
    if (T && i >= 0) {
      const k = Math.max(w / T.cw, h / T.chh), sw = w / k, sh = h / k, sx = (i % T.cols) * T.cw + (T.cw - sw) / 2, sy = Math.floor(i / T.cols) * T.chh + (T.chh - sh) / 2;
      ctx.drawImage(T.c, sx, sy, sw, sh, x, y, w, h);
    } else if (C) {
      const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, shade(C.col, -0.2)); g.addColorStop(1, shade(C.col, -0.7));
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h); cartWeaponIcon(ctx, C.weapon, x + w / 2, y + h / 2, Math.min(w, h) * 0.5, 1, this.t);
    }
    ctx.restore();
  },
  // the small title + subtitle the grids share (in portrait under the BACK button)
  screenTitle(ctx, text, sub, col) {
    const W = Game.cssW, P = this.portrait, y = P ? Math.max(70, insets.t + 66) : Math.max(28, insets.t + 24);
    BurnsUI.text(ctx, text, W / 2, y, Math.min(22, W * (P ? 0.052 : 0.04)), '#ffffff', { glow: col || '#ff4fd8' });
    if (sub) BurnsUI.text(ctx, sub, W / 2, y + 21, 11, '#ffd84a', CART_TXT_U);
  },
  // a two-line tag over a card (STATUS chips)
  chip(ctx, text, x, y, col, bg) {
    ctx.save(); ctx.font = `600 9px ${FONT_UI}`; const w = ctx.measureText(text).width + 12;
    BurnsUI.pill(ctx, x - w / 2, y - 8, w, 16, bg || 'rgba(10,6,24,0.85)', rgba(col, 0.7)); ctx.restore();
    BurnsUI.text(ctx, text, x, y + 0.5, 9, col, CART_TXT_CU);
  },
  confettiStep(ctx, W, H, n) {
    let C = this._conf;
    if (!C) { C = this._conf = []; for (let i = 0; i < n; i++) C.push({ x: Math.random() * W, y: -Math.random() * H, vx: (Math.random() - 0.5) * 40, vy: 40 + Math.random() * 90, r: Math.random() * TAU, vr: (Math.random() - 0.5) * 8, c: BURNS_NEON[i % 7], s: 4 + Math.random() * 5 }); }
    const dt = 1 / 60;
    for (const p of C) {
      p.x += p.vx * dt + Math.sin(this.t * 2 + p.r) * 0.6; p.y += p.vy * dt; p.r += p.vr * dt;
      if (p.y > H + 10) { p.y = -10; p.x = Math.random() * W; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
    }
  },
  // the Man behind the podium (game won): the shared neon Man, cheering (skinned pass)
  celebSkin(R) {
    if (this.state !== 'complete' || typeof BurnsManModel === 'undefined') return;
    let M = CART_CELEB.man;
    if (!M) { const model = BurnsManModel.build(), ch = new BurnsChar(model); ch.play('cheer', {}, true); M = CART_CELEB.man = { model, ch }; }
    // portrait: straight behind the car, above it; landscape (a short view): off to the side of the car, under the title
    const ch = M.ch, P = this.portrait, D = P ? 58 : 60, az = 0.38, side = P ? 0 : -0.42;
    ch.x = -Math.sin(az + side) * D; ch.z = -Math.cos(az + side) * D; ch.y = 0; ch.yaw = az + side; ch.scale = P ? 0.62 : 0.42;
    ch.update(1 / 60); ch.compute(); R.skin(M.model.geo, ch.bones, ch.nb, null, 3, 0.3);
  },
  celebFx(R, S, t, dt) {
    const C = CART_CELEB, cam = this.cam, P = this.portrait, big = this.state === 'complete';
    // the Man's glow: a warm halo round him and a fire-coloured pool at his feet
    if (big && C.man) { const ch = C.man.ch, sc = ch.scale, k = 0.85 + 0.15 * Math.sin(t * 2.2); R.bbs.bb(ch.x, 6.5 * sc, ch.z, 30 * sc * k, 38 * sc * k, S.glow, C.fire, 0.42, true); R.bbs.bb(ch.x, 8.4 * sc, ch.z, 6 * sc, 6 * sc, S.glow, C.gold, 0.7 * k, true); R.flat.flat(ch.x, 0.05, ch.z, 26 * sc, 26 * sc, t * 0.3, S.ring, C.fire, 0.6, true); }
    // stage spotlights sweeping up from round the podium
    const nL = big ? 6 : 4;
    for (let i = 0; i < nL; i++) {
      const a = i / nL * TAU + 0.3, x = Math.sin(a) * (CART_STAGE.R + 0.6), z = Math.cos(a) * (CART_STAGE.R + 0.6), sw = Math.sin(t * 0.7 + i * 1.7) * 0.35, c = C.cols[i % 7] || (C.cols[i % 7] = burnsRGBf(BURNS_NEON[i % 7]));
      const dx = Math.sin(a + sw) * 0.35, dz = Math.cos(a + sw) * 0.35, L = 26;
      R.bbs.streak(x + dx * L / 2, L / 2, z + dz * L / 2, dx, 1, dz, L, 1.6, S.streak, c, 0.22);
      R.bbs.bb(x, 0.4, z, 1.6, 1.6, S.glow, c, 0.8, true);
    }
    // fireworks: launched into the part of the sky the camera sees behind the stage
    C.next -= dt;
    if (C.next <= 0) {
      const f = C.fw.find(q => !q.live);
      if (f) {
        const fx = cam.tx - cam.x, fy = cam.ty - cam.y, fz = cam.tz - cam.z, fl = Math.hypot(fx, fy, fz) || 1, ux = fx / fl, uy = fy / fl, uz = fz / fl;
        const rx = uz, rz = -ux, rl = Math.hypot(rx, rz) || 1, d = 34 + Math.random() * 14, th = Math.tan((cam.fov || 0.7) / 2) * d, tw = th * Game.cssW / Math.max(1, Game.cssH);
        const ox = (Math.random() * 2 - 1) * tw * 0.8, oy = th * (0.15 + Math.random() * 0.7);
        f.x = cam.x + ux * d + rx / rl * ox; f.y = cam.y + uy * d + oy; f.z = cam.z + uz * d + rz / rl * ox;
        f.live = true; f.t = 0; f.r = 5 + Math.random() * 4; f.c = Math.floor(Math.random() * 7);
        if (big && Math.random() < 0.6) cartSfx('firework', 0.7, 0.85 + Math.random() * 0.3);
      }
      C.next = big ? 0.35 + Math.random() * 0.6 : 0.8 + Math.random() * 1.0;
    }
    for (const f of C.fw) {
      if (!f.live) continue; f.t += dt; const u = f.t / 1.8; if (u >= 1) { f.live = false; continue; }
      const c = C.cols[f.c] || (C.cols[f.c] = burnsRGBf(BURNS_NEON[f.c])), e = 1 - Math.pow(1 - u, 3), rr = f.r * e, drop = 2.2 * u * u, a = Math.pow(1 - u, 1.4);
      if (u < 0.12) R.bbs.bb(f.x, f.y, f.z, f.r * 1.6, f.r * 1.6, S.glow, C.white, 0.8 * (1 - u / 0.12), true);
      for (const v of C.dirs) { const x = f.x + v[0] * rr, y = f.y + v[1] * rr - drop, z = f.z + v[2] * rr; R.bbs.bb(x, y, z, 1.1, 1.1, S.glow, c, a, true); R.bbs.bb(x, y, z, 0.35, 0.35, S.core, C.white, a, true); }
    }
  },
  // the GARAGE button's wrench and the count of points waiting to be spent
  drawGarageBadge(ctx, b) {
    const car = CART_CARS[this.carSel], free = cartPointsFree(car.id);
    ctx.save(); ctx.translate(b.x + 18, b.y + b.h / 2); ctx.rotate(-0.7); ctx.fillStyle = '#ffd84a';
    ctx.fillRect(-2, -1, 4, 12); ctx.beginPath(); ctx.arc(0, -4, 5.5, 0, TAU); ctx.fill(); ctx.fillStyle = '#2a1840'; ctx.fillRect(-2, -10, 4, 6); ctx.restore();
    if (free > 0) { const a = 0.8 + 0.2 * Math.sin(this.t * 6), x = b.x + b.w - 6, y = b.y + 4; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(x, y, 10, 0, TAU); ctx.fill(); ctx.restore(); BurnsUI.text(ctx, '+' + free, x, y + 0.5, 10, '#2a0a30', CART_TXT_C); }
  },
  // the car card's progress line: Career · Battle Royale · secret level (career / royale / quick picks all show it)
  drawCarProgress(ctx, x, y) {
    const car = CART_CARS[this.carSel], p = cartProg(car.id), parts = [];
    for (const kind of ['career', 'royale']) { const R = cartRun(car.id, kind), won = (p[kind + 'Won'] | 0) > 0; parts.push([CART_RUN_KINDS[kind].name + (won ? ' ✓' : R ? ' ' + Math.min(R.stage + 1, CART_RUN_LEN) + '/' + CART_RUN_LEN : ' —'), won ? '#7aff8a' : R ? '#ffd84a' : 'rgba(255,255,255,0.65)']); }
    const sec = cartSecretUnlocked(car.id), G = cartSecretGames(car.id), sw = G.filter(g => g && p.secret[g]).length;
    parts.push([cartCarComplete(car.id) ? '★ GAME WON' : sec ? 'SECRET ' + sw + '/3' : 'SECRET 🔒', cartCarComplete(car.id) ? '#ffd84a' : sec ? '#9ad8ff' : 'rgba(255,255,255,0.5)']);
    ctx.save(); ctx.font = `600 10px ${FONT_UI}`; const ws = parts.map(q => ctx.measureText(q[0]).width + 16), tw = ws.reduce((a, b) => a + b, 0) + (parts.length - 1) * 6; ctx.restore();
    let cx = x - tw / 2;
    parts.forEach((q, i) => { BurnsUI.pill(ctx, cx, y - 9, ws[i], 18, 'rgba(10,6,24,0.75)', rgba(q[1].startsWith('#') ? q[1] : '#ffffff', 0.45)); BurnsUI.text(ctx, q[0], cx + ws[i] / 2, y + 0.5, 10, q[1], CART_TXT_CU); cx += ws[i] + 6; });
  },

  /* ---------- QUICK RACE: the two cups (Grand Prix) or Time Trial ---------- */
  layout_quick(L) {
    const { W, H, P, safeT, safeB, safeL, safeR, back, setRect } = L;
    const cw = P ? W - safeL - safeR : Math.min(330, W * 0.42), ch = P ? Math.min(118, (H * 0.5 - safeB - 12) / 2) : Math.min(130, (H - safeT - safeB - 70) / 2);
    const x = P ? safeL : W - safeR - cw, y0 = P ? H - safeB - ch * 2 - 12 : Math.max(safeT + 56, (H - ch * 2 - 12) / 2 + 16);
    this.cards.push({ i: 0, x, y: y0, w: cw, h: ch, fn: () => { Sound.play('select'); this.mode = 'gp'; this.kind = null; this.state = 'driver'; this.build(); } });
    this.cards.push({ i: 1, x, y: y0 + ch + 12, w: cw, h: ch, fn: () => { Sound.play('select'); this.mode = 'tt'; this.kind = null; this.state = 'driver'; this.build(); } });
    this.btns = [back];
    if (P) setRect(safeL, Math.max(104, insets.t + 100), W - safeR, y0 - 10); else setRect(safeL, safeT + 50, x - 20, H - safeB);
  },
  draw_quick(ctx) {
    const sv = cartSave();
    this.title(ctx, 'QUICK RACE');
    const [a, b] = this.cards, t = this.t;
    this.drawCard(ctx, a, true, '#ffd84a'); this.drawCard(ctx, b, true, '#38f2ff');
    cartTrophyIcon(ctx, a.x + 44, a.y + a.h / 2, 44, '#ffd84a', t);
    BurnsUI.text(ctx, 'GRAND PRIX', a.x + 84, a.y + 28, Math.min(22, a.w * 0.07), '#ffd84a', { align: 'left' });
    BurnsUI.text(ctx, 'Two cups of four races. Points decide the trophy.', a.x + 84, a.y + 50, 10.5, 'rgba(255,255,255,0.88)', CART_TXT_UL);
    CART_CUPS.forEach((c, i) => { const tro = sv.trophies[c.id]; BurnsUI.text(ctx, c.name + ': ' + (tro ? ['', 'GOLD', 'SILVER', 'BRONZE'][tro] : '—'), a.x + 84, a.y + 70 + i * 15, 10, tro ? '#ffd84a' : 'rgba(255,255,255,0.6)', CART_TXT_UL); });
    // the stopwatch
    ctx.save(); ctx.translate(b.x + 44, b.y + b.h / 2); ctx.strokeStyle = '#38f2ff'; ctx.fillStyle = 'rgba(56,242,255,0.18)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(0, 4, 22, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#38f2ff'; ctx.fillRect(-5, -25, 10, 6); ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(Math.sin(t * 2) * 15, 4 - Math.cos(t * 2) * 15); ctx.stroke(); ctx.restore();
    BurnsUI.text(ctx, 'TIME TRIAL', b.x + 84, b.y + 28, Math.min(22, b.w * 0.07), '#38f2ff', { align: 'left' });
    BurnsUI.text(ctx, 'Just you and the clock, on any of the 8 tracks.', b.x + 84, b.y + 50, 10.5, 'rgba(255,255,255,0.88)', CART_TXT_UL);
    const n = CART_TRACK_ORDER.filter(id => sv.best[id] && sv.best[id].total).length;
    BurnsUI.text(ctx, n ? 'BEST TIMES SET: ' + n + '/' + CART_TRACK_ORDER.length : 'No best times yet', b.x + 84, b.y + 70, 10, n ? '#ffd84a' : 'rgba(255,255,255,0.6)', CART_TXT_UL);
  },

  /* ---------- the run map: 13 stages, each with its level's car ---------- */
  layout_run(L) {
    const { W, H, P, safeT, safeB, safeL, safeR, back } = L, car = CART_CARS[this.carSel].id, kind = this.kind || 'career';
    const R = cartRun(car, kind), top = P ? Math.max(104, insets.t + 100) : Math.max(60, insets.t + 54), by = H - safeB - 48, bottom = by - 10, gap = 8;
    const order = R ? R.order : [car].concat(CART_CARS.map(c => c.id).filter(id => id !== car), ['man']);
    const cols = P ? 3 : 7, rows = P ? 5 : 2, tw = (W - safeL - safeR - (cols - 1) * gap) / cols, th = Math.min(P ? 128 : 150, (bottom - top - (rows - 1) * gap) / rows);
    const y0 = top + Math.max(0, (bottom - top - rows * th - (rows - 1) * gap) / 2);
    this.runOrder = order; this.runR = R;
    order.forEach((owner, i) => {
      const last = i === CART_RUN_LEN - 1, c = last ? (P ? 0 : 5) : P ? i % 3 : i < 7 ? i : i - 7, r = last ? (P ? 4 : 1) : P ? Math.floor(i / 3) : i < 7 ? 0 : 1;
      const w = last ? (P ? W - safeL - safeR : tw * 2 + gap) : tw, cur = R ? R.stage === i : i === 0, done = R ? i < R.stage : false;
      this.cards.push({ i, owner, x: safeL + c * (tw + gap), y: y0 + r * (th + gap), w, h: last && P ? Math.min(th, 96) : th, cur, done, final: last,
        fn: () => { if (cur) this.playRun(); else if (done) { Sound.play('select', { vol: 0.4 }); this.why = { text: 'Stage ' + (i + 1) + ' cleared · ' + cartOrdinal(R.best[i] || 1), t: 1.6 }; } else { Sound.play('back'); this.why = { text: 'Clear stage ' + ((R ? R.stage : 0) + 1) + ' first', t: 1.6 }; } } });
    });
    const complete = R && R.stage >= CART_RUN_LEN, pw = Math.min(240, W * (P ? 0.56 : 0.3));
    this.btns = [
      { x: W - safeR - pw, y: by, w: pw, h: 46, primary: true, label: !R ? 'START ▶' : complete ? 'NEW RUN ▶' : 'PLAY STAGE ' + (R.stage + 1) + ' ▶', fn: () => complete ? this.newRun(true) : this.playRun() },
      back
    ];
    if (R && R.stage > 0 && !complete) this.btns.push(this.newRunBtn = { x: P ? W - safeR - 150 : W - safeR - pw - 8 - Math.min(150, W * 0.3), y: P ? safeT : by + 4, w: P ? 150 : Math.min(150, W * 0.3), h: 38, size: 11, label: this.confirmNew ? 'SURE? TAP AGAIN' : 'NEW RUN', fn: () => this.newRun() });
    this.btns.push({ x: safeL, y: by + 4, w: Math.min(130, W * 0.28), h: 38, size: 12, label: 'GARAGE', fn: () => this.openGarage('run') });
  },
  playRun() { const car = CART_CARS[this.carSel].id; cartPlayStage(car, this.kind || 'career'); },
  newRun(now) {
    if (!now && !this.confirmNew) { Sound.play('select'); this.confirmNew = true; this.build(); return; }
    this.confirmNew = false; Sound.play('select'); cartRunNew(CART_CARS[this.carSel].id, this.kind || 'career'); this.build();
  },
  draw_run(ctx) {
    const car = CART_CARS[this.carSel], kind = this.kind || 'career', K = CART_RUN_KINDS[kind], R = this.runR, t = this.t;
    const sub = !R ? 'Your level first, then the other eleven in a random order, then ' + K.final : R.stage >= CART_RUN_LEN ? K.name + ' WON!' : 'STAGE ' + (R.stage + 1) + ' OF ' + CART_RUN_LEN + ' · ' + (R.stage === CART_RUN_LEN - 1 ? (kind === 'career' ? 'push 3 plungers first' : 'win it, then destroy the Man') : 'top 3 advance');
    this.screenTitle(ctx, K.name + ' · ' + car.name, sub, car.light);
    let standIns = 0;
    for (const c of this.cards) {
      const S = cartStage(kind, c.owner), oc = c.owner === 'man' ? null : cartCar(c.owner), col = oc ? (oc.col === '#2a2236' ? oc.col2 : oc.col) : '#ff8a2a';
      if (S.standIn) standIns++;
      ctx.save(); if (!c.cur && !c.done) ctx.globalAlpha = 0.62;
      if (c.cur) { ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 14 + 8 * Math.sin(t * 4); }
      const g = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h); g.addColorStop(0, rgba(shade(col, -0.35), 0.95)); g.addColorStop(1, 'rgba(14,8,26,0.95)');
      ctx.fillStyle = g; burnsRR(ctx, c.x, c.y, c.w, c.h, 10); ctx.fill(); ctx.shadowBlur = 0;
      ctx.strokeStyle = c.cur ? '#ffd84a' : c.done ? 'rgba(122,255,138,0.75)' : 'rgba(255,255,255,0.18)'; ctx.lineWidth = c.cur ? 2.5 : 1.3; ctx.stroke();
      const ih = c.h - 34;
      if (c.final) {
        const fg = ctx.createRadialGradient(c.x + c.w / 2, c.y + ih, 4, c.x + c.w / 2, c.y + ih * 0.6, c.w * 0.6); fg.addColorStop(0, 'rgba(255,120,40,0.55)'); fg.addColorStop(1, 'rgba(255,120,40,0)');
        ctx.fillStyle = fg; ctx.fillRect(c.x + 3, c.y + 3, c.w - 6, ih);
        cartManIcon(ctx, c.x + c.w / 2, c.y + ih * 0.52, Math.min(ih * 0.4, 34), t, c.done || c.cur);
      } else this.drawThumb(ctx, c.owner, c.x + 3, c.y + 3, c.w - 6, ih, 8);
      // the stage number, and the status chip
      ctx.fillStyle = 'rgba(10,6,24,0.8)'; ctx.beginPath(); ctx.arc(c.x + 15, c.y + 15, 11, 0, TAU); ctx.fill();
      BurnsUI.text(ctx, String(c.i + 1), c.x + 15, c.y + 15.5, 11, c.cur ? '#ffd84a' : '#ffffff', CART_TXT_C);
      if (c.done) cartCheckIcon(ctx, c.x + c.w - 14, c.y + 14, 9, '#7aff8a');
      if (c.done && R && R.best[c.i]) BurnsUI.text(ctx, cartOrdinal(R.best[c.i]), c.x + c.w - 14, c.y + 31, 9, '#ffd84a', CART_TXT_U);
      if (c.cur) this.chip(ctx, R ? 'NEXT' : 'START', c.x + c.w / 2, c.y + ih - 6, '#ffd84a');
      const name = c.final ? 'THE FINAL · ' + K.final : oc.name, fs = Math.min(11, c.w * 0.085);
      BurnsUI.text(ctx, name, c.x + c.w / 2, c.y + c.h - 21, fs, c.final ? '#ffb04a' : '#ffffff', { ui: true, sw: 2.5 });
      BurnsUI.text(ctx, (c.final ? S.place : S.name) + (S.standIn ? ' *' : ''), c.x + c.w / 2, c.y + c.h - 8, Math.min(8.5, c.w * 0.07), 'rgba(255,255,255,0.62)', CART_TXT_CU);
      ctx.restore();
    }
    if (standIns) BurnsUI.text(ctx, '* stand-in course until that car\'s own level is built' + (kind === 'royale' && !CART_STAGE_MODES.royale ? ' · royale stages play as VIBE CHECK for now' : ''), Game.cssW / 2, this.btns[0].y - 7, 9, 'rgba(255,255,255,0.55)', CART_TXT_CU);
  },

  /* ---------- SECRET LEVELS: one per car, unlocked by winning that car's Battle Royale ---------- */
  layout_secret(L) {
    const { W, H, P, safeT, safeB, safeL, safeR, back } = L, gap = 8, cols = P ? 2 : 6, rows = Math.ceil(CART_CARS.length / cols);
    const top = P ? Math.max(104, insets.t + 100) : Math.max(62, insets.t + 56), bottom = H - safeB;
    const cw = (W - safeL - safeR - (cols - 1) * gap) / cols, ch = Math.min(P ? 112 : 150, (bottom - top - (rows - 1) * gap) / rows);
    CART_CARS.forEach((C, i) => {
      const open = cartSecretUnlocked(C.id), ready = cartSecretOpenable(C.id), full = cartSecretReady(C.id);
      this.cards.push({ i, car: C.id, x: safeL + (i % cols) * (cw + gap), y: top + Math.floor(i / cols) * (ch + gap), w: cw, h: ch, open, ready, full,
        disabled: !open || !ready, why: !open ? 'Win the Battle Royale with ' + C.name + ' to unlock it' : 'This secret level is coming soon',
        fn: () => { Sound.play('select'); this.carSel = i; this.state = 'secretGames'; this.build(); } });
    });
    this.btns = [back];
  },
  draw_secret(ctx) {
    const n = CART_CARS.filter(c => cartSecretUnlocked(c.id)).length, t = this.t;
    this.screenTitle(ctx, 'SECRET LEVELS', n ? n + ' of ' + CART_CARS.length + ' unlocked · three games in each' : 'Win a car\'s Battle Royale to unlock its secret level', '#9a6bff');
    for (const c of this.cards) {
      const C = CART_CARS[c.i], L = CART_SECRET_LEVELS[C.id], p = cartProg(C.id), done = cartCarComplete(C.id), col = C.col === '#2a2236' ? C.col2 : C.col;
      ctx.save(); if (c.disabled) ctx.globalAlpha = 0.78;
      this.drawCard(ctx, c, c.open && c.ready, col);
      const ih = Math.min(c.h * 0.56, c.h - 60);   // short portrait cards: room for the two names above the chip
      if (c.open && c.ready) { ctx.save(); burnsRR(ctx, c.x + 3, c.y + 3, c.w - 6, ih, 9); ctx.clip(); const g = ctx.createLinearGradient(c.x, c.y, c.x, c.y + ih); g.addColorStop(0, rgba(cartArena(L.arena).col, 0.35)); g.addColorStop(1, 'rgba(10,6,24,0.2)'); ctx.fillStyle = g; ctx.fillRect(c.x, c.y, c.w, ih + 4); ctx.restore(); cartArenaIcon(ctx, L.arena, c.x + c.w / 2, c.y + ih * 0.52, Math.min(c.w, ih) * 0.3, t, cartArena(L.arena).col); }
      else { this.drawThumb(ctx, C.id, c.x + 3, c.y + 3, c.w - 6, ih, 9); ctx.fillStyle = 'rgba(8,4,18,0.55)'; burnsRR(ctx, c.x + 3, c.y + 3, c.w - 6, ih, 9); ctx.fill(); if (!c.open) cartLockIcon(ctx, c.x + c.w / 2, c.y + ih * 0.5, Math.min(16, ih * 0.22), '#ffd84a'); }
      BurnsUI.text(ctx, cartSecretName(C.id), c.x + c.w / 2, c.y + ih + 14, Math.min(11.5, c.w * 0.075), c.open && c.ready ? '#ffffff' : 'rgba(255,255,255,0.75)', { ui: true, sw: 2.5 });
      BurnsUI.text(ctx, C.name, c.x + c.w / 2, c.y + ih + 28, Math.min(9.5, c.w * 0.065), col, CART_TXT_CU);
      const won = cartSecretGames(C.id).filter(g => g && p.secret[g]).length;
      const tag = done ? '★ GAME WON' : !c.ready ? (c.open ? 'UNLOCKED · COMING SOON' : 'COMING SOON') : c.open ? won + ' / 3 WON' + (c.full ? '' : ' · 1 COMING SOON') : 'WIN ITS ROYALE';
      this.chip(ctx, tag, c.x + c.w / 2, c.y + c.h - 12, done ? '#ffd84a' : !c.ready ? '#c8b8e0' : c.open ? '#7aff8a' : '#ff9ad8');
      ctx.restore();
    }
  },
  /* ---------- a secret level's three games ---------- */
  layout_secretGames(L) {
    const { W, H, P, safeB, safeL, safeR, back } = L, car = CART_CARS[this.carSel].id, G = cartSecretGames(car);
    const top = P ? Math.max(118, insets.t + 112) : Math.max(76, insets.t + 70), bottom = H - safeB, gap = 10, cols = P ? 1 : 3;
    const cw = (W - safeL - safeR - (cols - 1) * gap) / cols, ch = P ? Math.min(150, (bottom - top - 2 * gap) / 3) : Math.min(250, bottom - top);
    const open = cartSecretUnlocked(car);
    for (let i = 0; i < 3; i++) {
      const g = G[i] || null;
      this.cards.push({ i, game: g, x: safeL + (P ? 0 : i * (cw + gap)), y: top + (P ? i * (ch + gap) : 0), w: cw, h: ch, disabled: !g || !open, why: !open ? 'Win the Battle Royale with ' + CART_CARS[this.carSel].name + ' first' : 'This level\'s own game is coming soon',
        fn: () => { const s = new CartRaceScene(cartSecretOpts(car, g)); Sound.play('select'); Game.setScene(s); } });
    }
    this.btns = [back];
  },
  draw_secretGames(ctx) {
    const C = CART_CARS[this.carSel], L = CART_SECRET_LEVELS[C.id], p = cartProg(C.id), A = L.arena ? cartArena(L.arena) : null, t = this.t;
    this.screenTitle(ctx, cartSecretName(C.id), (cartCarComplete(C.id) ? '★ GAME WON · ' : '') + C.name + '\'S SECRET LEVEL' + (this.portrait ? '' : ' · win all three games'), A ? A.col : '#9a6bff');
    for (const c of this.cards) {
      const O = c.game ? CART_OBJECTIVES[c.game] : null, won = c.game && p.secret[c.game];
      ctx.save(); if (c.disabled) ctx.globalAlpha = 0.6;
      this.drawCard(ctx, c, !c.disabled, A ? A.col : '#9a6bff');
      const wide = c.w > c.h * 1.6, ix = wide ? c.x + 56 : c.x + c.w / 2, iy = wide ? c.y + c.h / 2 : c.y + c.h * 0.3, isz = wide ? 30 : Math.min(42, c.h * 0.16);
      if (!O) { ctx.strokeStyle = '#c8b8e0'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(ix, iy, isz, 0, TAU); ctx.stroke(); ctx.setLineDash([]); BurnsUI.text(ctx, '?', ix, iy + 1, isz, '#c8b8e0', CART_TXT_C); }
      else if (c.game === 'vibe') { for (let v = 0; v < 4; v++) cartHeartIcon(ctx, ix + (v - 1.5) * isz * 0.5, iy, isz * 0.22, '#ff4f8a'); }
      else if (c.game === 'glow') { for (let v = 0; v < 5; v++) { const a = v / 5 * TAU + t; ctx.fillStyle = '#9afff0'; ctx.beginPath(); ctx.arc(ix + Math.cos(a) * isz * 0.6, iy + Math.sin(a) * isz * 0.6, isz * 0.16, 0, TAU); ctx.fill(); } }
      else cartArenaIcon(ctx, L.arena, ix, iy, isz, t, A.col);
      const tx = wide ? c.x + 104 : c.x + c.w / 2, al = wide ? 'left' : 'center', ty = wide ? c.y + 30 : c.y + c.h * 0.56;
      BurnsUI.text(ctx, O ? O.name : 'COMING SOON', tx, ty, 16, O ? '#ffd84a' : '#c8b8e0', { align: al });
      BurnsUI.text(ctx, O ? (c.i === 0 ? 'THIS LEVEL\'S OWN GAME · ' : '') + O.short : 'This level\'s own game is being built', tx, ty + 20, 10.5, 'rgba(255,255,255,0.75)', { align: al, ui: true, stroke: false });
      if (O) { ctx.font = `600 10.5px ${FONT_UI}`; BurnsUI.wrap(ctx, O.desc, (wide ? c.w - 120 : c.w - 28)).slice(0, wide && c.h < 130 ? 2 : 3).forEach((ln, i) => BurnsUI.text(ctx, ln, tx, ty + 38 + i * 14, 10.5, 'rgba(255,255,255,0.88)', { align: al, ui: true, stroke: false })); }
      if (won) { cartCheckIcon(ctx, c.x + c.w - 22, c.y + 22, 12, '#7aff8a'); BurnsUI.text(ctx, 'WON', c.x + c.w - 22, c.y + 44, 10, '#7aff8a', CART_TXT_U); }
      else if (O && !c.disabled) BurnsUI.text(ctx, 'TAP TO PLAY ▶', wide ? c.x + c.w - 60 : c.x + c.w / 2, c.y + c.h - 16, 11, '#ffd84a', {});
      ctx.restore();
    }
  },

  /* ---------- the garage: spend a car's stat points (+1 pip each, max 5 per stat, take them back any time) ---------- */
  openGarage(from) { Sound.play('select'); this.garageBack = from; this.state = 'garage'; this.build(); },
  layout_garage(L) {
    const { W, H, P, safeT, safeB, safeL, safeR, back, setRect } = L, car = CART_CARS[this.carSel].id;
    const pw = P ? W - safeL - safeR : Math.min(380, W * 0.47), ph = Math.min(P ? 360 : H - safeT - safeB - 44, 360), px = P ? safeL : W - safeR - pw, py = P ? H - safeB - ph : Math.max(safeT + 44, (H - ph) / 2 + 10);
    this.garRect = { x: px, y: py, w: pw, h: ph };
    const rh = 44, ry0 = py + 96;
    this.btns = [];
    CART_STAT_KEYS.forEach((stat, i) => {
      const y = ry0 + i * rh;
      this.btns.push({ x: px + pw - 98, y: y - 17, w: 40, h: 34, size: 18, label: '−', disabled: cartProg(car).alloc[stat] <= 0, fn: () => { if (cartAlloc(car, stat, -1)) Sound.play('back'); this.build(); } });
      this.btns.push({ x: px + pw - 52, y: y - 17, w: 40, h: 34, size: 18, label: '+', primary: cartPointsFree(car) > 0 && cartCar(car).stats[stat] + cartProg(car).alloc[stat] < 5, disabled: cartPointsFree(car) <= 0 || cartCar(car).stats[stat] + cartProg(car).alloc[stat] >= 5, fn: () => { if (cartAlloc(car, stat, 1)) Sound.play('kartBoost', { vol: 0.5 }); this.build(); } });
    });
    this.btns.push({ x: px + pw / 2 - 80, y: py + ph - 52, w: 160, h: 42, label: 'DONE ✓', primary: true, fn: () => { this.back(); } });
    this.btns.push(back);
    if (P) setRect(safeL, Math.max(96, insets.t + 92), W - safeR, py - 8); else setRect(safeL + 10, safeT + 52, px - 24, H - safeB - 30);   // a margin: the car's nose must not run off the bottom
  },
  draw_garage(ctx) {
    const C = CART_CARS[this.carSel], G = this.garRect, p = cartProg(C.id), free = cartPointsFree(C.id), D = CART_DRIVERS[this.drvSel], parts = cartStatParts(C.id, D && D.id);
    this.title(ctx, 'GARAGE');
    BurnsUIKit.panel(ctx, G.x, G.y, G.w, G.h);
    BurnsUI.text(ctx, C.name, G.x + G.w / 2, G.y + 24, 17, C.col === '#2a2236' ? C.col2 : C.col, { glow: C.light });
    const msg = p.points ? (free ? free + ' STAT POINT' + (free > 1 ? 'S' : '') + ' TO SPEND' : 'ALL POINTS SPENT · tap − to move one') : 'Win this car\'s Career and Battle Royale: 1 stat point each';
    BurnsUI.text(ctx, msg, G.x + G.w / 2, G.y + 48, 11, free ? '#ffd84a' : 'rgba(255,255,255,0.75)', CART_TXT_U);
    // the legend
    const ly = G.y + 68, lx = G.x + 16;
    cartPip(ctx, lx, ly - 5, 14, 10, 0, '#9a6bff'); BurnsUI.text(ctx, 'CAR', lx + 18, ly, 9, 'rgba(255,255,255,0.7)', CART_TXT_UL);
    cartPip(ctx, lx + 52, ly - 5, 14, 10, 1); BurnsUI.text(ctx, 'DRIVER', lx + 70, ly, 9, 'rgba(255,255,255,0.7)', CART_TXT_UL);
    cartPip(ctx, lx + 118, ly - 5, 14, 10, 2, '#9a6bff'); BurnsUI.text(ctx, 'STAT POINTS', lx + 136, ly, 9, 'rgba(255,255,255,0.7)', CART_TXT_UL);
    const rh = 44, ry0 = G.y + 96, bx = G.x + 98, bw = (G.w - 98 - 112) / 5;
    CART_STAT_ROWS.forEach((S, i) => {
      const y = ry0 + i * rh, q = parts[S[1]];
      BurnsUI.text(ctx, S[0], G.x + 16, y, 11, '#ffffff', CART_TXT_L);
      for (let k = 0; k < 5; k++) cartPip(ctx, bx + k * bw, y - 7, bw - 4, 14, k < q[0] ? 0 : k < q[0] + q[2] ? 2 : k < q[0] + q[2] + q[1] ? 1 : -1, S[2]);
    });
  },

  /* ---------- the prize: a won Career or Battle Royale (a stat point; the Royale also unlocks the secret level) ---------- */
  layout_prize(L) {
    const { W, H, P, safeT, safeB, safeL, safeR, setRect } = L, kind = this.kind || 'career', car = CART_CARS[this.carSel].id;
    const bw = Math.min(200, (W - safeL - safeR - 12) / 2), y = H - safeB - 50;
    this.btns = [
      { x: W / 2 + 6, y, w: bw, h: 46, label: 'CONTINUE ▶', primary: true, fn: () => this.afterPrize() },
      { x: W / 2 - bw - 6, y, w: bw, h: 46, label: 'SPEND IT', fn: () => this.openGarage('prize') }
    ];
    if (kind === 'royale' && cartSecretOpenable(car)) this.btns[0].label = 'SECRET LEVEL ▶';
    if (this._builtState !== 'prize') { this._conf = null; this._celebT0 = this.t; cartSfx('prize'); setTimeout(() => cartSfx('statPoint'), 450); }
    // portrait: the car, then (royale) SECRET LEVEL UNLOCKED, then the medal and its three lines, all above the buttons
    this._prizeY = y;
    if (P) setRect(safeL, H * 0.3, W - safeR, y - (kind === 'royale' ? 220 : 152)); else setRect(W * 0.25, safeT + 70, W * 0.75, y - 12);
  },
  afterPrize() {
    Sound.play('select'); const car = CART_CARS[this.carSel].id, kind = this.kind || 'career';
    if (this.thenComplete && cartCarComplete(car)) { this.state = 'complete'; this.build(); return; }
    if (kind === 'royale') { this.state = cartSecretOpenable(car) ? 'secretGames' : 'secret'; this.build(); return; }
    this.state = 'run'; this.build();
  },
  draw_prize(ctx) {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, C = CART_CARS[this.carSel], kind = this.kind || 'career', t = this.t;
    this.confettiStep(ctx, W, H, 70);
    const y = P ? Math.max(84, insets.t + 80) : Math.max(36, insets.t + 30), s = 1 + 0.04 * Math.sin(t * 3);
    BurnsUI.text(ctx, CART_RUN_KINDS[kind].name + ' CHAMPION!', W / 2, y, Math.min(32, W * 0.07) * s, '#ffd84a', { glow: '#ff8a2a' });
    BurnsUI.text(ctx, C.name + (kind === 'career' ? ' burned the Man!' : ' destroyed the Man!'), W / 2, y + 28, 13, '#ffffff', CART_TXT_U);
    // the medal: +1 STAT POINT
    // portrait: under the car; landscape: beside it (the car turns in the middle third)
    const mx = P ? W / 2 : W * 0.86, my = P ? (this._prizeY || H - 84) - 100 : H * 0.42, u = t - (this._celebT0 || 0), pop = u < 0.45 ? 0 : u < 0.75 ? BurnsM.smoothstep(0.45, 0.75, u) * 1.25 : 1 + 0.25 * Math.max(0, 1 - (u - 0.75) * 4), r = (P ? 26 : 30) * pop;
    if (r > 1) {
      cartSunburst(ctx, mx, my, r * 2.6, t, '#ffd84a', 0.35);
      ctx.save(); ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = 20 + 8 * Math.sin(t * 5); const g = ctx.createRadialGradient(mx - r * 0.3, my - r * 0.3, 2, mx, my, r); g.addColorStop(0, '#fff6c0'); g.addColorStop(1, '#d89a1a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill(); ctx.strokeStyle = '#fff2b0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx, my, r * 0.82, 0, TAU); ctx.stroke(); ctx.restore();
      BurnsUI.text(ctx, '+1', mx, my + 1, r * 0.8, '#5a2a00', { stroke: false });
      for (let i = 0; i < 4; i++) { const a = t * 1.3 + i * TAU / 4, rr = r * 1.45; cartTwinkle(ctx, mx + Math.cos(a) * rr, my + Math.sin(a) * rr, 5 + 2 * Math.sin(t * 6 + i), '#fff6c0'); }
    }
    BurnsUI.text(ctx, 'STAT POINT', mx, my + r + 15, 14, '#ffd84a', {});
    BurnsUI.text(ctx, 'for ' + C.name, mx, my + r + 32, 11, '#ffffff', CART_TXT_U);
    BurnsUI.text(ctx, 'spend it in the garage', mx, my + r + 47, 10, 'rgba(255,255,255,0.7)', CART_TXT_U);
    if (kind === 'royale') {
      const ux = P ? W / 2 : W * 0.14, uy = P ? my - r - 66 : H * 0.42;
      BurnsUI.text(ctx, 'SECRET LEVEL', ux, uy, 14, '#9ad8ff', { glow: '#3a6aff' });
      BurnsUI.text(ctx, 'UNLOCKED!', ux, uy + 17, 14, '#9ad8ff', { glow: '#3a6aff' });
      BurnsUI.text(ctx, cartSecretName(C.id) + (cartSecretOpenable(C.id) ? '' : ' · coming soon'), ux, uy + 36, 10.5, '#ffffff', CART_TXT_U);
    }
  },

  /* ---------- the game won with this car: Career + Battle Royale + the secret level's three games ----------
     the car and its driver on a gold-lit podium, the Man glowing behind, fireworks and confetti, GAME WON, the tally
     of the twelve cars, the fanfare, and a clear button to start with another car */
  layout_complete(L) {
    const { W, H, P, safeT, safeB, safeL, safeR, setRect } = L, car = CART_CARS[this.carSel].id, p = cartProg(car);
    if (!p.celebrated) { p.celebrated = Date.now(); Save.save(); }
    if (this._builtState !== 'complete') { this._conf = null; this._celebT0 = this.t; cartSfx('gameWon'); }
    const bw = Math.min(250, (W - safeL - safeR - 12) / 2), y = H - safeB - 50, next = CART_CARS.findIndex(c => !cartCarComplete(c.id));
    this.btns = [
      { x: W / 2 + 6, y, w: bw, h: 46, label: next >= 0 ? (P ? 'ANOTHER CAR ▶' : 'PLAY ANOTHER CAR ▶') : 'PICK A CAR ▶', primary: true, fn: () => { Sound.play('select'); if (next >= 0) this.carSel = next; this.mode = 'career'; this.kind = 'career'; this.state = 'car'; this.build(); } },
      { x: W / 2 - bw - 6, y, w: bw, h: 46, label: 'HOME', fn: () => { Sound.play('back'); this.state = 'mode'; this.build(); } }
    ];
    this._tallyY = y - (P ? 30 : 22);
    if (P) setRect(safeL, Math.max(196, insets.t + 190), W - safeR, this._tallyY - 52); else setRect(W * 0.25, safeT + 92, W * 0.75, this._tallyY - 26);
  },
  draw_complete(ctx) {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, C = CART_CARS[this.carSel], t = this.t, u = t - (this._celebT0 || 0), won = CART_CARS.filter(c => cartCarComplete(c.id)).length, n = CART_CARS.length;
    this.confettiStep(ctx, W, H, 120);
    // a white flash as it opens
    if (u < 0.6) { ctx.fillStyle = `rgba(255,250,230,${0.7 * (1 - u / 0.6)})`; ctx.fillRect(0, 0, W, H); }
    const y = P ? Math.max(92, insets.t + 86) : Math.max(38, insets.t + 32), pop = 1 + Math.max(0, 0.5 - u) * 1.2, ccol = C.col === '#2a2236' ? C.col2 : C.col;
    // the headline on a soft dark band, with twinkles
    const g = ctx.createLinearGradient(0, y - 40, 0, y + 72); g.addColorStop(0, 'rgba(10,4,20,0)'); g.addColorStop(0.35, 'rgba(10,4,20,0.55)'); g.addColorStop(1, 'rgba(10,4,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, 112);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + t * 0.35, x = W / 2 + Math.cos(a) * Math.min(W * 0.42, 280), yy = y + 4 + Math.sin(a) * 24; cartTwinkle(ctx, x, yy, 5 + 2.5 * Math.sin(t * 3 + i), BURNS_NEON[i % 7]); }
    BurnsUI.text(ctx, 'GAME WON!', W / 2, y, Math.min(P ? 44 : 42, W * 0.1) * pop * (1 + 0.03 * Math.sin(t * 3)), '#ffd84a', { glow: '#ff4fd8' });
    BurnsUI.text(ctx, C.name, W / 2, y + (P ? 36 : 33), P ? 19 : 17, ccol, { glow: C.light });
    // what was won: three ticks
    const parts = ['CAREER', 'BATTLE ROYALE', 'SECRET LEVEL'];
    ctx.save(); ctx.font = `600 11px ${FONT_UI}`; const ws = parts.map(q => ctx.measureText(q).width + 30), tw = ws.reduce((a, b) => a + b, 0) + 16; ctx.restore();
    let x = W / 2 - tw / 2; const cy = y + (P ? 62 : 56);
    parts.forEach((q, i) => { cartCheckIcon(ctx, x + 8, cy, 7, '#7aff8a'); BurnsUI.text(ctx, q, x + 20, cy + 0.5, 11, '#ffffff', CART_TXT_UL); x += ws[i] + 8; });
    // the tally: the twelve cars, a gold star for every car the game is won with
    const ty = this._tallyY || H - 90, sp = Math.min(26, (W - 60) / n);
    for (let i = 0; i < n; i++) {
      const c = CART_CARS[i], done = cartCarComplete(c.id), px = W / 2 + (i - (n - 1) / 2) * sp, me = i === this.carSel;
      if (done) { if (me) { ctx.save(); ctx.globalAlpha = 0.45 + 0.25 * Math.sin(t * 5); ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(px, ty - 14, 11, 0, TAU); ctx.fill(); ctx.restore(); } cartStar(ctx, px, ty - 14, me ? 9 : 7.5, '#ffd84a', '#7a4a00'); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.arc(px, ty - 14, 6, 0, TAU); ctx.fill(); ctx.fillStyle = c.col === '#2a2236' ? c.col2 : c.col; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(px, ty - 14, 3, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
    }
    BurnsUI.text(ctx, won >= n ? 'ALL ' + n + ' CARS COMPLETE · LEGEND OF THE PLAYA!' : won + ' OF ' + n + ' CARS COMPLETE · now do it with another car!', W / 2, ty + 6, 12, '#ffd84a', CART_TXT_U);
  }
});
