// Story composition, skinned locomotion and the Man: a focused browser regression (served over http so the .glb
// models load). Build first; run: node tools/cinematic_test.js [output-directory]   (exits non-zero on failure)
//  - skinned walk/run follow the BurnsChar stride phase (distance; the clock when blocked: never frozen)
//  - dialogue framing: say-only lines frame the speaker's face above the dialogue box (landscape and portrait);
//    an authored camera (fov 0.32 here) is left exactly as written; never in first-person view; opt-out/opt-in work
//  - cutscene depth of field: the documented { dof: 'auto' } and authored apertures; god rays match gameplay
//  - the Man: shared rainbow neon model, triangle budget
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), http = require('http');
const out = path.resolve(process.argv[2] || 'shots/cinematic'), site = path.resolve(process.env.BRADY_DIST || 'dist', 'site');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp' };
(async () => {
  fs.mkdirSync(out, { recursive: true }); const errors = [], report = { errors };
  const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]), f = path.resolve(site, '.' + p + (p.endsWith('/') ? 'index.html' : '')); if (!f.startsWith(site + path.sep) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; } r.setHeader('Content-Type', MIME[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r); });
  await new Promise(r => srv.listen(0, '127.0.0.1', r)); const browser = await chromium.launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.requestAnimationFrame = f => 1; try { localStorage.clear(); } catch (e) {} });
    const p = await ctx.newPage(); p.on('pageerror', e => errors.push(e.message)); p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    await p.goto('http://127.0.0.1:' + srv.address().port + '/burning-man/');
    await p.waitForFunction(() => window.BRADY_BURNS && window.BRADY_BURNS.debug && window.BRADY_BURNS.BurnsSkin, null, { polling: 100, timeout: 120000 });
    // ---- skinned locomotion
    report.movement = await p.evaluate(async () => {
      const B = window.BRADY_BURNS, A = await B.BurnsSkin.preload('models/brady.glb.gz'), res = [];
      if (!A || !A.clips.walk || !A.clips.run) throw Error('brady.glb did not load (served over http?)');
      for (const clip of ['walk', 'run']) for (const fps of [30, 60, 120]) {
        const ch = new B.BurnsChar(B.BurnsRig.model(B.BurnsRig.bradySpec())), actor = new B.BurnsSkinActor('brady', A, false);
        ch.play(clip, { rate: 1 }, true); ch.update(0); actor.sync(ch);
        for (let i = 0; i < fps; i++) { ch.z += (clip === 'walk' ? 1.6 : 6) / fps; ch.update(1 / fps); actor.sync(ch); }
        const d = A.clips[clip].duration, want = ch._stridePhase * d;
        if (Math.abs(actor.S.animT - want) > 1e-6) throw Error('skinned ' + clip + ' not on the stride phase');
        const t0 = actor.S.animT; for (let i = 0; i < 10; i++) { ch.update(1 / 30); actor.sync(ch); }
        if (Math.abs(actor.S.animT - t0) < 1e-4) throw Error('skinned ' + clip + ' froze while blocked');
        res.push({ clip, fps, phase: +ch._stridePhase.toFixed(4) });
      }
      for (const asset of [A, await B.BurnsSkin.preload('models/chinka.glb.gz')]) for (const clip of asset.clipNames) { const c = new B.BurnsSkinnedChar(asset); c.play(clip, { fade: 0, restart: true }); for (const dt of [0.05, 0.25, 0.5]) { c.update(dt); c.compute(); if (!Array.from(c.palette).every(Number.isFinite)) throw Error('invalid rig ' + clip); } }
      if (A.clipNames.length !== 19) throw Error('brady clips: ' + A.clipNames.length);
      return res;
    });
    // ---- dialogue framing
    await p.evaluate(async () => {
      const B = window.BRADY_BURNS; await B.BurnsGLBProps.preload(); await B.BurnsSkinActor.preload();
      const sv = B.BurnsSave.get(); sv.seenIntro = true; sv.settings.gfx = 'medium';
      B.debug.play(17, { fresh: true }); const s = B.debug.scene(); if (s.state === 'load') s.load(); B.debug.skipCine(); s.update(1 / 60); B.debug.skipCine();
      s.fade = 0; s.dayCardT = -1; s.banners = [];
      window.__T = {
        frames(n) { const s = B.debug.scene(); for (let i = 0; i < (n || 40); i++) { s.update(1 / 60); s.dialog.chars = 999; s.fade = 0; s.lastFrame = performance.now() - 50; s.draw(window.BRADY.Game.ctx); } },
        story(steps, opts) { const s = B.debug.scene(); if (s.cine) s.cine.skip(); s.dlgK = 0; s.dlgCam = null; s.cutscene(steps, null, opts); s.lbK = 1; this.frames(50); return s; },
        face(a) { const s = B.debug.scene(), c = s.cam, h = (a.model.height || 1.8) * (a.scale || 1), o = {}; s.R.project(a.x, a.y + h * 0.92, a.z, 1, 1, o); const fx = Math.sin(a.yaw), fz = Math.cos(a.yaw), dx = c.x - a.x, dz = c.z - a.z, l = Math.hypot(dx, dz) || 1; return { head: o, front: (fx * dx + fz * dz) / l, dlgK: s.dlgK, fov: c.fov }; },
      };
    });
    report.framing = [];
    for (const [tag, w, h] of [['landscape', 874, 402], ['portrait', 402, 874]]) {
      await p.setViewportSize({ width: w, height: h }); await p.evaluate(() => window.BRADY.Game.resize());
      const r = await p.evaluate((tag) => {
        const B = window.BRADY_BURNS, T = window.__T, s = B.debug.scene(), a = s.actor('jefr');
        s.camMode = 'normal'; T.story([{ say: [a, ['Every root needs soil. You are with us now.', 'Second line.']] }]);
        const f = T.face(a), box = { y: s._dlgShot.boxY }, G = window.BRADY.Game;
        if (f.dlgK < 0.95) throw Error('say-only line not framed: dlgK ' + f.dlgK);
        if (f.front < 0.2) throw Error('framed from behind the speaker: ' + f.front);
        if (Math.abs(f.head.x - 0.5) > 0.3 || f.head.y < 0.06 || f.head.y > box.y / G.cssH) throw Error('speaker face outside the free frame ' + JSON.stringify(f.head));
        return Object.assign({ tag }, f);
      }, tag);
      await p.screenshot({ path: path.join(out, 'framed_' + tag + '.png'), timeout: 30000 }); report.framing.push(r);
    }
    await p.setViewportSize({ width: 874, height: 402 }); await p.evaluate(() => window.BRADY.Game.resize());
    report.rules = await p.evaluate(() => {
      const B = window.BRADY_BURNS, T = window.__T, s = B.debug.scene(), a = s.actor('jefr'), res = {};
      // an authored camera is untouched (telephoto fov kept, no reframing)
      const cam = { x: a.x + 6, y: a.y + 3, z: a.z + 6, tx: a.x, ty: a.y + 1.4, tz: a.z, fov: 0.32 };
      T.story([{ cam }, { say: [a, ['Authored shot.']] }]);
      for (const k of ['x', 'y', 'z', 'tx', 'ty', 'tz', 'fov']) if (Math.abs(s.cam[k] - cam[k]) > 1e-6) throw Error('authored camera changed: ' + k + ' ' + s.cam[k]);
      res.authored = { fov: s.cam.fov, dlgK: s.dlgK };
      // first person: no framing
      s.cine.skip(); s.camMode = 'first'; T.story([{ say: [a, ['First person.']] }]);
      if (s.dlgK > 1e-3) throw Error('framed in first-person view'); res.firstPerson = { dlgK: s.dlgK, fp: s.camMode };
      s.cine.skip(); s.camMode = 'normal';
      // opt-out per cutscene and opt-in over an authored camera
      T.story([{ say: [a, ['Opt out.']] }], { framing: false }); if (s.dlgK > 1e-3) throw Error('framing: false ignored'); res.optOut = s.dlgK;
      T.story([{ cam }, { say: [a, ['Forced.']], frame: true }]); if (s.dlgK < 0.95) throw Error('frame: true ignored'); res.forced = s.dlgK;
      s.cine.skip();
      // depth of field: an authored shot focuses by default ('auto'), apertures are kept, { dof: false } turns it off
      const env = B.BurnsEnv.build('day', null, 0, {}, 0);
      T.story([{ cam }, { wait: 30 }]); let fx = s.postFx(env); if (!fx.dof || Math.abs(fx.dof.aperture - 1.1) > 1e-9) throw Error('default story focus changed: ' + JSON.stringify(fx.dof));
      T.story([{ dof: { aperture: 2.5 } }, { cam }, { wait: 30 }]); fx = s.postFx(env); if (!fx.dof || fx.dof.aperture !== 2.5) throw Error('authored aperture lost');
      T.story([{ dof: false }, { dof: 'auto' }, { cam }, { wait: 30 }]); fx = s.postFx(env); if (!fx.dof) throw Error("{ dof: 'auto' } turned focus off");
      T.story([{ dof: false }, { cam }, { wait: 30 }]); fx = s.postFx(env); if (fx.dof) throw Error('{ dof: false } ignored');
      // god rays in a cutscene match gameplay (the world's env.rays, the renderer's default when unset)
      const e2 = Object.assign({}, env); delete e2.rays; fx = s.postFx(e2); if (fx.rays !== e2.rays) throw Error('cutscene god rays changed');
      s.cine.skip(); res.dof = 'ok';
      return res;
    });
    // ---- the Man
    report.man = await p.evaluate(() => {
      const B = window.BRADY_BURNS, m = new B.BurnsManBoss(B.debug.scene(), { x: 0, z: 0, holdChinka: false }).model, ch = new B.BurnsChar(m); ch.play('idle', {}, true); ch.update(0.1); ch.compute();
      if (!Array.from(ch.bones).every(Number.isFinite)) throw Error('invalid Man rig');
      if (!m.geo.rainbow) throw Error('the Man has no rainbow neon');
      const tris = m.geo.count / 3; if (tris > 12000) throw Error('Man over budget: ' + tris);
      return { tris, nb: m.nb, rainbow: m.geo.rainbow };
    });
    if (errors.length) throw Error(errors.join('\n'));
    console.log('PASS', JSON.stringify(report));
  } finally { fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)); await browser.close(); await new Promise(r => srv.close(r)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
