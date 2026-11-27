// Super Brady-O World, "keep it" (src/29_tour_zz_carry.js), in headless Chromium (silent):
//   door    the invincibility star (and its song) survives a secret room's door, both ways (3-5's locker room)
//   coins   the coin count is a running total: kept across levels, lands, the map and a reload (the app closed);
//           it never rolls over at 100, and every 100 coins collected still give a 1UP; an old save keeps its coins
//   title   the title asks for its own theme, which starts on the first touch (and a key works too), then the
//           story / map song takes over
// usage: BRADY_DIST=<dist> node tools/sbw_keep_test.js [shotsDir]
const { chromium } = require('playwright');
const { silence } = require('./sbw_silent');
const path = require('path'), fs = require('fs');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const app = [path.join(dist, 'site', 'super-brady-o-world', 'index.html'), path.join(dist, 'brady-o.html')].find(f => fs.existsSync(f));
const shots = process.argv[2] || null;
if (shots) fs.mkdirSync(shots, { recursive: true });
let failures = 0;
const check = (name, ok, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + (info !== undefined ? '  ' + JSON.stringify(info) : '')); if (!ok) failures++; };

const helpers = () => {
  window.S = () => window.BRADY.Game.scene;
  window.sim = (sec, inp) => { const B = window.BRADY, G = B.Game, I = B.Input; for (let k = 0, n = Math.round(sec * 120); k < n; k++) { if (inp) Object.assign(I, inp); G.scene.update(1 / 120); const p = G.scene.player; if (p && !p.dead) p.invuln = Math.max(p.invuln || 0, 0.3); } if (inp) for (const key in inp) I[key] = false; };
  window.start = id => { const B = window.BRADY, [w, i] = id.split('-').map(Number); B.Save.data.lives = Math.max(B.Save.data.lives, 5); B.Game.setScene(new B.Play(B.getLevel(w, i), {})); sim(2); const g = S(); g.fade.a = 0; g.fade.target = 0; return g; };
  // walk Brady over the next n coins of this area (the real tile pickup)
  window.grab = n => { const B = window.BRADY, g = S(), A = g.area; let k = 0; for (let ty = 0; ty < A.H && k < n; ty++) for (let tx = 0; tx < A.W && k < n; tx++) if (A.tiles[ty * A.W + tx] === B.T.PICK) { const p = g.player; p.x = tx * B.TS + B.TS / 2 - p.w / 2; p.y = ty * B.TS + B.TS - p.h; p.vx = 0; p.vy = 0; sim(1 / 60); k++; } return k; };
  window.clearLevel = () => { const g = S(); const gate = g.entities.find(e => e instanceof window.BRADY.Gate && !e.secret) || { cx: g.player.cx, y: g.player.y, exitKey: 'main' }; g.levelClear(gate); sim(9); return g.state; };
};

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); await silence(context);
  const errors = [];
  let page = await context.newPage();
  const watch = p => { p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); };
  watch(page);
  const shot = n => shots ? page.screenshot({ path: path.join(shots, n), timeout: 60000 }) : null;
  const ev = (fn, a) => page.evaluate(fn, a);

  /* ---------- title ---------- */
  await page.goto('file://' + app); await page.waitForTimeout(2600); await ev(helpers);
  const t0 = await ev(() => { const B = window.BRADY; return { scene: B.Game.scene.constructor.name, track: B.Sound.currentTrack, bus: !!B.Sound.musicBus(), tracks: B.Sound.trackNames.includes('sbw_title') }; });
  check('title: the theme is waiting for the first touch (audio still locked, nothing playing)', t0.scene === 'TitleScene' && t0.tracks && t0.track === 'sbw_title' && !t0.bus, t0);
  await shot('keep-title-before-touch.png');
  await page.touchscreen.tap(110, 70); await page.waitForTimeout(1200);
  const t1 = await ev(() => { const B = window.BRADY, b = B.Sound.musicBus(); return { scene: B.Game.scene.constructor.name, track: B.Sound.currentTrack, state: b && b.ctx.state }; });
  check('title: the first touch starts the title theme and stays on the title', t1.scene === 'TitleScene' && t1.track === 'sbw_title' && t1.state === 'running', t1);
  await shot('keep-title-music.png');
  const cta = await ev(() => { const s = S(); return { x: s.cta.x + s.cta.w / 2, y: s.cta.y + s.cta.h / 2 }; });
  await page.touchscreen.tap(cta.x, cta.y); await page.waitForTimeout(2600);
  const t2 = await ev(() => { const B = window.BRADY, s = B.Game.scene; return { scene: (s.inner || s).constructor.name, track: B.Sound.currentTrack }; });
  check('title: TAP TO PLAY hands over to the story / map song', t2.scene !== 'TitleScene' && t2.track && t2.track !== 'sbw_title', t2);
  // a key works as the first input too (a fresh page; an arrow key, which only moves the title's focus)
  { const p2 = await context.newPage(); watch(p2); await p2.goto('file://' + app); await p2.waitForTimeout(2600);
    await p2.keyboard.press('ArrowRight'); await p2.waitForTimeout(800);
    const k = await p2.evaluate(() => { const B = window.BRADY, b = B.Sound.musicBus(); return { scene: B.Game.scene.constructor.name, track: B.Sound.currentTrack, state: b && b.ctx.state }; });
    check('title: a key press also starts the theme', k.track === 'sbw_title' && k.state === 'running', k); await p2.close(); }

  /* ---------- door ---------- */
  const d = await ev(() => {
    const g = start('3-5'), B = window.BRADY;
    const door = g.entities.find(e => e.kind === 'door' && e.target && g.level.areas[e.target.area].role === 'secret');
    g.player.collect('star'); sim(0.5);
    const r = { had: +g.player.star.toFixed(2) };
    g.enterPortal(door); sim(1.5);
    r.room = { role: g.area.role, star: +g.player.star.toFixed(2), track: B.Sound.currentTrack };
    return r;
  });
  await shot('keep-star-in-room.png');
  const d2 = await ev(() => {
    const g = S(), B = window.BRADY;
    const back = g.entities.find(e => e.kind === 'door' && e.target && e.target.area === 0);
    g.enterPortal(back); sim(1.5);
    const r = { area: g.area.idx, star: +g.player.star.toFixed(2), track: B.Sound.currentTrack };
    sim(8); r.after = { star: g.player.star, track: B.Sound.currentTrack };
    return r;
  });
  check('door: the star and its song survive going into the secret room', d.room.role === 'secret' && d.room.star > 0 && d.room.star < d.had && d.room.track === 'star', d);
  check('door: ...and coming back out of its door', d2.area === 0 && d2.star > 0 && d2.track === 'star', d2);
  check('door: when it wears off the level\'s own song comes back', d2.after.star === 0 && d2.after.track !== 'star', d2.after);

  /* ---------- coins ---------- */
  const c = await ev(() => {
    const B = window.BRADY; B.Save.reset(); B.Save.data.lives = 5;
    const r = {};
    start('1-1'); r.got1 = grab(80); r.l1 = S().picks;
    r.clear = clearLevel();
    const lives0 = B.Save.data.lives;
    start('1-2'); r.start2 = S().picks; r.got2 = grab(30); r.l2 = S().picks; r.lifeUp = B.Save.data.lives - lives0;
    S().openPause(); S().pauseUI.find(b => /MAP/.test(b.label)).fn();
    return r;
  });
  await page.waitForTimeout(2500);
  const c2 = await ev(() => { const B = window.BRADY; const r = { map: B.Game.scene.constructor.name, save: B.Save.data.picks }; start('2-1'); r.land2 = S().picks; return r; });
  check('coins: the next level starts with the last level\'s coins', c.got1 === 80 && c.l1 === 80 && c.clear === 'results' && c.start2 === 80, c);
  check('coins: past 100 the count keeps going (no roll-over to 00) and the 1UP still comes', c.l2 === 80 + c.got2 && c.l2 > 100 && c.lifeUp === 1, c);
  check('coins: kept through the map into another land', c2.land2 === c.l2 && c2.save === c.l2, c2);
  await shot('keep-coins-hud.png');
  await page.reload(); await page.waitForTimeout(2600); await ev(helpers);
  const c3 = await ev(() => { const B = window.BRADY; const r = { save: B.Save.data.picks, earned: B.Save.data.coinsEarned }; start('3-1'); r.level = S().picks; return r; });
  check('coins: kept after a reload (the app closed and opened again)', c3.save === c.l2 && c3.level === c.l2, c3);
  // an old save: coins but no 1UP counter; it keeps its coins and the 1UP still comes at the next hundred
  const c4 = await ev(() => {
    const B = window.BRADY; const raw = JSON.parse(localStorage.getItem(B.Save.key)); raw.picks = 40; delete raw.coinsEarned; localStorage.setItem(B.Save.key, JSON.stringify(raw)); B.Save.load();
    const lives0 = B.Save.data.lives; start('3-1'); const r = { start: S().picks }; for (let k = 0; k < 60; k++) S().addPick(); r.end = S().picks; r.lifeUp = B.Save.data.lives - lives0; return r;
  });
  check('coins: an old save keeps its coins; 60 more make 100 and a 1UP', c4.start === 40 && c4.end === 100 && c4.lifeUp === 1, c4);

  check('no page errors', errors.length === 0, errors.slice(0, 5));
  await browser.close();
  console.log(failures ? failures + ' FAILED' : 'all keep checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
