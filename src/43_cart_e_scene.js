/* ============================================================
   ART CART — the race/battle scene: presentation half.
   Chase camera, the engine's renderer (sun shadows, HDR lighting, bloom),
   car/driver/crowd posing, night lights, weapon effects, the HUD, touch
   controls (steer · HOP/DRIFT · ITEM · FIRE · BRAKE), pause, results,
   and the test API (window.BRADY_CART.debug).
   ============================================================ */
const CART_HUD = { pad: 12 };
Object.assign(CartRaceScene.prototype, {
  /* ---------- touch layout (the engine's Input, our own buttons) ---------- */
  layoutControls() {
    const L = Input.layout; if (!L) return;
    const W = Game.cssW, H = Game.cssH, s = Save.data.settings.ctrlScale || 1, lefty = Save.data.settings.lefty, portrait = H > W;
    const r = clamp(Math.min(W, H) * 0.1, 34, 56) * s;
    const safeL = Math.max(16, insets.l), safeR = Math.max(16, insets.r), safeB = Math.max(14, insets.b);
    let jx = W - safeR - r * 1.25, jy = H - safeB - r * (portrait ? 1.6 : 1.25);
    let fx = jx - r * 0.35, fy = jy - r * 2.45;
    let ax = jx - r * 2.35, ay = jy + r * 0.05;
    let bx = ax - r * 0.25, by = ay - r * 1.95;
    let sx = safeL + r * 2.0, sy = H - safeB - r * (portrait ? 2.2 : 1.8);
    if (lefty) { jx = W - jx; fx = W - fx; ax = W - ax; bx = W - bx; sx = W - sx; }
    L.r = r; L.lefty = lefty; L.portrait = portrait;
    L.jump = { x: jx, y: jy, r: r * 0.95 }; L.action = { x: ax, y: ay, r: r * 0.82 }; L.stickHome = { x: sx, y: sy, r: r * 1.15 };
    L.pause = { x: lefty ? safeL + 24 : W - safeR - 24, y: Math.max(12, insets.t) + 24, r: 22 };
    L.split = lefty ? W * 0.55 : W * 0.45;
    this.btnFire = { id: 'fire', x: fx, y: fy, r: r * 1.12 };
    this.btnBrake = { id: 'brake', x: bx, y: by, r: r * 0.62 };
    this.btnGas = { id: 'gas', x: jx - r * 1.2, y: jy - r * 4.7, r: r * 0.7 };
    const active = !this.paused && (this.state === 'race' || this.state === 'count');
    Input.hud = active ? [this.btnFire, this.btnBrake].concat(this.autoGas ? [] : [this.btnGas]) : null;
  },
  resize() { this.layoutControls(); if (this.state === 'nogl') this.buildNoGL(); if (this.paused) this.buildPause(); if (this.state === 'results' || this.state === 'trophy') this.buildButtons(); },
  pollPad() {
    this.pad = null;
    try { const pads = navigator.getGamepads ? navigator.getGamepads() : []; for (const gp of pads) if (gp && gp.connected) { const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed), prev = this._padPrev || {}; const f = b(4) || b(6); this.pad = { lx: gp.axes[0] || 0, fireP: f && !prev.f }; this._padPrev = { f }; break; } } catch (e) { this.pad = null; }
  },
  /* ---------- chase camera ---------- */
  updateCamera(fdt) {
    const k = this.player, cam = this.cam, W = Game.cssW, H = Game.cssH, portrait = H > W * 1.05;
    if (!k) return;
    const asp = W / Math.max(1, H);
    let tx, ty, tz, px, py, pz, fov = portrait ? 1.32 : 1.0;
    if (this.state === 'intro') {
      const u = clamp(this.stateT / 3.6, 0, 1), a = k.yaw + Math.PI * (0.85 - u * 0.85), d = 26 - u * 15, h = 12 - u * 7.5;
      tx = k.x; ty = k.y + 1.6; tz = k.z; px = k.x + Math.sin(a) * d; py = k.y + h; pz = k.z + Math.cos(a) * d;
      this.camYaw = k.yaw; this.snapCam = true;
    } else if (this.state === 'done' || this.state === 'results' || this.state === 'trophy') {
      const a = this.time * 0.35 + k.yaw, d = portrait ? 11 : 9;
      tx = k.x; ty = k.y + 2; tz = k.z; px = k.x + Math.sin(a) * d; py = k.y + 3.8; pz = k.z + Math.cos(a) * d;
    } else {
      const spinning = k.spinT > 0 || k.flipT > 0 || k.bubbleT > 0;
      const want = k.yaw + (k.drift ? k.drift * -0.18 : 0) + (k.fwd < -2 ? Math.PI : 0);
      if (!spinning) this.camYaw = this.snapCam ? want : BurnsM.dampAngle(this.camYaw, want, 3.2 + Math.min(4, k.speed * 0.12), fdt);
      const sp = clamp(k.speed / 30, 0, 1.3), boost = k.boostT > 0 || k.dashT > 0 ? 1 : 0;
      this.boostLook = BurnsM.damp(this.boostLook || 0, boost, 4, fdt);
      // big sculptures: sit higher and further back so the road ahead stays in view
      const tall = Math.max(0, k.M.h - 3), d = (portrait ? 11.5 : 8.8) + sp * 1.4 + this.boostLook * 1.2 + tall * 1.1 + k.M.len * 0.12, h = (portrait ? 4.6 : 3.5) + sp * 0.4 + tall * 0.85;
      const fx = Math.sin(this.camYaw), fz = Math.cos(this.camYaw);
      tx = k.x + fx * 6; ty = k.y + 1.7 + tall * 0.35; tz = k.z + fz * 6;
      px = k.x - fx * d; py = k.y + h; pz = k.z - fz * d;
      fov = (portrait ? 1.32 : 1.0) + sp * 0.08 + this.boostLook * 0.12;
    }
    // keep the line of sight to the car clear of the terrain: when a berm or a ramp is in the way, the camera
    // first slides in past it, then rises above what's left
    if (this.state === 'race' || this.state === 'count') {
      let pull = 0;
      for (const u of [0.15, 0.3, 0.45]) { const h = this.terrain.height(lerp(px, k.x, u), lerp(pz, k.z, u)); if (h > lerp(py, k.y + 1.5, u) - 1.2) pull = u + 0.12; }
      this.camPull = BurnsM.damp(this.camPull || 0, pull, pull > (this.camPull || 0) ? 6 : 1.5, fdt);
      px = lerp(px, k.x, this.camPull); pz = lerp(pz, k.z, this.camPull); py = lerp(py, k.y + 2.6, this.camPull * 0.5);
    }
    const gy = this.terrain.height(px, pz) + 1.2; if (py < gy) py = gy;
    for (const u of [0.25, 0.5, 0.75]) { const h = this.terrain.height(lerp(px, tx, u), lerp(pz, tz, u)) + 0.9; if (lerp(py, ty, u) < h) py = Math.max(py, (h - ty * u) / (1 - u)); }
    const k1 = this.snapCam ? 1 : 1 - Math.exp(-14 * fdt);
    cam.x = lerp(cam.x, px, k1); cam.y = lerp(cam.y, py, k1); cam.z = lerp(cam.z, pz, k1);
    cam.tx = lerp(cam.tx, tx, k1); cam.ty = lerp(cam.ty, ty, k1); cam.tz = lerp(cam.tz, tz, k1);
    cam.fov = BurnsM.damp(cam.fov || fov, fov, 5, fdt);
    if (this.shake > 0) { const s = this.shake * 0.35; cam.x += (Math.random() - 0.5) * s; cam.y += (Math.random() - 0.5) * s; cam.tx += (Math.random() - 0.5) * s * 0.5; }
    cam.roll = k.drift && !this.state.startsWith('res') ? k.drift * -0.025 : 0;
    this.snapCam = false;
    void asp;
  },
  // render scale governor (on top of the engine tier): long frames lower the resolution
  adapt(fdt) {
    if (window.__cartFixedQ) { this.q = window.__cartFixedQ; return; }   // screenshots: hold the resolution
    if (fdt > 0.25) { this.q = Math.max(0.5, this.q * 0.75); this.slowT = 0; return; }   // very slow device: step down at once
    if (fdt > 0.026) this.slowT = (this.slowT || 0) + fdt; else this.slowT = Math.max(0, (this.slowT || 0) - fdt * 0.5);
    if (this.slowT > 2 && this.q > 0.55) { this.q = Math.max(0.55, this.q - 0.1); this.slowT = 0; }
    if (fdt < 0.018) { this.fastT = (this.fastT || 0) + fdt; if (this.fastT > 6 && this.q < 1) { this.q = Math.min(1, this.q + 0.05); this.fastT = 0; } } else this.fastT = 0;
  },

  /* ---------- per frame: pose everything ---------- */
  poseAll(fdt) {
    const beat = Math.pow(Math.max(0, Math.sin(this.time * 2.1 * Math.PI)), 6);   // ~126 bpm pulse for hearts and LEDs
    for (const k of this.karts) {
      const st = k.st; st.t += fdt; st.speed = clamp(k.speed / 28, 0, 1.4); st.steer = k.steerVis; st.fire = k.wpn.fireT > 0 ? Math.min(1, k.wpn.fireT * 1.6) : 0; st.boost = k.boostT > 0 || k.slimeT > 0 ? 1 : 0; st.air = k.air ? 1 : 0; st.beat = beat;
      const yaw = k.yaw; k.yaw = k.visYaw !== undefined ? k.visYaw : k.yaw;
      cartPoseCar(k.M, k, st, k.bones);
      k.yaw = yaw;
      // driver: steering, firing, getting hit, cheering
      let anim = 'cartDrive';
      if (k.out || (this.state !== 'race' && k.rank > 1 && (this.state === 'results' || this.state === 'trophy') && this.isBattle)) anim = 'cartSulk';
      else if (k.spinT > 0 || k.flipT > 0 || k.bubbleT > 0 || k.stunT > 0) anim = 'cartHit';
      else if (k.wpn.fireT > 0.55) anim = 'cartFire';
      else if (k.cheerT > 0 || (k.finished && this.isRace)) anim = 'cartCheer';
      const ch = k.ch; ch.play(anim, { steer: k.steerVis, speed: st.speed }); ch.k.steer = k.steerVis; ch.k.speed = st.speed;
      ch.update(fdt);
      k.driverScale = k.driverScale || 1;
      cartPoseDriver(k, k.M, ch, k.dBones);
    }
    // props: gift boxes spin and bob, orbs float, the flag rides its holder
    const P = this.props, H = this.terrain, t = this.time;
    for (const g of P.gifts) { g.visible = !!g.alive; if (!g.alive) continue; g.x = g.gx; g.z = g.gz; g.y = H.height(g.gx, g.gz) + 1.15 + Math.sin(t * 2.5 + g.ph) * 0.18; g.yaw = t * 1.3 + g.ph; g.roll = Math.sin(t * 1.7 + g.ph) * 0.15; g.scale = g.t > 2.3 ? 0.3 : 1; }
    for (const o of P.orbs) { o.visible = !!o.alive; if (!o.alive) continue; o.x = o.gx; o.z = o.gz; o.y = H.height(o.gx, o.gz) + 1.0 + Math.sin(t * 3 + o.ph) * 0.25; o.yaw = t * 2; }
    for (const m of P.mines) { m.visible = !!m.alive; if (!m.alive) continue; m.x = m.gx; m.z = m.gz; m.y = H.height(m.gx, m.gz) + 0.02; m.yaw = t * 0.5; m.scale = 1 + Math.sin(t * 8) * 0.06; }
    for (const p of P.potties) { p.visible = !!p.alive; if (!p.alive) continue; const fall = Math.max(0, (p.drop - p.t) / p.drop); p.x = p.gx; p.z = p.gz; p.y = H.height(p.gx, p.gz) + fall * fall * 30; p.yaw = 0.4 + fall * 3; p.roll = fall * 0.4; }
    for (const q of P.tumbles) { q.visible = !!q.alive; if (!q.alive) continue; q.x = q.gx; q.z = q.gz; q.y = H.height(q.gx, q.gz) + 0.75 + Math.abs(Math.sin(t * 4)) * 0.4; q.pitch = q.rot; q.yaw = this.windA; }
    if (P.flag) { const F = this.obj.flag; P.flag.visible = true; P.flag.x = F.x; P.flag.z = F.z; P.flag.y = F.holder ? F.holder.y + F.holder.M.h * 0.55 : F.y; P.flag.yaw = F.holder ? F.holder.yaw + Math.PI / 2 : t * 0.8; P.flag.scale = F.holder ? 0.8 : 1.25; }
    for (const G of P.groups) G.pose(this.cam);
    // the crowd cheers harder when cars roar past
    for (const G of this.E.crowds) {
      let ex = 0; for (const k of this.karts) { const d = Math.hypot(k.x - G.cx, k.z - G.cz); if (d < G.rad + 25) ex = Math.max(ex, 1 - Math.max(0, d - G.rad) / 25); }
      if (this.state === 'done' || this.state === 'results') ex = 1;
      G.excite = BurnsM.damp(G.excite || 0, ex, 3, fdt);
      CartCrowd.animate(G, t, G.excite); G.pose(null);
    }
    for (const h of this.heroes) { h.ch.update(fdt); h.ch.compute(); }
    if (this.man) { const M = this.man; M.ch.play(this.isRace && this.player && this.player.lap >= this.laps ? 'cheer' : 'idle'); M.ch.update(fdt); M.ch.compute(); }
  },

  /* ---------- draw ---------- */
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    if (this.state === 'load') {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.drawLoading(ctx);
      if ((this.loadFrames = (this.loadFrames || 0) + 1) >= 2) { try { this.runJobs(30); } catch (e) { console.error(e); Game.reportError(e); this.state = 'nogl'; this.noglMsg = 'This course failed to load.'; this.jobs.length = 0; this.buildNoGL(); } }
      return;
    }
    if (this.state === 'nogl') { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); this.drawNoGL(ctx); return; }
    if (BurnsGL.lost) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#07040e'; ctx.fillRect(0, 0, W, H); BurnsUI.text(ctx, 'RECONNECTING TO THE PLAYA…', W / 2, H / 2, 14, '#ffffff'); return; }
    const now = performance.now(), rawDt = this.lastFrame ? (now - this.lastFrame) / 1000 : 1 / 60, fdt = clamp(rawDt, 0, 0.1);
    this.lastFrame = now;
    this.stats.fps = lerp(this.stats.fps, 1 / Math.max(0.001, fdt), 0.05);
    const t0 = performance.now();
    this.pollPad();
    if (!this.paused && this.state !== 'intro') this.adapt(rawDt);
    const vdt = this.paused ? 0 : fdt;
    this.fx.update(vdt);
    this.updateCamera(vdt || 1e-4);
    this.poseAll(vdt);
    this.engineSound();
    if (window.__cartSkipRender) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#2a1a30'; ctx.fillRect(0, 0, W, H); this.drawHUD(ctx, fdt); return; }   // input tests
    const R = this.R, Q = BurnsGL.Q, qs = this.q * (Q ? Q.scale : 1);
    const gw = Math.max(64, Math.round(W * Math.min(dpr, 2) * qs)), gh = Math.max(64, Math.round(H * Math.min(dpr, 2) * qs));
    R.resize(gw, gh);
    this.cam.near = 0.2; this.cam.far = 1600;
    R.setCamera(this.cam);
    const env = BurnsEnv.build(this.palA, null, 0, this.env, this.time);
    if (this.E.storm && this.stormK > 0) { env.fogD *= 1 + this.stormK * 2.6; env.haze = Math.min(1, env.haze + this.stormK * 0.3); }
    this.collectLights(env);
    this.renderScene(R, env);
    R.end(env, this.postFx(env));
    this.stats.draws = R.stats.draws; this.stats.tris = R.stats.tris;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(BurnsGL.canvas, 0, 0, gw, gh, 0, 0, Game.canvas.width, Game.canvas.height);
    this.stats.cpu = lerp(this.stats.cpu, performance.now() - t0, 0.1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.drawHUD(ctx, fdt);
  },
  carModel(k, d2) { return d2 > 38 * 38 && k.Mlo ? k.Mlo : k.M; },
  renderScene(R, env) {
    const W = this.W, cam = this.cam, P = R.planes, Q = BurnsGL.Q, A = BURNS_ATLAS.T;
    const wantShadow = !!(Q && Q.shadows && env.keyDir[1] > 0.06);
    const vis = this._vis || (this._vis = []); vis.length = 0;
    for (const k of this.karts) { const d2 = (k.x - cam.x) * (k.x - cam.x) + (k.z - cam.z) * (k.z - cam.z); k._d2 = d2; k._in = BurnsM.sphereVisible(P, k.x, k.y + 1.8, k.z, 4.5); if (k._in || (wantShadow && d2 < 60 * 60)) vis.push(k); }
    const heroes = this.heroes.filter(h => { const d2 = (h.ch.x - cam.x) * (h.ch.x - cam.x) + (h.ch.z - cam.z) * (h.ch.z - cam.z); h._d2 = d2; h._in = d2 < 90 * 90 && BurnsM.sphereVisible(P, h.ch.x, h.ch.y + 1, h.ch.z, 2); return h._in || (wantShadow && d2 < 40 * 40); });
    const crowds = this.E.crowds.filter(G => { const d = Math.hypot(G.cx - cam.x, G.cz - cam.z); G._d = d; return d < 160 + G.rad && BurnsM.sphereVisible(P, G.cx, 1.5, G.cz, G.rad + 2); });
    // ---- sun shadows: the same draws, depth only ----
    if (wantShadow && R.shadowBegin(env)) {
      R.statics(W.chunks, env, W, A, 0);
      R.skinBegin(env, W, A);
      for (const k of vis) { if (!R.shadowNear(k.x, k.y, k.z, 5)) continue; const M = this.carModel(k, k._d2); R.skin(M.geo, k.bones, M.nb, null, 0, 0); R.skin(k.dModel.lod || k.dModel.geo, k.dBones, k.ch.nb, null, 0, 0); }
      for (const h of heroes) if (h._d2 < 40 * 40) R.skin(h.model.lod || h.model.geo, h.ch.bones, h.ch.nb, null, 0, 0);
      for (const G of this.props.groups) R.skin(G.geo, G.bones, G.objs.length, null, 0, 0);
      for (const G of crowds) if (R.shadowNear(G.cx, 1, G.cz, G.rad)) R.skin(G.geo, G.bones, G.objs.length, null, 0, 0);
      if (this.man) R.skin(this.man.model.geo, this.man.ch.bones, this.man.ch.nb, null, 0, 0);
      R.shadowEnd();
    }
    // ---- main pass ----
    R.begin(env);
    R.sky(env);
    R.ground(W.ground, env, W);
    R.statics(W.chunks, env, W, A, env.fogD > 0.011 ? 170 : 320);
    R.skinBegin(env, W, A);
    for (const k of vis) {
      if (!k._in) continue;
      const M = this.carModel(k, k._d2), dark = k.out ? [0.05, 0.04, 0.06, 0.55] : k.invT > 0 && Math.floor(this.time * 16) % 2 === 0 ? [1, 1, 1, 0.25] : null;
      R.skin(M.geo, k.bones, M.nb, dark, 0, 0.3);
      const dm = k.dModel, D = k._d2 > 45 * 45 && dm.far ? dm.far : k._d2 > 18 * 18 && dm.lod ? dm.lod : dm.geo;
      R.skin(D, k.dBones, k.ch.nb, null, k.ch.face, 0.45);
    }
    for (const h of heroes) if (h._in) R.skin(h._d2 > 40 * 40 && h.model.far ? h.model.far : h._d2 > 10 * 10 && h.model.lod ? h.model.lod : h.model.geo, h.ch.bones, h.ch.nb, null, h.ch.face, 0.4);
    for (const G of crowds) R.skin(G.geo, G.bones, G.objs.length, null, 3, 0.3);
    for (const G of this.props.groups) R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.5);
    if (this.man) R.skin(this.man.model.geo, this.man.ch.bones, this.man.ch.nb, null, 3, 0.3);
    this.pushSprites(R, env);
    R.sprites(env, BURNS_SPRITES.T);
  },
  // dynamic point lights: car lights, weapon flashes, fires (the renderer keeps the most relevant 12–16)
  collectLights(env) {
    const cam = this.cam, night = this.R.night || (this.night ? 1 : 0), cand = this._lc || (this._lc = []), out = this._lo || (this._lo = []);
    cand.length = 0; out.length = 0;
    const max = BurnsGL.Q ? BurnsGL.Q.npl : 4, cx = (this.player.x + cam.x) / 2, cz = (this.player.z + cam.z) / 2;
    const add = (x, y, z, r, c, i, pri) => { const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz; if (d2 > (r + 70) * (r + 70)) return; cand.push([(i || 1) * (pri || 1) * r * r / (d2 + r * r), { x, y, z, r, c, i }]); };
    for (const k of this.karts) {
      if (k.out) continue;
      const big = k.M.lights.find(L => L.big);
      if (big && night > 0.2) { const p = cartLocalToWorld(k, big.x, big.y, big.z, CART_TMP.p || (CART_TMP.p = [0, 0, 0])); add(p[0], p[1], p[2], 7 + big.s, big.cc, 0.9 * night, 1); }
      if (k.boostT > 0) add(k.x, k.y + 1, k.z, 6, [1, 0.6, 0.25], 0.8, 1.2);
      if (k.wpn.fireT > 0.3) { const D = k.wpn.def; add(k.x, k.y + 2.5, k.z, 12, burnsRGBf(D.col), 1.4, 2); }
    }
    for (const s of this.shots) { if (s.type === 'ball') add(s.x, s.y, s.z, 6, s.kind === 'fire' ? [1, 0.5, 0.15] : s.kind === 'bubble' ? [0.6, 0.9, 1] : [1, 0.8, 0.5], 0.9, 1.5); if (s.type === 'geyser' && s.fired) add(s.x, 3, s.z, 10, [0.4, 0.7, 1], 1.2, 2); }
    for (const f of this.W.fires) add(f.x, (f.y || 0) + 1.2, f.z, 7, [1, 0.55, 0.2], 1.1, 1);
    if (this.man && this.man.burn > 0.05) add(this.man.ch.x, 10, this.man.ch.z, 45, [1, 0.5, 0.18], 1.5 * this.man.burn, 3);
    cand.sort((a, b) => b[0] - a[0]);
    for (let i = 0; i < cand.length && out.length < max; i++) out.push(cand[i][1]);
    this.R.setLights(out);
  },
  postFx(env) {
    const fx = this._fx || (this._fx = { fires: [] }), cam = this.cam;
    fx.heat = clamp((env.sunDir[1] - 0.22) * 2.4, 0, 1) * (1 - (this.R.night || 0)) * 0.7;
    fx.fires.length = 0;
    for (const f of this.W.fires) { const d = Math.hypot(f.x - cam.x, f.z - cam.z); if (d < 38) fx.fires.push([f.x, f.y || 0, f.z, 0.8, d]); }
    for (const k of this.karts) if (k.wpn.fireT > 0.2 && (k.wpn.id === 'torch' || k.wpn.id === 'fireball')) fx.fires.push([k.x, k.y + 1, k.z, 1.6, Math.hypot(k.x - cam.x, k.z - cam.z)]);
    if (fx.fires.length > 6) { fx.fires.sort((a, b) => a[4] - b[4]); fx.fires.length = 6; }
    fx.rays = env.rays; fx.bloom = null; fx.exposure = 1; fx.dof = null;
    return fx;
  },
  pushSprites(R, env) {
    const S = BURNS_SPRITES.R, cam = this.cam, W = this.W, t = this.time, P = R.planes, H = this.terrain;
    const night = Math.max(this.R.night || 0, this.night ? 0.8 : 0), ck = R.shadowOn ? 0.55 : 1;
    // contact shadows under the cars, glowing lights at dusk/night, headlight beams
    for (const k of this.karts) {
      if (!k._in) continue;
      const gy = H.height(k.x, k.z), hgt = Math.max(0, k.y - gy), sz = (k.M.w + k.M.len) * 0.55 * (1 + hgt * 0.06);
      R.flat.flat(k.x, gy + 0.04, k.z, sz * 0.7, sz * 1.15, k.yaw, S.shadow, [0, 0, 0], 0.62 * ck * clamp(1 - hgt * 0.1, 0.25, 1), false);
      if (k.out) continue;
      if (night > 0.15) {
        const c = k.car.light, cc = burnsRGBf(c);
        R.flat.flat(k.x, gy + 0.06, k.z, k.M.w + 3.2, k.M.len + 3.5, k.yaw, S.glow, cc, 0.38 * night, true);   // underglow
        if (k._d2 < 120 * 120) for (const L of k.M.lights) {
          if (k._d2 > 50 * 50 && !L.big && !L.head) continue;
          const p = cartLocalToWorld(k, L.x, L.y, L.z, this._lp || (this._lp = [0, 0, 0]));
          const fl = L.led ? 0.6 + 0.4 * Math.sin(t * 6 + L.x * 3 + L.z) : 1;
          R.bbs.bb(p[0], p[1], p[2], L.s * (L.big ? 1.4 : 1), L.s * (L.big ? 1.4 : 1), S.glow, L.cc, (L.big ? 0.55 : 0.8) * night * fl, true);
          if (L.head && k._d2 < 80 * 80) R.flat.flat(k.x + Math.sin(k.yaw) * (k.M.len * 0.5 + 4.5), gy + 0.05, k.z + Math.cos(k.yaw) * (k.M.len * 0.5 + 4.5), 3.4, 8.5, k.yaw + Math.PI, S.beam, [1, 0.92, 0.75], 0.18 * night, true);
        }
      }
      if (k.shieldT > 0) R.bbs.bb(k.x, k.y + 1.8, k.z, 6.5, 6.5, S.bubble, [1, 0.75, 1], 0.55 + Math.sin(t * 8) * 0.1, false);
      if (k.bubbleT > 0) R.bbs.bb(k.x, k.y + 1.8, k.z, 7.5, 7.5, S.bubble, [0.75, 0.95, 1], 0.7, false);
      if (k.flag) R.bbs.bb(k.x, k.y + k.M.h + 2.6, k.z, 3, 3, S.glow, [1, 0.3, 0.85], 0.7, true);
      if (this.objective === 'vibe' && this.state === 'race') for (let v = 0; v < k.vibes; v++) R.bbs.bb(k.x + (v - (k.vibes - 1) / 2) * 0.9, k.y + k.M.h + 0.9, k.z, 0.8, 0.8, S.heart, [1, 0.3, 0.6], 0.95, true);
      if (k.dazzleT > 0) R.bbs.bb(k.x, k.y + k.M.h + 0.6, k.z, 1.3, 1.3, S.star, [1, 1, 1], 0.5 + Math.sin(t * 14) * 0.25, true, t * 3);
      if (k.stunT > 0 && Math.random() < 0.5) R.bbs.streak(k.x + (Math.random() - 0.5) * 2, k.y + 2 + Math.random(), k.z + (Math.random() - 0.5) * 2, Math.random() - 0.5, 1, Math.random() - 0.5, 1.4, 0.25, S.streak, [0.4, 0.95, 1], 1);
    }
    // weapon ready glow: a halo over the player's car when FIRE is charged
    const p = this.player;
    if (p && this.state === 'race' && p.wpn.t <= 0 && !p.out) R.bbs.bb(p.x, p.y + p.M.h + 1.4, p.z, 2.2 + Math.sin(t * 6) * 0.3, 2.2 + Math.sin(t * 6) * 0.3, S.glow, burnsRGBf(p.wpn.def.col), 0.65, true);
    // static glows (lamps, neon, signs) and fires
    for (const g of W.glows) { const dx = g.x - cam.x, dz = g.z - cam.z; if (dx * dx + dz * dz > 200 * 200 || !BurnsM.sphereVisible(P, g.x, g.y, g.z, g.s)) continue; const fl = g.blink ? (0.6 + 0.4 * Math.sin(t * g.blink + g.ph)) : 1; R.bbs.bb(g.x, g.y, g.z, g.s * 1.8, g.s * 1.8, S.glow, g.c, 0.75 * fl, true); }
    for (const f of W.fires) { const dx = f.x - cam.x, dz = f.z - cam.z; if (dx * dx + dz * dz > 110 * 110) continue; if (Math.random() < 0.85) this.fx.fire(f.x, f.y || 0, f.z, 0.8); R.bbs.bb(f.x, (f.y || 0) + 0.8, f.z, 4 + Math.sin(t * 13 + f.x) * 0.3, 4, S.glow, [1, 0.5, 0.15], 0.5, true); }
    // boost pads: scrolling glowing chevrons
    for (const b of this.E.boosts) { const dx = b.x - cam.x, dz = b.z - cam.z; if (dx * dx + dz * dz > 150 * 150) continue; const gy = H.height(b.x, b.z) + 0.07, fx = Math.sin(b.yaw), fz = Math.cos(b.yaw); R.flat.flat(b.x, gy, b.z, b.w, b.l, b.yaw, S.square, [1, 0.55, 0.15], 0.35, true); for (let i = 0; i < 3; i++) { const u = ((t * 1.6 + i / 3) % 1 - 0.5) * b.l * 0.8; R.flat.flat(b.x + fx * u, gy + 0.01, b.z + fz * u, b.w * 0.8, b.w * 0.8, b.yaw + Math.PI, S.arrow, [1, 0.85, 0.3], 0.8, true); } }
    // objective markers: the hill zone, capture ring, flag beacon, orb glows
    if (this.isBattle) {
      const E = this.E, O = this.obj;
      if (this.objective === 'hill') { const z = E.zones[O.zone], gy = H.height(z.x, z.z) + 0.1, pulse = 0.75 + 0.25 * Math.sin(t * 4); R.flat.flat(z.x, gy, z.z, z.r * 2.2, z.r * 2.2, t * 0.4, S.ring, [1, 0.85, 0.2], 0.9 * pulse, true); R.flat.flat(z.x, gy, z.z, z.r * 2, z.r * 2, 0, S.glow, [1, 0.8, 0.2], 0.25, true); R.bbs.streak(z.x, gy + 12, z.z, 0, 1, 0, 26, 2.2, S.streak, [1, 0.85, 0.3], 0.45); }
      if (this.objective === 'flag') { const c = E.captures[O.capture], gy = H.height(c.x, c.z) + 0.1; R.flat.flat(c.x, gy, c.z, c.r * 2.2, c.r * 2.2, -t * 0.6, S.ring, [0.4, 1, 0.5], 0.9, true); R.bbs.streak(c.x, gy + 14, c.z, 0, 1, 0, 30, 2.5, S.streak, [0.4, 1, 0.5], 0.4); const F = O.flag; R.bbs.streak(F.x, F.y + 9, F.z, 0, 1, 0, 18, 1.4, S.streak, [1, 0.3, 0.85], 0.5); }
      if (this.objective === 'glow') for (const o of this.props.orbs) if (o.alive) R.bbs.bb(o.gx, o.y || o.gy, o.gz, 2.6, 2.6, S.glow, [0.5, 1, 0.9], 0.7, true);
    }
    for (const g of this.props.gifts) if (g.alive && (g.gx - cam.x) * (g.gx - cam.x) + (g.gz - cam.z) * (g.gz - cam.z) < 90 * 90) R.bbs.bb(g.x, g.y, g.z, 2.4, 2.4, S.glow, [1, 0.8, 1], 0.25 + 0.25 * night, true);
    for (const m of this.props.mines) if (m.alive) R.flat.flat(m.gx, m.y + 0.05, m.gz, 2.2, 2.2, 0, S.warn, [1, 0.5, 0.8], 0.6, true);
    // weapon effects
    for (const s of this.shots) this.drawShot(R, s, S, t);
    for (const h of this.hazards) {
      if (h.type === 'slime') { const a = clamp((h.life - h.t) / 1.5, 0, 1); R.flat.flat(h.x, h.y + 0.05, h.z, h.r * 2, h.r * 2.4, h.yaw, S.glow, [0.45, 1, 0.3], 0.55 * a, true); }
      if (h.type === 'foam') R.flat.flat(h.x, H.height(h.x, h.z) + 0.1, h.z, h.r * 2, h.r * 2, t, S.puff, [1, 1, 1], 0.5, false);
    }
    // the Man burns
    if (this.man) { const M = this.man; if (M.burn > 0.05 && Math.random() < 0.9) for (let i = 0; i < 3; i++) this.fx.fire(M.ch.x + (Math.random() - 0.5) * 4, 5.5 + Math.random() * 9 * M.burn, M.ch.z + (Math.random() - 0.5) * 3, 2.4 * M.burn); R.bbs.bb(M.ch.x, 12, M.ch.z, 30, 30, S.glow, [1, 0.5, 0.2], 0.25 * M.burn, true); }
    // fireworks on the burn night track
    if (this.E.fireworks && this.state !== 'load') { this.fwT = (this.fwT || 1) - 1 / 60; if (this.fwT <= 0) { this.fwT = 0.8 + Math.random() * 1.5; const a = Math.random() * TAU, r = 60 + Math.random() * 140, cx = (this.man ? this.man.ch.x : 0) + Math.cos(a) * r, cz = (this.man ? this.man.ch.z : 0) + Math.sin(a) * r; this.fx.firework(cx, 55 + Math.random() * 35, cz, BURNS_NEON[Math.floor(Math.random() * 7)]); } }
    // dust in the air (heavier in a storm)
    const dust = (this.E.storm ? 0.4 + this.stormK * 2 : 0.3);
    if (Math.random() < dust) { const a = Math.random() * TAU, d = 4 + Math.random() * 26; this.fx.add(cam.tx + Math.cos(a) * d, cam.ty - 0.6 + Math.random() * 3, cam.tz + Math.sin(a) * d, 1.2 + Math.random() + (this.E.storm ? Math.sin(this.windA) * this.stormK * 8 : 0), 0.05, 0.4 + (this.E.storm ? Math.cos(this.windA) * this.stormK * 8 : 0), 3, 1.5, 3.5, env.fogCol.map(c => Math.min(1, c * 1.5 + 0.15)), this.E.storm ? 0.22 : 0.12, 'puff', 0, Math.random() * 6, 0.1); }
    this.fx.draw(R);
  },
  drawShot(R, s, S, t) {
    const k = s.owner;
    if (s.type === 'ring') { const a = 1 - s.t / s.life, gy = this.terrain.height(s.x, s.z) + 0.3; R.flat.flat(s.x, gy, s.z, s.r * 2, s.r * 2, 0, S.ring, burnsRGBf(s.col), a, true); R.flat.flat(s.x, gy + 0.05, s.z, s.r * 1.9, s.r * 1.9, 0, S.ring, [1, 1, 1], a * 0.5, true); if (Math.random() < 0.7) this.fx.notes(s.x + (Math.random() - 0.5) * s.r, gy + 1.5, s.z + (Math.random() - 0.5) * s.r); }
    else if (s.type === 'beam' || s.type === 'laser') {
      if (s.x === undefined) return;
      const a = Math.min(1, (s.life - s.t) * 4), fx = Math.sin(s.yaw), fz = Math.cos(s.yaw), L = s.range;
      const col = s.type === 'laser' ? [0.25, 1, 0.5] : [0.75, 0.9, 1];
      for (let i = 0; i < 4; i++) { const d0 = L * (i + 0.5) / 4; R.bbs.streak(s.x + fx * d0, s.y + (s.type === 'laser' ? -1.5 * (i + 0.5) / 4 : -0.3 * i), s.z + fz * d0, fx, s.type === 'laser' ? -0.08 : -0.02, fz, L / 4 * 1.05, s.type === 'laser' ? 0.55 : 2.2 + i * 0.8, S.streak, col, a * (s.type === 'laser' ? 1 : 0.6)); }
      R.bbs.bb(s.x, s.y, s.z, 3, 3, S.glow, col, a, true);
      if (Math.random() < 0.8) { const d = Math.random() * L; this.fx.glint(s.x + fx * d, s.y - (s.type === 'laser' ? 1.5 * d / L : 0), s.z + fz * d, s.type === 'laser' ? '#7aff9a' : '#ffffff'); }
    }
    else if (s.type === 'ball') {
      if (s.kind === 'fire') { R.bbs.bb(s.x, s.y, s.z, 2.4, 2.4, S.glow, [1, 0.55, 0.15], 1, true); R.bbs.bb(s.x, s.y, s.z, 1.3, 1.3, S.core, [1, 0.85, 0.5], 1, true); if (Math.random() < 0.9) this.fx.fire(s.x, s.y - 0.3, s.z, 0.9); }
      else if (s.kind === 'bubble') { R.bbs.bb(s.x, s.y, s.z, 2.8, 2.8, S.bubble, [0.8, 0.95, 1], 0.85, false); }
      else { R.bbs.bb(s.x, s.y, s.z, 1.1, 1.1, S.dot, [0.08, 0.08, 0.1], 1, false); if (Math.random() < 0.6) this.fx.smoke(s.x, s.y, s.z, 1, '#c8c0b8'); }
    }
    else if (s.type === 'zap') {
      const mz = this.muzzle(k, [0, 0, 0]);
      for (const o of s.targets) { let px = mz[0], py = mz[1], pz = mz[2]; for (let i = 1; i <= 6; i++) { const u = i / 6, x = lerp(mz[0], o.x, u) + (i < 6 ? (Math.random() - 0.5) * 2 : 0), y = lerp(mz[1], o.y + 1.5, u) + (i < 6 ? (Math.random() - 0.5) * 2 : 0), z = lerp(mz[2], o.z, u) + (i < 6 ? (Math.random() - 0.5) * 2 : 0); const dx = x - px, dy = y - py, dz = z - pz, l = Math.hypot(dx, dy, dz) || 1; R.bbs.streak((x + px) / 2, (y + py) / 2, (z + pz) / 2, dx / l, dy / l, dz / l, l, 0.5, S.streak, [0.5, 1, 1], 1); px = x; py = y; pz = z; } R.bbs.bb(o.x, o.y + 1.5, o.z, 4, 4, S.glow, [0.4, 0.95, 1], 0.9, true); }
    }
    else if (s.type === 'geyser') {
      const gy = this.terrain.height(s.x, s.z);
      if (!s.fired) R.flat.flat(s.x, gy + 0.1, s.z, 6, 6, t * 3, S.warn, [0.4, 0.7, 1], 0.6 + Math.sin(t * 20) * 0.3, true);
      else if (s.t < 1.4) { for (let i = 0; i < 4; i++) this.fx.add(s.x + (Math.random() - 0.5) * 1.6, gy + 0.5, s.z + (Math.random() - 0.5) * 1.6, (Math.random() - 0.5) * 2, 16 + Math.random() * 8, (Math.random() - 0.5) * 2, 1.0, 0.9, 0.4, [0.7, 0.9, 1], 0.9, 'drop', 2); R.bbs.streak(s.x, gy + 6, s.z, 0, 1, 0, 12, 2.5, S.streak, [0.6, 0.85, 1], 0.7); }
    }
    else if (s.type === 'dash') { const p = this.muzzle(k, [0, 0, 0]); R.bbs.bb(p[0], p[1], p[2], 3, 3, S.glow, [0.5, 0.85, 1], 0.6, true); }
  },
  engineSound() {
    const k = this.player;
    if (!Sound.engine) return;
    if (this.paused || this.state !== 'race' || !k || k.finished || k.out) { if (this._eng) { Sound.engine(false, 0); this._eng = false; } return; }
    this._eng = true; Sound.engine(true, clamp(k.speed / (k.vmax * 1.3), 0, 1) * (k.air ? 1.1 : 1));
  },

  /* ---------- HUD ---------- */
  drawLoading(ctx) {
    const W = Game.cssW, H = Game.cssH, t = performance.now() / 1000;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a0626'); g.addColorStop(0.6, '#5a1a4a'); g.addColorStop(1, '#ff8a4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    BurnsUI.text(ctx, this.isBattle ? cartArena(this.arenaId).name : (CART_TRACKS[this.trackId] || {}).name || 'ART CART', W / 2, H * 0.4, Math.min(34, W * 0.07), '#ffffff', { glow: '#ff4fd8' });
    BurnsUI.text(ctx, this.loadMsg + '…', W / 2, H * 0.4 + 36, 13, 'rgba(255,255,255,0.85)', { ui: true, stroke: false });
    const bw = Math.min(260, W * 0.6); ctx.fillStyle = 'rgba(255,255,255,0.15)'; burnsRR(ctx, W / 2 - bw / 2, H * 0.4 + 58, bw, 10, 5); ctx.fill();
    ctx.fillStyle = '#ffd84a'; burnsRR(ctx, W / 2 - bw / 2, H * 0.4 + 58, Math.max(10, bw * (this.loadP || 0.04)), 10, 5); ctx.fill();
    for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.7 * Math.max(0, Math.sin(t * 5 - i))})`; ctx.beginPath(); ctx.arc(W / 2 - 14 + i * 14, H * 0.4 + 86, 4, 0, TAU); ctx.fill(); }
  },
  drawNoGL(ctx) {
    const W = Game.cssW, H = Game.cssH;
    ctx.fillStyle = '#140a22'; ctx.fillRect(0, 0, W, H);
    BurnsUI.text(ctx, 'ART CART NEEDS 3D GRAPHICS', W / 2, H * 0.36, Math.min(22, W * 0.05), '#ffffff');
    BurnsUI.text(ctx, this.noglMsg || 'WebGL is not available on this device or browser.', W / 2, H * 0.36 + 32, 12, 'rgba(255,255,255,0.8)', { ui: true, stroke: false });
    BurnsUIKit.drawButtons(ctx, this.noglBtns || []);
  },
  drawHUD(ctx, fdt) {
    const W = Game.cssW, H = Game.cssH, k = this.player, t = this.time, L = Input.layout;
    if (!k || window.__cartHideHUD) return;
    const top = Math.max(10, insets.t + 6), left = Math.max(14, insets.l + 6), portrait = H > W;
    // screen tint: dazzle white-out, boost flash, storm dust
    if (this.white > 0) { ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, this.white * 0.6)})`; ctx.fillRect(0, 0, W, H); }
    if (k.dazzleT > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 6; i++) { const ex = i % 2 ? 0.08 + 0.12 * Math.sin(i * 3.1 + t) : 0.92 - 0.12 * Math.sin(i * 2.3 + t), x = ex * W, y = (Math.cos(i * 7.3 + t * 0.9) * 0.4 + 0.5) * H, r = 4 + 6 * Math.abs(Math.sin(t * 6 + i)); ctx.fillStyle = `rgba(255,255,255,${0.22 * Math.min(1, k.dazzleT)})`; ctx.beginPath(); ctx.moveTo(x, y - r * 2); ctx.lineTo(x + r * 0.4, y); ctx.lineTo(x, y + r * 2); ctx.lineTo(x - r * 0.4, y); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - r * 2, y); ctx.lineTo(x, y + r * 0.4); ctx.lineTo(x + r * 2, y); ctx.lineTo(x, y - r * 0.4); ctx.closePath(); ctx.fill(); } ctx.restore(); }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,220,160,${this.flash * 0.25})`; ctx.fillRect(0, 0, W, H); }
    if (this.E.storm && this.stormK > 0.1) { ctx.fillStyle = `rgba(220,190,150,${this.stormK * 0.35})`; ctx.fillRect(0, 0, W, H); }
    const racing = this.state === 'race' || this.state === 'count';
    // ---- intro card ----
    if (this.state === 'intro') {
      const a = clamp(this.stateT * 2, 0, 1) * clamp((3.6 - this.stateT) * 2, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      const y = portrait ? H * 0.22 : H * 0.2;
      ctx.fillStyle = 'rgba(10,4,20,0.55)'; ctx.fillRect(0, y - 46, W, 112);
      BurnsUI.text(ctx, this.name, W / 2, y, Math.min(34, W * 0.075), '#ffffff', { glow: '#ff4fd8' });
      const sub = this.isBattle ? CART_OBJECTIVES[this.objective].name + ' · ' + CART_OBJECTIVES[this.objective].short : (this.mode === 'gp' ? this.cup.name + ' · RACE ' + (this.raceIdx + 1) + '/4' : this.mode === 'tt' ? 'TIME TRIAL' : 'QUICK RACE') + ' · ' + CART_TOD[this.E.tod];
      BurnsUI.text(ctx, sub, W / 2, y + 32, 13, '#ffd84a', {});
      if (this.isBattle) { ctx.font = `600 12px ${FONT_UI}`; const lines = BurnsUI.wrap(ctx, CART_OBJECTIVES[this.objective].desc, Math.min(520, W - 40)); lines.forEach((ln, i) => BurnsUI.text(ctx, ln, W / 2, y + 54 + i * 16, 12, 'rgba(255,255,255,0.9)', { ui: true, stroke: false })); }
      BurnsUI.text(ctx, 'TAP TO START', W / 2, H - Math.max(30, insets.b + 24), 13, 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 5)) + ')', {});
      ctx.restore();
    }
    // ---- position / laps / time (races) ----
    if (this.isRace && (racing || this.state === 'done')) {
      const rk = k.rank, col = rk === 1 ? '#ffd84a' : rk <= 3 ? '#ffffff' : '#ff9ad8';
      if (this.mode !== 'tt') { BurnsUI.text(ctx, cartOrdinal(rk), left + 34, top + 30, 34, col, { glow: rk === 1 ? '#ffb020' : null }); BurnsUI.text(ctx, '/' + this.karts.length, left + 78, top + 38, 14, 'rgba(255,255,255,0.7)', { align: 'left' }); }
      const ly = this.mode === 'tt' ? top + 22 : top + 66;
      BurnsUI.text(ctx, 'LAP ' + clamp(k.lap, 1, this.laps) + '/' + this.laps, left, ly, 16, '#38f2ff', { align: 'left' });
      BurnsUI.text(ctx, cartFmtTime(this.raceT), left, ly + 22, 13, '#ffffff', { align: 'left', ui: true });
      if (this.lastLap && this.lastLap.show > 0) { this.lastLap.show -= fdt; BurnsUI.text(ctx, 'LAP ' + cartFmtTime(this.lastLap.t), left, ly + 42, 12, '#ffd84a', { align: 'left', ui: true }); }
      if (k.wrongT > 1.2) BurnsUI.text(ctx, 'WRONG WAY!', W / 2, H * 0.32, 26, '#ff5a5a', { glow: '#ff0000' });
      this.drawMinimap(ctx);
    }
    // ---- battle scoreboard ----
    if (this.isBattle && !this.isRace && (racing || this.state === 'done')) this.drawBattleHUD(ctx, top, left);
    if (this.isBattle && this.isRace && (racing || this.state === 'done')) BurnsUI.text(ctx, 'SCRAMBLE RACE', W / 2, top + 14, 13, '#ff9a3a', {});
    // ---- countdown ----
    if (this.state === 'count') { const n = 3 - Math.floor(this.stateT); if (n >= 1) { const u = this.stateT % 1; BurnsUI.text(ctx, String(n), W / 2, H * 0.38, 70 * (1.3 - u * 0.3), ['#ff5a5a', '#ffd84a', '#7aff8a'][3 - n], { glow: '#000' }); } BurnsUI.text(ctx, 'TAP HOP JUST BEFORE GO FOR A ROCKET START', W / 2, H * 0.38 + 54, 11, 'rgba(255,255,255,0.8)', { ui: true }); }
    // ---- banners ----
    let by = portrait ? H * 0.2 : H * 0.24;
    if (!this.paused) for (const m of this.msgs) { const u = 1 - m.t / m.max, a = Math.min(1, m.t * 3, u * 8), s = 1 + Math.max(0, 0.25 - u) * 1.2, fs = (m.small ? Math.min(16, W * 0.04) : Math.min(26, W * 0.058)) * s; ctx.save(); ctx.globalAlpha = a; BurnsUI.text(ctx, m.text, W / 2, by, fs, m.col, { glow: m.small ? null : m.col }); if (m.sub) BurnsUI.text(ctx, m.sub, W / 2, by + fs * 0.6 + 8, 11, '#ffffff', { ui: true }); ctx.restore(); by += fs + (m.sub ? 20 : 8); }
    // ---- controls ----
    if (racing && !this.paused) this.drawControls(ctx);
    // pause button
    if (L && (racing || this.state === 'intro')) { ctx.save(); ctx.fillStyle = 'rgba(10,6,24,0.55)'; ctx.beginPath(); ctx.arc(L.pause.x, L.pause.y, 19, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = '#ffffff'; ctx.fillRect(L.pause.x - 6, L.pause.y - 7, 4, 14); ctx.fillRect(L.pause.x + 2, L.pause.y - 7, 4, 14); ctx.restore(); }
    if (this.state === 'done' && this.stateT > 1.5) BurnsUI.text(ctx, 'TAP TO CONTINUE', W / 2, H - Math.max(26, insets.b + 20), 13, 'rgba(255,255,255,' + (0.5 + 0.5 * Math.sin(t * 5)) + ')', {});
    if (this.state === 'results' || this.state === 'trophy') this.drawResults(ctx);
    if (this.paused) this.drawPause(ctx);
    if (window.__cartDebug) BurnsUI.text(ctx, `${this.stats.fps.toFixed(0)}fps · ${this.stats.draws} draws · ${(this.stats.tris / 1000).toFixed(0)}k tris · ${this.stats.cpu.toFixed(1)}ms · q${this.q.toFixed(2)} · ${BurnsGL.tier}`, W / 2, H - 12, 11, '#9affc8', { ui: true });
  },
  drawControls(ctx) {
    const L = Input.layout, k = this.player; if (!L) return;
    const touch = Input.usingTouch || Game.forceTouchUI;
    const btn = (b, label, col, held, sub, fill) => {
      ctx.save(); ctx.translate(b.x, b.y); const s = held ? 0.92 : 1; ctx.scale(s, s);
      const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, 2, 0, 0, b.r); g.addColorStop(0, rgba(col, held ? 0.9 : 0.62)); g.addColorStop(1, rgba(shade(col, -0.55), held ? 0.8 : 0.5));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.fill();
      if (fill !== undefined) { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, b.r - 3, 0, TAU); ctx.stroke(); ctx.strokeStyle = fill >= 1 ? '#ffffff' : col; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, b.r - 3, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(fill, 0, 1)); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, b.r, 0, TAU); ctx.stroke();
      if (label) BurnsUI.text(ctx, label, 0, sub ? -b.r * 0.12 : 1, Math.round(b.r * (label.length > 4 ? 0.3 : 0.38)), '#ffffff', { sw: 3 });
      if (sub) BurnsUI.text(ctx, sub, 0, b.r * 0.36, Math.max(8, Math.round(b.r * 0.2)), 'rgba(255,255,255,0.9)', { ui: true, sw: 2.5 });
      ctx.restore();
    };
    // FIRE: the car's signature weapon with its reload meter
    const w = k.wpn, ready = w.t <= 0 && !k.out, fill = 1 - w.t / w.def.reload;
    const fb = this.btnFire;
    if (this.mode !== 'tt' && fb) {
      if (ready) { ctx.save(); ctx.shadowColor = w.def.col; ctx.shadowBlur = 24 + 10 * Math.sin(this.time * 8); ctx.fillStyle = rgba(w.def.col, 0.25); ctx.beginPath(); ctx.arc(fb.x, fb.y, fb.r * 1.18, 0, TAU); ctx.fill(); ctx.restore(); }
      btn(fb, null, ready ? w.def.col : '#4a4458', Input.hudHeld.fire, null, fill);
      cartWeaponIcon(ctx, w.id, fb.x, fb.y - fb.r * 0.12, fb.r * 0.62, ready ? 1 : 0.45, this.time);
      BurnsUI.text(ctx, ready ? 'FIRE!' : Math.ceil(w.t) + 's', fb.x, fb.y + fb.r * 0.52, Math.round(fb.r * 0.24), ready ? '#ffffff' : 'rgba(255,255,255,0.75)', { sw: 3 });
      if (touch || ready) BurnsUI.text(ctx, w.def.name, fb.x, fb.y - fb.r - 10, 10, ready ? w.def.col : 'rgba(255,255,255,0.6)', { sw: 2.5 });
      // ITEM slot (pickup)
      const ab = L.action, has = k.item || k.roul > 0;
      btn(ab, null, has ? '#ff4b7d' : '#3a3448', Input.action);
      if (k.roul > 0) cartItemIcon(ctx, CART_ITEM_IDS[Math.floor(this.time * 14) % CART_ITEM_IDS.length], ab.x, ab.y - 3, ab.r * 0.62, 0.8);
      else if (k.item) cartItemIcon(ctx, k.item, ab.x, ab.y - 3, ab.r * 0.66, 1);
      BurnsUI.text(ctx, k.item ? CART_ITEMS[k.item].name : 'ITEM', ab.x, ab.y + ab.r + 10, 9, 'rgba(255,255,255,0.8)', { sw: 2.5 });
    }
    if (touch) {
      btn(L.jump, 'HOP', '#c04bff', Input.jump, 'DRIFT');
      btn(this.btnBrake, 'BRAKE', '#5a6a8a', Input.hudHeld.brake);
      if (!this.autoGas) btn(this.btnGas, 'GAS', '#3aa860', Input.hudHeld.gas);
      // steering stick
      const st = Input.stick, hx = st.active ? st.ox : L.stickHome.x, hy = st.active ? st.oy : L.stickHome.y;
      ctx.save(); ctx.globalAlpha = st.active ? 0.9 : 0.55;
      ctx.fillStyle = 'rgba(10,10,20,0.35)'; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(hx, hy, L.stickHome.r, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(hx + s * L.stickHome.r * 0.85, hy); ctx.lineTo(hx + s * L.stickHome.r * 0.6, hy - 9); ctx.lineTo(hx + s * L.stickHome.r * 0.6, hy + 9); ctx.closePath(); ctx.fill(); }
      let kx = hx, ky = hy; if (st.active) { const dx = st.x - st.ox, dy = st.y - st.oy, d = Math.hypot(dx, dy), m = L.stickHome.r * 0.6; kx = hx + (d > m ? dx / d * m : dx); ky = hy + (d > m ? dy / d * m : dy); }
      const g = ctx.createRadialGradient(kx - 6, ky - 6, 2, kx, ky, L.r * 0.55); g.addColorStop(0, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(180,160,220,0.45)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(kx, ky, L.r * 0.48, 0, TAU); ctx.fill();
      if (!st.active && this.state === 'count') BurnsUI.text(ctx, 'STEER', hx, hy + L.stickHome.r + 12, 10, 'rgba(255,255,255,0.7)', { ui: true });
      ctx.restore();
    } else if (this.state === 'count') BurnsUI.text(ctx, '← → STEER   SPACE HOP/DRIFT   X ITEM   F FIRE   ' + (this.autoGas ? '↓ BRAKE' : '↑ GAS ↓ BRAKE'), Game.cssW / 2, Game.cssH - Math.max(20, insets.b + 16), 12, '#ffffff', { ui: true });
    // vibes (battle) next to the item slot
    if (this.objective === 'vibe' && this.state === 'race') for (let v = 0; v < 4; v++) { const x = L.action.x - L.action.r + v * 18, y = L.action.y - L.action.r - 30; cartHeartIcon(ctx, x, y, 7, v < k.vibes ? '#ff4f8a' : 'rgba(255,255,255,0.2)'); }
  },
  drawMinimap(ctx) {
    const T = this.TR; if (!T) return;
    const W = Game.cssW, H = Game.cssH, portrait = H > W, S = portrait ? 92 : 104;
    const x0 = portrait ? Math.max(14, insets.l + 6) : W - Math.max(14, insets.r + 6) - S - 46, y0 = portrait ? Math.max(10, insets.t + 6) + 130 : Math.max(10, insets.t + 6);
    if (!this._mm || this._mmS !== S) {
      const c = makeCanvas(S * 2, S * 2), x = c.getContext('2d'), b = T.bounds, sc = (S * 2 - 16) / Math.max(b.x1 - b.x0, b.z1 - b.z0);
      x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 10; const path = () => { x.beginPath(); for (let i = 0; i <= T.N; i += 3) { const k = i % T.N, px = S + (T.X[k] - (b.x0 + b.x1) / 2) * -sc, pz = S + (T.Z[k] - (b.z0 + b.z1) / 2) * -sc; if (i) x.lineTo(px, pz); else x.moveTo(px, pz); } x.closePath(); };
      path(); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.85)'; x.lineWidth = 4; path(); x.stroke();
      this._mm = c; this._mmS = S; this._mmK = sc;
    }
    ctx.save(); ctx.globalAlpha = 0.9; ctx.drawImage(this._mm, x0, y0, S, S); ctx.restore();
    const b = T.bounds, sc = this._mmK / 2, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    for (const k of this.karts.slice().sort((a, b2) => a.player - b2.player)) { const px = x0 + S / 2 + (k.x - cx) * -sc, py = y0 + S / 2 + (k.z - cz) * -sc; ctx.fillStyle = k.player ? '#ffffff' : k.car.col; ctx.strokeStyle = '#000'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, py, k.player ? 4.5 : 3.2, 0, TAU); ctx.fill(); ctx.stroke(); }
  },
  drawBattleHUD(ctx, top, left) {
    const W = Game.cssW, O = this.obj, D = CART_OBJECTIVES[this.objective], k = this.player;
    const pw = Math.min(250, W * 0.42), px = W / 2 - pw / 2;
    ctx.save(); ctx.fillStyle = 'rgba(10,4,20,0.55)'; burnsRR(ctx, px, top - 2, pw, 46, 12); ctx.fill(); ctx.restore();
    const lbTop = W < Game.cssH ? top + 58 : top;   // portrait: the leaderboard moves below the objective panel
    BurnsUI.text(ctx, D.name, W / 2, top + 11, 13, '#ffd84a', {});
    BurnsUI.text(ctx, cartFmtClock(O.time), W / 2, top + 31, 16, O.time < 15 ? '#ff6a6a' : '#ffffff', { ui: true });
    // leaderboard
    const order = this.battleRank(), unit = this.objective === 'vibe' ? '♥' : this.objective === 'hill' ? 's' : this.objective === 'flag' ? '⚑' : '●';
    const goal = D.goal ? '/' + D.goal : '';
    const nm = q => q.player ? 'YOU' : q.car.name.length > 13 ? q.car.name.slice(0, 12) + '…' : q.car.name, vx = left + 186;
    order.slice(0, 4).forEach((q, i) => { const y = lbTop + 18 + i * 17, val = this.objective === 'vibe' ? (q.out ? 'OUT' : q.vibes + unit) : Math.floor(q.score) + goal + unit; ctx.fillStyle = q.car.col; ctx.beginPath(); ctx.arc(left + 5, y, 4.5, 0, TAU); ctx.fill(); BurnsUI.text(ctx, (i + 1) + '. ' + nm(q), left + 14, y, 11, q.player ? '#ffd84a' : '#ffffff', { align: 'left', ui: true }); BurnsUI.text(ctx, val, vx, y, 11, q.player ? '#ffd84a' : 'rgba(255,255,255,0.85)', { align: 'right', ui: true }); });
    if (order.indexOf(k) >= 4) { const y = lbTop + 18 + 4 * 17; BurnsUI.text(ctx, order.indexOf(k) + 1 + '. YOU', left + 14, y, 11, '#ffd84a', { align: 'left', ui: true }); BurnsUI.text(ctx, this.objective === 'vibe' ? (k.out ? 'OUT' : k.vibes + unit) : Math.floor(k.score) + goal + unit, vx, y, 11, '#ffd84a', { align: 'right', ui: true }); }
    // objective arrow: where to go
    let tgt = null;
    if (this.objective === 'hill') tgt = this.E.zones[O.zone];
    if (this.objective === 'flag') tgt = O.flag.holder === k ? this.E.captures[O.capture] : O.flag;
    if (tgt && this.state === 'race') {
      const R = this.R, p = {}; if (R.project(tgt.x, (tgt.y || this.terrain.height(tgt.x, tgt.z)) + 3, tgt.z, W, Game.cssH, p)) { const x = clamp(p.x, 30, W - 30), y = clamp(p.y, 70, Game.cssH - 120); ctx.save(); ctx.translate(x, y); ctx.fillStyle = this.objective === 'flag' && O.flag.holder === k ? '#7aff8a' : '#ffd84a'; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(-9, -6); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.restore(); }
    }
    if (k.out && this.state === 'race') BurnsUI.text(ctx, 'YOUR LIGHTS ARE OUT · SPECTATING', W / 2, Game.cssH * 0.3, 16, '#ff9ad8', {});
    if (this.objective === 'hill' && k.inZone && this.state === 'race') BurnsUI.text(ctx, 'IN THE ZONE!', W / 2, top + 64, 14, '#ffd84a', { glow: '#ffb020' });
  },
  /* ---------- results + pause ---------- */
  panelRect() { const W = Game.cssW, H = Game.cssH, pw = Math.min(560, W - 28), ph = Math.min(H - 24, 380); return { x: (W - pw) / 2, y: (H - ph) / 2, w: pw, h: ph }; },
  buildButtons() {
    const P = this.panelRect(), bw = Math.min(160, (P.w - 40) / 3), y = P.y + P.h - 56, cx = P.x + P.w / 2;
    const B = [];
    if (this.state === 'trophy') B.push({ x: cx - bw / 2, y, w: bw, h: 44, label: 'MENU', primary: true, fn: () => this.leave() });
    else if (this.mode === 'gp') {
      const last = this.raceIdx >= this.cup.tracks.length - 1;
      B.push({ x: cx + 6, y, w: bw, h: 44, label: last ? 'TROPHY ▶' : 'NEXT RACE ▶', primary: true, fn: () => last ? this.awardTrophy() : this.nextRace() });
      B.push({ x: cx - bw - 6, y, w: bw, h: 44, label: 'RETRY', fn: () => this.restart() });
    } else {
      B.push({ x: cx + 6, y, w: bw, h: 44, label: this.isBattle ? 'REMATCH' : 'RETRY', primary: true, fn: () => this.restart() });
      B.push({ x: cx - bw - 6, y, w: bw, h: 44, label: 'MENU', fn: () => this.leave() });
    }
    B.focus = 0; this.btns = B;
  },
  updateResults() { const h = BurnsUIKit.hitButtons(this.btns); if (h) h.fn(); },
  drawResults(ctx) {
    const P = this.panelRect(), a = clamp(this.stateT * 3, 0, 1);
    ctx.save(); ctx.globalAlpha = a; BurnsUIKit.panel(ctx, P.x, P.y, P.w, P.h);
    if (this.state === 'trophy') {
      const pos = this.trophyPos, col = ['#ffd84a', '#dfe6f2', '#ffa65a'][pos - 1] || '#8a7a9a';
      BurnsUIKit.title(ctx, this.cup.name, P.x + P.w / 2, P.y + 34, 24);
      cartTrophyIcon(ctx, P.x + P.w / 2, P.y + P.h * 0.45, Math.min(90, P.h * 0.28), col, this.time);
      BurnsUI.text(ctx, pos <= 3 ? ['', 'GOLD TROPHY!', 'SILVER TROPHY!', 'BRONZE TROPHY!'][pos] : cartOrdinal(pos) + ' OVERALL', P.x + P.w / 2, P.y + P.h - 92, 22, col, { glow: pos <= 3 ? col : null });
    } else if (this.isBattle) {
      const D = CART_OBJECTIVES[this.objective], win = this.results[0];
      BurnsUIKit.title(ctx, win.player ? 'YOU WIN!' : win.car + ' WINS', P.x + P.w / 2, P.y + 30, 24);
      BurnsUI.text(ctx, D.name + ' · ' + this.name, P.x + P.w / 2, P.y + 56, 12, '#ffd84a', { ui: true });
      this.results.forEach((r, i) => { const y = P.y + 82 + i * 26; if (y > P.y + P.h - 70) return; ctx.fillStyle = r.player ? 'rgba(255,216,74,0.18)' : 'rgba(255,255,255,0.05)'; burnsRR(ctx, P.x + 16, y - 11, P.w - 32, 22, 8); ctx.fill(); BurnsUI.text(ctx, cartOrdinal(r.rank), P.x + 40, y, 12, r.rank === 1 ? '#ffd84a' : '#ffffff', {}); BurnsUI.text(ctx, r.car + ' · ' + r.name, P.x + 70, y, 11, '#ffffff', { align: 'left', ui: true }); BurnsUI.text(ctx, this.objective === 'vibe' ? (r.out ? 'OUT' : r.score + ' ♥') : r.score + (this.objective === 'hill' ? 's' : ''), P.x + P.w - 90, y, 12, '#9affc8', { align: 'right', ui: true }); BurnsUI.text(ctx, r.hits + ' hits', P.x + P.w - 28, y, 10, 'rgba(255,255,255,0.6)', { align: 'right', ui: true }); });
    } else {
      const me = this.results.find(r => r.player);
      BurnsUIKit.title(ctx, this.mode === 'tt' ? 'TIME TRIAL' : cartOrdinal(me.rank) + ' PLACE', P.x + P.w / 2, P.y + 30, 24);
      BurnsUI.text(ctx, this.name + (this.newRecord && this.newRecord.total ? ' · NEW RECORD!' : ''), P.x + P.w / 2, P.y + 56, 12, '#ffd84a', { ui: true });
      const st = this.mode === 'gp' ? this.standings() : null, half = st ? P.w / 2 - 10 : P.w - 32;
      this.results.forEach((r, i) => { const y = P.y + 80 + i * 25; if (y > P.y + P.h - 70) return; ctx.fillStyle = r.player ? 'rgba(255,216,74,0.18)' : 'rgba(255,255,255,0.05)'; burnsRR(ctx, P.x + 16, y - 11, half, 22, 8); ctx.fill(); BurnsUI.text(ctx, cartOrdinal(r.rank), P.x + 36, y, 11, r.rank === 1 ? '#ffd84a' : '#ffffff', {}); BurnsUI.text(ctx, r.player ? 'YOU' : r.car, P.x + 58, y, 11, '#ffffff', { align: 'left', ui: true }); BurnsUI.text(ctx, (r.est ? '~' : '') + cartFmtTime(r.t) + (r.pts ? '  +' + r.pts : ''), P.x + 16 + half - 8, y, 11, '#9affc8', { align: 'right', ui: true }); });
      if (st) { BurnsUI.text(ctx, 'CUP STANDINGS', P.x + P.w * 0.75, P.y + 80 - 2, 11, '#ff9ad8', {}); st.forEach((s, i) => { const y = P.y + 100 + i * 23; if (y > P.y + P.h - 70) return; BurnsUI.text(ctx, (i + 1) + '. ' + (s.player ? 'YOU' : s.car), P.x + P.w / 2 + 14, y, 11, s.player ? '#ffd84a' : '#ffffff', { align: 'left', ui: true }); BurnsUI.text(ctx, s.pts + ' PTS', P.x + P.w - 22, y, 11, '#9affc8', { align: 'right', ui: true }); }); }
    }
    BurnsUIKit.drawButtons(ctx, this.btns || []);
    ctx.restore();
  },
  buildPause() {
    const W = Game.cssW, H = Game.cssH, bw = Math.min(240, W * 0.6), x = (W - bw) / 2, y0 = H / 2 - 92;
    const sv = cartSave();
    this.pauseBtns = [
      { x, y: y0, w: bw, h: 44, label: 'RESUME', primary: true, fn: () => this.closePause() },
      { x, y: y0 + 52, w: bw, h: 40, label: 'RESTART', fn: () => this.restart() },
      { x, y: y0 + 100, w: bw, h: 36, size: 12, label: 'AUTO-GAS: ' + (this.autoGas ? 'ON' : 'OFF'), fn: () => { this.autoGas = !this.autoGas; sv.autoGas = this.autoGas; Save.save(); this.buildPause(); } },
      { x, y: y0 + 144, w: bw, h: 40, label: 'QUIT TO MENU', fn: () => this.leave() }
    ];
    this.pauseBtns.focus = 0;
  },
  updatePause() { const h = BurnsUIKit.hitButtons(this.pauseBtns); if (h) h.fn(); else if (Input.pausePressed || Input.uiKey === 'pause') this.closePause(); },
  drawPause(ctx) {
    const W = Game.cssW, H = Game.cssH;
    ctx.fillStyle = 'rgba(8,4,18,0.62)'; ctx.fillRect(0, 0, W, H);
    BurnsUIKit.title(ctx, 'PAUSED', W / 2, H / 2 - 130, 30);
    BurnsUIKit.drawButtons(ctx, this.pauseBtns || []);
  }
});

/* ---------------- 2D icons for the HUD and menus ---------------- */
function cartHeartIcon(ctx, x, y, s, col) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s * 1.6, -s * 0.2, -s * 0.6, -s * 1.4, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.6, -s * 1.4, s * 1.6, -s * 0.2, 0, s * 0.9); ctx.fill(); ctx.restore(); }
function cartWeaponIcon(ctx, id, x, y, s, a, t) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const W = CART_WEAPONS[id], col = W ? W.col : '#ffffff';
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = col; ctx.lineWidth = Math.max(2, s * 0.12);
  switch (id) {
    case 'bassdrop': for (let i = 0; i < 3; i++) { ctx.globalAlpha = a * (1 - i * 0.28); ctx.beginPath(); ctx.arc(0, 0, s * (0.3 + i * 0.22), 0, TAU); ctx.stroke(); } ctx.globalAlpha = a; cartHeartIcon(ctx, 0, 0, s * 0.22, col); break;
    case 'dazzle': ctx.beginPath(); ctx.arc(-s * 0.35, 0, s * 0.28, 0, TAU); ctx.fill(); ctx.stroke(); for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-s * 0.05, i * s * 0.1); ctx.lineTo(s * 0.55, i * s * 0.35); ctx.stroke(); } break;
    case 'torch': for (let i = 0; i < 8; i++) { const a2 = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(Math.cos(a2) * s * 0.2, Math.sin(a2) * s * 0.2); ctx.lineTo(Math.cos(a2) * s * 0.55, Math.sin(a2) * s * 0.55); ctx.stroke(); } ctx.beginPath(); ctx.arc(0, 0, s * 0.22, 0, TAU); ctx.fill(); break;
    case 'fireball': for (const dx of [-0.35, 0, 0.35]) { ctx.beginPath(); ctx.arc(dx * s, -Math.abs(dx) * s * 0.4 + s * 0.08, s * 0.16, 0, TAU); ctx.fill(); ctx.stroke(); } break;
    case 'bubbles': for (const [dx, dy, r] of [[-0.3, 0.1, 0.18], [0.05, -0.2, 0.24], [0.35, 0.15, 0.15], [0.05, 0.3, 0.12]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fillStyle = 'rgba(160,240,255,0.5)'; ctx.fill(); ctx.stroke(); } break;
    case 'laser': ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.35); ctx.lineTo(0, -s * 0.4); ctx.lineTo(s * 0.5, s * 0.35); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.lineTo(s * 0.6, -s * 0.6); ctx.moveTo(0, -s * 0.4); ctx.lineTo(-s * 0.6, -s * 0.6); ctx.stroke(); break;
    case 'sprinkles': ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.32, Math.PI, TAU); ctx.closePath(); ctx.fill(); ctx.stroke(); for (let i = 0; i < 5; i++) { ctx.strokeStyle = BURNS_NEON[i]; ctx.beginPath(); ctx.moveTo((i - 2) * s * 0.12, -s * 0.05); ctx.lineTo((i - 2) * s * 0.12 + s * 0.05, -s * 0.12); ctx.stroke(); } break;
    case 'cannon': ctx.fillStyle = '#2a2a30'; ctx.beginPath(); ctx.arc(-s * 0.4, 0, s * 0.14, 0, TAU); ctx.arc(s * 0.4, 0, s * 0.14, 0, TAU); ctx.fill(); ctx.fillStyle = col; ctx.fillRect(-s * 0.2, -s * 0.18, s * 0.4, s * 0.36); ctx.strokeRect(-s * 0.2, -s * 0.18, s * 0.4, s * 0.36); break;
    case 'slime': ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 0.5, s * 0.2, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.arc(-s * 0.15, -s * 0.15, s * 0.12, 0, TAU); ctx.arc(s * 0.2, -s * 0.25, s * 0.09, 0, TAU); ctx.fill(); break;
    case 'zap': ctx.beginPath(); ctx.moveTo(s * 0.1, -s * 0.55); ctx.lineTo(-s * 0.25, s * 0.05); ctx.lineTo(s * 0.05, s * 0.05); ctx.lineTo(-s * 0.1, s * 0.55); ctx.lineTo(s * 0.3, -s * 0.1); ctx.lineTo(0, -s * 0.1); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
    case 'chomp': ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0.5, TAU - 0.5); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffffff'; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(s * 0.12 + i * s * 0.1, -s * 0.12); ctx.lineTo(s * 0.17 + i * s * 0.1, -s * 0.02); ctx.lineTo(s * 0.22 + i * s * 0.1, -s * 0.12); ctx.fill(); } break;
    case 'geyser': ctx.beginPath(); ctx.ellipse(0, s * 0.35, s * 0.45, s * 0.12, 0, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.3); ctx.quadraticCurveTo(0, -s * 0.7, s * 0.12, s * 0.3); ctx.fillStyle = '#bfe8ff'; ctx.fill(); ctx.stroke(); break;
    default: ctx.beginPath(); ctx.arc(0, 0, s * 0.4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function cartItemIcon(ctx, id, x, y, s, a) {
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const col = CART_ITEMS[id] ? CART_ITEMS[id].col : '#ffffff'; ctx.fillStyle = col; ctx.strokeStyle = '#1a1020'; ctx.lineWidth = Math.max(1.5, s * 0.08);
  switch (id) {
    case 'glow': for (let i = -1; i <= 1; i++) { ctx.save(); ctx.rotate(i * 0.35); ctx.fillStyle = BURNS_NEON[i + 2]; ctx.fillRect(-s * 0.08, -s * 0.5, s * 0.16, s * 0.9); ctx.restore(); } break;
    case 'water': ctx.fillRect(-s * 0.2, -s * 0.3, s * 0.4, s * 0.75); ctx.strokeRect(-s * 0.2, -s * 0.3, s * 0.4, s * 0.75); ctx.fillStyle = '#2a6aff'; ctx.fillRect(-s * 0.1, -s * 0.5, s * 0.2, s * 0.18); break;
    case 'tumble': ctx.strokeStyle = col; ctx.lineWidth = s * 0.08; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.25, i * 0.8, 0, TAU); ctx.stroke(); } break;
    case 'devil': ctx.strokeStyle = col; ctx.lineWidth = s * 0.1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(0, -s * 0.35 + i * s * 0.22, s * (0.45 - i * 0.09), s * 0.08, 0, 0, TAU); ctx.stroke(); } break;
    case 'potty': ctx.fillRect(-s * 0.28, -s * 0.45, s * 0.56, s * 0.9); ctx.strokeRect(-s * 0.28, -s * 0.45, s * 0.56, s * 0.9); ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.32, -s * 0.52, s * 0.64, s * 0.1); break;
    case 'foam': for (const [dx, dy, r] of [[-0.25, 0.1, 0.25], [0.15, -0.1, 0.3], [0.3, 0.2, 0.2], [-0.05, 0.25, 0.22]]) { ctx.beginPath(); ctx.arc(dx * s, dy * s, r * s, 0, TAU); ctx.fill(); ctx.stroke(); } break;
    case 'shield': { const g = ctx.createRadialGradient(-s * 0.15, -s * 0.15, 1, 0, 0, s * 0.5); g.addColorStop(0, '#ffffff'); g.addColorStop(1, col); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, TAU); ctx.fill(); ctx.stroke(); break; }
    case 'whistle': ctx.beginPath(); ctx.arc(s * 0.1, s * 0.05, s * 0.3, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillRect(-s * 0.5, -s * 0.2, s * 0.4, s * 0.18); ctx.strokeRect(-s * 0.5, -s * 0.2, s * 0.4, s * 0.18); break;
  }
  ctx.restore();
}
function cartTrophyIcon(ctx, x, y, s, col, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + Math.sin(t * 2) * 0.03, 1 + Math.sin(t * 2) * 0.03);
  const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, col); g.addColorStop(1, shade(col, -0.4));
  ctx.fillStyle = g; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.6); ctx.lineTo(s * 0.5, -s * 0.6); ctx.quadraticCurveTo(s * 0.5, s * 0.1, 0, s * 0.2); ctx.quadraticCurveTo(-s * 0.5, s * 0.1, -s * 0.5, -s * 0.6); ctx.fill(); ctx.stroke();
  ctx.lineWidth = s * 0.08; ctx.strokeStyle = col; ctx.beginPath(); ctx.arc(-s * 0.5, -s * 0.35, s * 0.2, Math.PI * 0.5, Math.PI * 1.5); ctx.stroke(); ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.35, s * 0.2, -Math.PI * 0.5, Math.PI * 0.5); ctx.stroke();
  ctx.fillStyle = g; ctx.fillRect(-s * 0.08, s * 0.18, s * 0.16, s * 0.3); ctx.fillRect(-s * 0.35, s * 0.46, s * 0.7, s * 0.14);
  cartHeartIcon(ctx, 0, -s * 0.25, s * 0.16, '#ff4fa8');
  ctx.restore();
}

/* ---------------- test API ---------------- */
window.BRADY_CART = {
  debug: {
    // start a race/battle right now (no menus); returns when the course is built
    start(opts) { const s = new CartRaceScene(opts || {}); Game.setScene(s); s.loadAll(); return this.state(); },
    scene() { return Game.scene; },
    skipIntro() { const s = Game.scene; if (s.state === 'intro') { s.state = 'count'; s.stateT = 0; } if (s.state === 'count') { s.stateT = 2.999; s.update(STEP); } return s.state; },
    // fast-forward the simulation (no rendering). o: { auto (AI drives the player), steer, gas, brake, fire, item, drift }
    sim(seconds, o) {
      const s = Game.scene, n = Math.round(seconds / STEP); o = o || {};
      if (o.auto !== undefined) s.autoDrive = !!o.auto;
      for (let i = 0; i < n; i++) {
        s.update(STEP);
        if (s.state === 'results' || s.state === 'trophy') break;
        if (!s.autoDrive && s.player && (s.state === 'race') && (o.steer !== undefined || o.gas !== undefined)) { const I = s.player.inp; I.steer = o.steer || 0; I.gas = o.gas === undefined ? 1 : o.gas; I.brake = o.brake || 0; }
      }
      return this.state();
    },
    fire() { const s = Game.scene, k = s.player; if (k.wpn.t > 0) return false; s.fireWeapon(k); return true; },
    give(item) { const k = Game.scene.player; k.item = item; k.roul = 0; return item; },
    useItem() { const s = Game.scene, k = s.player; if (!k.item) return false; s.useItem(k); return true; },
    state() {
      const s = Game.scene; if (!(s instanceof CartRaceScene)) return { scene: s && s.constructor.name };
      return { scene: 'CartRaceScene', state: s.state, mode: s.mode, objective: s.objective, track: s.trackId, arena: s.arenaId, raceT: +s.raceT.toFixed(2), draws: s.stats.draws, tris: Math.round(s.stats.tris), fps: Math.round(s.stats.fps), tier: BurnsGL.tier,
        karts: (s.karts || []).map(k => ({ id: k.id, player: k.player, x: +k.x.toFixed(1), y: +k.y.toFixed(2), z: +k.z.toFixed(1), speed: +k.speed.toFixed(1), lap: k.lap, rank: k.rank, finished: k.finished, wpn: k.wpn.id, ready: +k.wpn.t.toFixed(2), uses: k.wpn.uses, hits: k.wpn.hits, item: k.item, vibes: k.vibes, out: k.out, score: +(k.score || 0).toFixed(1) })),
        obj: s.obj ? { time: +s.obj.time.toFixed(1), zone: s.obj.zone, ended: s.obj.ended } : null, results: s.results || null };
    },
    events(type) { const s = Game.scene; return (s.events || []).filter(e => !type || e.type === type); },
    gl() { return { tier: BurnsGL.tier, gl2: BurnsGL.gl2, maxBones: BurnsGL.maxBones, failed: BurnsGL.failed }; },
    // put a car somewhere (index into karts; -1 = the player); frozen rivals sit still with the brakes on
    place(i, x, z, yaw, o) { const s = Game.scene, k = i < 0 ? s.player : s.karts[i]; o = o || {}; k.x = x; k.z = z; k.yaw = yaw || 0; k.vx = 0; k.vz = 0; k.vy = 0; k.air = false; k.y = s.terrain.height(x, z); if (o.speed) { k.vx = Math.sin(k.yaw) * o.speed; k.vz = Math.cos(k.yaw) * o.speed; } if (o.frozen !== undefined) k.frozen = o.frozen; k.invT = 0; k.spinT = 0; k.flipT = 0; k.bubbleT = 0; k.shieldT = 0; if (s.TR) s.TR.locateGlobal(k.x, k.z, k.loc); return { id: k.id, x: k.x, z: k.z }; },
    freezeAll(on) { for (const k of Game.scene.karts) if (!k.player) k.frozen = on !== false; },
    rearm(i) { const s = Game.scene, k = i < 0 || i === undefined ? s.player : s.karts[i]; k.wpn.t = 0; return k.wpn.id; },
    gfx(tier) { BurnsGL.configure(tier); return BurnsGL.tier; },
    // draw one frame by hand (tests stop the rAF loop); returns milliseconds
    frame() { const t = performance.now(); Game.ctx.setTransform(1, 0, 0, 1, 0, 0); Game.scene.draw(Game.ctx); return Math.round(performance.now() - t); },
    menu(o) { Game.setScene(new KartMenuScene(o)); return Game.scene.state; }
  }
};
