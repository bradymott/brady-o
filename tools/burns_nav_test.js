// Navigation test (docs/BURNS_GUIDE.md §10.1): the guide arrow (pause toggle, bearing to the objective from two spots),
// the pause map page (Brady's marker and heading, the objective highlighted), RUN (faster than walking, latch, Shift),
// the "camera behind Brady" setting, the e-bike (faster than the bike, earned with the Juice Box quest, saved) and
// settings that survive a reload (and an old save without them).
//   node tools/burns_nav_test.js            (BRADY_DIST=<folder> for a private build)
// Serves dist/site over http (so the skinned Brady loads, as on the phone). Exits 1 on any failure or page error.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const dist = process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist');
const site = path.join(dist, 'site');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.glb': 'model/gltf-binary', '.gz': 'application/octet-stream' };
function serve(root) {
  return new Promise(res => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; }
      rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
    });
    srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' }));
  });
}
const fails = [];
const check = (ok, what, info) => { console.log((ok ? 'PASS ' : 'FAIL ') + what + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); if (!ok) fails.push(what); };

(async () => {
  const { srv, url } = await serve(site);
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); page.setDefaultTimeout(600000);
  const errs = [];
  page.on('pageerror', e => errs.push('PE ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/light pool/.test(m.text())) errs.push('console: ' + m.text().slice(0, 300)); });
  const boot = async (clear) => {
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsNav, null, { timeout: 120000 });
    await page.evaluate((clear) => { if (clear) localStorage.clear(); window.BRADY.Save.load(); window.requestAnimationFrame = () => 0; }, clear);
  };
  // n rendered frames of 4 simulation steps each (the flow test's stepping; no rAF)
  const run = (n, input) => page.evaluate(([n, input]) => {
    const G = window.BRADY.Game, I = window.BRADY.Input || window.Input;
    for (let k = 0; k < n; k++) { const s = G.scene; if (input && I) Object.assign(I, input); for (let i = 0; i < 4; i++) { s.update(1 / 120); if (i === 0 && I && I.endFrame) I.endFrame(); } /* like the game loop: one-shot presses last one step */ if (s.fade !== undefined && s.state === 'play') s.fade = 0; s.lastFrame = performance.now() - 33; G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx); }
    const s = G.scene; return { scene: s.constructor.name, state: s.state, world: s.worldId };
  }, [n, input || null]);
  const S = (fn, arg) => page.evaluate(fn, arg);
  const waitPlay = async () => { for (let i = 0; i < 300; i++) { const r = await run(1); if (r.state === 'play' && r.scene === 'BurnsPlayScene') return r; await page.waitForTimeout(100); } return run(1); };
  const settle = async () => { for (let i = 0; i < 40; i++) { await S(() => window.BRADY_BURNS.debug.skipCine()); await run(2); const c = await S(() => { const s = window.BRADY.Game.scene; return !!s.cine || s.dialog.open; }); if (!c) break; } };
  await boot(true);
  const hasInput = await S(() => !!(window.BRADY.Input || window.Input));
  if (!hasInput) { console.log('FAIL no Input global'); process.exit(1); }
  // the city, fresh save, with the yellow bike
  await S(() => window.BRADY_BURNS.debug.play(500));
  await waitPlay(); await settle();
  await S(() => { const s = window.BRADY.Game.scene; s.giveItem('bike', true); s.dayCardT = -1; s.banners.length = 0; });
  await run(3);

  /* ---- 1. the guide arrow: off by default, the pause toggle turns it on ---- */
  let r = await S(() => { const s = window.BRADY.Game.scene; return { setting: window.BRADY_BURNS.BurnsSave.get().settings.guide, guide: s.navGuide }; });
  check(r.setting === false && !r.guide, 'guide arrow off by default (no arrow)', r);
  r = await S(() => { const s = window.BRADY.Game.scene; s.openPause(); const b = s.pauseUI.find(b => /^GUIDE ARROW/.test(b.label)); const before = b && b.label; if (b) b.fn(); const after = (s.pauseUI.find(b => /^GUIDE ARROW/.test(b.label)) || {}).label; s.closePause(); return { before, after, setting: window.BRADY_BURNS.BurnsSave.get().settings.guide }; });
  check(r.before === 'GUIDE ARROW: OFF' && r.after === 'GUIDE ARROW: ON' && r.setting === true, 'pause menu GUIDE ARROW toggles on', r);
  await run(4);
  // two spots: the bearing must point at the target
  for (const spot of [[-150, 120, 0.3], [260, -180, 2.2]]) {
    await S((sp) => { const s = window.BRADY.Game.scene; s.player.teleport(sp[0], s.world.height(sp[0], sp[1]) + 0.05, sp[1], sp[2]); s.navTT = 0; }, spot);
    await run(4);
    r = await S(() => { const s = window.BRADY.Game.scene, p = s.player, G = s.navGuide, A = s.navArrow; if (!G) return null; const want = Math.atan2(G.x - p.x, G.z - p.z); const wrap = a => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI)); return { label: G.label, dist: Math.round(G.dist), err: Math.abs(wrap(G.yaw - want)), arrowErr: A ? Math.abs(wrap(Math.atan2(A.x - p.x, A.z - p.z) - want)) : 9, next: (window.BRADY_BURNS.BurnsOW.nextPlace() || {}).name, tx: Math.round(G.x), tz: Math.round(G.z) }; });
    check(r && r.err < 0.01 && r.arrowErr < 0.03 && r.label === String(r.next).toUpperCase(), `arrow points at the next story place from (${spot[0]}, ${spot[1]})`, r);
  }
  // a side quest takes over: Playa Paparazzi points at the nearest photo spot not yet taken
  r = await S(() => { const s = window.BRADY.Game.scene, M = s.missions; const m = M.get('owPhoto'); if (m.state === 'locked') m.state = 'available'; M.start('owPhoto', true); M.track('owPhoto'); s.navTT = 0; return M.state('owPhoto'); });
  await run(3);
  r = await S(() => { const s = window.BRADY.Game.scene, p = s.player, G = s.navGuide, Ph = window.BRADY_BURNS.BURNS_OW.state.photos; const d = Ph.map(q => Math.hypot(q.x - p.x, q.z - p.z)); const best = Ph[d.indexOf(Math.min(...d))]; return { label: G && G.label, at: G && [Math.round(G.x), Math.round(G.z)], want: [Math.round(best.x), Math.round(best.z)] }; });
  check(r.at && r.at[0] === r.want[0] && r.at[1] === r.want[1], 'the tracked quest wins: arrow at the nearest photo spot', r);
  // the HUD's old yellow story arrow stands down while the guide is on (one arrow)
  r = await S(() => { const B = window.BRADY_BURNS; let drawn = false; const ctx = { save() { drawn = true; }, restore() {}, translate() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, stroke() {} }; B.BurnsOW.drawHUD(ctx, window.BRADY.Game.scene, 874, 402, {}); return drawn; });
  check(r === false, 'the city\'s own yellow arrow is hidden while the guide is on');

  /* ---- 2. the pause map ---- */
  await S(() => { const s = window.BRADY.Game.scene; s.player.teleport(120, 0.1, 380, 1.1); s.navTT = 0; });
  await run(3);
  r = await S(() => { const s = window.BRADY.Game.scene; s.openPause(); const b = s.pauseUI.find(b => b.label === 'MAP'); if (b) b.fn(); return { tab: s.pauseTab, btns: s.pauseUI.map(b => b.label) }; });
  check(r.tab === 'citymap' && r.btns.includes('FAST TRAVEL'), 'MAP opens the city map page', r);
  await run(2);
  r = await S(() => { const s = window.BRADY.Game.scene, N = window.BRADY_BURNS.BurnsNav, C = s._cityMap, p = s.player; const V = N.mapView(s, C.M), q = V.P(p.x, p.z); const wrap = a => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI));
    const Ph = window.BRADY_BURNS.BURNS_OW.state.photos.map(t => V.P(t.x, t.z));
    return { dx: Math.abs(C.brady.x - q[0]), dy: Math.abs(C.brady.y - q[1]), rotErr: Math.abs(wrap(C.brady.rot - (Math.PI - p.yaw))), headingVec: [+Math.sin(C.brady.rot).toFixed(3), +(-Math.cos(C.brady.rot)).toFixed(3)], want: [+Math.sin(p.yaw).toFixed(3), +Math.cos(p.yaw).toFixed(3)], targets: C.targets.length, hitsPhoto: C.targets.some(t => Ph.some(ph => Math.hypot(ph[0] - t.x, ph[1] - t.y) < 1.5)), inMap: C.brady.x > C.M.x && C.brady.x < C.M.x + C.M.w && C.brady.y > C.M.y && C.brady.y < C.M.y + C.M.h }; });
  check(r.dx < 0.5 && r.dy < 0.5 && r.inMap, 'map: Brady\'s marker at his projected spot', r);
  check(r.rotErr < 0.01 && Math.abs(r.headingVec[0] - r.want[0]) < 0.01 && Math.abs(r.headingVec[1] - r.want[1]) < 0.01, 'map: the marker points the way Brady faces', r);
  check(r.targets >= 2 && r.hitsPhoto, 'map: the objective is highlighted', r);
  r = await S(() => { const s = window.BRADY.Game.scene; const z = s.pauseUI.find(b => b.label === 'ZOOM IN'); z.fn(); return { zoom: !!s.mapZoom }; });
  await run(1);
  r = await S(() => { const s = window.BRADY.Game.scene, C = s._cityMap; return { sc: C.sc, x: C.brady.x, y: C.brady.y, M: C.M }; });
  check(r.x > r.M.x && r.x < r.M.x + r.M.w && r.y > r.M.y && r.y < r.M.y + r.M.h, 'map zoom keeps Brady on the map', r);
  await S(() => { const s = window.BRADY.Game.scene; s.mapZoom = false; s.pauseTab = 'main'; s.closePause(); });

  /* ---- 3. RUN ---- */
  const speedTest = async (runOn) => {
    await S(() => { const s = window.BRADY.Game.scene; s.player.teleport(-60, 0.05, 150, Math.PI); s.camYaw = Math.PI; s.snapCam = true; s.runLatch = false; });
    await run(2);
    if (runOn) await S(() => { (window.BRADY.Input || window.Input).hudPressed.run = true; });
    await run(4, { up: true });
    const a = await S(() => { const p = window.BRADY.Game.scene.player; return [p.x, p.z]; });
    await run(45, { up: true });   // 1.5 s
    const b = await S(() => { const s = window.BRADY.Game.scene, p = s.player; return [p.x, p.z, p.ch.anim, !!s.runLatch, p.runK]; });
    await run(30, { up: false });
    const c = await S(() => !!window.BRADY.Game.scene.runLatch);
    return { v: +(Math.hypot(b[0] - a[0], b[1] - a[1]) / 1.5).toFixed(2), anim: b[2], latch: b[3], runK: b[4], latchAfterStop: c };
  };
  const walk = await speedTest(false), sprint = await speedTest(true);
  check(sprint.v > walk.v * 1.3 && sprint.latch && sprint.anim === 'run', 'RUN is faster than walking, with the run clip', { walk, sprint });
  check(sprint.latchAfterStop === false, 'RUN switches itself off when Brady stops', sprint);
  r = await S(() => { const I = window.BRADY.Input || window.Input; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ShiftLeft', key: 'Shift' })); const on = window.BRADY_BURNS.BurnsNav.shift, act = !!I.keys.action; window.dispatchEvent(new KeyboardEvent('keyup', { code: 'ShiftLeft', key: 'Shift' })); return { on, act, off: window.BRADY_BURNS.BurnsNav.shift }; });
  check(r.on && !r.act && !r.off, 'Shift runs (and is not ACTION) while playing', r);
  r = await S(() => { const s = window.BRADY.Game.scene, H = s.hudBtns, L = (window.BRADY.Input || window.Input).layout; const R = H.run; const others = [['jump', L.jump], ['action', L.action], ['cam', H.cam], ['view', H.view], ['bike', H.bike], ['stick', L.stickHome]]; return others.map(([n, b]) => [n, +(Math.hypot(b.x - R.x, b.y - R.y) - b.r - R.r).toFixed(1)]); });
  check(r.every(q => q[1] > 2), 'RUN button clear of the other controls (landscape)', r);

  /* ---- 4. camera behind Brady ---- */
  const camTest = async () => {
    await S(() => { const s = window.BRADY.Game.scene; s.player.teleport(-60, 0.05, 150, 0); s.camYaw = 0; s.snapCam = true; s.lastManual = -10; });
    await run(4);
    await S(() => { const s = window.BRADY.Game.scene; s.player.yaw = 2.0; });   // he turns to face 2 rad off the camera
    await run(60);   // 2 s standing
    const still = await S(() => { const s = window.BRADY.Game.scene, w = a => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI)); return +Math.abs(w(s.camYaw - s.player.yaw)).toFixed(3); });
    await run(45, { right: true });   // 1.5 s running off to the right of the camera (a turn), then he stops
    await run(45, { right: false });
    const afterRun = await S(() => { const s = window.BRADY.Game.scene, w = a => a - 2 * Math.PI * Math.floor((a + Math.PI) / (2 * Math.PI)); return +Math.abs(w(s.camYaw - s.player.yaw)).toFixed(3); });
    return { still, afterRun };
  };
  const camOff = await camTest();
  r = await S(() => { const s = window.BRADY.Game.scene; s.openPause(); s.pauseTab = 'settings'; s.buildPause(); const b = s.pauseUI.find(b => /^CAMERA BEHIND BRADY/.test(b.label)); const lab = b && b.label; if (b) b.fn(); const after = (s.pauseUI.find(b => /^CAMERA BEHIND BRADY/.test(b.label)) || {}).label; s.pauseTab = 'main'; s.closePause(); return { lab, after, set: window.BRADY_BURNS.BurnsSave.get().settings.follow }; });
  check(r.lab === 'CAMERA BEHIND BRADY: OFF' && r.after === 'CAMERA BEHIND BRADY: ON' && r.set === true, 'settings: CAMERA BEHIND BRADY toggles', r);
  const camOn = await camTest();
  check(camOn.still < 0.2 && camOff.still > 1.5, 'follow camera settles behind Brady after he turns (standing)', { camOff, camOn });
  check(camOn.afterRun < 0.25 && camOff.afterRun > 1.0, 'follow camera is behind him again after he runs off sideways and stops', { camOff, camOn });
  r = await S(() => { const s = window.BRADY.Game.scene; s.setCamMode('first', true); s.player.yaw = 1.0; return true; });
  await run(30);
  r = await S(() => { const s = window.BRADY.Game.scene, ok = Math.abs(s.player.yaw - s.camYaw) < 1e-6; s.setCamMode('normal', true); return ok; });
  check(r, 'first person is untouched by the follow camera (body follows the look, as before)');

  /* ---- 5. the e-bike: earned after World 8, faster than the yellow bike, city only ---- */
  const bikeSpeed = async () => {
    await S(() => { const s = window.BRADY.Game.scene, p = s.player; if (p.vehicle) p.vehicle.dismount(p); p.teleport(-140, 0.05, 60, Math.PI / 2); s.camYaw = Math.PI / 2; s.snapCam = true; });
    await run(6);
    await S(() => { (window.BRADY.Input || window.Input).hudPressed.bike = true; });
    await run(2);
    await run(150, { up: true });   // 5 s
    const v = await S(() => { const p = window.BRADY.Game.scene.player; return p.vehicle ? { speed: +p.vehicle.speed.toFixed(2), ebike: !!p.vehicle.ebike, max: p.vehicle.maxSpeed } : null; });
    await run(4, { up: false });
    await S(() => { const s = window.BRADY.Game.scene, p = s.player; if (p.vehicle) p.vehicle.dismount(p); });
    await run(20);
    return v;
  };
  const bike = await bikeSpeed();
  r = await S(() => { const s = window.BRADY.Game.scene, M = s.missions; return M.state('owEbike'); });
  check(r === 'locked', 'Juice Box stays locked before World 8', r);
  r = await S(() => { const s = window.BRADY.Game.scene, M = s.missions, B = window.BRADY_BURNS; B.BurnsSave.get().worldDone[8] = true; M.refresh(); const st = M.state('owEbike'); const v = s.actor('owVolta'); s.player.teleport(v.x + 1.5, s.world.height(v.x, v.z) + 0.05, v.z, 0); return { st, volta: !!v }; });
  check(r.st === 'available' && r.volta, 'after World 8: Volta offers Juice Box', r);
  await run(2);
  await S(() => { const s = window.BRADY.Game.scene; (window.BRADY.Input || window.Input).actionPressed = true; s.player.inp.actionPressed = true; });
  await run(2); await settle();
  r = await S(() => { const s = window.BRADY.Game.scene; s.navTT = 0; return { st: s.missions.state('owEbike'), bat: s.pack.has('ebattery') }; });
  await run(2);
  const ch = await S(() => { const s = window.BRADY.Game.scene, c = window.BRADY_BURNS.BurnsOW.ebikeCharger(); return { G: s.navGuide && [Math.round(s.navGuide.x), Math.round(s.navGuide.z), s.navGuide.label], c: [Math.round(c.x), Math.round(c.z)] }; });
  check(r.st === 'active' && r.bat && ch.G && ch.G[0] === ch.c[0] && ch.G[1] === ch.c[1], 'Juice Box started: battery in the pack, the arrow points at the charger', { r, ch });
  r = await S(() => { const s = window.BRADY.Game.scene, c = window.BRADY_BURNS.BurnsOW.ebikeCharger(); s.player.teleport(c.x, s.world.height(c.x, c.z + 2) + 0.05, c.z + 2, 0); s.tiles && s.tiles.prime(c.x, c.z, 60); return true; });
  await run(3);
  r = await S(() => { const s = window.BRADY.Game.scene; const it = s.interactTarget(); const lab = it && it.label; if (it && it.label === 'CHARGE') it.fn(s, it); return { lab, st: s.missions.state('owEbike'), item: window.BRADY_BURNS.BurnsSave.hasItem('ebike') }; });
  check(r.lab === 'CHARGE' && r.st === 'done' && r.item, 'charging at the solar camp earns the e-bike', r);
  await settle(); await run(4);
  const ebike = await bikeSpeed();
  check(bike && ebike && !bike.ebike && ebike.ebike && ebike.speed > bike.speed * 1.3, 'the e-bike is faster than the yellow bike', { bike, ebike });
  r = await S(() => { const s = window.BRADY.Game.scene; s.openPause(); s.pauseTab = 'settings'; s.buildPause(); const b = s.pauseUI.find(b => /^CITY BIKE/.test(b.label)); const lab = b && b.label; s.pauseTab = 'main'; s.closePause(); return lab; });
  check(r === 'CITY BIKE: E-BIKE', 'settings show CITY BIKE once the e-bike is earned', r);
  // draw calls: riding the e-bike costs the same single draw as the yellow bike
  const draws = async () => { await run(6); return S(() => window.BRADY.Game.scene.stats.draws); };
  await S(() => { const s = window.BRADY.Game.scene; s.player.teleport(-140, 0.05, 60, 0); s.camYaw = 0; s.snapCam = true; });
  await S(() => { const s = window.BRADY.Game.scene; window.BRADY_BURNS.BurnsSave.get().settings.ride = 'bike'; }); await run(2);
  await S(() => { (window.BRADY.Input || window.Input).hudPressed.bike = true; }); const dB = await draws();
  await S(() => { const s = window.BRADY.Game.scene, p = s.player; p.vehicle.dismount(p); window.BRADY_BURNS.BurnsSave.get().settings.ride = 'ebike'; }); await run(20);
  await S(() => { (window.BRADY.Input || window.Input).hudPressed.bike = true; }); const dE = await draws();
  const eRide = await S(() => { const p = window.BRADY.Game.scene.player; return !!(p.vehicle && p.vehicle.ebike); });
  check(eRide && dE <= dB + 1, 'e-bike draw calls within one of the yellow bike', { yellow: dB, ebike: dE });
  await S(() => { const s = window.BRADY.Game.scene, p = s.player; if (p.vehicle) p.vehicle.dismount(p); });

  /* ---- 6. persistence: reload, Continue, and an old save without the new settings ---- */
  await S(() => { window.BRADY.Save.save(); });
  await boot(false);
  r = await S(() => { const B = window.BRADY_BURNS, st = B.BurnsSave.get().settings; return { guide: st.guide, follow: st.follow, ride: st.ride, ebike: B.BurnsSave.hasItem('ebike'), w8: !!B.BurnsSave.get().worldDone[8], q: B.BurnsSave.get().missions['500:owEbike'] }; });
  check(r.guide === true && r.follow === true && r.ride === 'ebike' && r.ebike && r.w8 && r.q === 'done', 'settings and the e-bike survive a reload', r);
  await S(() => window.BRADY.Game.scene.toHub && window.BRADY.Game.scene.toHub());   // CONTINUE
  await waitPlay(); await settle(); await run(4);
  r = await S(() => { const s = window.BRADY.Game.scene; return { world: s.worldId, guide: !!s.navGuide, ebike: !!(s.bike && s.bike.ebike) }; });
  check(r.world === 500 && r.guide && r.ebike, 'after CONTINUE: guide arrow up, the BIKE button brings the e-bike', r);
  // an old save: strip the new settings, reload, nothing else lost
  await S(() => { const d = window.BRADY.Save.data.burns; delete d.settings.guide; delete d.settings.follow; delete d.settings.ride; window.BRADY.Save.save(); });
  await boot(false);
  r = await S(() => { const B = window.BRADY_BURNS, d = B.BurnsSave.get(); return { guide: d.settings.guide, follow: d.settings.follow, ride: d.settings.ride, ebike: B.BurnsSave.hasItem('ebike'), bike: B.BurnsSave.hasItem('bike'), w8: !!d.worldDone[8] }; });
  check(r.guide === false && r.follow === false && r.ride === 'ebike' && r.ebike && r.bike && r.w8, 'an old save without the new settings loads with defaults and keeps its progress', r);

  check(errs.length === 0, 'no page errors', errs.slice(0, 6));
  await browser.close(); srv.close();
  console.log(fails.length ? `\n${fails.length} FAILED: ${fails.join('; ')}` : '\nALL PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
