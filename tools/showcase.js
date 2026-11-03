// Renders a few showcase screenshots of the finished game.
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2];
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 874, height: 402 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
  await page.goto('file://' + path.join(process.env.BRADY_DIST ? path.resolve(process.env.BRADY_DIST) : path.join(__dirname, '..', 'dist'), 'brady-o.html'));
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(out, 'brady-o-title.png') });
  const shot = async (name, w, i, frac, extra) => {
    await page.evaluate(([w, i, frac, extra]) => {
      const B = window.BRADY;
      const g = new B.Play(B.getLevel(w, i), {}); B.Game.setScene(g);
      for (let k = 0; k < 240; k++) g.update(1 / 120);
      const p = g.player, A = g.area;
      if (extra === 'big') p.setPower(2, true);
      const tx = Math.floor(A.W * frac);
      for (let y = 4; y < A.H; y++) { const t = A.tiles[y * A.W + tx]; if (t === 1 || t === 5 || t === 11 || t === 7) { p.x = tx * 32; p.y = y * 32 - p.h; break; } }
      g.camX = Math.max(0, p.cx - B.Game.viewW * 0.42); g.camY = g.camTargetY(true);
      g.weather.reset(g.camX, g.camY, B.Game.viewW, B.Game.viewH);
      B.Input.right = true;
      for (let k = 0; k < 50; k++) g.update(1 / 120);
      B.Input.right = false;
    }, [w, i, frac, extra || '']);
    await page.waitForTimeout(150);
    await page.screenshot({ path: path.join(out, name) });
  };
  await shot('world-mexico-mercado.png', 1, 1, 0.3, 'big');
  await shot('world-mexico-xochimilco.png', 1, 2, 0.05, 'big');
  await shot('world-paris-boulevard.png', 7, 1, 0.3, 'big');
  await shot('world-paris-rooftops.png', 7, 3, 0.35, 'big');
  await browser.close();
})();
