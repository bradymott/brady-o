// Props-pass captures (copy of look_shots.js with the props-1 cameras). Look-dev captures: fixed cameras across worlds, times of day, tiers and orientations, for before/after comparison.
// BRADY_DIST=<dist> node tools/dev/look_shots.js <outDir> [filter-regex]
// Each shot: { n: name, w: world id, pal: [a, b, t] (optional), tp: [x, z] (optional), yaw: rad | 'sun' | 'anti' | +offset,
//              pitch, tier, o: 'L'|'P' (landscape 874x402 / portrait 402x874, both at DPR 2), sim: seconds to settle }
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), http = require('http');
const site = path.resolve(process.env.BRADY_DIST || 'dist', 'site'), out = path.resolve(process.argv[2] || 'shots/look');
const filt = process.argv[3] ? new RegExp(process.argv[3]) : null;
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const DUSK = ['dusk', 'night', 0], NIGHT = ['dusk', 'night', 1], DAY = ['day', 'dusk', 0], GOLD = ['day', 'dusk', 0.72];
const SHOTS = [
  // the props pass (props-1): the places players look most; addr = a BURNS_OW address, off = [along, side] metres
  { n: 'street-day', w: 500, pal: DAY, tp: [-40, 345], yaw: Math.PI / 2, pitch: 0.22 },
  { n: 'street-night', w: 500, pal: NIGHT, tp: [-40, 345], yaw: Math.PI / 2, pitch: 0.22 },
  { n: 'block-day', w: 500, pal: GOLD, addr: '4:30 & Carousel', yaw: 'street', pitch: 0.2 },
  { n: 'block-night', w: 500, pal: NIGHT, addr: '4:30 & Carousel', yaw: 'street', pitch: 0.2 },
  { n: 'center-day', w: 500, pal: DAY, addr: 'Center Camp', off: [14, 0], yaw: 'face', pitch: 0.2 },
  { n: 'center-night', w: 500, pal: NIGHT, addr: 'Center Camp', off: [14, 0], yaw: 'face', pitch: 0.2 },
  { n: 'w1-line', w: 1, yaw: null, pitch: 0.3 },
  { n: 'w1-line-night', w: 1, pal: NIGHT, yaw: null, pitch: 0.3 },
  { n: 'w17-root', w: 17, yaw: null, pitch: 0.3 },
  { n: 'w17-root-night', w: 17, pal: NIGHT, yaw: null, pitch: 0.3 },
  { n: 'esp-night', w: 500, pal: NIGHT, tp: [0, 322], yaw: Math.PI, pitch: 0.25 },
  { n: 'w11-party', w: 11, yaw: null, pitch: 0.3 },
  { n: 'w12-temple', w: 12, yaw: null, pitch: 0.3 },
  { n: 'carousel-snail', w: 500, pal: DAY, addr: '5:00 & Carousel', yaw: 'street', pitch: 0.22 }
];
function serve(root) { return new Promise(res => { const srv = http.createServer((req, rsp) => { let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); rsp.end(); return; } rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp); }); srv.listen(0, '127.0.0.1', () => res({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })); }); }
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const { srv, url } = await serve(site), browser = await chromium.launch({ args: process.env.LOOK_SW ? [] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
  const tiers = (process.env.LOOK_TIERS || 'medium').split(','), orients = (process.env.LOOK_O || 'L,P').split(',');
  const stats = [];
  for (const o of orients) {
    const vp = o === 'P' ? { width: 402, height: 874 } : { width: 874, height: 402 };
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => { window.requestAnimationFrame = fn => { window.__lookFrame = fn; return 1; }; window.__burnsHideHUD = true; try { localStorage.clear(); } catch (e) { /* */ } });
    const page = await ctx.newPage();
    page.on('pageerror', e => console.log('pageerror', e.message.slice(0, 300)));
    await page.goto(url + 'burning-man/');
    await page.waitForFunction(() => !!window.BRADY_BURNS, null, { polling: 100, timeout: 120000 });
    await page.evaluate(async () => {
      const B = window.BRADY_BURNS;
      await B.BurnsGLBProps.preload();
      await Promise.all(['brady', 'chinka'].map(n => B.BurnsSkin.preload('models/' + n + '.glb.gz')));
    });
    if (process.env.LOOK_EVAL) await page.evaluate('with (window.BRADY_BURNS) { ' + process.env.LOOK_EVAL + ' }');   // e.g. LOOK_EVAL='BURNS_LOOK.tracks = 0'
    for (const S of SHOTS) for (const tier of tiers) {
      const name = S.n + '-' + tier + '-' + o;
      if (filt && !filt.test(name)) continue;
      if (process.env.LOOK_PRE) S.pre = process.env.LOOK_PRE;
      const r = await page.evaluate(([S, tier]) => {
        const B = window.BRADY_BURNS, D = B.debug;
        let s = D.scene();
        if (!s || s.worldId !== S.w) { D.play(S.w, { fresh: true }); s = D.scene(); if (s.state === 'load') s.load(); D.skipCine(); }
        B.BurnsGL.configure(tier);
        if (S.pal) { s.palA = S.pal[0]; s.palB = S.pal[1]; s.tod = S.pal[2]; s.todTarget = null; if (B.BURNS_OW && B.BURNS_OW.state) B.BURNS_OW.state.palKey = S.pal.join('|'); }
        let faceYaw = null;
        if (S.addr && B.BURNS_OW) {
          const a = B.BURNS_OW.address(S.addr), r = Math.hypot(a[0], a[1]) || 1, ox = a[0] / r, oz = a[1] / r, off = S.off || [0, 0];
          // off[0]: metres toward the Man from the address (radially in), off[1]: along the street (clockwise)
          const x = a[0] - ox * off[0] - oz * off[1], z = a[1] - oz * off[0] + ox * off[1];
          D.teleport(x, z); faceYaw = Math.atan2(ox, oz);   // looking out, away from the Man
          if (S.yaw === 'face') S._yaw = faceYaw; else if (S.yaw === 'street') S._yaw = faceYaw + Math.PI / 2;
        } else if (S.tp) D.teleport(S.tp[0], S.tp[1]);
        for (let i = 0; i < 90; i++) s.update(1 / 30);   // let the city's tiles stream in
        if (S.pal) { s.palA = S.pal[0]; s.palB = S.pal[1]; s.tod = S.pal[2]; s.todTarget = null; }
        const env = B.BurnsEnv.build(s.palA, s.palB, s.tod, {}, s.time);
        const sd = env.sunDir, saz = Math.atan2(sd[0], sd[2]);
        const p = s.player;
        if (S.yaw === 'sun') s.camYaw = saz; else if (S.yaw === 'anti') s.camYaw = saz + Math.PI; else if (typeof S.yaw === 'number') s.camYaw = S.yaw; else if (S._yaw !== undefined) s.camYaw = S._yaw;
        if (S.yaw !== null && S.yaw !== undefined) p.yaw = s.camYaw;
        s.camPitch = S.pitch; s.snapCam = true; s.lastManual = s.time + 1e6; s.manualCam = true;
        s.q = 1;
        if (S.pre) new Function('s', 'B', S.pre)(s, B);   // LOOK_PRE: code run with the scene before drawing
        const draw = () => { s.fade = 0; s.dayCardT = -1; s.banners = []; if (s.dialog) s.dialog.open = false; window.BRADY.Game.ctx.setTransform(1, 0, 0, 1, 0, 0); s.q = 1; s.draw(window.BRADY.Game.ctx); };
        draw();
        // finish streaming the city's tiles around this camera (each draw only builds for a few ms), and let the
        // tiles' people join, so every run shoots the same finished scene
        if (s.tiles) for (let i = 0; i < 400 && (s.tiles.queue.length || s.tiles.job || s.tiles.people.length); i++) s.tiles.step(50);
        draw();
        const gl = B.BurnsGL.gl; gl.finish();
        const t0 = performance.now(); for (let i = 0; i < 3; i++) { draw(); } gl.finish();
        const ms = (performance.now() - t0) / 3;
        // GPU time per frame (EXT_disjoint_timer_query_webgl2), for real-GPU runs
        const tq = gl.getExtension('EXT_disjoint_timer_query_webgl2'); let gpu = -1;
        if (tq) { window.__lookQ = []; window.__lookDraw = draw; for (let i = 0; i < 30; i++) { const q = gl.createQuery(); gl.beginQuery(tq.TIME_ELAPSED_EXT, q); draw(); gl.endQuery(tq.TIME_ELAPSED_EXT); window.__lookQ.push(q); } }
        draw();
        return { draws: s.stats.draws, tris: Math.round(s.stats.tris), sh: s.stats.shDraws, ms: Math.round(ms * 10) / 10, gpu, tier: B.BurnsGL.tier, w: B.BurnsGL.canvas.width, h: B.BurnsGL.canvas.height, tod: s.tod, pal: s.palA + '>' + s.palB };
      }, [S, tier]);
      await page.waitForTimeout(400);
      r.gpu = await page.evaluate(async () => {
        const gl = window.BRADY_BURNS.BurnsGL.gl, Q = window.__lookQ || [], vals = [];
        for (let k = 0; k < 80 && vals.length < Q.length; k++) { for (const q of Q) if (!q.done && gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE)) { q.done = true; vals.push(gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); } if (vals.length < Q.length) await new Promise(r => setTimeout(r, 50)); }
        vals.sort((a, b) => a - b); window.__lookDraw && window.__lookDraw();
        return vals.length > 4 ? [Math.round(vals[0] * 100) / 100, Math.round(vals[Math.floor(vals.length / 2)] * 100) / 100] : -1;   // [min, median] ms
      });
      await page.screenshot({ path: path.join(out, name + '.png') });
      r.name = name; stats.push(r);
      console.log(JSON.stringify(r));
    }
    await ctx.close();
  }
  fs.writeFileSync(path.join(out, 'stats.json'), JSON.stringify(stats, null, 1));
  await browser.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
