// Pupo, PU-3: PUPO POWER! (docs/design/PUPO.md §3, §7.10).
// Node sections (the real game modules in a VM, the lab fixture 'power'): meter (fill, pokes, hits, start), button (only
// while riding, early press, keys), targets (16 cap, view + 1 tile, bosses and friends left out, the rest stunned,
// hit() -> false stunned, projectiles -> butterflies), freeze (the world holds, the timers hold), shield (no hits during the show
// and for 1.5 s after), tiers (every tier and FX CALM draws every beat without an error).
// Browser section 'alloc' (Chromium with --expose-gc, a private build: BRADY_DIST=<dist>): the show's own update and draw
// allocate nothing (heap delta over 300 frames with the young generation large enough not to be collected), and 300 frames
// of the whole game during the show leave under 50 KB of heap growth after the first run.
// usage: node tools/sbw_pupo_power_test.js [section ...]      (alloc runs only when named or with --browser)
const path = require('path'), fs = require('fs');
const { boot, checker } = require('./sbw_pupo_lib');
const G = boot(), C = checker();
const args = process.argv.slice(2), browser = args.includes('--browser') || args.includes('alloc'), want = args.filter(a => !a.startsWith('--'));
const { T, TS } = G;
const R0 = G.run('PupoRide'), PP = G.run('PupoPower'), FX = G.run('PupoPowerFx'), PB = G.run('PupoButton'), I = G.run('Input');
const near = (a, b, eps) => Math.abs(a - b) <= eps;
const put = (g, tx, feetY) => { const p = g.player; p.x = tx * TS + TS / 2 - p.w / 2; p.y = feetY - p.h; p.vx = 0; p.vy = 0; p.onGround = false; };
const FLOOR = 10 * TS;
function ride() {
  const g = G.lab('power'); G.step(g, 0.2); g.bumpBlock(7, 9, false, g.player); G.step(g, 1.3);
  const f = g.pupo.free; R0.mount(g.player, false, { x: f.cx, y: f.y + f.h }); f.remove = true; put(g, 20, FLOOR); G.step(g, 0.4);
  return g;
}
const foe = (g, x, type, feet) => { const E = G.run('ENTITY_TYPES.' + (type || 'mxElote')); const e = new E(g, { type: type || 'mxElote', x, y: feet || FLOOR, dir: -1 }); e.vx = 0; e.speed = 0; g.spawn(e); return e; };
const fire = g => { PP.key = true; G.step(g, 1 / 120); };
// a touch layout for the button (Input.layout is made by the browser's resize)
I.layout = { r: 40, lefty: false, portrait: false, action: { x: 760, y: 300, r: 31 }, jump: { x: 680, y: 340, r: 40 }, stickHome: { x: 80, y: 300, r: 46 }, pause: { x: 822, y: 22, r: 20 }, split: 380 };

C.section(want, 'meter', () => {
  const g = ride(), R = g.pupo;
  C.check('the first mount in a level run starts the meter at 0.5', near(R.meter, 0.5 + 0.4 / 30 + 0.2 / 30, 0.03), R.meter);
  R.meter = 0; G.step(g, 3);
  C.check('it fills over 30 s of riding (+1/30 a second)', near(R.meter, 0.1, 0.005), R.meter);
  R.meter = 0; R.drowsyT = 9; G.step(g, 3);
  C.check('drowsy: half that', near(R.meter, 0.05, 0.005), R.meter);
  R.drowsyT = 0; R.meter = 0.6; R.shieldT = 0; g.player.hurt({ x: g.player.x + 50, w: 10 });
  C.check('a hit on Pupo takes 25 % off', near(R.meter, 0.35, 0.005), R.meter);
  R0.dismount(g.player, 'hop'); const m = R.meter; G.step(g, 2);
  C.check('nothing fills it while Pupo is not ridden', R.meter === m);
});

C.section(want, 'button', () => {
  let g = G.lab('power'); G.step(g, 0.3);
  C.check('no Pupo button without Pupo', I.hud !== PB.hud);
  g = ride(); const R = g.pupo; G.step(g, 0.05);
  C.check('riding: the Pupo button is registered where the picker chip would be (Input.hud)', I.hud === PB.hud && PB.hud[0].r >= 22 && PB.hud[0].r <= 34, PB.hud[0]);
  R.meter = 0.4; I.hudPressed.pupo = true; G.step(g, 1 / 120);
  C.check('pressed early: no show, a bonk and the ring shakes once', !(R.showT > 0) && R.ringShake > 0 && near(R.meter, 0.4, 0.01));
  R.meter = 1; I.hudPressed.pupo = true; G.step(g, 1 / 120);
  C.check('pressed with the meter full: the show starts and the meter empties', R.showT > 0 && R.meter === 0);
  G.step(g, 3);
  R.meter = 1; PP.key = true; G.step(g, 1 / 120);
  C.check('keyboard F / L fires it too', R.showT > 0);
  G.step(g, 3); R0.dismount(g.player, 'hop'); G.step(g, 0.05);
  C.check('off Pupo: the button goes away', I.hud !== PB.hud);
});

C.section(want, 'targets', () => {
  const g = ride(), p = g.player, R = g.pupo;
  const es = []; for (let i = 0; i < 20; i++) es.push(foe(g, p.cx + (i % 2 ? 1 : -1) * (60 + (i >> 1) * 30), i % 3 ? 'mxElote' : 'mxChihuahua'));
  const far = foe(g, p.cx + 2 * Game_viewW(), 'mxElote');
  const boss = foe(g, p.cx + 90, 'mxElote'); boss.boss = true;
  const friend = foe(g, p.cx - 90, 'mxElote'); friend.befriend();
  const armour = foe(g, p.cx + 120, 'mxElote'); armour.hit = () => false; es.push(armour);
  G.step(g, 0.05); const Shot = G.run('TourShot'); const sh = new Shot(g, p.cx + 100, p.y - 40, { vx: -10, vy: 0, life: 9 }); g.spawn(sh); R.meter = 1; fire(g);
  const targets = FX.targets.slice(), nearest = targets.every((e, i) => i === 0 || Math.abs(targets[i - 1].cx - p.cx) <= Math.abs(e.cx - p.cx) + 1);
  C.check('at most 16 targets, nearest first, none off the view (+1 tile), no boss, no friend', targets.length === 16 && nearest && !targets.includes(far) && !targets.includes(boss) && !targets.includes(friend), { n: targets.length, nearest });
  const over = es.filter(e => !targets.includes(e));
  C.check('past 16 they are stunned for 3 s', over.length > 0 && over.every(e => e.stunT > 2.9), over.map(e => e.stunT));
  C.check('every projectile on screen turns into a butterfly', sh.remove && FX.bfs.some(b => b.on));
  G.step(g, 2.7);
  C.check('the hits at the pop: the targets are defeated (coins drop), a hit() -> false enemy is stunned 6 s', targets.filter(e => e !== armour).every(e => e.dead) && (targets.includes(armour) ? armour.stunT > 5 : true) && g.entities.some(e => e.constructor.name === 'GearCoin'), { dead: targets.filter(e => e.dead).length });
  C.check('the boss and the friend are untouched', !boss.dead && !(boss.stunT > 0) && friend.friendT > 0);
  function Game_viewW() { return 844; }
});

C.section(want, 'freeze', () => {
  const g = ride(), p = g.player, R = g.pupo, A = g.area;
  const e = foe(g, p.cx + 6 * TS, 'mxElote'); e.speed = 1.2 * TS; e.vx = -1.2 * TS; G.step(g, 0.05);
  const far = foe(g, p.cx + 40 * TS, 'mxElote'); far.vx = -40; far.speed = 40;
  p.vx = 3 * TS; p.onGround = false; p.vy = -5 * TS; G.step(g, 1 / 120);
  R.meter = 1; fire(g);
  const s = { ex: e.x, fx: far.x, px: p.x, py: p.y, t: g.t, time: g.timeLeft };
  G.step(g, 2.0);
  C.check('the world holds for the show: enemies, Brady (even in mid-air), the play clock and the level timer', e.x === s.ex && far.x === s.fx && p.x === s.px && p.y === s.py && g.t === s.t && g.timeLeft === s.time, { e: e.x - s.ex, p: p.y - s.py, t: g.t - s.t });
  G.step(g, 0.7);
  C.check('it ends at 2.6 s and play resumes', !(R.showT > 0) && (G.step(g, 0.1), g.t > s.t));
});

C.section(want, 'shield', () => {
  const g = ride(), p = g.player, R = g.pupo;
  R.meter = 1; fire(g); G.step(g, 1.0);
  p.hurt({ x: p.x + 40, w: 10 });
  C.check('no hits during the show', !(R.drowsyT > 0) && p.pupoRide);
  G.step(g, 1.7);
  C.check('then a 1.5 s Pupo shield (the three stars), with no invuln flicker', R.shieldT > 1.3 && R.powerShield === 1 && !(p.invuln > 0), { shield: R.shieldT });
  p.hurt({ x: p.x + 40, w: 10 });
  C.check('a hit inside the shield is ignored', !(R.drowsyT > 0));
  G.step(g, 1.5); p.hurt({ x: p.x + 40, w: 10 });
  C.check('after the shield a hit counts again', R.drowsyT > 0);
});

C.section(want, 'tiers', () => {
  const ctx = G.run("document.createElement('canvas').getContext('2d')"), QT = G.run('QualityTier'), S = G.run('Save');
  let err = null, ok = 0;
  for (const [lvl, calm] of [[0, false], [2, false], [5, false], [0, true]]) {
    QT.pin(lvl);
    const g = ride(), p = g.player; S.data.settings.reduceMotion = calm; for (let i = 0; i < 6; i++) foe(g, p.cx + (i - 3) * 70 + 35, 'mxChihuahua');
    G.step(g, 0.05); g.pupo.meter = 1; fire(g);
    const exp = [[12, 24], [8, 12], [4, 6], [12, 6]][[0, 2, 5].indexOf(lvl) >= 0 && !calm ? [0, 2, 5].indexOf(lvl) : 3];
    const arms = FX.arms.filter(a => a.on).length;
    for (let k = 0; k < 28; k++) { G.step(g, 0.1); try { g.draw(ctx); ok++; } catch (e) { err = err || String(e.stack).slice(0, 400); } }
    C.check(`tier ${lvl}${calm ? ' + FX CALM' : ''}: ${arms} arms (cap ${exp[0]}), every beat draws`, !err && arms <= exp[0] && arms >= Math.min(exp[0], 5) && FX.calm === calm && FX.tier === (lvl >= 5 ? 2 : lvl >= 2 ? 1 : 0), err);
  }
  QT.pin(0); S.data.settings.reduceMotion = false;
  // gameplay is identical at every tier: the same targets defeated at the same moment
  const outcome = lvl => { QT.pin(lvl); const g = ride(), p = g.player, es = []; for (let i = 0; i < 6; i++) es.push(foe(g, p.cx + (i - 3) * 70 + 35, 'mxElote')); G.step(g, 0.05); g.pupo.meter = 1; fire(g); let at = null; for (let k = 0; k < 300 && at == null; k++) { G.step(g, 1 / 120); if (es.every(e => e.dead)) at = g.pupo.showT; } return [es.filter(e => e.dead).length, at && Math.round(at * 100)]; };
  const o0 = outcome(0), o1 = outcome(2), o2 = outcome(5); QT.pin(0);
  C.check('gameplay is identical at every tier (same targets, same moment)', JSON.stringify(o0) === JSON.stringify(o1) && JSON.stringify(o1) === JSON.stringify(o2), { o0, o1, o2 });
});

C.section(want, 'static', () => {
  // the per-frame code of the show: no new, array literals, closures, template strings, gradients or Ink.around (PUPO.md §3.6)
  const Pupo = G.run('Pupo'), fns = { 'PupoPowerFx.update': FX.update, 'PupoPowerFx.draw': FX.draw, 'PupoPowerFx.screen': FX.screen, 'PupoPowerFx.armTip': FX.armTip, 'PupoPowerFx.drawTongue': FX.drawTongue,
    'PupoPowerFx.rugSeg': FX.rugSeg, 'PupoPowerFx.roll': FX.roll, 'PupoPowerFx.fringe': FX.fringe, 'PupoPowerFx.boopAt': FX.boopAt, 'PupoPowerFx.anchorsNow': FX.anchorsNow, 'PupoPower.step': PP.step,
    'Pupo.arm': Pupo.arm, 'Pupo.hand': Pupo.hand, 'Pupo.claw': Pupo.claw, 'Pupo.spiralEye': Pupo.spiralEye, 'Pupo.butterfly': Pupo.butterfly, 'Pupo.anchors': Pupo.anchors, 'Pupo.setPt': Pupo.setPt };
  const bad = [];
  for (const [n, f] of Object.entries(fns)) {
    const src = String(f), body = src.slice(src.indexOf('{') + 1);
    const hits = [[/\bnew\s/, 'new'], [/=>/, 'closure'], [/\bfunction\b/, 'closure'], [/`/, 'template string'], [/(^|[=(,:?]\s*)\[/m, 'array literal'], [/\{\s*[a-zA-Z_]+\s*:/, 'object literal'], [/create(Linear|Radial)Gradient/, 'gradient'], [/Ink\.around/, 'Ink.around']].filter(([re]) => re.test(body)).map(h => h[1]);
    if (hits.length) bad.push(n + ': ' + hits.join(', '));
  }
  C.check('the show\'s per-frame code makes no objects, arrays, closures, strings or gradients and uses no Ink.around', !bad.length, bad);
});

/* ---------- the browser part: allocation ---------- */
async function alloc() {
  const { chromium } = require('playwright');
  const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
  const appPage = path.join(dist, 'site', 'super-brady-o-world', 'index.html');
  const labSrc = fs.readFileSync(path.join(__dirname, 'fixtures', 'sbw_pupo_lab.js'), 'utf8');
  const MUTE = `(() => { const BAC = window.BaseAudioContext || window.AudioContext; if (!BAC) return; const d = Object.getOwnPropertyDescriptor(BAC.prototype, 'destination'); if (!d || !d.get) return;
    Object.defineProperty(BAC.prototype, 'destination', { configurable: true, get() { if (!this.__mute) { const real = d.get.call(this); const g = this.createGain(); g.gain.value = 0; g.connect(real); this.__mute = g; } return this.__mute; } }); })();`;
  const b = await chromium.launch({ args: ['--js-flags=--expose-gc --min-semi-space-size=64 --max-semi-space-size=64', '--enable-precise-memory-info'] });
  try {
    const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    await ctx.addInitScript(MUTE);
    const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
    await page.goto('file://' + appPage); await page.waitForTimeout(1500); await page.evaluate(labSrc);
    const r = await page.evaluate(() => {
      const B = window.BRADY, T = window.BRADY_TOUR, PU = window.BRADY_PUPO, I = B.Input, G = B.Game;
      const sim = (sec, inp) => { const n = Math.round(sec * 120); for (let k = 0; k < n; k++) { if (inp) Object.assign(I, inp); G.scene.update(1 / 120); I.jumpPressed = false; I.actionPressed = false; } if (inp) for (const key in inp) I[key] = false; };
      const spec = window.SBW_PUPO_LAB.levels.power, lvl = T.TourBuild.fromSpec(T.Tour.countries.mx, spec, 90);
      B.Save.data.lives = 9; const g = new B.Play(lvl, {}); G.setScene(g); g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
      // stop the real loop: the frames below are stepped by hand
      G.loop = G.loop || null; const raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 0;
      sim(0.2); g.bumpBlock(7, 9, false, g.player); sim(1.3); const f = g.pupo.free; PU.PupoRide.mount(g.player, true, { x: f.cx, y: f.y + f.h }); f.remove = true; sim(0.3);
      const p = g.player; for (let i = 0; i < 10; i++) { const E = B.ENTITY_TYPES[i % 2 ? 'mxElote' : 'mxChihuahua']; const e = new E(g, { type: 'x', x: p.cx + (i % 2 ? 1 : -1) * (70 + (i >> 1) * 60), y: p.y + p.h, dir: -1 }); e.vx = 0; e.speed = 0; g.spawn(e); }
      sim(0.1);
      const cv = document.createElement('canvas'); cv.width = 844 * 3; cv.height = 390 * 3; const c2 = cv.getContext('2d');
      const mem = () => performance.memory.usedJSHeapSize;
      const FX = PU.PupoPowerFx, R = g.pupo;
      // the first run: caches warm up (the text and rug canvases, the arm pool)
      R.meter = 1; PU.PupoPower.start(g); for (let k = 0; k < 320 && R.showT > 0; k++) { g.update(1 / 120); g.draw(G.ctx); }
      // 1. the show's own update and draw, 300 frames: young-generation bytes (boxed numbers only: nothing in this code makes an
      // object, array, closure or string, see the 'static' section) and what is left after a collection
      R.meter = 1; PU.PupoPower.start(g); const ctxW = G.ctx;
      const fxFrames = n => { let t = 1e-6; for (let k = 0; k < n; k++) { const t0 = t; t = 0.01 + (k % 250) * 0.0104; R.showT = t; FX.update(g, t0, t, 1 / 120); c2.setTransform(3, 0, 0, 3, -g.camX * 3, -g.camY * 3); FX.draw(c2, p, g, R, g.t); c2.setTransform(3, 0, 0, 3, 0, 0); FX.screen(c2, g); } };
      fxFrames(3000);   // warm: the code is optimized, as in play
      window.gc(); window.gc(); const m0 = mem(); fxFrames(300); const fxBytes = mem() - m0; window.gc(); window.gc(); const fxLeft = mem() - m0;
      const frames = 300;
      // 2. the whole game: 300 frames of the show (restarted when it ends), then 4 s of play to let the confetti, coins and
      // particles finish, a collection: compared with the same settle before
      R.showT = 0; PU.PupoPower.end(g);
      const settle = () => { for (let k = 0; k < 480; k++) { g.update(1 / 120); if (k % 2) g.draw(ctxW); } };
      const run = () => { let n = 0; for (let k = 0; k < 300; k++) { if (!(R.showT > 0)) { for (const e of g.entities) if (e.enemy && e.knocked) { e.dead = false; e.knocked = false; e.remove = false; } R.meter = 1; PU.PupoPower.start(g); n++; } g.update(1 / 120); g.draw(ctxW); } if (R.showT > 0) { R.showT = 0; PU.PupoPower.end(g); } return n; };
      // the same 300 frames of plain riding (the control: what the game itself keeps, Pupo's show or not)
      const plain = () => { for (let k = 0; k < 300; k++) { g.update(1 / 120); g.draw(ctxW); } };
      // the engine's own bounded caches (held ink pictures, box owners, particle pools) fill up over the first runs
      for (let w = 0; w < 5; w++) { run(); settle(); } window.gc(); window.gc(); const h0 = mem();
      const shows = run(); settle(); window.gc(); window.gc(); const h1 = mem();
      plain(); settle(); window.gc(); window.gc(); const c0 = mem(); plain(); settle(); window.gc(); window.gc(); const c1 = mem();
      // 3. for comparison: young-generation bytes per frame of the whole game, riding and during the show
      window.gc(); const r0 = mem(); for (let k = 0; k < 300; k++) { g.update(1 / 120); g.draw(ctxW); } const ride = mem() - r0;
      R.meter = 1; PU.PupoPower.start(g); window.gc(); const s0 = mem(); for (let k = 0; k < 300; k++) { if (!(R.showT > 0)) { R.meter = 1; PU.PupoPower.start(g); } g.update(1 / 120); g.draw(ctxW); } const show = mem() - s0;
      window.requestAnimationFrame = raf;
      return { frames, fxBytes, fxLeft, fxPerFrame: Math.round(fxBytes / 300), growth: h1 - h0, control: c1 - c0, shows, ridePerFrame: Math.round(ride / 300), showPerFrame: Math.round(show / 300) };
    });
    C.check(`the show's own update and draw leave nothing behind: ${r.fxLeft} bytes after 300 frames and a collection (${r.fxPerFrame} short-lived bytes a frame: boxed numbers)`, r.fxLeft < 4096, r);
    C.check(`300 frames of the whole game during the show leave ${(r.growth / 1024).toFixed(1)} KB of heap after collection, ${((r.growth - r.control) / 1024).toFixed(1)} KB more than 300 frames of plain riding (${(r.control / 1024).toFixed(1)} KB) (< 50 KB, after the first run)`, r.growth - r.control < 50 * 1024, r);
    console.log(`  for comparison, young-generation bytes per frame (whole game): riding ${r.ridePerFrame}, during the show ${r.showPerFrame}`);
    C.check('no page errors', errors.length === 0, errors.slice(0, 3));
  } finally { await b.close(); }
}

(async () => {
  if (browser) { console.log('== alloc'); try { await alloc(); } catch (e) { C.check('alloc runs', false, String(e.stack).slice(0, 600)); } }
  C.done();
})();
