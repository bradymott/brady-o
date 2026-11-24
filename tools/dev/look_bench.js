// Interleaved GPU A/B timing on the real GPU (EXT_disjoint_timer_query_webgl2): frames alternate between variants,
// so load from other processes hits every variant alike. BRADY_DIST=<dist> node tools/dev/look_bench.js <world> <json shot> <json variants>
//   shot: { pal: [a,b,t], tp: [x,z], yaw, pitch, o: 'P'|'L', tier }   variants: { name: "js run inside with(BRADY_BURNS)" }
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site');
const world = +process.argv[2], S = JSON.parse(process.argv[3] || '{}'), V = JSON.parse(process.argv[4] || '{"base":"1"}');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
(async () => {
  const { srv, url } = await serve(site), browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  try {
    const vp = S.o === 'L' ? { width: 874, height: 402 } : { width: 402, height: 874 };
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.requestAnimationFrame = fn => 1; window.__burnsHideHUD = true; try { localStorage.clear(); } catch (e) { /* */ } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('pageerror', e.message.slice(0, 300)));
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => !!window.BRADY_BURNS, null, { polling: 100, timeout: 120000 });
    await page.evaluate(async ([world, S, V]) => {
      const B = window.BRADY_BURNS, D = B.debug;
      await B.BurnsGLBProps.preload();
      D.play(world, { fresh: true }); const s = D.scene(); if (s.state === 'load') s.load(); D.skipCine();
      B.BurnsGL.configure(S.tier || 'medium');
      if (S.tp) D.teleport(S.tp[0], S.tp[1]);
      for (let i = 0; i < 30; i++) s.update(1 / 30);
      if (S.pal) { s.palA = S.pal[0]; s.palB = S.pal[1]; s.tod = S.pal[2]; s.todTarget = null; }
      if (typeof S.yaw === 'number') { s.camYaw = S.yaw; s.player.yaw = S.yaw; }
      s.camPitch = S.pitch || 0.25; s.snapCam = true; s.lastManual = s.time + 1e6; s.manualCam = true;
      const draw = () => { s.fade = 0; s.dayCardT = -1; s.banners = []; window.BRADY.Game.ctx.setTransform(1, 0, 0, 1, 0, 0); s.q = 1; s.draw(window.BRADY.Game.ctx); };
      const fns = {}; for (const k in V) fns[k] = new Function('B', 'with (B) { ' + V[k] + ' }');
      const gl = B.BurnsGL.gl, tq = gl.getExtension('EXT_disjoint_timer_query_webgl2');
      window.__bench = { qs: [], keys: Object.keys(V) };
      for (const k in fns) { fns[k](B); draw(); draw(); }
      for (let r = 0; r < 40; r++) for (const k of window.__bench.keys) { fns[k](B); draw(); const q = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, q); draw(); gl.endQuery(tq.TIME_ELAPSED_EXT); window.__bench.qs.push([k, q]); }
    }, [world, S, V]);
    await page.waitForTimeout(800);
    const res = await page.evaluate(async () => {
      const gl = window.BRADY_BURNS.BurnsGL.gl, out = {};
      for (const [k, q] of window.__bench.qs) { let n = 0; while (!gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE) && n++ < 50) await new Promise(r => setTimeout(r, 20)); (out[k] = out[k] || []).push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); }
      const R = {}; for (const k in out) { const v = out[k].sort((a, b) => a - b); R[k] = { min: +v[0].toFixed(2), p25: +v[Math.floor(v.length * 0.25)].toFixed(2), med: +v[Math.floor(v.length / 2)].toFixed(2) }; }
      return R;
    });
    console.log(JSON.stringify(res));
  } finally { await browser.close(); srv.close(); }
})().catch(e => { console.error(e); process.exit(1); });
