/* ============================================================
   ART CART — menus. KartMenuScene is the app's home screen:
   mode → driver → art car (with its signature weapon) → cup / track /
   arena + objective. A live 3D showroom (the engine's renderer) turns the
   chosen car with its driver on a neon stage at sunset; driver portraits
   are rendered once in 3D and cached into a 2D atlas.
   ============================================================ */
const CartShowroom = {
  world: null,
  build() {
    if (this.world) return this.world;
    const W = new BurnsWorld({ id: 3001, bounds: [-40, -40, 40, 40], ground: { base: '#c9a27e', crack: 0.3 } }, null), api = W.api;
    api.mesh(0, 0, m => {
      m.color('#2a2236').shine(2); m.roundCyl(0, 0, 0, 4.6, 0.35, 0.12); m.shine(0);
      m.color('#ff4fd8', 1); m.push(); m.tf(0, 0.36, 0); m.torus(0, 0, 0, 4.5, 0.06, { seg: 40, tseg: 5 }); m.pop();
      m.color('#38f2ff', 1); m.push(); m.tf(0, 0.12, 0); m.torus(0, 0, 0, 4.66, 0.05, { seg: 40, tseg: 5 }); m.pop(); m.emissive(0);
      return { cols: [] };
    }, { noAO: true });
    api.light(0, 0, 9, '#ff7ac8', 0.6);
    CartScene.art(api, 'lotus', -16, -22, 0.3, true, 0.9);
    CartScene.art(api, 'spinner', 18, -26, 0, true, 0.9);
    CartScene.art(api, 'obelisk', 30, 4, 0, true, 0.8);
    for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; api.glow(Math.sin(a) * 8, 0.4, Math.cos(a) * 8, 0.7, BURNS_NEON[i % 7]); }
    W.finish();
    // golden hour: warm key, neutral fill, so every car shows its real colours
    this.sky = Object.assign({}, BURNS_PALETTES.dusk, { fogD: 0.005, sun: [200, 9], key: '#ffe2c4', keyK: 1.05, sky: '#b8b4d0', gnd: '#8a6a5a', rim: '#ffe0f0', exposure: 1.08, hor: '#ffa070', mid: '#d08a90', midK: 0.25 });
    this.world = W;
    return W;
  }
};
class KartMenuScene {
  constructor(o) {
    o = o || {};
    this.t = 0; this.time = 0; this.state = o.state || 'mode';
    const sv = cartSave();
    this.drvSel = Math.max(0, CART_DRIVERS.findIndex(d => d.id === sv.driver));
    this.carSel = Math.max(0, CART_CARS.findIndex(c => c.id === sv.car));
    this.mode = o.mode || 'gp'; this.cupSel = 0; this.trackSel = 0; this.arenaSel = 0; this.objSel = 0;
    this.spin = 0; this.cam = { x: 0, y: 3, z: 10, tx: 0, ty: 1.5, tz: 0, fov: 0.75 };
    Input.setMode('ui'); Input.hud = null;
    Sound.music('kart_menu');
    this.gl = BurnsGL.init();
    if (this.gl) { BurnsGL.configure(sv.gfx || 'auto'); BURNS_ATLAS.init(); BURNS_SPRITES.init(); this.R = new BurnsRenderer(); this.env = {}; }
    this.jobs = this.gl ? [() => CartShowroom.build(), () => this.loadPreview()] : [];
    this.build();
  }
  resize() { this.build(); }
  get portrait() { return Game.cssH > Game.cssW; }
  loadPreview() {
    const car = CART_CARS[this.carSel], drv = CART_DRIVERS[this.drvSel];
    this.pcar = { id: car.id, M: CartModels.get(car.id, false), x: 0, y: 0.36, z: 0, yaw: 0, pitch: 0, roll: 0, bones: new Float32Array(16 * 12), wheelA: 0, steerVis: 0 };
    const D = CartDrivers.model(drv.id);
    this.pdrv = { id: drv.id, model: D.model, scale: D.scale, man: !!D.man, ch: new BurnsChar(D.model), bones: new Float32Array(16 * 12) };
    this.pdrv.ch.play('cartDrive', { steer: 0 }, true);
    this.pstand = new BurnsChar(D.model); this.pstand.play('wave', {}, true);
    this.pst = { t: 0, speed: 0.3, steer: 0, fire: 0, boost: 0, air: 0, beat: 0, night: 1 };
  }
  ensurePreview() {
    const car = CART_CARS[this.carSel], drv = CART_DRIVERS[this.drvSel];
    if (!this.gl) return;
    if (!this.pcar || this.pcar.id !== car.id || !this.pdrv || this.pdrv.id !== drv.id) this.loadPreview();
  }
  /* ---------- layout ---------- */
  build() {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, sv = cartSave();
    const safeT = Math.max(12, insets.t + 6), safeB = Math.max(14, insets.b + 8), safeL = Math.max(14, insets.l + 8), safeR = Math.max(14, insets.r + 8);
    const back = { x: safeL, y: safeT, w: 92, h: 38, label: '◀ BACK', fn: () => this.back() };
    this.cards = []; this.btns = [];
    if (this.state === 'mode') {
      const bw = Math.min(260, W * 0.62), x = P ? (W - bw) / 2 : W - safeR - bw - 10, y0 = P ? H * 0.5 : H * 0.3;
      this.btns = [
        { x, y: y0, w: bw, h: 48, label: 'GRAND PRIX', primary: true, fn: () => this.pick('gp') },
        { x, y: y0 + 56, w: bw, h: 44, label: 'BATTLE ARENAS', fn: () => this.pick('battle') },
        { x, y: y0 + 108, w: bw, h: 40, label: 'TIME TRIAL', fn: () => this.pick('tt') },
        { x, y: y0 + 156, w: bw / 2 - 4, h: 34, size: 10, label: 'AUTO-GAS ' + (sv.autoGas !== false ? 'ON' : 'OFF'), fn: () => { sv.autoGas = sv.autoGas === false; Save.save(); Sound.play('select'); this.build(); } },
        { x: x + bw / 2 + 4, y: y0 + 156, w: bw / 2 - 4, h: 34, size: 10, label: 'GFX ' + (sv.gfx || 'auto').toUpperCase(), fn: () => { const L = BURNS_GFX.names, i = L.indexOf(sv.gfx || 'auto'); sv.gfx = L[(i + 1) % L.length]; Save.save(); if (this.gl) BurnsGL.configure(sv.gfx); Sound.play('select'); this.build(); } }
      ];
      // in the standalone Art Cart app this menu IS home: nothing to go back to
      if (typeof BRADY_APP === 'undefined' || BRADY_APP !== 'kart') this.btns.push(back);
    } else if (this.state === 'driver') {
      const top = P ? H * 0.42 : safeT + 52, cols = P ? 5 : 7, gx = P ? safeL : W * 0.36, gw = P ? W - safeL - safeR : W - gx - safeR, rows = Math.ceil(CART_DRIVERS.length / cols);
      const cw = (gw - (cols - 1) * 6) / cols, ch = Math.min(cw * 1.2, (H - top - safeB - 60 - (rows - 1) * 6) / rows);
      CART_DRIVERS.forEach((d, i) => this.cards.push({ i, x: gx + (i % cols) * (cw + 6), y: top + Math.floor(i / cols) * (ch + 6), w: cw, h: ch }));
      this.btns = [{ x: P ? W / 2 - 90 : gx + gw / 2 - 90, y: H - safeB - 48, w: 180, h: 46, label: 'NEXT ▶', primary: true, fn: () => this.confirmDriver() }, back];
    } else if (this.state === 'car') {
      const aw = 52, ay = P ? H * 0.3 : H * 0.42;
      this.btns = [
        { x: safeL, y: ay, w: aw, h: 52, label: '◀', fn: () => this.stepCar(-1) },
        { x: P ? W - safeR - aw : W * 0.55 - aw, y: ay, w: aw, h: 52, label: '▶', fn: () => this.stepCar(1) },
        { x: P ? W / 2 - 90 : W - safeR - 190, y: H - safeB - 48, w: 180, h: 46, label: 'NEXT ▶', primary: true, fn: () => this.confirmCar() },
        back
      ];
    } else if (this.state === 'cup') {
      const top = safeT + 56, bottom = H - safeB;
      if (P) { const ch = (bottom - top - 12) / 2; CART_CUPS.forEach((c, i) => this.cards.push({ i, x: safeL, y: top + i * (ch + 12), w: W - safeL - safeR, h: ch })); }
      else { const cw = Math.min(330, (W - safeL - safeR - 16) / 2); CART_CUPS.forEach((c, i) => this.cards.push({ i, x: W / 2 - cw - 8 + i * (cw + 16), y: top, w: cw, h: bottom - top })); }
      this.btns = [back];
    } else if (this.state === 'track') {
      const top = safeT + 56, bottom = H - safeB, cols = P ? 2 : 4, nr = P ? 4 : 2;
      const cw = (W - safeL - safeR - (cols - 1) * 10) / cols, ch = (bottom - top - (nr - 1) * 10) / nr;
      CART_TRACK_ORDER.forEach((id, i) => this.cards.push({ i, id, x: safeL + (i % cols) * (cw + 10), y: top + Math.floor(i / cols) * (ch + 10), w: cw, h: ch }));
      this.btns = [back];
    } else if (this.state === 'arena') {
      const top = safeT + 56, bottom = H - safeB, n = CART_ARENAS.length;
      if (P) { const ch = (bottom - top - (n - 1) * 10) / n; CART_ARENAS.forEach((a, i) => this.cards.push({ i, x: safeL, y: top + i * (ch + 10), w: W - safeL - safeR, h: ch })); }
      else { const cw = (W - safeL - safeR - (n - 1) * 12) / n; CART_ARENAS.forEach((a, i) => this.cards.push({ i, x: safeL + i * (cw + 12), y: top, w: cw, h: bottom - top })); }
      this.btns = [back];
    } else if (this.state === 'objective') {
      const A = CART_ARENAS[this.arenaSel], top = safeT + 70, bottom = H - safeB, n = A.objectives.length, cols = P ? 1 : 2, nr = Math.ceil(n / cols);
      const cw = (W - safeL - safeR - (cols - 1) * 12) / cols, ch = Math.min(120, (bottom - top - (nr - 1) * 10) / nr);
      A.objectives.forEach((id, i) => this.cards.push({ i, id, x: safeL + (i % cols) * (cw + 12), y: top + Math.floor(i / cols) * (ch + 10), w: cw, h: ch }));
      this.btns = [back];
    }
    this.btns.focus = 0;
  }
  pick(mode) { Sound.play('select'); this.mode = mode; this.state = 'driver'; this.build(); }
  back() {
    Sound.play('back');
    const prev = { driver: 'mode', car: 'driver', cup: 'car', track: 'car', arena: 'car', objective: 'arena' }[this.state];
    if (!prev) { if (typeof BRADY_APP === 'undefined' || BRADY_APP !== 'kart') Game.setScene(new TitleScene()); return; }
    this.state = prev; this.build();
  }
  confirmDriver() { Sound.play('select'); const sv = cartSave(); sv.driver = CART_DRIVERS[this.drvSel].id; Save.save(); this.state = 'car'; this.build(); }
  stepCar(d) { this.carSel = (this.carSel + d + CART_CARS.length) % CART_CARS.length; this.spin = 0; Sound.play('select', { vol: 0.5 }); }
  confirmCar() { Sound.play('select'); const sv = cartSave(); sv.car = CART_CARS[this.carSel].id; Save.save(); this.state = this.mode === 'gp' ? 'cup' : this.mode === 'tt' ? 'track' : 'arena'; this.build(); }
  start(o) {
    Sound.play('select');
    const sv = cartSave();
    o = Object.assign({ driver: CART_DRIVERS[this.drvSel].id, car: CART_CARS[this.carSel].id, autoGas: sv.autoGas !== false }, o);
    if (o.mode === 'gp') o.gp = { points: {}, results: [] };
    Game.setScene(new CartRaceScene(o));
  }
  update(dt) {
    this.t += dt;
    const key = Input.uiKey, n = this.cards.length;
    if (key === 'pause') { Input.uiKey = null; this.back(); return; }
    if (this.state === 'car' && (key === 'left' || key === 'right')) { Input.uiKey = null; this.stepCar(key === 'left' ? -1 : 1); return; }
    if (this.state === 'car' && key === 'enter') { Input.uiKey = null; this.confirmCar(); return; }
    if (n && key) {
      const cols = this.state === 'driver' ? (this.portrait ? 5 : 7) : this.state === 'track' ? (this.portrait ? 2 : 4) : this.state === 'objective' ? (this.portrait ? 1 : 2) : (this.portrait ? 1 : n);
      const selKey = { driver: 'drvSel', cup: 'cupSel', track: 'trackSel', arena: 'arenaSel', objective: 'objSel' }[this.state];
      let cur = this[selKey], moved = true;
      if (key === 'left') cur = (cur - 1 + n) % n; else if (key === 'right') cur = (cur + 1) % n; else if (key === 'up') cur = (cur - cols + n) % n; else if (key === 'down') cur = (cur + cols) % n; else moved = false;
      if (moved) { Sound.play('select', { vol: 0.4 }); Input.uiKey = null; this[selKey] = cur; return; }
      if (key === 'enter') { Input.uiKey = null; this.choose(cur); return; }
    }
    const hit = BurnsUIKit.hitButtons(this.btns);
    if (hit) { hit.fn(); return; }
    for (const tp of Input.taps) for (const c of this.cards) {
      if (tp.x < c.x || tp.x > c.x + c.w || tp.y < c.y || tp.y > c.y + c.h) continue;
      if (this.state === 'driver') { if (this.drvSel === c.i) this.confirmDriver(); else { this.drvSel = c.i; Sound.play('select', { vol: 0.5 }); } }
      else this.choose(c.i);
      return;
    }
    // swipe to browse cars
    if (this.state === 'car' && Input.lastSwipe) { const s = Input.lastSwipe; Input.lastSwipe = null; if (Math.abs(s.dx) > 60 && Math.abs(s.dx) > Math.abs(s.dy)) this.stepCar(s.dx < 0 ? 1 : -1); }
  }
  choose(i) {
    if (this.state === 'driver') { this.drvSel = i; this.confirmDriver(); }
    else if (this.state === 'cup') this.start({ mode: 'gp', cup: CART_CUPS[i].id, race: 0 });
    else if (this.state === 'track') this.start({ mode: 'tt', track: CART_TRACK_ORDER[i] });
    else if (this.state === 'arena') { this.arenaSel = i; this.objSel = 0; this.state = 'objective'; Sound.play('select'); this.build(); }
    else if (this.state === 'objective') this.start({ mode: 'battle', arena: CART_ARENAS[this.arenaSel].id, objective: CART_ARENAS[this.arenaSel].objectives[i] });
  }
  /* ---------- 3D: the showroom stage + cached driver portraits ---------- */
  render3D(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr, R = this.R, World = CartShowroom.world;
    if (!World || !this.pcar) return false;
    const fdt = 1 / 60; this.time += fdt; this.spin += fdt;
    const P = this.portrait, st = this.state;
    // the subject: car (with driver) on the turntable, or the driver standing and waving
    const car = this.pcar, drv = this.pdrv;
    car.yaw = this.spin * 0.45 + 0.6; car.y = 0.36; car.wheelA = this.time * 3;
    this.pst.t = this.time; this.pst.beat = Math.pow(Math.max(0, Math.sin(this.time * 2.1 * Math.PI)), 6); this.pst.fire = (this.time % 4) < 0.8 ? 1 - (this.time % 4) / 0.8 : 0;
    cartPoseCar(car.M, car, this.pst, car.bones);
    drv.ch.play(this.pst.fire > 0.3 ? 'cartFire' : 'cartDrive', { steer: Math.sin(this.time * 0.8) * 0.5, speed: 0.3 }); drv.ch.update(fdt);
    Object.assign(car, { driverScale: drv.scale, driverMan: drv.man });
    cartPoseDriver(car, car.M, drv.ch, drv.bones);
    const showStand = st === 'driver';
    if (showStand) { const s = this.pstand; s.x = P ? 0 : 0; s.y = 0.36; s.z = 0; s.yaw = Math.sin(this.time * 0.5) * 0.4; s.scale = drv.scale * 1.15; s.play(Math.floor(this.time / 3) % 2 ? 'cheer' : 'wave'); s.update(fdt); s.compute(); }
    // camera: frame the subject on the free side of the screen
    const cam = this.cam, M = car.M;
    // (the camera looks toward -Z, so a target to the +X side puts the subject on the left of the screen)
    if (showStand) { const hh = (drv.man ? 2.2 : 1.9) * 1.15; cam.tx = P ? 0 : 2.3; cam.ty = hh * 0.55; cam.tz = 0; cam.x = cam.tx + 0.6; cam.y = hh * 0.7; cam.z = P ? 6.2 : 5.2; cam.fov = P ? 0.8 : 0.62; if (P) cam.ty += 1.0; }
    else { const d = Math.max(M.len, M.h * 1.2) * (P ? 1.9 : 1.6) + 3.5; cam.tx = st === 'mode' && !P ? 3.2 : st === 'car' && !P ? 3.4 : 0; cam.ty = M.h * 0.42; cam.tz = 0; cam.x = cam.tx + Math.sin(0.35) * d; cam.y = M.h * 0.6 + 1.4; cam.z = Math.cos(0.35) * d; cam.fov = P ? 0.85 : 0.7; if (P) { cam.ty += st === 'car' ? -0.2 : 1.6; } }
    const t0 = performance.now(), mq = window.__cartFixedQ || this.mq || (this.mq = 0.85);
    const gw = Math.max(64, Math.round(W * Math.min(dpr, 2) * mq)), gh = Math.max(64, Math.round(H * Math.min(dpr, 2) * mq));
    R.resize(gw, gh); R.setCamera(cam);
    const env = BurnsEnv.build(CartShowroom.sky, null, 0, this.env, this.time);
    R.setLights([{ x: 2, y: 5, z: 6, r: 14, c: [1, 0.95, 0.9], i: 0.55 }, { x: -5, y: 2, z: -3, r: 10, c: [0.6, 0.85, 1], i: 0.35 }]);
    if (R.shadowBegin(env, { dist: 30 })) { R.statics(World.chunks, env, World, BURNS_ATLAS.T, 0); R.skinBegin(env, World, BURNS_ATLAS.T); if (showStand) R.skin(drv.model.geo, this.pstand.bones, this.pstand.nb, null, 0, 0); else { R.skin(M.geo, car.bones, M.nb, null, 0, 0); R.skin(drv.model.geo, drv.bones, drv.ch.nb, null, 0, 0); } R.shadowEnd(); }
    R.begin(env); R.sky(env); R.ground(World.ground, env, World); R.statics(World.chunks, env, World, BURNS_ATLAS.T, 300);
    R.skinBegin(env, World, BURNS_ATLAS.T);
    if (showStand) R.skin(drv.model.geo, this.pstand.bones, this.pstand.nb, null, this.pstand.face, 0.6);
    else { R.skin(M.geo, car.bones, M.nb, null, 0, 0.3); R.skin(drv.model.geo, drv.bones, drv.ch.nb, null, drv.ch.face, 0.5); }
    const S = BURNS_SPRITES.R;
    for (const g of World.glows) R.bbs.bb(g.x, g.y, g.z, g.s * 1.8, g.s * 1.8, S.glow, g.c, 0.75, true);
    if (!showStand) for (const L of M.lights) { const p = cartLocalToWorld(car, L.x, L.y, L.z, [0, 0, 0]); R.bbs.bb(p[0], p[1], p[2], L.s, L.s, S.glow, L.cc, L.big ? 0.4 : 0.7, true); }
    R.flat.flat(0, 0.4, 0, M.w + 3, M.len + 3, car.yaw, S.glow, burnsRGBf(CART_CARS[this.carSel].light), 0.35, true);
    R.sprites(env, BURNS_SPRITES.T);
    R.end(env, { fires: [], ao: false });
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(BurnsGL.canvas, 0, 0, gw, gh, 0, 0, Game.canvas.width, Game.canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // resolution governor: slow devices get a softer (cheaper) showroom
    const ms = performance.now() - t0;
    if (!window.__cartFixedQ) { if (ms > 45) this.mq = Math.max(0.3, mq * (ms > 400 ? 0.55 : 0.8)); else if (ms < 14) this.mq = Math.min(0.9, mq + 0.01); }
    return true;
  }
  // 3D driver portraits rendered once into a 2D atlas (cells 128 x 150)
  portraits() {
    if (this._port !== undefined) return this._port;
    this._port = null;
    if (!this.gl) return null;
    try {
      const cw = 128, chh = 150, cols = 7, rows = Math.ceil(CART_DRIVERS.length / cols), R = this.R;
      R.resize(cols * cw, rows * chh); R.setCamera({ x: 0, y: 2, z: 5, tx: 0, ty: 1, tz: 0, fov: 0.8 });
      const env = BurnsEnv.build(CartShowroom.sky || 'dusk', null, 0, {}, 0);
      R.begin(env);
      CART_DRIVERS.forEach((d, i) => {
        const D = CartDrivers.model(d.id), ch = new BurnsChar(D.model); ch.scale = D.man ? 0.14 : 1; ch.yaw = 0.3; ch.play(D.man ? 'idle' : 'wave', {}, true); ch.update(0.4); ch.faceOverride = D.man ? -1 : 3; ch.compute();
        const headY = (D.model.headY || 1.62) * ch.scale - (D.man ? 0.0 : 0.12), bg = burnsRGBf(shade(d.col, -0.55));
        R.portrait({ x: (i % cols) * cw, y: Math.floor(i / cols) * chh, w: cw, h: chh }, env, BURNS_ATLAS.T, bg, headY, RR => RR.skin(D.model.geo, ch.bones, ch.nb, null, ch.face, 0.6));
      });
      R.post.noFx = [0, 0, 1, 1];
      R.end(env, { fires: [], bloom: 0 });
      const c = makeCanvas(cols * cw, rows * chh), x = c.getContext('2d'); x.drawImage(BurnsGL.canvas, 0, 0);
      this._port = { c, cw, chh, cols };
    } catch (e) { console.error(e); this._port = null; }
    return this._port;
  }
  /* ---------- draw ---------- */
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    if (this.jobs.length) { const j = this.jobs.shift(); try { j(); } catch (e) { console.error(e); Game.reportError(e); this.gl = false; } }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (this.state === 'driver' && this.gl && CartShowroom.world && !this._port) this.portraits();
    this.ensurePreview();
    let ok = false; try { ok = this.gl && !BurnsGL.lost && !this.jobs.length && this.render3D(ctx); } catch (e) { console.error(e); Game.reportError(e); this.gl = false; }
    if (!ok) this.backdrop(ctx, W, H);
    // a soft dark gradient where the UI sits
    const P = this.portrait, g = P ? ctx.createLinearGradient(0, H * 0.35, 0, H) : ctx.createLinearGradient(W * 0.3, 0, W, 0);
    g.addColorStop(0, 'rgba(10,4,20,0)'); g.addColorStop(1, 'rgba(10,4,20,0.72)');
    if (this.state !== 'mode' || P) { ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    if (this.state === 'mode') this.drawMode(ctx);
    else if (this.state === 'driver') this.drawDrivers(ctx);
    else if (this.state === 'car') this.drawCar(ctx);
    else if (this.state === 'cup') this.drawCups(ctx);
    else if (this.state === 'track') this.drawTracks(ctx);
    else if (this.state === 'arena') this.drawArenas(ctx);
    else if (this.state === 'objective') this.drawObjectives(ctx);
    BurnsUIKit.drawButtons(ctx, this.btns);
  }
  backdrop(ctx, W, H) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1e0836'); g.addColorStop(0.5, '#8a2a7a'); g.addColorStop(0.75, '#ff8a5a'); g.addColorStop(1, '#ffc27a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c8946e'; ctx.fillRect(0, H * 0.72, W, H * 0.28);
  }
  title(ctx, text) { BurnsUI.text(ctx, text, Game.cssW / 2, Math.max(28, insets.t + 26), Math.min(24, Game.cssW * 0.055), '#ffffff', { glow: '#ff4fd8' }); }
  drawLogo(ctx, x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `${s}px ${FONT_DISPLAY}`;
    const wob = Math.sin(this.t * 2) * 2;
    for (let i = 6; i > 0; i--) { ctx.fillStyle = `rgba(${30 + i * 12},8,${50 + i * 10},1)`; ctx.fillText('ART CART', i * 0.9, wob + i * 1.4); }
    ctx.shadowColor = '#ff4fd8'; ctx.shadowBlur = s * 0.45;
    const g = ctx.createLinearGradient(0, -s / 2, 0, s / 2); g.addColorStop(0, '#fff8d0'); g.addColorStop(0.45, '#ffd84a'); g.addColorStop(0.55, '#ff8a3a'); g.addColorStop(1, '#ff4fd8');
    ctx.fillStyle = g; ctx.fillText('ART CART', 0, wob);
    ctx.shadowBlur = 0; ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.strokeText('ART CART', 0, wob);
    ctx.restore();
  }
  drawMode(ctx) {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, b = this.btns[0];
    const lx = P ? W / 2 : b.x + b.w / 2, ly = P ? H * 0.16 + insets.t : b.y - 84, s = Math.min(P ? 46 : 54, W * (P ? 0.11 : 0.07));
    this.drawLogo(ctx, lx, ly, s);
    BurnsUI.text(ctx, 'Battle-race wild art cars across the playa', lx, ly + s * 0.85, 12, 'rgba(255,255,255,0.92)', { ui: true });
    BurnsUI.text(ctx, '12 art cars · 26 drivers · 8 tracks · 3 arenas', lx, ly + s * 0.85 + 18, 11, '#ffd84a', { ui: true });
    const sv = cartSave(), tro = CART_CUPS.map(c => sv.trophies[c.id] ? c.name + ' ' + ['', 'GOLD', 'SILVER', 'BRONZE'][sv.trophies[c.id]] : null).filter(Boolean).join('  ·  ');
    if (tro) BurnsUI.text(ctx, tro, lx, this.btns[3].y + 54, 11, '#ffd84a', { ui: true });
  }
  drawCard(ctx, c, on, col) {
    ctx.save();
    if (on) { ctx.shadowColor = col || '#ff4fd8'; ctx.shadowBlur = 16; }
    const g = ctx.createLinearGradient(c.x, c.y, c.x, c.y + c.h); g.addColorStop(0, on ? 'rgba(70,40,110,0.95)' : 'rgba(40,26,66,0.86)'); g.addColorStop(1, 'rgba(16,10,30,0.92)');
    ctx.fillStyle = g; burnsRR(ctx, c.x, c.y, c.w, c.h, 12); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = on ? (col || '#ffd84a') : 'rgba(255,255,255,0.16)'; ctx.lineWidth = on ? 2.5 : 1.2; ctx.stroke();
    ctx.restore();
  }
  drawDrivers(ctx) {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, port = this._port;
    this.title(ctx, 'CHOOSE YOUR DRIVER');
    for (const c of this.cards) {
      const d = CART_DRIVERS[c.i], on = c.i === this.drvSel;
      this.drawCard(ctx, c, on, d.col);
      ctx.save(); burnsRR(ctx, c.x + 3, c.y + 3, c.w - 6, c.h - 18, 9); ctx.clip();
      if (port) { const sx = (c.i % port.cols) * port.cw, sy = Math.floor(c.i / port.cols) * port.chh, k = Math.max((c.w - 6) / port.cw, (c.h - 18) / port.chh); ctx.drawImage(port.c, sx, sy, port.cw, port.chh, c.x + c.w / 2 - port.cw * k / 2, c.y + 3, port.cw * k, port.chh * k); }
      else { ctx.fillStyle = rgba(d.col, 0.35); ctx.fillRect(c.x, c.y, c.w, c.h); BurnsUI.text(ctx, d.name[0], c.x + c.w / 2, c.y + c.h / 2 - 6, c.h * 0.4, '#ffffff', {}); }
      ctx.restore();
      BurnsUI.text(ctx, d.short || d.name, c.x + c.w / 2, c.y + c.h - 8, Math.min(9, c.w * 0.1), on ? '#ffd84a' : '#ffffff', { sw: 2.5 });
    }
    const d = CART_DRIVERS[this.drvSel], x = P ? W / 2 : W * 0.18, y = P ? H * 0.36 : H - Math.max(70, insets.b + 64);
    BurnsUI.text(ctx, d.name, x, y, 20, d.col, { glow: d.col });
    BurnsUI.text(ctx, '"' + d.line + '"', x, y + 22, 12, '#ffffff', { ui: true });
  }
  drawStatBars(ctx, car, x, y, w) {
    [['SPEED', 'speed', '#ff4fd8'], ['ACCEL', 'accel', '#ffd84a'], ['HANDLING', 'handling', '#38f2ff'], ['WEIGHT', 'weight', '#ff8a3a']].forEach(([lab, key, col], i) => {
      const yy = y + i * 17;
      BurnsUI.text(ctx, lab, x, yy, 10, 'rgba(255,255,255,0.8)', { align: 'left', stroke: false });
      for (let k = 0; k < 5; k++) { const bx = x + 72 + k * (w - 72) / 5; ctx.fillStyle = k < car.stats[key] ? col : 'rgba(255,255,255,0.14)'; burnsRR(ctx, bx, yy - 5, (w - 72) / 5 - 4, 10, 4); ctx.fill(); }
    });
  }
  drawCar(ctx) {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, car = CART_CARS[this.carSel], wp = CART_WEAPONS[car.weapon];
    this.title(ctx, 'CHOOSE YOUR ART CAR');
    BurnsUI.text(ctx, (this.carSel + 1) + ' / ' + CART_CARS.length, P ? W / 2 : W * 0.28, Math.max(52, insets.t + 50), 11, 'rgba(255,255,255,0.75)', { ui: true });
    const pw = P ? W - 28 : Math.min(330, W * 0.4), px = P ? 14 : W - Math.max(14, insets.r + 8) - pw, py = P ? H * 0.47 : Math.max(60, insets.t + 54), ph = P ? H * 0.53 - Math.max(70, insets.b + 66) : H - py - Math.max(70, insets.b + 66);
    this.drawCard(ctx, { x: px, y: py, w: pw, h: ph }, true, car.col);
    let y = py + 26;
    BurnsUI.text(ctx, car.name, px + 16, y, Math.min(22, pw * 0.07), car.col === '#2a2236' ? '#ffc83a' : car.col, { align: 'left', glow: car.light });
    y += 20; ctx.font = `600 11px ${FONT_UI}`;
    for (const ln of BurnsUI.wrap(ctx, car.tag, pw - 32)) { BurnsUI.text(ctx, ln, px + 16, y, 11, 'rgba(255,255,255,0.9)', { align: 'left', ui: true, stroke: false }); y += 14; }
    BurnsUI.text(ctx, 'Inspired by ' + car.nod, px + 16, y, 10, 'rgba(255,255,255,0.55)', { align: 'left', ui: true, stroke: false }); y += 20;
    // the signature weapon
    ctx.fillStyle = rgba(wp.col, 0.18); burnsRR(ctx, px + 10, y - 10, pw - 20, 74, 10); ctx.fill();
    cartWeaponIcon(ctx, car.weapon, px + 38, y + 24, 28, 1, this.t);
    BurnsUI.text(ctx, 'WEAPON: ' + wp.name, px + 66, y + 4, 13, wp.col, { align: 'left' });
    BurnsUI.text(ctx, 'RELOAD ' + wp.reload + 's', px + pw - 18, y + 4, 10, '#ffffff', { align: 'right', ui: true });
    ctx.font = `600 10px ${FONT_UI}`; let yy = y + 20;
    for (const ln of BurnsUI.wrap(ctx, wp.desc, pw - 86)) { BurnsUI.text(ctx, ln, px + 66, yy, 10, 'rgba(255,255,255,0.88)', { align: 'left', ui: true, stroke: false }); yy += 13; }
    y += 84;
    if (y + 60 < py + ph) this.drawStatBars(ctx, car, px + 16, y, Math.min(pw - 32, 260));
    const d = CART_DRIVERS[this.drvSel];
    BurnsUI.text(ctx, 'DRIVER: ' + d.name, P ? W / 2 : W * 0.28, H - Math.max(24, insets.b + 20), 12, d.col, {});
  }
  drawCups(ctx) {
    const sv = cartSave();
    this.title(ctx, 'GRAND PRIX · PICK A CUP');
    for (const c of this.cards) {
      const cup = CART_CUPS[c.i], on = c.i === this.cupSel, tro = sv.trophies[cup.id];
      this.drawCard(ctx, c, on, cup.col);
      cartTrophyIcon(ctx, c.x + c.w - 40, c.y + 44, tro ? 40 : 28, tro ? ['#ffd84a', '#dfe6f2', '#ffa65a'][tro - 1] : '#5a4a6a', this.t);
      BurnsUI.text(ctx, cup.name, c.x + 18, c.y + 30, Math.min(24, c.w * 0.08), cup.col, { align: 'left' });
      BurnsUI.text(ctx, tro ? ['', 'GOLD TROPHY', 'SILVER TROPHY', 'BRONZE TROPHY'][tro] : 'No trophy yet', c.x + 18, c.y + 54, 11, tro ? '#ffd84a' : 'rgba(255,255,255,0.6)', { align: 'left', ui: true, stroke: false });
      const lh = Math.min(30, (c.h - 110) / 4);
      cup.tracks.forEach((id, i) => { const D = CART_TRACKS[id], y = c.y + 86 + i * lh; BurnsUI.text(ctx, (i + 1) + '. ' + D.name, c.x + 22, y, Math.min(14, lh * 0.55), '#ffffff', { align: 'left', ui: true, stroke: false }); BurnsUI.text(ctx, CART_TOD[D.tod], c.x + c.w - 18, y, 10, D.tod === 'night' ? '#9a8aff' : D.tod === 'sunset' ? '#ff9a5a' : D.tod === 'dawn' ? '#ffb0c0' : '#ffe08a', { align: 'right', stroke: false }); });
      BurnsUI.text(ctx, 'TAP TO RACE ▶', c.x + c.w / 2, c.y + c.h - 18, 12, on ? '#ffd84a' : 'rgba(255,255,255,0.5)', {});
    }
  }
  drawTracks(ctx) {
    const sv = cartSave();
    this.title(ctx, 'TIME TRIAL · PICK A TRACK');
    for (const c of this.cards) {
      const D = CART_TRACKS[c.id], on = c.i === this.trackSel, cup = CART_CUPS.find(q => q.tracks.includes(c.id));
      this.drawCard(ctx, c, on, cup.col);
      const th = cartTrackThumb(c.id), ts = Math.min(c.h - 44, c.w * 0.62);
      if (ts > 20) ctx.drawImage(th, c.x + c.w / 2 - ts / 2, c.y + 6, ts, ts);
      BurnsUI.text(ctx, D.name, c.x + c.w / 2, c.y + c.h - 30, Math.min(12, c.w * 0.07), '#ffffff', { ui: true });
      const b = sv.best[c.id];
      BurnsUI.text(ctx, b && b.total ? 'BEST ' + cartFmtTime(b.total) : CART_TOD[D.tod], c.x + c.w / 2, c.y + c.h - 13, 10, b ? '#ffd84a' : 'rgba(255,255,255,0.6)', { stroke: false });
    }
  }
  drawArenas(ctx) {
    this.title(ctx, 'BATTLE · PICK AN ARENA');
    for (const c of this.cards) {
      const A = CART_ARENAS[c.i], on = c.i === this.arenaSel;
      this.drawCard(ctx, c, on, A.col);
      cartArenaIcon(ctx, A.id, c.x + c.w / 2, c.y + c.h * 0.36, Math.min(c.w, c.h) * 0.24, this.t, A.col);
      BurnsUI.text(ctx, A.name, c.x + c.w / 2, c.y + c.h * 0.66, Math.min(18, c.w * 0.07), A.col, {});
      ctx.font = `600 11px ${FONT_UI}`; BurnsUI.wrap(ctx, A.sub, c.w - 24).forEach((ln, i) => BurnsUI.text(ctx, ln, c.x + c.w / 2, c.y + c.h * 0.66 + 22 + i * 14, 11, 'rgba(255,255,255,0.85)', { ui: true, stroke: false }));
      ctx.font = `600 9px ${FONT_UI}`; const ol = BurnsUI.wrap(ctx, A.objectives.map(o => CART_OBJECTIVES[o].name).join(' · '), c.w - 20); ol.forEach((ln, i) => BurnsUI.text(ctx, ln, c.x + c.w / 2, c.y + c.h - 14 - (ol.length - 1 - i) * 12, 9, 'rgba(255,255,255,0.6)', { ui: true, stroke: false }));
    }
  }
  drawObjectives(ctx) {
    const A = CART_ARENAS[this.arenaSel], sv = cartSave();
    this.title(ctx, A.name + ' · PICK AN OBJECTIVE');
    for (const c of this.cards) {
      const O = CART_OBJECTIVES[c.id], on = c.i === this.objSel, wins = sv.wins[A.id + ':' + c.id] || 0;
      this.drawCard(ctx, c, on, A.col);
      BurnsUI.text(ctx, O.name, c.x + 16, c.y + 24, 16, '#ffd84a', { align: 'left' });
      BurnsUI.text(ctx, O.short, c.x + c.w - 14, c.y + 24, 10, 'rgba(255,255,255,0.7)', { align: 'right', ui: true });
      ctx.font = `600 11px ${FONT_UI}`; BurnsUI.wrap(ctx, O.desc, c.w - 32).slice(0, 3).forEach((ln, i) => BurnsUI.text(ctx, ln, c.x + 16, c.y + 48 + i * 15, 11, 'rgba(255,255,255,0.9)', { align: 'left', ui: true, stroke: false }));
      if (wins) BurnsUI.text(ctx, wins + (wins === 1 ? ' WIN' : ' WINS'), c.x + c.w - 14, c.y + c.h - 12, 10, '#7aff8a', { align: 'right' });
    }
  }
}
// small cached top-down outline of a track for the menus
function cartTrackThumb(id) {
  cartTrackThumb.cache = cartTrackThumb.cache || {};
  if (cartTrackThumb.cache[id]) return cartTrackThumb.cache[id];
  const T = new CartTrack(CART_TRACKS[id]), S = 160, c = makeCanvas(S, S), x = c.getContext('2d'), b = T.bounds, sc = (S - 24) / Math.max(b.x1 - b.x0, b.z1 - b.z0);
  const D = CART_TRACKS[id], col = D.tod === 'night' ? '#9a8aff' : D.tod === 'sunset' ? '#ff9a5a' : D.tod === 'dawn' ? '#ffb0c0' : '#ffe08a';
  const path = () => { x.beginPath(); for (let i = 0; i <= T.N; i += 3) { const k = i % T.N, px = S / 2 - (T.X[k] - (b.x0 + b.x1) / 2) * sc, pz = S / 2 - (T.Z[k] - (b.z0 + b.z1) / 2) * sc; if (i) x.lineTo(px, pz); else x.moveTo(px, pz); } x.closePath(); };
  x.lineJoin = 'round'; x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = 12; path(); x.stroke(); x.strokeStyle = col; x.lineWidth = 6; path(); x.stroke();
  const a = T.at(0, {}); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(S / 2 - (a.x - (b.x0 + b.x1) / 2) * sc, S / 2 - (a.z - (b.z0 + b.z1) / 2) * sc, 6, 0, TAU); x.fill();
  cartTrackThumb.cache[id] = c;
  return c;
}
function cartArenaIcon(ctx, id, x, y, s, t, col) {
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = col; ctx.fillStyle = rgba(col, 0.25); ctx.lineWidth = 3;
  if (id === 'skate') { ctx.beginPath(); ctx.ellipse(-s * 0.35, s * 0.1, s * 0.5, s * 0.35, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.5); ctx.quadraticCurveTo(s * 0.25, -s * 0.2, s * 0.6, -s * 0.4); ctx.moveTo(s * 0.9, s * 0.5); ctx.quadraticCurveTo(s * 0.85, -s * 0.2, s * 0.6, -s * 0.4); ctx.stroke(); }
  else if (id === 'mx') { ctx.beginPath(); ctx.moveTo(-s, s * 0.4); for (let i = 0; i <= 8; i++) ctx.lineTo(-s + i * s * 0.25, s * 0.4 - (i % 2 ? s * 0.3 : 0) - (i === 4 ? s * 0.4 : 0)); ctx.lineTo(s, s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke(); const bx = Math.sin(t * 2) * s * 0.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx, -s * 0.35 - Math.abs(Math.cos(t * 2)) * s * 0.2, s * 0.1, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.3); ctx.lineTo(-s * 0.1, -s * 0.35); for (let i = 0; i < 4; i++) ctx.lineTo(-s * 0.1 + i * s * 0.07, -s * 0.55 - (i % 2) * s * 0.08); ctx.lineTo(s * 0.16, -s * 0.3); ctx.lineTo(s * 0.14, s * 0.3); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
