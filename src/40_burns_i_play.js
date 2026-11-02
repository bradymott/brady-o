/* ============================================================
   BRADY-O BURNS — play scene: environment, missions, dialogue,
   cutscenes, camera and the main loop (BurnsPlayScene).
   ============================================================ */

/* ---------------- environment palettes (sky, fog, light) ----------------
   A palette is plain data; worlds give one or two (dusk -> night) and the
   scene interpolates with game.tod (0..1). Colours are hex, angles degrees. */
const BURNS_PALETTES = {
  dusk: { zen: '#2a1d4a', hor: '#ff8a5a', fog: '#c98a72', fogD: 0.0105, fogH: 0.05, haze: 0.55, fogMax: 0.92, sun: [205, 4], sunCol: '#ffb070', sunSize: 0.0016, moon: [30, 22], moonK: 0.4, stars: 0.18, mtnCol: '#5a3a52', mtnH: 3.2, city: [0, 0], cityCol: '#ff6ab0', cityK: 0.25, sky: '#8a7aa8', gnd: '#6a4a40', key: '#ffb080', keyK: 0.85, emB: 1.3, rim: '#ffb090', clouds: 0.5, cloudCol: '#e89a8a', mid: '#b0607a', midK: 0.35 },
  night: { zen: '#060818', hor: '#2a1838', fog: '#2a1e34', fogD: 0.012, fogH: 0.06, haze: 0.5, fogMax: 0.95, sun: [205, -20], sunCol: '#000000', sunSize: 0.0001, moon: [40, 34], moonK: 1, stars: 1, mtnCol: '#140e22', mtnH: 3.0, city: [0, 0], cityCol: '#ff4fd8', cityK: 0.55, sky: '#4a4a80', gnd: '#382a40', key: '#8a9ad8', keyK: 0.45, emB: 1.55, rim: '#9a7aff', clouds: 0.3, cloudCol: '#2a2442', mid: '#1a1436', midK: 0.3 },
  day: { zen: '#3a7ad8', hor: '#f4d8b0', fog: '#e8d0b0', fogD: 0.006, fogH: 0.04, haze: 0.6, fogMax: 0.85, sun: [140, 55], sunCol: '#fff4d8', sunSize: 0.0022, moon: [30, -10], moonK: 0, stars: 0, mtnCol: '#8a7a8a', mtnH: 3.0, city: [0, 0], cityCol: '#000000', cityK: 0, sky: '#c8d8f0', gnd: '#c8a888', key: '#fff0d8', keyK: 0.9, emB: 1.15, rim: '#ffffff', clouds: 0.55, cloudCol: '#fff8f0', mid: '#7ab0e8', midK: 0.35 },
  dawn: { zen: '#3a4a8a', hor: '#ffb0a0', fog: '#e8b0a8', fogD: 0.008, fogH: 0.05, haze: 0.6, fogMax: 0.9, sun: [80, 3], sunCol: '#ffc890', sunSize: 0.002, moon: [250, 20], moonK: 0.3, stars: 0.12, mtnCol: '#6a4a6a', mtnH: 3.1, city: [0, 0], cityCol: '#ff70c0', cityK: 0.15, sky: '#b0a0c8', gnd: '#a07a70', key: '#ffc0a0', keyK: 0.8, emB: 1.3, rim: '#ffc0d0', clouds: 0.45, cloudCol: '#f0b8b8', mid: '#a080b0', midK: 0.3 }
};
const BurnsEnv = {
  dir(az, el) { const a = az * Math.PI / 180, e = el * Math.PI / 180; return [Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)]; },
  resolve(p) {
    if (typeof p === 'string') p = BURNS_PALETTES[p] || BURNS_PALETTES.dusk;
    const r = Object.assign({ cloudScale: 0.55, cloudSpeed: 0.012 }, BURNS_PALETTES.dusk, p);
    // a custom palette that doesn't mention clouds / mid band gets ones matched to its own horizon
    if (!p.cloudCol) { const h = burnsRGBf(r.hor); r.cloudCol = [h[0] * 0.55 + 0.42, h[1] * 0.55 + 0.4, h[2] * 0.55 + 0.4]; }
    if (!p.mid) { r.mid = r.hor; r.midK = 0; }
    return r;
  },
  // build renderer env from palette(s) a,b mixed by t; out reused
  build(a, b, t, out, time) {
    const A = this.resolve(a), B = b ? this.resolve(b) : A;
    const rgb = v => typeof v === 'string' ? burnsRGBf(v) : v;
    const c = k => { const x = rgb(A[k]), y = rgb(B[k]); return [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]; };
    const n = k => lerp(A[k], B[k], t);
    const d = k => this.dir(lerp(A[k][0], B[k][0], t), lerp(A[k][1], B[k][1], t));
    out = out || {};
    out.zen = c('zen'); out.hor = c('hor'); out.fogCol = c('fog'); out.fogD = n('fogD'); out.fogH = n('fogH'); out.haze = n('haze'); out.fogMax = n('fogMax'); out.fogE = 0.6;
    out.sunDir = d('sun'); out.sunCol = c('sunCol'); out.sunSize = n('sunSize');
    out.moonDir = d('moon'); out.moon = n('moonK'); out.stars = n('stars');
    out.mtnCol = c('mtnCol'); out.mtnH = n('mtnH') * Math.PI / 180;
    const cd = d('city'); out.cityDir = [cd[0], 0, cd[2]]; const l = Math.hypot(out.cityDir[0], out.cityDir[2]) || 1; out.cityDir[0] /= l; out.cityDir[2] /= l;
    const cc = c('cityCol'), ck = n('cityK'); out.cityCol = [cc[0] * ck, cc[1] * ck, cc[2] * ck];
    out.sky = c('sky'); out.gnd = c('gnd');
    const kc = c('key'), kk = n('keyK'); out.keyCol = [kc[0] * kk, kc[1] * kk, kc[2] * kk];
    // key light comes from the sun when it's up, otherwise the moon
    const sd = out.sunDir, md = out.moonDir;
    out.keyDir = sd[1] > 0.02 ? sd.slice() : md.slice();
    out.emB = n('emB'); out.rimCol = c('rim');
    out.clouds = n('clouds'); out.cloudCol = c('cloudCol'); out.mid = c('mid'); out.midK = n('midK');
    out.cloudScale = n('cloudScale'); out.cloudSpeed = n('cloudSpeed');
    out.time = time || 0; out.trip = 0;
    return out;
  }
};

/* ---------------- missions ----------------
   def: { id, name, desc, type, token (default true), giver, start: 'talk'|'auto'|'trigger'|'manual',
          requires: [ids], target: {x,z,r,y}, count, time, item, marker:{x,z}, hint, tokenAt:{x,y,z},
          onStart, onUpdate, onEvent, onComplete, onFail }   (all hooks receive (game, m, ...)) */
class BurnsMissions {
  constructor(g, defs) {
    this.g = g; this.list = [];
    for (const d of defs || []) {
      const done = d.token !== false ? BurnsSave.hasToken(g.worldId, d.id) : BurnsSave.get().missions[g.worldId + ':' + d.id] === 'done';
      this.list.push({ def: d, id: d.id, state: done ? 'done' : 'locked', n: 0, t: 0, data: {}, tokenOut: false });
    }
  }
  get(id) { return this.list.find(m => m.id === id); }
  state(id) { const m = this.get(id); return m ? m.state : null; }
  isDone(id) { return this.state(id) === 'done'; }
  active() { return this.list.filter(m => m.state === 'active'); }
  // unlock missions whose requirements are met
  refresh() {
    for (const m of this.list) {
      if (m.state !== 'locked') continue;
      const req = m.def.requires || [];
      if (req.every(r => this.isDone(r))) m.state = 'available';
    }
    for (const m of this.list) if (m.state === 'available' && m.def.start === 'auto') this.start(m.id);
  }
  start(id, quiet) {
    const m = this.get(id); if (!m || m.state === 'done' || m.state === 'active') return false;
    if (m.state === 'locked') return false;
    m.state = 'active'; m.n = 0; m.t = 0; m.data = {};
    if (m.def.time) m.left = m.def.time;
    if (!quiet && !m.def.silent) { this.g.banner('MISSION', m.def.name, { col: '#38f2ff' }); burnsSfx('select2', null, 'select'); }
    if (m.def.onStart) m.def.onStart(this.g, m);
    return true;
  }
  progress(id, add, total) {
    const m = this.get(id); if (!m || m.state !== 'active') return;
    m.n += add === undefined ? 1 : add;
    const need = total || m.def.count || 1;
    if (m.n >= need) this.complete(id);
    else this.g.toast(`${m.def.progressLabel || m.def.name}: ${m.n}/${need}`);
  }
  complete(id, at) {
    const m = this.get(id); if (!m || m.state === 'done') return;
    if (m.state === 'locked' || m.state === 'available') m.state = 'active';
    m.state = 'done';
    const g = this.g;
    if (m.def.onComplete) m.def.onComplete(g, m);
    if (m.def.token !== false) {
      if (m.def.tokenDirect) g.awardToken(m.id);
      else {
        const p = at || m.def.tokenAt || { x: g.player.x + Math.sin(g.player.yaw) * 2.5, y: g.player.y + 1.2, z: g.player.z + Math.cos(g.player.yaw) * 2.5 };
        g.spawnPickup('token', p.x, p.y, p.z, { mission: m.id, label: 'BURN TOKEN' });
        g.banner('MISSION COMPLETE', m.def.name + ' — grab your Burn Token!', { col: '#ffd84a' });
        burnsSfx('clear', { vol: 0.6 });
      }
    } else {
      BurnsSave.get().missions[g.worldId + ':' + m.id] = 'done'; BurnsSave.save();
      if (!m.def.silent) g.banner('DONE!', m.def.name, { col: '#7aff5a', small: true });
    }
    this.refresh();
  }
  fail(id, why) {
    const m = this.get(id); if (!m || m.state !== 'active') return;
    m.state = 'available';
    if (m.def.onFail) m.def.onFail(this.g, m);
    this.g.banner('MISSION FAILED', why || m.def.name, { col: '#ff4a4a', small: true });
    burnsSfx('powerdown', { vol: 0.6 });
  }
  // generic events: 'pickup', 'defeat', 'talk', 'spotted', 'pound', 'mount', 'bell', 'spring', 'flames', custom...
  event(name, data) {
    for (const m of this.list) {
      if (m.state !== 'active') continue;
      const d = m.def;
      if (d.onEvent && d.onEvent(this.g, m, name, data) === true) continue;
      if (name === 'pickup' && (d.type === 'collect' || d.type === 'find') && data.mission === m.id) { if (d.type === 'find') this.complete(m.id); else this.progress(m.id); }
      if (name === 'defeat' && d.type === 'defeat' && (!d.tag || (data.def && data.def.tag === d.tag))) this.progress(m.id);
      if (name === 'talk' && d.type === 'talk' && data.id === d.target) this.complete(m.id);
      if (name === 'spotted' && d.type === 'stealth') this.fail(m.id, 'You were spotted!');
    }
  }
  update(dt) {
    const g = this.g, p = g.player;
    for (const m of this.list) {
      if (m.state !== 'active') continue;
      const d = m.def; m.t += dt;
      if (m.left !== undefined) { m.left -= dt; if (m.left <= 0) { this.fail(m.id, 'Out of time!'); continue; } }
      const T = d.target;
      if (T && (d.type === 'reach' || d.type === 'race' || d.type === 'stealth' || d.type === 'ride' || d.type === 'climb')) {
        const inside = Math.hypot(p.x - T.x, p.z - T.z) < (T.r || 3) && (T.y === undefined || p.y >= T.y - 0.2);
        const ok = d.type !== 'ride' || (p.vehicle && (!d.vehicle || p.vehicle.kind === d.vehicle));
        if (inside && ok) this.complete(m.id);
      }
      if (d.type === 'escort' && d.companion) {
        const a = g.actor(d.companion);
        if (a && T && Math.hypot(a.x - T.x, a.z - T.z) < (T.r || 3)) this.complete(m.id);
      }
      if (d.onUpdate) d.onUpdate(g, m, dt);
    }
  }
  // the next thing to do (for the HUD tracker)
  tracker() {
    const a = this.active();
    if (!a.length) return null;
    const m = a[a.length - 1], d = m.def;
    let txt = d.short || d.name;
    if (d.count && d.type !== 'find') txt += ` ${m.n}/${d.count}`;
    if (m.left !== undefined) txt += `  ⏱ ${Math.ceil(m.left)}s`;
    return { text: txt, m };
  }
}

/* ---------------- dialogue (bottom box + portrait, tap to advance) ---------------- */
class BurnsDialog {
  constructor(g) { this.g = g; this.open = false; this.queue = []; this.cur = null; this.chars = 0; this.done = null; }
  // lines: [ 'text' | {who, text} ...]; who: actor | 'brady' | 'man' | {name, model}
  say(who, lines, done, opts) {
    if (typeof lines === 'string') lines = [lines];
    const items = lines.map(l => typeof l === 'string' ? { who, text: l } : Object.assign({ who }, l));
    this.queue.push(...items);
    if (done) { const prev = this.done; this.done = prev ? () => { prev(); done(); } : done; }
    if (!this.open) this.next();
    this.opts = opts || {};
  }
  next() {
    this.cur = this.queue.shift() || null;
    this.chars = 0; this.t = 0;
    if (!this.cur) {
      this.open = false; Input.setMode('game');
      const d = this.done; this.done = null; if (d) d();
      return;
    }
    if (!this.open) { this.open = true; Input.setMode('ui'); }
    const who = this.cur.who;
    this.cur.name = typeof who === 'string' ? (who === 'brady' ? 'BRADY' : who === 'man' ? 'THE MAN' : who.toUpperCase()) : who && (who.name || (who.def && who.def.name) || (who.type ? this.g.typeName(who.type) : ''));
    if (who && who.say && who !== this.g.player) who.say && (who.bubbleText = null);
    burnsSfx('dialogue_blip', { vol: 0.4 });
  }
  update(dt) {
    if (!this.open) return;
    this.t += dt;
    const speed = (this.g.player.power === 'powder' && this.g.player.powerT > 0 && this.cur && this.cur.who === 'brady') ? 140 : 55;
    const len = this.cur ? this.cur.text.length : 0;
    const before = Math.floor(this.chars);
    this.chars = Math.min(len, this.chars + dt * speed);
    if (Math.floor(this.chars) !== before && Math.floor(this.chars) % 4 === 0) burnsSfx('dialogue_blip', { vol: 0.15, pitch: 0.9 + Math.random() * 0.3 });
    const adv = Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed || Input.actionPressed;
    if (adv && this.t > 0.15) {
      if (this.chars < len) this.chars = len;
      else this.next();
    }
  }
}

/* ---------------- cutscenes ----------------
   steps (run in order): { cam: {x,y,z, tx,ty,tz, fov} | { from, to, dur, ease } }, { wait: s },
   { say: [who, lines] }, { do: fn(g) }, { until: fn(g) }, { banner: [title, sub, opts] },
   { letterbox: bool }, { fade: 'out'|'in', dur }, { music: name }, { sfx: name },
   { move: { actor, x, z, speed, anim } }, { parallel: [steps...] } */
class BurnsCine {
  constructor(g, steps, done, opts) {
    this.g = g; this.steps = steps.slice(); this.done = done; this.opts = opts || {}; this.i = -1; this.t = 0; this.cur = null; this.cam = null; this.letter = this.opts.letterbox !== false; this.finished = false;
    this.advance();
  }
  advance() {
    this.i++; this.t = 0;
    this.cur = this.steps[this.i] || null;
    if (!this.cur) { this.finish(); return; }
    const s = this.cur, g = this.g;
    if (s.do) { s.do(g, this); if (!this.finished) this.advance(); return; }
    if (s.letterbox !== undefined) { this.letter = s.letterbox; this.advance(); return; }
    if (s.music) { burnsMusic(s.music); this.advance(); return; }
    if (s.sfx) { burnsSfx(s.sfx); this.advance(); return; }
    if (s.banner) { g.banner(...s.banner); this.advance(); return; }
    if (s.say) { this.waiting = true; g.dialog.say(s.say[0], s.say[1], () => { this.waiting = false; }); return; }
    if (s.cam && !s.cam.dur) { this.cam = Object.assign({}, s.cam); this.advance(); return; }
    if (s.cam) { this.camFrom = this.cam ? Object.assign({}, this.cam) : Object.assign({}, g.camState()); }
    if (s.fade) { g.fadeTo(s.fade === 'out' ? 1 : 0, s.dur || 0.6); }
  }
  update(dt) {
    if (this.finished) return;
    const s = this.cur; if (!s) return;
    this.t += dt;
    const g = this.g;
    if (s.say) { if (!this.waiting) this.advance(); return; }
    if (s.wait !== undefined) { if (this.t >= s.wait) this.advance(); return; }
    if (s.until) { if (s.until(g, this)) this.advance(); return; }
    if (s.fade) { if (this.t >= (s.dur || 0.6)) this.advance(); return; }
    if (s.move) {
      const a = typeof s.move.actor === 'string' ? g.actor(s.move.actor) : s.move.actor;
      if (!a) { this.advance(); return; }
      const d = a.moveTo(s.move.x, s.move.z, s.move.speed || 3, dt, 0.4); a.ch.play(s.move.anim || 'walk'); a.physics(dt);
      if (d < 0.5 || this.t > (s.move.max || 8)) this.advance();
      return;
    }
    if (s.cam && s.cam.dur) {
      const u = clamp(this.t / s.cam.dur, 0, 1), e = s.cam.ease === 'linear' ? u : easeInOut(u), A = s.cam.from || this.camFrom, B = s.cam.to || s.cam;
      this.cam = { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e), z: lerp(A.z, B.z, e), tx: lerp(A.tx, B.tx, e), ty: lerp(A.ty, B.ty, e), tz: lerp(A.tz, B.tz, e), fov: lerp(A.fov || 0.9, B.fov || 0.9, e) };
      if (u >= 1 && !s.cam.hold) this.advance();
      else if (u >= 1 && this.t > s.cam.dur + s.cam.hold) this.advance();
      return;
    }
    if (s.parallel) { if (!this.par) this.par = s.parallel.map(p => new BurnsCine(g, [p], null, { letterbox: this.letter })); this.par.forEach(c => c.update(dt)); if (this.par.every(c => c.finished)) { this.par = null; this.advance(); } return; }
    this.advance();
  }
  skip() {
    // run remaining "do" steps so the story state stays consistent
    const rest = this.steps.slice(this.i + 1);
    if (this.cur && this.cur.say) { this.g.dialog.queue.length = 0; this.g.dialog.done = null; this.g.dialog.open = false; Input.setMode('game'); }
    for (const s of rest) { if (s.do && !s.noSkip) s.do(this.g, this); if (s.music) burnsMusic(s.music); }
    this.g.fadeTo(0, 0.3);
    this.finish();
  }
  finish() { if (this.finished) return; this.finished = true; const d = this.done; this.done = null; if (d) d(this.g); }
}

/* ---------------- the play scene ---------------- */
let burnsHooked = false;
const BurnsKeys = { down: {}, pressed: {} };
function burnsHookOnce() {
  if (burnsHooked) return; burnsHooked = true;
  const map = { KeyQ: 'camL', KeyE: 'camR', KeyC: 'recenter', KeyR: 'recenter', KeyB: 'bike', KeyM: 'missions', Tab: 'missions', KeyF: 'camR', KeyI: 'camU', KeyK2: 'camD' };
  window.addEventListener('keydown', e => { const a = map[e.code]; if (!a || !(Game.scene instanceof BurnsPlayScene)) return; if (e.cancelable) e.preventDefault(); if (!BurnsKeys.down[a]) BurnsKeys.pressed[a] = true; BurnsKeys.down[a] = true; });
  window.addEventListener('keyup', e => { const a = map[e.code]; if (a) BurnsKeys.down[a] = false; });
  window.addEventListener('blur', () => { BurnsKeys.down = {}; });
  document.addEventListener('visibilitychange', () => {
    const s = Game.scene;
    if (!(s instanceof BurnsPlayScene)) return;
    if (document.hidden) { if (s.state === 'play' && !s.paused) s.openPause(); if (Sound.engine) Sound.engine(false, 0); }
  });
}

class BurnsPlayScene {
  constructor(worldId, opts) {
    this.worldId = worldId || 1; this.opts = opts || {};
    this.def = BurnsWorlds.get(this.worldId);
    this.state = 'load'; this.t = 0; this.time = 0; this.frameN = 0;
    this.q = 1; this.paused = false; this.slow = 1; this.tod = 0; this.todTarget = null;
    this.banners = []; this.toasts = []; this.flashC = null; this.flashA = 0; this.shakeA = 0; this.fade = 1; this.fadeTarget = 0; this.fadeRate = 2;
    this.glow = 0; this.cine = null; this.boss = null; this.bosses = []; this.warnText = null; this.warnT = 0;
    this.tempFires = []; this.plights = []; this.bubble = null;
    this.inp = { jumpPressed: false, actionPressed: false, bike: false, recenter: false };
    this.camYaw = 0; this.camPitch = 0.32; this.camDist = 6.2; this.camCur = null; this.lastManual = -10; this.camRecenter = 0;
    this.cam = { x: 0, y: 3, z: -6, tx: 0, ty: 1, tz: 0, fov: 0.95, shift: 0 };
    this.env = {}; this.stats = { cpu: 0, fps: 60, draws: 0 };
    burnsHookOnce();
    Input.setMode('game');
    if (!this.def) { this.state = 'missing'; Input.setMode('ui'); }
  }
  /* ---------- loading ---------- */
  load() {
    if (!BurnsGL.init()) { this.state = 'nogl'; Input.setMode('ui'); this.buildNoGL(); return; }
    const d = this.def, sv = BurnsSave.get();
    sv.lastWorld = this.worldId; BurnsSave.save();
    BURNS_ATLAS.init(); BURNS_SPRITES.init();
    this.dialog = new BurnsDialog(this);
    this.fx = new BurnsFX(2600);
    this.proj = new BurnsProjectiles(this);
    this.player = new BurnsPlayer(this);
    this.world = new BurnsWorld(d, this);
    this.missions = new BurnsMissions(this, d.missions);
    this.missions.deferred = true;
    this.R = new BurnsRenderer();
    this.palA = d.sky || 'dusk'; this.palB = d.sky2 || null; this.tod = d.tod || 0;
    this.actors = [];
    d.build(this.world.api, this);
    this.world.finish();
    for (const ad of this.world.actorDefs) this.actors.push(new BurnsActor(this, ad));
    this.pickups = new BurnsPickups(this, this.world.pickupDefs);
    this.bike = null;
    if (BurnsSave.hasItem('bike') || d.bike) this.bike = new BurnsVehicle(this, 'bike', { x: 0, z: 0, col: '#ffd21a', visible: false });
    if (this.bike) this.bike.visible = false;
    // spawn at the saved checkpoint or the world's spawn
    const cpId = this.opts.checkpoint || (this.opts.fresh ? null : sv.checkpoint[this.worldId]);
    const cp = cpId && this.world.checkpoints.find(c => c.id === cpId);
    const sp = cp ? { x: cp.x + Math.sin(cp.yaw) * 2, y: cp.y, z: cp.z + Math.cos(cp.yaw) * 2, yaw: cp.yaw } : (d.spawn || { x: 0, y: 0, z: 0, yaw: 0 });
    if (cp) cp.active = true;
    this.spawn = sp;
    this.player.teleport(sp.x, sp.y || this.world.height(sp.x, sp.z), sp.z, sp.yaw || 0);
    this.camYaw = (sp.yaw || 0); this.snapCam = true;
    this.state = 'play';
    this.layoutControls();
    burnsMusic(d.music || ('burns_w' + this.worldId));
    if (d.onStart) d.onStart(this);
    this.missions.refresh();
    this.fadeTo(0, 0.8);
  }
  buildNoGL() {
    const W = Game.cssW, H = Game.cssH, bw = Math.min(220, W * 0.6);
    this.noglBtns = [{ x: (W - bw) / 2, y: H * 0.62, w: bw, h: 46, label: '◀ BACK', primary: true, fn: () => this.quit(true) }];
  }
  resize() { if (this.state === 'nogl' || this.state === 'missing') this.buildNoGL(); this.layoutControls(); if (this.paused) this.buildPause(); }
  // full-screen touch layout: stick left, JUMP + ACTION right, small CAM/BIKE buttons
  layoutControls() {
    const L = Input.layout; if (!L) return;
    const W = Game.cssW, H = Game.cssH, s = Save.data.settings.ctrlScale || 1, lefty = Save.data.settings.lefty;
    const r = clamp(Math.min(W, H) * 0.105, 36, 58) * s;
    const safeL = Math.max(16, insets.l), safeR = Math.max(16, insets.r), safeB = Math.max(14, insets.b);
    const portrait = H > W;
    let jx = W - safeR - r * 1.35, jy = H - safeB - r * (portrait ? 2.0 : 1.4);
    let ax = jx - r * 2.35, ay = jy - r * 0.15;
    let cx = jx - r * 0.2, cy = jy - r * 2.35;
    let bx = ax - r * 0.05, by = ay - r * 2.15;
    let sx = safeL + r * 2.0, sy = H - safeB - r * (portrait ? 2.4 : 1.9);
    if (lefty) { jx = W - jx; ax = W - ax; cx = W - cx; bx = W - bx; sx = W - sx; }
    L.jump = { x: jx, y: jy, r: r * 1.12 }; L.action = { x: ax, y: ay, r: r * 0.9 }; L.stickHome = { x: sx, y: sy, r: r * 1.15 };
    L.pause = { x: lefty ? safeL + 24 : W - safeR - 24, y: Math.max(12, insets.t) + 24, r: 22 }; L.r = r;
    L.split = lefty ? W * 0.55 : W * 0.45;
    this.hudBtns = { cam: { id: 'cam', x: cx, y: cy, r: r * 0.55 }, bike: { id: 'bike', x: bx, y: by, r: r * 0.58 } };
    this.syncHudButtons();
  }
  syncHudButtons() {
    if (!this.hudBtns) return;
    const list = [this.hudBtns.cam];
    if (this.player && ((this.bike && !this.cine) || this.player.vehicle)) list.push(this.hudBtns.bike);
    Input.hud = this.state === 'play' && !this.paused ? list : null;
    Input.camDrag = this.state === 'play' && !this.paused;
  }
  /* ---------- helpers used by worlds, actors and missions ---------- */
  actor(id) { return this.actors.find(a => a.id === id) || null; }
  spawnActor(def) { const a = new BurnsActor(this, def); this.actors.push(a); return a; }
  removeActor(a) { a.removed = true; this.actors = this.actors.filter(x => x !== a); }
  typeName(t) { return ({ burner: 'BURNER', furcoat: 'FUR COAT', tutu: 'TUTU', ledsuit: 'LED KID', greeter: 'GREETER', gate: 'GATE CREW', campLead: 'CAMP LEAD', driver: '6-DAY DRIVER', ranger: 'RANGER', dpw: 'DPW', techbro: 'TECH BRO', sparklepony: 'SPARKLE PONY', influencer: 'INFLUENCER', crusty: 'CRUSTY BURNER', chinka: 'CHINKA' })[t] || String(t).toUpperCase(); }
  say(who, lines, done, opts) { this.dialog.say(who, lines, done, opts); }
  bossSay(boss, text, dur) { this.bossLine = { text, t: dur || 2.6, boss }; }
  playerBubble(text, dur) { this.bubble = { text, t: dur || 1.5 }; }
  banner(title, sub, o) { o = o || {}; if (this.banners.length >= 3) this.banners = this.banners.filter((x, i) => i === 0 || x.big); this.banners.push({ title, sub: sub || '', col: o.col || '#ffd84a', t: 0, dur: o.dur || (o.big ? 3.2 : o.small ? 1.8 : 2.4), big: !!o.big, small: !!o.small, icon: o.icon }); if (this.banners.length > 4) this.banners.shift(); }
  toast(text) { this.toasts.push({ text, t: 0 }); if (this.toasts.length > 3) this.toasts.shift(); }
  warn(text, dur) { this.warnText = text; this.warnT = dur; }
  shake(a) { if (Save.data.settings.shake !== false) this.shakeA = Math.max(this.shakeA, a); }
  screenFlash(col, a) { this.flashC = col; this.flashA = Math.max(this.flashA, a); }
  fadeTo(v, dur) { this.fadeTarget = v; this.fadeRate = 1 / Math.max(0.05, dur || 0.5); }
  shockwave(o) { return this.proj.wave(o); }
  projectile(o) { return this.proj.add(o); }
  addTempFire(x, y, z, r, dur) { this.tempFires.push({ x, y, z, r, t: dur }); }
  pointLight(x, y, z, r, c, i) { this.plights.push({ x, y, z, r, c, i: i || 1 }); }
  addGlow(n) { this.glow += n; }
  // the player attacks bosses (the Man only takes damage while stunned)
  bossHit(x, y, z, r, kind) { let hit = false; for (const b of this.bosses) if (b.hitTest && !b.hidden && b.hitTest(x, y, z, r, kind)) hit = true; return hit; }
  addBoss(b) { if (this.bosses.indexOf(b) < 0) this.bosses.push(b); return b; }
  spawnPickup(kind, x, y, z, o) { return this.pickups.spawn(kind, x, y, z, o); }
  hasItem(id) { return BurnsSave.hasItem(id); }
  giveItem(id, quiet) {
    const isNew = BurnsSave.addItem(id);
    if (isNew && !quiet) { const K = BURNS_KEY_ITEMS[id]; this.banner(K ? K.name : id.toUpperCase(), K ? K.desc : '', { col: K ? K.col : '#ffffff', big: true }); burnsSfx(id === 'ticket' ? 'ticket' : 'map_open', null, 'secret'); }
    if (id === 'bike' && !this.bike) this.bike = new BurnsVehicle(this, 'bike', { col: '#ffd21a', visible: false });
    this.syncHudButtons();
    return isNew;
  }
  flag(k, v) { return BurnsSave.flag(this.worldId, k, v); }
  camState() { return { x: this.cam.x, y: this.cam.y, z: this.cam.z, tx: this.cam.tx, ty: this.cam.ty, tz: this.cam.tz, fov: this.cam.fov }; }
  cutscene(steps, done, opts) {
    if (this.cine) this.cine.skip();
    this.banners = this.banners.filter(b => b.big); this.toasts.length = 0; this.bossLine = null;
    this.cine = new BurnsCine(this, steps, (g) => { this.cine = null; this.syncHudButtons(); if (done) done(g); }, opts);
    this.syncHudButtons();
    return this.cine;
  }
  setTod(target, rate) { this.todTarget = target; this.todRate = rate || 0.05; }
  awardToken(missionId) {
    const isNew = BurnsSave.addToken(this.worldId, missionId);
    const m = this.missions.get(missionId);
    this.banner('BURN TOKEN!', m ? m.def.name : '', { col: '#ffd84a', big: true, icon: 'token' });
    burnsSfx('token_get'); burnsSfx('crowd_cheer', { vol: 0.5 });
    this.fx.confetti(this.player.x, this.player.y + 2, this.player.z, 50);
    this.player.victoryT = 1.4;
    this.saveRun();
    return isNew;
  }
  saveRun() {
    const sv = BurnsSave.get();
    sv.glowWorld[this.worldId] = Math.max(sv.glowWorld[this.worldId] || 0, this.glow);
    const gained = Math.max(0, this.glow - (this.glowBanked || 0)); sv.glow += gained; this.glowBanked = Math.max(this.glowBanked || 0, this.glow);
    BurnsSave.save();
  }
  onPickup(P) {
    const p = this.player, b = P.base;
    if (P.onTake) P.onTake(this, P);
    if (b === 'glowstick') { this.glow++; burnsSfx('glowstick', { vol: 0.5, pitch: 0.9 + Math.random() * 0.3 }, 'pick'); this.fx.burst(P.x, P.y0, P.z, 'spark', 4, rgbToHex(P.glowCol[0] * 255, P.glowCol[1] * 255, P.glowCol[2] * 255)); if (this.glow % 50 === 0) { p.heal(1); this.toast('50 GLOW STICKS! +1 HYDRATION'); } }
    else if (b === 'water') { p.givePower('water'); }
    else if (b === 'bag') { burnsSfx('pickup_bag'); p.givePower(P.arg); this.missions.event('power', P.arg); }
    else if (b === 'token') { this.awardToken(P.mission || P.id); }
    else if (b === 'photo') { const isNew = BurnsSave.addPhoto(this.worldId, P.id); this.banner('PHOTO OF CHINKA', `${BurnsSave.photoCount(this.worldId)}/3 found in this world`, { col: '#ff9ad0', big: true, icon: 'photo' }); burnsSfx('chinka', null, 'secret'); this.fx.hearts(P.x, P.y0, P.z, 12); void isNew; }
    else if (b === 'item') {
      if (P.arg && BURNS_KEY_ITEMS[P.arg] && !P.mission) this.giveItem(P.arg);
      else { burnsSfx('pick'); this.fx.burst(P.x, P.y0, P.z, 'star', 8, '#ffffff'); }
    }
    this.missions.event('pickup', P);
  }
  onAction() {
    const p = this.player;
    // talk / interact first
    const t = this.talkTarget();
    if (t) { this.talkTo(t); return; }
    const it = this.interactTarget();
    if (it) { it.fn(this, it); return; }
    if (p.power === 'liquor' && p.powerT > 0 && p.ammo > 0) {
      p.ammo--; const sp = 11, c = Math.sin(p.yaw), s = Math.cos(p.yaw);
      this.projectile({ kind: 'puke', x: p.x + c * 0.6, y: p.y + 1.4, z: p.z + s * 0.6, vx: c * sp + p.vx * 0.5, vy: 5, vz: s * sp + p.vz * 0.5, gravity: 22, life: 3.5, r: 0.3 });
      p.ch.play('throw', null, true); p.talkT = 0; burnsSfx('puke', null, 'throw');
      if (p.ammo <= 0) p.endPower();
      return;
    }
    if (!p.grounded && !p.pound && !p.vehicle) { p.pound = 1; p.poundT = 0.2; p.spinT = 0; burnsSfx('spin', { pitch: 1.3 }); return; }
    if (p.grounded && p.spinCd <= 0 && p.spinT <= 0) { p.spinT = BURNS_PHYS.spin; p.spinId = (p.spinId || 0) + 1; burnsSfx('spin'); this.fx.ring(p.x, p.y + 0.6, p.z, 1.6, '#ffffff', 0.3); }
  }
  talkTarget() {
    const p = this.player; let best = null, bd = 2.6;
    for (const a of this.actors) {
      if (!a.canTalk || a.hidden) continue;
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (d < bd && Math.abs(a.y - p.y) < 1.6) { bd = d; best = a; }
    }
    return best;
  }
  // world-defined interactables: game.interactables = [{x,z,r,label,fn}]
  interactTarget() {
    const p = this.player;
    if (!p.vehicle) for (const v of this.world.vehicles) {
      if (v.o.drivable === false || (v.o.when && !v.o.when(this))) continue;
      const sp = v.seatPos();
      if (Math.hypot(sp[0] - p.x, sp[2] - p.z) < v.r + 1.8 && Math.abs(p.y - v.y) < 4) return { label: v.o.label || 'DRIVE', fn: () => v.mount(p) };
    }
    if (!this.interactables) return null;
    for (const it of this.interactables) { if (it.when && !it.when(this)) continue; if (Math.hypot(it.x - p.x, it.z - p.z) < (it.r || 2.2) && Math.abs((it.y || p.y) - p.y) < 2) return it; }
    return null;
  }
  talkTo(a) {
    const p = this.player;
    a.face(p.x, p.z, 1, 100); p.yaw = Math.atan2(a.x - p.x, a.z - p.z);
    this.missions.event('talk', a);
    if (a.beh.talk && a.beh.talk(a, this)) return;
    if (a.def.talk) { a.def.talk(this, a); return; }
    const lines = a.def.lines || (BURNS_LINES[a.type] || ['Hey!']).slice(0, 2);
    this.say(a, lines, () => {
      const gift = a.def.gift;
      if (gift && !a.data.gifted) {
        a.data.gifted = true;
        if (gift.kind === 'glowstick') { this.glow += gift.n || 5; this.toast(`GIFTED ${gift.n || 5} GLOW STICKS!`); burnsSfx('gift', null, 'pick'); }
        else if (gift.kind === 'water' || BURNS_POWERUPS[gift.kind]) this.player.givePower(gift.kind);
        else if (gift.kind === 'item') this.giveItem(gift.item);
        this.fx.confetti(a.x, a.y + 2, a.z, 16);
      }
    });
  }
  groundPound(x, y, z, R, quiet) {
    if (!quiet) { burnsSfx('groundpound'); this.shake(0.3); }
    this.fx.dust(x, y + 0.1, z, 14); this.fx.ring(x, y + 0.08, z, R, '#ffffff', 0.4);
    for (const a of this.actors) if (!a.hidden && Math.hypot(a.x - x, a.z - z) < R + a.r && Math.abs(a.y - y) < 1.5) { if (!a.friendly || a.behName === 'sleep' || a.def.hittable) a.hit('pound', x, z); }
    this.bossHit(x, y, z, R * 0.6, 'pound');
    this.missions.event('pound', { x, y, z });
  }
  onFaint() {
    this.banner('DEHYDRATED!', 'Back to the last camp flag...', { col: '#5ad0ff' });
    burnsSfx('die', null, 'hurt');
    for (const m of this.missions.active()) if (m.def.time || m.def.failOnFaint) this.missions.fail(m.id, 'You fainted!');
    this.fadeTo(1, 0.8);
    this.faintT = 1.6;
  }
  respawn(fall) {
    const sv = BurnsSave.get(), p = this.player;
    const cp = this.world.checkpoints.find(c => c.id === sv.checkpoint[this.worldId]);
    const sp = cp ? { x: cp.x + Math.sin(cp.yaw) * 2, y: cp.y, z: cp.z + Math.cos(cp.yaw) * 2, yaw: cp.yaw } : this.spawn;
    if (p.vehicle) p.vehicle.dismount(p);
    p.teleport(sp.x, sp.y || this.world.height(sp.x, sp.z), sp.z, sp.yaw);
    p.dead = false; p.grabbedBy = null; p.pound = 0; p.endPower(true); p.invT = 2;
    if (!fall) { p.hydration = p.maxHydration; const lost = Math.min(this.glow, 5); this.glow -= lost; if (lost) this.toast(`-${lost} GLOW STICKS`); }
    this.camYaw = sp.yaw || 0; this.snapCam = true;
    this.fadeTo(0, 0.6);
    if (this.def.onRespawn) this.def.onRespawn(this);
  }
  checkpointTouch(cp) {
    if (cp.active && BurnsSave.get().checkpoint[this.worldId] === cp.id) return;
    for (const c of this.world.checkpoints) c.active = false;
    cp.active = true; cp.flashT = 1;
    const sv = BurnsSave.get(); sv.checkpoint[this.worldId] = cp.id; BurnsSave.save();
    this.player.heal(this.player.maxHydration);
    this.banner('CAMP FLAG', cp.name + ' · hydration refilled', { col: '#ff4fd8', small: true });
    burnsSfx('checkpoint'); this.fx.confetti(cp.x, cp.y + 3.2, cp.z, 20);
    this.saveRun();
  }
  finishWorld(next) {
    const sv = BurnsSave.get();
    sv.worldDone[this.worldId] = true;
    BurnsSave.unlockWorld(BurnsWorlds.next(this.worldId));   // next in BURNS_WORLD_ORDER (not id + 1)
    sv.checkpoint[this.worldId] = null;
    this.saveRun();
    this.state = 'results'; this.resultsT = 0; Input.setMode('ui'); this.syncHudButtons();
    this.resultsNext = next;
    burnsMusic('burns_victory');
  }
  quit(toHub) {
    Input.camDrag = false; Input.hud = null; Input.setMode('ui');
    if (Sound.engine) Sound.engine(false, 0);
    if (this.player) this.saveRun();
    this.released = true;
    BurnsScenes.releaseWorld(this);
    if (toHub) Game.setScene(new BurnsHubScene({ from: this.worldId }));
    else Game.setScene(new TitleScene());
  }
  openPause() { if (this.state !== 'play') return; this.paused = true; this.pauseTab = 'main'; Input.setMode('ui'); this.buildPause(); this.syncHudButtons(); burnsSfx('pause', null, 'select'); if (Sound.engine) Sound.engine(false, 0); }
  closePause() { this.paused = false; Input.setMode('game'); this.syncHudButtons(); burnsSfx('select'); }
  /* ---------- input ---------- */
  readInput() {
    const p = this.player, I = Input;
    let sx = 0, sy = 0;
    if (I.stick.active && I.layout) {
      const dx = I.stick.x - I.stick.ox, dy = I.stick.y - I.stick.oy, R = I.layout.r * 1.05, d = Math.hypot(dx, dy);
      if (d > I.layout.r * 0.12) { const k = Math.min(1, (d - I.layout.r * 0.12) / (R - I.layout.r * 0.12)); sx = dx / d * k; sy = -dy / d * k; }
    }
    if (I.left) sx -= 1; if (I.right) sx += 1; if (I.up) sy += 1; if (I.down) sy -= 1;
    const pad = this.pad;
    if (pad && Math.hypot(pad.lx, pad.ly) > 0.18) { sx = pad.lx; sy = -pad.ly; }
    const m = Math.hypot(sx, sy); if (m > 1) { sx /= m; sy /= m; }
    // camera-relative: forward = camera's horizontal look direction
    const fy = this.camYaw, fx = Math.sin(fy), fz = Math.cos(fy), rx = -Math.cos(fy), rz = Math.sin(fy);
    p.inp.mx = fx * sy + rx * sx; p.inp.mz = fz * sy + rz * sx; p.inp.mag = Math.min(1, Math.hypot(sx, sy));
    p.inp.jump = I.jump; p.inp.action = I.action;
    if (I.jumpPressed) p.inp.jumpPressed = true;
    if (I.actionPressed) p.inp.actionPressed = true;
    if (I.hudPressed.bike || BurnsKeys.pressed.bike || (pad && pad.bikeP)) this.inp.bike = true;
    if (I.hudPressed.cam || BurnsKeys.pressed.recenter || (pad && pad.camP)) this.inp.recenter = true;
    if (BurnsKeys.pressed.missions) this.inp.missions = true;
    BurnsKeys.pressed = {};
  }
  pollPad() {
    this.pad = null;
    try {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (const gp of pads) if (gp && gp.connected) {
        const prev = this._padPrev || {};
        const b = i => !!(gp.buttons[i] && gp.buttons[i].pressed);
        this.pad = { lx: gp.axes[0] || 0, ly: gp.axes[1] || 0, rx: gp.axes[2] || 0, ry: gp.axes[3] || 0, bikeP: b(4) && !prev.b4, camP: b(11) && !prev.b11 };
        this._padPrev = { b4: b(4), b11: b(11) };
        break;
      }
    } catch (e) { this.pad = null; }
  }
  /* ---------- simulation step (Game calls this at 120 Hz) ---------- */
  update(dt) {
    this.t += dt;
    if (this.state === 'load' || this.state === 'nogl' || this.state === 'missing') {
      if (this.state !== 'load') { const hit = UI.hitButtons(this.noglBtns); if (hit) hit.fn(); }
      return;
    }
    // one place decides the input mode: menus, dialogue and cutscenes use taps
    const wantUI = this.paused || this.dialog.open || !!this.cine || this.state !== 'play';
    if (Input.mode !== (wantUI ? 'ui' : 'game')) Input.setMode(wantUI ? 'ui' : 'game');
    if (this.state === 'results') { this.updateResults(dt); return; }
    if (this.paused) { this.updatePause(dt); return; }
    if (this.cine && !this.dialog.open && this.skipRect) for (const t of Input.taps) { const r = this.skipRect; if (t.x >= r.x - 10 && t.x <= r.x + r.w + 10 && t.y >= r.y - 10 && t.y <= r.y + r.h + 10) { this.cine.skip(); break; } }
    if (Input.pausePressed && !this.dialog.open) { this.openPause(); return; }
    this.readInput();
    if (this.inp.missions) { this.inp.missions = false; this.openPause(); this.pauseTab = 'missions'; this.buildPause(); return; }
    const g = this, p = this.player, W = this.world;
    this.time += dt;
    // dialogue + cutscene
    this.dialog.update(dt);
    if (this.cine) this.cine.update(dt);
    if (this.faintT > 0) { this.faintT -= dt; if (this.faintT <= 0) this.respawn(); }
    // bike summon / exit
    if (this.inp.bike) {
      this.inp.bike = false;
      if (!this.cine && !this.dialog.open) {
        if (p.vehicle) p.vehicle.dismount(p);
        else if (this.bike && p.grounded && !p.dead) { this.bike.x = p.x; this.bike.z = p.z; this.bike.y = p.y; this.bike.yaw = p.yaw; this.fx.dust(p.x, p.y, p.z, 10); this.fx.confetti(p.x, p.y + 1, p.z, 8); this.bike.mount(p); }
      }
    }
    if (this.inp.recenter) { this.inp.recenter = false; this.camRecenter = 0.5; }
    // world time (K-hole slows everything but Brady)
    const wdt = dt * this.slow;
    W.saveMoverPrev();
    for (const T of W.traffic) T.update(wdt, this.time);
    for (const v of W.vehicles) v.idle(wdt);
    for (const fn of W.updaters) fn(this, wdt);
    if (this.def.update) this.def.update(this, wdt);
    W.stepMovers();
    for (const b of this.bosses) if (b.addColliders) b.addColliders();
    // ride moving platforms
    if (p.platform && p.grounded && !p.vehicle) {
      const o = p.platform, dyaw = o.yaw - o.pyaw, c = Math.cos(dyaw), s = Math.sin(dyaw);
      const dx = p.x - o.px, dz = p.z - o.pz;
      p.x = o.x + dx * c + dz * s; p.z = o.z - dx * s + dz * c; p.y += o.y - o.py; p.yaw += dyaw;
      if (Math.abs(dyaw) > 1e-6 && !this.manualCam) this.camYaw += dyaw;
    }
    p.update(dt);
    p.inp.jumpPressed = false; p.inp.actionPressed = false;
    // actors (far ones idle cheaply)
    for (const a of this.actors) {
      if (a.removed) continue;
      const d2 = (a.x - p.x) * (a.x - p.x) + (a.z - p.z) * (a.z - p.z);
      if (d2 > 110 * 110 && !a.boss && !a.def.always) continue;
      a.update(wdt);
    }
    for (const b of this.bosses) b.update(wdt);
    if (this.boss && this.bosses.indexOf(this.boss) < 0 && this.boss.update) this.boss.update(wdt);
    this.proj.update(wdt);
    this.pickups.update(dt);
    // flame jets, temp fires
    for (const j of W.jets) { j.t += wdt; const ph = ((j.t + j.phase) % j.period); j.active = ph < j.on; j.warn = !j.active && ph > j.period - 0.6; }
    for (const f of this.tempFires) f.t -= wdt;
    if (this.tempFires.length) this.tempFires = this.tempFires.filter(f => f.t > 0);
    // triggers
    for (const tr of W.triggers) {
      if (tr.done) continue;
      const inside = tr.box ? (Math.abs(p.x - tr.x) < tr.box[0] && Math.abs(p.z - tr.z) < tr.box[1]) : Math.hypot(p.x - tr.x, p.z - tr.z) < tr.r;
      const iny = inside && p.y >= tr.y0 && p.y <= tr.y1 && (!tr.when || tr.when(this));
      if (iny && !tr.inside) { tr.inside = true; if (tr.onEnter) tr.onEnter(this, tr); if (tr.once) tr.done = true; }
      else if (!iny && tr.inside) { tr.inside = false; if (tr.onExit) tr.onExit(this, tr); }
      if (iny && tr.onStay) tr.onStay(this, tr, dt);
    }
    for (const cp of W.checkpoints) if (Math.hypot(cp.x - p.x, cp.z - p.z) < 2.2 && Math.abs(cp.y - p.y) < 2.5 && !p.dead) this.checkpointTouch(cp);
    this.missions.update(dt);
    if (this.todTarget !== null) { this.tod = approach(this.tod, this.todTarget, dt * this.todRate); if (this.tod === this.todTarget) this.todTarget = null; }
    // timers
    if (this.warnT > 0) this.warnT -= dt;
    if (this.bossLine) { this.bossLine.t -= dt; if (this.bossLine.t <= 0) this.bossLine = null; }
    if (this.bubble) { this.bubble.t -= dt; if (this.bubble.t <= 0) this.bubble = null; }
    this.frameStep = (this.frameStep || 0) + 1;
  }
  /* ---------- camera ---------- */
  updateCamera(fdt) {
    const p = this.player, cam = this.cam, sv = BurnsSave.get().settings, W = this.world;
    const portrait = Game.cssH > Game.cssW;
    if (this.cine && this.cine.cam) { Object.assign(cam, this.cine.cam); cam.shift = portrait ? 0.06 : 0; cam.roll = 0; return; }
    // manual orbit (touch drag / mouse / keys / right stick)
    const sens = (sv.camSens || 1) * 0.0085;
    let dyaw = -Input.camDX * sens, dpitch = Input.camDY * sens * 0.7 * (sv.invertY ? -1 : 1);
    Input.camDX = 0; Input.camDY = 0;
    if (BurnsKeys.down.camL) dyaw += 2.2 * fdt; if (BurnsKeys.down.camR) dyaw -= 2.2 * fdt;
    if (this.pad) { if (Math.abs(this.pad.rx) > 0.15) dyaw -= this.pad.rx * 2.6 * fdt; if (Math.abs(this.pad.ry) > 0.15) dpitch += this.pad.ry * 1.6 * fdt * (sv.invertY ? -1 : 1); }
    if (dyaw || dpitch) { this.camYaw += dyaw; this.camPitch = clamp(this.camPitch + dpitch, -0.25, 1.15); this.lastManual = this.time; this.manualCam = true; } else this.manualCam = false;
    const veh = p.vehicle, hsp = Math.hypot(p.vx, p.vz);
    // boss framing: face the boss and aim part-way toward its head
    const boss = this.boss && this.boss.active && !this.boss.defeated && this.boss.head ? this.boss : null;
    const bh = boss ? this.boss.head() : null;
    this.bossK = BurnsM.damp(this.bossK || 0, boss ? 1 : 0, 2.5, fdt);
    if (boss && this.time - this.lastManual > 0.9 && this.camRecenter <= 0) {
      this.camYaw = BurnsM.dampAngle(this.camYaw, Math.atan2(bh[0] - p.x, bh[2] - p.z), 2.4, fdt);
      this.camPitch = BurnsM.damp(this.camPitch, 0.14, 2, fdt);
    }
    // ease behind the player while running (unless the player recently orbited)
    if (boss) { /* boss framing owns the yaw */ }
    else if (this.camRecenter > 0) { this.camRecenter -= fdt; this.camYaw = BurnsM.dampAngle(this.camYaw, p.yaw, 10, fdt); this.camPitch = BurnsM.damp(this.camPitch, 0.3, 8, fdt); }
    else if (sv.autoCam !== false && this.time - this.lastManual > 1.2 && (hsp > 2 || veh)) {
      const behind = veh ? veh.yaw : Math.atan2(p.vx, p.vz);
      const fwd = Math.cos(BurnsM.wrap(behind - this.camYaw));
      // only swing when not running toward the camera (avoid flip-flopping)
      if (fwd > -0.2) this.camYaw = BurnsM.dampAngle(this.camYaw, behind, (veh ? 2.2 : 1.1) * Math.min(1, hsp / 7), fdt);
      this.camPitch = BurnsM.damp(this.camPitch, veh ? 0.28 : 0.3, 0.8, fdt);
    }
    const giant = p.giant > 0 ? 1 : 0;
    this.giantK = BurnsM.damp(this.giantK || 0, giant, 3, fdt);
    const baseDist = (veh && veh.kind === 'car' ? 13 : veh ? 7.4 : 6.4) + this.giantK * 5 + (this.boss && this.boss.active ? 2.2 : 0) + (portrait ? 1.2 : 0);
    // smoothed follow target
    const tx = p.x, ty = p.y + 1.35 + this.giantK * 1.8, tz = p.z;
    if (!this.camCur || this.snapCam) { this.camCur = { x: tx, y: ty, z: tz }; this.camD = baseDist; }
    const C = this.camCur;
    C.x = BurnsM.damp(C.x, tx, 14, fdt); C.z = BurnsM.damp(C.z, tz, 14, fdt);
    C.y = BurnsM.damp(C.y, ty, p.grounded || p.vy < -12 ? 9 : 3.5, fdt);
    if (this.snapCam) { this.snapCam = false; }
    // look-ahead in the movement direction
    const la = Math.min(1.6, hsp * 0.18);
    const lx = hsp > 0.5 ? p.vx / hsp * la : 0, lz = hsp > 0.5 ? p.vz / hsp * la : 0;
    const cy = this.camYaw, ax = C.x + lx, ay = C.y, az = C.z + lz, want = baseDist;
    // collision: first try rising over whatever blocks the view (vehicles behind Brady on the RV
    // roofs, walls), and only then pull the camera in toward him
    const probe = (pt) => { const dX = -Math.sin(cy) * Math.cos(pt), dY = Math.sin(pt), dZ = -Math.cos(cy) * Math.cos(pt); return Math.max(1.1, W.raycast(ax, ay, az, ax + dX * (want + 0.4), ay + dY * (want + 0.4), az + dZ * (want + 0.4), true) * (want + 0.4) - 0.45); };
    let lift = 0;
    if (!(this.cine && this.cine.cam) && probe(this.camPitch) < want * 0.7) {
      let best = probe(this.camPitch);
      for (const extra of [0.3, 0.55, 0.8]) { const pt = Math.min(1.3, this.camPitch + extra), al = probe(pt); if (al > best + 0.4) { best = al; lift = pt - this.camPitch; } if (al >= want * 0.85) break; }
    }
    this.camLift = BurnsM.damp(this.camLift || 0, lift, lift > (this.camLift || 0) ? 6 : 1.5, fdt);
    const pitch = this.camPitch + this.camLift;
    const dirX = -Math.sin(cy) * Math.cos(pitch), dirY = Math.sin(pitch), dirZ = -Math.cos(cy) * Math.cos(pitch);
    const hit = W.raycast(ax, ay, az, ax + dirX * (want + 0.4), ay + dirY * (want + 0.4), az + dirZ * (want + 0.4), true);
    const allowed = Math.max(1.1, hit * (want + 0.4) - 0.45);
    this.camD = allowed < this.camD ? allowed : BurnsM.damp(this.camD, Math.min(want, allowed), 2.5, fdt);
    let x = ax + dirX * this.camD, y = ay + dirY * this.camD, z = az + dirZ * this.camD;
    const gy = W.surface(x, z, y + 0.3, 0.2, BURNS_SURF).y;
    if (y < gy + 0.45) y = gy + 0.45;
    // shake + K-hole wobble
    if (this.shakeA > 0) { const s = this.shakeA * 0.35; x += (Math.random() - 0.5) * s; y += (Math.random() - 0.5) * s; z += (Math.random() - 0.5) * s; this.shakeA = Math.max(0, this.shakeA - fdt * 1.8); }
    cam.x = x; cam.y = y; cam.z = z; cam.tx = ax; cam.ty = ay + 0.1; cam.tz = az;
    if (bh && this.bossK > 0.01) { const k = 0.34 * this.bossK; cam.tx = lerp(ax, bh[0], k); cam.ty = lerp(ay + 0.1, bh[1], k); cam.tz = lerp(az, bh[2], k); }
    const kh = p.power === 'khole' && p.powerT > 0 ? 1 : 0;
    this.khK = BurnsM.damp(this.khK || 0, kh, 2, fdt);
    cam.roll = Math.sin(this.time * 1.3) * 0.08 * this.khK;
    const asp = Game.cssW / Game.cssH;
    cam.fov = Math.max(0.9, 2 * Math.atan(Math.tan(1.05 / 2) / asp)) + this.khK * Math.sin(this.time * 0.9) * 0.08 + (p.power === 'powder' && p.powerT > 0 ? 0.06 : 0);
    cam.shift = portrait ? 0.12 : 0.04;
    cam.near = 0.15; cam.far = 1500;
  }
  /* ---------- rendering ---------- */
  adapt(fdt) {
    this.slowAcc = clamp((this.slowAcc || 0) + (fdt > 0.021 ? fdt : -fdt * 0.3), 0, 3);
    if (this.slowAcc > 1.2 && this.q > 0.5) { this.q = Math.max(0.5, this.q - 0.1); this.slowAcc = 0; }
    this.fastAcc = fdt < 0.0175 ? (this.fastAcc || 0) + fdt : 0;
    if (this.fastAcc > 5 && this.q < 1) { this.q = Math.min(1, this.q + 0.08); this.fastAcc = 0; }
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr;
    if (this.state === 'missing') return BurnsUI.drawMissing(ctx, this);
    if (this.state === 'load') {
      BurnsUI.drawLoading(ctx, this);
      if (this.loadFrames = (this.loadFrames || 0) + 1, this.loadFrames >= 2) {
        try { this.load(); } catch (e) { console.error(e); Game.reportError(e); this.state = 'nogl'; this.noglMsg = 'This world failed to load.'; this.buildNoGL(); Input.setMode('ui'); }
      }
      return;
    }
    if (this.state === 'nogl') return BurnsUI.drawNoGL(ctx, this);
    if (BurnsGL.lost) { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#07040e'; ctx.fillRect(0, 0, W, H); BurnsUI.text(ctx, 'RECONNECTING TO THE PLAYA…', W / 2, H / 2, 14, '#ffffff'); return; }
    const now = performance.now(), fdt = this.lastFrame ? clamp((now - this.lastFrame) / 1000, 0, 0.1) : 1 / 60;
    this.lastFrame = now; this.frameN++;
    this.stats.fps = lerp(this.stats.fps, 1 / Math.max(0.001, fdt), 0.05);
    const t0 = performance.now();
    this.pollPad();
    if (!this.paused) this.adapt(fdt);
    const frozen = this.paused || this.state === 'results';
    const vdt = frozen ? 0 : fdt;
    // visuals that run per rendered frame
    this.fx.update(vdt * this.slow);
    this.updateCamera(vdt || 1e-4);
    const p = this.player;
    p.ch.x = p.x; p.ch.y = p.y - (p.mudSink > 0 ? Math.min(0.5, p.mudSink * 0.15) : 0); p.ch.z = p.z; p.ch.yaw = p.yaw;
    p.ch.scale = BurnsM.damp(p.ch.scale, p.giant > 0 ? 2.4 : 1, 4, vdt || 0.016);
    p.ch.update(vdt); p.ch.compute();
    if (this.bike) this.bike.poseBike(vdt);
    // renderer
    const R = this.R, gw = Math.max(64, Math.round(W * Math.min(dpr, 2) * this.q)), gh = Math.max(64, Math.round(H * Math.min(dpr, 2) * this.q));
    R.resize(gw, gh);
    R.setCamera(this.cam);
    const env = BurnsEnv.build(this.palA, this.palB, this.tod, this.env, this.time);
    if (this.def.env) this.def.env(this, env);
    env.trip = p.power === 'lsd' && p.powerT > 0 ? Math.min(1, p.powerT / 2, (BURNS_POWERUPS.lsd.dur - p.powerT) * 2) : 0;
    this.collectLights(env);
    R.begin();
    R.sky(env);
    R.ground(this.world.ground, env, this.world);
    R.statics(this.world.chunks, env, this.world, BURNS_ATLAS.T, env.fogD > 0.02 ? 120 : 260);
    if (env.trip > 0.01 && this.world.ghosts.length) R.ghost(this.world.ghosts, env, this.world, BURNS_ATLAS.T, 0.55 + env.trip * 0.35);
    // skinned: groups (vehicles, movers, pickups), characters, bosses
    this.pickups.draw(R);
    for (const G of this.world.groups) G.pose();
    R.skinBegin(env, this.world, BURNS_ATLAS.T);
    for (const G of this.world.groups) if (G.objs.length) R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.15);
    for (const G of this.pickups.groups) R.skin(G.geo, G.bones, G.objs.length, null, 0, 0.6);
    const blink = p.invT > 0 && !p.dead && Math.floor(this.time * 14) % 2 === 0;
    if (!blink) R.skin(p.model.geo, p.ch.bones, p.ch.nb, p.hurtT > 0 ? [1, 0.4, 0.4, 0.4] : null, p.ch.face, 0.5);
    if (this.bike && (this.bike.rider || this.bike.visible) && this.bike.rider) R.skin(this.bike.model.geo, this.bike.bones, this.bike.model.nb, null, 0, 0.3);
    const cam = this.cam, P = R.planes;
    for (const a of this.actors) {
      if (a.removed || a.hidden) continue;
      const d2 = (a.x - cam.x) * (a.x - cam.x) + (a.z - cam.z) * (a.z - cam.z);
      if (d2 > 115 * 115) continue;
      if (!BurnsM.sphereVisible(P, a.x, a.y + 1, a.z, 2 * a.scale)) continue;
      a.draw(R); a.ch.update(vdt * this.slow); a.ch.compute();
      if (a.beh.draw) a.beh.draw(a, this, R);           // per-frame behaviour effects (fire, glints, lights)
      if (a.cloak) continue;                             // e.g. a darkwad in the dark: logic runs, nothing drawn
      // distant characters use the low-detail model
      R.skin(d2 > BURNS_FAR_D2 && a.model.far ? a.model.far : d2 > BURNS_LOD_D2 && a.model.lod ? a.model.lod : a.model.geo, a.ch.bones, a.ch.nb, a.ch.tint, a.ch.face, a.ch.rim);
      a._vis = true;
    }
    for (const b of this.bosses) { if (!b.ch || b.hidden) continue; R.skin(b.model.geo, b.ch.bones, b.ch.nb, b.hurtTint || null, b.ch.face, 0.25); if (b.chinka && b.showChinka !== false) R.skin(b.chinka.model.geo, b.chinka.bones, b.chinka.nb, null, b.chinka.face, 0.5); }
    if (this.def.drawSkinned) this.def.drawSkinned(this, R);
    // sprites: shadows, glows, particles, projectiles
    this.pushSprites(R, env);
    R.sprites(env, BURNS_SPRITES.T);
    // dialogue portrait (rendered in GL, framed in 2D)
    if (this.dialog.open && this.dialog.cur) this.drawPortrait(R, env);
    this.stats.draws = R.stats.draws; this.stats.tris = R.stats.tris;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(BurnsGL.canvas, 0, 0, gw, gh, 0, 0, Game.canvas.width, Game.canvas.height);
    this.stats.cpu = lerp(this.stats.cpu, performance.now() - t0, 0.1);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    BurnsUI.drawOverlay(ctx, this, fdt);
  }
  collectLights(env) {
    const p = this.player, list = this.plights;
    // nearest fires become dynamic point lights (flicker)
    const fires = this.world.fires.concat(this.tempFires);
    const cand = [];
    for (const f of fires) { const d = Math.hypot(f.x - p.x, f.z - p.z); if (d < 40) cand.push([d, f]); }
    cand.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < cand.length && list.length < 4; i++) { const f = cand[i][1]; list.push({ x: f.x, y: (f.y || 0) + 1.4, z: f.z, r: 7 + Math.sin(this.time * 17 + i) * 0.6, c: [1, 0.55, 0.2], i: 1.2 }); }
    if (p.power && p.powerT > 0 && list.length < 4) { const c = burnsRGBf(BURNS_POWERUPS[p.power].col); list.push({ x: p.x, y: p.y + 1.5, z: p.z, r: 5, c, i: 0.8 }); }
    this.R.setLights(list.slice(0, 4));
    this.plights = [];
  }
  pushSprites(R, env) {
    const S = BURNS_SPRITES.R, cam = this.cam, p = this.player, W = this.world, t = this.time, P = R.planes;
    // blob shadows
    const shadow = (x, y, z, s, a) => { const gy = W.surface(x, z, y + 0.3, 0.2, BURNS_SURF).y; const h = Math.max(0, y - gy); R.flat.flat(x, gy + 0.03, z, s * (1 + h * 0.08), s * (1 + h * 0.08), 0, S.shadow, [0, 0, 0], a * clamp(1 - h * 0.12, 0.25, 1), false); };
    shadow(p.x, p.y, p.z, 1.15 * p.ch.scale, 0.6);
    for (const a of this.actors) if (a._vis) { shadow(a.x, a.y, a.z, 1.05 * a.scale, 0.55); a._vis = false; }
    // static glows (lamps, neon, headlights on parked cars)
    const lsd = p.power === 'lsd' && p.powerT > 0;
    for (const g of W.glows) {
      if (g.hidden && !lsd) continue;
      const dx = g.x - cam.x, dz = g.z - cam.z, d2 = dx * dx + dz * dz;
      if (d2 > 170 * 170) continue;
      if (!BurnsM.sphereVisible(P, g.x, g.y, g.z, g.s)) continue;
      const fl = g.blink ? (0.6 + 0.4 * Math.sin(t * g.blink + g.ph)) : 1;
      R.bbs.bb(g.x, g.y, g.z, g.s * 1.8, g.s * 1.8, S.glow, g.c, 0.75 * fl, true);
    }
    // mover lights (vehicle headlights + ground pools)
    for (const o of W.movers) {
      if (!o.visible || !o.lights.length) continue;
      const dx = o.x - cam.x, dz = o.z - cam.z; if (dx * dx + dz * dz > 150 * 150) continue;
      const c = Math.cos(o.yaw), s = Math.sin(o.yaw);
      for (const L of o.lights) {
        const x = o.x + L.x * c + L.z * s, z = o.z - L.x * s + L.z * c, y = o.y + L.y;
        if (!BurnsM.sphereVisible(P, x, y, z, L.s + 4)) continue;
        if (!L.cc) L.cc = burnsRGBf(L.c);
        R.bbs.bb(x, y, z, L.s * 1.6, L.s * 1.6, S.glow, L.cc, 0.85, true);
        if (L.beam !== undefined) R.flat.flat(x + Math.sin(o.yaw) * 4.2, o.y + 0.04, z + Math.cos(o.yaw) * 4.2, 3.2, 8, o.yaw + Math.PI, S.beam, [1, 0.92, 0.75], 0.32, true);
      }
    }
    // fires + flame jets
    for (const f of W.fires.concat(this.tempFires)) {
      const dx = f.x - cam.x, dz = f.z - cam.z; if (dx * dx + dz * dz > 120 * 120) continue;
      if (Math.random() < 0.9) this.fx.fire(f.x, f.y || 0, f.z, (f.r || 0.4) * 2.2);
      R.bbs.bb(f.x, (f.y || 0) + 0.8, f.z, 4 + Math.sin(t * 13 + f.x) * 0.3, 4, S.glow, [1, 0.5, 0.15], 0.5, true);
    }
    for (const j of W.jets) {
      if (j.active) { for (let i = 0; i < 3; i++) this.fx.add(j.x + (Math.random() - 0.5) * 0.4, j.y + 0.3, j.z + (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 1.2, j.h * 2.4 + Math.random() * 3, (Math.random() - 0.5) * 1.2, 0.42, 1.2, 0.5, [1, 0.6, 0.2], 1, 'flame', 1); this.plights.push({ x: j.x, y: j.y + 2, z: j.z, r: 10, c: [1, 0.5, 0.15], i: 1.4 }); }
      else if (j.warn && Math.random() < 0.5) this.fx.add(j.x, j.y + 0.3, j.z, 0, 1, 0, 0.3, 0.4, 0.1, [1, 0.8, 0.3], 1, 'spark', 1);
      R.flat.flat(j.x, j.y + 0.05, j.z, j.r * 2.6, j.r * 2.6, 0, S.warn, j.active ? [1, 0.4, 0.1] : [1, 0.75, 0.3], j.warn || j.active ? 0.8 : 0.25, true);
    }
    // camp flags
    for (const c of W.checkpoints) { const col = c.active ? [1, 0.35, 0.85] : [0.55, 0.5, 0.6]; R.bbs.bb(c.x + 0.6, c.y + 3.0, c.z, c.active ? 2.4 : 1.2, c.active ? 2.4 : 1.2, S.glow, col, c.active ? 0.8 : 0.4, true); if (c.active && Math.random() < 0.05) this.fx.glint(c.x + 0.6, c.y + 3.0, c.z, '#ff9ad8'); }
    // power-up auras
    if (p.power && p.powerT > 0) {
      const pc = burnsRGBf(BURNS_POWERUPS[p.power].col);
      R.bbs.bb(p.x, p.y + 1.0 * p.ch.scale, p.z, 2.6 * p.ch.scale, 2.6 * p.ch.scale, S.glow, pc, 0.25 + Math.sin(t * 6) * 0.08, true);
      if (p.power === 'molly' && Math.random() < 0.12) this.fx.hearts(p.x, p.y + 1.8, p.z, 1);
      if (p.power === 'powder' && Math.hypot(p.vx, p.vz) > 5 && Math.random() < 0.6) this.fx.add(p.x, p.y + 0.9, p.z, -p.vx * 0.1, 0.2, -p.vz * 0.1, 0.3, 0.9, 0.2, [1, 1, 1], 0.7, 'streak', 1 | 16);
    }
    if (BurnsSave.get().costume === 'disco' && Math.random() < 0.3) this.fx.glint(p.x, p.y + 1.2, p.z, '#ffffff');
    if (BurnsSave.get().costume === 'spaceman' && Math.random() < 0.05) this.fx.glint(p.x, p.y + 1.9, p.z, '#38f2ff');
    // ambient dust drifting across the playa
    if (env.fogD > 0 && Math.random() < 0.35 * (this.def.dust === undefined ? 1 : this.def.dust)) {
      const a = Math.random() * TAU, d = 4 + Math.random() * 22;
      this.fx.add(cam.tx + Math.cos(a) * d, cam.ty - 0.8 + Math.random() * 2.5, cam.tz + Math.sin(a) * d, 1.2 + Math.random(), 0.05, 0.4, 3 + Math.random() * 2, 1.5, 3.5, env.fogCol.map(c => Math.min(1, c * 1.6 + 0.15)), 0.12, 'puff', 0, Math.random() * 6, 0.1);
    }
    for (const b of this.bosses) if (b.draw && !b.hidden) b.draw(R);
    this.proj.draw(R);
    if (this.def.drawSprites) this.def.drawSprites(this, R);
    this.fx.draw(R);
  }
  drawPortrait(R, env) {
    const box = BurnsUI.dialogRect(this);
    if (!box) return;
    const k = R.w / Game.cssW;
    const who = this.dialog.cur.who;
    let model = null, face = (Math.floor(this.time * 9) % 2 && this.dialog.chars < this.dialog.cur.text.length) ? 1 : 0, scale = 1, anim = 'talk';
    if (who === 'brady' || who === this.player) model = this.player.model;
    else if (who === 'man' || (who && who.man)) { model = BurnsManModel.build(); scale = 0.14; }
    else if (who && who.model) model = who.model;
    else if (who && who.ch) model = who.model;
    if (!model) return;
    if (!this.pch) this.pch = new BurnsChar(model);
    if (this.pch.model !== model) this.pch.setModel(model);
    const ch = this.pch; ch.x = 0; ch.y = 0; ch.z = 0; ch.yaw = 0.35; ch.scale = scale; ch.play(anim); ch.update(1 / 60); ch.faceOverride = model.man ? 3 : face; ch.compute();
    const r = box.portrait;
    const headY = (model.headY || 1.62) * scale + 0.05;
    R.portrait({ x: r.x * k, y: r.y * k, w: r.w * k, h: r.h * k }, env, BURNS_ATLAS.T, [0.16, 0.1, 0.24], headY, RR => RR.skin(model.geo, ch.bones, ch.nb, null, ch.face, 0.6));
  }
  /* ---------- pause + results ---------- */
  buildPause() { this.pauseUI = BurnsUI.buildPause(this); }
  updatePause(dt) { BurnsUI.updatePause(this, dt); }
  updateResults(dt) {
    this.resultsT += dt;
    if (this.resultsT > 1.2 && (Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed)) {
      const next = this.resultsNext; this.resultsNext = null;
      if (next) next(this); else this.quit(true);
    }
  }
}

/* ---------------- scene helpers ---------------- */
const BURNS_LOD_D2 = 16 * 16;   // characters beyond 16 m from the camera draw their LOD model
const BURNS_FAR_D2 = 45 * 45;   // ...and beyond 45 m the crowd LOD (no small accessories)
const BurnsScenes = {
  play(worldId, opts) { const s = new BurnsPlayScene(worldId, opts); Game.setScene(s); return s; },
  releaseWorld(scene) {
    // free GPU buffers of the world we are leaving
    try {
      const W = scene.world; if (!W || !BurnsGL.gl) return;
      for (const c of W.chunks) BurnsGL.freeGeo(c);
      for (const c of W.ghosts) BurnsGL.freeGeo(c);
      for (const G of W.groups) BurnsGL.freeGeo(G.geo);
      if (scene.pickups) for (const G of scene.pickups.groups) BurnsGL.freeGeo(G.geo);
      for (const g of W.ground.geos) BurnsGL.freeGeo(g);
      BurnsGL.freeTex(W.ground.paintT); BurnsGL.freeTex(W.lightmap.T);
    } catch (e) { /* ignore */ }
  }
};
