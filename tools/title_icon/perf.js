// node perf.js <dist> [label]   mean ms per title frame (update + draw) in headless Chromium; NOT an iPhone measurement
const { chromium } = require('playwright');
const path = require('path');
const dist = path.resolve(process.argv[2]);
(async () => {
  const b = await chromium.launch();
  for (const [w, h, s, hq] of [[844, 390, 3, true], [844, 390, 3, false], [390, 844, 3, false], [568, 320, 2, false]]) {
    const p = await (await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s, isMobile: true, hasTouch: true })).newPage();
    await p.goto('file://' + path.join(dist, 'site/super-brady-o-world/index.html')); await p.waitForTimeout(1500);
    const r = await p.evaluate((hq) => {
      const B = window.BRADY, G = B.Game; G.frame = () => {};
      B.Save.data.settings.hq = hq; G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize();
      const t0 = performance.now(); G.setScene(new B.TitleScene()); const build = performance.now() - t0;
      const ctx = G.ctx, frame = () => { G.scene.update(1 / 120); G.scene.update(1 / 120); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#07040e'; ctx.fillRect(0, 0, G.canvas.width, G.canvas.height); G.scene.draw(ctx); };
      for (let i = 0; i < 240; i++) frame();   // past the intro
      ctx.getImageData(0, 0, 1, 1);
      const ts = []; for (let i = 0; i < 600; i++) { const a = performance.now(); frame(); if (i % 10 === 9) ctx.getImageData(0, 0, 1, 1); ts.push(performance.now() - a); }
      ts.sort((a, b) => a - b);
      return { dpr: G.dpr, build: build.toFixed(1), mean: (ts.reduce((a, b) => a + b, 0) / ts.length).toFixed(2), p95: ts[Math.floor(ts.length * 0.95)].toFixed(2) };
    }, hq);
    console.log(process.argv[3] || '', `${w}x${h}@${s}`, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})();
