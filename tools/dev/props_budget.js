// Where do the visible triangles go? For fixed city cameras, lists each instanced prototype's triangles per detail
// level, the copies drawn at each level and the triangles that adds up to, plus the static chunks' and crowds' share.
//   BRADY_DIST=<dist> node tools/dev/props_budget.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site');
const CAMS = [['rv-close', -59 + 9, 403, null], ['hexa-close', -60, 418, null], ['street', -40, 345, Math.PI / 2], ['carousel-5', null, null, null]];
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
(async () => {
  const { srv, url } = await serve(site), browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { window.requestAnimationFrame = fn => 1; window.__burnsHideHUD = true; try { localStorage.clear(); } catch (e) { /* */ } });
  const page = await ctx.newPage(); page.on('pageerror', e => console.log('pageerror', e.message));
  await page.goto(url + 'burning-man/'); await page.waitForFunction(() => !!window.BRADY_BURNS, null, { polling: 100 });
  await page.evaluate(async () => { const B = window.BRADY_BURNS; await B.BurnsGLBProps.preload(); });
  for (const [n, x, z, yaw] of CAMS) {
    const r = await page.evaluate(([x, z, yaw]) => {
      const B = window.BRADY_BURNS, D = B.debug; let s = D.scene();
      if (!s || s.worldId !== 500) { D.play(500, { fresh: true }); s = D.scene(); if (s.state === 'load') s.load(); D.skipCine(); }
      B.BurnsGL.configure('medium');
      let px = x, pz = z; if (px === null) { const a = B.BURNS_OW.address('5:00 & Carousel'); px = a[0]; pz = a[1]; }
      D.teleport(px, pz); for (let i = 0; i < 60; i++) s.update(1 / 30);
      if (s.tiles) for (let i = 0; i < 400 && (s.tiles.queue.length || s.tiles.job); i++) s.tiles.step(50);
      D.teleport(px, pz); if (yaw !== null) { s.camYaw = yaw; s.player.yaw = yaw; } s.camPitch = 0.2; s.snapCam = true; s.lastManual = s.time + 1e6; s.manualCam = true;
      const draw = () => { s.fade = 0; s.dayCardT = -1; window.BRADY.Game.ctx.setTransform(1, 0, 0, 1, 0, 0); s.q = 1; s.draw(window.BRADY.Game.ctx); };
      draw(); draw();
      const I = s.world.instancer(), per = {};
      for (const b of I.batches) { if (!b.n) continue; const id = [...I.protos.values()].find(P => P.levels.some(l => l.geo === b.geo)); const k = id ? id.id : '?'; const lv = id ? id.levels.findIndex(l => l.geo === b.geo) : -1; const t = b.geo.count / 3; per[k] = per[k] || { lv: [], tris: 0 }; per[k].lv[lv] = (per[k].lv[lv] || 0) + b.n; per[k].tris += t * b.n; }
      const protoTris = {}; for (const P of I.protos.values()) protoTris[P.id] = P.levels.map(l => l.geo.count / 3);
      const inst = Object.values(per).reduce((a, p) => a + p.tris, 0);
      return { total: s.stats.tris, draws: s.stats.draws, inst, per: Object.entries(per).sort((a, b) => b[1].tris - a[1].tris).map(([k, v]) => [k, Math.round(v.tris), v.lv.join('/'), protoTris[k].join('/')]) };
    }, [x, z, yaw]);
    console.log('== ' + n + ' total ' + r.total + ' draws ' + r.draws + ' instanced ' + Math.round(r.inst));
    for (const p of r.per) console.log('   ' + p.join('  '));
  }
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
