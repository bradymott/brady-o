/* ============================================================
   BRADY GOES TO BURNING MAN — the app: title screen (BurnsAppStart),
   story cards between worlds (BurnsStoryScene) and the title world (id 900).
   Entry point of the standalone app: Game.setScene(new BurnsAppStart())
   ============================================================ */

// the line on the story card that carries Brady INTO each world (a world's own def.story wins)
const BURNS_STORY_IN = {
  1: 'Six hundred miles on the roof of a pink RV, and the line to the gate is just beginning.',
  2: 'A ticket, a wristband, a stolen wife... and absolutely no camp.',
  16: 'Somewhere out there, bass is thumping on a bamboo dance floor.',
  17: 'A camp of tipis, a man named Jefr, and a place to call home.',
  3: 'The Man is hunting a bun-haired guy in black. Time for a costume.',
  4: 'An informant is waiting inside the Orgy Dome. Keep your pants on.',
  5: 'The great gifting warehouse never closes. Neither does the line.',
  6: 'A fire-breathing octopus is roaming the deep playa. Brady wants the keys.',
  11: 'Follow the bass, camp to camp, all night long.',
  7: 'A heart-topped sound car is playing the sun up over the playa.',
  8: 'Fuel up at Hell Station. Try not to fight DPW. Fight DPW.',
  9: 'Out past the trash fence, the Man is waiting. Again.',
  12: 'Quiet, heavy, beautiful. Even the Man takes his hat off here.',
  13: 'Build something. Break nothing. Probably break something.',
  14: 'There is only one way into the Burn now: from the sky.',
  10: 'Ride in on the yellow bike. Bring her home.',
  15: 'Exodus. The long road home, with a few detours.'
};
const BURNS_TITLE_WORLD = 900;

/* ---------------- the title world: the playa at golden hour ---------------- */
BurnsWorlds.register({
  id: BURNS_TITLE_WORLD, name: 'Brady Goes to Burning Man', sub: '', hidden: true, dayCard: false, noOutro: true,
  sky: { zen: '#2a2c6a', hor: '#ff9a62', fog: '#d89a7a', fogD: 0.0062, fogH: 0.05, haze: 0.5, fogMax: 0.88, sun: [208, 5.5], sunCol: '#ffb070', sunSize: 0.0019, moon: [30, 26], moonK: 0.5, stars: 0.12, mtnCol: '#5a3a5a', mtnH: 3.2, city: [10, 0], cityCol: '#ff6ab0', cityK: 0.3, sky: '#9a86b8', gnd: '#7a5246', key: '#ffb684', keyK: 1.0, rim: '#ffb0d8', emB: 1.5, clouds: 0.45, cloudCol: '#ffb090' },
  sky2: 'night', tod: 0.12,
  music: 'burns_hub',
  bounds: [-260, -320, 260, 220],
  spawn: { x: 8.36, y: 3.36, z: 42.4, yaw: Math.PI },
  ground: { base: '#c9a07c', crack: 0.26, mottle: 0.4, res: 0.6 },
  dust: 1.0,
  missions: [],
  build(api, g) {
    const S = BURNS_APP.state = { t: 0 };
    // the pink RV: Brady sits on the roof, the crew hangs out by the door
    api.redLightCamp(8, 40, Math.PI, { crew: ['rlVelvet', 'rlCandi', 'rlPeachy'], spots: [[-3.4, 1.5, 0.3], [-4.6, 3.2], [-3.2, -1.4]] });
    // a camp: shade, dome, string lights, fire barrel, a dancing crowd
    api.prop('shade', { x: -16, z: 6, w: 9, d: 7, col: '#e8c8a8' });
    api.prop('dome', { x: -30, z: -10, r: 6.5, col: '#ff6ad8', lights: true, glow: true });
    api.prop('barrel', { x: -9, z: 12 }); api.prop('couch', { x: -14, z: 10, yaw: Math.PI * 0.85, col: '#c83a6a' }); api.prop('chair', { x: -18, z: 11, yaw: 2.4 });
    api.crowd(-20, -2, 8, 16, { behaviors: ['dance', 'dance', 'idle'] });
    api.light(-16, 4, 18, '#ffb070', 0.6); api.light(-30, -10, 16, '#ff4fd8', 0.55); api.light(8, 36, 12, '#ff3a7a', 0.5);
    // a road of light towers and lamps toward the Man
    for (let i = 0; i < 9; i++) { const z = 10 - i * 28, x = 22 + Math.sin(i * 1.3) * 3; api.glow(x, 3.2, z, 0.9, BURNS_NEON[i % 7]); api.light(x, z, 9, BURNS_NEON[i % 7], 0.45); api.cylinder(x, 0, z, 0.08, 3.1, '#3a3440'); }
    api.prop('lightTower', { x: 34, z: -40, aim: Math.PI * 0.8 });
    // camps scattered on the horizon
    const R = api.rng;
    for (let i = 0; i < 26; i++) { const a = -1.4 + i * 0.11, d = 120 + R() * 50, x = Math.sin(a) * d, z = -Math.cos(a) * d - 30; api.prop(R() < 0.5 ? 'rv' : 'vehicle', { x, z, yaw: a + Math.PI / 2, seed: 900 + i }); if (i % 3 === 0) api.glow(x, 3.6, z, 1.2, BURNS_NEON[i % 7]); }
    for (let i = 0; i < 6; i++) api.prop('dome', { x: -70 + i * 28, z: -150 - (i % 2) * 18, r: 5 + (i % 3), col: BURNS_NEON[(i + 2) % 7], lights: true, glow: true });
    // an art car cruising a loop, a couple of bikes rolling by
    api.artCar({ x: -10, z: -40, yaw: 1.2, drivable: false, path: [[-10, -40], [30, -70], [40, -130], [-10, -150], [-50, -100], [-40, -50]], pathSpeed: 2.6, label: 'ART CAR' });
    // the Man, glowing out at the centre of the city
    const man = new BurnsManBoss(g, { x: 0, z: -230, yaw: 0, scale: 0.95, hp: 3, holdChinka: false, name: 'THE MAN', attacks: ['stomp'] });
    g.addBoss(man); S.man = man;
    api.light(0, -230, 30, '#38f2ff', 0.5);
  },
  onStart(g) {
    const p = g.player; p.locked = true; p.animOverride = 'sit'; p.ch.play('sit', null, true);
  }
});

const BURNS_APP = {
  state: null,
  // camera keyframes: [x, y, z, tx, ty, tz, fov]
  path: [
    [15.5, 5.2, 55, 2, 9, -230, 0.78],
    [32, 12, 22, -6, 7, -150, 0.85],
    [-4, 5.6, 22, -24, 2.2, -6, 0.9],
    [-34, 3.0, 18, -22, 2.4, -6, 0.86],
    [-46, 2.4, -36, 0, 4, -120, 0.9],
    [44, 22, 70, 0, 10, -150, 0.92]
  ],
  seg: 13
};

/* ---------------- the title screen ---------------- */
class BurnsAppStart extends BurnsPlayScene {
  constructor(opts) {
    super(BURNS_TITLE_WORLD, Object.assign({ fresh: true }, opts || {}));
    window.__burnsApp = true;
    this.appMenu = 'main'; this.ui = []; this.appT = 0; this.confirmNew = false;
  }
  load() {
    const sv = BurnsSave.get(), last = sv.lastWorld;
    super.load();
    sv.lastWorld = last; BurnsSave.save();
    Input.hud = null; Input.camDrag = false; Input.setMode('ui');
    this.buildMenu();
  }
  hasProgress() { const sv = BurnsSave.get(); return sv.seenIntro || BurnsSave.tokenCount() > 0 || Object.keys(sv.worldDone).length > 0; }
  buildMenu() {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), portrait = H > W, sv = BurnsSave.get(), st = Save.data.settings || {};
    const bw = Math.min(280, W * (portrait ? 0.72 : 0.34)), x = portrait ? (W - bw) / 2 : W - S.r - bw - 18;
    const list = [];
    let y = portrait ? H * 0.5 : Math.max(S.t + 96, H * 0.36);
    const b = (label, fn, primary, small) => { list.push({ x, y, w: bw, h: small ? 38 : 44, label, primary, size: small ? 12 : undefined, fn }); y += small ? 44 : 52; };
    if (this.appMenu === 'main') {
      if (this.hasProgress()) b('CONTINUE', () => this.toHub(), true);
      b(this.hasProgress() ? 'NEW GAME' : 'START', () => { if (this.hasProgress()) { this.appMenu = 'confirm'; this.buildMenu(); } else this.toHub(); }, !this.hasProgress());
      b('SETTINGS', () => { this.appMenu = 'settings'; this.buildMenu(); });
      b('CAMERA: ' + BURNS_CAM_LABELS[sv.settings.cam || 'normal'], () => { const i = BURNS_CAM_MODES.indexOf(sv.settings.cam || 'normal'); sv.settings.cam = BURNS_CAM_MODES[(i + 1) % BURNS_CAM_MODES.length]; BurnsSave.save(); this.buildMenu(); }, false, true);
    } else if (this.appMenu === 'confirm') {
      b('YES, START OVER', () => { const keep = sv.settings; Save.data.burns = null; BurnsSave._migrated = null; const d = BurnsSave.get(); d.settings = keep; BurnsSave.save(); this.appMenu = 'main'; this.toHub(); }, true);
      b('NO, KEEP MY BURN', () => { this.appMenu = 'main'; this.buildMenu(); });
    } else {
      const pct = v => Math.round((v === undefined ? 1 : v) * 100) + '%', cyc = (v, a) => a[(a.indexOf(v) + 1) % a.length];
      b('MUSIC: ' + pct(st.music), () => { st.music = cyc(Math.round((st.music === undefined ? 1 : st.music) * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); try { Sound.setMusicVolume(st.music); Save.save(); } catch (e) { /* ignore */ } this.buildMenu(); }, false, true);
      b('SOUND FX: ' + pct(st.sfx), () => { st.sfx = cyc(Math.round((st.sfx === undefined ? 1 : st.sfx) * 4) / 4, [0, 0.25, 0.5, 0.75, 1]); try { Sound.setSfxVolume(st.sfx); Save.save(); } catch (e) { /* ignore */ } this.buildMenu(); }, false, true);
      b('GRAPHICS: ' + String(sv.settings.gfx || 'auto').toUpperCase(), () => { const N = BURNS_GFX.names; sv.settings.gfx = N[(N.indexOf(sv.settings.gfx || 'auto') + 1) % N.length]; BurnsSave.save(); BurnsGL.configure(sv.settings.gfx); this.buildMenu(); }, false, true);
      b('CAMERA: ' + BURNS_CAM_LABELS[sv.settings.cam || 'normal'], () => { const i = BURNS_CAM_MODES.indexOf(sv.settings.cam || 'normal'); sv.settings.cam = BURNS_CAM_MODES[(i + 1) % BURNS_CAM_MODES.length]; BurnsSave.save(); this.buildMenu(); }, false, true);
      b('INVERT CAMERA Y: ' + (sv.settings.invertY ? 'ON' : 'OFF'), () => { sv.settings.invertY = !sv.settings.invertY; BurnsSave.save(); this.buildMenu(); }, false, true);
      b('◀ BACK', () => { this.appMenu = 'main'; this.buildMenu(); }, true, true);
    }
    list.focus = 0;
    this.ui = list;
  }
  resize() { super.resize(); this.buildMenu(); }
  firstPerson() { return false; }
  toHub() {
    burnsSfx('select');
    if (this.released) return;
    this.released = true;
    BurnsScenes.releaseWorld(this);
    // with an open world registered, CONTINUE / START go straight into the city (the prologue first, once)
    const ow = BurnsWorlds.open();
    if (ow) {
      const sv = BurnsSave.get();
      if (!sv.seenIntro) { sv.seenIntro = true; BurnsSave.save(); Game.setScene(new BurnsStoryScene({ cards: BURNS_PROLOGUE, music: 'burns_intro', then: () => BurnsScenes.play(ow) })); }
      else BurnsScenes.play(ow);
      return;
    }
    Game.setScene(new BurnsHubScene());
  }
  // the world keeps living behind the menu; Brady sits on the RV roof
  update(dt) {
    if (this.state !== 'play') return super.update(dt);
    this.t += dt; this.time += dt; this.appT += dt;
    if (Input.mode !== 'ui') Input.setMode('ui');
    const W = this.world;
    W.saveMoverPrev();
    for (const T of W.traffic) T.update(dt, this.time);
    for (const v of W.vehicles) v.idle(dt);
    for (const fn of W.updaters) fn(this, dt);
    W.stepMovers();
    for (const a of this.actors) if (!a.removed) a.update(dt);
    for (const b of this.bosses) b.update(dt);
    this.tod = clamp(0.12 + Math.max(0, this.appT - 20) * 0.004, 0.12, 0.55);
    const hit = BurnsUIKit.hitButtons(this.ui);
    if (hit) { burnsSfx('select'); hit.fn(); }
  }
  // a slow drift between keyframes (smoothstep per segment, looping)
  updateCamera(fdt) {
    const K = BURNS_APP.path, n = K.length, T = BURNS_APP.seg, t = (this.appT + 2) / T, i = Math.floor(t) % n, u = t - Math.floor(t);
    const e = u * u * (3 - 2 * u), A = K[i], B = K[(i + 1) % n], c = this.cam;
    const sway = Math.sin(this.appT * 0.21) * 0.6;
    c.x = lerp(A[0], B[0], e) + sway; c.y = lerp(A[1], B[1], e); c.z = lerp(A[2], B[2], e);
    c.tx = lerp(A[3], B[3], e); c.ty = lerp(A[4], B[4], e); c.tz = lerp(A[5], B[5], e);
    const asp = Game.cssW / Game.cssH;
    c.fov = Math.max(lerp(A[6], B[6], e), 2 * Math.atan(Math.tan(lerp(A[6], B[6], e) * 1.15 / 2) / asp));
    c.shift = 0; c.roll = 0;
  }
  postFx(env) { const fx = super.postFx(env); fx.dof = { focus: Math.hypot(this.cam.tx - this.cam.x, this.cam.tz - this.cam.z) * 0.18 + 6, aperture: 0.6 }; return fx; }
  drawOverlay2D(ctx, fdt) {
    const W = Game.cssW, H = Game.cssH, S = BurnsUI.safe(), portrait = H > W, t = this.appT;
    // soft vignette + letterbox
    const lb = H * 0.07;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);
    const g2 = portrait ? ctx.createLinearGradient(0, H * 0.4, 0, H) : ctx.createLinearGradient(W * 0.45, 0, W, 0);
    g2.addColorStop(0, 'rgba(12,6,24,0)'); g2.addColorStop(1, 'rgba(12,6,24,0.62)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
    // the title
    const a = clamp(t / 1.6, 0, 1);
    ctx.save(); ctx.globalAlpha = a;
    const tx = portrait ? W / 2 : S.l + Math.min(W * 0.3, 300), ty = portrait ? H * 0.2 : H * 0.36;
    const sz = portrait ? Math.min(40, W / 9.5) : Math.min(46, W / 15);
    BurnsUI.text(ctx, 'BRADY GOES TO', tx, ty, sz * 0.62, '#ffd84a', { glow: '#ff9a2a' });
    BurnsUI.text(ctx, 'BURNING MAN', tx, ty + sz * 0.95, sz * 1.18, '#ffffff', { glow: '#ff4fd8' });
    BurnsUI.text(ctx, 'One week. One wife. One very large wooden man.', tx, ty + sz * 1.95, 12, 'rgba(255,240,230,0.9)', { ui: true });
    ctx.restore();
    if (this.appMenu === 'confirm') BurnsUI.text(ctx, 'Start over? Your Burn will be erased.', this.ui[0].x + this.ui[0].w / 2, this.ui[0].y - 22, 12, '#ffd0f4', { ui: true });
    BurnsUIKit.drawButtons(ctx, this.ui);
    BurnsUI.text(ctx, 'v' + BURNS_VERSION + ' · ' + (BurnsGL.gl2 ? String(BurnsGL.tier).toUpperCase() : 'BASIC') + ' GRAPHICS', W - S.r - 8, H - lb / 2, 9, 'rgba(255,255,255,0.45)', { ui: true, stroke: false, align: 'right' });
    if (this.fade > 0.001) { ctx.fillStyle = `rgba(6,3,12,${this.fade})`; ctx.fillRect(0, 0, W, H); }
    this.fade = approach(this.fade, this.fadeTarget, fdt * this.fadeRate);
  }
}

/* ---------------- story card: the cinematic between two worlds ----------------
   The next world's sky at its time of day, a slow pan, the day of the week, the world's name and one line of
   story. Tap (or wait) to ride on into the next world. o: { from, to } */
class BurnsStoryScene {
  // o: { to, from } (one card leading into world `to`) or { cards: [{day, title, line, pal: [a, b, tod], man}], then() }
  constructor(o) {
    this.o = o || {}; this.env = {};
    Input.setMode('ui'); Input.hud = null; Input.camDrag = false;
    this.R = BurnsGL.init() ? new BurnsRenderer() : null;
    this.cards = this.o.cards || [{ to: this.o.to }];
    this.setCard(0);
    burnsMusic(this.o.music || 'burns_intro');
  }
  setCard(i) {
    const c = this.cards[i]; this.ci = i; this.t = 0; this.yaw0 = Math.random() * TAU;
    if (c.to !== undefined) {
      this.to = c.to;
      const m = BurnsWorlds.meta(c.to), day = String(m.day || '').toLowerCase(), def = BurnsWorlds.get(c.to);
      this.pal = /night/.test(day) ? ['dusk', 'night', 0.8] : /dawn/.test(day) ? ['night', 'dawn', 0.75] : /afternoon|arrival/.test(day) ? ['day', 'dusk', 0.55] : ['dawn', 'day', 0.8];
      this.line = (def && def.story) || BURNS_STORY_IN[c.to] || '';
      this.day = BurnsWorlds.day(c.to) || ''; this.title = `${BurnsWorlds.label(c.to)} \u00b7 ${m.name}`; this.man = true;
    } else { this.pal = c.pal || ['dusk', 'night', 0.3]; this.line = c.line || ''; this.day = c.day || ''; this.title = c.title || ''; this.man = c.man !== false; }
  }
  update(dt) {
    this.t += dt;
    const tap = Input.taps.length || Input.uiKey === 'enter' || Input.jumpPressed || Input.actionPressed;
    if ((this.t > 1.4 && tap) || this.t > (this.o.cards ? 7.5 : 9)) { if (this.ci + 1 < this.cards.length) { this.setCard(this.ci + 1); burnsSfx('select', { vol: 0.4 }); } else this.go(); }
  }
  go() {
    if (this.done) return; this.done = true;
    if (this.o.then) { this.o.then(); return; }
    const to = this.to;
    if (to && BurnsSave.isUnlocked(to) && BurnsWorlds.get(to)) BurnsScenes.play(to);
    else Game.setScene(new BurnsHubScene({ from: this.o.from }));
  }
  draw(ctx) {
    const W = Game.cssW, H = Game.cssH, dpr = Game.dpr, t = this.t, R = this.R;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (R && !BurnsGL.lost) {
      try {
        BurnsGL.configure(BurnsSave.get().settings.gfx || 'auto');
        const gw = Math.max(64, Math.round(W * Math.min(dpr, 2) * 0.75)), gh = Math.max(64, Math.round(H * Math.min(dpr, 2) * 0.75));
        R.resize(gw, gh);
        const a = this.yaw0 + t * 0.045, rise = Math.min(1, t / 6);
        const cam = { x: 0, y: 1.8 + rise * 2, z: 0, tx: Math.sin(a) * 10, ty: 1.8 + 1.4 + rise * 1.6, tz: Math.cos(a) * 10, fov: 0.95 };
        R.setCamera(cam);
        const env = BurnsEnv.build(this.pal[0], this.pal[1], clamp((this.pal[2] || 0) - 0.15 + t * 0.03, 0, 1), this.env, t);
        R.setLights(null);
        R.begin(env); R.sky(env); R.end(env, { bloom: 0.12, rays: 1.2 });
        ctx.drawImage(BurnsGL.canvas, 0, 0, gw, gh, 0, 0, Game.canvas.width, Game.canvas.height);
      } catch (e) { console.error(e); this.R = null; }
    }
    if (!this.R) { const g = ctx.createLinearGradient(0, 0, 0, Game.canvas.height); g.addColorStop(0, '#120a24'); g.addColorStop(1, '#c86a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, Game.canvas.width, Game.canvas.height); }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // the city on the horizon: camps, lights and the Man
    const hy = H * 0.66;
    ctx.fillStyle = 'rgba(20,10,24,0.9)';
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, hy);
    for (let x = 0; x <= W; x += 14) ctx.lineTo(x, hy - 4 - Math.abs(Math.sin(x * 0.07 + 1.3)) * 7 - (Math.sin(x * 0.013) > 0.6 ? 10 : 0));
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    for (let i = 0; i < 46; i++) { const x = (i * 97.3 + 13) % W; ctx.fillStyle = BURNS_NEON[i % 7]; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.fillRect(x, hy - 3 - (i % 5) * 2.5, 2, 2); }
    ctx.globalAlpha = 1;
    if (this.man) burnsDrawMan2D(ctx, W * 0.5 + Math.sin(t * 0.05) * 12, hy - 2, Math.min(0.32, H / 1100), t, true);
    if (this.cards[this.ci].rv) for (let i = 0; i < 5; i++) burnsRV2D(ctx, ((i * 170 + t * 22) % (W + 220)) - 110, hy + 8 + i * 2, 0.6 + i * 0.06, i === 2 ? '#ff7ac4' : ['#e8e0d0', '#f4f4f0', '#d8c8a8'][i % 3], true);
    // letterbox
    const lb = H * 0.1 * clamp(t / 0.6, 0, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);
    // title card
    const day = this.day || '';
    const k = clamp((t - 0.5) / 0.8, 0, 1), s = 1 + (1 - easeOut(k)) * 0.15;
    ctx.save(); ctx.globalAlpha = k;
    const ds = BurnsUI.fitSize(ctx, day.toUpperCase(), Math.min(52, W / 9), W - 40) * s;
    if (day) BurnsUI.text(ctx, day.toUpperCase(), W / 2, H * 0.3, ds, '#ffd84a', { glow: '#ff9a2a' });
    const nm = this.title || '';
    if (nm) BurnsUI.text(ctx, nm, W / 2, H * 0.3 + ds * 0.62 + 14, BurnsUI.fitSize(ctx, nm, 18, W - 40), '#ffffff', { glow: '#ff4fd8' });
    ctx.restore();
    // the story line types itself out
    const k2 = clamp((t - 1.3) / 2.2, 0, 1), shown = this.line.slice(0, Math.floor(this.line.length * k2));
    if (shown) BurnsUI.textLines(ctx, shown, W / 2, H * 0.47, 14, '#fff4ea', Math.min(W - 48, 560), 3, { ui: true });
    if (t > 1.4) BurnsUI.text(ctx, 'TAP TO CONTINUE', W / 2, H - lb - 18 + Math.sin(t * 4) * 2, 11, 'rgba(255,216,74,0.9)', { stroke: false });
    if (t < 0.5) { ctx.fillStyle = `rgba(0,0,0,${1 - t / 0.5})`; ctx.fillRect(0, 0, W, H); }
  }
  resize() { /* layout is computed per frame */ }
}

window.BRADY_BURNS = Object.assign(window.BRADY_BURNS || {}, { BurnsAppStart, BurnsStoryScene });
