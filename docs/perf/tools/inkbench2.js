const pw = require('playwright'); const path = require('path'), http = require('http'), fs = require('fs');
const root = path.join(process.env.BRADY_DIST, 'site');
const srv = http.createServer((req, res) => { let p = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'Content-Type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.html') ? 'text/html' : 'application/octet-stream' }); fs.createReadStream(f).pipe(res); });
(async () => {
  await new Promise(r => srv.listen(0, r));
  const eng = process.argv[2] || 'webkit';
  const b = await pw[eng].launch(); const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); await page.goto('http://127.0.0.1:' + srv.address().port + '/super-brady-o-world/index.html'); await page.waitForTimeout(1500);
  const r = await page.evaluate(async () => {
    const B = window.BRADY, G = B.Game, Ink = B.Ink;
    G.setScene(new B.Play(B.getLevel(1, 1), {})); await new Promise(r => setTimeout(r, 1500));
    const g = G.scene; G.frame = function () {}; await new Promise(r => setTimeout(r, 100));
    const c = G.ctx, p = g.player, S = G.S, out = {};
    const run = (name, fn, n = 80) => { c.getImageData(0, 0, 1, 1); const t0 = performance.now(); for (let i = 0; i < n; i++) { fn(i); c.getImageData(0, 0, 1, 1); } out[name] = +((performance.now() - t0) / n).toFixed(3); };
    c.setTransform(S, 0, 0, S, -g.camX * S, -g.camY * S);
    const brady = i => { p.anim.t += 0.016; p.draw(c, g.t + i * 0.016); };
    const orig = Ink.canvas;
    run('A_current', brady);
    // B: per-size buckets: fresh canvases sized to the need (rounded up to 32)
    const pools = {};
    Ink.canvas = function (i, w, h) { const W = Math.ceil(w / 32) * 32, H = Math.ceil(h / 32) * 32, k = i + ':' + W + 'x' + H; let c = pools[k]; if (!c) { c = pools[k] = document.createElement('canvas'); c.width = W; c.height = H; } return c; };
    run('B_buckets', brady);
    // B2: fresh canvas every stage-call (no reuse at all)
    Ink.canvas = function (i, w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
    run('B2_fresh', brady);
    // B3: double-buffer by frame parity (a canvas is not written the frame right after it is read)
    let par = 0; const pools3 = {};
    Ink.canvas = function (i, w, h) { const W = Math.ceil(w / 32) * 32, H = Math.ceil(h / 32) * 32, k = i + ':' + W + 'x' + H + ':' + par; let c = pools3[k]; if (!c) { c = pools3[k] = document.createElement('canvas'); c.width = W; c.height = H; } return c; };
    run('B3_parity', i => { par = i & 1; brady(i); });
    Ink.canvas = orig;
    // pieces: just the colour pass painted into a scratch + one blit
    const sc = document.createElement('canvas'); sc.width = 288; sc.height = 288; const sx = sc.getContext('2d');
    run('C_paintOnly+blit', i => { sx.setTransform(1,0,0,1,0,0); sx.clearRect(0,0,288,288); const m = c.getTransform(); sx.setTransform(m.a,0,0,m.d, m.e - (p.x*S + m.e - 140), m.f - (p.y*S+m.f-140)); B.BRADY_DRAW ? 0 : 0; window.BRADY_DRAW(sx, { x: p.cx, y: p.y + p.h, facing: 1, small: false, power: 0, anim: p.anim, hair: p.hair, look: B.Save.data.look, time: i }); c.save(); c.setTransform(1,0,0,1,0,0); c.drawImage(sc, 300, 300); c.restore(); });
    run('C_24stamps', i => { c.save(); c.setTransform(1,0,0,1,0,0); for (let k = 0; k < 24; k++) c.drawImage(sc, 300 + Math.cos(k) * 3, 300 + Math.sin(k) * 3); c.restore(); });
    const c2 = document.createElement('canvas'); c2.width = 288; c2.height = 288; const x2 = c2.getContext('2d');
    run('C_24stamps_scratch+blit', i => { x2.clearRect(0,0,288,288); for (let k = 0; k < 24; k++) x2.drawImage(sc, Math.cos(k) * 3, Math.sin(k) * 3); c.save(); c.setTransform(1,0,0,1,0,0); c.drawImage(c2, 300, 300); c.restore(); });
    run('C_scratch_rw_alternate', i => { sx.fillStyle = 'rgba(1,2,3,0.1)'; sx.fillRect(0,0,10,10); x2.drawImage(sc, 0, 0); sx.fillRect(0,0,10,10); x2.drawImage(sc, 0, 0); sx.fillRect(0,0,10,10); x2.drawImage(sc, 0, 0); c.save(); c.setTransform(1,0,0,1,0,0); c.drawImage(c2, 300, 300); c.restore(); });
    return out;
  });
  console.log(eng, JSON.stringify(r));
  await b.close(); srv.close();
})();
