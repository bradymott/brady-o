/* ============================================================
   ART CART — menus. KartMenuScene is the app's home screen:
   mode → driver → art car (with its signature weapon) → cup / track /
   arena + objective. A live 3D showroom (the engine's renderer) turns the
   chosen car with its driver on a turntable in a blue-hour studio
   (CartShowroom, 43_cart_fa_stage.js); driver portraits are rendered once
   in 3D and cached into a 2D atlas.
   The camera frames the subject into a screen rectangle that each layout
   leaves free (this.stageRect), so nothing hides under the UI.
   ============================================================ */
// volume buttons shared by the menu and the race pause: MUSIC 60% / SFX OFF, cycling 0, 25, 50, 75, 100 %
function cartVolLabel(name, v) { return name + ' ' + (v > 0 ? Math.round(v * 100) + '%' : 'OFF'); }
function cartCycleVol(key) {
  const st = Save.data.settings, steps = [0, 0.25, 0.5, 0.75, 1], cur = Math.round((st[key] === undefined ? 0.6 : st[key]) * 4) / 4;
  st[key] = steps[(steps.indexOf(cur) + 1) % steps.length];
  if (key === 'music') Sound.setMusicVolume(st.music); else Sound.setSfxVolume(st.sfx);
  Save.save();
}
// a game update swaps the offline cache while the page is already running on the old one, which would leave new code
// drawing the previous version's car models; reload once, from the menu, as soon as the new cache has taken over
const CartFresh = { stale: false, check() { if (this.stale) { this.stale = false; location.reload(); } } };
if (typeof navigator !== 'undefined' && navigator.serviceWorker && navigator.serviceWorker.controller) {
  navigator.serviceWorker.addEventListener('controllerchange', () => { CartFresh.stale = true; if (Game.scene instanceof KartMenuScene) CartFresh.check(); });
  // ask for the update now rather than whenever the browser gets round to it
  navigator.serviceWorker.getRegistration().then(r => r && r.update()).catch(() => {});
}
class KartMenuScene {
  constructor(o) {
    o = o || {};
    this.t = 0; this.time = 0; this.state = o.state || 'mode';
    const sv = cartSave();
    this.drvSel = Math.max(0, CART_DRIVERS.findIndex(d => d.id === sv.driver));
    this.carSel = Math.max(0, CART_CARS.findIndex(c => c.id === sv.car));
    this.mode = o.mode || 'gp'; this.cupSel = 0; this.trackSel = 0; this.arenaSel = 0; this.objSel = 0;
    this.spin = 0; this.spinV = CART_SPIN; this.cam = { x: 0, y: 3, z: 10, tx: 0, ty: 1.5, tz: 0, fov: 0.75, shift: 0 }; this.camGoal = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, fov: 0.75, shift: 0, d: 10 }; this.camSnap = true;
    // per-frame scratch (the render loop allocates nothing)
    this.mirB = new Float32Array(64 * 12); this.ringB = new Float32Array(12); this.tmp3 = [0, 0, 0]; this.black = [0, 0, 0];
    this.ledTint = [1, 1, 1, 1]; this.ledCol = [1, 1, 1]; this.ledFor = null;
    this.fx = { fires: [], ao: false, bloom: 0.1, rays: 0, dof: { focus: 8, aperture: 0.6 } };
    this.driveOpts = { steer: 0, speed: 0.3 };
    this.lights = [0, 1, 2].map(() => ({ x: 0, y: 0, z: 0, r: 10, c: [1, 1, 1], i: 1 }));
    this.lights[0].c = [0.42, 0.7, 1]; this.lights[1].c = [0.55, 0.85, 1]; this.lights[2].c = [1, 0.96, 0.92];
    this._dragFn = t => this.dragTouch(t); this._dragDX = 0; this._dragAny = false;
    CartFresh.check();
    Input.setMode('ui'); Input.hud = null;
    Sound.music('kart_menu');
    this.gl = BurnsGL.init();
    if (this.gl) { BurnsGL.configure(sv.gfx || 'auto'); BURNS_ATLAS.init(); BURNS_SPRITES.init(); this.R = new BurnsRenderer(); this.env = {}; }
    if (this.gl && typeof CartGLB !== 'undefined') { try { CartGLB.preload(); } catch (e) { console.warn('cart: glb preload failed', e); } }
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
    this.measure();
  }
  // the turning subject's real size, measured once per car + driver from the posed geometry (tails, wings and decks stick out
  // past the model's nominal len / w / h): the widest radius from the turntable axis and the top, with a little room for the
  // parts that flap and bob
  measure() {
    const car = this.pcar, drv = this.pdrv, M = car.M, e = this.fitE || (this.fitE = { rh: 0, top: 0 });
    car.yaw = 0; car.y = 0; car.driverScale = drv.scale; car.driverMan = drv.man;
    cartPoseCar(M, car, this.pst, car.bones); drv.ch.update(0); cartPoseDriver(car, M, drv.ch, drv.bones);
    e.rh = 0; e.top = 0;
    cartGeoExtent(M.geo, car.bones, e); cartGeoExtent(drv.model.geo, drv.bones, e);
    this.fit = { rh: e.rh * 1.05, top: e.top * 1.04 };
  }
  ensurePreview() {
    const car = CART_CARS[this.carSel], drv = CART_DRIVERS[this.drvSel];
    if (!this.gl) return;
    const glb = typeof CartGLB !== 'undefined' && !!CartGLB.model(car.id, false);
    if (!this.pcar || this.pcar.id !== car.id || !this.pdrv || this.pdrv.id !== drv.id || !!this.pcar.M.glb !== glb) this.loadPreview();
  }
  /* ---------- layout ---------- */
  build() {
    const W = Game.cssW, H = Game.cssH, P = this.portrait, sv = cartSave();
    const safeT = Math.max(12, insets.t + 6), safeB = Math.max(14, insets.b + 8), safeL = Math.max(14, insets.l + 8), safeR = Math.max(14, insets.r + 8);
    const back = { x: safeL, y: safeT, w: 92, h: 38, label: '◀ BACK', fn: () => this.back() };
    this.cards = []; this.btns = [];
    // the free screen area the 3D subject is framed into (CSS px); each state below narrows it
    const sr = this.stageRect = this.stageRect || {}; sr.x = safeL; sr.y = safeT + 40; sr.w = W - safeL - safeR; sr.h = H - sr.y - safeB;
    const setRect = (x0, y0, x1, y1) => { sr.x = x0; sr.y = y0; sr.w = Math.max(40, x1 - x0); sr.h = Math.max(40, y1 - y0); };
    if (this.state === 'mode') {
      const bw = Math.min(260, W * 0.62), x = P ? (W - bw) / 2 : W - safeR - bw - 10, y0 = P ? H * 0.5 : H * 0.3;
      this.btns = [
        { x, y: y0, w: bw, h: 48, label: 'GRAND PRIX', primary: true, fn: () => this.pick('gp') },
        { x, y: y0 + 56, w: bw, h: 44, label: 'BATTLE ARENAS', fn: () => this.pick('battle') },
        { x, y: y0 + 108, w: bw, h: 40, label: 'TIME TRIAL', fn: () => this.pick('tt') },
        { x, y: y0 + 156, w: bw / 2 - 4, h: 34, size: 10, label: 'AUTO-GAS ' + (sv.autoGas !== false ? 'ON' : 'OFF'), fn: () => { sv.autoGas = sv.autoGas === false; Save.save(); Sound.play('select'); this.build(); } },
        { x: x + bw / 2 + 4, y: y0 + 156, w: bw / 2 - 4, h: 34, size: 10, label: 'GFX ' + (sv.gfx || 'auto').toUpperCase(), fn: () => { const L = BURNS_GFX.names, i = L.indexOf(sv.gfx || 'auto'); sv.gfx = L[(i + 1) % L.length]; Save.save(); if (this.gl) BurnsGL.configure(sv.gfx); Sound.play('select'); this.build(); } },
        // music and sound levels (0 = off): the same five steps as the other apps' settings
        { x, y: y0 + 198, w: bw / 2 - 4, h: 34, size: 10, label: cartVolLabel('MUSIC', Save.data.settings.music), fn: () => { cartCycleVol('music'); this.build(); } },
        { x: x + bw / 2 + 4, y: y0 + 198, w: bw / 2 - 4, h: 34, size: 10, label: cartVolLabel('SFX', Save.data.settings.sfx), fn: () => { cartCycleVol('sfx'); Sound.play('select'); this.build(); } }
      ];
      // in the standalone Art Cart app this menu IS home: nothing to go back to
      if (typeof BRADY_APP === 'undefined' || BRADY_APP !== 'kart') this.btns.push(back);
      // the car: left of the buttons in landscape; between the logo and the buttons in portrait
      if (P) setRect(safeL, H * 0.16 + insets.t + Math.min(46, W * 0.11) * 0.85 + 34, W - safeR, y0 - 10);
      else setRect(safeL, safeT + 30, x - 24, H - safeB);
    } else if (this.state === 'driver') {
      const top = P ? H * 0.42 : safeT + 52, cols = P ? 5 : 7, gx = P ? safeL : W * 0.36, gw = P ? W - safeL - safeR : W - gx - safeR, rows = Math.ceil(CART_DRIVERS.length / cols);
      const cw = (gw - (cols - 1) * 6) / cols, ch = Math.min(cw * 1.2, (H - top - safeB - 60 - (rows - 1) * 6) / rows);
      CART_DRIVERS.forEach((d, i) => this.cards.push({ i, x: gx + (i % cols) * (cw + 6), y: top + Math.floor(i / cols) * (ch + 6), w: cw, h: ch }));
      this.btns = [{ x: P ? W / 2 - 90 : gx + gw / 2 - 90, y: H - safeB - 48, w: 180, h: 46, label: 'NEXT ▶', primary: true, fn: () => this.confirmDriver() }, back];
      // the standing driver: under the title and above the name line (portrait), left of the grid above the name (landscape)
      if (P) setRect(safeL, Math.max(92, insets.t + 88), W - safeR, H * 0.36 - 24);
      else setRect(safeL, safeT + 44, gx - 12, H - Math.max(92, insets.b + 86));
    } else if (this.state === 'car') {
      // the info card: right column in landscape; the lower part of the screen in portrait (the car gets everything above it)
      const pw = P ? W - 28 : Math.min(330, W * 0.4), px = P ? 14 : W - safeR - pw, py = P ? H * (H < 740 ? 0.52 : 0.55) : Math.max(60, insets.t + 54);
      this.cardRect = { x: px, y: py, w: pw, h: H - py - Math.max(70, insets.b + 66) };
      const aw = 52, ah = 52;
      let ax0, ax1, ay;
      if (P) {
        // arrows sit at the plinth's front edge, below the car, not over it
        ay = py - 10 - ah; ax0 = safeL; ax1 = W - safeR - aw;
        setRect(safeL, Math.max(112, insets.t + 108), W - safeR, ay - 4);
      } else {
        // arrows at mid height either side of the car; the car stays between them
        const x1 = px - 14; ax0 = safeL; ax1 = x1 - aw;
        setRect(safeL + aw + 6, Math.max(62, insets.t + 56), ax1 - 6, H - Math.max(40, insets.b + 36));
        ay = sr.y + sr.h * 0.5 - ah / 2;
      }
      this.btns = [
        { x: ax0, y: ay, w: aw, h: ah, label: '◀', fn: () => this.stepCar(-1) },
        { x: ax1, y: ay, w: aw, h: ah, label: '▶', fn: () => this.stepCar(1) },
        { x: P ? W / 2 - 90 : W - safeR - 190, y: H - safeB - 48, w: 180, h: 46, label: 'NEXT ▶', primary: true, fn: () => this.confirmCar() },
        back
      ];
    } else if (this.state === 'cup') {
      const top = safeT + (P ? 100 : 56), bottom = H - safeB;
      if (P) { const ch = (bottom - top - 12) / 2; CART_CUPS.forEach((c, i) => this.cards.push({ i, x: safeL, y: top + i * (ch + 12), w: W - safeL - safeR, h: ch })); }
      else { const cw = Math.min(330, (W - safeL - safeR - 16) / 2); CART_CUPS.forEach((c, i) => this.cards.push({ i, x: W / 2 - cw - 8 + i * (cw + 16), y: top, w: cw, h: bottom - top })); }
      this.btns = [back];
    } else if (this.state === 'track') {
      const top = safeT + (P ? 100 : 56), bottom = H - safeB, cols = P ? 2 : 4, nr = P ? 4 : 2;
      const cw = (W - safeL - safeR - (cols - 1) * 10) / cols, ch = (bottom - top - (nr - 1) * 10) / nr;
      CART_TRACK_ORDER.forEach((id, i) => this.cards.push({ i, id, x: safeL + (i % cols) * (cw + 10), y: top + Math.floor(i / cols) * (ch + 10), w: cw, h: ch }));
      this.btns = [back];
    } else if (this.state === 'arena') {
      // a grid: 4 across in landscape, 2 in portrait, as many rows as the arenas need
      const top = safeT + (P ? 100 : 56), bottom = H - safeB, n = CART_ARENAS.length, cols = Math.min(n, P ? 2 : 4), nr = Math.ceil(n / cols);
      const cw = (W - safeL - safeR - (cols - 1) * 10) / cols, ch = (bottom - top - (nr - 1) * 10) / nr;
      CART_ARENAS.forEach((a, i) => this.cards.push({ i, x: safeL + (i % cols) * (cw + 10), y: top + Math.floor(i / cols) * (ch + 10), w: cw, h: ch }));
      this.btns = [back];
    } else if (this.state === 'objective') {
      const A = CART_ARENAS[this.arenaSel], top = safeT + (P ? 110 : 70), bottom = H - safeB, n = A.objectives.length, cols = P ? 1 : 2, nr = Math.ceil(n / cols);
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
  stepCar(d) { this.carSel = (this.carSel + d + CART_CARS.length) % CART_CARS.length; this.spin = 0; this.spinV = CART_SPIN; Sound.play('select', { vol: 0.5 }); }
  confirmCar() { Sound.play('select'); const sv = cartSave(); sv.car = CART_CARS[this.carSel].id; Save.save(); this.state = this.mode === 'gp' ? 'cup' : this.mode === 'tt' ? 'track' : 'arena'; this.build(); }
  start(o) {
    Sound.play('select');
    const sv = cartSave();
    o = Object.assign({ driver: CART_DRIVERS[this.drvSel].id, car: CART_CARS[this.carSel].id, autoGas: sv.autoGas !== false }, o);
    if (o.mode === 'gp') o.gp = { points: {}, results: [] };
    Game.setScene(new CartRaceScene(o));
  }
  // the turntable: a slow steady turn; a finger dragged across the stage spins it by hand (a quick flick still browses
  // cars), and on release it eases back to the steady turn
  dragTouch(t) {
    const r = this.stageRect;
    if (!r || t.sx < r.x || t.sx > r.x + r.w || t.sy < r.y || t.sy > r.y + r.h) return;
    for (const b of this.btns) if (t.sx >= b.x && t.sx <= b.x + b.w && t.sy >= b.y && t.sy <= b.y + b.h) return;
    if (t._spinX !== undefined) this._dragDX += t.x - t._spinX;
    t._spinX = t.x; this._dragAny = true;
  }
  turn(dt) {
    this._dragDX = 0; this._dragAny = false;
    if (this.state === 'car' || this.state === 'mode') Input.touches.forEach(this._dragFn);
    if (this._dragAny) { const a = this._dragDX * 0.012; this.spin += a; this.spinV = lerp(this.spinV, a / Math.max(dt, 1 / 120), 0.35); }
    else { this.spinV += (CART_SPIN - this.spinV) * (1 - Math.exp(-dt * 1.2)); this.spin += this.spinV * dt; }
  }
  update(dt) {
    this.t += dt;
    this.turn(dt);
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
  // aim the camera so a vertical cylinder on the turntable axis (radius rh, from y0 to y1) fills a screen rectangle (CSS px):
  // the camera orbits at azimuth az and elevation el; a sideways offset and the lens shift put the subject at the rectangle's centre
  aim(out, rect, y0, y1, rh, az, el, fov) {
    const W = Game.cssW, H = Game.cssH, tanY = Math.tan(fov / 2), tanX = tanY * W / H;
    const nx = (rect.x + rect.w / 2) / W * 2 - 1, ny = 1 - (rect.y + rect.h / 2) / H * 2, hx = rect.w / W, hy = rect.h / H;
    const ce = Math.cos(el), se = Math.sin(el), sa = Math.sin(az), ca = Math.cos(az);
    const vh = ((y1 - y0) * ce + 2 * rh * se) / 2;
    // fit both ways, plus the near half of the cylinder (it is closer, so it looks bigger)
    const d = Math.max(vh / (hy * tanY), rh / (hx * tanX)) + rh * 0.42;
    const cy = (y0 + y1) / 2, off = -nx * tanX * d;
    out.x = sa * ce * d + ca * off; out.y = cy + se * d; out.z = ca * ce * d - sa * off;
    out.tx = ca * off; out.ty = cy; out.tz = -sa * off; out.fov = fov; out.shift = ny; out.d = d;
    return out;
  }
  // test helper (tools/cart_showroom_shots.js): does the turning car fit its frame? Poses the car and its driver at n turntable
  // angles, projects every k-th vertex through the current camera and returns the worst overflow (CSS px, > 0 = cut off) past
  // the stage rectangle and past the screen edges. Not used in play.
  fitCheck(n, k) {
    const R = this.R, car = this.pcar, drv = this.pdrv; if (!R || !car) return null;
    const W = Game.cssW, H = Game.cssH, sr = this.stageRect, o = {}, M = car.M, yaw0 = car.yaw;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const scan = (geo, B) => {
      const f = new Float32Array(geo.data), u = new Uint8Array(geo.data);
      for (let v = 0; v < geo.nv; v += k) {
        const b = (u[v * 24 + 15] & 63) * 12, x = f[v * 6], y = f[v * 6 + 1], z = f[v * 6 + 2];
        if (!R.project(B[b] * x + B[b + 1] * y + B[b + 2] * z + B[b + 3], B[b + 4] * x + B[b + 5] * y + B[b + 6] * z + B[b + 7], B[b + 8] * x + B[b + 9] * y + B[b + 10] * z + B[b + 11], W, H, o)) continue;
        x0 = Math.min(x0, o.x); x1 = Math.max(x1, o.x); y0 = Math.min(y0, o.y); y1 = Math.max(y1, o.y);
      }
    };
    for (let i = 0; i < n; i++) {
      car.yaw = i / n * TAU; cartPoseCar(M, car, this.pst, car.bones); cartPoseDriver(car, M, drv.ch, drv.bones);
      scan(M.geo, car.bones); scan(drv.model.geo, drv.bones);
    }
    car.yaw = yaw0;
    const r1 = v => Math.round(v * 10) / 10;
    return { rect: [r1(sr.x), r1(sr.y), r1(sr.x + sr.w), r1(sr.y + sr.h)], bbox: [r1(x0), r1(y0), r1(x1), r1(y1)],
      overStage: r1(Math.max(sr.x - x0, x1 - sr.x - sr.w, sr.y - y0, y1 - sr.y - sr.h)), overScreen: r1(Math.max(-x0, x1 - W, -y0, y1 - H)),
      fill: r1(Math.max((x1 - x0) / sr.w, (y1 - y0) / sr.h)) };
  }
  drawSubject(R, showStand, rimCar, rimDrv) {
    const car = this.pcar, drv = this.pdrv, s = this.pstand, M = car.M, sh = R.pass === 'shadow';
    if (showStand) BurnsSkinActor.draw(null, R, drv.id, s, null, rimDrv) || R.skin(drv.model.geo, s.bones, s.nb, null, sh ? 0 : s.face, rimDrv);
    else { R.skin(M.geo, car.bones, M.nb, null, 0, rimCar); BurnsSkinActor.drawDriver(R, car, drv.ch, drv.id) || R.skin(drv.model.geo, drv.bones, drv.ch.nb, null, sh ? 0 : drv.ch.face, rimDrv); }
  }
  render3D(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr, R = this.R, World = CartShowroom.world, gl = BurnsGL.gl;
    if (!World || !this.pcar) return false;
    const fdt = 1 / 60; this.time += fdt;
    const P = this.portrait, st = this.state, SH = CART_STAGE.H;
    // the subject: car (with driver) on the turntable, or the driver standing and waving
    const car = this.pcar, drv = this.pdrv, M = car.M, cdef = CART_CARS[this.carSel];
    car.yaw = this.spin + 0.6; car.y = SH; car.wheelA = 0;
    this.pst.t = this.time; this.pst.beat = Math.pow(Math.max(0, Math.sin(this.time * 2.1 * Math.PI)), 6); this.pst.fire = (this.time % 4) < 0.8 ? 1 - (this.time % 4) / 0.8 : 0;
    cartPoseCar(M, car, this.pst, car.bones);
    this.driveOpts.steer = Math.sin(this.time * 0.8) * 0.5;
    drv.ch.play(this.pst.fire > 0.3 ? 'cartFire' : 'cartDrive', this.driveOpts); drv.ch.update(fdt);
    car.driverScale = drv.scale; car.driverMan = drv.man;
    cartPoseDriver(car, M, drv.ch, drv.bones);
    const showStand = st === 'driver', s = this.pstand;
    if (showStand) { s.x = 0; s.y = SH; s.z = 0; s.yaw = Math.sin(this.time * 0.5) * 0.4; s.scale = drv.scale * 1.15; s.play(Math.floor(this.time / 3) % 2 ? 'cheer' : 'wave'); s.update(fdt); s.compute(); }
    // per-car colours (cached: the LED ring and the light pools take the car's light colour)
    if (this.ledFor !== cdef.id) {
      this.ledFor = cdef.id; const c = burnsRGBf(cdef.light), k = 2.4;
      this.ledCol[0] = c[0]; this.ledCol[1] = c[1]; this.ledCol[2] = c[2];
      this.ledTint[0] = c[0] * k; this.ledTint[1] = c[1] * k; this.ledTint[2] = c[2] * k; this.ledTint[3] = 1;
    }
    // camera: frame the subject into the free part of the screen, with a slow, gentle drift
    const goal = this.camGoal, az = 0.38 + Math.sin(this.time * 0.11) * 0.06, el = 0.17 + Math.sin(this.time * 0.07 + 1) * 0.015;
    if (showStand) {
      const hh = (drv.man ? 2.25 : 1.95) * s.scale;
      this.aim(goal, this.stageRect, SH - 0.05, SH + hh + 0.3 * s.scale, 0.55 * s.scale, az * 0.6, 0.17, P ? 0.82 : 0.6);
    } else {
      // the car turns, so fit the circle it sweeps (measured from its geometry, with the driver up on top)
      this.aim(goal, this.stageRect, SH - 0.1, SH + this.fit.top, this.fit.rh, az, el, P ? 0.82 : 0.6);
    }
    const cam = this.cam, k = this.camSnap ? 1 : 1 - Math.exp(-fdt * 3.2); this.camSnap = false;
    cam.x += (goal.x - cam.x) * k; cam.y += (goal.y - cam.y) * k; cam.z += (goal.z - cam.z) * k;
    cam.tx += (goal.tx - cam.tx) * k; cam.ty += (goal.ty - cam.ty) * k; cam.tz += (goal.tz - cam.tz) * k;
    cam.fov += (goal.fov - cam.fov) * k; cam.shift += (goal.shift - cam.shift) * k;
    const t0 = performance.now(), mq = window.__cartFixedQ || this.mq || (this.mq = 0.85);
    const gw = Math.max(64, Math.round(W * Math.min(dpr, 2) * mq)), gh = Math.max(64, Math.round(H * Math.min(dpr, 2) * mq));
    R.resize(gw, gh); R.setCamera(cam);
    const env = CartShowroom.envFor(this.time);
    // two cool rim lights behind the subject (as seen from the camera) and a soft neutral fill from the camera's right;
    // the warm key is the env's sun, high behind the camera's left shoulder (CartShowroom.sky)
    const Ls = this.lights, back = az + Math.PI;
    Ls[0].x = Math.sin(back + 0.95) * 5.2; Ls[0].y = 3.6; Ls[0].z = Math.cos(back + 0.95) * 5.2; Ls[0].r = 10.5; Ls[0].i = 1.25;
    Ls[1].x = Math.sin(back - 0.85) * 5.2; Ls[1].y = 2.8; Ls[1].z = Math.cos(back - 0.85) * 5.2; Ls[1].r = 10; Ls[1].i = 1.0;
    Ls[2].x = Math.sin(az + 1.0) * 7; Ls[2].y = 2.4; Ls[2].z = Math.cos(az + 1.0) * 7; Ls[2].r = 13; Ls[2].i = 0.3;
    // Calamari Inferno's live fire throws a flickering warm light on the car (a fourth light, only for that car)
    if (!showStand && M.extra && M.extra.flames) {
      const Lf = this.fireLs || (this.fireLs = Ls.concat([{ x: 0, y: 0, z: 0, r: 6, c: [1, 0.5, 0.16], i: 1 }])), f = this.pst.fire;
      Lf[3].y = SH + 2.2; Lf[3].r = 6 + 4 * f; Lf[3].i = (0.9 + 1.4 * f) * (0.82 + 0.1 * Math.sin(this.time * 17.3) + 0.08 * Math.sin(this.time * 29.9));
      R.setLights(Lf);
    } else R.setLights(Ls);
    if (R.shadowBegin(env, { dist: 26 })) { R.statics(World.chunks, env, null, BURNS_ATLAS.T, 0); R.skinBegin(env, null, BURNS_ATLAS.T); this.drawSubject(R, showStand, 0, 0); R.shadowEnd(); }
    R.begin(env); R.sky(env);
    R.statics(World.chunks, env, null, BURNS_ATLAS.T, 400);
    R.skinBegin(env, null, BURNS_ATLAS.T);
    // the turntable's LED ring turns with the car
    BurnsM.a34Set(this.ringB, 0, 0, 0, 0, showStand ? this.time * 0.3 : car.yaw, 0, 0, 1, 1, 1);
    R.skin(World.ring, this.ringB, 1, this.ledTint, 0, 0);
    this.drawSubject(R, showStand, 0.6, 0.6);
    // the car's mirror image under the smoked-glass top (mirrored geometry winds the other way)
    if (!showStand && M.nb * 12 <= this.mirB.length) {
      cartMirrorBones(car.bones, this.mirB, M.nb, SH);
      gl.frontFace(gl.CW); R.skin(M.geo, this.mirB, M.nb, null, 0, 0); gl.frontFace(gl.CCW);
    }
    // the glass, blended over the reflection (it doesn't write depth, so the reflected lights below it still show)
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    R.statics(World.glass, env, null, BURNS_ATLAS.T, 400, 0.7);
    gl.depthMask(true); gl.disable(gl.BLEND);
    const S = BURNS_SPRITES.R, tm = this.time, p = this.tmp3;
    // out-of-focus playa lights far behind the stage
    for (const b of World.bokeh) R.bbs.bb(b.x, b.y, b.z, b.s, b.s, S.core, b.c, b.a * (0.75 + 0.25 * Math.sin(tm * b.w + b.ph)), true);
    if (!showStand) {
      for (const L of M.lights) {
        cartLocalToWorld(car, L.x, L.y, L.z, p);
        R.bbs.bb(p[0], p[1], p[2], L.s, L.s, S.glow, L.cc, L.big ? 0.4 : 0.7, true);
        R.bbs.bb(p[0], 2 * SH - p[1], p[2], L.s, L.s, S.glow, L.cc, L.big ? 0.12 : 0.22, true);
      }
      cartOctoFlames(R, M, car.bones, this.pst, 0, 0, 0, 0.75, SH);   // Calamari Inferno's live fire, and its reflection in the glass
      // a soft contact shadow and a pool of the car's light colour on the glass
      R.flat.flat(0, SH + 0.012, 0, M.w * 1.35, M.len * 1.12, car.yaw, S.shadow, this.black, 0.6, false);
      R.flat.flat(0, SH + 0.014, 0, M.w + 2.4, M.len + 2.4, car.yaw, S.glow, this.ledCol, 0.16, true);
    } else R.flat.flat(0, SH + 0.012, 0, 1.4 * s.scale, 1.4 * s.scale, 0, S.shadow, this.black, 0.5, false);
    // the plinth's underglow on the floor
    R.flat.flat(0, 0.012, 0, (CART_STAGE.R + 0.3) * 2.2, (CART_STAGE.R + 0.3) * 2.2, 0, S.ring, this.ledCol, 0.55, true);
    R.sprites(env, BURNS_SPRITES.T);
    const fx = this.fx; fx.dof.focus = Math.hypot(cam.x, cam.y - cam.ty, cam.z); fx.dof.aperture = 0.55;
    R.end(env, fx);
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
        R.portrait({ x: (i % cols) * cw, y: Math.floor(i / cols) * chh, w: cw, h: chh }, env, BURNS_ATLAS.T, bg, headY, RR => BurnsSkinActor.draw(null, RR, d.type, ch, null, 0.6) || RR.skin(D.model.geo, ch.bones, ch.nb, null, ch.face, 0.6));
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
    // the driver portraits are cached once; redo them when the skinned characters arrive after the first render
    if (this._port !== undefined && typeof BurnsSkinActor !== 'undefined' && this._portSkin !== !!BurnsSkinActor.ready) this._port = undefined;
    if (typeof BurnsSkinActor !== 'undefined') this._portSkin = !!BurnsSkinActor.ready;
    if (this.state === 'driver' && this.gl && CartShowroom.world && !this._port) this.portraits();
    this.ensurePreview();
    let ok = false; try { ok = this.gl && !BurnsGL.lost && !this.jobs.length && !window.__cartSkipRender && this.render3D(ctx); } catch (e) { console.error(e); Game.reportError(e); this.gl = false; }
    if (!ok) this.backdrop(ctx, W, H);
    // a soft dark gradient where the UI sits
    const P = this.portrait, cr = this.state === 'car' && this.cardRect, g = P ? ctx.createLinearGradient(0, cr ? cr.y - 30 : H * 0.35, 0, H) : ctx.createLinearGradient(cr ? cr.x - 50 : W * 0.3, 0, W, 0);
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
  // in portrait the title sits under the BACK button
  title(ctx, text, sub) {
    const W = Game.cssW, P = this.portrait, y = P ? Math.max(76, insets.t + 70) : Math.max(28, insets.t + 26);
    BurnsUI.text(ctx, text, W / 2, y, Math.min(24, W * (P ? 0.05 : 0.055)), '#ffffff', { glow: '#ff4fd8' });
    if (sub) BurnsUI.text(ctx, sub, W / 2, y + 22, 11, '#ffd84a', {});
  }
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
    BurnsUI.text(ctx, CART_CARS.length + ' art cars · ' + CART_DRIVERS.length + ' drivers · ' + CART_TRACK_ORDER.length + ' tracks · ' + CART_ARENAS.length + ' arenas', lx, ly + s * 0.85 + 18, 11, '#ffd84a', { ui: true });
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
    const sr = this.stageRect, scx = sr.x + sr.w / 2;
    BurnsUI.text(ctx, (this.carSel + 1) + ' / ' + CART_CARS.length, P ? W / 2 : scx, P ? Math.max(100, insets.t + 96) : Math.max(52, insets.t + 50), 11, 'rgba(255,255,255,0.75)', { ui: true });
    const cr = this.cardRect, pw = cr.w, px = cr.x, py = cr.y, ph = cr.h;
    this.drawCard(ctx, { x: px, y: py, w: pw, h: ph }, true, car.col);
    let y = py + 26;
    // dark paint jobs (the pyramid, the galleon, the whale) read better in their bright trim colour
    const cn = parseInt(car.col.slice(1), 16), luma = (0.299 * (cn >> 16) + 0.587 * ((cn >> 8) & 255) + 0.114 * (cn & 255)) / 255;
    BurnsUI.text(ctx, car.name, px + 16, y, Math.min(22, pw * 0.07), luma < 0.6 ? car.col2 : car.col, { align: 'left', glow: car.light });
    y += 20; ctx.font = `600 11px ${FONT_UI}`;
    for (const ln of BurnsUI.wrap(ctx, car.tag, pw - 32)) { BurnsUI.text(ctx, ln, px + 16, y, 11, 'rgba(255,255,255,0.9)', { align: 'left', ui: true, stroke: false }); y += 14; }
    BurnsUI.text(ctx, 'Inspired by ' + car.nod, px + 16, y, 10, 'rgba(255,255,255,0.55)', { align: 'left', ui: true, stroke: false }); y += 20;
    // the signature weapon
    ctx.fillStyle = rgba(wp.col, 0.18); burnsRR(ctx, px + 10, y - 10, pw - 20, 74, 10); ctx.fill();
    cartWeaponIcon(ctx, car.weapon, px + 38, y + 24, 28, 1, this.t);
    BurnsUI.text(ctx, 'WEAPON: ' + wp.name, px + 66, y + 4, 13, wp.col, { align: 'left' });
    BurnsUI.text(ctx, 'RELOAD ' + wp.reload + 's', px + pw - 18, y + 56, 10, '#ffffff', { align: 'right', ui: true });   // bottom corner: long weapon names own the top line
    ctx.font = `600 10px ${FONT_UI}`; let yy = y + 20;
    for (const ln of BurnsUI.wrap(ctx, wp.desc, pw - 86)) { BurnsUI.text(ctx, ln, px + 66, yy, 10, 'rgba(255,255,255,0.88)', { align: 'left', ui: true, stroke: false }); yy += 13; }
    y += 84;
    if (y + 60 < py + ph) this.drawStatBars(ctx, car, px + 16, y, P ? pw - 32 : Math.min(pw - 32, 260));
    const d = CART_DRIVERS[this.drvSel];
    // portrait: between the arrows, at the plinth's front edge; landscape: under the stage
    BurnsUI.text(ctx, 'DRIVER: ' + d.name, P ? W / 2 : scx, P ? this.btns[0].y + this.btns[0].h / 2 : H - Math.max(24, insets.b + 20), 12, d.col, {});
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
    const sv = cartSave();
    for (const c of this.cards) {
      const A = CART_ARENAS[c.i], on = c.i === this.arenaSel, small = c.h < 150, fs = Math.min(18, c.w * 0.07, c.h * 0.11);
      this.drawCard(ctx, c, on, A.col);
      cartArenaIcon(ctx, A.id, c.x + c.w / 2, c.y + c.h * (small ? 0.3 : 0.34), Math.min(c.w, c.h) * (small ? 0.18 : 0.22), this.t, A.col);
      BurnsUI.text(ctx, A.name, c.x + c.w / 2, c.y + c.h * (small ? 0.58 : 0.62), fs, A.col, {});
      if (!small) { ctx.font = `600 11px ${FONT_UI}`; BurnsUI.wrap(ctx, A.sub, c.w - 24).slice(0, 2).forEach((ln, i) => BurnsUI.text(ctx, ln, c.x + c.w / 2, c.y + c.h * 0.62 + 20 + i * 14, 11, 'rgba(255,255,255,0.85)', { ui: true, stroke: false })); }
      const won = A.objectives.filter(o => (sv.wins[A.id + ':' + o] || 0) > 0).length;
      BurnsUI.text(ctx, sv.mastered[A.id] ? 'MASTERED ✓' : won + '/' + A.objectives.length + ' WON', c.x + c.w / 2, c.y + c.h - 12, 9, sv.mastered[A.id] ? '#7aff8a' : 'rgba(255,255,255,0.6)', { ui: true, stroke: false });
    }
  }
  drawObjectives(ctx) {
    const A = CART_ARENAS[this.arenaSel], sv = cartSave();
    this.title(ctx, 'PICK AN OBJECTIVE', A.name);
    for (const c of this.cards) {
      const O = CART_OBJECTIVES[c.id], on = c.i === this.objSel, wins = sv.wins[A.id + ':' + c.id] || 0;
      this.drawCard(ctx, c, on, A.col);
      BurnsUI.text(ctx, O.name, c.x + 16, c.y + 24, 16, '#ffd84a', { align: 'left' });
      BurnsUI.text(ctx, O.short, c.x + c.w - 14, c.y + 24, 10, 'rgba(255,255,255,0.7)', { align: 'right', ui: true });
      ctx.font = `600 11px ${FONT_UI}`; BurnsUI.wrap(ctx, O.desc, c.w - 32).slice(0, 3).forEach((ln, i) => BurnsUI.text(ctx, ln, c.x + 16, c.y + 48 + i * 15, 11, 'rgba(255,255,255,0.9)', { align: 'left', ui: true, stroke: false }));
      if (wins) BurnsUI.text(ctx, wins + (wins === 1 ? ' WIN' : ' WINS'), c.x + c.w - 14, c.y + c.h - 12, 10, '#7aff8a', { align: 'right' });
    }
    // this arena's powers, and whether they're unlocked for the circuit races
    if (A.powers && A.powers.length) {
      const names = A.powers.map(p => CART_ITEMS[p] ? CART_ITEMS[p].name : p).join(' · '), y = Game.cssH - Math.max(14, insets.b + 8) - 14;
      BurnsUI.text(ctx, (sv.mastered[A.id] ? 'MASTERED: ' : 'ARENA POWERS: ') + names + (sv.mastered[A.id] ? ' now drop in every race' : ' · win every objective to unlock them in races'), Game.cssW / 2, y, 10, sv.mastered[A.id] ? '#7aff8a' : A.col, { ui: true });
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
  if (CART_ARENA_ICONS[id]) CART_ARENA_ICONS[id](ctx, s, t, col);
  else if (id === 'skate') { ctx.beginPath(); ctx.ellipse(-s * 0.35, s * 0.1, s * 0.5, s * 0.35, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(s * 0.2, s * 0.5); ctx.quadraticCurveTo(s * 0.25, -s * 0.2, s * 0.6, -s * 0.4); ctx.moveTo(s * 0.9, s * 0.5); ctx.quadraticCurveTo(s * 0.85, -s * 0.2, s * 0.6, -s * 0.4); ctx.stroke(); }
  else if (id === 'mx') { ctx.beginPath(); ctx.moveTo(-s, s * 0.4); for (let i = 0; i <= 8; i++) ctx.lineTo(-s + i * s * 0.25, s * 0.4 - (i % 2 ? s * 0.3 : 0) - (i === 4 ? s * 0.4 : 0)); ctx.lineTo(s, s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke(); const bx = Math.sin(t * 2) * s * 0.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(bx, -s * 0.35 - Math.abs(Math.cos(t * 2)) * s * 0.2, s * 0.1, 0, TAU); ctx.fill(); }
  else { ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-s * 0.12, s * 0.3); ctx.lineTo(-s * 0.1, -s * 0.35); for (let i = 0; i < 4; i++) ctx.lineTo(-s * 0.1 + i * s * 0.07, -s * 0.55 - (i % 2) * s * 0.08); ctx.lineTo(s * 0.16, -s * 0.3); ctx.lineTo(s * 0.14, s * 0.3); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
