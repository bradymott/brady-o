// micro benchmark: cost of one Ink.around (Brady) in WebKit/Chromium, raster flushed
const pw = require('playwright'); const path = require('path'), http = require('http'), fs = require('fs');
const root = path.join(process.env.BRADY_DIST, 'site');
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => srv.listen(0, r));
  const eng = process.argv[2] || 'webkit';
  const b = await pw[eng].launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: eng !== 'firefox', hasTouch: true });
  const page = await ctx.newPage(); await page.goto('http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html'); await page.waitForTimeout(1500);
  const r = await page.evaluate(async (variants) => {
    const B = window.BRADY, G = B.Game, Ink = B.Ink;
    G.setScene(new B.Play(B.getLevel(1, 1), {})); await new Promise(r => setTimeout(r, 1500));
    const g = G.scene; G.frame = function () {}; await new Promise(r => setTimeout(r, 100));
    const c = G.ctx, p = g.player, S = G.S;
    const out = {};
    const run = (name, fn, n = 60) => { c.getImageData(0, 0, 1, 1); const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(i); c.getImageData(0, 0, 1, 1); } out[name] = +((performance.now() - t0) / n).toFixed(3); };
    c.setTransform(S, 0, 0, S, -g.camX * S, -g.camY * S);
    run('flushOnly', () => {});
    run('bradyDraw', i => { p.anim.t += 0.016; p.draw(c, g.t + i * 0.016); });
    const on = Ink.on; Ink.on = false; run('bradyNoInk', i => { p.anim.t += 0.016; p.draw(c, g.t + i * 0.016); }); Ink.on = on;
    Ink.form = false; run('bradyNoForm', i => { p.anim.t += 0.016; p.draw(c, g.t + i * 0.016); }); Ink.form = true;
    out.pool = Ink.pool.map(x => x.width + 'x' + x.height);
    // a large pool (after a boss)
    Ink.pool.forEach(x => { x.width = 1400; x.height = 1400; });
    run('bradyBigPool', i => { p.anim.t += 0.016; p.draw(c, g.t + i * 0.016); });
    out.pool2 = Ink.pool.map(x => x.width + 'x' + x.height);
    run('fullscreenFill', () => { c.save(); c.setTransform(1,0,0,1,0,0); c.fillStyle = 'rgba(10,20,30,0.16)'; c.fillRect(0, 0, G.canvas.width, G.canvas.height); c.restore(); });
    run('fullscreenBlit', () => { c.save(); c.setTransform(1,0,0,1,0,0); c.drawImage(G.vignette, 0, 0); c.restore(); });
    run('bloomRead', () => { c.save(); c.setTransform(1,0,0,1,0,0); const t = B.PostFX.ensure('bx', 280, 130).getContext('2d'); t.drawImage(G.canvas, 0, 0, 1688, 780, 0, 0, 280, 130); c.fillRect(0,0,2,2); c.restore(); });
    run('postfx', () => { c.save(); c.setTransform(1,0,0,1,0,0); B.PostFX.apply(c, g, 1688, 780, 0, 0); c.restore(); });
    run('bg', () => { c.save(); c.setTransform(1,0,0,1,0,0); B.BG.draw(c, g.themeKey, g.camX, g.camY, 0, G.viewW, G.viewH, S, g.t, 0, 0); c.restore(); });
    run('tiles', () => { c.save(); c.setTransform(1,0,0,1,0,0); g.drawTiles(c, g.camX, g.camY, false); c.restore(); });
    run('wholeFrame', () => { g.draw(c); });
    return out;
  });
  console.log(eng, JSON.stringify(r));
  await b.close(); srv.close();
})();
