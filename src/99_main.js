/* ============================================================
   Main — boot, resize, fixed-step loop
   ============================================================ */
// Which app this bundle is: 'burningman', 'world', 'kart', or 'all' (the combined test build).
const APP = typeof BRADY_APP !== 'undefined' ? BRADY_APP : 'all';
// The home scene of each app. Anything that asks for the old combined TitleScene lands here instead.
function appHomeScene() {
  if (APP === 'burningman') {
    if (typeof BurnsAppStart !== 'undefined') return new BurnsAppStart();
    if (typeof BurnsHubScene !== 'undefined') return new BurnsHubScene();
    if (window.BRADY_BURNS && window.BRADY_BURNS.BurnsHubScene) return new window.BRADY_BURNS.BurnsHubScene();
  }
  if (APP === 'kart') {
    if (typeof KartMenuScene !== 'undefined') return new KartMenuScene();
    if (window.BRADY_KART && window.BRADY_KART.KartMenuScene) return new window.BRADY_KART.KartMenuScene();
  }
  if (typeof TitleScene !== 'undefined') return new TitleScene();
  if (typeof BurnsAppStart !== 'undefined') return new BurnsAppStart();
  return null;
}
const Game = {
  quality: 1, // 1 = full post-processing; drops to 0 on slow devices
  canvas: null, ctx: null, scene: null, S: 2, dpr: 1, viewW: 900, viewH: VIEW_ROWS * TS,
  cssW: 900, cssH: 450, gameRect: { x: 0, y: 0, w: 900, h: 450 }, vignette: null, forceTouchUI: false,
  acc: 0, last: 0, frames: 0, errors: 0,

  init() {
    Save.load();
    const c = document.getElementById('game');
    this.canvas = c;
    this.ctx = c.getContext('2d', { alpha: false });
    Input.init(c);
    Sound.setMusicVolume(Save.data.settings.music);
    Sound.setSfxVolume(Save.data.settings.sfx);
    // phones and tablets show on-screen controls from the start
    this.forceTouchUI = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    Input.usingTouch = this.forceTouchUI;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.resize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 250));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (typeof Play !== 'undefined' && this.scene instanceof Play && !this.scene.paused && (this.scene.state === 'play' || this.scene.state === 'intro')) this.scene.openPause();
        Sound.suspend(); Save.save();
      } else { if (!(typeof Play !== 'undefined' && this.scene instanceof Play && this.scene.paused)) Sound.resume(); this.last = performance.now(); }
    });
    window.addEventListener('pagehide', () => Save.save());
    this.setScene(appHomeScene());
    this.last = performance.now();
    requestAnimationFrame(t => this.frame(t));
    this.requestWakeLock();
  },

  requestWakeLock() {
    try {
      if (navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(l => { this.wakeLock = l; }).catch(() => {});
        document.addEventListener('visibilitychange', () => { if (!document.hidden && navigator.wakeLock) navigator.wakeLock.request('screen').then(l => { this.wakeLock = l; }).catch(() => {}); });
      }
    } catch (e) { /* not available */ }
  },

  resize() {
    measureInsets();
    const vv = window.visualViewport;
    const cssW = Math.max(200, Math.round(vv ? vv.width : window.innerWidth));
    const cssH = Math.max(200, Math.round(vv ? vv.height : window.innerHeight));
    const hq = Save.data && Save.data.settings.hq;
    const cap = this.dprCap || (hq ? 3 : 2);
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, hq ? 3 : 2, cap));
    this.cssW = cssW; this.cssH = cssH; this.dpr = dpr;
    this.canvas.width = Math.round(cssW * dpr); this.canvas.height = Math.round(cssH * dpr);
    this.canvas.style.width = cssW + 'px'; this.canvas.style.height = cssH + 'px';
    const portrait = cssH > cssW * 1.05;
    let gr;
    if (portrait) {
      const gh = Math.round(Math.min(cssH * 0.6, cssW * 1.3));
      gr = { x: 0, y: Math.round(Math.max(0, insets.t)), w: cssW, h: gh };
    } else gr = { x: 0, y: 0, w: cssW, h: cssH };
    this.gameRect = gr;
    this.S = (gr.h * dpr) / (VIEW_ROWS * TS);
    this.viewH = VIEW_ROWS * TS;
    this.viewW = (gr.w * dpr) / this.S;
    // vignette
    // vignette pre-rendered at the game view's exact pixel size (no per-frame scaling)
    const vw = Math.round(this.viewW * this.S), vh = Math.round(this.viewH * this.S);
    const v = makeCanvas(vw, vh), vx = v.getContext('2d');
    vx.save(); vx.translate(vw / 2, vh / 2); vx.scale(vw / 256, vh / 256);
    const g = vx.createRadialGradient(0, 0, 60, 0, 0, 182);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    vx.fillStyle = g; vx.fillRect(-128, -128, 256, 256); vx.restore();
    this.vignette = v;
    Input.computeLayout(cssW, cssH, gr);
    if (this.scene && this.scene.resize) this.scene.resize();
    // the 2D game's Play scene only exists in the apps that bundle it (the Burning Man app doesn't)
    const isPlay = typeof Play !== 'undefined' && this.scene instanceof Play;
    if (isPlay && this.scene.paused) this.scene.pauseUI = buildPauseUI(this.scene);
    if (isPlay && this.scene.state === 'results') this.scene.buildResultsUI();
  },

  setScene(s) {
    // in the Burning Man and Art Cart apps, "back to the title" means that app's own home screen
    if ((APP === 'burningman' || APP === 'kart') && typeof TitleScene !== 'undefined' && s instanceof TitleScene) s = appHomeScene();
    this.scene = s;
    Input.taps.length = 0;
  },

  frame(now) {
    requestAnimationFrame(t => this.frame(t));
    let dt = (now - this.last) / 1000;
    this.last = now;
    if (dt > 0.25) dt = 0.25;
    if (dt < 0) dt = 0;
    // adaptive resolution: if frames are consistently slow, render fewer pixels
    if (dt > 0.026 && dt < 0.2) this.slowT = (this.slowT || 0) + dt; else this.slowT = Math.max(0, (this.slowT || 0) - dt * 0.5);
    if (this.slowT > 2.5 && (this.lowered || 0) < 2 && this.dpr > 1) {
      this.lowered = (this.lowered || 0) + 1; this.slowT = 0;
      this.dprCap = Math.max(1, this.dpr - 0.5);
      this.resize();
    } else if (this.slowT > 2.5 && this.quality >= 1) {
      // already at the lowest resolution step: drop the expensive post effects instead
      this.quality = 0; this.slowT = 0;
    }
    this.acc += dt;
    Input.pollGamepad();
    let steps = 0;
    try {
      while (this.acc >= STEP && steps < 30) {
        this.scene.update(STEP);
        this.acc -= STEP; steps++;
        if (steps === 1) Input.endFrame();
      }
    } catch (e) { this.reportError(e); this.acc = 0; }
    try {
      const ctx = this.ctx;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#07040e'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.scene.draw(ctx);
      if (this.gameRect.h < this.cssH - 2 && typeof Play !== 'undefined' && this.scene instanceof Play) this.drawPortraitPad(ctx);
    } catch (e) { this.reportError(e); }
    this.frames++;
  },

  drawPortraitPad(ctx) {
    // controller area under the game view in portrait
    const gr = this.gameRect;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const y = gr.y + gr.h;
    const g = ctx.createLinearGradient(0, y, 0, this.cssH);
    g.addColorStop(0, '#140c22'); g.addColorStop(1, '#07040e');
    ctx.fillStyle = g; ctx.fillRect(0, y, this.cssW, this.cssH - y);
    ctx.fillStyle = 'rgba(255,79,216,0.5)'; ctx.fillRect(0, y, this.cssW, 2);
    if (!(this.scene.paused)) Input.drawControls(ctx, 1);
  },

  reportError(e) {
    this.errors++;
    if (this.errors < 5) console.error(e);
    window.__bradyErrors = (window.__bradyErrors || []);
    window.__bradyErrors.push(String(e && e.stack || e));
  }
};

function boot() {
  const start = () => { try { Game.init(); } catch (e) { console.error(e); document.body.insertAdjacentHTML('beforeend', '<p style="color:#fff;font:14px sans-serif;padding:20px">The game could not start: ' + String(e) + '</p>'); } };
  // wait briefly for web fonts so the first frames use them
  let done = false;
  const go = () => { if (!done) { done = true; start(); } };
  try {
    if (document.fonts && document.fonts.load) {
      Promise.all([document.fonts.load('20px "Bungee"'), document.fonts.load('14px "Rubik"')]).then(go, go);
      setTimeout(go, 1500);
    } else go();
  } catch (e) { go(); }
}
window.__iconDraw = (x, hair) => drawBrady(x, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: 'idle', t: 0, phase: 0 }, hair, look: Save.data ? Save.data.look : { hair: 0, skin: 1 }, time: 0 });
// home-screen icon: sunset over the playa, the Man glowing behind Brady
window.__iconScene = (x, N, maskable) => {
  x.save(); x.scale(N / 512, N / 512);
  const g = x.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, '#1a0838'); g.addColorStop(0.45, '#6a1a6a'); g.addColorStop(0.75, '#e2503a'); g.addColorStop(1, '#ffb85a');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 60; i++) { x.fillStyle = `rgba(255,255,255,${0.25 + (i * 37 % 10) / 14})`; x.fillRect((i * 97) % 512, (i * 53) % 200, 2, 2); }
  // the Man, glowing
  x.save(); x.globalCompositeOperation = 'lighter';
  const r = x.createRadialGradient(360, 250, 10, 360, 250, 220); r.addColorStop(0, 'rgba(255,200,120,0.75)'); r.addColorStop(1, 'rgba(255,80,40,0)');
  x.fillStyle = r; x.fillRect(0, 0, 512, 512); x.restore();
  x.save(); x.translate(362, 420); x.scale(2.1, 2.1); drawManFigure(x, 0, 0, 1, '#2a0a10', '#ffb060'); x.restore();
  // playa horizon
  x.fillStyle = '#3a1a2a'; x.fillRect(0, 420, 512, 92);
  const pg = x.createLinearGradient(0, 420, 0, 512); pg.addColorStop(0, '#c88a6a'); pg.addColorStop(1, '#8a5a4a');
  x.fillStyle = pg; x.fillRect(0, 424, 512, 88);
  // Brady, big and front
  const hair = []; for (let i = 0; i < 7; i++) hair.push({ x: -5 - i * 1.1, y: -57 + i * 4.5, px: -5 - i * 1.1, py: -57 + i * 4.5 });
  const k = maskable ? 6.2 : 7.4;
  x.save(); x.translate(maskable ? 210 : 196, maskable ? 560 : 610); x.scale(k, k);
  window.__iconDraw(x, hair);
  x.restore();
  x.restore();
};
// Super Brady-O World icon: Brady leaping past a globe with a plane trail
window.__iconWorld = (x, N, maskable) => {
  x.save(); x.scale(N / 512, N / 512);
  const g = x.createLinearGradient(0, 0, 0, 512); g.addColorStop(0, '#2a6ad8'); g.addColorStop(1, '#8ad0ff');
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  const cx = 300, cy = 300, R = maskable ? 150 : 175;
  const og = x.createRadialGradient(cx - 50, cy - 60, 20, cx, cy, R); og.addColorStop(0, '#5ac8ff'); og.addColorStop(1, '#1a5ab8');
  x.fillStyle = og; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
  x.save(); x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.clip();
  x.fillStyle = '#4ac860';
  for (const [ox, oy, rx, ry, rot] of [[-60, -70, 70, 45, 0.4], [40, 20, 55, 90, -0.3], [-90, 60, 40, 60, 0.2], [100, -90, 50, 30, 0.1]]) { x.beginPath(); x.ellipse(cx + ox, cy + oy, rx, ry, rot, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = 'rgba(255,255,255,0.35)'; x.lineWidth = 3;
  for (let k = -2; k <= 2; k++) { const ly = cy + k * R * 0.36, lw = Math.sqrt(Math.max(0, 1 - (k * 0.36) * (k * 0.36))) * R; x.beginPath(); x.ellipse(cx, ly, lw, lw * 0.12, 0, 0, Math.PI * 2); x.stroke(); }
  for (let k = 0; k <= 2; k++) { x.beginPath(); x.ellipse(cx, cy, R * k * 0.38 + 2, R, 0, 0, Math.PI * 2); x.stroke(); }
  x.restore();
  // plane and dotted trail
  x.setLineDash([10, 12]); x.strokeStyle = '#ffffff'; x.lineWidth = 6; x.beginPath(); x.moveTo(60, 380); x.quadraticCurveTo(180, 90, 430, 110); x.stroke(); x.setLineDash([]);
  x.fillStyle = '#ffffff'; x.save(); x.translate(440, 108); x.rotate(0.1); x.beginPath(); x.moveTo(30, 0); x.lineTo(-20, -14); x.lineTo(-10, 0); x.lineTo(-20, 14); x.closePath(); x.fill(); x.restore();
  // Brady mid-leap
  if (typeof drawBrady !== 'undefined') {
    x.save(); x.translate(maskable ? 170 : 150, maskable ? 400 : 420); x.scale(maskable ? 4.4 : 5, maskable ? 4.4 : 5);
    drawBrady(x, { x: 0, y: 0, facing: 1, small: false, power: 0, anim: { state: 'jump', t: 0, phase: 0 }, hair: null, look: Save.data ? Save.data.look : { hair: 0, skin: 1 }, time: 0 });
    x.restore();
  }
  x.restore();
};
// Art Cart icon: the art-car title card art, filling the square
window.__iconKart = (x, N, maskable) => {
  if (typeof TitleScene !== 'undefined' && TitleScene.prototype.cardArt) {
    x.save();
    const pad = maskable ? N * 0.1 : 0;
    x.fillStyle = '#2a0a3a'; x.fillRect(0, 0, N, N);
    TitleScene.prototype.cardArt.call({}, x, { id: 'kart' }, 0.35, pad, pad, N - pad * 2, N - pad * 2);
    x.restore();
  }
};
window.BRADY = {};
['LookScene', 'SettingsScene', 'CreditsScene', 'Game', 'Save', 'getLevel', 'Validator', 'WORLDS', 'WORLD_ORDER', 'CLASSIC_WORLDS', 'WORLD3_REGIONS', 'WorldGame', 'Input', 'Sound', 'THEMES', 'Play', 'MapScene', 'TitleScene', 'StoryScene', 'EndingScene', 'GameOverScene', 'goToMap', 'startGame', 'appHomeScene']
  .forEach(k => { try { const v = eval(k); if (v !== undefined) window.BRADY[k] = v; } catch (e) { /* not in this app */ } });
window.BRADY.APP = APP;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
