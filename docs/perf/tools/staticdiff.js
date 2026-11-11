// the held-picture paths (Ink.statics, opts.key) must give the same picture as inking live, for a still camera:
// render the same frame with them off and on (several frames, so pictures are made and then reused) and diff
const pw = require('playwright'); const path = require('path'), http = require('http'), fs = require('fs');
const root = path.join(process.env.BRADY_DIST, 'site');
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.webp') ? 'image/webp' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => srv.listen(0, r));
  const b = await pw[process.argv[3] || 'chromium'].launch(); const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html'); await page.waitForTimeout(1500);
  for (const spec of (process.argv[2] || '1-1,3-5,4-5,6-5').split(',')) {
    const r = await page.evaluate(async spec => {
      const B = window.BRADY, G = B.Game, Ink = B.Ink; const [id, sx] = spec.split('@'); const [w, i] = id.split('-').map(Number);
      const g = new B.Play(B.getLevel(w, i), {}); G.setScene(g); g.state = 'play'; g.fade.a = 0; g.fade.target = 0;
      await new Promise(r => setTimeout(r, 2500));
      const f0 = G.frame; G.frame = function () {};
      // the busiest spot: move along until several inked things are on screen
      let best = null, bestN = -1; const A = g.area;
      for (let x = 0; x < A.W * 32; x += 320) { g.camX = Math.min(x, A.W * 32 - G.viewW); let n = 0; const o = Ink.around; Ink.around = function () { n++; return o.apply(this, arguments); }; g.draw(G.ctx); Ink.around = o; if (n > bestN) { bestN = n; best = g.camX; } }
      g.camX = best; g.player.x = best + 100;
      const grab = () => { const c = G.canvas, x = c.getContext('2d'); return x.getImageData(0, 0, c.width, c.height).data; };
      Ink.statics = false; Ink.every = 1; for (let k = 0; k < 2; k++) g.draw(G.ctx); const a = grab();
      Ink.statics = true; for (let k = 0; k < 4; k++) g.draw(G.ctx); const bb = grab();
      let diff = 0, maxd = 0; for (let k = 0; k < a.length; k += 4) { const d = Math.abs(a[k] - bb[k]) + Math.abs(a[k + 1] - bb[k + 1]) + Math.abs(a[k + 2] - bb[k + 2]); if (d > 6) diff++; if (d > maxd) maxd = d; }
      G.frame = f0;
      return { spec, inked: bestN, diffPx: diff, maxd, heldPx: Ink.heldPx };
    }, spec);
    console.log(JSON.stringify(r));
  }
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 3).join(' | ') : 'no page errors');
  await b.close(); srv.close();
})();
