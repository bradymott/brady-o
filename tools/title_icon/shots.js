// usage: node shots.js <outdir> <prefix> [times comma list] [--save] [--tap]
// captures the world app's title at 844x390@3x, 390x844@3x, 568x320@2x, frozen loop, deterministic steps.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const dist = path.resolve(process.env.BRADY_DIST);
const page0 = path.join(dist, 'site', 'super-brady-o-world', 'index.html');
const [out, prefix, timesArg] = process.argv.slice(2);
const times = (timesArg || '0.3,1,2.5').split(',').map(Number);
const withSave = process.argv.includes('--save'), tap = process.argv.includes('--tap'), calm = process.argv.includes('--calm');
const vps = (process.env.VPS || 'land,port,small').split(',');
const VP = { land: [844, 390, 3], port: [390, 844, 3], small: [568, 320, 2] };
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  for (const v of vps) {
    const [w, h, s] = VP[v];
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: s, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
    await page.goto('file://' + page0); await page.waitForTimeout(1500);
    await page.evaluate(([withSave, calm]) => {
      const B = window.BRADY, G = B.Game;
      G.frame = () => {};
      B.Save.data.settings.hq = true; B.Save.data.settings.reduceMotion = calm;
      if (withSave) { const T = window.BRADY_TOUR.TourProgress.data(); B.Save.data.seenTourIntro = true; for (const id of ['1-1','1-2','1-3','1-4','2-1','2-2']) B.Save.data.done[id] = true; T.cards = { mx: true, ec: true }; T.seen = { mx: true, ec: true }; B.Save.data.gold = { '1-1': [1,1,0], '1-2': [1,0,0] }; }
      G.slowT = -1e9; G.lowered = 0; G.dprCap = null; G.quality = 1; G.resize();
      G.setScene(new B.TitleScene());
      window.step = (sec) => { const n = Math.round(sec * 120); for (let k = 0; k < n; k++) { G.scene.update(1 / 120); if (k === 0) { B.Input.taps.length = 0; B.Input.uiKey = null; } } const c = G.ctx; c.setTransform(1,0,0,1,0,0); c.fillStyle = '#07040e'; c.fillRect(0,0,G.canvas.width,G.canvas.height); G.scene.draw(c); return G.scene.constructor.name; };
    }, [withSave, calm]);
    let tPrev = 0;
    for (const t of times) {
      if (tap && t < 0) { // negative = tap at that point
        await page.evaluate(() => { const B = window.BRADY; B.Input.taps.push({ x: B.Game.cssW / 2, y: B.Game.cssH * 0.8 }); });
        continue;
      }
      const name = await page.evaluate(d => window.step(d), Math.max(0, t - tPrev)); tPrev = t;
      await page.screenshot({ path: path.join(out, `${prefix}-${v}-${String(t.toFixed(2)).replace('.', '_')}.png`) });
      if (name !== 'TitleScene') console.log(v, t, 'scene', name);
    }
    if (errs.length) console.log(v, 'ERRORS', errs.slice(0, 5));
    await ctx.close();
  }
  await browser.close();
})();
