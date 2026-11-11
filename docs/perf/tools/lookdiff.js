// deterministic before/after look check: the same level state (seeded, fixed-step simulated) drawn by two builds;
// usage: node lookdiff.js <distA> <distB> <outdir> <specs> [tierB] [engine]
//   spec: id | id@area:tileX:tileY | boss:id ; writes A/B screenshots at full resolution, a half-size montage
//   (A | B | difference x4) and prints the share of pixels that differ by more than 24 levels
const pw = require('playwright'); const path = require('path'), http = require('http'), fs = require('fs');
const [distA, distB, out, specs, tierB, eng] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const serve = root => new Promise(r => { const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); }); srv.listen(0, () => r(srv)); });
async function shoot(dist, tier, tag, browser) {
  const srv = await serve(path.join(path.resolve(dist), 'site'));
  const page = await (await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html'); await page.waitForTimeout(1500);
  const files = [];
  for (const spec of specs.split(',')) {
    await page.evaluate(async ({ spec, tier }) => {
      const B = window.BRADY, G = B.Game;
      let a = 12345; Math.random = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
      G.frame = function () {};
      G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; if (B.QualityTier) B.QualityTier.pin(tier || 0); G.resize();
      const boss = spec.startsWith('boss:'), id = boss ? spec.slice(5) : spec.split('@')[0], at = spec.includes('@') ? spec.split('@')[1].split(':').map(Number) : null;
      const [w, i] = id.split('-').map(Number); B.Save.data.lives = 9;
      const g = new B.Play(B.getLevel(w, i), {}); G.setScene(g);
      const sim = s => { for (let k = 0; k < Math.round(s * 120); k++) { try { g.update(1 / 120); } catch (e) {} } };
      // atlases in first (real time), then a fixed-step simulation
      for (let k = 0; k < 60 && Object.keys(B.Atlas.pending).length; k++) await new Promise(r => setTimeout(r, 100));
      g.state = 'play'; g.stateT = 0; g.fade.a = 0; g.fade.target = 0; g.player.hurt = () => {}; g.player.die = () => {};
      if (boss) { const k2 = g.level.areas.findIndex(ar => ar.role === 'arena' || ar.spawns.some(s => s.type === 'boss')); if (k2 >= 0 && g.area.idx !== k2) { const ar = g.level.areas[k2], an = (ar.anchors && (ar.anchors.in || ar.anchors.start)) || { x: 112, y: (ar.H - 4) * 32 }; g.loadArea(k2, an.x, an.y, 1); g.fade.a = 0; g.fade.target = 0; g.player.hurt = () => {}; g.player.die = () => {}; } }
      else if (at) { if (at[0] !== g.area.idx) { g.loadArea(at[0], at[1] * 32, at[2] * 32, 0); g.fade.a = 0; g.fade.target = 0; g.player.hurt = () => {}; g.player.die = () => {}; } const p = g.player; p.x = at[1] * 32; p.y = at[2] * 32 - p.h; g.camX = Math.max(0, p.cx - G.viewW * 0.4); g.camY = g.camTargetY(true); }
      for (let k = 0; k < 40 && Object.keys(B.Atlas.pending).length; k++) await new Promise(r => setTimeout(r, 100));
      if (boss) { const b = g.entities.find(e => e.boss); const p = g.player; if (b) { p.x = (b.arenaX0 || b.x - 200) + 80; p.y = (b.floorY || b.y + b.h) - p.h - 2; } sim(3.5); }
      else sim(1.5);
      g.shakeAmt = 0;
      for (let k = 0; k < 4; k++) { G.ctx.setTransform(1, 0, 0, 1, 0, 0); G.ctx.fillStyle = '#07040e'; G.ctx.fillRect(0, 0, G.canvas.width, G.canvas.height); g.draw(G.ctx); }
    }, { spec, tier: +tier || 0 });
    const f = path.join(out, spec.replace(/[:@]/g, '_') + '-' + tag + '.png');
    await page.screenshot({ path: f }); files.push(f);
  }
  await page.context().close(); srv.close();
  if (errs.length) console.log(tag + ' page errors: ' + errs.slice(0, 3).join(' | '));
  return files;
}
(async () => {
  const browser = await pw[eng || 'chromium'].launch();
  const fa = await shoot(distA, 0, 'A', browser), fb = await shoot(distB, tierB, 'B' + (tierB || '0'), browser);
  // montage + difference in a page
  const page = await browser.newPage();
  for (let k = 0; k < fa.length; k++) {
    const [a, b] = [fs.readFileSync(fa[k]).toString('base64'), fs.readFileSync(fb[k]).toString('base64')];
    const r = await page.evaluate(async ({ a, b }) => {
      const load = s => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + s; });
      const A = await load(a), Bm = await load(b), W = A.width, H = A.height;
      const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, W, H); x.drawImage(Bm, 0, 0); const db = x.getImageData(0, 0, W, H);
      const dd = x.createImageData(W, H); let n = 0;
      for (let i = 0; i < da.data.length; i += 4) { const d = Math.max(Math.abs(da.data[i] - db.data[i]), Math.abs(da.data[i + 1] - db.data[i + 1]), Math.abs(da.data[i + 2] - db.data[i + 2])); if (d > 24) n++; const v = Math.min(255, d * 4); dd.data[i] = v; dd.data[i + 1] = v; dd.data[i + 2] = v; dd.data[i + 3] = 255; }
      const m = document.createElement('canvas'); m.width = W / 2; m.height = H * 3 / 2; const mx = m.getContext('2d');
      mx.drawImage(A, 0, 0, W / 2, H / 2); mx.drawImage(Bm, 0, H / 2, W / 2, H / 2); x.putImageData(dd, 0, 0); mx.drawImage(c, 0, H, W / 2, H / 2);
      return { frac: n / (W * H), png: m.toDataURL('image/png').split(',')[1] };
    }, { a, b });
    const mf = fa[k].replace('-A.png', '-montage-B' + (tierB || '0') + '.png'); fs.writeFileSync(mf, Buffer.from(r.png, 'base64'));
    console.log(path.basename(fa[k]).replace('-A.png', '').padEnd(16), 'pixels differing by >24 levels: ' + (r.frac * 100).toFixed(2) + '%', mf);
  }
  await browser.close();
})();
