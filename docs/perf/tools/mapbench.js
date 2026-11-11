const pw = require('playwright'); const path = require('path'), http = require('http'), fs = require('fs');
(async () => {
  const out = {};
  for (const dist of process.argv.slice(2)) {
    const root = path.join(dist, 'site');
    const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.webp') ? 'image/webp' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
    await new Promise(r => srv.listen(0, r));
    const b = await pw.webkit.launch(); const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
    await page.goto('http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html'); await page.waitForTimeout(1500);
    out[dist] = await page.evaluate(async () => {
      const B = window.BRADY, G = B.Game, TT = window.BRADY_TOUR, C = TT.Tour.countries.mx;
      const m = new TT.TourMapScene({}); m.card = null; m.sel = 'mx'; m.ow = new TT.TourMapScene.Overworld(m, C, {}); m.ow.layoutView(); m.mode = 'land'; G.setScene(m); m.card = null;
      await new Promise(r => setTimeout(r, 2000)); G.frame = function () {};
      const c = G.ctx, run = (name, fn, n = 60) => { c.getImageData(0, 0, 1, 1); const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(i); c.getImageData(0, 0, 1, 1); } return +((performance.now() - t0) / n).toFixed(2); };
      const r = {};
      r.full = run('full', () => { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#07040e'; c.fillRect(0, 0, G.canvas.width, G.canvas.height); m.draw(c); });
      const o = B.Ink.on; B.Ink.on = false; r.noInk = run('noink', () => { c.setTransform(1, 0, 0, 1, 0, 0); m.draw(c); }); B.Ink.on = o;
      r.ow = run('ow', () => { c.setTransform(1, 0, 0, 1, 0, 0); m.ow.draw(c); });
      r.walker = run('walker', () => { c.setTransform(1, 0, 0, 1, 0, 0); m.ow.drawWalker(c); }, 200);
      r.walkerNoForm = (() => { B.Ink.form = false; const v = run('w2', () => { c.setTransform(1, 0, 0, 1, 0, 0); m.ow.drawWalker(c); }, 200); B.Ink.form = true; return v; })();
      r.walkerNoInk = (() => { B.Ink.on = false; const v = run('w3', () => { c.setTransform(1, 0, 0, 1, 0, 0); m.ow.drawWalker(c); }, 200); B.Ink.on = true; return v; })();
      const calls = []; const a0 = B.Ink.around; B.Ink.around = function (ctx, x, y, w, h, fn, o) { const mm = ctx.getTransform(); calls.push([w, h, o && o.pad, mm.a.toFixed(2), mm.b, mm.c]); return a0.apply(this, arguments); };
      m.draw(c); B.Ink.around = a0; r.calls = calls; r.scratch = B.Ink.scratch ? [...B.Ink.scratch.values()].map(q => q.width + 'x' + q.height) : B.Ink.pool.map(q => q.width + 'x' + q.height);
      return r;
    });
    await b.close(); srv.close();
  }
  console.log(JSON.stringify(out, null, 1));
})();
