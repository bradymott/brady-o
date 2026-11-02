// Screenshot a set of levels a few seconds in (for visual review).
// usage: node tools/gallery.js outDir id1 id2 ...
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2];
const ids = process.argv.slice(3);
require('fs').mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.join(__dirname, '..', 'dist', 'brady-o.html'));
  await page.waitForTimeout(1200);
  for (const id of ids) {
    const [w, i, frac, area] = id.split(/[-@:]/).map(Number);
    await page.evaluate(([w, i, frac, area]) => {
      const B = window.BRADY;
      B.Save.data.lives = 5;
      const g = new B.Play(B.getLevel(w, i), {});
      B.Game.setScene(g);
      for (let k = 0; k < 240; k++) g.update(1 / 120);
      if (area) { const a = g.level.areas[area]; g.loadArea(area, a.entryX || 8 * 32, 11 * 32, 1); }
      const p = g.player;
      if (frac) {
        const A = g.area;
        if (A.tower) { p.y = (A.H * 32) * (1 - frac); p.x = A.W * 16; }
        else { const tx = Math.floor(A.W * frac); for (let y = 0; y < A.H; y++) { const t = A.tiles[y * A.W + tx]; if (t === 1 || t === 5 || t === 11) { p.x = tx * 32; p.y = y * 32 - p.h; break; } } }
        g.camX = Math.max(0, p.cx - B.Game.viewW * 0.42); g.camY = g.camTargetY(true);
        if (g.weather) g.weather.reset(g.camX, g.camY, B.Game.viewW, B.Game.viewH);
      }
      for (let k = 0; k < 60; k++) g.update(1 / 120);
    }, [w, i, frac || 0, area || 0]);
    await page.waitForTimeout(250);
    await page.screenshot({ path: path.join(out, `g-${id.replace(/[@:]/g, '_')}.png`) });
  }
  console.log('errors:', errs.join(' | ') || 'none');
  await browser.close();
})();
