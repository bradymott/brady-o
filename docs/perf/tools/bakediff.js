const pw = require('playwright'); const path = require('path'), http = require('http'), fs = require('fs');
const root = path.join(process.env.BRADY_DIST, 'site');
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.webp') ? 'image/webp' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => srv.listen(0, r));
  const b = await pw[process.argv[2] || 'chromium'].launch(); const page = await (await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2 })).newPage();
  await page.goto('http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html'); await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const B = window.BRADY, G = B.Game, T = window.BRADY_TOUR.Tour; G.frame = function () {};
    const themes = new Set(); for (const id of T.allLevelIds()) { const [w, i] = id.split('-').map(Number); try { for (const a of B.getLevel(w, i).areas) themes.add(a.theme); } catch (e) {} }
    const need = []; for (const t of themes) { const th = B.THEMES[t]; if (th && th.atlas) need.push(th.atlas); for (const L of (th && th.layers) || []) if (L.atlas) need.push(L.atlas); }
    B.Atlas.keep(null); B.Atlas.need(need); await new Promise(r => setTimeout(r, 6000));
    const c = document.createElement('canvas'); c.width = 900; c.height = 390; const x = c.getContext('2d', { willReadFrequently: true });
    const out = [], bk = B.BG.bakeable;
    for (const t of themes) {
      const th = B.THEMES[t]; if (!th || !th.layers) continue; const veil = th.fog || th.sky[1];
      const draw = live => { B.BG.cache = {}; B.BG.bakeable = live ? () => false : bk; x.setTransform(1, 0, 0, 1, 0, 0); x.fillStyle = '#000'; x.fillRect(0, 0, 900, 390); const baked = B.BG.draw(x, t, 500, 100, 200, 450, 195, 2, 3.3, 0, 30, veil); if (!baked) { x.fillStyle = (() => { const h = veil.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(q => q + q).join('') : h, 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},0.16)`; })(); x.fillRect(0, 0, 900, 390); } return { d: x.getImageData(0, 0, 900, 390).data, baked }; };
      const a = draw(true), bb = draw(false);
      let n = 0, mx = 0; for (let k = 0; k < a.d.length; k += 4) { const d = Math.max(Math.abs(a.d[k] - bb.d[k]), Math.abs(a.d[k + 1] - bb.d[k + 1]), Math.abs(a.d[k + 2] - bb.d[k + 2])); if (d > 3) n++; if (d > mx) mx = d; }
      out.push([t, bb.baked, n, mx]);
    }
    B.BG.bakeable = bk; B.BG.cache = {};
    return out;
  });
  const bad = r.filter(q => q[2] > 900 * 390 * 0.002);
  console.log(r.length + ' themes, baked: ' + r.filter(q => q[1]).length + ', worst channel diff ' + Math.max(...r.map(q => q[3])) + ', themes with >0.2% px off by >3: ' + (bad.length ? bad.map(q => q.join(':')).join(' ') : 'none'));
  await b.close(); srv.close();
})();
