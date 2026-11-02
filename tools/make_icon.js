// Renders the home-screen icons with the game's own art:
//   dist/icons/icon-180.png (Apple touch icon), icon-192.png, icon-512.png, icon-maskable-512.png
//   dist/icon.png + dist/icon.b64 (180px, embedded into the standalone page)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
(async () => {
  const browser = await chromium.launch();
  const page = await (await browser.newContext({ viewport: { width: 600, height: 600 }, deviceScaleFactor: 1 })).newPage();
  await page.goto('file://' + path.join(__dirname, '..', 'dist', 'brady-o.html'));
  await page.waitForTimeout(1500);
  const out = path.join(__dirname, '..', 'dist', 'icons');
  fs.mkdirSync(out, { recursive: true });
  const sizes = [['icon-180.png', 180, false], ['icon-192.png', 192, false], ['icon-512.png', 512, false], ['icon-maskable-512.png', 512, true]];
  for (const [name, N, mask] of sizes) {
    const b64 = await page.evaluate(([N, mask]) => {
      const c = document.createElement('canvas'); c.width = N; c.height = N;
      window.__iconScene(c.getContext('2d'), N, mask);
      return c.toDataURL('image/png').split(',')[1];
    }, [N, mask]);
    fs.writeFileSync(path.join(out, name), Buffer.from(b64, 'base64'));
    if (N === 180) {
      fs.writeFileSync(path.join(__dirname, '..', 'dist', 'icon.b64'), b64);
      fs.writeFileSync(path.join(__dirname, '..', 'dist', 'icon.png'), Buffer.from(b64, 'base64'));
    }
    console.log(name, Buffer.from(b64, 'base64').length, 'bytes');
  }
  await browser.close();
})();
