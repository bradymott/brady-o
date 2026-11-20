// Realistic Brady in custom flight poses and artwork interactions, using the live model over HTTP.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
(async () => {
  const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site'), out = path.resolve(process.argv[2] || 'shots/actions');
  fs.mkdirSync(out, { recursive: true });
  const server = http.createServer((req, res) => {
    const f = path.resolve(site, '.' + req.url.split('?')[0]);
    if (!f.startsWith(site + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
    res.setHeader('Content-Type', f.endsWith('.html') ? 'text/html' : 'application/octet-stream'); fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch(), errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 844, height: 390 } });
    await page.addInitScript(() => { window.requestAnimationFrame = () => 0; window.__burnsHideHUD = true; });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:' + server.address().port + '/burning-man/index.html');
    await page.waitForFunction(() => window.BRADY_BURNS?.BurnsSkinActor.ready, null, { polling: 100 });
    await page.evaluate(() => { const B = window.BRADY_BURNS; B.debug.play(14); const s = B.debug.scene(); s.load(); B.debug.skipCine(); });
    for (const name of (process.env.ONLY_ENDING ? [] : ['pilot', 'freefall', 'canopy', 'bbaClimb', 'bbaHang', 'bw14Climb', 'bw14Tumble', 'bw14Splat'])) {
      const result = await page.evaluate(name => {
        const B = window.BRADY_BURNS, G = window.BRADY.Game, s = B.debug.scene(), p = s.player, F = s.bw14.fly;
        p.vehicle = null; p.animOverride = null; p.ch.poseFn = null;
        Object.assign(F.dv, { x: 462, y: 200, z: 240, vx: 0, vy: 0, vz: 0, yaw: 0 });
        const I = { sx: 0, sy: 0, H: {}, HP: {}, locked: false };
        if (name === 'pilot') F.seatBrady(p);
        else if (name === 'freefall') { F.freeT = 2; F.stepFree(p, 1 / 60, I); }
        else if (name === 'canopy') { F.deployT = 0.1; F.stepDeploy(p, 1 / 60, I); }
        else p.ch.play(name, null, true);
        p.x = 462; p.y = 1.8; p.z = 240; p.yaw = 0;
        p.ch.update(0.15); s.camMode = 'normal'; s.camYaw = 0.8; s.camPitch = 0.15; s.snapCam = true;
        s.fade = 0; s.dayCardT = -1; s.banners = []; s.lastFrame = performance.now();
        G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx);
        const a = p.ch._skinActor;
        return { anim: p.ch.anim, active: !!a?.active, clip: a?._clip, finite: a && Array.from(a.S.palette).every(Number.isFinite), pitch: a?.S.pitch };
      }, name);
      console.log(name, JSON.stringify(result));
      const expected = { pilot: 'bw14Pilot', freefall: 'bw14Free', canopy: 'bw14Hang' }[name] || name;
      if (result.anim !== expected || !result.active || !result.finite) throw new Error(name + ' fell back or produced an invalid pose');
      await page.screenshot({ path: path.join(out, name + '.png') });
    }
    // Follow the actual final-boss defeat callback through the rescue, rising fire,
    // collapse and epilogue. Only the fight is skipped; the ending advances normally.
    await page.evaluate(() => {
      const B = window.BRADY_BURNS; B.BurnsSave.addToken(10, 'saucer');
      B.BurnsSave.flag(10, 'intro', true); B.debug.play(10); const s = B.debug.scene(); s.load();
      const man = s.bosses.find(b => b.cfg && b.cfg.onDefeat); if (!man) throw new Error('Missing finale boss');
      man.cfg.onDefeat(s, man);
    });
    let burning = false, fullyLit = false, ended = false;
    for (let sec = 0; sec < 180 && !ended; sec++) {
      const state = await page.evaluate(() => {
        const G = window.BRADY.Game;
        for (let i = 0; i < 120; i++) { const s = G.scene; if (s.dialog) while (s.dialog.open) s.dialog.next(); if (s.state === 'results' && s.resultsT > 1.3) window.BRADY.Input.uiKey = 'enter'; s.update(1 / 120); window.BRADY.Input.uiKey = null; }
        const s = G.scene; s.dayCardT = -1; if (s.banners) s.banners = []; if (s.toasts) s.toasts = []; s.lastFrame = performance.now() - 33; G.ctx.setTransform(1, 0, 0, 1, 0, 0); s.draw(G.ctx);
        const man = s.bosses && s.bosses.find(b => b.model?.geo?.rainBurn);
        return { lookingAtMan: s.cam && Math.abs(s.cam.tx) < 5 && Math.abs(s.cam.tz) < 10, state: s.state, cine: s.cine?.i, scene: s.constructor.name, burn: man?.model.geo.rainBurn?.k || 0, beaten: window.BRADY_BURNS.BurnsSave.get().beaten };
      });
      if (sec % 30 === 0) console.log('ending', sec, JSON.stringify(state));
      if (!burning && state.burn > 0.2) { burning = true; await page.screenshot({ path: path.join(out, 'burn-rising.png') }); }
      if (!fullyLit && state.burn >= 0.99 && state.lookingAtMan) { fullyLit = true; await page.screenshot({ path: path.join(out, 'burn-full.png') }); }
      ended = state.scene === 'BurnsW8910Epilogue' && state.beaten;
    }
    if (!burning || !fullyLit || !ended) throw new Error('Finale incomplete: ' + JSON.stringify({ burning, fullyLit, ended }));
    await page.screenshot({ path: path.join(out, 'epilogue.png') });
    console.log('PASS: rescue, rising fire, full Burn, collapse and saved epilogue');
    if (errors.length) throw new Error(errors.join('\n'));
    if (!process.env.ONLY_ENDING) console.log('PASS: flight and artwork actions keep the realistic Brady');
  } finally { await browser.close(); await new Promise(r => server.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
