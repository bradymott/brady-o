// Motion verification for the realistic Brady: gait strips (walk 3 m/s, jog 7.6, RUN 10.6; behind + side) and the
// formerly-cartoon player states (double jump, pound, spin, bike, e-bike). Deterministic frames via Playwright's clock.
//   BRADY_DIST=<dist> node motion_shots.js <outDir> <tag> [strips|states|all]
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.join(path.resolve(process.env.BRADY_DIST), 'site'), out = path.resolve(process.argv[2]), tag = process.argv[3] || 'x', what = process.argv[4] || 'all';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const serve = root => new Promise(res => { const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site); const browser = await chromium.launch(); const errs = [], log = {};
  const boot = async (W, H, world, pre) => {
    const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA });
    const page = await ctx.newPage(); page.on('pageerror', e => errs.push(e.message.slice(0, 200)));
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkinActor && window.BRADY_BURNS.BurnsSkinActor.ready, null, { timeout: 420000 });
    await page.evaluate(([world, pre]) => { localStorage.clear(); if (pre) window.BRADY_BURNS.BurnsSave.addItem(pre); window.__burnsHideHUD = true; window.BRADY_BURNS.debug.play(world); }, [world, pre]);
    await page.waitForFunction(() => { const s = window.BRADY_BURNS.debug.scene(); return s && s.player && s.world && s.state !== 'load'; }, null, { timeout: 420000 });
    await page.waitForFunction(() => { const D = window.BRADY_BURNS.debug; D.skipCine(); const st = D.state(); return !st.cine && !st.dialog; }, null, { timeout: 420000, polling: 250 });
    await page.evaluate(() => {
      const D = window.BRADY_BURNS.debug, s = D.scene();
      s.palA = 'day'; s.palB = null; s.tod = 0; s.todTarget = null;
      // scripted stick: straight along +z (world), nothing else pressed
      s.__mz = 0; s.readInput = function () { const p = this.player; p.inp.mx = 0; p.inp.mz = this.__mz; p.inp.mag = Math.abs(this.__mz); p.inp.jump = false; p.inp.action = false; };
      const p = s.player; p.yaw = 0; D.sim(0.3);
    });
    await page.clock.install({ time: new Date('2026-01-01T00:00:00Z') }); await page.waitForTimeout(300); await page.clock.pauseAt(new Date('2026-01-01T01:00:00Z'));
    return { ctx, page };
  };
  const step = (page, ms) => page.clock.runFor(ms);
  const cam = (page, view) => page.evaluate(view => {
    const s = window.BRADY_BURNS.debug.scene(), p = s.player;
    s.camMode = 'normal'; s.camYaw = view === 'side' ? p.yaw + Math.PI / 2 : p.yaw; s.camPitch = view === 'side' ? 0.12 : 0.3; s.snapCam = true; s.lastManual = s.time;
  }, view);
  const active = page => page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(), p = s.player, a = p.ch._skinActor; return { anim: p.ch.anim, skinned: !!(a && a.active), clip: a && a._clip, hsp: +Math.hypot(p.vx, p.vz).toFixed(2) }; });
  if (what !== 'states') {
    const { ctx, page } = await boot(844, 390, 17);
    for (const [name, v, cyc] of [['walk3', 3.0, 1.33], ['jog', 7.6, 0.8], ['RUN', 10.6, 0.575]]) {
      for (const view of ['behind', 'side']) {
        await page.evaluate(v => { const s = window.BRADY_BURNS.debug.scene(), p = s.player; Object.defineProperty(p, 'speedMul', { configurable: true, get: () => v / 7.6 }); s.__mz = 1; p.yaw = 0; }, v);
        for (let i = 0; i < 40; i++) { await cam(page, view); await step(page, 40); }
        const info = [];
        for (let f = 0; f < 10; f++) {
          await cam(page, view); await step(page, Math.round(cyc * 1000 / 10));
          await cam(page, view); await step(page, 1);
          await page.screenshot({ path: path.join(out, `${tag}_${name}_${view}_${f}.png`) }); info.push(await active(page));
        }
        log[`${name}_${view}`] = info[0];
        await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); s.__mz = 0; window.BRADY_BURNS.debug.teleport(s.player.x, s.player.z - 60); });
        await step(page, 300);
      }
    }
    await ctx.close();
  }
  if (what !== 'strips') {
    for (const [W, H] of [[844, 390], [390, 844]]) {
      const { ctx, page } = await boot(W, H, 500, 'ebike');
      const shot = async n => { await cam(page, 'quarter'); await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(); s.camYaw = s.player.yaw + 0.7; s.camPitch = 0.2; s.snapCam = true; }); await step(page, 1); await page.screenshot({ path: path.join(out, `${tag}_${n}_${W}x${H}.png`) }); log[`${n}_${W}`] = await active(page); };
      // double jump (flip)
      await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(), p = s.player; p.grounded = false; p.vy = 10.2; p.jumps = 2; p.ch.play('flip', null, true); });
      await step(page, 120); await shot('doublejump_a'); await step(page, 120); await shot('doublejump_b');
      await step(page, 1500);
      // spin attack
      await page.evaluate(() => { const p = window.BRADY_BURNS.debug.scene().player; p.spinT = 0.45; p.spinId = (p.spinId || 0) + 1; });
      await step(page, 90); await shot('spin_a'); await step(page, 140); await shot('spin_b');
      await step(page, 800);
      // ground pound: up in the air, tuck, then slam
      await page.evaluate(() => { const D = window.BRADY_BURNS.debug, p = D.scene().player; D.teleport(p.x, p.z, p.y + 3.5); p.grounded = false; p.vy = 0; p.pound = 1; p.poundT = 0.2; });
      await step(page, 100); await shot('pound_a'); await step(page, 140); await shot('pound_b');
      await step(page, 1200);
      // bike (the city's BIKE button summons the e-bike when the item is owned; the yellow bike otherwise)
      for (const kind of ['ebike', 'bike']) {
        await page.evaluate(kind => { const s = window.BRADY_BURNS.debug.scene(); s.settingsRide = kind; const sv = window.BRADY_BURNS.BurnsSave.get(); if (sv.settings) sv.settings.ride = kind; s.inp.bike = true; }, kind);
        await step(page, 400);
        await page.evaluate(() => { window.BRADY_BURNS.debug.scene().__mz = 1; }); await step(page, 1200);
        await shot(kind + '_ride');
        const v = await page.evaluate(() => { const s = window.BRADY_BURNS.debug.scene(), p = s.player; const r = { vehicle: !!p.vehicle, ebike: !!(p.vehicle && p.vehicle.ebike) }; s.__mz = 0; s.inp.bike = true; return r; });
        log[kind + '_vehicle_' + W] = v;
        await step(page, 600);
      }
      await ctx.close();
    }
  }
  await browser.close(); srv.close();
  fs.writeFileSync(path.join(out, tag + '_log.json'), JSON.stringify(log, null, 1));
  console.log(JSON.stringify(log)); console.log(errs.length ? 'ERRORS\n' + errs.slice(0, 8).join('\n') : 'no page errors');
})().catch(e => { console.error(e); process.exit(1); });
