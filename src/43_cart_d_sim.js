/* ============================================================
   ART CART — the race/battle scene: simulation half.
   Driving (drift + mini-turbo, hops, ramps, terrain slopes and air),
   collisions, the twelve signature weapons, pickups, AI (racing line +
   objective-driven arena AI that also fires its weapon), laps, Grand Prix
   points and the battle objectives (vibe check, glow grab, king of the
   hill, capture the flag, scramble race).
   Rendering, camera and HUD live in 43_cart_e_scene.js.
   ============================================================ */
const CART_G = 26;              // gravity (m/s²)
const CART_R = 1.45;            // car collision radius (m)
const CART_TMPL = { i: 0, s: 0, d: 0 }, CART_TMPL2 = { i: 0, s: 0, d: 0 }, CART_AT = {};
let cartHooked = false;
const CartKeys = { fire: false, firePressed: false };
function cartHookOnce() {
  if (cartHooked) return; cartHooked = true;
  const fireKey = c => c === 'KeyF' || c === 'KeyE' || c === 'KeyC' || c === 'KeyL';
  window.addEventListener('keydown', e => { if (!fireKey(e.code) || !(Game.scene instanceof CartRaceScene)) return; if (e.cancelable) e.preventDefault(); if (!CartKeys.fire) CartKeys.firePressed = true; CartKeys.fire = true; });
  window.addEventListener('keyup', e => { if (fireKey(e.code)) CartKeys.fire = false; });
  window.addEventListener('blur', () => { CartKeys.fire = false; });
  document.addEventListener('visibilitychange', () => {
    const s = Game.scene; if (!(s instanceof CartRaceScene)) return;
    if (document.hidden) { if (Sound.engine) Sound.engine(false, 0); if (!s.paused && (s.state === 'race' || s.state === 'count' || s.state === 'intro')) s.openPause(); }
  });
}

class CartRaceScene {
  constructor(opts) {
    opts = opts || {};
    const sv = cartSave();
    this.opts = opts;
    this.mode = opts.mode || 'gp';                 // gp | tt | quick | battle
    this.isBattle = this.mode === 'battle';
    this.objective = this.isBattle ? (opts.objective || 'vibe') : 'race';
    this.isRace = this.objective === 'race';
    this.cup = cartCup(opts.cup); this.raceIdx = opts.race || 0;
    this.trackId = opts.track || (this.mode === 'gp' ? this.cup.tracks[this.raceIdx] : 'esplanade');
    if (!CART_TRACKS[this.trackId]) this.trackId = 'esplanade';
    this.arenaId = this.isBattle ? cartArena(opts.arena).id : null;
    this.rules = this.isBattle ? (CART_ARENA_RULES[this.arenaId] || {}) : {};   // the arena's special physics and powers
    this.G = this.rules.gravity || CART_G;
    this.driverId = cartDriver(opts.driver || sv.driver).id; this.carId = cartCar(opts.car || sv.car).id;
    this.autoGas = opts.autoGas !== undefined ? !!opts.autoGas : sv.autoGas !== false;
    this.gp = opts.gp || { points: {}, results: [] };
    this.gpSnap = JSON.stringify(this.gp);
    this.laps = opts.laps || CART_LAPS;
    this.t = 0; this.time = 0; this.state = 'load'; this.stateT = 0; this.paused = false; this.raceT = 0;
    this.rng = mulberry32((opts.seed !== undefined ? opts.seed : (Date.now() & 0xffff)) ^ hashStr(this.trackId + (this.arenaId || '')));
    this.msgs = []; this.events = []; this.shots = []; this.hazards = []; this.q = 1; this.loadP = 0;
    this.cam = { x: 0, y: 6, z: -10, tx: 0, ty: 1, tz: 0, fov: 1.0, shift: 0 };
    this.env = {}; this.stats = { fps: 60, draws: 0, tris: 0, cpu: 0 };
    Input.setMode('ui');
    cartHookOnce();
    this.jobs = [() => this.loadGL(), () => this.loadWorld(), () => this.loadRacers(), () => this.loadModels(0), () => this.loadModels(1), () => this.loadModels(2), () => this.loadModels(3), () => this.loadFinish()];
    this.jobsTotal = this.jobs.length;
    this.loadMsg = ['Gassing up the art cars', 'Untangling the EL wire', 'Sweeping the playa for MOOP', 'Tuning the subwoofers', 'Inflating the giant duck', 'Hydrating'][Math.floor(Math.random() * 6)];
  }
  /* ---------- loading (spread over frames; tests call loadAll) ---------- */
  loadAll() { while (this.jobs && this.jobs.length && this.state === 'load') this.jobs.shift()(); }
  runJobs(budget) { const t0 = performance.now(); while (this.jobs.length && this.state === 'load' && performance.now() - t0 < budget) this.jobs.shift()(); this.loadP = 1 - this.jobs.length / this.jobsTotal; }
  loadGL() {
    if (!BurnsGL.init()) { this.state = 'nogl'; this.jobs.length = 0; this.buildNoGL(); return; }
    BurnsGL.configure(cartSave().gfx || 'auto');
    BURNS_ATLAS.init(); BURNS_SPRITES.init();
    this.R = new BurnsRenderer();
    this.fx = new BurnsFX(2600);
  }
  loadWorld() {
    try { this.E = this.isBattle ? CartWorlds.arena(this.arenaId) : CartWorlds.track(this.trackId); }
    catch (e) { console.error(e); Game.reportError(e); this.state = 'nogl'; this.noglMsg = 'This course failed to load.'; this.jobs.length = 0; this.buildNoGL(); return; }
    const E = this.E;
    this.W = E.world; this.T = this.isRace ? E.track : null; this.TR = E.track; this.terrain = E.terrain;
    this.palA = E.sky; this.night = !!E.night;
    this.name = this.isBattle ? E.arena.name : E.def.name;
  }
  loadRacers() {
    const E = this.E, rng = this.rng;
    // the field: the player + seven rivals (other cars and drivers; a Grand Prix keeps the same rivals all cup)
    let roster = this.gp.roster;
    if (!roster || this.mode !== 'gp') {
      const cars = cartShuffle(CART_CARS.map(c => c.id).filter(id => id !== this.carId), rng);
      const drivers = cartShuffle(CART_DRIVERS.map(d => d.id).filter(id => id !== this.driverId), rng);
      roster = []; for (let i = 0; i < 7; i++) roster.push({ car: cars[i % cars.length], driver: drivers[i % drivers.length] });
      if (this.opts.rivals) roster = this.opts.rivals.slice(0, 7).map((c, i) => ({ car: cartCar(c).id, driver: drivers[i % drivers.length] }));   // tests: a fixed field
      if (this.mode === 'gp') this.gp.roster = roster;
    }
    const field = [{ car: this.carId, driver: this.driverId, player: true }].concat(this.mode === 'tt' ? [] : roster.map(r => ({ car: r.car, driver: r.driver })));
    // grid: Grand Prix race 1 the player starts last, then by the last finish; battles spread around the arena
    let order = field.slice(1); cartShuffle(order, rng);
    let pSlot = this.mode === 'gp' || this.mode === 'quick' ? order.length : 0;
    if (this.mode === 'gp' && this.gp.lastPos) pSlot = clamp(this.gp.lastPos - 1, 0, order.length);
    if (this.isBattle) pSlot = Math.floor(rng() * (order.length + 1));
    order.splice(pSlot, 0, field[0]);
    const base = this.mode === 'gp' ? 0.88 + this.raceIdx * 0.025 + (this.cup.id === 'fire' ? 0.035 : 0) : 0.9;
    this.karts = order.map((f, slot) => {
      const k = this.makeKart(f, slot);
      if (!k.player) k.ai.skill = clamp(base + (rng() - 0.5) * 0.06 + (slot < 3 ? 0.015 : 0), 0.8, 1.03);
      return k;
    });
    this.player = this.karts.find(k => k.player);
  }
  makeKart(f, slot) {
    const car = cartCar(f.car), drv = cartDriver(f.driver), st = car.stats, E = this.E, sp = E.spawn[slot % E.spawn.length];
    const k = {
      id: car.id + ':' + drv.id, car, drv, player: !!f.player, slot, name: drv.name,
      vmax: 25.5 + st.speed * 0.75, acc: 8.5 + st.accel * 2.7, turn: 1.4 + st.handling * 0.14, grip: 6.2 + st.handling * 0.9,
      mass: 0.7 + st.weight * 0.15, offK: 0.52 + st.weight * 0.03,
      x: sp.x, z: sp.z, y: 0, vx: 0, vy: 0, vz: 0, yaw: sp.yaw, pitch: 0, roll: 0, bob: 0, speed: 0, fwd: 0, lat: 0,
      steer: 0, steerVis: 0, drift: 0, charge: 0, air: false, airT: 0, hopCool: 0, pendingDrift: false, onSlope: false, wheelA: 0,
      boostT: 0, boostKind: '', slowT: 0, spinT: 0, spinA: 0, flipT: 0, flipA: 0, dazzleT: 0, stunT: 0, bubbleT: 0, shieldT: 0, invT: 0, foamT: 0, slimeT: 0, dashT: 0,
      item: null, roul: 0, roulItem: null, itemCool: 0,
      wpn: { id: car.weapon, def: CART_WEAPONS[car.weapon], t: 2.5 + slot * 0.25, fireT: 0, uses: 0, hits: 0 },
      loc: { i: 0, s: 0, d: 0 }, prevS: 0, lap: 0, prog: 0, rank: slot + 1, finished: false, finishT: 0, lapStart: 0, lapTimes: [],
      inp: { steer: 0, gas: 0, brake: 0, drift: false, driftPress: false, item: false, fire: false },
      vibes: this.objective === 'vibe' ? 4 : 3, out: false, score: 0, orbs: 0, flag: false, hitsDealt: 0, hitsTaken: 0,
      wrongT: 0, bumpT: 0, padCool: 0, rubber: 1, off: false, landT: 0, dustT: 0, sparkT: 0, animT: 0, anim: 'cartDrive', cheerT: 0, honkT: 0,
      ai: f.player ? null : { skill: 0.9, bias: (this.rng() - 0.5) * 2, avoid: 0, avoidT: 0, driftT: 0, itemT: 1 + this.rng() * 2, fireT: 0.6 + this.rng() * 1.5, stuckT: 0, revT: 0, wob: this.rng() * 10, tgt: null, tgtT: 0 }
    };
    if (this.TR) { this.TR.locateGlobal(k.x, k.z, k.loc); k.prevS = k.loc.s; }
    if (this.T) {
      const T = this.T, N = T.N, vp = new Float32Array(N);
      for (let i = 0; i < N; i++) vp[i] = Math.min(k.vmax * 1.4, T.RAD[i] * k.turn * 0.8);
      for (let pass = 0; pass < 2; pass++) for (let i = N - 1; i >= 0; i--) { const nx = vp[(i + 1) % N]; vp[i] = Math.min(vp[i], Math.sqrt(nx * nx + 2 * 24 * T.ds)); }
      k.vp = vp;
    }
    k.y = this.terrain.height(k.x, k.z);
    return k;
  }
  loadModels(part) {
    const K = this.karts, n = K.length, a = Math.floor(part * n / 4), b = Math.floor((part + 1) * n / 4);
    for (let i = a; i < b; i++) {
      const k = K[i];
      k.M = CartModels.get(k.car.id, false); k.Mlo = CartModels.get(k.car.id, true);
      k.bones = new Float32Array(16 * 12); k.dBones = new Float32Array(16 * 12);
      const D = CartDrivers.model(k.drv.id);
      k.dModel = D.model; k.driverScale = D.scale * (k.M.driverScale || 1); k.driverMan = !!D.man;
      k.ch = new BurnsChar(D.model); k.ch.play('cartDrive', { steer: 0 }, true);
      k.st = { t: this.rng() * 10, speed: 0, steer: 0, fire: 0, boost: 0, air: 0, beat: 0, night: this.night ? 1 : 0 };
    }
  }
  loadFinish() {
    const E = this.E, rng = this.rng;
    // pooled dynamic props (one draw call per group): gift boxes, glow orbs, sprinkle mines, porta-potties, tumbleweeds, the flag
    this.props = { gifts: [], orbs: [], mines: [], potties: [], tumbles: [], flag: null, groups: [] };
    const G1 = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); this.props.groups.push(G1);
    let G = G1;
    const add = (build, o) => { if (G.full) { G.finish(); G = new BurnsGroup(Math.min(64, BurnsGL.maxBones || 32)); this.props.groups.push(G); } return G.add(build, Object.assign({ visible: false }, o)); };
    const giftCols = ['#ff4fd8', '#38f2ff', '#ffe24a', '#7aff5a', '#ff7a2a'];
    if (this.mode !== 'tt') for (const g of E.gifts) { const o = add(m => CartPropMesh.gift(m, giftCols[Math.floor(rng() * giftCols.length)]), {}); o.gx = g.x; o.gz = g.z; o.alive = 1; o.t = 0; o.ph = rng() * 10; o.visible = true; this.props.gifts.push(o); }
    if (this.objective === 'glow') for (let i = 0; i < 14; i++) this.props.orbs.push(add(m => CartPropMesh.orb(m), { alive: 0 }));
    for (let i = 0; i < 12; i++) this.props.mines.push(add(m => CartPropMesh.mine(m), { alive: 0 }));
    for (let i = 0; i < 3; i++) this.props.potties.push(add(m => CartPropMesh.potty(m), { alive: 0 }));
    for (let i = 0; i < 4; i++) this.props.tumbles.push(add(m => CartPropMesh.tumble(m), { alive: 0 }));
    if (this.objective === 'flag') this.props.flag = add(m => CartPropMesh.flag(m), { alive: 1 });
    G.finish();
    cartItemsLoad(this);   // the item effects' pooled meshes, sprites and state (43_cart_da_items.js)
    // hero cast by the track (animated, full detail when close)
    this.heroes = E.heroes.map((h, i) => {
      const model = BurnsRig.model(BurnsRig.npcSpec(h.type, 7 + i, {})), ch = new BurnsChar(model);
      ch.x = h.x; ch.z = h.z; ch.y = this.terrain.height(h.x, h.z); ch.yaw = h.yaw; ch.play(h.anim, h.anim === 'dance' ? { style: i % 6 } : h.anim === 'firespin' ? { tool: 'poi' } : {}, true); ch.animT = i * 0.7;
      return { ch, model, h, fire: h.type === 'firespinner' };
    });
    if (E.man) { const model = BurnsManModel.build(), ch = new BurnsChar(model); ch.x = E.man.x; ch.z = E.man.z; ch.y = E.man.y || 5.4; ch.yaw = 0; ch.scale = E.man.scale || 1; ch.play('idle', {}, true); this.man = { ch, model, burn: 0 }; }
    // objective setup
    this.obj = { t: 0, time: this.isBattle ? CART_OBJECTIVES[this.objective].time : 0, zone: 0, zoneT: 25, capture: 0, flag: null, ended: false };
    if (this.objective === 'flag') { const s = E.flagSpots[0]; this.obj.flag = { x: s.x, z: s.z, y: this.terrain.height(s.x, s.z), holder: null, t: 0, cool: 0 }; }
    if (this.objective === 'glow') for (const o of this.props.orbs) this.spawnOrb(o);
    { const OD = CART_OBJECTIVES[this.objective]; if (OD && OD.fx && OD.fx.init) OD.fx.init(this); }
    if (this.rules.onLoad) this.rules.onLoad(this);
    this.windA = rng() * TAU;
    this.storm = { t: 8 + rng() * 6, k: 0, phase: 'calm' };
    this.state = 'intro'; this.stateT = 0;
    this.camYaw = this.player.yaw; this.snapCam = true;
    Sound.music(E.music || 'kart1');
    this.introCam = 0;
  }
  buildNoGL() { const W = Game.cssW, H = Game.cssH, bw = Math.min(220, W * 0.6); this.noglBtns = [{ x: (W - bw) / 2, y: H * 0.62, w: bw, h: 46, label: '◀ MENU', primary: true, fn: () => this.leave() }]; }
  log(type, o) { const e = Object.assign({ type, t: +this.raceT.toFixed(3) }, o || {}); this.events.push(e); if (this.events.length > 400) this.events.shift(); return e; }
  banner(text, col, t, sub, small) { this.msgs.push({ text, col: col || '#ffffff', t: t || 1.6, max: t || 1.6, sub, small }); if (this.msgs.length > 3) this.msgs.shift(); }
  shakeIt(a) { if (Save.data.settings.shake !== false) this.shake = Math.max(this.shake || 0, a); }

  /* ---------- the fixed-step update ---------- */
  update(dt) {
    if (this.state === 'nogl') { const h = BurnsUIKit.hitButtons(this.noglBtns); if (h) h.fn(); return; }
    if (this.state === 'load') return;
    const wantMode = !this.paused && (this.state === 'count' || this.state === 'race') ? 'game' : 'ui';
    if (Input.mode !== wantMode) { Input.setMode(wantMode); this.layoutControls(); }
    if (this.paused) { this.updatePause(); return; }
    if ((this.state === 'race' || this.state === 'count' || this.state === 'intro') && (Input.pausePressed || (Input.mode === 'ui' && Input.uiKey === 'pause'))) { this.openPause(); return; }
    this.t += dt; this.stateT += dt; this.time += dt;
    if (this.state === 'intro') {
      if (this.stateT > 3.6 || (this.stateT > 0.5 && (Input.taps.length || Input.jumpPressed || Input.actionPressed || Input.uiKey === 'enter'))) { this.state = 'count'; this.stateT = 0; this.countN = 4; this.snapCam = true; Input.setMode('game'); this.layoutControls(); }
      this.updateWorld(dt, false); return;
    }
    if (this.state === 'count') {
      const n = 3 - Math.floor(this.stateT);
      if (n !== this.countN && n >= 1) { this.countN = n; Sound.play('kartCountdown'); }
      if (this.player && Input.jumpPressed && this.stateT > 2.35 && this.stateT < 3) this.player.goodStart = true;
      if (this.player && Input.jumpPressed && this.stateT < 2.35) this.player.goodStart = false;
      if (this.stateT >= 3) {
        this.state = 'race'; this.stateT = 0; this.raceT = 0; Sound.play('kartGo'); this.banner('GO!', '#7aff8a', 1.0);
        for (const k of this.karts) if (k.player ? k.goodStart : this.rng() < k.ai.skill - 0.55) this.boost(k, 0.9, 'start');
      }
      this.updateWorld(dt, false); return;
    }
    if (this.state === 'race' || this.state === 'done') {
      this.raceT += dt;
      this.updateWorld(dt, true);
      if (this.state === 'race' && this.isBattle) this.updateObjective(dt);
      if (this.state === 'done') {
        const allIn = !this.isRace || this.karts.every(k => k.finished);
        if (this.stateT > 4.5 && (allIn || this.stateT > 9)) this.finishRace();
        else if (this.stateT > 1.5 && (Input.taps.length || Input.jumpPressed || Input.uiKey === 'enter')) this.finishRace();
      }
      return;
    }
    // results / standings / trophy: the world keeps idling behind the panels
    this.updateWorld(dt, false);
    this.updateResults();
  }
  updateWorld(dt, racing) {
    CartKeys.firePressedFrame = CartKeys.firePressed; CartKeys.firePressed = false;
    for (const k of this.karts) {
      if (k.player && racing && !k.finished && !this.autoDrive && !k.out) this.playerInput(k);
      else if ((racing || k.finished) && !k.out) this.aiInput(k, dt, racing);
      else { const I = k.inp; I.gas = 0; I.steer = 0; I.brake = k.out ? 1 : 0; I.drift = false; I.driftPress = false; I.item = false; I.fire = false; }
      this.stepKart(k, dt, racing);
    }
    this.collideKarts();
    if (racing && this.isRace) this.updateRanks();
    this.updateShots(dt);
    this.updateHazards(dt);
    this.updateProps(dt, racing);
    cartItemsUpdate(this, dt, racing);   // item effects and car specials (43_cart_da_items.js)
    if (this.rules.onUpdate) this.rules.onUpdate(this, dt, racing);
    for (const id in CART_ITEM_FX) { const F = CART_ITEM_FX[id]; if (F.update) F.update(this, dt, racing); }
    if (this.E.storm) this.updateStorm(dt);
    if (this.man) this.man.burn = Math.min(1, this.man.burn + dt * 0.02);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 3);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 3);
    if (this.white > 0) this.white = Math.max(0, this.white - dt * 0.8);
    for (const m of this.msgs) m.t -= dt;
    this.msgs = this.msgs.filter(m => m.t > 0);
  }
  playerInput(k) {
    const I = k.inp, L = Input.layout;
    let st = 0, sy = 0;
    if (Input.stick.active && L) {
      const dx = (Input.stick.x - Input.stick.ox) / (L.r * 0.85), dy = (Input.stick.y - Input.stick.oy) / (L.r * 0.85);
      st = Math.abs(dx) < 0.1 ? 0 : clamp((dx - Math.sign(dx) * 0.1) / 0.9, -1, 1); sy = -dy;
    } else st = (Input.right ? 1 : 0) - (Input.left ? 1 : 0);
    if (this.pad && Math.abs(this.pad.lx) > 0.15) st = this.pad.lx;
    I.steer = st;
    const brakeBtn = Input.hudHeld.brake || (Input.stick.active ? sy < -0.55 : Input.down);
    I.brake = brakeBtn ? 1 : 0;
    I.gas = this.autoGas ? (I.brake ? 0 : 1) : ((Input.stick.active ? sy > 0.35 : Input.up) || Input.hudHeld.gas ? 1 : 0);
    I.drift = Input.jump; I.driftPress = Input.jumpPressed;
    I.item = Input.actionPressed;
    I.fire = !!(Input.hudPressed.fire || CartKeys.firePressedFrame || (this.pad && this.pad.fireP));
  }
  boost(k, t, kind) {
    k.boostT = Math.max(k.boostT, t); k.boostKind = kind;
    const sp = Math.hypot(k.vx, k.vz), fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), add = Math.max(0, k.vmax * 1.12 - sp) * 0.5;
    k.vx += fx * add; k.vz += fz * add;
    if (k.player) { Sound.play('kartBoost', { vol: 0.8, pitch: kind === 'mt2' ? 1.15 : 1 }); this.flash = 0.25; }
  }
  /* ---------- one car, one step ---------- */
  stepKart(k, dt, racing) {
    const T = this.T, inp = k.inp, W = this.W;
    for (const key of ['boostT', 'slowT', 'dazzleT', 'stunT', 'shieldT', 'invT', 'foamT', 'hopCool', 'padCool', 'bumpT', 'itemCool', 'landT', 'cheerT', 'slimeT', 'dashT', 'honkT', 'charmT', 'gooT', 'immuneT']) if (k[key] > 0) k[key] = Math.max(0, k[key] - dt);
    if (k.spinT > 0) { k.spinT = Math.max(0, k.spinT - dt); k.spinA += dt * 13 * Math.min(1, k.spinT + 0.3); if (k.spinT === 0) k.spinA = 0; }
    if (k.flipT > 0) { k.flipT = Math.max(0, k.flipT - dt); k.flipA = (1 - k.flipT / k.flipDur) * TAU; if (k.flipT === 0) k.flipA = 0; }
    const w = k.wpn; if (w.t > 0) { const before = w.t; w.t = Math.max(0, w.t - dt); if (before > 0 && w.t === 0) { this.log('ready', { k: k.id }); if (k.player && racing) Sound.play('kartItem', { vol: 0.35, pitch: 1.5 }); } }
    if (w.fireT > 0) w.fireT = Math.max(0, w.fireT - dt);
    if (this.rules.onStep) this.rules.onStep(this, k, dt, racing);
    // roulette
    if (k.roul > 0) {
      const before = k.roul; k.roul = Math.max(0, k.roul - dt);
      if (k.player && Math.floor(before * 12) !== Math.floor(k.roul * 12)) Sound.play('kartRoulette', { vol: 0.3, pitch: 0.9 + this.rng() * 0.3 });
      if (k.player && inp.item && before < 1.0) k.roul = 0.0001;
      if (k.roul <= 0) { k.item = k.roulItem; k.itemCool = 0.35; if (k.player) { Sound.play('kartItem'); this.itemPop = 0.4; if (CART_ITEMS[k.item] && CART_ITEMS[k.item].car) { this.banner('SIGNATURE SPECIAL!', CART_ITEMS[k.item].col, 1.4, CART_ITEMS[k.item].name, true); Sound.play('cartSparkle', { vol: 0.7 }); } } }
      inp.item = false;
    }
    const disabled = k.spinT > 0 || k.flipT > 0 || k.bubbleT > 0 || k.out;
    if (racing && inp.fire && w.t <= 0 && !disabled && k.stunT <= 0 && this.mode !== 'tt') this.fireWeapon(k);   // time trials are pure driving
    if (racing && inp.item && k.item && k.itemCool <= 0 && !disabled && k.stunT <= 0) this.useItem(k);
    // where are we on the track?
    let off = false;
    if (this.TR) { const loc = this.TR.locate(k.x, k.z, k.loc.i, k.loc); if (T) off = Math.abs(loc.d) > T.HW[loc.i] + 0.3 && !k.air; }
    k.off = off;
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    let fwd = k.vx * fx + k.vz * fz; const sp = Math.abs(fwd);
    // top speed this step
    let vmax = k.vmax;
    if (off && k.boostT <= 0) vmax *= k.offK;
    if (k.slowT > 0) vmax *= 0.6;
    if (k.foamT > 0) vmax *= 0.62;
    if (k.charmT > 0) vmax *= 0.7;   // lovestruck (HEART THROB)
    if (k.gooT > 0) vmax *= 0.4;     // stuck in frosting (FROSTING FLOOD)
    if (k.dazzleT > 0) vmax *= 0.82;
    if (k.stunT > 0) vmax *= 0.45;
    if (k.slimeT > 0) vmax *= 1.18;
    if (k.boostT > 0) vmax = Math.max(vmax, k.vmax * (k.boostKind === 'mt2' || k.boostKind === 'glow' ? 1.34 : 1.26));
    if (k.dashT > 0) vmax = Math.max(vmax, k.vmax * 1.55);
    if (k.vmaxMin > 0) vmax = Math.max(vmax, k.vmax * k.vmaxMin);   // flights, surf, sand dive (43_cart_da_items.js)
    if (!k.player) vmax *= k.rubber * (k.pace || 1);
    if (this.stormK > 0.5 && !k.player) vmax *= 1 - 0.08 * this.stormK;
    // bubble: floating helplessly, then dropped
    if (k.bubbleT > 0) {
      k.bubbleT = Math.max(0, k.bubbleT - dt);
      const gh = this.terrain.height(k.x, k.z), u = 1 - k.bubbleT / 1.5;
      k.y = gh + Math.sin(Math.min(1, u * 1.4) * Math.PI * 0.5) * 3.2 + Math.sin(this.t * 5) * 0.15; k.air = true; k.vy = 0;
      k.vx *= Math.exp(-3 * dt); k.vz *= Math.exp(-3 * dt); k.x += k.vx * dt; k.z += k.vz * dt; k.yaw += dt * 1.2;
      if (k.bubbleT === 0) { k.vy = -2; this.fx.burst(k.x, k.y + 1, k.z, 'ring', 10, '#bff4ff'); Sound.play('splash', { vol: k.player ? 0.7 : 0.25 }); }
      this.finishStep(k, dt, racing, fwd); return;
    }
    // carried by an item (thrown by tentacles, whirled by a dust devil…): the item flies the car
    if (k.carry) { cartCarryStep(this, k, dt); this.finishStep(k, dt, racing, fwd); return; }
    // steering + drift (steer right = +1 lowers yaw)
    const spinning = k.spinT > 0 || k.flipT > 0;
    let wob = k.dazzleT > 0 ? Math.sin(this.t * 9 + k.slot) * 0.65 : 0;
    if (k.foamT > 0) wob += Math.sin(this.t * 5.3 + k.slot * 2) * 0.35;   // slithering in the foam
    if (k.charmT > 0 && k.charmBy && !k.charmBy.out) wob += clamp(-cartWrap(Math.atan2(k.charmBy.x - k.x, k.charmBy.z - k.z) - k.yaw) * 1.4, -0.75, 0.75);   // drifting toward the crush
    k.steer = approach(k.steer, spinning ? 0 : clamp(inp.steer + wob, -1, 1), dt * (k.player && Input.stick.active ? 12 : 7));
    const auth = Math.max(clamp(sp / 5.5, 0, 1), inp.gas > 0 || inp.brake > 0 ? 0.5 : 0) * (1 - 0.3 * clamp((sp - 20) / 12, 0, 1));
    let yawRate = 0;
    if (!spinning && !k.out) {
      if (k.drift) {
        const m = clamp(k.steer * k.drift, -1, 1);
        yawRate = -k.drift * k.turn * Math.max(0.12, 0.52 + 0.6 * m) * auth;
        if (!k.air) {
          const before = k.charge; k.charge += dt * (1.0 + 0.8 * Math.max(0, m));
          if (k.player && ((before < 1.0 && k.charge >= 1.0) || (before < 2.1 && k.charge >= 2.1))) Sound.play('kartDrift', { vol: 0.45, pitch: k.charge >= 2.1 ? 1.3 : 1.1 });
        }
        if (!inp.drift) { if (k.charge >= 2.1) this.boost(k, 1.15, 'mt2'); else if (k.charge >= 1.0) this.boost(k, 0.65, 'mt1'); k.drift = 0; k.charge = 0; }
        else if (sp < 7 || (off && sp < 10)) { k.drift = 0; k.charge = 0; }
      } else yawRate = -k.steer * k.turn * auth * (fwd < -0.5 ? -1 : 1);
      if (k.air && !k.fly) yawRate *= 0.55;   // flying cars steer like on the ground
    }
    k.yaw = cartWrap(k.yaw + yawRate * dt);
    if (inp.driftPress && !k.air && !spinning && k.hopCool <= 0 && !k.out) {
      k.vy = 4.2; k.air = true; k.hopCool = 0.25; k.pendingDrift = sp > 8; k.hop = true;
      if (k.player) Sound.play('jump', { vol: 0.25, pitch: 1.6 });
    }
    // engine, brakes, grip (velocity re-projected on the new heading)
    const nfx = Math.sin(k.yaw), nfz = Math.cos(k.yaw);
    fwd = k.vx * nfx + k.vz * nfz;
    let lat = k.vx * -nfz + k.vz * nfx;
    const gas = spinning || k.out ? 0 : inp.gas, brake = spinning ? 0 : inp.brake;
    if (brake > 0) { if (fwd > 0.5) fwd -= 28 * brake * dt; else fwd = Math.max(-8, fwd - 9 * dt); }
    else if (gas > 0) {
      if (fwd < vmax) fwd = Math.min(vmax, fwd + (k.acc * (1 - Math.max(0, fwd) / vmax * 0.82) + (k.boostT > 0 || k.dashT > 0 ? 24 : 0)) * gas * dt);
      else fwd = Math.max(vmax, fwd - ((fwd - vmax) * 1.8 + 1.5) * dt);
    } else {
      fwd -= Math.sign(fwd) * Math.min(Math.abs(fwd), (2.5 + Math.abs(fwd) * 0.3) * dt);
      if (fwd > vmax) fwd = Math.max(vmax, fwd - (fwd - vmax) * 1.8 * dt);
    }
    if (spinning) fwd *= Math.exp(-2.4 * dt);
    const grip = k.air ? (k.fly ? 2.6 : 0.8) : k.drift ? 2.4 : spinning ? 1.5 : k.grip * (off ? 0.75 : 1) * (k.foamT > 0 ? 0.35 : 1);
    lat *= Math.exp(-grip * dt);
    k.vx = nfx * fwd + nfz * lat; k.vz = nfz * fwd - nfx * lat;
    // slopes pull the car downhill (quarter pipes, berms, dunes)
    if (!k.air) {
      const e = 0.6, hx = (this.terrain.height(k.x + e, k.z) - this.terrain.height(k.x - e, k.z)) / (2 * e), hz = (this.terrain.height(k.x, k.z + e) - this.terrain.height(k.x, k.z - e)) / (2 * e), q = 1 + hx * hx + hz * hz;
      if (hx || hz) { k.vx -= this.G * hx / q * dt; k.vz -= this.G * hz / q * dt; }
      k.slopeX = hx; k.slopeZ = hz;
    }
    k.x += k.vx * dt; k.z += k.vz * dt;
    k.speed = Math.hypot(k.vx, k.vz); k.fwd = fwd; k.lat = lat;
    this.finishStep(k, dt, racing, fwd);
  }
  // vertical motion, walls, obstacles, pickups, laps, pose
  finishStep(k, dt, racing, fwd) {
    const T = this.T, TR = this.TR, inp = k.inp;
    // vertical: follow the terrain, leave it at crests and lips, land
    const gh = this.terrain.height(k.x, k.z);
    if (k.bubbleT > 0 || k.carry) { /* positioned by the bubble or the item carrying it */ }
    else if (k.fly && k.fly.v(this, k, dt)) { /* flying (DRAGON FLIGHT, SKY BREACH, STORM HOVER, SHELL BOUNCE…) */ }
    else if (this.rules.vertical && this.rules.vertical(this, k, dt, racing)) { /* the arena moved the car (floating, swimming…) */ }
    else if (k.air) {
      k.vy -= this.G * dt; k.y += k.vy * dt; k.airT += dt;
      if (k.y <= gh) {
        const hard = k.vy < -7;
        k.y = gh; k.air = false; k.landT = 0.18;
        if (hard) { this.landFx(k); if (k.player) { this.shakeIt(clamp(-k.vy / 30, 0.15, 0.6)); Sound.play('stomp', { vol: 0.35, pitch: 0.7 }); } }
        if (k.airT > 0.7 && !k.hop && k.spinT <= 0 && k.flipT <= 0) { this.boost(k, 0.55, 'air'); if (k.player) this.banner('BIG AIR!', '#38f2ff', 0.9); }
        k.vy = 0; k.airT = 0; k.hop = false;
        if (k.pendingDrift && inp.drift && Math.abs(k.steer) > 0.25 && Math.abs(fwd) > 8 && k.spinT <= 0) { k.drift = Math.sign(k.steer); k.charge = 0; if (k.player) Sound.play('kartDrift', { vol: 0.4 }); }
        k.pendingDrift = false;
      }
    } else {
      const vyG = (gh - k.y) / dt, pred = k.y + k.vy * dt - 0.5 * this.G * dt * dt;
      if (gh < pred - 0.04 && k.vy > -2) { k.air = true; k.airT = 0; k.hop = false; const f = this.terrain.kindAt(k.x - k.vx * dt * 3, k.z - k.vz * dt * 3); if (f && f.kind === 'ramp') k.vy += 3.5; k.y = pred; }
      else { k.vy = clamp(vyG, -20, 30); k.y = gh; }
    }
    // track walls (races) or the arena perimeter
    if (TR && (T || this.E.walls === null)) this.trackWalls(k);
    if (this.E.walls) this.arenaWalls(k);
    // static obstacles (art, camps, props): the engine's colliders
    if (k.y < gh + 3) {
      const e = this._pe || (this._pe = { x: 0, z: 0 }); e.x = k.x; e.z = k.z;
      const hit = this.W.push(e, CART_R * 0.85, k.y, 2.4, 0.6);
      if (hit) {
        let nx = e.x - k.x, nz = e.z - k.z; const d = Math.hypot(nx, nz);
        if (d > 1e-4) { nx /= d; nz /= d; const vn = k.vx * nx + k.vz * nz; if (vn < 0) { k.vx -= nx * vn * 1.5; k.vz -= nz * vn * 1.5; k.vx *= 0.82; k.vz *= 0.82; if (-vn > 4 && k.bumpT <= 0) { k.bumpT = 0.3; k.drift = 0; k.charge = 0; this.sparkBurst(k.x - nx * 1.2, k.y + 0.8, k.z - nz * 1.2, 10, '#ffd8a0'); if (k.player) { Sound.play('kartHit', { vol: 0.6 }); this.shakeIt(0.5); } } } }
        k.x = e.x; k.z = e.z;
      }
    }
    // boost pads
    if (!k.air && k.padCool <= 0) for (const b of this.E.boosts) { const [u, v] = cartLocal(k.x, k.z, b.x, b.z, b.yaw); if (Math.abs(u) < b.l / 2 && Math.abs(v) < b.w / 2) { this.boost(k, 1.05, 'pad'); k.padCool = 0.4; break; } }
    // gift boxes
    if (racing && !k.out) for (const g of this.props.gifts) {
      if (!g.alive) continue;
      const dx = k.x - g.gx, dz = k.z - g.gz;
      if (dx * dx + dz * dz < 4.4 && Math.abs(k.y - this.terrain.height(g.gx, g.gz)) < 2.5) {
        g.alive = 0; g.t = 2.6; this.fx.confetti(g.gx, k.y + 1.2, g.gz, 14);
        if (!k.item && k.roul <= 0) { k.roul = k.player ? 1.6 : 0.9; k.roulItem = cartRollItem(this.isRace ? k.rank : 4, this.isRace ? this.karts.length : 8, this.rng, this.isBattle ? this.arenaId : null, k.car.id); k.cheerT = 1.0; }
        if (k.player) Sound.play('gift', { vol: 0.5 });
      }
    }
    // laps (races)
    if (T && racing) {
      const s = k.loc.s;
      if (k.prevS > T.L * 0.75 && s < T.L * 0.25) this.crossLine(k);
      else if (k.prevS < T.L * 0.25 && s > T.L * 0.75) k.lap--;
      k.prevS = s; k.prog = (k.lap - 1) * T.L + s;
      if (k.player) { const dot = Math.sin(k.yaw) * T.TX[k.loc.i] + Math.cos(k.yaw) * T.TZ[k.loc.i]; if (dot < -0.25 && k.speed > 2) k.wrongT += dt; else k.wrongT = Math.max(0, k.wrongT - dt * 2); }
    }
    this.poseKart(k, dt);
    this.kartFx(k, dt);
  }
  trackWalls(k) {
    const T = this.TR, L2 = T.locate(k.x, k.z, k.loc.i, CART_TMPL2), j = L2.i, wr = T.WR[j] - 1.1, wl = T.WL[j] - 1.1;
    if (L2.d <= wr && L2.d >= -wl) return;
    if (this.E.walls && !this.isRace) return;   // arenas with a course: the course edges are soft (hay bales are decor)
    const side = L2.d > 0 ? 1 : -1, pen = side > 0 ? L2.d - wr : -wl - L2.d;
    k.x -= T.NX[j] * pen * side; k.z -= T.NZ[j] * pen * side;
    const vn = (k.vx * T.NX[j] + k.vz * T.NZ[j]) * side;
    const tang = Math.atan2(T.TX[j], T.TZ[j]), rel = cartWrap(k.yaw - tang), into = (Math.sin(k.yaw) * T.NX[j] + Math.cos(k.yaw) * T.NZ[j]) * side;
    if (into > 0.04) { const target = Math.abs(rel) > 2.2 ? tang + Math.PI : tang, diff = cartWrap(target - k.yaw), turn = Math.min(Math.abs(diff), (vn > 3 ? 0.35 * Math.abs(diff) : 0) + 2.8 / 120); k.yaw = cartWrap(k.yaw + Math.sign(diff) * turn); }
    if (vn > 0) {
      if (vn > 2) { k.vx -= T.NX[j] * side * vn * 1.4; k.vz -= T.NZ[j] * side * vn * 1.4; const keep = 1 - clamp(vn / 40, 0.05, 0.3); k.vx *= keep; k.vz *= keep; }
      else { k.vx -= T.NX[j] * side * vn; k.vz -= T.NZ[j] * side * vn; k.vx *= 0.996; k.vz *= 0.996; }
      if (vn > 3.5 && k.bumpT <= 0) { k.bumpT = 0.3; if (k.drift && vn > 8) { k.drift = 0; k.charge = 0; } this.sparkBurst(k.x + T.NX[j] * side * 1.3, k.y + 0.5, k.z + T.NZ[j] * side * 1.3, 10, '#ffd890'); if (k.player) { Sound.play('kartHit', { vol: clamp(vn / 18, 0.25, 0.9) }); this.shakeIt(Math.min(1, 0.3 + vn / 25)); } }
    }
  }
  // closed polygon perimeter (convex arenas): push inside + bounce
  arenaWalls(k) {
    const P = this.E.walls, n = P.length, r = CART_R;
    for (let i = 0; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez), tx = ex / L, tz = ez / L;
      // inward normal (polygon wound clockwise or counter-clockwise: pick the side the centre is on)
      let nx = -tz, nz = tx; const cx = -a[0], cz = -a[1]; if (cx * nx + cz * nz < 0) { nx = -nx; nz = -nz; }
      const d = (k.x - a[0]) * nx + (k.z - a[1]) * nz, along = (k.x - a[0]) * tx + (k.z - a[1]) * tz;
      if (d < r && along > -1 && along < L + 1) {
        k.x += nx * (r - d); k.z += nz * (r - d);
        const vn = k.vx * nx + k.vz * nz;
        if (vn < 0) { k.vx -= nx * vn * 1.5; k.vz -= nz * vn * 1.5; k.vx *= 0.85; k.vz *= 0.85; if (-vn > 4 && k.bumpT <= 0) { k.bumpT = 0.3; k.drift = 0; this.sparkBurst(k.x - nx, k.y + 0.6, k.z - nz, 8, '#ffd890'); if (k.player) { Sound.play('kartHit', { vol: 0.5 }); this.shakeIt(0.4); } } }
      }
    }
  }
  // inward distance to the arena perimeter (+ inside) and its inward normal
  wallDist(x, z, out) {
    const P = this.E.walls; out = out || {}; out.d = 1e9; out.nx = 0; out.nz = 0; if (!P) return out;
    for (let i = 0, n = P.length; i < n; i++) {
      const a = P[i], b = P[(i + 1) % n], ex = b[0] - a[0], ez = b[1] - a[1], L = Math.hypot(ex, ez);
      let nx = -ez / L, nz = ex / L; if (-a[0] * nx - a[1] * nz < 0) { nx = -nx; nz = -nz; }
      const d = (x - a[0]) * nx + (z - a[1]) * nz; if (d < out.d) { out.d = d; out.nx = nx; out.nz = nz; }
    }
    return out;
  }
  crossLine(k) {
    k.lap++;
    if (k.lap >= 2) { const lt = this.raceT - k.lapStart; k.lapTimes.push(lt); if (k.player) this.lastLap = { t: lt, show: 3 }; }
    k.lapStart = this.raceT;
    this.log('lap', { k: k.id, lap: k.lap });
    if (k.lap > this.laps && !k.finished) {
      k.finished = true; k.finishT = this.raceT; k.cheerT = 99;
      this.log('finish', { k: k.id, t: k.finishT, player: k.player });
      if (k.player) {
        this.state = 'done'; this.stateT = 0; Sound.play('kartFinish'); Input.setMode('ui'); this.layoutControls();
        this.banner('FINISH!', '#ffd84a', 2.5); if (Sound.engine) Sound.engine(false, 0);
        if (!k.ai) k.ai = { skill: 0.86, bias: 0, avoid: 0, avoidT: 0, driftT: 0, itemT: 99, fireT: 99, stuckT: 0, revT: 0, wob: 0 };
        this.fx.confetti(k.x, k.y + 2, k.z, 40); Sound.play('crowd', { vol: 0.6 });
      }
    } else if (k.player && k.lap >= 2) {
      if (k.lap === this.laps) { Sound.play('kartFinalLap'); this.banner('FINAL LAP!', '#ff4fd8', 2.0); }
      else { Sound.play('kartLap'); this.banner('LAP ' + k.lap + '/' + this.laps, '#38f2ff', 1.4); }
    }
  }
  collideKarts() {
    const K = this.karts;
    for (let a = 0; a < K.length; a++) for (let b = a + 1; b < K.length; b++) {
      const A = K[a], Bk = K[b];
      if (Math.abs(A.y - Bk.y) > 1.6 || A.sunk || Bk.sunk) continue;   // over each other, or a shark under the sand
      const dx = Bk.x - A.x, dz = Bk.z - A.z, d2 = dx * dx + dz * dz, rr = CART_R * 2;
      if (d2 >= rr * rr || d2 < 1e-6) continue;
      const d = Math.sqrt(d2), nx = dx / d, nz = dz / d, pen = rr - d;
      const ma = A.mass * (A.dashT > 0 ? 4 : 1), mb = Bk.mass * (Bk.dashT > 0 ? 4 : 1), ta = mb / (ma + mb), tb = ma / (ma + mb);
      A.x -= nx * pen * ta; A.z -= nz * pen * ta; Bk.x += nx * pen * tb; Bk.z += nz * pen * tb;
      const vr = (Bk.vx - A.vx) * nx + (Bk.vz - A.vz) * nz;
      if (vr < 0) {
        const j = -1.5 * vr / (1 / ma + 1 / mb);
        A.vx -= nx * j / ma; A.vz -= nz * j / ma; Bk.vx += nx * j / mb; Bk.vz += nz * j / mb;
        if (-vr > 3 && (A.player || Bk.player)) { Sound.play('bump', { vol: clamp(-vr / 20, 0.2, 0.7) }); this.shakeIt(0.35); }
        if (-vr > 2) this.sparkBurst((A.x + Bk.x) / 2, (A.y + Bk.y) / 2 + 0.8, (A.z + Bk.z) / 2, 6, '#ffe8b0');
      }
      if (A.dashT > 0 && Bk.dashT <= 0) this.hit(Bk, 'flip', A, { dx: nx, dz: nz, weapon: 'chomp' });
      else if (Bk.dashT > 0 && A.dashT <= 0) this.hit(A, 'flip', Bk, { dx: -nx, dz: -nz, weapon: 'chomp' });
    }
  }
  updateRanks() {
    const K = this.karts.slice().sort((a, b) => (b.finished - a.finished) || (a.finished ? a.finishT - b.finishT : b.prog - a.prog));
    K.forEach((k, i) => k.rank = i + 1);
    const p = this.player;
    if (p) for (const k of this.karts) {
      if (k.player) continue;
      const gap = k.prog - p.prog;
      // keep a human in the pack: rivals far ahead ease off, rivals far behind push a little
      k.rubber = gap > 25 ? 1 - Math.min(0.13, (gap - 25) / 420) : gap < -18 ? 1 + Math.min(0.08, (-gap - 18) / 300) : 1;
      if (p.finished) k.rubber = 1;
    }
  }
  /* ---------- getting hit (cartoon effects only) ---------- */
  hit(k, kind, src, o) {
    o = o || {};
    if (k.out || k.invT > 0 || k.dashT > 0 || k.immuneT > 0 || (k.finished && this.isRace) || (this.obj && this.obj.ended)) return false;
    if (k.guard && k.guard(this, k, kind, src, o)) return false;   // e.g. a MIRROR SCHOOL decoy takes it
    if (k.shieldT > 0) { k.shieldT = 0; k.invT = 0.8; this.fx.burst(k.x, k.y + 1.6, k.z, 'star', 16, '#ff9af0'); Sound.play('break', { vol: k.player ? 0.8 : 0.3, pitch: 1.4 }); this.log('blocked', { k: k.id, by: src && src.id, w: o.weapon }); if (k.player) this.banner('SHIELD POPPED!', '#ff9af0', 1.2); return false; }
    k.drift = 0; k.charge = 0; k.boostT = 0; k.dashT = 0;
    if (kind === 'spin' || kind === 'knock') { k.spinT = o.dur || 1.0; k.vx *= 0.45; k.vz *= 0.45; if (kind === 'knock') { k.vx += (o.dx || 0) * (o.power || 14); k.vz += (o.dz || 0) * (o.power || 14); k.vy = Math.max(k.vy, 3.5); k.air = true; } }
    else if (kind === 'flip') { k.flipDur = k.flipT = 1.05; k.vy = o.vy || 9.5; k.air = true; k.vx = k.vx * 0.5 + (o.dx || 0) * 8; k.vz = k.vz * 0.5 + (o.dz || 0) * 8; }
    else if (kind === 'dazzle') { k.dazzleT = 2.4; if (k.player) this.white = 0.6; }
    else if (kind === 'bubble') { k.bubbleT = 1.5; }
    else if (kind === 'stun') { k.stunT = 1.7; k.vx *= 0.6; k.vz *= 0.6; }
    else if (kind === 'slip') { k.spinT = 0.75; k.slowT = 1.2; }
    // item hits (43_cart_da_items.js): foamed, whirled up by a dust devil, blasted by a missile or bomb, lovestruck, stuck in frosting
    else if (kind === 'foam') { k.foamT = Math.max(k.foamT, o.dur || 3.0); k.vx *= 0.7; k.vz *= 0.7; }
    else if (kind === 'whirl') { k.spinT = o.dur || 1.6; k.vx *= 0.3; k.vz *= 0.3; k.vy = Math.max(k.vy, o.vy || 10); k.air = true; k.hop = true; k.whirlT = 1.6; }
    else if (kind === 'launch') { k.flipDur = k.flipT = 1.25; k.vy = o.vy || 12.5; k.air = true; k.hop = true; k.vx = k.vx * 0.3 + (o.dx || 0) * (o.power || 7); k.vz = k.vz * 0.3 + (o.dz || 0) * (o.power || 7); k.smokeT = 1.6; }
    else if (kind === 'charm') { k.charmT = o.dur || 3.2; k.charmBy = src || null; }
    else if (kind === 'goo') { k.gooT = o.dur || 2.4; k.vx *= 0.5; k.vz *= 0.5; }
    k.invT = this.isBattle ? 2.3 : 1.6; k.anim = 'cartHit'; k.animT = 0; k.hitsTaken++;
    if (src && src !== k) { src.hitsDealt++; if (o.weapon) src.wpn.hits++; src.cheerT = Math.max(src.cheerT, 0.9); }
    this.log('hit', { k: k.id, by: src && src.id, kind, w: o.weapon || o.item, player: k.player, byPlayer: !!(src && src.player) });
    if (k.player) { Sound.play('kartHit'); this.shakeIt(1); const who = src && src !== k ? src.car.name : ''; this.banner(kind === 'flip' ? 'FLIPPED!' : kind === 'bubble' ? 'BUBBLED!' : kind === 'stun' ? 'ZAPPED!' : kind === 'dazzle' ? 'DAZZLED!' : kind === 'foam' ? 'FOAMED!' : kind === 'whirl' ? 'WHIRLED UP!' : kind === 'launch' ? 'BLASTED!' : kind === 'charm' ? 'LOVESTRUCK!' : kind === 'goo' ? 'STUCK IN FROSTING!' : 'SPUN OUT!', '#ff6a6a', 1.2, who ? 'by ' + who : ''); }
    else if (src && src.player) { Sound.play('kartHit', { vol: 0.35, pitch: 1.25 }); this.banner('HIT! ' + k.car.name, '#7aff8a', 0.9, null, true); }
    if (this.isBattle) this.onBattleHit(k, src);
    if (this.rules.onHit) this.rules.onHit(this, k, kind, src, o);
    return true;
  }

  /* ---------- signature weapons ---------- */
  muzzle(k, out) { return cartCarPoint(k, k.M.muzzle[0], k.M.muzzle[1], k.M.muzzle[2], out); }
  fireWeapon(k) {
    const w = k.wpn, D = w.def, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx, sp = Math.max(0, k.fwd || 0);
    w.t = D.reload; w.fireT = 1.0; w.uses++; k.anim = 'cartFire'; k.animT = 0;
    this.log('fire', { k: k.id, w: w.id, player: k.player });
    const mz = this.muzzle(k, [0, 0, 0]), vol = k.player ? 0.9 : 0.35;
    if (k.player) this.banner(D.name + '!', D.col, 1.0, null, true);
    switch (w.id) {
      case 'bassdrop': this.shots.push({ type: 'ring', owner: k, x: k.x, y: k.y, z: k.z, r: 1, max: D.range, t: 0, life: 0.7, hit: new Set(), col: D.col }); Sound.play('cartBass', { vol }); if (k.player) this.shakeIt(0.5); this.fx.hearts(k.x, k.y + 4, k.z, 8); break;
      case 'dazzle': this.shots.push({ type: 'beam', owner: k, t: 0, life: 0.9, range: D.range, half: 0.2, kind: 'dazzle', col: [0.75, 0.9, 1], hit: new Set() }); Sound.play('cartSparkle', { vol }); Sound.play('disco', { vol: vol * 0.5 }); break;
      case 'torch': this.shots.push({ type: 'torch', owner: k, t: 0, life: 1.25, range: D.range, hit: new Set() }); Sound.play('flame', { vol }); Sound.play('flame', { vol: vol * 0.7, pitch: 0.7 }); break;
      case 'fireball': for (const a of [-0.17, 0, 0.17]) { const yaw = k.yaw + a; this.shots.push({ type: 'ball', kind: 'fire', owner: k, x: mz[0], y: mz[1], z: mz[2], vx: Math.sin(yaw) * (sp + 30), vz: Math.cos(yaw) * (sp + 30), vy: 2, t: 0, life: 2.4, r: 1.9, bounces: 0, loc: { i: k.loc.i, s: 0, d: 0 } }); } Sound.play('flame', { vol, pitch: 1.3 }); break;
      case 'bubbles': for (let i = 0; i < 6; i++) { const a = (i / 5 - 0.5) * 0.9, yaw = k.yaw + a; this.shots.push({ type: 'ball', kind: 'bubble', owner: k, x: mz[0], y: mz[1], z: mz[2], vx: Math.sin(yaw) * (sp * 0.7 + 17), vz: Math.cos(yaw) * (sp * 0.7 + 17), vy: 0, t: 0, life: 3.2, r: 2.0, home: 1, loc: { i: k.loc.i, s: 0, d: 0 } }); } Sound.play('cartQuack', { vol }); Sound.play('cartBubble', { vol }); break;
      case 'laser': this.shots.push({ type: 'laser', owner: k, t: 0, life: 0.8, range: D.range, a0: 1.05, a1: -1.05, hit: new Set() }); Sound.play('laser', { vol }); Sound.play('laser', { vol: vol * 0.6, pitch: 0.7 }); break;
      case 'sprinkles': for (let i = 0; i < 4; i++) this.shots.push({ type: 'drop', owner: k, t: -i * 0.14, done: false }); Sound.play('throw', { vol }); Sound.play('cartSparkle', { vol: vol * 0.6, pitch: 1.3 }); break;
      case 'cannon':
        // broadside: two balls out of each flank (left = +X local)
        for (const s of [1, -1]) for (const dz of [-0.7, 0.6]) {
          const p = cartCarPoint(k, s * 1.6, 1.55, dz, [0, 0, 0]), lx = -rx * s, lz = -rz * s;
          this.shots.push({ type: 'ball', kind: 'cannon', owner: k, x: p[0], y: p[1], z: p[2], vx: k.vx * 0.6 + lx * 34, vz: k.vz * 0.6 + lz * 34, vy: 3.5, t: 0, life: 1.3, r: 1.8, loc: { i: k.loc.i, s: 0, d: 0 } });
          this.fx.smoke(p[0], p[1], p[2], 4, '#e8e0d8');
        }
        Sound.play('cartBoom', { vol }); if (k.player) this.shakeIt(0.4); break;
      case 'slime': k.slimeT = 3.0; this.boost(k, 0.6, 'slime'); this.shots.push({ type: 'slimer', owner: k, t: 0, life: 3.0, next: 0 }); Sound.play('puke', { vol, pitch: 0.7 }); break;
      case 'zap': { const tg = this.karts.filter(o => o !== k && !o.out && Math.hypot(o.x - k.x, o.z - k.z) < D.range).sort((a, b) => Math.hypot(a.x - k.x, a.z - k.z) - Math.hypot(b.x - k.x, b.z - k.z)).slice(0, 2); this.shots.push({ type: 'zap', owner: k, t: 0, life: 0.55, targets: tg }); for (const o of tg) this.hit(o, 'stun', k, { weapon: 'zap' }); Sound.play('cartZap', { vol }); break; }
      case 'chomp': k.dashT = 0.75; this.boost(k, 0.75, 'dash'); this.shots.push({ type: 'dash', owner: k, t: 0, life: 0.75, hit: new Set() }); Sound.play('kartBoost', { vol, pitch: 0.8 }); Sound.play('cartChomp', { vol }); break;
      case 'geyser': { let best = null, bd = 1e9; for (const o of this.karts) { if (o === k || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d > D.range) continue; const ang = Math.abs(cartWrap(Math.atan2(dx, dz) - k.yaw)); const score = d * (ang < 0.8 ? 1 : 2.5); if (score < bd) { bd = score; best = o; } } const tx = best ? best.x : k.x + fx * 25, tz = best ? best.z : k.z + fz * 25; this.shots.push({ type: 'geyser', owner: k, target: best, x: tx, z: tz, t: 0, life: 1.6, fired: false, hit: new Set() }); Sound.play('splash', { vol, pitch: 0.6 }); if (best && best.player) this.banner('INCOMING WHALE SPOUT!', '#4ab0ff', 1.0); break; }
    }
  }
  updateShots(dt) {
    const out = [];
    for (const s of this.shots) {
      s.t += dt;
      const k = s.owner;
      if (s.fx && CART_ITEM_FX[s.fx] && CART_ITEM_FX[s.fx].shot) { CART_ITEM_FX[s.fx].shot(this, s, dt); }
      else if (s.type === 'ring') {
        s.r = 1 + (s.max - 1) * Math.min(1, s.t / s.life);
        for (const o of this.karts) { if (o === k || s.hit.has(o)) continue; const dx = o.x - s.x, dz = o.z - s.z, d = Math.hypot(dx, dz); if (d < s.r + 1.2 && Math.abs(o.y - s.y) < 3.5) { s.hit.add(o); this.hit(o, 'knock', k, { dx: dx / (d || 1), dz: dz / (d || 1), power: 15, weapon: 'bassdrop' }); } }
      } else if (s.type === 'beam' || s.type === 'laser') {
        const mz = this.muzzle(k, [0, 0, 0]);
        let yaw = k.yaw; if (s.type === 'laser') yaw = k.yaw + lerp(s.a0, s.a1, Math.min(1, s.t / s.life));
        s.yaw = yaw; s.x = mz[0]; s.y = mz[1]; s.z = mz[2];
        for (const o of this.karts) {
          if (o === k || s.hit.has(o)) continue;
          const dx = o.x - s.x, dz = o.z - s.z, d = Math.hypot(dx, dz); if (d > s.range || d < 0.5) continue;
          const a = Math.abs(cartWrap(Math.atan2(dx, dz) - yaw)), half = s.type === 'laser' ? Math.atan2(1.7, d) + 0.03 : s.half + Math.atan2(1.5, d);
          if (a < half) { s.hit.add(o); this.hit(o, s.type === 'laser' ? 'spin' : 'dazzle', k, { weapon: s.type === 'laser' ? 'laser' : 'dazzle' }); }
        }
      } else if (s.type === 'torch') {
        for (const o of this.karts) { if (o === k || s.hit.has(o)) continue; const d = Math.hypot(o.x - k.x, o.z - k.z); if (d < s.range && Math.abs(o.y - k.y) < 3) { s.hit.add(o); this.hit(o, 'spin', k, { weapon: 'torch', dur: 1.2 }); } }
      } else if (s.type === 'ball') {
        if (s.kind === 'bubble' && s.home) { let best = null, bd = 18; for (const o of this.karts) { if (o === k || o.out) continue; const d = Math.hypot(o.x - s.x, o.z - s.z); const ahead = (o.x - s.x) * s.vx + (o.z - s.z) * s.vz > 0; if (ahead && d < bd) { bd = d; best = o; } } if (best) { const sp = Math.hypot(s.vx, s.vz), dx = best.x - s.x, dz = best.z - s.z, d = Math.hypot(dx, dz) || 1; s.vx = lerp(s.vx, dx / d * sp, 1 - Math.exp(-1.6 * dt)); s.vz = lerp(s.vz, dz / d * sp, 1 - Math.exp(-1.6 * dt)); } }
        s.x += s.vx * dt; s.z += s.vz * dt;
        const gh = this.terrain.height(s.x, s.z);
        if (s.kind === 'fire') { s.vy -= 24 * dt; s.y += s.vy * dt; if (s.y < gh + 0.5) { s.y = gh + 0.5; s.vy = 7.5; } }
        else if (s.kind === 'cannon') { s.vy -= 9 * dt; s.y += s.vy * dt; if (s.y < gh + 0.4) s.dead = true; }
        else { s.y = lerp(s.y, gh + 1.8 + Math.sin(s.t * 4) * 0.3, 1 - Math.exp(-3 * dt)); }
        if (this.TR && this.isRace) { const L = this.TR.locate(s.x, s.z, s.loc.i, s.loc), j = L.i, wr = this.TR.WR[j] - 0.5, wl = this.TR.WL[j] - 0.5; if (L.d > wr || L.d < -wl) { const side = L.d > 0 ? 1 : -1, nx = this.TR.NX[j] * side, nz = this.TR.NZ[j] * side, vn = s.vx * nx + s.vz * nz; if (vn > 0) { s.vx -= nx * vn * 2; s.vz -= nz * vn * 2; } if (s.kind === 'cannon') s.dead = true; } }
        if (this.E.walls) for (const a of this.E.art) if (Math.hypot(s.x - a.x, s.z - a.z) < a.r) s.dead = true;
        if (this.E.walls && this.wallDist(s.x, s.z, this._wd3 || (this._wd3 = {})).d < 0) s.dead = true;
        for (const o of this.karts) { if (o === k && s.t < 0.6) continue; if (o === k || o.out) continue; const dx = o.x - s.x, dz = o.z - s.z; if (dx * dx + dz * dz < s.r * s.r && Math.abs(o.y + 1 - s.y) < 2.6) { const kind = s.kind === 'bubble' ? 'bubble' : s.kind === 'cannon' ? 'knock' : 'spin'; const d = Math.hypot(s.vx, s.vz) || 1; this.hit(o, kind, k, { dx: s.vx / d, dz: s.vz / d, power: 12, weapon: s.kind === 'bubble' ? 'bubbles' : s.kind === 'cannon' ? 'cannon' : 'fireball' }); s.dead = true; if (s.kind !== 'bubble') { this.fx.spark(s.x, s.y, s.z, 14, s.kind === 'fire' ? '#ff8a2a' : '#ffe8b0', 7); this.fx.smoke(s.x, s.y, s.z, 4); } else this.fx.burst(s.x, s.y, s.z, 'ring', 8, '#bff4ff'); break; } }
      } else if (s.type === 'drop') {
        if (!s.done && s.t >= 0) { s.done = true; const p = cartCarPoint(k, 0, 0.6, -k.M.len / 2 - 0.8, [0, 0, 0]); this.layMine(p[0], p[2], k); }
        if (s.done) s.dead = true;
      } else if (s.type === 'slimer') {
        s.next -= dt; if (s.next <= 0) { s.next = 0.11; const p = cartCarPoint(k, 0, 0, -k.M.len / 2 - 0.5, [0, 0, 0]); this.hazards.push({ type: 'slime', x: p[0], z: p[2], y: this.terrain.height(p[0], p[2]), r: 2.3, t: 0, life: 6, owner: k, yaw: k.yaw }); }
      } else if (s.type === 'dash') {
        // the bite: anything right in front gets flipped (collideKarts handles touches)
        const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
        for (const o of this.karts) { if (o === k || s.hit.has(o) || o.out) continue; const dx = o.x - k.x, dz = o.z - k.z, along = dx * fx + dz * fz, side = Math.abs(dx * fz - dz * fx); if (along > 0 && along < 5.2 && side < 2.6) { s.hit.add(o); this.hit(o, 'flip', k, { dx: fx, dz: fz, weapon: 'chomp' }); } }
      } else if (s.type === 'geyser') {
        // the spout tracks its target and leads it, so it erupts where the car will be
        if (s.target && s.t < 0.62 && !s.target.out) { const lead = 0.72 - s.t, tg = s.target; s.x = lerp(s.x, tg.x + tg.vx * lead, 1 - Math.exp(-12 * dt)); s.z = lerp(s.z, tg.z + tg.vz * lead, 1 - Math.exp(-12 * dt)); }
        if (s.t > 0.7 && !s.fired) { s.fired = true; Sound.play('cartGeyser', { vol: k.player || (s.target && s.target.player) ? 0.85 : 0.35 }); this.fx.burst(s.x, this.terrain.height(s.x, s.z) + 0.5, s.z, 'drop', 20, '#9adcff'); }
        if (s.fired && s.t < 1.25) for (const o of this.karts) { if (o === k || s.hit.has(o)) continue; if (Math.hypot(o.x - s.x, o.z - s.z) < 4.2) { s.hit.add(o); this.hit(o, 'flip', k, { vy: 15, weapon: 'geyser' }); } }
      } else if (s.type === 'zap') { /* visual only; damage applied on fire */ }
      if (s.t > s.life) s.dead = true;
      if (!s.dead) out.push(s);
    }
    this.shots = out;
  }
  layMine(x, z, owner) {
    const m = this.props.mines.find(o => !o.alive) || this.props.mines.reduce((a, b) => (a.t > b.t ? a : b));
    m.alive = 1; m.gx = x; m.gz = z; m.t = 0; m.owner = owner; m.visible = true;
  }
  updateHazards(dt) {
    const out = [];
    for (const h of this.hazards) {
      h.t += dt;
      if (h.type === 'slime') for (const o of this.karts) { if (o === h.owner || o.air) continue; if (Math.hypot(o.x - h.x, o.z - h.z) < h.r && o.invT <= 0 && o.spinT <= 0) this.hit(o, 'slip', h.owner, { weapon: 'slime' }); }
      if (h.t < h.life) out.push(h);
    }
    this.hazards = out;
  }
  /* ---------- pickups (gift-box items) ---------- */
  useItem(k) {
    const it = k.item; k.item = null; k.itemCool = 0.3;
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    this.log('item', { k: k.id, item: it, player: k.player });
    if (k.player) this.banner(CART_ITEMS[it].name + '!', CART_ITEMS[it].col, 1.0, null, true);
    const vol = k.player ? 0.8 : 0.3;
    if (CART_ITEM_FX[it] && CART_ITEM_FX[it].use) { CART_ITEM_FX[it].use(this, k); return; }   // an arena power
    switch (it) {
      case 'glow': this.boost(k, 1.6, 'glow'); break;
      case 'water': k.slowT = 0; k.dazzleT = 0; k.stunT = 0; k.foamT = 0; k.charmT = 0; k.gooT = 0; if (this.isBattle && this.objective === 'vibe' && k.vibes < 4) k.vibes++; this.boost(k, 0.7, 'water'); Sound.play('splash', { vol }); this.fx.burst(k.x, k.y + 1.5, k.z, 'drop', 14, '#7ac8ff'); break;
      case 'tumble': { const t = this.props.tumbles.find(o => !o.alive) || this.props.tumbles[0]; t.alive = 1; t.visible = true; t.gx = k.x - fx * 4; t.gz = k.z - fz * 4; t.vx = Math.sin(this.windA) * 2 - fx * 1.5; t.vz = Math.cos(this.windA) * 2 - fz * 1.5; t.t = 0; t.owner = k; t.rot = 0; break; }
      case 'potty': { const p = this.props.potties.find(o => !o.alive) || this.props.potties[0]; let x = k.x + fx * 40, z = k.z + fz * 40; if (this.T) { const g = this.T.at(k.loc.s + 48 + this.rng() * 20, CART_AT); x = g.x + g.nx * g.o; z = g.z + g.nz * g.o; } p.alive = 1; p.visible = true; p.gx = x; p.gz = z; p.t = 0; p.drop = 1.2; p.owner = k; Sound.play('throw', { vol }); break; }
      case 'shield': k.shieldT = 10; Sound.play('shield', { vol }); break;
      // RANGER WHISTLE, FOAM PARTY, DUST DEVIL and the sky drops live in 43_cart_da_items.js (CART_ITEM_FX)
    }
  }
  updateProps(dt, racing) {
    const P = this.props;
    for (const g of P.gifts) { if (!g.alive) { g.t -= dt; if (g.t <= 0) g.alive = 1; } }
    for (const m of P.mines) {
      if (!m.alive) continue; m.t += dt;
      if (m.t > 22) { m.alive = 0; m.visible = false; continue; }
      for (const o of this.karts) { if (o === m.owner && m.t < 0.8) continue; if (o.air || o.out) continue; if (Math.hypot(o.x - m.gx, o.z - m.gz) < 1.9) { this.hit(o, 'flip', m.owner, { weapon: 'sprinkles' }); m.alive = 0; m.visible = false; this.fx.confetti(m.gx, this.terrain.height(m.gx, m.gz) + 0.5, m.gz, 30); Sound.play('break', { vol: o.player ? 0.8 : 0.3, pitch: 1.5 }); break; } }
    }
    for (const p of P.potties) {
      if (!p.alive) continue; p.t += dt;
      if (p.t > 14) { p.alive = 0; p.visible = false; continue; }
      if (p.t > p.drop) for (const o of this.karts) { if (Math.hypot(o.x - p.gx, o.z - p.gz) < 2.6 && !o.air) { this.hit(o, 'spin', p.owner, { item: 'potty' }); p.alive = 0; p.visible = false; this.fx.burst(p.gx, 1.5, p.gz, 'square', 24, '#5a9aff'); Sound.play('break', { vol: o.player ? 0.8 : 0.3 }); break; } }
    }
    for (const t of P.tumbles) {
      if (!t.alive) continue; t.t += dt;
      t.gx += t.vx * dt; t.gz += t.vz * dt; t.rot += dt * 3;
      if (t.t > 18) { t.alive = 0; t.visible = false; continue; }
      for (const o of this.karts) { if (o === t.owner && t.t < 0.8) continue; if (Math.hypot(o.x - t.gx, o.z - t.gz) < 2.3 && !o.air) { this.hit(o, 'spin', t.owner, { item: 'tumble', dur: 0.8 }); t.alive = 0; t.visible = false; this.fx.burst(t.gx, 1, t.gz, 'spark', 12, '#c8995a'); break; } }
    }
    if (this.objective === 'glow') for (const o of P.orbs) {
      if (!o.alive) { o.t -= dt; if (o.t <= 0) this.spawnOrb(o); continue; }
      if (o.drop > 0) { o.drop -= dt; o.gx += o.vx * dt; o.gz += o.vz * dt; o.vx *= Math.exp(-2 * dt); o.vz *= Math.exp(-2 * dt); }
      if (!racing || this.obj.ended) continue;
      for (const k of this.karts) { if (k.out || (o.cool > 0 && o.from === k)) continue; if (Math.hypot(k.x - o.gx, k.z - o.gz) < 2.8) { o.alive = 0; o.visible = false; o.t = 1.2 + this.rng() * 2; k.score++; this.log('orb', { k: k.id, n: k.score }); this.fx.burst(o.gx, o.gy + 0.5, o.gz, 'star', 10, '#9afff0'); if (k.player) Sound.play('glowstick', { vol: 0.8 }); break; } }
      if (o.cool > 0) o.cool -= dt;
    }
  }
  spawnOrb(o, x, z, from) {
    const E = this.E;
    if (x === undefined) { const s = E.orbSpots[Math.floor(this.rng() * E.orbSpots.length)]; x = s.x + (this.rng() - 0.5) * 4; z = s.z + (this.rng() - 0.5) * 4; o.vx = 0; o.vz = 0; o.drop = 0; }
    o.alive = 1; o.visible = true; o.gx = x; o.gz = z; o.gy = this.terrain.height(x, z) + 1.0; o.ph = this.rng() * 10; o.from = from || null; o.cool = from ? 1.0 : 0;
  }
  /* ---------- battle objectives ---------- */
  onBattleHit(k, src) {
    const O = this.obj;
    if (this.objective === 'vibe' && !k.out) {
      k.vibes = Math.max(0, k.vibes - 1);
      if (k.vibes === 0) { k.out = true; k.outT = this.raceT; k.anim = 'cartSulk'; this.log('out', { k: k.id, by: src && src.id }); this.banner(k.player ? 'VIBE CHECK FAILED' : k.car.name + ' IS OUT!', k.player ? '#ff6a6a' : '#ffd84a', 1.6); this.fx.smoke(k.x, k.y + 2, k.z, 10, '#6a6a7a'); Sound.play('powerdown', { vol: k.player ? 0.9 : 0.4 }); }
    }
    if (this.objective === 'glow' && k.score > 0) {
      const n = Math.min(3, k.score); k.score -= n;
      for (let i = 0; i < n; i++) { const o = this.props.orbs.find(q => !q.alive); if (!o) break; const a = this.rng() * TAU; this.spawnOrb(o, k.x, k.z, k); o.vx = Math.sin(a) * 9; o.vz = Math.cos(a) * 9; o.drop = 0.8; }
      if (k.player) this.banner('-' + n + ' ORBS', '#9afff0', 1.0);
    }
    if (this.objective === 'flag' && O.flag && O.flag.holder === k) this.dropFlag(k);
  }
  dropFlag(k) { const F = this.obj.flag; F.holder = null; k.flag = false; F.x = k.x; F.z = k.z; F.y = this.terrain.height(k.x, k.z); F.cool = 0.9; this.log('flagdrop', { k: k.id }); this.banner(k.player ? 'YOU DROPPED THE FLAG!' : 'FLAG DROPPED!', '#ff4fd8', 1.2); }
  updateObjective(dt) {
    const O = this.obj, E = this.E, K = this.karts;
    O.time -= dt; O.t += dt;
    const alive = K.filter(k => !k.out);
    if (this.objective === 'vibe') {
      // when the player's lights go out the rest fight on a little longer (spectate), then it ends
      if (this.player.out && this.playerOutT === undefined) this.playerOutT = this.raceT;
      if (alive.length <= 1 || O.time <= 0 || (this.playerOutT !== undefined && this.raceT - this.playerOutT > 10)) return this.endBattle();
    } else if (this.objective === 'glow') {
      const best = K.reduce((a, b) => (b.score > a.score ? b : a));
      if (best.score >= CART_OBJECTIVES.glow.goal || O.time <= 0) return this.endBattle();
    } else if (this.objective === 'hill') {
      O.zoneT -= dt;
      if (O.zoneT <= 0) { O.zone = (O.zone + 1) % E.zones.length; O.zoneT = 25; this.banner('THE ZONE MOVES', '#ffe24a', 1.6, 'to ' + E.zones[O.zone].name); Sound.play('kartFinalLap', { vol: 0.5 }); }
      const z = E.zones[O.zone];
      for (const k of alive) { const inside = Math.hypot(k.x - z.x, k.z - z.z) < z.r; k.inZone = inside; if (inside) k.score += dt; }
      const best = K.reduce((a, b) => (b.score > a.score ? b : a));
      if (best.score >= CART_OBJECTIVES.hill.goal || O.time <= 0) return this.endBattle();
    } else if (this.objective === 'flag') {
      const F = O.flag; if (F.cool > 0) F.cool -= dt;
      if (F.holder) { const h = F.holder; F.x = h.x; F.z = h.z; F.y = h.y + h.M.h; const c = E.captures[O.capture]; if (Math.hypot(h.x - c.x, h.z - c.z) < c.r) { h.score++; h.flag = false; F.holder = null; this.log('capture', { k: h.id, n: h.score }); this.banner(h.player ? 'CAPTURED!' : h.car.name + ' CAPTURES!', h.player ? '#7aff8a' : '#ff9a3a', 1.6, h.score + ' / ' + CART_OBJECTIVES.flag.goal); Sound.play(h.player ? 'kartFinish' : 'kartLap', { vol: 0.6 }); this.fx.confetti(c.x, 2, c.z, 40); const s = E.flagSpots[Math.floor(this.rng() * E.flagSpots.length)]; F.x = s.x; F.z = s.z; F.y = this.terrain.height(s.x, s.z); F.cool = 1.5; O.capture = (O.capture + 1 + Math.floor(this.rng() * (E.captures.length - 1))) % E.captures.length; if (h.score >= CART_OBJECTIVES.flag.goal) return this.endBattle(); } }
      else if (F.cool <= 0) for (const k of alive) { if (k.invT > 0.6 || k.air && k.y > F.y + 3) continue; if (Math.hypot(k.x - F.x, k.z - F.z) < 2.8) { F.holder = k; k.flag = true; this.log('flag', { k: k.id }); this.banner(k.player ? 'YOU GOT THE FLAG!' : k.car.name + ' HAS THE FLAG', k.player ? '#7aff8a' : '#ff4fd8', 1.4, k.player ? 'Drive it into the glowing ring' : ''); Sound.play('pick', { vol: 0.6 }); break; } }
      if (O.time <= 0) return this.endBattle();
    } else if (!this.isRace) {
      // custom objectives registered by the arena files; untimed ones (time 0) only end through their own update
      const D = CART_OBJECTIVES[this.objective];
      if (D && D.fx && D.fx.update && D.fx.update(this, dt) === true) return this.endBattle();
      if (D && D.time > 0 && O.time <= 0) return this.endBattle();
    }
  }
  battleRank() {
    const K = this.karts.slice(), D = CART_OBJECTIVES[this.objective];
    if (D && D.fx && D.fx.rank) return D.fx.rank(this);
    if (this.objective === 'vibe') K.sort((a, b) => (a.out - b.out) || (b.vibes - a.vibes) || ((b.outT || 0) - (a.outT || 0)) || (b.hitsDealt - a.hitsDealt));
    else K.sort((a, b) => (b.score - a.score) || (b.hitsDealt - a.hitsDealt));
    return K;
  }
  endBattle() {
    if (this.obj.ended) return; this.obj.ended = true;
    const order = this.battleRank(); this.finalOrder = order; order.forEach((k, i) => { k.rank = i + 1; k.cheerT = i === 0 ? 99 : 0; if (i > 0) k.anim = 'cartSulk'; });
    const win = order[0];
    this.log('battleEnd', { winner: win.id, player: win.player });
    this.state = 'done'; this.stateT = 0; Input.setMode('ui'); this.layoutControls(); if (Sound.engine) Sound.engine(false, 0);
    this.banner(win.player ? 'YOU WIN!' : win.car.name + ' WINS', win.player ? '#ffd84a' : '#ff9a3a', 3, CART_OBJECTIVES[this.objective].name);
    Sound.play(win.player ? 'kartFinish' : 'powerdown', { vol: 0.8 }); Sound.play('crowd', { vol: 0.5 });
    this.fx.confetti(win.x, win.y + 3, win.z, 50);
  }

  /* ---------- AI ---------- */
  aiInput(k, dt, racing) {
    const inp = k.inp;
    if (k.frozen) { inp.gas = 0; inp.brake = 1; inp.steer = 0; inp.fire = false; inp.item = false; inp.drift = false; inp.driftPress = false; return; }
    if (!k.ai) k.ai = { skill: 0.9, bias: 0, avoid: 0, avoidT: 0, driftT: 0, itemT: 1, fireT: 1, stuckT: 0, revT: 0, wob: 0 };
    if (this.isRace && this.T) this.aiRace(k, dt, racing); else this.aiArena(k, dt, racing);
    // signature weapon: fire when a rival is where the weapon reaches
    inp.fire = false;
    if (racing && k.wpn.t <= 0 && !k.finished) { k.ai.fireT -= dt; if (k.ai.fireT <= 0 && this.aiWantsFire(k)) { inp.fire = true; k.ai.fireT = 0.4 + this.rng() * 1.2 * (1.1 - k.ai.skill); } }
    // pickups
    inp.item = false;
    if (k.item && racing) { k.ai.itemT -= dt; if (k.ai.itemT <= 0) { if (this.aiWantsItem(k)) { inp.item = true; k.ai.itemT = 1 + this.rng() * 2.5; } } }
  }
  aiWantsFire(k) {
    const D = k.wpn.def, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw);
    let best = 0;
    for (const o of this.karts) {
      if (o === k || o.out || o.invT > 0.3) continue;
      if (this.isRace && o.finished) continue;
      const dx = o.x - k.x, dz = o.z - k.z, d = Math.hypot(dx, dz); if (d > D.range * 0.95) continue;
      const ang = cartWrap(Math.atan2(dx, dz) - k.yaw), a = Math.abs(ang);
      let ok = false;
      switch (D.kind) {
        case 'ring': ok = d < D.range * (k.wpn.id === 'zap' ? 0.9 : 0.75); break;
        case 'cone': ok = a < (k.wpn.id === 'laser' ? 0.95 : 0.22); break;
        case 'shot': ok = a < 0.3; break;
        case 'drop': ok = a > 2.5 && d < D.range; break;
        case 'side': ok = a > 1.0 && a < 2.1 && d < D.range; break;
        case 'dash': ok = a < 0.2 && d < D.range; break;
        case 'target': ok = a < 0.9 || d < 25; break;
      }
      if (ok) best++;
    }
    return best > 0 || (k.wpn.id === 'slime' && this.isRace && k.rank > 1 && this.rng() < 0.01);
  }
  aiWantsItem(k) {
    const it = k.item, ai = k.ai, F = CART_ITEM_FX[it];
    if (F && F.aiWants) return F.aiWants(this, k);   // arena powers decide for themselves
    if (it === 'glow') return !this.T || Math.abs(this.T.K[this.T.idx(k.loc.s + 20)]) < 0.012 || ai.itemT < -4;
    if (it === 'water') return k.slowT > 0 || k.dazzleT > 0 || k.stunT > 0 || (this.objective === 'vibe' && k.vibes < 4) || ai.itemT < -2;
    if (it === 'shield') return ai.itemT < -1;
    if (it === 'tumble') { for (const o of this.karts) { if (o === k) continue; const dx = o.x - k.x, dz = o.z - k.z; if ((dx * Math.sin(k.yaw) + dz * Math.cos(k.yaw)) < 0 && Math.hypot(dx, dz) < 18) return true; } return ai.itemT < -6; }
    return true;   // potty: fire away (the items in 43_cart_da_items.js decide for themselves)
  }
  aiRace(k, dt, racing) {
    const T = this.T, inp = k.inp, sp = k.speed, ai = k.ai, skill = ai.skill;
    ai.wob += dt;
    ai.avoidT -= dt;
    if (ai.avoidT <= 0) {
      ai.avoidT = 0.12;
      let want = 0;
      const myD = T.at(k.loc.s + 12, CART_AT).o + ai.bias * 1.6;
      const test = (x, z, r) => { const L = T.locate(x, z, k.loc.i, CART_TMPL2); let ds = L.s - k.loc.s; if (ds < -T.L / 2) ds += T.L; if (ds > T.L / 2) ds -= T.L; if (ds < 3 || ds > 34) return; const gap = L.d - myD; if (Math.abs(gap) < r + 2.6) want += (gap > 0 ? -1 : 1) * (r + 3 - Math.abs(gap)) * (skill > 0.88 ? 1 : 0.7); };
      for (const m of this.props.mines) if (m.alive) test(m.gx, m.gz, 1.2);
      for (const p of this.props.potties) if (p.alive) test(p.gx, p.gz, 1.6);
      for (const t of this.props.tumbles) if (t.alive) test(t.gx, t.gz, 1.2);
      for (const h of this.hazards) if (h.type === 'slime') test(h.x, h.z, 2);
      const IO = this.ix && this.ix.obs; if (IO) for (let i = 0; i < IO.n; i++) test(IO.x[i], IO.z[i], IO.r[i]);   // ducks, fire, foam, frosting, devils
      if (!k.sunk) for (const o of this.karts) if (o !== k && o.speed < sp - 2) test(o.x, o.z, 1.6);   // a shark under the sand wants to pass right under them
      ai.avoidTarget = clamp(want, -7, 7);
    }
    ai.avoid = lerp(ai.avoid, ai.avoidTarget || 0, 1 - Math.exp(-4 * dt));
    const look = 7 + sp * 0.42, f = T.at(k.loc.s + look, CART_AT);
    let off = f.o + ai.bias * Math.max(0, f.hw - 3) * 0.3 + ai.avoid + Math.sin(ai.wob * 0.7) * (1.05 - skill) * 6;
    if (skill > 0.92) for (const b of this.E.boosts) { let ds = b.s - k.loc.s; if (ds < 0) ds += T.L; if (ds > 8 && ds < 45) { const L = T.locate(b.x, b.z, k.loc.i, CART_TMPL2); off = lerp(off, L.d, 0.6); break; } }
    // hunt: drift toward a rival just ahead when the weapon is ready (cone/shot/dash weapons)
    if ((k.wpn.t <= 0 && /cone|shot|dash/.test(k.wpn.def.kind)) || k.sunk) { for (const o of this.karts) { if (o === k || o.out || o.finished) continue; let ds = o.loc.s - k.loc.s; if (ds < -T.L / 2) ds += T.L; if (ds > 4 && ds < 30) { off = lerp(off, o.loc.d, k.sunk ? 0.95 : 0.5); break; } } }
    off = clamp(off, -f.hw + 1.8, f.hw - 1.8);
    const tx = f.x + f.nx * off, tz = f.z + f.nz * off;
    const ang = cartWrap(Math.atan2(tx - k.x, tz - k.z) - k.yaw);
    inp.steer = clamp(-ang * 2.8, -1, 1);
    const vt = k.vp[T.idx(k.loc.s + 6 + sp * 0.55)] * (0.97 + skill * 0.06);
    k.pace = 0.955 + 0.05 * clamp((skill - 0.85) / 0.15, 0, 1);
    inp.gas = sp > vt + 1 ? 0 : 1; inp.brake = sp > vt + 4 ? 0.6 : 0;
    if (racing && sp < 2 && k.spinT <= 0 && k.flipT <= 0 && k.bubbleT <= 0) { ai.stuckT += dt; if (ai.stuckT > 1.2) { ai.revT = 0.9; ai.stuckT = 0; } } else ai.stuckT = 0;
    if (ai.revT > 0) { ai.revT -= dt; inp.gas = 0; inp.brake = 1; inp.steer = -inp.steer; }
    inp.driftPress = false;
    if (!k.drift && !k.air && sp > 14 && ai.driftT <= 0) {
      let kk = 0; for (let s = 8; s <= 34; s += 4) kk += T.K[T.idx(k.loc.s + s)]; kk /= 7;
      if (Math.abs(kk) > 0.021 && this.rng() < skill * dt * 6) { inp.driftPress = true; inp.drift = true; inp.steer = Math.sign(kk); ai.driftT = 0.1; ai.driftDir = Math.sign(kk); ai.holdT = 0; }
    }
    if (k.drift || ai.driftT > 0 || (k.air && ai.driftDir)) {
      ai.holdT = (ai.holdT || 0) + dt;
      let kk = 0; for (let s = 4; s <= 16; s += 4) kk += T.K[T.idx(k.loc.s + s)]; kk /= 4;
      const turning = Math.sign(kk) === ai.driftDir && Math.abs(kk) > 0.008;
      inp.drift = (turning && ai.holdT < 3.2) || (k.charge > 0.8 && k.charge < 1.05) || ai.holdT < 0.35;
      if (!inp.drift) { ai.driftDir = 0; ai.driftT = 0.6; }
      if (k.air && ai.driftDir) inp.steer = ai.driftDir;
    } else { inp.drift = false; if (ai.driftT > 0) ai.driftT -= dt; }
  }
  // arenas: pick a goal from the objective, steer to it, avoid art and walls
  aiArena(k, dt, racing) {
    const inp = k.inp, ai = k.ai, E = this.E, O = this.obj;
    ai.tgtT -= dt;
    if (ai.tgtT <= 0 || !ai.goal) {
      ai.tgtT = 0.35 + this.rng() * 0.3;
      let g = null, prey = null;
      const nearestRival = () => { let b = null, bd = 1e9; for (const o of this.karts) { if (o === k || o.out) continue; const d = Math.hypot(o.x - k.x, o.z - k.z) * (o.player ? 0.85 : 1); if (d < bd) { bd = d; b = o; } } return b; };
      const custom = this.rules.aiGoal ? this.rules.aiGoal(this, k, nearestRival) : null;
      if (custom) { g = custom.goal || null; prey = custom.prey || null; }
      else if (this.objective === 'glow') { let bd = 1e9; for (const o of this.props.orbs) { if (!o.alive || (o.cool > 0 && o.from === k)) continue; const d = Math.hypot(o.gx - k.x, o.gz - k.z) + (this.rng() - 0.5) * 6; if (d < bd) { bd = d; g = [o.gx, o.gz]; } } if (bd > 40 || k.wpn.t <= 0) { const r = nearestRival(); if (r && Math.hypot(r.x - k.x, r.z - k.z) < 22) prey = r; } }
      else if (this.objective === 'hill') { const z = E.zones[O.zone]; const a = this.t * 0.5 + k.slot; g = [z.x + Math.sin(a) * z.r * 0.4, z.z + Math.cos(a) * z.r * 0.4]; if (Math.hypot(z.x - k.x, z.z - k.z) < z.r * 1.6) { const r = nearestRival(); if (r && r.inZone) prey = r; } }
      else if (this.objective === 'flag') { const F = O.flag; if (F.holder === k) { const c = E.captures[O.capture]; g = [c.x, c.z]; } else if (F.holder) { prey = F.holder; } else g = [F.x, F.z]; }
      else { prey = nearestRival(); }
      if (prey) { const lead = Math.min(1.2, Math.hypot(prey.x - k.x, prey.z - k.z) / 25); g = [prey.x + prey.vx * lead, prey.z + prey.vz * lead]; }
      if (!g) g = [Math.sin(k.slot + this.t * 0.2) * 30, Math.cos(k.slot + this.t * 0.2) * 30];
      ai.goal = g; ai.prey = prey;
    }
    let gx = ai.goal[0], gz = ai.goal[1];
    // steer around art pieces between us and the goal
    for (const a of E.art) {
      const dx = a.x - k.x, dz = a.z - k.z, d = Math.hypot(dx, dz); if (d > 26 || d < 0.1) continue;
      const tx = gx - k.x, tz = gz - k.z, tl = Math.hypot(tx, tz) || 1, along = (dx * tx + dz * tz) / tl;
      if (along < 0 || along > tl) continue;
      const side = (dx * tz - dz * tx) / tl;
      if (Math.abs(side) < a.r + 3.5) { const s = side > 0 ? -1 : 1; gx = k.x + (tx / tl) * along + (-tz / tl) * s * -(a.r + 5); gz = k.z + (tz / tl) * along + (tx / tl) * s * -(a.r + 5); }
    }
    // keep off the perimeter: goals near a wall are pulled inward, and so is a car heading into one
    if (E.walls) {
      const w = this.wallDist(gx, gz, this._wd || (this._wd = {})); if (w.d < 9) { gx += w.nx * (9 - w.d); gz += w.nz * (9 - w.d); }
      const c = this.wallDist(k.x, k.z, this._wd2 || (this._wd2 = {})); if (c.d < 7 && Math.sin(k.yaw) * c.nx + Math.cos(k.yaw) * c.nz < -0.3) { gx = k.x + c.nx * 20; gz = k.z + c.nz * 20; }
    }
    const ang = cartWrap(Math.atan2(gx - k.x, gz - k.z) - k.yaw), dist = Math.hypot(gx - k.x, gz - k.z);
    inp.steer = clamp(-ang * 2.4, -1, 1);
    const sharp = Math.abs(ang) > 1.3;
    inp.gas = sharp && k.speed > 8 ? 0 : 1; inp.brake = sharp && k.speed > 14 ? 0.5 : 0;
    if (dist < 4 && !ai.prey && this.objective !== 'hill') inp.gas = 0.5;
    inp.driftPress = false; inp.drift = false;
    if (Math.abs(ang) > 0.9 && k.speed > 13 && !k.air && this.rng() < dt * 3) { inp.driftPress = true; inp.drift = true; }
    if (k.drift) inp.drift = Math.abs(ang) > 0.35;
    if (racing && k.speed < 2 && k.spinT <= 0 && k.flipT <= 0 && k.bubbleT <= 0) { ai.stuckT += dt; if (ai.stuckT > 1.0) { ai.revT = 0.8; ai.stuckT = 0; } } else ai.stuckT = 0;
    if (ai.revT > 0) { ai.revT -= dt; inp.gas = 0; inp.brake = 1; inp.steer = -inp.steer; }
    k.pace = 0.93 + 0.08 * ai.skill;
  }

  /* ---------- per-car pose + emitters ---------- */
  poseKart(k, dt) {
    // pitch + roll from the ground under the car; nose follows the arc in the air; flips and spins on top
    const e = 1.4, f = 1.0, fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), lx = Math.cos(k.yaw), lz = -Math.sin(k.yaw), H = this.terrain;
    let tp = 0, tr = 0;
    if (!k.air) { const hf = H.height(k.x + fx * e, k.z + fz * e), hb = H.height(k.x - fx * e, k.z - fz * e), hl = H.height(k.x + lx * f, k.z + lz * f), hr = H.height(k.x - lx * f, k.z - lz * f); tp = -Math.atan2(hf - hb, 2 * e); tr = Math.atan2(hl - hr, 2 * f); }
    else tp = -Math.atan2(k.vy, Math.max(6, Math.abs(k.fwd || 0))) * 0.45;
    k.basePitch = BurnsM.damp(k.basePitch || 0, tp, k.air ? 4 : 14, dt);
    k.baseRoll = BurnsM.damp(k.baseRoll || 0, tr + (k.air ? 0 : clamp(-(k.lat || 0) * 0.012, -0.06, 0.06)), 10, dt);
    k.pitch = k.basePitch - (k.flipT > 0 ? k.flipA : 0);
    k.roll = k.baseRoll + (k.drift ? -k.drift * 0.08 : 0);
    k.bob = (k.landT > 0 ? -Math.sin(k.landT / 0.18 * Math.PI) * 0.12 : 0) + (k.off && !k.air ? Math.sin(this.t * 31 + k.slot) * 0.025 * Math.min(1, k.speed / 10) : 0);
    k.wheelA = (k.wheelA + (k.fwd || 0) / (k.M ? k.M.wheelR : 0.48) * dt) % TAU;
    k.steerVis = BurnsM.damp(k.steerVis, k.steer, 10, dt);
    k.visYaw = k.yaw + (k.spinT > 0 ? k.spinA : 0);
  }
  kartFx(k, dt) {
    const near = (k.x - this.cam.x) * (k.x - this.cam.x) + (k.z - this.cam.z) * (k.z - this.cam.z) < 140 * 140;
    if (!near || !this.fx) return;
    const fx = Math.sin(k.yaw), fz = Math.cos(k.yaw), rx = -fz, rz = fx, sp = k.speed, M = k.M;
    const back = M ? M.len * 0.42 : 2.2, side = M ? M.w * 0.38 : 1;
    k.dustT -= dt;
    const surf = this.terrain.kindAt(k.x, k.z);
    const dusty = !k.air && sp > 5 && (k.off || k.drift || sp > 17 || this.isBattle) && !(surf && surf.kind === 'concrete');
    if (dusty && k.dustT <= 0) {
      k.dustT = k.off ? 0.035 : k.drift ? 0.045 : 0.075;
      const c = this.E.tod === 'night' ? [0.55, 0.48, 0.5] : surf && surf.kind === 'dirt' ? [0.7, 0.5, 0.36] : [0.92, 0.82, 0.68];
      for (const s of [-1, 1]) this.fx.add(k.x - fx * back + rx * s * side, k.y + 0.3, k.z - fz * back + rz * s * side, -fx * 2.5 + (Math.random() - 0.5) * 2 + rx * s, 0.6 + Math.random() * 0.9, -fz * 2.5 + (Math.random() - 0.5) * 2 + rz * s, k.off ? 1.3 : 0.9, 0.7, k.off ? 3.0 : 2.0, c, k.off ? 0.55 : 0.4, 'puff', 4, Math.random() * 6, (Math.random() - 0.5));
    }
    if (k.drift && !k.air) { k.sparkT -= dt; if (k.sparkT <= 0) { k.sparkT = 0.025; const tier = k.charge >= 2.1 ? 2 : k.charge >= 1.0 ? 1 : 0, c = tier === 2 ? [1, 0.3, 0.85] : tier === 1 ? [1, 0.85, 0.25] : [1, 1, 1]; for (const s of [-1, 1]) { if (tier === 0 && Math.random() < 0.6) continue; this.fx.add(k.x - fx * back + rx * s * side, k.y + 0.15, k.z - fz * back + rz * s * side, -fx * 3 + (Math.random() - 0.5) * 4 + rx * s * 2, 1.5 + Math.random() * 3, -fz * 3 + (Math.random() - 0.5) * 4 + rz * s * 2, 0.25 + Math.random() * 0.15, tier ? 0.22 : 0.14, 0.04, c, 1, 'spark', 1 | 2); } } }
    if ((k.boostT > 0 || k.dashT > 0) && Math.random() < dt * 45) { const c = k.boostKind === 'mt2' ? [1, 0.35, 0.9] : k.boostKind === 'glow' ? [0.3, 1, 0.85] : k.boostKind === 'slime' ? [0.5, 1, 0.3] : [1, 0.75, 0.3]; for (const s of [-1, 1]) this.fx.add(k.x - fx * back + rx * s * side * 0.6, k.y + 0.6, k.z - fz * back + rz * s * side * 0.6, k.vx * 0.7 - fx * 4, 0.3, k.vz * 0.7 - fz * 4, 0.2, 0.5, 0.12, c, 0.9, 'flame', 1); }
    if (k.shieldT > 0 && Math.random() < dt * 20) this.fx.glint(k.x + (Math.random() - 0.5) * 3, k.y + 1 + Math.random() * 2.5, k.z + (Math.random() - 0.5) * 3, '#ff9af0');
    if (k.stunT > 0 && Math.random() < dt * 30) this.fx.spark(k.x + (Math.random() - 0.5) * 2, k.y + 1.5 + Math.random() * 1.5, k.z + (Math.random() - 0.5) * 2, 2, '#5af2ff', 4);
    if (k.dazzleT > 0 && Math.random() < dt * 8) this.fx.glint(k.x + (Math.random() - 0.5) * 3, k.y + 2 + Math.random() * 2, k.z + (Math.random() - 0.5) * 3, '#ffffff');
    if (k.foamT > 0 && Math.random() < dt * 20) this.fx.add(k.x + (Math.random() - 0.5) * 3, k.y + 0.6, k.z + (Math.random() - 0.5) * 3, 0, 0.6, 0, 1.0, 0.8, 1.8, [1, 1, 1], 0.6, 'puff', 4);
    if (k.out && Math.random() < dt * 4) this.fx.add(k.x, k.y + 2, k.z, 0, 1.4, 0, 2, 0.8, 2.6, [0.3, 0.3, 0.34], 0.4, 'smoke', 4);
    // every car has a personality: the octopus puffs smoke, the dragon snorts sparks, the snail drips slime, the jelly crackles
    const id = k.car.id;
    if (id === 'octo' && Math.random() < dt * 3) { const c = k.M.extra.chimney || [0, 4.7, -0.15], p = cartCarPoint(k, c[0], c[1], c[2], [0, 0, 0]); this.fx.add(p[0], p[1], p[2], 0, 1.6, 0, 1.6, 0.4, 1.6, [0.4, 0.38, 0.4], 0.35, 'smoke', 4); }
    if (id === 'dragon' && Math.random() < dt * 4) { const p = this.muzzle(k, [0, 0, 0]); this.fx.add(p[0], p[1], p[2], fx * 3, 0.5, fz * 3, 0.3, 0.4, 0.1, [1, 0.6, 0.2], 1, 'spark', 1); }
    if (id === 'jelly' && Math.random() < dt * 4) this.fx.spark(k.x + (Math.random() - 0.5) * 2.5, k.y + 2.3, k.z + (Math.random() - 0.5) * 2.5, 1, '#5af2ff', 3);
    if (id === 'heart' && Math.random() < dt * 1.2) this.fx.hearts(k.x, k.y + 4.2, k.z, 1);
    if (id === 'whale' && Math.random() < dt * 1.5) { const p = cartCarPoint(k, 0, 3.0, 1.0, [0, 0, 0]); for (let i = 0; i < 3; i++) this.fx.add(p[0], p[1], p[2], (Math.random() - 0.5) * 1.5, 4 + Math.random() * 2, (Math.random() - 0.5) * 1.5, 0.8, 0.3, 0.12, [0.7, 0.9, 1], 0.9, 'drop', 2); }
    // the weapon's own look while it fires
    const w = k.wpn;
    if (w.fireT > 0) {
      if (w.id === 'torch' && w.fireT > 0.2) for (let i = 0; i < 8; i++) { if (Math.random() > 0.55) continue; const a = (i + 0.5) / 8 * TAU, ca = Math.sin(a + k.yaw), sa = Math.cos(a + k.yaw), p0 = cartCarPoint(k, Math.sin(a) * 2.6, 0.6, (k.M.extra.armZ || 0) + Math.cos(a) * 2.6, [0, 0, 0]); this.fx.add(p0[0], p0[1], p0[2], ca * 14 + k.vx * 0.8, 1 + Math.random() * 2, sa * 14 + k.vz * 0.8, 0.45, 1.2, 0.3, [1, 0.55 + Math.random() * 0.3, 0.15], 1, 'flame', 1); }
      if (w.id === 'slime' && Math.random() < dt * 30) { const p = cartCarPoint(k, (Math.random() - 0.5) * 1.5, 0.3, -k.M.len / 2, [0, 0, 0]); this.fx.add(p[0], p[1], p[2], 0, 0.5, 0, 0.6, 0.5, 0.2, [0.45, 1, 0.3], 1, 'drop', 1 | 2); }
    }
    if (id === 'snail' && k.slimeT > 0 && Math.random() < dt * 40) for (const r of k.M.extra.rockets || []) { const p = cartCarPoint(k, r[0], r[1], r[2], [0, 0, 0]); this.fx.add(p[0], p[1], p[2], -fx * 8, 0.2, -fz * 8, 0.3, 0.9, 0.2, [1, 0.5, 0.2], 1, 'flame', 1); }
  }
  landFx(k) { const c = this.E.tod === 'night' ? '#8a7a7a' : '#d8b896'; this.fx.dust(k.x, k.y + 0.2, k.z, 10, c); }
  sparkBurst(x, y, z, n, col) { this.fx.spark(x, y, z, n, col, 7); }
  updateStorm(dt) {
    const S = this.storm; S.t -= dt;
    if (S.t <= 0) {
      if (S.phase === 'calm') { S.phase = 'rise'; S.t = 3; this.windA = this.rng() * TAU; if (this.state === 'race') this.banner('DUST STORM!', '#ffe0a8', 2.0); Sound.play('dust', { vol: 0.8 }); }
      else if (S.phase === 'rise') { S.phase = 'peak'; S.t = 6; }
      else if (S.phase === 'peak') { S.phase = 'fall'; S.t = 3; }
      else { S.phase = 'calm'; S.t = 16 + this.rng() * 8; }
    }
    this.stormK = S.phase === 'rise' ? 1 - S.t / 3 : S.phase === 'peak' ? 1 : S.phase === 'fall' ? S.t / 3 : 0;
  }

  /* ---------- results ---------- */
  finishRace() {
    if (this.state === 'results') return;
    const me = this.player;
    if (this.isBattle) {
      const order = this.finalOrder || this.battleRank();
      const D = CART_OBJECTIVES[this.objective];
      this.results = order.map((k, i) => ({ id: k.id, name: k.name, car: k.car.name, player: k.player, score: D.fx && D.fx.score ? D.fx.score(k) : this.objective === 'vibe' ? k.vibes : this.objective === 'hill' ? Math.floor(k.score) : k.score, hits: k.hitsDealt, out: k.out, rank: i + 1 }));
      const sv = cartSave(), key = this.arenaId + ':' + this.objective;
      if (order[0] === me) sv.wins[key] = (sv.wins[key] || 0) + 1;
      // winning every objective of an arena unlocks its powers as gift-box drops in the circuit races
      if (order[0] === me && !sv.mastered[this.arenaId] && cartArenaMastered(this.arenaId)) { sv.mastered[this.arenaId] = true; this.mastered = true; this.log('mastered', { arena: this.arenaId }); }
      Save.save();
    } else {
      const T = this.T, avg = k => Math.max(8, k.vmax * 0.8);
      for (const k of this.karts) if (!k.finished) { k.finished = true; k.finishT = this.raceT + Math.max(0.5, (this.laps * T.L - k.prog) / avg(k)); k.estimated = true; }
      const order = this.karts.slice().sort((a, b) => a.finishT - b.finishT);
      order.forEach((k, i) => k.rank = i + 1);
      const ptsOf = r => this.mode === 'gp' ? CART_POINTS[r - 1] || 0 : 0;
      this.results = order.map(k => ({ id: k.id, name: k.name, car: k.car.name, t: k.finishT, best: k.lapTimes.length ? Math.min(...k.lapTimes) : 0, player: k.player, pts: ptsOf(k.rank), est: !!k.estimated, rank: k.rank }));
      const sv = cartSave(), best = sv.best[this.trackId] || {}, myBestLap = me.lapTimes.length ? Math.min(...me.lapTimes) : 0;
      this.newRecord = { lap: false, total: false };
      if (myBestLap && (!best.lap || myBestLap < best.lap)) { best.lap = +myBestLap.toFixed(3); this.newRecord.lap = true; }
      if (!me.estimated && (!best.total || me.finishT < best.total)) { best.total = +me.finishT.toFixed(3); this.newRecord.total = true; }
      sv.best[this.trackId] = best;
      if (this.mode === 'gp') { for (const r of this.results) this.gp.points[r.id] = (this.gp.points[r.id] || 0) + r.pts; this.gp.lastPos = me.rank; this.gp.results.push(this.results.map(r => r.id)); }
      Save.save();
    }
    this.log('results', { rank: me.rank });
    this.state = 'results'; this.stateT = 0; Input.setMode('ui'); this.layoutControls();
    if (Sound.engine) Sound.engine(false, 0);
    Sound.music('kart_results');
    this.buildButtons();
  }
  standings() {
    const ids = this.karts.map(k => k.id);
    return ids.map(id => { const k = this.karts.find(q => q.id === id); return { id, name: k.name, car: k.car.name, pts: this.gp.points[id] || 0, player: k.player }; }).sort((a, b) => b.pts - a.pts || (a.player ? -1 : 1));
  }
  nextRace() { Sound.play('select'); this.release(); Game.setScene(new CartRaceScene({ mode: 'gp', cup: this.cup.id, race: this.raceIdx + 1, driver: this.driverId, car: this.carId, autoGas: this.autoGas, gp: this.gp })); }
  awardTrophy() {
    const st = this.standings(), pos = st.findIndex(s => s.player) + 1;
    this.trophyPos = pos;
    const sv = cartSave(), prev = sv.trophies[this.cup.id] || 0;
    if (pos <= 3 && (!prev || pos < prev)) sv.trophies[this.cup.id] = pos;
    Save.save();
    this.state = 'trophy'; this.stateT = 0;
    Sound.music(pos <= 3 ? 'kart_results' : 'kart_menu'); if (pos <= 3) Sound.play('kartFinish');
    this.buildButtons();
  }
  release() {
    if (Sound.engine) Sound.engine(false, 0); if (this.paused) { this.paused = false; Sound.resume(); } Input.hud = null;
    // free this course's GPU buffers (car and driver models stay cached for the next race)
    const W = this.W; if (!W || !BurnsGL.gl || this.released) return; this.released = true;
    try {
      for (const c of W.chunks) BurnsGL.freeGeo(c); for (const g of W.ground.geos) BurnsGL.freeGeo(g); if (W.inst) W.inst.release();
      BurnsGL.freeTex(W.ground.paintT); BurnsGL.freeTex(W.lightmap.T);
      for (const G of this.E.crowds) { BurnsGL.freeGeo(G.geo); if (G.far) BurnsGL.freeGeo(G.far.geo); } for (const G of (this.props && this.props.groups) || []) BurnsGL.freeGeo(G.geo);
    } catch (e) { /* ignore */ }
  }
  leave() { this.release(); Game.setScene(new KartMenuScene()); }
  restart() { this.release(); Game.setScene(new CartRaceScene(Object.assign({}, this.opts, { gp: this.mode === 'gp' ? JSON.parse(this.gpSnap) : undefined }))); }
  openPause() { this.paused = true; Sound.play('pause'); if (Sound.engine) Sound.engine(false, 0); Input.setMode('ui'); this.layoutControls(); this.buildPause(); }
  closePause() { this.paused = false; Sound.resume(); Input.setMode(this.state === 'race' || this.state === 'count' ? 'game' : 'ui'); this.layoutControls(); Sound.play('select'); }
}
